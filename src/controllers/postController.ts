import { Request, Response } from "express";
import puppeteer from "puppeteer";
import path from "path";
import { API_URL } from "../enums/api";
import axiosInstance from "../../config/axios";
import postCache from "../../config/cacheConfig";
import Post, { PostDocumentInterface } from "../models/posts";
import { getQueryLimit, getQueryPageNumber } from "../utils/request";
import {
	NewPostsFilterFromRequest,
	PostsFilter,
	PostsSelection,
	SetPostFilterExcludeIds,
	SetPostFilterHashtags,
	UnsetPostFilterHashtags,
	calculateSkip,
	countPostsUsing,
	excludePostsWithExplicitHashtags,
	getPostsUsing,
	get_sorting_from_request,
	setSearchInRelatedFilter,
	// set_banned_user_ids,
	set_banned_user_ids,
} from "../service/post";
import { HttpStatusCode } from "axios";
import User from "../models/user";
import { HashtagDocumentInterface } from "../models/hashtags";
import { GetUserWithPreferences } from "../service/user";
import { BannedUserService } from "../service/banned_user";
import compromise from "compromise";

var shell = require("shelljs");

const ErrorFailedToGetPosts = {
	error: "Failed to get posts",
};

export const createPosts = async (req: Request, res: Response): Promise<void> => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "GET");

	const results = [];
	const NUM_TO_FETCH = 300;
	const MAX_POST_COUNT = 1000;
	const MOMENT_TIME = 10;

	try {
		const formData = { NumToFetch: NUM_TO_FETCH };
		const response = await axiosInstance.post(API_URL.PUBLIC_POST, formData);
		const postData = response.data;

		if (postData && postData.PostsFound && postData.PostsFound.length > 0) {
			const filteredPosts = postData.PostsFound.filter(
				(item: any) =>
					item.VideoURLs &&
					item.VideoURLs.some((videoURL: any) => videoURL)
			);

			const modifiedPost = filteredPosts.map((filteredItem: any) => {
				// Extract hashtags from the Body using a regular expression
				const hashtagMatches = filteredItem?.Body?.match(/#\w+/g);
				const hashtags = hashtagMatches ? hashtagMatches : [];

				return {
					Body: filteredItem.Body,
					CommentCount: filteredItem.CommentCount,
					LikeCount: filteredItem.LikeCount,
					GiftCount: filteredItem.DiamondCount,
					PostHashHex: filteredItem.PostHashHex,
					PublicKeyBase58Check: filteredItem.PosterPublicKeyBase58Check,
					Username: filteredItem.ProfileEntryResponse?.Username,
					VideoURL: filteredItem.VideoURLs[0],
					UserPublicKeyBase58Check:
						filteredItem.ProfileEntryResponse?.PublicKeyBase58Check,
					hashtags,
				};
			});

			const modifiedPostCount = modifiedPost.length;

			const browser = await puppeteer.launch({
				executablePath: process.env.CHROMIUM_PATH,
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
				userDataDir: "/dev/null",
			});

			for (let post of modifiedPost) {
				const existingPost = await Post.findOne({
					PostHashHex: post.PostHashHex,
				});
				if (existingPost) {
					continue;
				}

				const page = await browser.newPage();
				await page.goto(post.VideoURL, { waitUntil: "networkidle2" });

				try {
					const videoDuration = await page.evaluate(() => {
						const video = document.querySelector("video");
						if (!video) throw new Error("Video element not found");
						return video.duration; // Fetch video duration
					});

					const momentValue = videoDuration < MOMENT_TIME;
					let imageName: any = null;

					// Take the screenshot only if video duration is less than 20 seconds
					await page.evaluate(() => {
						const video = document.querySelector("video");
						if (!video) throw new Error("Video element not found");
						video.currentTime = 0;
						video.play();
					});

					await new Promise((resolve) => setTimeout(resolve, 1000));

					await page.evaluate(() => {
						const video = document.querySelector("video");
						if (!video) throw new Error("Video element not found");
						video.pause();
					});

					imageName = `${Date.now()}.png`;
					const imagePath = path.join(
						__dirname,
						"../../",
						"public",
						"images",
						imageName
					);
					await page.screenshot({ path: imagePath });

					if (!existingPost) {
						const postInfo: PostDocumentInterface = new Post({
							...post,
							screenshot: imageName ? `/images/${imageName}` : null,
							moment: momentValue,
						});
						await postInfo.save();
						results.push(postInfo);
					} else {
						console.error(
							`Post with PostHashHex ${post.PostHashHex} or screenshot ${imageName} already exists.`
						);
					}
				} catch (error) {
					console.error("Error processing video:", error);
				}
			}

			await browser.close();
			shell.exec("pkill chrome");

			// Retrieve current post count
			const currentPostCount = await Post.countDocuments({});

			// Remove oldest posts if necessary
			if (currentPostCount + modifiedPostCount > MAX_POST_COUNT) {
				const excessPostsCount =
					currentPostCount + modifiedPostCount - MAX_POST_COUNT;
				const oldestPosts = await Post.find({})
					.sort({ createdAt: 1 })
					.limit(excessPostsCount);
				const idsToDelete = oldestPosts.map((post) => post._id);
				await Post.deleteMany({ _id: { $in: idsToDelete } });
			}

			postCache.set("postsData", results);
		}

		if (results.length > 0) {
			res.status(201).json({
				message: `${results.length} new posts have been created.`,
				results,
			});
		} else {
			res.status(201).json({
				message: "No new videos found to create screenshots.",
			});
		}
	} catch (error: any) {
		if (error.response) {
			console.error("error.response.data", error.response.data);
			console.error("error.response.status", error.response.status);
			console.error("error.response.headers", error.response.headers);
		} else if (error.request) {
			console.error("error.request", error.request);
		} else {
			console.error("error.message", error.message);
		}
		res.status(500).json({ error: "Failed to create post" });
	}
};

