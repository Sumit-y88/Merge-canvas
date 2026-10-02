import { NextResponse } from "next/server";
import connectDB from "@/src/lib/db";
import { refreshSession } from "@/src/services/authService";
import { sendAuthSession, clearAuthCookie } from "@/src/lib/authResponse";
import { refreshCookieName, parseCookies } from "@/src/utils/tokenUtils";

export async function POST(request) {
  try {
    await connectDB();
    const token =
      request.cookies.get(refreshCookieName)?.value ||
      parseCookies(request.headers.get("cookie") || "")[refreshCookieName];

    if (!token) {
      const response = NextResponse.json(
        { message: "Session expired" },
        { status: 401 }
      );
      return clearAuthCookie(response);
    }

    const result = await refreshSession(token);
    return sendAuthSession(result, 200);
  } catch {
    const response = NextResponse.json(
      { message: "Session expired" },
      { status: 401 }
    );
    return clearAuthCookie(response);
  }
}
