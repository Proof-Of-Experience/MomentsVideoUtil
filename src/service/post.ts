import { Types } from "mongoose";
import Post, { PostDocumentInterface } from "../models/posts";
import { SortOrder } from "./db";
import { Request } from "express";
import { ExplicitEnglishWords } from "../filter/explicit";

export interface PostsFilter {
  moment: boolean;
  hashtags?: {
    $in: RegExp[];
    $nin: RegExp[];
  };

  _id?: { $nin: Types.ObjectId[] };
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
      $nin: [],
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

  filters = SetPostFilterMoments(
    filters,
    req.query.moment as string | undefined
  );

  let requestHashtag: string[] = [];

  if (req.query.hashtag && req.query.hashtag !== "") {
    requestHashtag = ["#" + req.query.hashtag];
  }
  filters = SetPostFilterHashtags(filters, requestHashtag);

  filters = stripUnnessaryFilters(filters);

  filters = applyExplicitFilter(filters);

  return filters;
};

const applyExplicitFilter = (filters: PostsFilter) : PostsFilter => {
  if (filters.hashtags) {
    filters.hashtags.$nin = ExplicitEnglishWords().map(
      (tag) => new RegExp(`^${tag}$`, "i")
    );
  }

  return filters;
};

const stripUnnessaryFilters = (filters: PostsFilter): PostsFilter => {
  if (
    (filters.hashtags && filters.hashtags.$in.length === 0) ||
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

  return filters;
};

export const calculateSkip = (page: number, limit: number): number => {
  const skip = (page - 1) * limit;

  if (skip < 0) {
    return 0;
  }

  return skip;
};

export const getPostsUsing = (
  filters: PostsFilter,
  selection: PostsSelection
): Promise<PostDocumentInterface[]> => {
  return Post.find(filters)
    .sort(selection.sortables)
    .skip(selection.skip)
    .limit(selection.limit);
};

export const countPostsUsing = (filters: PostsFilter): Promise<number> => {
  return Post.countDocuments(filters);
};
