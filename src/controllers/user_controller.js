//register user Controller

import { asyncHandlerPromises } from "../utiles/async_handler.js";
import { User } from "../models/users_model.js";
import jwt from "jsonwebtoken";
import { apiError } from "../utiles/api_errors.js";
import { ApiResponses } from "../utiles/api_responses.js";
import {
  cloudinaryUploader,
  cloudinaryDeleteImage,
} from "../utiles/cloudinary.js";
import mongoose from "mongoose";

const options = {
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandlerPromises(async (req, res) => {
  const { Username, Email, Fullname, Password } = req.body;

  if (!Username || !Email || !Fullname || !Password)
    throw new apiError(400, "Please fill all the fields");

  const existedUser = await User.findOne({ $or: [{ Username }, { Email }] });
  if (existedUser) throw new apiError(409, "Username or Email already exists");

  const avatarLocalPath = req.files?.Avatar?.[0]?.path || null;
  const coverImageLocalPath = req.files?.CoverImage?.[0]?.path || null;

  const avatarCloudinaryPath = await cloudinaryUploader(avatarLocalPath);
  let coverImageCloudinaryPath = null;

  if (coverImageLocalPath) {
    coverImageCloudinaryPath = await cloudinaryUploader(coverImageLocalPath);
  }

  const newUser = await User.create({
    Username,
    Email,
    Fullname,
    Password,
    Avatar: avatarCloudinaryPath,
    CoverImage: coverImageCloudinaryPath || "",
  });

  const fetchedUser = await getUser(newUser.Email);

  if (!fetchedUser)
    throw new apiError(500, "Error occured while saving new user");
  return res
    .status(201)
    .json(new ApiResponses(200, fetchedUser, "User registered successfully"));
});

const getUser = async (Email) => {
  try {
    // console.log(Email ,id)
    // if (!Email && !id) throw new apiError(400, "Email or ID is required");

    // const query = Email ? : { _id: id }; // Email ho to usse, warna id se find karo

    const user = await User.findOne({ Email }).select(
      "-Password -RefreshToken"
    );

    if (!user) throw new apiError(404, "User not found");

    return user;
  } catch (error) {
    throw new apiError(401, `${error.message || "Invalid Error"}`);
  }
};

const generateAccessTokenAndRefreshToken = async (userID) => {
  try {
    const fetchedUser = await User.findById(userID);
    const refreshToken = await fetchedUser.generateRefreshToken();
    const accessToken = await fetchedUser.generateAccessToken();
    fetchedUser.RefreshToken = refreshToken;
    await fetchedUser.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new apiError(500, "Error occured while generating tokens");
  }
};

const loginUser = asyncHandlerPromises(async (req, res) => {
  const { Email, Password } = req.body;
  console.log(req.body);
  if (!Email || !Password) {
    throw new apiError(400, "Please fill all the fields");
  }
  const user = await User.findOne({ Email }).select("Email Password");

  if (!user) throw new apiError(404, "User not found");

  const checkPassword = await user.comparePassword(Password);
  if (checkPassword) throw new apiError(401, "Invalid Credentials");

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const fetchedUser = await getUser(user.Email);
  if (!fetchedUser)
    throw new apiError(500, "Error occured while fetching user");

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponses(
        200,
        { fetchedUser, accessToken, refreshToken },
        "Login success"
      )
    );
});

