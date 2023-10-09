import { Request, Response } from 'express';
import User, { IUser } from '../models/user';

// API endpoint to create user
export const createUser = async (req: Request, res: Response): Promise<void> => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

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