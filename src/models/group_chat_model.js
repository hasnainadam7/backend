import { mongoose, Schema } from "mongoose";

const GroupSchema = new mongoose.Schema(
  {
    GroupUsers: [
      {
        userID: { type: Schema.Types.ObjectId, ref: "User" },
        isAdmin: { type: Boolean, default: false },
      },
    ],
    GroupTitle: {
      type: String,
    },
    GroupIcon: {
      type: String,
    },
    listOfMessages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: {
          type: String,
          validate: {
            validator: function (v) {
              return v || this.imageUrl.length > 0 || this.videoUrl.length > 0;
            },
            message:
              "At least one of message, imageUrl, or videoUrl is required",
          },
        },
        imageUrl: { type: [String], default: [] },
        videoUrl: { type: [String], default: [] },
        date: { type: Date, default: Date.now() },
        isEdited: { type: Boolean, default: false },
        isDeletedToAll: { type: Boolean, default: false },
        isDeletedOnlyMe: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const Group = mongoose.model("Group", GroupSchema);
