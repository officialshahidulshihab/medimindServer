import { Request, Response } from 'express';
import { Review } from '../models/Review';
import { Doctor } from '../models/Doctor';
import '../models/User'; // Ensure User model is registered for population


export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, rating, comment } = req.body;
    const userId = (req as any).user.id;

    if (!doctorId || rating == null) {
      res.status(400).json({ success: false, message: 'Doctor ID and rating are required' });
      return;
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ userId, doctorId });
    if (existingReview) {
      res.status(400).json({ success: false, message: 'You have already reviewed this doctor' });
      return;
    }

    const review = await Review.create({
      userId,
      doctorId,
      rating,
      comment
    });

    // Update doctor's rating atomically
    const doctor = await Doctor.findById(doctorId);
    if (doctor) {
      const newCount = doctor.reviewCount + 1;
      const newRating = ((doctor.rating * doctor.reviewCount) + rating) / newCount;
      
      doctor.reviewCount = newCount;
      doctor.rating = Number(newRating.toFixed(1));
      await doctor.save();
    }

    res.status(201).json({ success: true, data: review });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(400).json({ success: false, message: 'You have already reviewed this doctor' });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Error creating review' });
  }
};

export const getDoctorReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId } = req.params;
    const reviews = await Review.find({ doctorId })
      .sort({ createdAt: -1 })
      .populate('userId', 'name image');
    
    res.status(200).json({ success: true, data: reviews });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching reviews' });
  }
};

export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const review = await Review.findOneAndDelete({ _id: id, userId });
    
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found or unauthorized' });
      return;
    }

    // Update doctor's rating
    const doctor = await Doctor.findById(review.doctorId);
    if (doctor && doctor.reviewCount > 0) {
      const newCount = doctor.reviewCount - 1;
      const newRating = newCount === 0 ? 0 : ((doctor.rating * doctor.reviewCount) - review.rating) / newCount;
      
      doctor.reviewCount = newCount;
      doctor.rating = Number(newRating.toFixed(1));
      await doctor.save();
    }

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error deleting review' });
  }
};
