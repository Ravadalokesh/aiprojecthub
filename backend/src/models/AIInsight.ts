import mongoose, { Schema, Document } from "mongoose";

export interface IAIInsight extends Document {
  _id: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  taskId?: mongoose.Types.ObjectId;
  type: "recommendation" | "prediction" | "warning" | "suggestion";
  category: string;
  title: string;
  content: string;
  confidence: number;
  actionRequired: boolean;
  action?: {
    type: string;
    data: Record<string, unknown>;
  };
  userFeedback?: "helpful" | "not-helpful" | "neutral";
  isRead: boolean;
  isActioned: boolean;
  createdAt: Date;
  expiresAt: Date;
}

const aiInsightSchema = new Schema<IAIInsight>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    type: {
      type: String,
      enum: ["recommendation", "prediction", "warning", "suggestion"],
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "task-recommendation",
        "timeline-prediction",
        "resource-optimization",
        "risk-warning",
        "workflow-suggestion",
      ],
    },
    title: {
      type: String,
      required: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, "Content cannot exceed 2000 characters"],
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    actionRequired: {
      type: Boolean,
      default: false,
    },
    action: {
      type: {
        type: String,
      },
      data: Schema.Types.Mixed,
    },
    userFeedback: {
      type: String,
      enum: ["helpful", "not-helpful", "neutral"],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isActioned: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired insights
aiInsightSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
aiInsightSchema.index({ projectId: 1, type: 1 });

export default mongoose.model<IAIInsight>("AIInsight", aiInsightSchema);
