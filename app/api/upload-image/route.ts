import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/session";

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const apiKey = process.env.IMGBB_API_KEY;
  if (!apiKey) {
    console.error("IMGBB_API_KEY is missing from environment variables.");
    return NextResponse.json({ error: "Image upload is not configured (missing API key)." }, { status: 500 });
  }

  try {
    const incomingForm = await request.formData();
    const file = incomingForm.get("image") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided." }, { status: 400 });
    }

    if (file.size > 32 * 1024 * 1024) {
      return NextResponse.json({ error: "Image must be under 32MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const uploadForm = new FormData();
    uploadForm.append("key", apiKey);
    uploadForm.append("image", base64);

    const res = await fetch("https://api.imgbb.com/1/upload", {
      method: "POST",
      body: uploadForm,
    });

    const data = await res.json();

    if (!data.success) {
      // Log full details server-side so you can see them in your terminal
      console.error("ImgBB upload failed:", JSON.stringify(data));
      return NextResponse.json(
        { error: data.error?.message || "ImgBB rejected the upload." },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: data.data.url });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json({ error: "Upload failed — see server terminal for details." }, { status: 500 });
  }
}