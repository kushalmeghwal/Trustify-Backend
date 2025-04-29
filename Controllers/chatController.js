// chatRoutes.js

import redisClient from "../config/redis.js";

// Get chat history between two users
export async function getChatHistory(req, res) {
  const { mobile1, mobile2 } = req.query;

  if (!mobile1 || !mobile2) {
    return res.status(400).json({ error: "Both mobile1 and mobile2 are required" });
  }

  try {
    const messages = await fetchMessages(mobile1, mobile2);
    res.json(messages);
  } catch (error) {
    console.error("❌ Error in /history route:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
}

// Fetch chat history between two mobiles from Redis
export async function fetchMessages(mobile1, mobile2) {
  try {
    const chatKey = `chat:${mobile1}:${mobile2}`;
    const messages = await redisClient.get(chatKey);

    if (!messages) {
      return [];
    }
    
    try {
      return JSON.parse(messages);
    } catch (parseError) {
      console.error(`❌ Error parsing messages: ${parseError.message}`);
      return [];
    }
  } catch (error) {
    console.error("❌ Error fetching messages:", error);
    return [];
  }
}

// Save a new message to Redis
export async function saveMessage(senderMobile, receiverMobile, message) {
  try {
    const chatKey = `chat:${senderMobile}:${receiverMobile}`;
    let messages = [];
    
    try {
      const existingMessages = await redisClient.get(chatKey);
      if (existingMessages) {
        messages = JSON.parse(existingMessages);
      }
    } catch (parseError) {
      console.error(`❌ Error parsing existing messages: ${parseError.message}`);
      // If parsing fails, start with an empty array
      messages = [];
    }
    
    messages.push({
      from: senderMobile,
      message,
      timestamp: new Date().toISOString()
    });

    await redisClient.set(chatKey, JSON.stringify(messages));
    console.log("✅ Message saved to chat history");
  } catch (error) {
    console.error("❌ Error saving message:", error);
  }
}
