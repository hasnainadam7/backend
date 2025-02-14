//router user
import { Router } from "express";

import {
  loginUser,
  registerUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateCurrentUser,
  updateCover,
  updateAvatar,
  getAllUsers
} from "../controllers/user_controller.js";

//middlewares
import { isUserAuthorized } from "../middleware/auth_middleware.js";
import upload from "../middleware/multer.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "Avatar", maxCount: 1 },
    { name: "CoverImage", maxCount: 1 },
  ]),
  registerUser
);
router.route("/login").post(loginUser);

//Secure Routes
router.route("/logout").post(isUserAuthorized, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(isUserAuthorized, changePassword);
router.route("/fetch-current-user").post(isUserAuthorized, getCurrentUser);
router.route("/update-user").post(isUserAuthorized, updateCurrentUser);
router.route("/get-all-user").post(isUserAuthorized, getAllUsers);

router
  .route("/update-avatar")
  .patch(isUserAuthorized, upload.single("Avatar"), updateAvatar);

router
  .route("/update-cover")
  .patch(isUserAuthorized, upload.single("CoverImage"), updateCover);

export default router;
