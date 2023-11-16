import mongoose, { Document, Schema } from 'mongoose';

interface IAccount {
  isSynced?: boolean;
  name?: string
}

const AccountSchema: Schema = new Schema({
  isSynced: { type: Boolean, default: true },
  name: { type: String },
});

export interface IUser extends Document {
  userId: string;
  accounts: IAccount[];
  youtubeAccessToken: string | null;
  preferences: string[],
}

// Definition of UpdatePayload
export interface UpdatePayload {
  accounts?: IAccount[];
  youtubeAccessToken?: string | null
  $push?: { accounts: { $each: IAccount[] } };
  [key: string]: any;
};

export interface UpdateUserPreferencePayload {
  preferences: string[],
}

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  accounts: [AccountSchema],
  youtubeAccessToken: { type: String || null },
  preferences: { type: [String], default: [] },
}, {
  timestamps: true,
  collection: 'users'
});

export default mongoose.model<IUser>('User', UserSchema);
