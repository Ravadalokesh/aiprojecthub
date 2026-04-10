import Task, { ITask } from "../models/Task";
import Project from "../models/Project";
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../middleware/errorHandler";

const hasProjectAccess = (
  project: {
    owner: { toString(): string };
    members: Array<{ toString(): string }>;
  },
  userId: string,
) =>
  project.owner.toString() === userId ||
  project.members.some((member) => member.toString() === userId);

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: string;
  dueDate?: Date;
  estimatedHours?: number;
  assignee?: string;
}

export const createTask = async (
  projectId: string,
  userId: string,
  input: CreateTaskInput,
): Promise<ITask> => {
  const { title, description, priority, dueDate, estimatedHours, assignee } =
    input;

  if (!title) {
    throw new ValidationError("Task title is required");
  }

  // Check project access
  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this project");
  }

  const task = await Task.create({
    title,
    description,
    projectId,
    priority,
    dueDate,
    estimatedHours,
    assignee,
    createdBy: userId,
  });

  return (await Task.findById(task._id).populate("assignee", "-password"))!;
};

export const getTasks = async (
  projectId: string,
  userId: string,
  filter?: Record<string, unknown>,
) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this project");
  }

  const query: Record<string, unknown> = { projectId };

  if (filter?.status) {
    query.status = filter.status;
  }

  if (filter?.priority) {
    query.priority = filter.priority;
  }

  if (filter?.assignee) {
    query.assignee = filter.assignee;
  }

  const tasks = await Task.find(query)
    .populate("assignee", "-password")
    .populate("createdBy", "-password")
    .sort({ createdAt: -1 });

  return tasks;
};

export const getTaskById = async (
  taskId: string,
  userId: string,
): Promise<ITask> => {
  const task = await Task.findById(taskId)
    .populate("assignee", "-password")
    .populate("createdBy", "-password");

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  // Check project access
  const project = await Project.findById(task.projectId);
  if (!project || !hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this task");
  }

  return task;
};

export const updateTask = async (
  taskId: string,
  userId: string,
  updates: Partial<ITask>,
): Promise<ITask> => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  // Check project access
  const project = await Project.findById(task.projectId);
  if (!project || !hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this task");
  }

  const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
    new: true,
    runValidators: true,
  })
    .populate("assignee", "-password")
    .populate("createdBy", "-password");

  if (!updatedTask) {
    throw new NotFoundError("Task not found");
  }

  return updatedTask;
};

export const deleteTask = async (
  taskId: string,
  userId: string,
): Promise<void> => {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new NotFoundError("Task not found");
  }

  // Check project access
  const project = await Project.findById(task.projectId);
  if (!project || !hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this task");
  }

  await Task.findByIdAndDelete(taskId);
};

export const addSubtask = async (
  taskId: string,
  userId: string,
  subtaskTitle: string,
) => {
  if (!subtaskTitle || !subtaskTitle.trim()) {
    throw new ValidationError("Subtask title is required");
  }

  const task = await Task.findById(taskId);
  if (!task) {
    throw new NotFoundError("Task not found");
  }

  const project = await Project.findById(task.projectId);
  if (!project || !hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this task");
  }

  task.subtasks.push({
    title: subtaskTitle.trim(),
    completed: false,
    createdAt: new Date(),
  } as any);

  await task.save();
  return (await Task.findById(task._id)
    .populate("assignee", "-password")
    .populate("createdBy", "-password"))!;
};
