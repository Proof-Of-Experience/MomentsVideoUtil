import { Request, Response } from "express";
import { HttpStatusCode } from "axios";
import Playlist from "../models/playlist";
import User from "../models/user";

export const createPlaylist = async (
  req: Request,
  res: Response
): Promise<void> => {
  // @todo use auth user id
  const { name, userId, postIds } = req.body;

  if (!name) {
    res.status(HttpStatusCode.BadRequest).json({ message: "name is required" });
    return;
  }

  if (!userId) {
    res
      .status(HttpStatusCode.BadRequest)
      .json({ message: "userId is required" });
    return;
  }

  // Check if the user with the given userId exists
  const userExists = await User.exists({ _id: userId });

  if (!userExists) {
    res
      .status(HttpStatusCode.UnprocessableEntity)
      .json({ message: "user not found" });
    return;
  }

  try {
    const data = {
      name,
      userId,
      postIds: postIds || [],
    };

    const playlist = new Playlist(data);

    await playlist.save();

    res.status(HttpStatusCode.Created).json(playlist);
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError).json({
      message: "sorry something went wrong",
    });
  }
};


export const deletePlaylist = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { playlistId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      res
        .status(HttpStatusCode.BadRequest)
        .json({ message: "userId is required" });
      return;
    }

    const playlist = await Playlist.findById(playlistId);

    if (!playlist) {
      res
        .status(HttpStatusCode.NotFound)
        .json({ message: "playlist not found" });
      return;
    }

    if (playlist.userId.toString() !== userId) {
      res.status(HttpStatusCode.Unauthorized).json({ message: "unauthorized" });
      return;
    }

    await playlist.deleteOne()

    res.status(HttpStatusCode.Ok).json({
      message: "playlist deleted",
    });
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError).send({
      message: "sorry something went wrong",
    });
  }
};
export const updatePlaylist = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { playlistId } = req.params;
  const { name, userId, postIds } = req.body;

  if (!name) {
    res.status(HttpStatusCode.BadRequest).json({ message: "name is required" });
    return;
  }

  if (!userId) {
    res
      .status(HttpStatusCode.BadRequest)
      .json({ message: "userId is required" });
    return;
  }

  try {
    const existingPlaylist = await Playlist.findById(playlistId);

    if (!existingPlaylist) {
      res
        .status(HttpStatusCode.NotFound)
        .json({ message: "playlist not found" });
      return;
    }

    if (existingPlaylist.userId.toString() !== userId) {
      res.status(HttpStatusCode.Unauthorized).json({ message: "unauthorized" });
      return;
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
      playlistId,
      { name, postIds },
      { new: true }
    );

    res.json({
      message: "playlist updated successfully",
      playlist: updatedPlaylist,
    });
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError).json({
      message: "sorry something went wrong",
    });
  }
};

export const getAllPlaylistOfUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userId } = req.params;

  // Validate userId presence
  if (!userId) {
    res
      .status(HttpStatusCode.UnprocessableEntity)
      .json({ message: "userId parameter is required" });
    return;
  }

  try {
    const playlists = await Playlist.find({ userId }).populate("postIds");

    res.status(HttpStatusCode.Ok).json(playlists);
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError).json({
      message: "sorry something went wrong",
    });
  }
};

export const showPlaylist = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { playlistId } = req.params;

  try {
    const existingPlaylist = await Playlist.findById(playlistId).populate(
      "postIds"
    );

    if (!existingPlaylist) {
      res
        .status(HttpStatusCode.NotFound)
        .json({ message: "playlist not found" });
      return;
    }

    res.status(HttpStatusCode.Ok).json(existingPlaylist);
  } catch (error) {
    res.status(HttpStatusCode.InternalServerError).json({
      message: "sorry something went wrong",
    });
  }
};
