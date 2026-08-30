import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export async function GET() {
  try {
    return NextResponse.json({
      defaultLocation: "Delhi",
      language: "English",
      occupation: "General Public",
    });
  } catch (error) {
    return NextResponse.json({
      defaultLocation: "Delhi",
      language: "English",
      occupation: "General Public",
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    return NextResponse.json({
      success: true,
      preferences: body,
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
