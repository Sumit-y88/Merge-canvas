import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";

const publicProfile = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatarColor: user.avatarColor,
  createdAt: user.createdAt,
});

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    return NextResponse.json(publicProfile(user), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Not authorized" },
      { status: error.statusCode || 401 }
    );
  }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const avatarColor =
      typeof body?.avatarColor === "string" ? body.avatarColor.trim() : undefined;

    if (!name || name.length < 2 || name.length > 80) {
      return NextResponse.json(
        { message: "Name must be between 2 and 80 characters" },
        { status: 400 }
      );
    }
    if (avatarColor && !/^#[0-9a-f]{6}$/i.test(avatarColor)) {
      return NextResponse.json(
        { message: "Avatar color must be a valid hex color" },
        { status: 400 }
      );
    }

    user.name = name;
    if (avatarColor) user.avatarColor = avatarColor;
    await user.save();

    return NextResponse.json(publicProfile(user), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Update profile failed" },
      { status: error.statusCode || 400 }
    );
  }
}
