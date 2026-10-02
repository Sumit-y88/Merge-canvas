import { NextResponse } from "next/server";
import connectDB from "@/src/lib/db";
import { loginWithGoogle } from "@/src/services/authService";
import { sendAuthSession } from "@/src/lib/authResponse";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { credential } = body || {};

    if (typeof credential !== "string" || !credential) {
      return NextResponse.json(
        { message: "Google credential is required" },
        { status: 400 }
      );
    }

    const result = await loginWithGoogle(credential);
    return sendAuthSession(result, 200);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Google login failed" },
      { status: 401 }
    );
  }
}