type CacheResults = {
	key: string;
	results: GetPostsResponse;
};

const getCachedPosts = (cacheKey: string): CacheResults => {
	return {
		key: cacheKey,
		results: postCache.get(cacheKey) as GetPostsResponse,
	};
};

const getCachedKey = (
	filters: PostsFilter,
	hashtag: string | undefined,
	page: number,
	limit: number
): string => {
	const cacheKeyParts = [`postsData-page${page}`, `limit${limit}`];

	if (filters.moment !== undefined) {
		cacheKeyParts.push(`moment${filters.moment}`);
	}
	if (hashtag) {
		cacheKeyParts.push(`hashtag${hashtag}`);
	}
	return cacheKeyParts.join("-");
};

const setCachedPosts = (key: string, payload: GetPostsResponse) => {
	postCache.set(key, payload);
};

interface GetPostsResponse {
	totalPosts: number;
	totalPages: number;
	currentPage: number;
	posts: PostDocumentInterface[];
}

export const getPosts = async (req: Request, res: Response): Promise<Response> => {
	const page = getQueryPageNumber(req);
	const limit = getQueryLimit(req, 10);
	const userId = req.query.userId;

	let filters = NewPostsFilterFromRequest(req);
	const bannedUserIds = await BannedUserService.get_currently_banned_users();
	let hashtag = req.query.hashtag as string;
	const cacheKey = getCachedKey(filters, hashtag, page, limit);

	const usingSingularTag = hashtag !== undefined && req.query.hashtag !== "";
	const cached = getCachedPosts(cacheKey);

	if (cached.results) {
		const filteredPosts = cached.results.posts?.filter(
			(post: any) => !bannedUserIds.includes(post.UserPublicKeyBase58Check)
		);
		if (filteredPosts.length >= limit / 2) {
			return res.status(HttpStatusCode.Ok).json(cached.results);
		}
	}

	filters = set_banned_user_ids(filters, bannedUserIds);

	let results: PostDocumentInterface[] = [];
	const sortables = get_sorting_from_request(req);

	let selection: PostsSelection = {
		skip: calculateSkip(page, limit),
		limit: limit,
		sortables: sortables,
	};

	if (!usingSingularTag && userId) {
		const existingUser = await GetUserWithPreferences(userId as string);
		if (existingUser) {
			let mappedPreferences: string[] | undefined =
				existingUser.preferences.map(
					(pref: HashtagDocumentInterface) => "#" + pref.name
				);

			filters = SetPostFilterHashtags(filters, mappedPreferences);
		}
	}

	const relatedOf = req.query.related_of as string;

	if (relatedOf !== "") {
		filters = setSearchInRelatedFilter(filters, relatedOf);
	}

	let posts = await getPostsUsing(filters, selection);
	posts = excludePostsWithExplicitHashtags(posts);

	const postsCount = await countPostsUsing(filters);
	const postIds = posts.map((post: PostDocumentInterface) => post._id);

	if (postIds.length > 0) {
		filters = SetPostFilterExcludeIds(filters, postIds);
	}

	filters = UnsetPostFilterHashtags(filters);

	let totalPostsCount = postsCount;

	if (!usingSingularTag && !userId) {
		let nonPreferencePostsCount = await countPostsUsing(filters);
		totalPostsCount += nonPreferencePostsCount;
	}

	results = posts;

	const newLimit = limit - posts.length;

	if (newLimit > 0 && !usingSingularTag) {
		selection.limit = newLimit;

		const newPage = Math.floor(postsCount / limit);
		selection.skip = calculateSkip(newPage, newLimit);
		let nonPreferencePosts = await getPostsUsing(filters, selection);
		nonPreferencePosts = excludePostsWithExplicitHashtags(nonPreferencePosts);

		results = [...nonPreferencePosts];
	}

	try {
		const responsePayload = {
			totalPosts: totalPostsCount,
			totalPages: Math.ceil(totalPostsCount / limit),
			currentPage: page,
			posts: results,
		};

		setCachedPosts(cacheKey, responsePayload);

		return res.status(HttpStatusCode.Ok).json(responsePayload);
	} catch (error) {
		return res
			.status(HttpStatusCode.InternalServerError)
			.json(ErrorFailedToGetPosts);
	}
};

