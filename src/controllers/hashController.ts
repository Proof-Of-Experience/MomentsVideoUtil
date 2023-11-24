import { Request, Response } from "express";
import Post from "../models/posts";
import hashtags from "../models/hashtags";
import { getQueryLimit } from "../utils/request";
import { HttpStatusCode } from "axios";
import { GetSortedHashtags } from "../service/hashtag";

export const getTopHashtags = async (
  req: Request,
  res: Response
): Promise<void> => {
  const MAX_LIMIT = 20;

  try {
    // Use the aggregation framework to group and count hashtags
    const hashtagCounts = await Post.aggregate([
      {
        $unwind: "$hashtags", // Split the hashtags array into individual documents
      },
      {
        $group: {
          _id: "$hashtags", // Group by hashtags
          count: { $sum: 1 }, // Count the occurrences of each hashtag
        },
      },
      {
        $sort: { count: -1 }, // Sort by count in descending order
      },
      {
        $limit: MAX_LIMIT, // Limit the results to the top 20 hashtags
      },
    ]);

    // Extract the hashtags and their counts
    const hashtags = hashtagCounts.map((entry: any) => ({
      hashtag: entry._id,
      count: entry.count,
    }));

    res.status(200).json(hashtags);
  } catch (error) {
    console.error("Error getting top hashtags:", error);
    res.status(500).json({ error: "Failed to get top hashtags" });
  }
};

export const getHashtags = async (
  req: Request,
  res: Response
): Promise<void> => {
  const limit = getQueryLimit(req);

  const sortedHashtags = await GetSortedHashtags(limit);

  res.status(HttpStatusCode.Ok).json(sortedHashtags);
};
