import { asyncHandlerPromises } from "../utiles/async_handler.js";
import { Group } from "../models/group_chat_model.js";
import { ApiResponses } from "../utiles/api_responses.js";
import mongoose from "mongoose";
import { apiError } from "../utiles/api_errors.js";
import { cloudinaryUploader } from "../utiles/cloudinary.js";

///this function will return list of group chats
const getChatGroups = asyncHandlerPromises(async (req, res) => {
  const id = req.body.user._id;
  const limit = 1;
  try {
    const groups = await Group.aggregate([
      {
        $match: {
          "GroupUsers.userID": new mongoose.Types.ObjectId(id),
        },
      },
      {
        $limit: limit,
      },

      {
        $lookup: {
          from: "users",
          let: { groupUsers: "$GroupUsers" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$groupUsers.userID"],
                },
              },
            },
            {
              $project: {
                _id: 1,
                FullName: 1,
                Email: 1,
                Avatar: 1,
              },
            },
          ],
          as: "GroupUsersDetails",
        },
      },
      {
        $project: {
          GroupTitle: 1,
          GroupIcon: 1,
          GroupUsersDetails: 1,
          latestMessage: {
            $cond: {
              if: { $gt: [{ $size: "$listOfMessages" }, 0] },
              then: { $arrayElemAt: ["$listOfMessages", -1] },
              else: null,
            },
          },
        },
      },
      {
        $sort: {
          "latestMessage.date": -1,
        },
      },
    ]);

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

//this function will return the new group craeated
const createChatGroup = asyncHandlerPromises(async (req, res) => {
  try {
    const { usersIds, GroupTitle, user } = req.body;

    if (!user) throw new apiError(404, "User not found");

    // const filePath = req.file?.groupIconUrl?.[0]?.path || null;
    // if (!filePath) throw new apiError(400, "Image upload failed");

    if (!usersIds || !GroupTitle)
      throw new apiError(401, "Bad Request. Please complete all details");

    // const groupIconUrl = await cloudinaryUploader(filePath);
    // if (!groupIconUrl) throw new apiError(500, "Please re-upload the file");

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
      // groupIconUrl,
    });

    if (!newGroup) throw new apiError(500, "Server Error. Please Try Again");

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

  if (!groupId || !user) throw new apiError(400, "Galat Request");

  if (!mongoose.Types.ObjectId.isValid(groupId)) {
    throw new apiError(400, "Invalid Group ID");
  }

  try {
    // ✅ **Sabse pehle check karega ke user is group me hai ya nahi**
    const isMember = await Group.findOne({
      _id: new mongoose.Types.ObjectId(groupId),
      "GroupUsers.userID": new mongoose.Types.ObjectId(user._id),
    });

    if (!isMember) throw new apiError(403, "UnAuthorized Request");

    // ✅ **Agar user group ka member hai to messages fetch karne ka kaam shuru hoga**
    const groupMessages = await Group.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(groupId) } }, // 🎯 **Sirf usi group ka data milega**
      { $unwind: "$listOfMessages" }, // 🎯 **Messages ko alag alag karne ke liye**
      {
        $match: {
          $or: [
            // Show messages that aren't deleted for everyone
            { "listOfMessages.isDeletedToAll": { $ne: true } },
            
            // Show messages where:
            // 1. Current user is the sender AND
            // 2. Message isn't deleted for them specifically
            {
              $and: [
                { "listOfMessages.sender": new mongoose.Types.ObjectId(user._id) },
                { "listOfMessages.isDeletedOnlyMe": { $ne: true }}
              ]
            }
          ]
        }
      },
      {
        $lookup: {
          from: "users", // 🎯 **Sender ka naam aur profile pic laane ke liye**
          localField: "listOfMessages.sender",
          foreignField: "_id",
          as: "senderDetails",
        },
      },
      { $unwind: { path: "$senderDetails", preserveNullAndEmptyArrays: true } }, // 🎯 **Agar sender delete ho gaya ho tab bhi message dikhe**
      {
        $project: {
          _id: "$listOfMessages._id",
          sender: {
            _id: "$senderDetails._id",
            fullName: "$senderDetails.fullName",
            profilePic: "$senderDetails.profilePic",
          },
          message: "$listOfMessages.message",
          imageUrl: "$listOfMessages.imageUrl",
          videoUrl: "$listOfMessages.videoUrl",
          date: "$listOfMessages.date",
          isEdited: "$listOfMessages.isEdited",
          isDeletedToAll: "$listOfMessages.isDeletedToAll",
        },
      },
      { $sort: { date: -1 } }, // 🎯 **Messages latest sabse pehle aayenge**
    ]);

    res.status(200).json(
      new ApiResponses(200, { messages: groupMessages }, "Group messages fetched successfully")
    );
  } catch (error) {
    console.error("Error Fetching Messages:", error);
    throw new apiError(error.status || 500 ,error.message || "issue is ");
  }
});

export { getChatGroups, createChatGroup,fetchGroupMsgs };
