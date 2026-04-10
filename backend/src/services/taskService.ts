import Task, { ITask } from "../models/Task";
import Project from "../models/Project";
import Team from "../models/Team";
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
  status?: string;
  dueDate?: Date;
  estimatedHours?: number;
  assignee?: string;
}

const isProjectOwner = (
  project: {
    owner: { toString(): string };
  },
  userId: string,
) => project.owner.toString() === userId;

const isTaskVisibleToUser = (
  task: {
    assignee?: { toString(): string } | null;
  },
  userId: string,
) => !!task.assignee && task.assignee.toString() === userId;

const isAssigneeInProject = (
  project: {
    owner: { toString(): string };
    members: Array<{ toString(): string }>;
  },
  assigneeId: string,
) =>
  project.owner.toString() === assigneeId ||
  project.members.some((member) => member.toString() === assigneeId);

const isAssigneeInLinkedTeam = async (
  project: {
    team?: { toString(): string } | null;
  },
  assigneeId: string,
) => {
  if (!project.team) {
    return false;
  }

  const team = await Team.findById(project.team).select("lead members");
  if (!team) {
    return false;
  }

  return (
    team.lead.toString() === assigneeId ||
    team.members.some((member) => member.toString() === assigneeId)
  );
};

const canAssignToUser = async (
  project: {
    owner: { toString(): string };
    members: Array<{ toString(): string }>;
    team?: { toString(): string } | null;
  },
  assigneeId: string,
) => {
  if (isAssigneeInProject(project, assigneeId)) {
    return true;
  }

  return isAssigneeInLinkedTeam(project, assigneeId);
};

const ensureProjectMember = async (projectId: string, assigneeId: string) => {
  await Project.findByIdAndUpdate(projectId, {
    $addToSet: { members: assigneeId },
  });
};

export const createTask = async (
  projectId: string,
  userId: string,
  input: CreateTaskInput,
): Promise<ITask> => {
  const {
    title,
    description,
    priority,
    status,
    dueDate,
    estimatedHours,
    assignee,
  } = input;

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

  const owner = isProjectOwner(project, userId);
  const normalizedAssignee = assignee?.trim() || "";
  const resolvedAssignee = normalizedAssignee || (!owner ? userId : undefined);

  if (resolvedAssignee && !(await canAssignToUser(project, resolvedAssignee))) {
    throw new ValidationError("Assignee must be a member of this project");
  }

  if (resolvedAssignee) {
    await ensureProjectMember(projectId, resolvedAssignee);
  }

  const task = await Task.create({
    title,
    description,
    projectId,
    priority,
    status,
    dueDate,
    estimatedHours,
    assignee: resolvedAssignee,
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

  const owner = isProjectOwner(project, userId);

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

  if (!owner) {
    query.assignee = userId;
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

  if (!isProjectOwner(project, userId) && !isTaskVisibleToUser(task, userId)) {
    throw new ForbiddenError("You can only view tasks assigned to you");
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

  const owner = isProjectOwner(project, userId);

  if (!owner && !isTaskVisibleToUser(task, userId)) {
    throw new ForbiddenError("You can only update tasks assigned to you");
  }

  if (!owner && updates.assignee && updates.assignee.toString() !== userId) {
    throw new ForbiddenError("Only project owner can reassign tasks");
  }

  if (
    updates.assignee &&
    !(await canAssignToUser(project, updates.assignee.toString()))
  ) {
    throw new ValidationError("Assignee must be a member of this project");
  }

  if (updates.assignee) {
    await ensureProjectMember(
      project._id.toString(),
      updates.assignee.toString(),
    );
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

  if (!isProjectOwner(project, userId)) {
    throw new ForbiddenError("Only project owner can delete tasks");
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

  if (!isProjectOwner(project, userId) && !isTaskVisibleToUser(task, userId)) {
    throw new ForbiddenError(
      "You can only update subtasks for tasks assigned to you",
    );
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
