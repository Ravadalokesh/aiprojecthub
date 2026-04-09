import jwt from "jsonwebtoken";
import User from "../models/User";
import { ValidationError } from "../middleware/errorHandler";
import { env } from "../config/env";

export interface SignUpInput {
  name: string;
  email: string;
  password: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export const generateToken = (userId: string, role: string): string =>
  jwt.sign({ userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpire,
  } as jwt.SignOptions);

export const signUp = async (input: SignUpInput) => {
  const name = input.name?.trim();
  const email = input.email?.trim().toLowerCase();
  const password = input.password?.trim();

  if (!email || !password || !name) {
    throw new ValidationError("Name, email, and password are required");
  }

  if (name.length < 2 || name.length > 50) {
    throw new ValidationError("Name must be between 2 and 50 characters");
  }

  if (password.length < 8) {
    throw new ValidationError("Password must be at least 8 characters");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ValidationError("Email already registered");
  }

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = generateToken(user._id.toString(), user.role);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    token,
  };
};

export const signIn = async (input: SignInInput) => {
  const email = input.email?.trim().toLowerCase();
  const password = input.password?.trim();

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ValidationError("Invalid email or password");
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new ValidationError("Invalid email or password");
  }

  const token = generateToken(user._id.toString(), user.role);

  return {
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
    token,
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await User.findById(userId)
    .populate("teams")
    .populate("projects");

  if (!user) {
    throw new ValidationError("User not found");
  }

  return user;
};
