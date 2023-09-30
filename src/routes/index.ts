import { Router } from 'express';
import { createPosts, getPosts } from '../controllers/postController';
import { getTopHashtags } from '../controllers/hashController';

const router: Router = Router();

router.get('/posts', getPosts);
router.post('/posts', createPosts);
router.get('/hashtags', getTopHashtags);

export default router;
