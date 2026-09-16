require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const usersRoutes = require("./routes/users.routes");
const itemsRoutes = require("./routes/items.routes");
const adminRoutes = require("./routes/admin.routes");

const {
  findUserByEmail,
  createUser,
} = require("./data/userStore");

const path = require("path");
const categoriesRoutes = require("./routes/categories.routes");
const claimsRoutes = require("./routes/claims.routes");
const conversationsRoutes = require("./routes/conversations.routes");
const uploadsRoutes = require("./routes/uploads.routes");

const app = express();

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use(cors());

// Serve static uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Mount API Routes
app.use("/api/claims", claimsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/conversations", conversationsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/uploads", uploadsRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "LostLink API is running",
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, phone, password } = req.body;

  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return res.status(409).json({
      message: "Email already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    phone,
    password: hashedPassword,
    role: "User",
    status: "Active",
    avatar: "",
  };

  await createUser(newUser);

  const { password: _, ...safeUser } = newUser;

  res.status(201).json({
    message: "Registration successful",
    user: safeUser,
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const user = await findUserByEmail(email);

  if (!user) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  let passwordMatches = false;

  if (user.password && user.password.startsWith("$2")) {
    try {
      passwordMatches = await bcrypt.compare(
        password,
        user.password
      );
    } catch (e) {
      console.log("bcrypt compare error:", e.message);
    }
  }

  if (!passwordMatches && user.password) {
    passwordMatches = user.password === password;
  }

  if (!passwordMatches) {
    return res.status(401).json({
      message: "Invalid email or password",
    });
  }

  if (user.status === "Suspended") {
    return res.status(403).json({
      message: "Your account has been suspended",
    });
  }

  const { password: _, ...safeUser } = user;

  res.status(200).json({
    message: "Login successful",
    user: safeUser,
  });
});

app.post(
  "/api/auth/forgot-password",
  async (req, res) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Valid email is required",
      });
    }

    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset request has been created.",
    });
  }
);

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`LostLink server is running on port ${PORT}`);
});