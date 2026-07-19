import { Request, Response } from "express";
import type { FilterQuery } from "../types/mongoose.js";
import { HealthDocument, IHealthDocument } from "../models/HealthDocument.js";
import cloudinary from "../lib/cloudinary.js";
import streamifier from "streamifier";

export const uploadDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { type, documentDate } = req.body;
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    if (!type) {
      res
        .status(400)
        .json({ success: false, message: "Document type is required" });
      return;
    }

    const uploadToCloudinary = () => {
      return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `medimind/documents/${userId}`,
            resource_type: "auto",
            type: "upload",
            access_mode: "public",
          },
          (error, result) => {
            if (result) {
              resolve(result);
            } else {
              reject(error);
            }
          },
        );
        streamifier.createReadStream(file.buffer).pipe(stream);
      });
    };

    const cloudinaryResult = await uploadToCloudinary();

    const healthDoc = await HealthDocument.create({
      userId,
      type,
      fileUrl: cloudinaryResult.secure_url,
      fileName: file.originalname,
      documentDate: documentDate || new Date(),
      abnormalFlags: [],
      actionItems: [],
    });

    res.status(201).json({ success: true, data: healthDoc });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error uploading document",
      });
  }
};

export const getDocuments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const documents = await HealthDocument.find({
      userId,
    } as FilterQuery<IHealthDocument>).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: documents });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error fetching documents",
      });
  }
};

export const deleteDocument = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { id } = req.params;

    // Use findOneAndDelete with explicit typing to avoid ModifyResult issues
    const doc = (await HealthDocument.findOneAndDelete({
      _id: id,
      userId,
    } as FilterQuery<IHealthDocument>).lean()) as IHealthDocument | null;

    if (!doc) {
      res
        .status(404)
        .json({
          success: false,
          message: "Document not found or unauthorized",
        });
      return;
    }

    try {
      const urlParts = doc.fileUrl.split("/upload/");
      if (urlParts.length === 2) {
        let path = urlParts[1];
        if (path.match(/^v\d+\//)) {
          path = path.replace(/^v\d+\//, "");
        }
        const publicId = path.substring(0, path.lastIndexOf("."));
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
    } catch (cloudinaryError) {
      console.error("Error deleting from Cloudinary:", cloudinaryError);
    }

    res
      .status(200)
      .json({ success: true, message: "Document deleted successfully" });
  } catch (error: any) {
    res
      .status(500)
      .json({
        success: false,
        message: error.message || "Error deleting document",
      });
  }
};
