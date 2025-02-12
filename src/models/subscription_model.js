import mongoose, { Schema } from "mongoose";

const SubscriptionSchema = Schema(
  {
    //kis se li hai hai 
    channel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    ////kis ki li hai hai 
    subscriber: {
      type: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
  },
  {
    timestamp: true,
  }
);

export const Subscrption = mongoose.model("Subscrption", SubscriptionSchema);
