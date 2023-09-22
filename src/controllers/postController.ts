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
  const NumToFetch = 100;

  try {
    const formData = { NumToFetch };
    const response = await axiosInstance.post(API_URL.PUBLIC_POST, formData);
    const postData = response.data;

    if (postData && postData.PostsFound && postData.PostsFound.length > 0) {
      const filteredPosts = postData.PostsFound.filter((item: any) =>
        item.VideoURLs && item.VideoURLs.some((videoURL: any) => videoURL));

      const modifiedPost = filteredPosts.map((filteredItem: any) => ({
        PostHashHex: filteredItem.PostHashHex,
        VideoURL: filteredItem.VideoURLs[0],
        Username: filteredItem.ProfileEntryResponse?.Username,
        Body: filteredItem.Body,
        CommentCount: filteredItem.CommentCount,
      }));

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

          const imageName = `${Date.now()}.png`;
          const imagePath = path.join(__dirname, '../../', 'public', 'images', imageName);
          await page.screenshot({ path: imagePath });

          const postInfo: IPost = new Post({ ...post, screenshot: `/images/${imageName}` });
          await postInfo.save();
          results.push(postInfo);
        } catch (error) {
          console.error('Error processing video:', error);
        }
      }

      await browser.close();

      postCache.set("postsData", results);
    }

    if (results.length > 0) {
      res.status(201).json({ message: `${results.length} new posts have been created.`, results });
    } else {
      res.status(201).json({ message: 'No new videos found to create screenshots.' });
    }
  } catch (error: any) {
    if (error.response) {
      console.log('error.response.data', error.response.data);
      console.log('error.response.status', error.response.status);
      console.log('error.response.headers', error.response.headers);
    } else if (error.request) {
      console.log('error.request', error.request);
    } else {
      console.log('error.message', error.message);
    }
    res.status(500).json({ error: 'Failed to create post' });
  }
};


export const getPosts = async (req: Request, res: Response): Promise<Response> => {
  const cachedPosts = postCache.get("postsData");

  if (cachedPosts) {
    console.log("Serving from cache");
    return res.status(200).json(cachedPosts);
  }

  try {
    const posts = await Post.find({});
    if (posts) {
      postCache.set("postsData", posts);
      console.log("Serving from database and setting cache");
      return res.status(200).json(posts);
    } else {
      return res.status(404).json({ message: "No posts found." });
    }
  } catch (error) {
    console.error('Error getting posts:', error);
    return res.status(500).json({ error: 'Failed to get posts' });
  }
};



