import mongoose, { Schema } from 'mongoose';

export interface PlaylistDocumentInterface extends Document {
  name: string;
  userId: Schema.Types.ObjectId;
  postIds: Schema.Types.ObjectId[];
}

const PlaylistSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    postIds: [{ type: Schema.Types.ObjectId, ref: 'Post', required: false, }],
  },
  {
    timestamps: true,
    collection: 'playlists',
  }
);

export default mongoose.model<PlaylistDocumentInterface>('Playlist', PlaylistSchema);
