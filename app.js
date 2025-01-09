const express = require("express");
const app = express();

const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const userRouter = require("./Routes/userRoute");
app.use("/", userRouter);

app.listen(PORT, () => {
    console.log(`Server is successfully running on port ${PORT}`);
});
