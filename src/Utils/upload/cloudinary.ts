import multer from "multer";
import { fileTypeFromBuffer } from "file-type";
import { NextFunction, Response, Request } from "express";
import { BadRequestException } from "../response/error.response";
import cloudinary from "../../config/cloudinary.config";
export const fileValidation = {
  images: ["image/png", "image/jpeg", "image/gif"],
  documents: ["application/pdf"],
};
export const fileUpload = () => {
  return multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });
};
export const uploadToCloudinary = (buffer: Buffer, folder: string) => {
  return new Promise<{
    public_id: string;
    secure_url: string;
  }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result?.public_id || !result.secure_url) {
          return reject(new Error("Failed to upload image"));
        }

        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
        });
      },
    );

    upload.end(buffer);
  });
};
export const fileTypeValidation = (
  validation: string[] = fileValidation.images,
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const files: Express.Multer.File[] = req.file
        ? [req.file]
        : (req.files as Express.Multer.File[]) || [];

      if (files.length === 0) {
        throw new BadRequestException("No file uploaded");
      }

      for (const file of files) {
        const detected = await fileTypeFromBuffer(file.buffer);

        if (!detected || !validation.includes(detected.mime)) {
          throw new BadRequestException(
            `Invalid file type: ${detected?.mime || "unknown"}`,
          );
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
