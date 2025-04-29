import express from "express";
import { getChatHistory, fetchMessages, saveMessage } from "../Controllers/chatController.js";
import { verifyToken } from "../Middlewares/auth.js";
import redisClient from "../config/redis.js";

const router = express.Router();

// GET /api/chats/history?mobile1=xxx&mobile2=yyy
router.get("/history", verifyToken, getChatHistory);

// GET /api/chats/messages?mobile1=xxx&mobile2=yyy
router.get("/messages", verifyToken, async (req, res) => {
  const { mobile1, mobile2 } = req.query;
  
  if (!mobile1 || !mobile2) {
    return res.status(400).json({ error: "Both mobile1 and mobile2 are required" });
  }
  
  try {
    const messages = await fetchMessages(mobile1, mobile2);
    res.json(messages);
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// POST /api/chats/save
router.post("/save", verifyToken, async (req, res) => {
  const { senderMobile, receiverMobile, message } = req.body;
  
  if (!senderMobile || !receiverMobile || !message) {
    return res.status(400).json({ error: "Sender, receiver, and message are required" });
  }
  
  try {
    await saveMessage(senderMobile, receiverMobile, message);
    res.json({ success: true, message: "Message saved successfully" });
  } catch (error) {
    console.error("❌ Error saving message:", error);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// GET /api/chats/list?mobile=xxx
router.get("/list", verifyToken, async (req, res) => {
  const { mobile } = req.query;
  
  if (!mobile) {
    return res.status(400).json({ error: "Mobile number is required" });
  }
  
  try {
    // Get all chat keys for this user
    const keys = await redisClient.keys(`chat:${mobile}:*`);
    const reverseKeys = await redisClient.keys(`chat:*:${mobile}`);
    
    const allKeys = [...keys, ...reverseKeys];
    const chatList = [];
    
    for (const key of allKeys) {
      const messages = await redisClient.get(key);
      if (messages) {
        try {
          const parsedMessages = JSON.parse(messages);
          if (parsedMessages.length > 0) {
            const lastMessage = parsedMessages[parsedMessages.length - 1];
            const partnerMobile = key.split(':')[1] === mobile ? key.split(':')[2] : key.split(':')[1];
            
            chatList.push({
              partnerMobile,
              lastMessage: lastMessage.message,
              timestamp: lastMessage.timestamp,
              unread: false // You can implement unread logic if needed
            });
          }
        } catch (e) {
          console.error(`Error parsing messages for key ${key}:`, e);
        }
      }
    }
    
    // Sort by timestamp (newest first)
    chatList.sort((a, b) => {
      return b.timestamp.localeCompare(a.timestamp);
    });
    
    res.json(chatList);
  } catch (error) {
    console.error("❌ Error fetching chat list:", error);
    res.status(500).json({ error: "Failed to fetch chat list" });
  }
});

export default router;