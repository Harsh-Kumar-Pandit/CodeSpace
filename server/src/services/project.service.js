import prisma from "../config/prisma.js";

export async function createProject(userId, { name, description }) {
  return prisma.project.create({
    data: {
      name,
      description,
      ownerId: userId,
    },
  });
}

export async function getProjects(userId) {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProjectById(userId, projectId) {
  return prisma.project.findFirst({
    where: {
      id: projectId,
      ownerId: userId,
    },
  });
}

export async function updateProject(userId, projectId, data) {
  const project = await getProjectById(userId, projectId);

  if (!project) return null;

  return prisma.project.update({
    where: { id: projectId },
    data,
  });
}

export async function deleteProject(userId, projectId) {
  const project = await getProjectById(userId, projectId);

  if (!project) return false;

  await prisma.project.delete({
    where: { id: projectId },
  });

  return true;
}