export const getPostSuggestions = async (req: Request, res: Response) => {
	const videoTitle = req.query.title;

	// Use compromise for more advanced tokenization and understanding of the title
	const mainVideoDoc = compromise(videoTitle as string);
	const mainVideoTokens = mainVideoDoc.out("array");

	// Use the tokenized title to find similar posts in the MongoDB collection

	const filters = {
		moment: false,
		UserPublicKeyBase58Check: {
			$nin: [
				"BC1YLijCcJXXpECa2TVPXp7GME8fguSkMkfpHEUPGaqp1gFwq1XRmYK",
				"hello",
				"BC1YLiweoh5Rsv6LaDAdQ1p2P3pDoGGVpQkpTqyxApcMxged7p9CWhi",
				"BC1YLiweoh5Rsv6LaDAdQ1p2P3pDoGGVpQkpTqyxApcMxged7p9CWhi",
				"BC1YLiweoh5Rsv6LaDAdQ1p2P3pDoGGVpQkpTqyxApcMxged7p9CWhi",
			],
		},
		$text: {
			$search: mainVideoTokens.join(" "),
		},

		_id: {
			$nin: [
				"652fc8cc361fe152517cf10e",
				"652fbf6c9265902569a1ac83",
				"6541769eea798259703baeaa",
				"653c9306f6b0f693c4bac5d7",
				"653b4ae6b0524c724c415099",
			],
		},
	};

	const relatedPosts = await Post.find(filters).limit(5);

	res.status(200).send({
		filters,
		relatedPosts,
	});
};
