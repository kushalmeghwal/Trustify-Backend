//import express and make an app structure
import express, { urlencoded, json } from "express";
import { Server } from 'socket.io';
import { setupSocket } from "./sockets/socketHandler.js";
import { createServer } from "http";
import cors from "cors";
//mount the route
import userRouter from "./Routes/userRoute.js";
import productRouter from "./Routes/productRoute.js";
import notificationRouter from "./Routes/notificationRoute.js";
import chatRouter from "./Routes/chatRoutes.js";


const app = express();

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

// Attach io inside express app
app.set('io', io);
io.on('connection', (socket) => {
  setupSocket(io,socket);  // Call setupSocket when a new connection occurs
});






app.use("/api/v1", userRouter);
app.use("/api/v1/product",productRouter);
app.use("/api/v1/notification", notificationRouter);
app.use("/api/v1/chat",chatRouter);


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

