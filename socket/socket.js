// File: socket.js
import redisClient from '../config/redis.js';

const userSockets = new Map();

const socketHandler = (io) => {
  io.on('connection', async (socket) => {
    try {
      // Ensure mobile number is available on the socket object from the token middleware
      const senderMobile = socket.mobile;
      if (!senderMobile) {
        console.error('❌ Mobile number missing on socket.');
        return;
      }

      console.log(`📲 Connected: ${senderMobile} (Socket ID: ${socket.id})`);

      // Map socket ID to the user's mobile number
      userSockets.set(socket.id, senderMobile);
      
      try {
      // Store the socket ID in Redis for easy retrieval
      await redisClient.set(`socket:${senderMobile}`, socket.id);
      } catch (redisError) {
        console.error(`❌ Redis error storing socket ID: ${redisError.message}`);
      }

      // Step 1: Fetch previous messages for the chat
      socket.on('start_chat', async ({ receiverMobile }) => {
        if (!receiverMobile) {
          console.error('❌ Receiver mobile is missing.');
          return;
        }

        console.log(`🗨️ Starting chat between ${senderMobile} and ${receiverMobile}`);

        try {
          // Fetch previous messages from Redis
          const chatKey = `chat:${senderMobile}:${receiverMobile}`;
          const messages = await redisClient.get(chatKey);
          
          if (messages) {
            try {
              const parsedMessages = JSON.parse(messages);
              socket.emit('previous_messages', parsedMessages);
            } catch (parseError) {
              console.error(`❌ Error parsing messages: ${parseError.message}`);
              socket.emit('previous_messages', []);
            }
          } else {
            socket.emit('previous_messages', []);
          }
        } catch (redisError) {
          console.error(`❌ Redis error fetching messages: ${redisError.message}`);
          socket.emit('previous_messages', []);
        }
      });

      // Step 2: Handle sending messages
      socket.on('send_message', async ({ receiverMobile, message }) => {
        if (!receiverMobile || !message) {
          console.error('❌ Missing receiver or message.');
          return;
        }

        console.log(`✉️ ${senderMobile} → ${receiverMobile}: ${message}`);

        try {
          // Save the message to Redis
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
          
          // Add new message
          messages.push({
            from: senderMobile,
            message,
            timestamp: new Date().toISOString()
          });

          // Store updated messages in Redis
          await redisClient.set(chatKey, JSON.stringify(messages));

        // Check if the receiver is online and send the message to them in real time
          try {
        const receiverSocketId = await redisClient.get(`socket:${receiverMobile}`);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', {
            from: senderMobile,
            message,
          });
            }
          } catch (redisError) {
            console.error(`❌ Redis error checking receiver socket: ${redisError.message}`);
          }
        } catch (redisError) {
          console.error(`❌ Redis error saving message: ${redisError.message}`);
        }
      });

      // Step 3: Handle user disconnection
      socket.on('disconnect', async () => {
        const userMobile = userSockets.get(socket.id);
        console.log(`👋 Disconnected: ${userMobile} (Socket ID: ${socket.id})`);
        if (userMobile) {
          try {
          // Clean up Redis and userSockets map when a user disconnects
          await redisClient.del(`socket:${userMobile}`);
          } catch (redisError) {
            console.error(`❌ Redis error during disconnect: ${redisError.message}`);
          }
          userSockets.delete(socket.id);
        }
      });

    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  });
};

export default socketHandler;
