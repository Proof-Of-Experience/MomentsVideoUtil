import { Types } from "mongoose";
import Post, { PostDocumentInterface } from "../models/posts";
import { SortOrder } from "./db";
import { Request } from "express";
import { ExplicitEnglishWords } from "../filter/explicit";
import compromise from "compromise";

export interface PostsFilter {
	moment: boolean;
	hashtags?: {
		$in?: RegExp[];
	};
	Body?: {
		$not: any;
	};

	_id?: { $nin: Types.ObjectId[] };
	UserPublicKeyBase58Check?: { $nin: string[] };

	$text?: { $search: string };
}

export interface PostsSelection {
	skip: number;
	limit: number;
	sortables: {
		[key: string]: SortOrder;
	};
}

export const NewPostsFilter = (): PostsFilter => {
	return {
		moment: false,
		_id: { $nin: [] },
		hashtags: {
			$in: [],
		},
	};
};

export const SetPostFilterMoments = (
	filters: PostsFilter,
	moments: string | undefined
): PostsFilter => {
	filters.moment = moments === "true";

	return filters;
};

export const SetPostFilterExcludeIds = (
	filters: PostsFilter,
	ids: Types.ObjectId[]
): PostsFilter => {
	if (!filters._id) {
		filters._id = { $nin: ids };
	} else {
		filters._id.$nin = ids;
	}

	return filters;
};

export const SetPostFilterHashtags = (
	filters: PostsFilter,
	hashtags: string[] | undefined
): PostsFilter => {
	if (hashtags && hashtags.length > 0 && filters.hashtags) {
		filters.hashtags.$in = hashtags.map((tag) => new RegExp(`^${tag}$`, "i"));
	}

	return filters;
};

export const UnsetPostFilterHashtags = (filters: PostsFilter): PostsFilter => {
	delete filters.hashtags;

	return filters;
};

export const NewPostsFilterFromRequest = (req: Request): PostsFilter => {
	let filters = NewPostsFilter();

	filters = SetPostFilterMoments(filters, req.query.moment as string | undefined);

	let requestHashtag: string[] = [];

	if (req.query.hashtag && req.query.hashtag !== "") {
		requestHashtag = ["#" + req.query.hashtag];
	}
	filters = SetPostFilterHashtags(filters, requestHashtag);

	filters = stripUnnessaryFilters(filters);

	return filters;
};

const applyExplicitFilter = (filters: PostsFilter): PostsFilter => {
	const explicitRegex = new RegExp(
		ExplicitEnglishWords()
			.map((word) => `\\b${word}\\b`)
			.join("|"),
		"i"
	);

	filters.Body = {
		$not: explicitRegex,
	};

	return filters;
};

const stripUnnessaryFilters = (filters: PostsFilter): PostsFilter => {
	if (
		(filters.hashtags && !filters.hashtags.$in) ||
		(filters.hashtags && filters.hashtags.$in?.length == 0) ||
		filters.hashtags === undefined
	) {
		delete filters.hashtags;
	}

	if (
		(filters._id && filters._id.$nin.length === 0) ||
		filters._id === undefined
	) {
		delete filters._id;
	}

	if (filters.UserPublicKeyBase58Check?.$nin.length === 0) {
		delete filters.UserPublicKeyBase58Check;
	}

	if (
		!filters.$text ||
		!filters.$text?.$search ||
		filters?.$text?.$search === ""
	) {
		delete filters.$text;
	}

	return filters;
};

export const setSearchInRelatedFilter = (
	filters: PostsFilter,
	body: string
): PostsFilter => {
	const mainVideoDoc = compromise(body);
	const mainVideoTokens = mainVideoDoc.out("array");

	if (mainVideoTokens.length === 0) {
		return filters;
	}

	const tokensString = mainVideoTokens.join(" ");

	filters.$text = {
		$search: tokensString,
	};

	return filters;
};

export const unsetSearchInRelatedFilter = (filters: PostsFilter): PostsFilter => {
	delete filters.$text;

	return filters;
};

export const calculateSkip = (page: number, limit: number): number => {
	const skip = (page - 1) * limit;

	if (skip < 0) {
		return 0;
	}

	return skip;
};

export const set_banned_user_ids = (
	filters: PostsFilter,
	ids: string[]
): PostsFilter => {
	filters.UserPublicKeyBase58Check = { $nin: ids };

	return filters;
};

export const getPostsUsing = (
	filters: PostsFilter,
	selection: PostsSelection
): Promise<PostDocumentInterface[]> => {
	// filters = applyExplicitFilter(filters);

	console.log("filters", filters);

	return Post.find(filters)
		.sort(selection.sortables)
		.skip(selection.skip)
		.limit(selection.limit);
};

export const countPostsUsing = (filters: PostsFilter): Promise<number> => {
	return Post.countDocuments(filters);
};

export const excludePostsWithExplicitHashtags = (
	posts: PostDocumentInterface[]
): PostDocumentInterface[] => {
	const explicitWords = ExplicitEnglishWords();

	return posts.filter((post) => {
		// Check if any explicit word is present in the hashtags array
		const containsExplicitWord = explicitWords.some((word) =>
			post.hashtags.some((hashtag) =>
				hashtag.toLowerCase().includes(word.toLowerCase())
			)
		);

		// If the post contains an explicit word in hashtags, exclude it from the result
		return !containsExplicitWord;
	});
};

export enum PostSortOptions {
	MOST_LIKED = "most_liked",
	MOST_COMMENTED = "most_commented",
	LATEST = "latest", // Added a new option for sorting by the latest posts
}

export const get_sorting_from_request = (
	req: Request
): Record<string, SortOrder> => {
	const sort: PostSortOptions =
		(req.query.sort_by as PostSortOptions) || PostSortOptions.LATEST;

	return get_sorting(sort);
};

export const get_sorting = (sort_by: PostSortOptions): Record<string, SortOrder> => {
	let sort_query: Record<string, SortOrder> = {};

	// Set the sort query based on the provided option
	switch (sort_by) {
		case PostSortOptions.MOST_LIKED:
			sort_query = { LikeCount: -1 }; // Sort by LikeCount and then by createdAt in reverse order
			break;
		case PostSortOptions.MOST_COMMENTED:
			sort_query = { CommentCount: -1 }; // Sort by CommentCount and then by createdAt in reverse order
			break;
		case PostSortOptions.LATEST:
			sort_query = { createdAt: -1 }; // Sort by the latest posts based on createdAt in reverse order
			break;
		default:
			// Default to sorting by timestamp if the option is not recognized
			sort_query = { createdAt: -1 };
			break;
	}

	return sort_query;
};

export const getPostIdsFromPostHashHex = async (postIds: string[]) => {
	if (postIds.length === 0) {
		return [];
	}
	const posts = await Post.find({
		PostHashHex: {
			$in: postIds,
		},
	});

	let postObjectIds: any[] = [];

	posts.forEach((post: any) => {
		postObjectIds.push(post._id);
	});

	return postObjectIds;
};
