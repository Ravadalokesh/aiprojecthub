export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin" | "manager";
  avatar?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  code: string;
  status: "planning" | "active" | "on-hold" | "completed" | "archived";
  owner: User;
  members: User[];
  startDate: Date;
  endDate?: Date;
  budget?: number;
  settings: {
    aiRecommendations: boolean;
    automationEnabled: boolean;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  _id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  projectId: string;
  assignee?: User;
  priority: "low" | "medium" | "high" | "critical";
  status: "backlog" | "todo" | "in-progress" | "in-review" | "done";
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  dependencies: string[];
  subtasks: Subtask[];
  tags: string[];
  createdBy: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  _id: string;
  name: string;
  description?: string;
  lead: User;
  members: User[];
  createdAt: Date;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

export interface ProjectsState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  error: string | null;
}

export interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  loading: boolean;
  error: string | null;
  filter: {
    status?: string;
    priority?: string;
    assignee?: string;
  };
}

export interface AIInsight {
  _id: string;
  type: "recommendation" | "prediction" | "warning";
  title: string;
  content: string;
  confidence: number;
  actionRequired: boolean;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
