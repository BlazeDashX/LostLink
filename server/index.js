const express = require("express");
const cors = require("cors");
const { findUserByEmail, createUser } = require("./data/userStore");

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.json({
    message: "LostLink API is running",
  });
});

app.post("/api/auth/register", (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const existingUser = findUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({
      message: "Email already exists",
    });
  }

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    password,
    role: "User",
    status: "Active",
    avatar: "",
  };

  createUser(newUser);

  res.status(201).json({
    message: "Registration successful",
    user: newUser,
  });
});

app.listen(3000, () => {
  console.log("LostLink server is running on port 3000");
});