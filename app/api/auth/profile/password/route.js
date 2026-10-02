import { NextResponse } from "next/server";
import { requireAuth } from "@/src/lib/authMiddleware";
import User from "@/src/models/User.model";

export async function PATCH(request) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const { currentPassword, newPassword } = body || {};

    if (typeof currentPassword !== "string" || typeof newPassword !== "string") {
      return NextResponse.json(
        { message: "Current and new passwords are required" },
        { status: 400 }
      );
    }
    if (newPassword.length < 6 || newPassword.length > 128) {
      return NextResponse.json(
        { message: "New password must be between 6 and 128 characters" },
        { status: 400 }
      );
    }

    const user = await User.findById(authUser._id).select("+password");
    if (!user || !user.password || !(await user.comparePassword(currentPassword))) {
      return NextResponse.json(
        { message: "Current password is incorrect" },
        { status: 400 }
      );
    }

    user.password = newPassword;
    await user.save();
    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: error.message || "Failed to update password" },
      { status: error.statusCode || 400 }
    );
  }
}
