
import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getAvailableTemplates,
  createProjectFromTemplate,
} from "../services/template.service.js";

const router = Router();

router.use(authenticate);

router.get("/", (req, res) => {
  res.json({
    success: true,
    templates: getAvailableTemplates(),
  });
});

router.post("/create", async (req, res, next) => {
  try {
    const data = z.object({
      name: z.string().trim().min(1).max(100),
      description: z.string().trim().max(500).optional(),
      templateId: z.enum(["node", "react"]),
    }).parse(req.body);

    const project = await createProjectFromTemplate(
      req.user.id,
      data
    );

    res.status(201).json({
      success: true,
      message: "Project created from template",
      project,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
