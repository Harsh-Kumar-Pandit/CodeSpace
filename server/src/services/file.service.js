import prisma from "../config/prisma.js";

export async function getProjectFiles(userId, projectId) {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
    select: { id: true },
  });

  if (!project) return null;

  return prisma.projectFile.findMany({
    where: { projectId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });
}

export async function createProjectFile(
  userId,
  projectId,
  { name, type, content = null, parentId = null }
) {
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.findFirst({
      where: { id: projectId, ownerId: userId },
      select: { id: true },
    });

    if (!project) {
      const error = new Error("Project not found");
      error.statusCode = 404;
      throw error;
    }

    if (parentId) {
      const parent = await tx.projectFile.findFirst({
        where: { id: parentId, projectId },
      });

      if (!parent || parent.type !== "FOLDER") {
        const error = new Error("Parent folder not found");
        error.statusCode = 400;
        throw error;
      }
    }

    const duplicate = await tx.projectFile.findFirst({
      where: { projectId, parentId, name },
    });

    if (duplicate) {
      const error = new Error("A file or folder with this name already exists");
      error.statusCode = 409;
      throw error;
    }

    return tx.projectFile.create({
      data: {
        projectId,
        parentId,
        name,
        type,
        content: type === "FILE" ? content ?? "" : null,
      },
    });
  });
}

export async function readProjectFile(userId, projectId, fileId) {
  return prisma.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
      project: { ownerId: userId },
      type: "FILE",
    },
  });
}

export async function updateProjectFile(
  userId,
  projectId,
  fileId,
  content
) {
  const file = await readProjectFile(userId, projectId, fileId);

  if (!file) return null;

  return prisma.projectFile.update({
    where: { id: fileId },
    data: { content },
  });
}

export async function deleteProjectFile(userId, projectId, fileId) {
  const node = await prisma.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
      project: { ownerId: userId },
    },
  });

  if (!node) return false;

  await prisma.projectFile.delete({
    where: { id: fileId },
  });

  return true;
}

export async function renameProjectFile(
  userId,
  projectId,
  fileId,
  newName
) {
  const node = await prisma.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
      project: { ownerId: userId },
    },
  });

  if (!node) {
    return null;
  }

  const duplicate = await prisma.projectFile.findFirst({
    where: {
      projectId,
      parentId: node.parentId,
      name: newName,
      NOT: { id: fileId },
    },
  });

  if (duplicate) {
    const error = new Error(
      "A file or folder with this name already exists"
    );
    error.statusCode = 409;
    throw error;
  }

  return prisma.projectFile.update({
    where: { id: fileId },
    data: { name: newName },
  });
}