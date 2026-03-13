// app/api/upload/route.ts
// Shared upload route — accessible by any authenticated role (student, teacher, admin, parent)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_SIZE      = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authConfig);
  if (!session?.user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file     = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Only JPEG, PNG, WebP images and PDFs are allowed" },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { success: false, error: "File must be under 5MB" },
        { status: 400 }
      );
    }

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder:        "assignments",
          resource_type: "auto", // handles both images and PDFs
        },
        (error, result) => {
          if (error || !result) reject(error ?? new Error("Upload failed"));
          else resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({ success: true, url: result.secure_url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}