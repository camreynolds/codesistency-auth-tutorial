//const express = requires("express");
import express from "express";
import "./config/env.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";

import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpecification } from "./config/swagger.js";

// Fail fast if the JWT signing secret is missing or too weak, so tokens are
// never signed with a guessable secret.
if (
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32 ||
  process.env.JWT_SECRET === "replace_with_a_random_48_byte_hex_string"
) {
  throw new Error(
    "JWT_SECRET must be set to a random string of at least 32 characters (use crypto.randomBytes(48) to generate one)."
  );
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, ...).
app.use(helmet());

// CORS configuration - use CLIENT_URL from env or default to localhost:5173
app.use(cors({origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true}));

app.use(express.json()); // allows us to parse incoming request:req.body  
app.use(cookieParser()); // allows us to parse incoming cookies.

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerSpecification);
});
app.use(
  "/api-docs",
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:"],
        fontSrc: ["'self'", "data:"],
        connectSrc: ["'self'"],
      },
    },
  }),
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpecification, {
    swaggerOptions: { persistAuthorization: true },
  })
);

app.use("/api/auth/", authRoutes);

await connectDB();
app.listen(PORT,()=>{
  console.log("Server is running on port:",PORT);
});