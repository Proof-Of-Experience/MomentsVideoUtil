import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  Body: string;
  CommentCount: number;
  LikeCount: number;
  GiftCount: number;
  hashtags: string[];
  moment: boolean;
  PostHashHex: string;
  PublicKeyBase58Check: string;
  screenshot?: string;
  Username: string;
  VideoURL: string;
}

const PostSchema: Schema = new Schema({
  Body: String,
  CommentCount: Number,
  LikeCount: Number,
  GiftCount: Number,
  hashtags: [String],
  moment: Boolean,
  PostHashHex: { type: String, required: true },
  PublicKeyBase58Check: String,
  screenshot: String,
  Username: String,
  VideoURL: String,
}, {
  timestamps: true,
  collection: 'posts'
});

export default mongoose.model<IPost>('Post', PostSchema);
