import { Router } from 'express';
import { createPosts, getPosts } from '../controllers/postController';
import { getTopHashtags } from '../controllers/hashController';
import { createUser, getUserById } from '../controllers/userController';

const router: Router = Router();

router.get('/users/:userId', getUserById);
router.post('/user', createUser);
router.get('/posts', getPosts);
router.post('/posts', createPosts);
router.get('/hashtags', getTopHashtags);

export default router;
