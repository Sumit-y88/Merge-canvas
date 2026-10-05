import { NextResponse } from "next/server";
import { refreshCookieName } from "../utils/tokenUtils";

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: Number(process.env.REFRESH_TOKEN_DAYS || 7) * 24 * 60 * 60,
  path: "/api/auth",
});

export const sendAuthSession = (session, status = 200) => {
  const { refreshToken, ...safeSession } = session;
  const response = NextResponse.json(safeSession, { status });
  response.headers.set("Cache-Control", "no-store");

  if (refreshToken) {
    response.cookies.set(refreshCookieName, refreshToken, getCookieOptions());
  }

  return response;
};

export const clearAuthCookie = (response) => {
  response.cookies.set(refreshCookieName, "", {
    ...getCookieOptions(),
    maxAge: 0,
  });
  return response;
};
