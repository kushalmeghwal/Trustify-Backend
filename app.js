//import express and make an app structure
const express = require("express");
const app = express();

//import configuration
require('dotenv').config();
const PORT=process.env.PORT || 3000;

//middleware to parse
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Connect to the Neo4j database
const {connectNeo4j}=require('./config/database');
try {
    connectNeo4j();
} catch (error) {
    console.error("Failed to connect to the Neo4j database:", error.message);
    process.exit(1); // Exit the process if the database connection fails
}


//mount the route
const userRouter = require("./Routes/userRoute");
app.use("/api/v1", userRouter);

//start the server
app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});

// Ensure driver is closed on process exit
process.on("SIGINT", async () => {
    await neo4jDriver.close();
    console.log("Neo4j driver connection closed.");
    process.exit(0);
});