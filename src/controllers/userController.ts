import { Request, Response } from 'express';
import User, { IUser, UpdatePayload } from '../models/user';


// API endpoint to create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  try {
    const userId = req.body.userId;
    const existingUser = await User.findOne({ userId });

    // Check if userId is provided
    if (!userId) {
      res.status(400).json({ error: 'User ID is not provided' });
      return;
    }

    if (existingUser) {
      res.status(400).json({ error: 'User with the provided ID already exists' });
      return;
    }
    const newUser: IUser = new User({
      accounts: [{
        name: 'youtube',
        isActive: false
      }],
      youtubeAccessToken: null,
      userId,
    });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully', user: newUser });

  } catch (error: any) {
    if (error.response) {
      console.error('error.response.data', error.response.data);
      console.error('error.response.status', error.response.status);
      console.error('error.response.headers', error.response.headers);
    } else if (error.request) {
      console.error('error.request', error.request);
    } else {
      console.error('error.message', error.message);
    }
    res.status(500).json({ error: 'Failed to create user' });
  }
};


// API endpoint to fetch user by userId
export const getUserById = async (req: Request, res: Response): Promise<void> => {

  try {
    const userId = req.params.userId; // Assuming you pass userId as a route parameter

    const user = await User.findOne({ userId });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(user);

  } catch (error: any) {
    console.error('Error fetching user:', error.message);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};


// API endpoint to patch user data
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PATCH');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');


  try {
    const { userId } = req.params;
    const { youtubeAccessToken, accounts } = req.body;

    if (!userId) {
      res.status(400).json({ error: 'User ID is not provided' });
      return;
    }

    const existingUser = await User.findOne({ userId });
    if (!existingUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updateData: UpdatePayload = {};
    const updateAccountFilters = [];

    if (accounts && Array.isArray(accounts)) {
      const accountNamesSet = new Set();

      for (let account of accounts) {
        if (typeof account !== 'object' || Array.isArray(account) || account === null) {
          res.status(400).json({ error: 'Each item in accounts should be an object' });
          return;
        }

        // Check for required fields and their types
        if (!account.name || typeof account.name !== 'string') {
          res.status(400).json({ error: 'Account name should be a string and is required' });
          return;
        }

        // Check for unique account name
        if (accountNamesSet.has(account.name)) {
          res.status(400).json({ error: `Account name "${account.name}" should be unique` });
          return;
        }
        accountNamesSet.add(account.name);

        if (account.isActive !== undefined && typeof account.isActive !== 'boolean') {
          res.status(400).json({ error: 'Account isActive should be a boolean' });
          return;
        }

        if (!['youtube', 'vimeo'].includes(account.name)) {
          res.status(400).json({ error: `Account name "${account.name}" is not allowed. Only "youtube" and "vimeo" are accepted.` });
          return;
        }

        if (existingUser && existingUser.accounts.some(e => e.name === account.name)) {
          // Construct the update object to update isActive status for the specific account
          updateData[`accounts.$[accountElem].isActive`] = account.isActive;
          updateAccountFilters.push({ 'accountElem.name': account.name });
        } else {
          if (!updateData.$push) {
            updateData.$push = {
              accounts: { $each: [account] }
            };
          } else if (!updateData.$push.accounts) {
            updateData.$push.accounts = { $each: [account] };
          } else {
            updateData.$push.accounts.$each.push(account);
          }
        }
      }
    }

    if (typeof youtubeAccessToken !== 'undefined') {
      updateData.youtubeAccessToken = youtubeAccessToken;
    }

    const updateOptions = {
      new: true,
      arrayFilters: updateAccountFilters
    };

    const updatedUser = await User.findOneAndUpdate({ userId }, { $set: updateData }, updateOptions);

    res.status(200).json(updatedUser);

  } catch (error: any) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
};