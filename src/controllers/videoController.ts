import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import Video, { IVideo } from '../models/videos';

export const createVideoInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;

    const existingVideo = await Video.findOne({ url });

    if (existingVideo) {
      res.status(409).json({ status: 409, error: 'Video with the same URL already exists' });
      return;
    }

    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle2' });

    // Play the video from the beginning.
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) {
        throw new Error('Video element not found');
      }
      video.currentTime = 0;
      video.play();
    }).catch((error) => {
      console.error('Error playing video:', error);
      throw error;
    });

    // Wait for 1 second to capture the frame at 1s mark.
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Pause the video after 1 second.
    await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) {
        throw new Error('Video element not found');
      }
      video.pause();
    }).catch((error) => {
      console.error('Error pausing video:', error);
      throw error;
    });

    // Take the screenshot at the 1-second mark.
    const imageName = `${Date.now()}.png`;
    const imagePath = path.join(__dirname, '../../', 'public', 'images', imageName);
    await page.screenshot({ path: imagePath });

    const videoInfo: IVideo = new Video({
      url,
      screenshot: `/images/${imageName}`,
    });

    await videoInfo.save();
    await browser.close();

    console.log("Video info saved to MongoDB.");
    res.status(201).json({ message: 'Video created', videoInfo });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: error ?? 'Failed to create video' });
  }
};

export const getVideoInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = req.params.url;

    // Find the video info in the database
    const videoInfo: IVideo | null = await Video.findOne({ url: new RegExp(videoId + '$', 'i') });

    // If the video info doesn't exist, send an error response
    if (!videoInfo) {
      res.status(404).json({ error: 'Video info not found' });
      return;
    }

    // If the video info exists, return it
    res.json({ duration: videoInfo.duration, screenshot: videoInfo.screenshot });
  } catch (error) {
    console.error('Error processing video:', error);
    res.status(500).json({ error: 'Failed to process video' });
  }
};

export const getAllVideos = async (req: Request, res: Response): Promise<void> => {
  try {
    const videos = await Video.find({});
    res.json(videos);
  } catch (error) {
    console.error('Error getting videos:', error);
    res.status(500).json({ error: 'Failed to get videos' });
  }
};

export const deleteVideoInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = req.params.id;
    const deletedVideo = await Video.findByIdAndRemove(videoId);

    if (!deletedVideo) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    res.json({ message: 'Video deleted', video: deletedVideo });
  } catch (error) {
    console.error('Error deleting video:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
};

