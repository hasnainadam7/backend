import mongoose from "mongoose";

const groupChatAggregations = {
  getGroups: (userId, limit = 10) => [
    {
      $match: {
        "GroupUsers.userID": new mongoose.Types.ObjectId(userId),
      },
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
      $addFields: {
        latestMessage: {
          $arrayElemAt: ["$listOfMessages", -1],
        },
      },
    },
    {
      $project: {
        GroupTitle: 1,
        GroupIcon: 1,
        GroupUsersDetails: 1,
        latestMessage: 1,
      },
    },
    {
      $sort: {
        "latestMessage.date": -1,
      },
    },
    {
      $limit: limit,
    },
  ],

  getMsgs: (id) => [
    { $match: { _id: new mongoose.Types.ObjectId(id) } }, 
    { $unwind: "$listOfMessages" },
    {
      $match: {
        $or: [
          
          { "listOfMessages.isDeletedToAll": { $ne: true } },

          {
            $and: [
              {
                "listOfMessages.sender": new mongoose.Types.ObjectId(user._id),
              },
              { "listOfMessages.isDeletedOnlyMe": { $ne: true } },
            ],
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "listOfMessages.sender",
        foreignField: "_id",
        as: "senderDetails",
      },
    },
    { $unwind: { path: "$senderDetails", preserveNullAndEmptyArrays: true } }, 
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
    { $sort: { date: -1 } }, 
  ],
};

export default groupChatAggregations;
