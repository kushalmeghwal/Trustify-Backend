//import express and make an app structure
import express, { urlencoded, json } from "express";
const app = express();
import  jwt  from "jsonwebtoken";
import { Server } from "socket.io";
import { createServer } from "http";
import cors from "cors";
app.use(cors());

//import configuration
import 'dotenv/config';
const PORT=process.env.PORT;

//middleware to parse
app.use(urlencoded({ extended: true }));
app.use(json());

//default route
app.get('/',(req,res)=>{
  res.send('working fine');
})




const server = createServer(app);
const io = new Server(server, {
  cors: {
      origin: '*',
      methods: ['GET', 'POST'],
  }
});
//using io in http requests
app.set("io", io);

//mount the route
import userRouter from "./Routes/userRoute.js";
import productRouter from "./Routes/productRoute.js";
import chatRouter from "./Routes/chatRoute.js";

app.use("/api/v1", userRouter);
app.use("/api/v1/product",productRouter);
app.use("/api/v1/chats",chatRouter);


io.use((socket, next) => {
  const token = socket.handshake.query.token;

  if (!token) {
    return next(new Error("Token required"));
  }
  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    if (!decoded.mobileNo) {
      return next(new Error("Invalid token: mobile not found"));
    }
    socket.mobile = decoded.mobileNo; // Optional: save for easy access later
    console.log(socket.mobile);
    next();
  } catch (err) {
    console.log(err)
    return next(new Error("Invalid token"));
  }
});

// Attach socket handler
import { setupSocket } from "./sockets/socketHandler.js";
io.on('connection', setupSocket);
//start the server
server.listen(PORT, () => {
  console.log(` Server is running successfully on port ${PORT}`);
});





//import neo4j driver
import  neo4jDriver  from "./config/database.js";


// Ensure driver is closed on process exit
process.on("SIGINT", async () => {
  await neo4jDriver.close();
  console.log("\nNeo4j connection closed. byee!!");
  process.exit(0);
});

