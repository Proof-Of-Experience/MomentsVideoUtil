import User from "../models/user";

export const GetUserWithPreferences = async (userId: string) => {
	return User.findOne({ userId }).populate("preferences", {
		_id: 1,
		name: 1,
	});
};

export const get_users_count_where_ids_in = async (ids: string[]): Promise<any> => {
	return await User.countDocuments({ _id: { $in: ids } });
};

export const get_users_where_ids_in = async (ids: string[]): Promise<any> => {
	return await User.find({ _id: { $in: ids } });
};
