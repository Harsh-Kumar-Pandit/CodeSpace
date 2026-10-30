import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getProjectFiles,
  createProjectFile,
  readProjectFile,
  updateProjectFile,
  deleteProjectFile,
} from "../services/file.service.js";
import prisma from "../config/prisma.js";
import { renameProjectFile } from "../services/file.service.js";

const router = Router({ mergeParams: true });

router.use(authenticate);

const createSchema = z.object({
  name: z.string().trim().min(1).max(255)
    .refine((name) => !/[\\/]/.test(name), "Name cannot contain slashes"),
  type: z.enum(["FILE", "FOLDER"]),
  content: z.string().max(500_000).optional(),
  parentId: z.string().nullable().optional(),
}).superRefine((data, ctx) => {
  if (data.type === "FOLDER" && data.content !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["content"],
      message: "Folders cannot have file content",
    });
  }
});

router.get("/", async (req, res, next) => {
  try {
    const files = await getProjectFiles(
      req.user.id,
      req.params.projectId
    );

    if (!files) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.json({ success: true, files });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const file = await createProjectFile(
      req.user.id,
      req.params.projectId,
      data
    );

    res.status(201).json({ success: true, file });
  } catch (error) {
    next(error);
  }
});

router.get("/:fileId", async (req, res, next) => {
  try {
    const file = await readProjectFile(
      req.user.id,
      req.params.projectId,
      req.params.fileId
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File not found",
      });
    }

    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
});

router.patch("/:fileId", async (req, res, next) => {
  try {
    const { content, revision } = z.object({
      content: z.string().max(500_000),
      revision: z.number().int().positive(),
    }).parse(req.body);

    const result = await prisma.projectFile.updateMany({
      where: {
        id: req.params.fileId,
        projectId: req.params.projectId,
        project: { ownerId: req.user.id },
        type: "FILE",
        revision,
      },
      data: {
        content,
        revision: { increment: 1 },
      },
    });

    if (result.count === 0) {
      const file = await prisma.projectFile.findFirst({
        where: {
          id: req.params.fileId,
          projectId: req.params.projectId,
          project: { ownerId: req.user.id },
          type: "FILE",
        },
        select: { id: true, revision: true },
      });

      if (!file) {
        return res.status(404).json({
          success: false,
          message: "File not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: "File changed since you last read it. Fetch the latest version before saving.",
        currentRevision: file.revision,
      });
    }

    const file = await prisma.projectFile.findUnique({
      where: { id: req.params.fileId },
    });

    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
});

router.patch("/:fileId/rename", async (req, res, next) => {
  try {
    const { name } = z.object({
      name: z.string()
        .trim()
        .min(1)
        .max(255)
        .refine(
          (value) => !/[\\/]/.test(value),
          "Name cannot contain slashes"
        ),
    }).parse(req.body);

    const file = await renameProjectFile(
      req.user.id,
      req.params.projectId,
      req.params.fileId,
      name
    );

    if (!file) {
      return res.status(404).json({
        success: false,
        message: "File or folder not found",
      });
    }

    res.json({ success: true, file });
  } catch (error) {
    next(error);
  }
});

router.delete("/:fileId", async (req, res, next) => {
  try {
    const deleted = await deleteProjectFile(
      req.user.id,
      req.params.projectId,
      req.params.fileId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "File or folder not found",
      });
    }

    res.json({
      success: true,
      message: "File or folder deleted successfully",
    });
  } catch (error) {
    next(error);
  }
});

export default router;