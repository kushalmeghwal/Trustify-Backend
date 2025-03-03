//import express and make an app structure
const express = require("express");
const app = express();

//import configuration
require('dotenv').config();
const PORT=process.env.PORT;

//middleware to parse
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


//mount the route
const userRouter = require("./Routes/userRoute");
const productRouter = require("./Routes/productRoute")

app.use("/api/v1", userRouter);
app.use("api/v1/product",productRouter);

//start the server
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});

// Ensure driver is closed on process exit
process.on("SIGINT", async () => {
  //  await neo4jDriver.close();
    console.log("Neo4j driver connection closed.");
    process.exit(0);
});

