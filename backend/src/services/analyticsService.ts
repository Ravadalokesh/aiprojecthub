import Task from "../models/Task";
import Project from "../models/Project";
import User from "../models/User";
import { NotFoundError, ForbiddenError } from "../middleware/errorHandler";

const resolveId = (value: unknown) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "_id" in value) {
    const withId = value as { _id?: string | { toString(): string } };
    if (!withId._id) return "";
    return typeof withId._id === "string" ? withId._id : withId._id.toString();
  }
  if (typeof value === "object" && "toString" in value) {
    const objectIdLike = value as { toString(): string };
    return objectIdLike.toString();
  }
  return "";
};

const hasProjectAccess = (
  project: {
    owner: { toString(): string };
    members: Array<{ toString(): string }>;
  },
  userId: string,
) =>
  project.owner.toString() === userId ||
  project.members.some((member) => member.toString() === userId);

export const getProjectAnalytics = async (
  projectId: string,
  userId: string,
) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this project");
  }

  const tasks = await Task.find({ projectId }).populate("assignee");

  // Task metrics
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "in-progress",
  ).length;
  const inReviewTasks = tasks.filter((t) => t.status === "in-review").length;
  const backlogTasks = tasks.filter((t) => t.status === "backlog").length;
  const totalTasks = tasks.length;

  // Time metrics
  const estimatedHours = tasks.reduce(
    (sum, t) => sum + (t.estimatedHours || 0),
    0,
  );
  const actualHours = tasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
  const variance =
    estimatedHours > 0
      ? ((actualHours - estimatedHours) / estimatedHours) * 100
      : 0;

  // Risk metrics
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done",
  ).length;

  const atRiskTasks = tasks.filter((t) => {
    if (t.status === "done" || !t.dueDate) return false;
    const daysUntilDue = Math.ceil(
      (t.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilDue <= 2;
  }).length;

  // Project health score
  const healthScore = Math.min(
    100,
    Math.max(0, 100 - (overdueTasks * 5 + atRiskTasks * 3)),
  );

  // Priority breakdown
  const priorityBreakdown = {
    critical: tasks.filter((t) => t.priority === "critical").length,
    high: tasks.filter((t) => t.priority === "high").length,
    medium: tasks.filter((t) => t.priority === "medium").length,
    low: tasks.filter((t) => t.priority === "low").length,
  };

  // Team performance
  const memberIds = Array.from(
    new Set([
      project.owner.toString(),
      ...project.members.map((m) => m.toString()),
    ]),
  );

  const teamMembers = await User.find({
    _id: { $in: memberIds },
  });

  const teamPerformance = teamMembers.map((member) => {
    const memberTasks = tasks.filter(
      (t) => resolveId(t.assignee) === member._id.toString(),
    );
    return {
      name: member.name,
      tasksCompleted: memberTasks.filter((t) => t.status === "done").length,
      hoursLogged: memberTasks.reduce(
        (sum, t) => sum + (Number(t.actualHours) || 0),
        0,
      ),
    };
  });

  return {
    projectHealth: {
      healthScore: Math.round(healthScore),
      status:
        healthScore >= 70
          ? "healthy"
          : healthScore >= 40
            ? "at-risk"
            : "critical",
    },
    taskMetrics: {
      totalTasks,
      completedTasks,
      todoTasks,
      inProgressTasks,
      inReviewTasks,
      backlogTasks,
    },
    timeMetrics: {
      estimatedHours,
      actualHours,
      variance: Math.round(variance * 10) / 10,
    },
    riskMetrics: {
      overdueTasks,
      atRiskTasks,
      estimationAccuracy:
        estimatedHours > 0
          ? Math.round((1 - Math.abs(variance) / 100) * 100)
          : 100,
    },
    priorityBreakdown,
    teamPerformance,
  };
};

export const getTeamAnalytics = async (userId: string) => {
  const user = await User.findById(userId).populate("projects");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const userProjects = user.projects as any[];

  const allTasks: any = [];
  let totalProjects = userProjects.length;

  for (const project of userProjects) {
    const tasks = await Task.find({ projectId: project._id });
    allTasks.push(...tasks);
  }

  const completedProjects = (user.projects as any[]).filter(
    (p: any) => p.status === "completed",
  ).length;

  return {
    totalProjects,
    completedProjects,
    activeProjects: totalProjects - completedProjects,
    totalTasks: allTasks.length,
    completedTasks: allTasks.filter((t: any) => t.status === "done").length,
    inProgressTasks: allTasks.filter((t: any) => t.status === "in-progress")
      .length,
  };
};

// Calculate velocity based on completed tasks over time
export const getProjectVelocity = async (
  projectId: string,
  userId: string,
  weeks: number = 5,
) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError("Project not found");
  }

  if (!hasProjectAccess(project, userId)) {
    throw new ForbiddenError("You don't have access to this project");
  }

  const tasks = await Task.find({ projectId });

  const velocity: Array<{
    week: string;
    tasks: number;
    hours: number;
  }> = [];

  const now = new Date();

  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - i * 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekTasks = tasks.filter(
      (t) =>
        t.updatedAt >= weekStart &&
        t.updatedAt <= weekEnd &&
        t.status === "done",
    );

    velocity.push({
      week: `Week ${weeks - i}`,
      tasks: weekTasks.length,
      hours: weekTasks.reduce(
        (sum, t) => sum + (Number(t.actualHours) || 0),
        0,
      ),
    });
  }

  return velocity;
};
