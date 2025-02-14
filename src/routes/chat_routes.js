import { Router } from "express";

import { isUserAuthorized } from "../middleware/auth_middleware.js";
import upload from "../middleware/multer.middleware.js";
import {
  getChatGroups,
  createChatGroup,
  fetchGroupMsgs
} from "../controllers/chat_controller.js";
const router = Router();

router.route("/get-all-group-chats").post(isUserAuthorized, getChatGroups);

router.route("/create-chat").post(
  isUserAuthorized,
  // upload.fields([{ name: "groupIconUrl", maxCount: 1 }]),
  createChatGroup
);

router.route("/fetch-chat-messages").get(
  isUserAuthorized,
  // upload.fields([{ name: "groupIconUrl", maxCount: 1 }]),
  fetchGroupMsgs
);

router.route("/send-chat-messages").post(
  isUserAuthorized,
  // upload.fields([{ name: "groupIconUrl", maxCount: 1 }]),
  fetchGroupMsgs
);

export default router;
