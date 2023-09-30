import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { API_URL } from '../enums/api';
import axiosInstance from '../../config/axios';
import postCache from '../../config/cacheConfig';
import Post, { IPost } from '../models/posts';


export const createPosts = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');

  const results = [];
  const NUM_TO_FETCH = 300;
  const MAX_POST_COUNT = 200;
  const MOMENT_TIME = 20;

  try {
    const formData = { NumToFetch: NUM_TO_FETCH };
    const response = await axiosInstance.post(API_URL.PUBLIC_POST, formData);
    const postData = response.data;

    if (postData && postData.PostsFound && postData.PostsFound.length > 0) {
      const filteredPosts = postData.PostsFound.filter((item: any) =>
        item.VideoURLs && item.VideoURLs.some((videoURL: any) => videoURL));

      const modifiedPost = filteredPosts.map((filteredItem: any) => {
        // Extract hashtags from the Body using a regular expression
        const hashtagMatches = filteredItem?.Body?.match(/#\w+/g);
        const hashtags = hashtagMatches ? hashtagMatches : [];

        return {
          Body: filteredItem.Body,
          CommentCount: filteredItem.CommentCount,
          LikeCount: filteredItem.LikeCount,
          PostHashHex: filteredItem.PostHashHex,
          PublicKeyBase58Check: filteredItem.ProfileEntryResponse?.PublicKeyBase58Check,
          Username: filteredItem.ProfileEntryResponse?.Username,
          VideoURL: filteredItem.VideoURLs[0],
          hashtags
        }
      });

      const modifiedPostCount = modifiedPost.length;

      const browser = await puppeteer.launch({
        executablePath: process.env.CHROMIUM_PATH,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      for (let post of modifiedPost) {
        const existingPost = await Post.findOne({ PostHashHex: post.PostHashHex });
        if (existingPost) {
          console.log(`Post with PostHashHex ${post.PostHashHex} already exists.`);
          continue;
        }

        const page = await browser.newPage();
        await page.goto(post.VideoURL, { waitUntil: 'networkidle2' });

        try {
          const videoDuration = await page.evaluate(() => {
            const video = document.querySelector('video');
            if (!video) throw new Error('Video element not found');
            return video.duration; // Fetch video duration
          });

          const momentValue = videoDuration < MOMENT_TIME;
          let imageName: any = null

          if (momentValue) {
            // Take the screenshot only if video duration is less than 20 seconds
            await page.evaluate(() => {
              const video = document.querySelector('video');
              if (!video) throw new Error('Video element not found');
              video.currentTime = 0;
              video.play();
            });

            await new Promise(resolve => setTimeout(resolve, 1000));

            await page.evaluate(() => {
              const video = document.querySelector('video');
              if (!video) throw new Error('Video element not found');
              video.pause();
            });

            imageName = `${Date.now()}.png`;
            const imagePath = path.join(__dirname, '../../', 'public', 'images', imageName);
            await page.screenshot({ path: imagePath });
          }

          if (!existingPost) {
            const postInfo: IPost = new Post({ ...post, screenshot: imageName ? `/images/${imageName}` : null, moment: momentValue });
            await postInfo.save();
            results.push(postInfo);
          } else {
            console.log(`Post with PostHashHex ${post.PostHashHex} or screenshot ${imageName} already exists.`);
          }

        } catch (error) {
          console.error('Error processing video:', error);
        }
      }

      await browser.close();

      // Retrieve current post count
      const currentPostCount = await Post.countDocuments({});

      // Remove oldest posts if necessary
      if (currentPostCount + modifiedPostCount > MAX_POST_COUNT) {
        const excessPostsCount = (currentPostCount + modifiedPostCount) - MAX_POST_COUNT;
        const oldestPosts = await Post.find({}).sort({ 'createdAt': 1 }).limit(excessPostsCount);
        const idsToDelete = oldestPosts.map(post => post._id);
        await Post.deleteMany({ _id: { $in: idsToDelete } });
      }

      postCache.set("postsData", results);
    }

    if (results.length > 0) {
      res.status(201).json({ message: `${results.length} new posts have been created.`, results });
    } else {
      res.status(201).json({ message: 'No new videos found to create screenshots.' });
    }
  } catch (error: any) {
    if (error.response) {
      console.error('error.response.data', error.response.data);
      console.error('error.response.status', error.response.status);
      console.error('error.response.headers', error.response.headers);
    } else if (error.request) {
      console.error('error.request', error.request);
    } else {
      console.error('error.message', error.message);
    }
    res.status(500).json({ error: 'Failed to create post' });
  }
};


export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  const page: number = Number(req.query.page) || 1;
  const limit: number = Number(req.query.limit) || 10;

  let filter: any = {};

  // Check for the 'moment' query parameter
  if (req.query.hasOwnProperty('moment')) {
    filter.moment = req.query.moment === 'true';
  }

  if (req.query.hashtag) {
    // Filter posts having the hashtag
    filter.hashtags = {
      $in: [req.query.hashtag],
      $exists: true,
      $not: { $size: 0 }
    };
  }

  // Construct cache key based on page, limit, moment filter, and hashtag filter
  const cacheKeyParts = [`postsData-page${page}`, `limit${limit}`];
  if (filter.moment !== undefined) {
    cacheKeyParts.push(`moment${filter.moment}`);
  }
  if (req.query.hashtag) {
    cacheKeyParts.push(`hashtag${req.query.hashtag}`);
  }
  const cacheKey = cacheKeyParts.join('-');

  const cachedPosts = postCache.get(cacheKey);
  if (cachedPosts) {
    console.log("Serving from cache");
    return res.status(200).json(cachedPosts);
  }

  try {
    const skip: number = (page - 1) * limit;
    const totalPosts: number = await Post.countDocuments(filter);
    const posts = await Post.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit);

    if (posts && posts.length > 0) {
      const responsePayload = {
        totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
        currentPage: page,
        posts
      };

      postCache.set(cacheKey, responsePayload);
      console.log("Serving from database and setting cache");

      return res.status(200).json(responsePayload);
    } else {
      return res.status(404).json({ message: "No posts found." });
    }
  } catch (error) {
    console.error('Error getting posts:', error);
    return res.status(500).json({ error: 'Failed to get posts' });
  }
};





