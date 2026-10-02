import { NextResponse } from "next/server";
import connectDB from "@/src/lib/db";
import { loginUser } from "@/src/services/authService";
import { sendAuthSession } from "@/src/lib/authResponse";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);
    return sendAuthSession(result, 200);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Invalid credentials" },
      { status: 401 }
    );
  }
}
