import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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
            required: function () {
                // Not required if user signed up via Google OAuth
                return !this.googleId;
            },
            minlength: 6,
            select: false, // never return password by default in queries
        },
        googleId: {
            type: String,
            default: null,
        },
        avatarColor: {
            // used for live cursor color in the whiteboard
            type: String,
            default: function () {
                // Cursor colors remain distinct from the warm amber accent and readable
                // on both the cream light canvas and near-black dark canvas.
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

userSchema.pre("save", async function () {
    if (!this.isModified("password") || !this.password) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
