import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT || 5000),
  FRONTEND_ORIGIN:
    process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  NODE_ENV: process.env.NODE_ENV || "development",
};