import User from "../models/user";

export const GetUserPreferences = async (userId: string) => {
    return User.findOne({ userId }).populate("preferences", {
      _id: 1,
      name: 1,
    });
  }
