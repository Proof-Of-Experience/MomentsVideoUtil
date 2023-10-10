import mongoose, { Document, Schema } from 'mongoose';

interface IAccount {
  name: string;
  isActive?: boolean;
}

const AccountSchema: Schema = new Schema({
  name: { type: String, required: true },
  isActive: { type: Boolean, default: true },
});

export interface IUser extends Document {
  userId: string;
  name: string;
  accounts: IAccount[];
}

// Definition of UpdatePayload
export interface UpdatePayload {
  name?: string;
  accounts?: IAccount[];
  $push?: { accounts: { $each: IAccount[] } };
};

const UserSchema: Schema = new Schema({
  userId: { type: String, required: true },
  name: String,
  accounts: [AccountSchema],
}, {
  timestamps: true,
  collection: 'users'
});

export default mongoose.model<IUser>('User', UserSchema);
