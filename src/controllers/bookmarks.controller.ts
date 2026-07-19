import { Request, Response } from "express";
import type { FilterQuery } from "../types/mongoose.js";
import { Bookmark, IBookmark } from "../models/Bookmark.js";

export const toggleBookmark = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { doctorId } = req.body;
    const userId = (req as any).user.id;

    if (!doctorId) {
      res
        .status(400)
        .json({ success: false, message: "Doctor ID is required" });
      return;
    }

    const existingBookmark = await Bookmark.findOne({
      userId,
      doctorId,
    } as FilterQuery<IBookmark>);

    if (existingBookmark) {
      await (Bookmark.findByIdAndDelete as Function)(existingBookmark._id);
      res
        .status(200)
        .json({
          success: true,
          data: { bookmarked: false },
          message: "Bookmark removed",
        });
    } else {
      await Bookmark.create({ userId, doctorId });
      res
        .status(201)
        .json({
          success: true,
          data: { bookmarked: true },
          message: "Bookmark added",
        });
    }
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error toggling bookmark",
      });
  }
};

export const getUserBookmarks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const bookmarks = await Bookmark.find({
      userId,
    } as FilterQuery<IBookmark>).populate("doctorId");

    res.status(200).json({ success: true, data: bookmarks });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error fetching bookmarks",
      });
  }
};
