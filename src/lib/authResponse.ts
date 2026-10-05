import { NextResponse } from "next/server";
import { refreshCookieName } from "../utils/tokenUtils";

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: (process.env.NODE_ENV === "production" ? "none" : "lax") as "none" | "lax",
  maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 7) * 24 * 60 * 60,
  path: "/api/auth",
});

export interface AuthSessionData {
  refreshToken?: string;
  [key: string]: any;
}

export const sendAuthSession = (
  session: AuthSessionData,
  status = 200
): NextResponse => {
  const { refreshToken, ...safeSession } = session;
  const response = NextResponse.json(safeSession, { status });
  response.headers.set("Cache-Control", "no-store");

  if (refreshToken) {
    response.cookies.set(refreshCookieName, refreshToken, getCookieOptions());
  }

  return response;
};

export const clearAuthCookie = (response: NextResponse): NextResponse => {
  response.cookies.set(refreshCookieName, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
};
