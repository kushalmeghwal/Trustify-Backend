//import express and make an app structure
import express, { urlencoded, json } from "express";
const app = express();

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

//mount the route
import userRouter from "./Routes/userRoute.js";
import productRouter from "./Routes/productRoute.js";

app.use("/api/v1", userRouter);
app.use("/api/v1/product",productRouter);

//start the server
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});
//import neo4j driver
import { neo4jDriver } from "./config/database.js";
// Ensure driver is closed on process exit
process.on("SIGINT", async () => {
  await neo4jDriver.close();
  console.log("\nNeo4j connection closed. byee!!");
  process.exit(0);
});

