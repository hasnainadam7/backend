import { asyncHandlerPromises } from "../utiles/async_handler.js";
import { Group } from "../models/group_chat_model.js";
import { ApiResponses } from "../utiles/api_responses.js";
import mongoose from "mongoose";
import { apiError } from "../utiles/api_errors.js";
import { cloudinaryUploader } from "../utiles/cloudinary.js";
import groupChatAggregations from "../aggregations/group_chat_aggregation.js";
import { ioClient } from "../app.js";
import { emitSocketEvent } from "../socket/socket.js";
// Import socket instance

const getChatGroups = asyncHandlerPromises(async (req, res) => {
  const id = req.body.user._id;
  const limit = 10;
  try {
    const groups = await Group.aggregate(
      groupChatAggregations.getGroups(id, limit)
    );

    if (!groups || groups.length === 0) {
      return res.status(200).json(new ApiResponses(200, {}, "No Chats Found"));
    }

    return res
      .status(200)
      .json(
        new ApiResponses(
          200,
          { groupChats: groups },
          "Chats Found Successfully"
        )
      );
  } catch (error) {
    console.error("Aggregation error:", error);
    return res
      .status(500)
      .json(new ApiResponses(500, {}, "Internal Server Error"));
  }
});

const createChatGroup = asyncHandlerPromises(async (req, res) => {
  try {
    const { usersIds, GroupTitle, user } = req.body;

    if (!user) throw new apiError(404, "User not found");

    if (!usersIds || !GroupTitle)
      throw new apiError(401, "Bad Request. Please complete all details");

    const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

    const GroupUsers = usersIds
      .filter((userId) => isValidObjectId(userId))
      .map((userId) => {
        if (!isValidObjectId(userId)) {
          throw new apiError(400, `Invalid user ID: ${userId}`);
        }
        return {
          userID: new mongoose.Types.ObjectId(userId),
          isAdmin: userId.toString() === user._id.toString(),
        };
      });

    if (GroupUsers.length === 0)
      throw new apiError(400, "Invalid user IDs provided");

    const newGroup = await Group.create({
      GroupUsers,
      GroupTitle,
    });

    if (!newGroup) throw new apiError(500, "Server Error. Please Try Again");

    ioClient.emit("groupCreated", newGroup); // Emit event to all users

    res
      .status(200)
      .json(
        new ApiResponses(200, { newGroup }, "New Group Created Successfully")
      );
  } catch (error) {
    console.log("Uploaded File Data:", error);
    throw new apiError(error.status, error.message || "undefined error");
  }
});

const fetchGroupMsgs = asyncHandlerPromises(async (req, res) => {
  const { groupId, user } = req.body;

  if (!groupId || !user) throw new apiError(400, "Bad Request");

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new apiError(400, "Invalid Group ID");
  }

  try {
    const isMember = await Group.findOne({
      _id: new mongoose.Types.ObjectId(groupId),
      "GroupUsers.userID": new mongoose.Types.ObjectId(user._id),
    });

    if (!isMember) throw new apiError(403, "UnAuthorized Request");

    const groupMessages = await Group.aggregate(
      groupChatAggregations.getMsgs(groupId, user._id)
    );

    res
      .status(200)
      .json(
        new ApiResponses(
          200,
          { messages: groupMessages },
          "Group messages fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error Fetching Messages:", error);
    throw new apiError(error.status || 500, error.message || "issue is ");
  }
});

const sendMessage = asyncHandlerPromises(async (req, res) => {
  const { groupId, user, message } = req.body.requestData;

  if (!groupId || !user || !message) throw new apiError(400, "Invalid Request");
  try {
    const isMember = await Group.findOne({
      _id: groupId,
      "GroupUsers.userID": user._id,
    });
    if (!isMember) throw new apiError(403, "UnAuthorized Request");

    const newMessage = { sender: user._id, message, timestamp: new Date() };
    // await Group.updateOne(
    //   { _id: groupId },
    //   { $push: { messages: newMessage } }
    // );
    const group = await Group.findById(groupId);
    if (!group) {
      throw new apiError(404, "Group not found");
    }
    await Group.findByIdAndUpdate(
      groupId,
      { $push: { listOfMessages: newMessage } },
      { new: true }
    );
    group["GroupUsers"].forEach((member) => {
      emitSocketEvent(req, groupId, "message", {
        groupId,
        toUser: member.userID.toString(),
        userId: user._id,
        content: message,
        timestamp: new Date(),
      });
    });

    res
      .status(200)
      .json(new ApiResponses(200, { newMessage }, "Message sent successfully"));
  } catch (error) {
    console.error("Error sending message:", error);
    throw new apiError(
      error.status || 500,
      error.message || "Message send failed"
    );
  }
});

const joinChatGroup = asyncHandlerPromises(async (req, res) => {
  const { groupId, user } = req.body;
  if (!groupId || !user) throw new apiError(400, "Invalid Request");

  try {
    await Group.updateOne(
      { _id: groupId },
      { $push: { GroupUsers: { userID: user._id, isAdmin: false } } }
    );
    ioClient.to(groupId).emit("join_chat", { userId: user._id, groupId }); // Notify group
    res
      .status(200)
      .json(new ApiResponses(200, {}, "Joined group successfully"));
  } catch (error) {
    console.error("Error joining group:", error);
    throw new apiError(error.status || 500, error.message || "Join failed");
  }
});

export {
  getChatGroups,
  createChatGroup,
  fetchGroupMsgs,
  sendMessage,
  joinChatGroup,
};
