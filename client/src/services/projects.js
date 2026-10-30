import api from "../lib/api";

export async function getProjects() {
  const response = await api.get("/projects");
  return response.data.projects;
}

export async function createProject(data) {
  const response = await api.post("/projects", data);
  return response.data.project;
}

export async function deleteProject(projectId) {
  const response = await api.delete(`/projects/${projectId}`);
  return response.data;
}