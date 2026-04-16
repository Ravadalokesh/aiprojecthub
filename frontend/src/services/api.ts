import axios, { AxiosInstance } from "axios";
import { APIResponse, User, Project, Task, Team } from "../types";

const normalizeApiBaseUrl = (url: string) => url.trim().replace(/\/+$/, "");

const ensureApiSuffix = (url: string) =>
  /\/api$/i.test(url) ? url : `${url}/api`;

const resolveApiBaseUrl = () => {
  const configuredApiUrl = String(import.meta.env.VITE_API_URL || "").trim();

  if (configuredApiUrl) {
    // Accept either full backend URL or direct /api path.
    if (configuredApiUrl.startsWith("/")) {
      return normalizeApiBaseUrl(configuredApiUrl);
    }

    return normalizeApiBaseUrl(ensureApiSuffix(configuredApiUrl));
  }

  if (import.meta.env.DEV) {
    return "/api";
  }

  console.warn(
    "VITE_API_URL is not set. Falling back to '/api'. Set VITE_API_URL in Vercel for production deployments.",
  );
  return "/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Use setTimeout to ensure state is cleared before redirect
      setTimeout(() => {
        if (!window.location.pathname.includes("/login")) {
          window.location.href = "/login";
        }
      }, 100);
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post<APIResponse<{ user: User; token: string }>>("/auth/signup", data),

  signin: (data: { email: string; password: string }) =>
    api.post<APIResponse<{ user: User; token: string }>>("/auth/signin", data),

  getCurrentUser: () => api.get<APIResponse<User>>("/auth/me"),

  logout: () => api.post<APIResponse<void>>("/auth/logout"),
};

export const projectAPI = {
  getProjects: () => api.get<APIResponse<Project[]>>("/projects"),

  getProject: (id: string) => api.get<APIResponse<Project>>(`/projects/${id}`),

  createProject: (data: Partial<Project>) =>
    api.post<APIResponse<Project>>("/projects", data),

  updateProject: (id: string, data: Partial<Project>) =>
    api.put<APIResponse<Project>>(`/projects/${id}`, data),

  deleteProject: (id: string) =>
    api.delete<APIResponse<void>>(`/projects/${id}`),

  addMember: (projectId: string, memberId: string) =>
    api.post<APIResponse<Project>>(`/projects/${projectId}/members`, {
      memberId,
    }),

  removeMember: (projectId: string, memberId: string) =>
    api.delete<APIResponse<Project>>(
      `/projects/${projectId}/members/${memberId}`,
    ),
};

export const taskAPI = {
  getTasks: (projectId: string, filter?: Record<string, string>) =>
    api.get<APIResponse<Task[]>>(`/tasks/projects/${projectId}`, {
      params: filter,
    }),

  getTask: (id: string) => api.get<APIResponse<Task>>(`/tasks/${id}`),

  createTask: (projectId: string, data: Partial<Task>) =>
    api.post<APIResponse<Task>>(`/tasks/projects/${projectId}`, data),

  updateTask: (id: string, data: Partial<Task>) =>
    api.put<APIResponse<Task>>(`/tasks/${id}`, data),

  deleteTask: (id: string) => api.delete<APIResponse<void>>(`/tasks/${id}`),

  addSubtask: (taskId: string, title: string) =>
    api.post<APIResponse<Task>>(`/tasks/${taskId}/subtasks`, { title }),
};

export const aiAPI = {
  parseTask: (description: string, projectContext: string) =>
    api.post<APIResponse<any>>("/ai/parse-task", {
      description,
      projectContext,
    }),

  getRecommendations: (projectId: string) =>
    api.get<APIResponse<any>>(`/ai/recommendations/${projectId}`),

  getPredictions: (projectId: string) =>
    api.get<APIResponse<any>>(`/ai/predictions/${projectId}`),

  getProjectHealth: (projectId: string) =>
    api.get<APIResponse<any>>(`/ai/health/${projectId}`),

  chat: (message: string, projectContext?: string) =>
    api.post<APIResponse<{ reply: string }>>("/ai/chat", {
      message,
      projectContext,
    }),
};

export const analyticsAPI = {
  getProjectAnalytics: (projectId: string) =>
    api.get<APIResponse<any>>(`/analytics/projects/${projectId}`),

  getTeamAnalytics: () => api.get<APIResponse<any>>("/analytics/team"),

  getProjectVelocity: (projectId: string, weeks?: number) =>
    api.get<APIResponse<any>>(`/analytics/velocity/${projectId}`, {
      params: { weeks },
    }),
};

export const teamAPI = {
  getTeams: () => api.get<APIResponse<Team[]>>("/teams"),

  getTeam: (id: string) => api.get<APIResponse<Team>>(`/teams/${id}`),

  createTeam: (data: { name: string; description?: string }) =>
    api.post<APIResponse<Team>>("/teams", data),

  updateTeam: (id: string, data: Partial<Team>) =>
    api.put<APIResponse<Team>>(`/teams/${id}`, data),

  deleteTeam: (id: string) => api.delete<APIResponse<void>>(`/teams/${id}`),

  addMember: (teamId: string, email: string) =>
    api.post<APIResponse<Team>>(`/teams/${teamId}/members`, { email }),

  removeMember: (teamId: string, memberId: string) =>
    api.delete<APIResponse<Team>>(`/teams/${teamId}/members/${memberId}`),
};

export default api;
