import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
  {
    Username: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      required: [true, "Username is required"],
    },
    Email: {
      type: String,
      lowercase: true,
      trim: true,
      required: [true, "Email is required"],
      unique: true,
    },
    Fullname: {
      type: String,
      trim: true,
      index: true,
      required: [true, "Fullname is required"],
    },
    Avatar: {
      type: String,
      required: [true, "Avatar is required"],
    },
    CoverImage: {
      type: String,
    },
    Password: {
      type: String,
      required: [true, "Password is required"],
    },
    Role: {
      type: String,
      default: "user",
    },
    RefreshToken: {
      type: String,
    },
    WatchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamp: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("Password")) {
    return next();
  }
  this.Password = await bcrypt.hash(this.Password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare( this.Password,password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      Email: this.Email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_SECRET_EXPIRATION,
    }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_SECRET_EXPIRATION,
    }
  );
};

export const User = mongoose.model("User", userSchema);
