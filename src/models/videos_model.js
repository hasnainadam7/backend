import mongoose, { Schema } from "mongoose";

const videoSchema = new Schema(
  {
    VideoUrl: {
      type: String,
      required: [true, "Video is required"],
    },

    ThumbnilUrl: {
      type: String,
      required: [true, "Thumbnil is required"],
    },
    Title: {
      type: String,
      required: [true, "Title is required"],
    },
    Description: {
      type: String,
      required: [true, "Description is required"],
    },
    Duration: {
      type: Number,
      required: [true, "Duration Time is required"],
    },
    Views: {
      type: Number,
      default: 0,
    },
    IsPublished: {
      type: Boolean,
      default: true,
    },
    VideoOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export const Video = mongoose.model("Video", videoSchema);
