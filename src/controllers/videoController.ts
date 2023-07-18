import { Request, Response } from 'express';
import puppeteer from 'puppeteer';
import Video, { IVideo } from '../models/videos';

export const createVideo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url, duration, screenshot } = req.body;

    const existingVideo = await Video.findOne({ url });

    if (existingVideo) {
      res.status(409).json({ error: 'Video with the same URL already exists' });
      return;
    }

    const videoInfo: IVideo = new Video({
      url: url,
      duration: duration,
      screenshot: screenshot
    });

    await videoInfo.save();
    console.log("Video info saved to MongoDB.");
    res.status(201).json({ message: 'Video created', videoInfo: videoInfo });
  } catch (error) {
    console.error('Error creating video:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
};

export const getVideoInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    // const url = 'https://lvpr.tv/?v=542dr3uvnpn4ds52';
    const url = decodeURIComponent(req.params.url);

    console.log('url', url);


    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, { waitUntil: 'networkidle2' });

    const videoDuration = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) {
        throw new Error('No video found');
      }
      video.play();
      return video.duration;
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const screenshotBuffer = await page.screenshot({ fullPage: true });
    const screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    await browser.close();

    const videoInfo: IVideo = new Video({
      url: url,
      duration: videoDuration,
      screenshot: screenshotBase64
    });

    await videoInfo.save();
    console.log("Video info saved to MongoDB.");

    res.json({ duration: videoDuration, screenshot: screenshotBase64 });
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

