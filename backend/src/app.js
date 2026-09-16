const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const animalRoutes = require("./routes/animalRoutes");
const reportRoutes = require("./routes/reportRoutes");
const adoptionRoutes = require("./routes/adoptionRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");
const messageRoutes = require("./routes/messageRoutes");
const adminRoutes = require("./routes/adminRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const flagRoutes = require("./routes/flagRoutes");
const assistantRoutes = require("./routes/assistantRoutes");
const visionRoutes = require("./routes/visionRoutes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Generous ceiling for normal usage, mainly there to blunt scripted abuse.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de requêtes, merci de réessayer dans quelques minutes." },
});

// Tighter limit on auth: this is what brute-force/credential-stuffing hits.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Trop de tentatives de connexion, merci de réessayer plus tard." },
});

app.use("/api", apiLimiter);
app.use("/api/auth", authLimiter);

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/animals", animalRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/adoptions", adoptionRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/flags", flagRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/vision", visionRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
