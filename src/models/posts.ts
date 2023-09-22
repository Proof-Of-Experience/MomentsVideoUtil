import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  PostHashHex: string;
  VideoURL: string;
  Username: string;
  Body: string;
  CommentCount: number;
  moment: boolean;
  // duration: number;
  screenshot: string;
}

const PostSchema: Schema = new Schema({
  PostHashHex: String,
  VideoURL: String,
  Username: String,
  Body: String,
  CommentCount: String,
  moment: Boolean,
  // duration: Number,
  screenshot: String,
}, {
  timestamps: true,
  collection: 'posts'
});

export default mongoose.model<IPost>('Post', PostSchema);
