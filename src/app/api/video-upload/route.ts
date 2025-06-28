import { NextRequest, NextResponse } from "next/server";
import {
  v2 as cloudinary,
  TransformationOptions,
  UploadApiResponse,
} from "cloudinary";
import { PrismaClient } from "../../../../generated/prisma";

const prisma = new PrismaClient();

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error: "Cloudinary credentials not found",
        },
        {
          status: 500,
        }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) {
      return NextResponse.json(
        {
          error: "File not found",
        },
        {
          status: 400,
        }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<UploadApiResponse>(
      async (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "video",
              media_metadata: true,
              folder: "showcase/videos",
              transformation: [
                {
                  quality: "auto",
                  fetch_format: "mp4",
                },
              ] as TransformationOptions[],
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result!);
            }
          )
          .end(buffer);
      }
    );

    const video = await prisma.video.create({
      data: {
        title,
        description,
        originalSize,
        publicId: result.public_id,
        compressedSize: String(result.bytes),
        duration: result.duration || 0,
      },
    });

    return NextResponse.json(video, { status: 200 });
  } catch (error) {
    console.log("Upload video failed", error);
    return NextResponse.json(
      {
        error: "Upload video failed",
      },
      {
        status: 500,
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
