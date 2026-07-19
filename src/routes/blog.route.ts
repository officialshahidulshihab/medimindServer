import { Router } from 'express';
import { getBlogPosts, getBlogPostBySlug } from '../controllers/blog.controller.js';

const router = Router();

router.get('/', getBlogPosts);
router.get('/:slug', getBlogPostBySlug);

export default router;
