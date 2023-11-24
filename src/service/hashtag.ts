// if user id is given
// get the preference, get ids
// fetch preferences
// fetch the names
// select posts, sort by those. an added key : rank
// then select posts without those ids
// sort by createdAt -1
// append to that value
// keep adding to the rank

import { Types } from "mongoose";
import Hashtag, { HashtagDocumentInterface } from "../models/hashtags";
import { ExplicitEnglishWords } from "../filter/explicit";

export const getHashtagsByIds = async (
  ids: Types.ObjectId[]
): Promise<HashtagDocumentInterface[]> => {
  return await Hashtag.find({ _id: { $in: ids } });
};

export const GetSortedHashtags = async (limit: number = 1) => {
  const explicitList = ExplicitEnglishWords().map(
    (tag) => new RegExp(`^${tag}$`, "i")
  );
  return Hashtag.find({
    name: {
      $nin: explicitList,
    },
  })
    .sort({ postCount: 1 })
    .limit(limit);
};
