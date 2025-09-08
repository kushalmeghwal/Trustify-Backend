import express from "express";
import { getIndividualMessage,  getChatList} from "../Controllers/chatController.js";

const router = express.Router();


router.post("/messages", getIndividualMessage);

router.get("/list/:currentUserId", getChatList);

export default router;
