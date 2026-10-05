import { NextResponse } from "next/server";
import connectDB from "@/src/lib/db";
import { registerUser } from "@/src/services/authService";
import { sendAuthSession } from "@/src/lib/authResponse";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { name, email, password } = body || {};

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email and password are required" },
        { status: 400 }
      );
    }

    const result = await registerUser(name, email, password);
    return sendAuthSession(result, 201);
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
