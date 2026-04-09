import Team, { ITeam } from "../models/Team";
import User from "../models/User";
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
} from "../middleware/errorHandler";

export const createTeam = async (
  userId: string,
  input: { name: string; description?: string },
): Promise<ITeam> => {
  const { name, description } = input;

  if (!name) {
    throw new ValidationError("Team name is required");
  }

  const team = await Team.create({
    name,
    description,
    lead: userId,
    members: [userId],
  });

  return team.populate([
    { path: "lead", select: "-password" },
    { path: "members", select: "-password" },
  ]);
};

export const getTeams = async (userId: string) => {
  const teams = await Team.find({
    $or: [{ lead: userId }, { members: userId }],
  })
    .populate("lead", "-password")
    .populate("members", "-password")
    .sort({ createdAt: -1 });

  return teams;
};

export const getTeamById = async (
  teamId: string,
  userId: string,
): Promise<ITeam> => {
  const team = await Team.findById(teamId)
    .populate("lead", "-password")
    .populate("members", "-password")
    .populate("projects");

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (
    team.lead._id.toString() !== userId &&
    !team.members.some((m: any) => m._id.toString() === userId)
  ) {
    throw new ForbiddenError("You don't have access to this team");
  }

  return team;
};

export const updateTeam = async (
  teamId: string,
  userId: string,
  updates: Partial<ITeam>,
): Promise<ITeam> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.lead.toString() !== userId) {
    throw new ForbiddenError("Only team lead can update team");
  }

  const updatedTeam = await Team.findByIdAndUpdate(teamId, updates, {
    new: true,
    runValidators: true,
  })
    .populate("lead", "-password")
    .populate("members", "-password");

  if (!updatedTeam) {
    throw new NotFoundError("Team not found");
  }

  return updatedTeam;
};

export const deleteTeam = async (
  teamId: string,
  userId: string,
): Promise<void> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.lead.toString() !== userId) {
    throw new ForbiddenError("Only team lead can delete team");
  }

  await Team.findByIdAndDelete(teamId);
};

export const addTeamMember = async (
  teamId: string,
  userId: string,
  memberEmail: string,
): Promise<ITeam> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.lead.toString() !== userId) {
    throw new ForbiddenError("Only team lead can add members");
  }

  const member = await User.findOne({ email: memberEmail });
  if (!member) {
    throw new NotFoundError("User not found with that email");
  }

  if (team.members.some((m) => m.toString() === member._id.toString())) {
    throw new ValidationError("User is already a team member");
  }

  team.members.push(member._id as any);
  await team.save();

  return team.populate([
    { path: "lead", select: "-password" },
    { path: "members", select: "-password" },
  ]);
};

export const removeTeamMember = async (
  teamId: string,
  userId: string,
  memberId: string,
): Promise<ITeam> => {
  const team = await Team.findById(teamId);

  if (!team) {
    throw new NotFoundError("Team not found");
  }

  if (team.lead.toString() !== userId) {
    throw new ForbiddenError("Only team lead can remove members");
  }

  if (memberId === team.lead.toString()) {
    throw new ValidationError("Cannot remove team lead");
  }

  team.members = team.members.filter((m) => m.toString() !== memberId) as any;
  await team.save();

  return team.populate([
    { path: "lead", select: "-password" },
    { path: "members", select: "-password" },
  ]);
};