const logoutUser = asyncHandlerPromises(async (req, res) => {
  const { user } = req.body;

  await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        RefreshToken: null,
      },
    },

    {
      new: true,
    }
  );

  const expiredOptions = {
    expires: new Date(0),
    httpOnly: true,
    secure: true,
  };
  return res
    .cookie("accessToken", "", expiredOptions)
    .cookie("refreshToken", "", expiredOptions)
    .json(new ApiResponses(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandlerPromises(async (req, res) => {
  //token le ge
  //usko check kia decode kr ke
  //database use token ki id k behlaf pr data lia
  //us id ka refresh token r 1 wala token ko match kia
  //agr match hogya to refresh kr dia
  try {
 
    const { refreshToken } = req.body || req.cookies ;
 

    if (refreshToken == null) throw new apiError(401, "Unauthorized Request");

    // Token verify karna
    const decodedToken = jwt.verify(
      refreshToken,
      process.env.ACCESS_TOKEN_SECRET
    );
    console.log(decodedToken);
    if (!decodedToken) throw new apiError(401, "Token Expired");

    const newToken = await User.findById(decodedToken._id).select(
      "RefreshToken"
    );

    if (!newToken) throw new apiError(403, "Invalid refresh token");

    // if (!(refreshToken === newToken?.RefreshToken))
    //   throw new apiError(401, "Invalid refresh token");

    const { accessToken, dbRefreshToken } =
      await generateAccessTokenAndRefreshToken(dbRefreshToken._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponses(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new apiError(401, `${error.message || "Invalid Error"}`);
  }
});

const changePassword = asyncHandlerPromises(async (req, res) => {
  const { user, confirmPassword, newPassword, currentPassword } = req.body;

  if (!user || !confirmPassword || !newPassword || !currentPassword)
    throw new apiError(400, "Please fill all the fields");

  if (confirmPassword !== newPassword)
    throw new apiError(400, "Password must be same");

  const Password = await User.findById(user._id).select("Password");

  const isPasswordCorrect = await User.comparePassword(
    Password.Password,
    newPassword
  );
  if (!isPasswordCorrect) throw new apiError(400, "Invalid Credentials");
  const fetchedUser = await User.findById(Password._id);
  if (!fetchedUser) throw new apiError(400, "Invalid Credentials");

  fetchedUser.Password = newPassword; // Yahan `pre("save")` hook trigger hoga
  await fetchedUser.save({ validateBeforeSave: false }); // Yeh middleware chalaye ga aur password hash ho jaye ga or baki field validate nhi hogi

  return res
    .status(200)
    .json(new ApiResponses(200, {}, "Password Updated Successfully"));
});

const getCurrentUser = asyncHandlerPromises((req, res) => {
  console.log(req.body.user);

  return res
    .status(200)
    .json(
      new ApiResponses(
        200,
        { user: req.body.user },
        "User Fatched Successfully"
      )
    );
});

const updateCurrentUser = asyncHandlerPromises(async (req, res) => {
  const { Username, Email, Fullname, user } = req.body;

  if (!Username || !Email || !Fullname || !Avatar)
    throw new apiError(400, "Please fill all the fields");
  if (!user) throw new apiError(400, "bad request");
  const updatedUser = await User.findByIdAndUpdate(
    user._id,
    {
      $set: {
        Email,
        Username,
        Fullname,
      },
    },
    { new: true, runValidators: true }
  ).select("-Password -RefreshToken");

  if (!updatedUser) throw new apiError(400, "Invalid Credentials");
  return res
    .status(200)
    .json(
      new ApiResponses(200, { user: updatedUser }, "User Updated Successfully")
    );
});

const uploadAndUpdateImage = async (req, res, imageKey) => {
  try {
    const { fetchedUser } = req.body.user;
    if (!fetchedUser) return new apiError(404, "User not found");

    const filePath = req.file?.[imageKey]?.[0]?.path;
    if (!filePath) return new apiError(400, "Image upload failed");

    const cloudinaryPath = await cloudinaryUploader(filePath);
    if (!cloudinaryPath) return new apiError(500, "Please reupload the file");

    if (fetchedUser[imageKey])
      await cloudinaryDeleteImage(fetchedUser[imageKey]);

    const updatedUser = await User.findByIdAndUpdate(
      fetchedUser._id,
      {
        $set: {
          [imageKey]: cloudinaryPath,
        },
      },
      { new: true, validateBeforeSave: false }
    ).select("-Password -RefreshToken");

    return res
      .status(200)
      .json(
        ApiResponses(200, { updatedUser }, `${imageKey} updated successfully`)
      );
  } catch (error) {
    return res.status(500).json({
      status: 500,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

const updateAvatar = asyncHandlerPromises((req, res) =>
  uploadAndUpdateImage(req, res, "Avatar")
);
const updateCover = asyncHandlerPromises((req, res) =>
  uploadAndUpdateImage(req, res, "CoverImage")
);

const getSubcribers = asyncHandlerPromises(async (req, res) => {
  const { username } = req.params;
  if (!channel) throw apiError(401, "Invalid Requests");

  const channel = await User.aggregate([
    {
      $match: {
        Username: username.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscrptions",
        foreignField: "channel",
        localField: "_id",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscrptions",
        foreignField: "subscriber",
        localField: "_id",
        as: "subscribeToo",
      },
    },
    {
      $addFields: {
        //is user k channel ko kitne logo ne subscribe kia hai
        UsersCount: {
          $size: "$subscribers",
        },

        //us user ne kitne channels ko subscribe kia hai
        channelsCount: {
          $size: "$subscribeToo",
        },

        //curent user ne subcribed kia hai ya nhi
        isSubscribed: {
          $cond: {
            if: { $in: [req.body.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        Username: 1,
        Email: 1,
        Fullname: 1,
        Avatar: 1,
        CoverImage: 1,
        UsersCount: 1,
        channelsCount: 1,
        isSubscribed: 1,
      },
    },
  ]);
});

const getWatchHistory = asyncHandlerPromises(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(req.body.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "WatchHistory",
        foreignField: "_id",
        as: "WatchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "VideoOwner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    Fullname: 1,
                    Avatar: 1,
                    Username: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  res
    .status(200)
    .json(
      new ApiResponses(
        200,
        user[0].getWatchHistory,
        "Watch history succuessfully fetched"
      )
    );
});

export {
  registerUser,
  loginUser,
  getUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateCurrentUser,
  updateAvatar,
  updateCover,
  getSubcribers,
  getWatchHistory,
};
