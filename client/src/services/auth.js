import api from "../lib/api";

export async function signup(data) {
  const response = await api.post("/auth/signup", data);

  localStorage.setItem("codespace_token", response.data.token);

  return response.data;
}

export async function login(data) {
  const response = await api.post("/auth/login", data);

  localStorage.setItem("codespace_token", response.data.token);

  return response.data;
}

export function logout() {
  localStorage.removeItem("codespace_token");
}