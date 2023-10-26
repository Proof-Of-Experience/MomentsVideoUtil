import mongoose, { Document, Schema } from 'mongoose';

interface IAccount {
  isActive?: boolean;
  name?: string
}

const AccountSchema: Schema = new Schema({
  isActive: { type: Boolean, default: true },
  name: { type: String },
});

export interface IUser extends Document {
  userId: string;
  accounts: IAccount[];
  youtubeAccessToken: string | null;
}

// Definition of UpdatePayload
export interface UpdatePayload {
  accounts?: IAccount[];
  youtubeAccessToken?: string | null
  $push?: { accounts: { $each: IAccount[] } };
  [key: string]: any;
};

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  accounts: [AccountSchema],
  youtubeAccessToken: { type: String || null },
}, {
  timestamps: true,
  collection: 'users'
});

export default mongoose.model<IUser>('User', UserSchema);
