import Project, { IProject } from "../models/Project";
import User from "../models/User";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../middleware/errorHandler";

export interface CreateProjectInput {
  name: string;
  description?: string;
  code: string;
  endDate?: Date;
  budget?: number;
  teamId?: string;
}

export const createProject = async (
  userId: string,
  input: CreateProjectInput,
): Promise<IProject> => {
  const { name, description, code, endDate, budget, teamId } = input;

  if (!name || !code) {
    throw new ValidationError("Project name and code are required");
  }

  // Check if code is unique
  const existingProject = await Project.findOne({ code: code.toUpperCase() });
  if (existingProject) {
    throw new ValidationError("Project code already exists");
  }

  const project = await Project.create({
    name,
    description,
    code: code.toUpperCase(),
    endDate,
    budget,
    owner: userId,
    team: teamId,
    members: [userId],
    settings: {
      aiRecommendations: true,
      automationEnabled: true,
      notificationsEnabled: true,
    },
  });

  // Add project to user
  await User.findByIdAndUpdate(userId, {
    $push: { projects: project._id },
  });

  return project;
};

export const getProjects = async (
  userId: string,
  filter?: Record<string, unknown>,
) => {
  const query: Record<string, unknown> = {
    $or: [{ owner: userId }, { members: userId }],
  };

  if (filter?.status) {
    query.status = filter.status;
  }

  const projects = await Project.find(query)
    .populate("owner", "-password")
    .populate("members", "-password")
    .sort({ createdAt: -1 });

  return projects;
};

export const getProjectById = async (
  projectId: string,
  userId: string,
): Promise<IProject> => {
  const project = await Project.findById(projectId)
    .populate("owner", "-password")
    .populate("members", "-password");

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Check if user has access
  if (
    project.owner._id.toString() !== userId &&
    !project.members.some((m) => m._id.toString() === userId)
  ) {
    throw new ForbiddenError("You don't have access to this project");
  }

  return project;
};

export const updateProject = async (
  projectId: string,
  userId: string,
  updates: Partial<IProject>,
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  // Check if user is owner or manager
  if (project.owner.toString() !== userId) {
    throw new ForbiddenError("Only project owner can update project");
  }

  const updatedProject = await Project.findByIdAndUpdate(projectId, updates, {
    new: true,
    runValidators: true,
  })
    .populate("owner", "-password")
    .populate("members", "-password");

  if (!updatedProject) {
    throw new NotFoundError("Project not found");
  }

  return updatedProject;
};

export const deleteProject = async (
  projectId: string,
  userId: string,
): Promise<void> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.owner.toString() !== userId) {
    throw new ForbiddenError("Only project owner can delete project");
  }

  await Project.findByIdAndDelete(projectId);
};

export const addProjectMember = async (
  projectId: string,
  userId: string,
  memberId: string,
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.owner.toString() !== userId) {
    throw new ForbiddenError("Only project owner can add members");
  }

  // Check if member already exists
  if (project.members.some((m) => m.toString() === memberId)) {
    throw new ValidationError("Member already added to project");
  }

  project.members.push(memberId as any);
  await project.save();

  // Add project to user
  await User.findByIdAndUpdate(memberId, {
    $push: { projects: projectId },
  });

  return project;
};

export const removeProjectMember = async (
  projectId: string,
  userId: string,
  memberId: string,
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (project.owner.toString() !== userId) {
    throw new ForbiddenError("Only project owner can remove members");
  }

  project.members = project.members.filter((m) => m.toString() !== memberId);
  await project.save();

  // Remove project from user
  await User.findByIdAndUpdate(memberId, {
    $pull: { projects: projectId },
  });

  return project;
};
