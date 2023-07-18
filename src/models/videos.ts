import mongoose, { Document, Schema } from 'mongoose';

export interface IVideo extends Document {
  url: string;
  duration: number;
  screenshot: string;
}

const VideoSchema: Schema = new Schema({
  url: String,
  duration: Number,
  screenshot: String,
}, {
  timestamps: true,
  collection: 'videos'
});

export default mongoose.model<IVideo>('Video', VideoSchema);
