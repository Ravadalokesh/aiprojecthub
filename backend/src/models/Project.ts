import mongoose, { Schema, Document } from "mongoose";

export interface IProject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  code: string;
  status: "planning" | "active" | "on-hold" | "completed" | "archived";
  owner: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  members: mongoose.Types.ObjectId[];
  startDate: Date;
  endDate?: Date;
  actualEndDate?: Date;
  budget?: number;
  settings: {
    aiRecommendations: boolean;
    automationEnabled: boolean;
    notificationsEnabled: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Please provide a project name"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      match: [/^[A-Z0-9]{3,10}$/, "Project code must be 3-10 uppercase alphanumerics"],
    },
    status: {
      type: String,
      enum: ["planning", "active", "on-hold", "completed", "archived"],
      default: "planning",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: "Team",
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    actualEndDate: {
      type: Date,
    },
    budget: {
      type: Number,
      min: 0,
    },
    settings: {
      aiRecommendations: {
        type: Boolean,
        default: true,
      },
      automationEnabled: {
        type: Boolean,
        default: true,
      },
      notificationsEnabled: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for better query performance
projectSchema.index({ owner: 1, team: 1 });
projectSchema.index({ status: 1 });

export default mongoose.model<IProject>("Project", projectSchema);
