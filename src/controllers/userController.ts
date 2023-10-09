import { Request, Response } from 'express';
import User, { IUser } from '../models/user';

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
    const name = req.body.name || '';
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
    const newUser: IUser = new User({ userId, name, accounts: [] });
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
  try {
    const userId = req.params.userId; // Assuming you pass userId as a route parameter

    if (!userId) {
      res.status(400).json({ error: 'User ID is not provided' });
      return;
    }

    // Extract the fields to be updated
    const { name, accounts } = req.body;

    // Construct the update object with only provided fields
    const updateData: Partial<IUser> = {};
    if (name !== undefined) updateData.name = name;
    if (accounts !== undefined) updateData.accounts = accounts;

    // Update the user data
    const updatedUser = await User.findOneAndUpdate({ userId }, updateData, {
      new: true, // Return the updated document
    });

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json(updatedUser);

  } catch (error: any) {
    console.error('Error updating user:', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
};