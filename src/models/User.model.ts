import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends mongoose.Document {
  name: string;
  email: string;
  password?: string;
  googleId?: string | null;
  avatarColor: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    password: {
      type: String,
      required: function (this: any) {
        return !this.googleId;
      },
      minlength: 6,
      select: false,
    },
    googleId: {
      type: String,
      default: null,
    },
    avatarColor: {
      type: String,
      default: function () {
        const colors = ["#DC2626", "#0891B2", "#2563EB", "#DB2777", "#65A30D"];
        return colors[Math.floor(Math.random() * colors.length)];
      },
    },
  },
  { timestamps: true }
);

userSchema.index(
  { googleId: 1 },
  { unique: true, partialFilterExpression: { googleId: { $type: "string" } } }
);

userSchema.pre("save", async function (this: any) {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (this: any, candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: any = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
