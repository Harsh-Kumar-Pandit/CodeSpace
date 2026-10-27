import { Router } from "express";
import { z } from "zod";
import { signup, login } from "../services/auth.service.js";

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  email: z.string().trim().email().transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});

router.post("/signup", async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const result = await signup(data);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const data = loginSchema.parse(req.body);
    const result = await login(data);

    res.status(200).json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

export default router;