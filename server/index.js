const express = require("express");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "LostLink API is running",
  });
});

app.listen(3000, () => {
  console.log("LostLink server is running on port 3000");
});