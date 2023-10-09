import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  PostHashHex: string;
  VideoURL: string;
  hashtags: string[];
  Username: string;
  Body: string;
  CommentCount: number;
  moment: boolean;
  screenshot?: string;
}

const PostSchema: Schema = new Schema({
  PostHashHex: { type: String, required: true },
  VideoURL: String,
  hashtags: [String],
  Username: String,
  Body: String,
  CommentCount: Number,
  moment: Boolean,
  screenshot: String,
}, {
  timestamps: true,
  collection: 'posts'
});

export default mongoose.model<IPost>('Post', PostSchema);
