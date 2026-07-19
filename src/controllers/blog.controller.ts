import { Request, Response } from 'express';
import { BlogPost } from '../models/BlogPost';

export const getBlogPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await BlogPost.find().sort({ publishedAt: -1 });
    res.status(200).json({ success: true, data: posts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching blog posts' });
  }
};

export const getBlogPostBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const { slug } = req.params;
    const post = await BlogPost.findOne({ slug });
    
    if (!post) {
      res.status(404).json({ success: false, message: 'Blog post not found' });
      return;
    }

    res.status(200).json({ success: true, data: post });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching blog post' });
  }
};
