import { NextResponse, type NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import connectDB from "@/src/lib/db";
import { revokeRefreshToken } from "@/src/services/authService";
import { clearAuthCookie } from "@/src/lib/authResponse";
import { refreshCookieName, parseCookies } from "@/src/utils/tokenUtils";
import TokenBlacklist from "@/src/models/TokenBlacklist.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const token =
      request.cookies.get(refreshCookieName)?.value ||
      parseCookies(request.headers.get("cookie") || "")[refreshCookieName];

    if (token) {
      await revokeRefreshToken(token);
    }

    const authHeader = request.headers.get("authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (accessToken) {
      try {
        const decoded = jwt.decode(accessToken) as { jti?: string; exp?: number } | null;
        if (decoded?.jti && decoded.exp) {
          await TokenBlacklist.updateOne(
            { jti: decoded.jti },
            {
              jti: decoded.jti,
              expiresAt: new Date(decoded.exp * 1000),
              reason: "logout",
            },
            { upsert: true }
          );
        }
      } catch {
        // Logout remains successful
      }
    }

    const response = new NextResponse(null, { status: 204 });
    return clearAuthCookie(response);
  } catch {
    const response = new NextResponse(null, { status: 204 });
    return clearAuthCookie(response);
  }
}
