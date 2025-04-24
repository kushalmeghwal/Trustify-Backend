//import express and make an app structure
import express, { urlencoded, json } from "express";
const app = express();

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

//import socket
import socketHandler from "./socket/socket.js";

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

socketHandler(io); 

//mount the route
import userRouter from "./Routes/userRoute.js";
import productRouter from "./Routes/productRoute.js";

app.use("/api/v1", userRouter);
app.use("/api/v1/product",productRouter);

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

