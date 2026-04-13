import Task from "../models/Task";
import Project from "../models/Project";
import AIInsight from "../models/AIInsight";
import { NotFoundError } from "../middleware/errorHandler";

const OPENROUTER_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";
const OPENROUTER_TIMEOUT_MS = 20000;

type AIProvider = "openrouter";

interface AIErrorInfo {
  kind: "quota" | "rate-limit" | "auth" | "network" | "unknown";
  status?: number;
  retryAfterSeconds?: number;
  message: string;
  provider?: AIProvider;
}

interface AITextResult {
  text: string | null;
  error: AIErrorInfo | null;
  provider: AIProvider;
}

const getOpenRouterConfig = () => {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL?.trim() || OPENROUTER_MODEL,
  };
};

const cleanJsonResponse = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

const extractRetryAfterSeconds = (error: any) => {
  const retryAfterHeader =
    error?.retryAfter || error?.headers?.get?.("retry-after");
  if (typeof retryAfterHeader === "string" && /^\d+$/.test(retryAfterHeader)) {
    return Number(retryAfterHeader);
  }

  const message =
    typeof error?.message === "string" && error.message.trim()
      ? error.message
      : "";
  const match = message.match(/retry in\s+(\d+(?:\.\d+)?)s/i);
  return match ? Math.ceil(Number(match[1])) : undefined;
};

const normalizeAIError = (error: any, provider: AIProvider): AIErrorInfo => {
  const status = typeof error?.status === "number" ? error.status : undefined;
  const rawMessage =
    typeof error?.message === "string" && error.message.trim()
      ? error.message.trim()
      : "AI provider request failed";
  const message = rawMessage.replace(/\s+/g, " ");
  const lowerMessage = message.toLowerCase();

  if (status === 429 || lowerMessage.includes("quota exceeded")) {
    return {
      kind: "quota",
      status,
      retryAfterSeconds: extractRetryAfterSeconds(error),
      message: "OpenRouter quota exceeded for this project.",
      provider,
    };
  }

  if (
    lowerMessage.includes("rate limit") ||
    lowerMessage.includes("too many requests")
  ) {
    return {
      kind: "rate-limit",
      status,
      retryAfterSeconds: extractRetryAfterSeconds(error),
      message: "OpenRouter rate limit reached.",
      provider,
    };
  }

  if (status === 401 || status === 403) {
    return {
      kind: "auth",
      status,
      message: "OpenRouter authentication failed.",
      provider,
    };
  }

  if (lowerMessage.includes("fetch") || lowerMessage.includes("network")) {
    return {
      kind: "network",
      status,
      message: "Network error while contacting OpenRouter.",
      provider,
    };
  }

  return {
    kind: "unknown",
    status,
    message,
    provider,
  };
};

const logAIError = (errorInfo: AIErrorInfo) => {
  const retrySuffix = errorInfo.retryAfterSeconds
    ? ` Retry after about ${errorInfo.retryAfterSeconds}s.`
    : "";

  console.warn(
    `[AI] ${errorInfo.provider || "provider"} ${errorInfo.kind} error${errorInfo.status ? ` (${errorInfo.status})` : ""}: ${errorInfo.message}${retrySuffix}`,
  );
};

const generateWithOpenRouter = async (
  prompt: string,
  model: string,
): Promise<AITextResult> => {
  const config = getOpenRouterConfig();
  if (!config) {
    return {
      text: null,
      error: {
        kind: "auth",
        message: "OPENROUTER_API_KEY is not configured.",
        provider: "openrouter",
      },
      provider: "openrouter",
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
          ...(process.env.FRONTEND_URL
            ? { "HTTP-Referer": process.env.FRONTEND_URL }
            : {}),
          "X-Title": "ProjectHub",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 1200,
        }),
      },
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const errorBody = (await response
        .json()
        .catch(async () => ({ message: await response.text() }))) as {
        error?: { message?: string };
        message?: string;
      };
      const error = new Error(
        typeof errorBody?.error?.message === "string"
          ? errorBody.error.message
          : typeof errorBody?.message === "string"
            ? errorBody.message
            : `OpenRouter request failed with status ${response.status}`,
      ) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string | Array<{ type?: string; text?: string }>;
        };
      }>;
    };

    const content = data.choices?.[0]?.message?.content;
    const text =
      typeof content === "string"
        ? content.trim()
        : Array.isArray(content)
          ? content
              .filter(
                (part) =>
                  part?.type === "text" && typeof part.text === "string",
              )
              .map((part) => part.text)
              .join("\n")
              .trim()
          : "";

    return {
      text: text || null,
      error: null,
      provider: "openrouter",
    };
  } catch (error) {
    const maybeAbort = error as { name?: string };
    if (maybeAbort?.name === "AbortError") {
      const timeoutError = {
        kind: "network" as const,
        message: `OpenRouter request timed out after ${OPENROUTER_TIMEOUT_MS / 1000}s.`,
        provider: "openrouter" as const,
      };
      logAIError(timeoutError);
      return {
        text: null,
        error: timeoutError,
        provider: "openrouter",
      };
    }

    const errorInfo = normalizeAIError(error, "openrouter");
    logAIError(errorInfo);
    return {
      text: null,
      error: errorInfo,
      provider: "openrouter",
    };
  }
};

const generateText = async (prompt: string): Promise<AITextResult> => {
  const config = getOpenRouterConfig();
  if (!config) {
    return {
      text: null,
      error: {
        kind: "auth",
        message: "OPENROUTER_API_KEY is not configured.",
        provider: "openrouter",
      },
      provider: "openrouter",
    };
  }

  return generateWithOpenRouter(prompt, config.model);
};

const parseJsonResponse = <T>(text: string | null): T | null => {
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(cleanJsonResponse(text)) as T;
  } catch (error) {
    console.error("Failed to parse AI JSON response:", error);
    return null;
  }
};

export const parseTaskDescription = async (
  description: string,
  projectContext: string,
) => {
  const fallback = {
    title: description.split("\n")[0]?.trim() || "New Task",
    description,
    priority: "medium",
    estimatedHours: 4,
    tags: [],
  };

  const aiResult =
    await generateText(`You are a project management AI assistant. Parse the following task description and extract structured data.

Project Context: ${projectContext}
Task Description: "${description}"

Return a JSON object with:
- title: concise task title
- description: fuller description
- priority: 'low', 'medium', 'high', or 'critical'
- estimatedHours: estimated hours (number)
- tags: relevant tags (array)

Return ONLY valid JSON, no other text.`);

  return parseJsonResponse<typeof fallback>(aiResult.text) || fallback;
};

export const generateTaskRecommendations = async (
  projectId: string,
  userId: string,
) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const tasks = await Task.find({
    projectId,
    status: { $ne: "done" },
  }).populate("assignee");

  const projectSummary = `
Project: ${project.name}
Status: ${project.status}
Total Tasks: ${tasks.length}
Recent Tasks: ${tasks
    .slice(0, 5)
    .map((t) => `- ${t.title} (${t.priority})`)
    .join("\n")}
    `;

  const fallback = [
    {
      title: "Review top-priority unfinished work",
      description:
        "Focus the team on the most urgent open tasks so delivery risk is easier to control.",
      action:
        "Sort backlog by priority and assign owners for the highest-impact items.",
      priority: "high",
    },
    {
      title: "Reduce work in progress",
      description:
        "Too many concurrent tasks can slow delivery and hide blockers.",
      action:
        "Pause low-value work and move blocked items into a visible review lane.",
      priority: "medium",
    },
  ];

  const aiResult =
    await generateText(`As a project management expert, analyze this project and provide 2-3 actionable recommendations to improve efficiency and reduce risks.

${projectSummary}

Provide recommendations in JSON format with array of objects:
[
  {
    "title": "Recommendation title",
    "description": "What and why",
    "action": "Suggested action",
    "priority": "high|medium|low"
  }
]

Return ONLY valid JSON.`);

  const recommendations =
    parseJsonResponse<
      Array<{
        title: string;
        description: string;
        action: string;
        priority: "high" | "medium" | "low";
      }>
    >(aiResult.text) || fallback;

  for (const rec of recommendations) {
    await AIInsight.create({
      projectId,
      type: "recommendation",
      category: "task-recommendation",
      title: rec.title,
      content: rec.description,
      confidence: aiResult.text ? 0.85 : 0.55,
      actionRequired: rec.priority === "high",
    });
  }

  return recommendations;
};

export const predictProjectTimeline = async (projectId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const tasks = await Task.find({ projectId });
  const completedTasks = tasks.filter((t) => t.status === "done");
  const remainingTasks = tasks.filter((t) => t.status !== "done");

  const totalEstimated = tasks.reduce(
    (sum, t) => sum + (t.estimatedHours || 0),
    0,
  );
  const completedHours = completedTasks.reduce(
    (sum, t) => sum + (t.actualHours || 0),
    0,
  );

  const fallback = {
    predictedCompletionDate:
      project.endDate?.toISOString().split("T")[0] ||
      new Date(
        Date.now() + Math.max(remainingTasks.length, 1) * 24 * 60 * 60 * 1000,
      )
        .toISOString()
        .split("T")[0],
    confidenceScore: completedTasks.length > 0 ? 0.7 : 0.45,
    risks:
      remainingTasks.length > 0
        ? [
            "Outstanding tasks may push the delivery date if blockers remain unresolved.",
          ]
        : [],
    recommendations:
      remainingTasks.length > 0
        ? [
            "Review remaining tasks and rebalance ownership to protect the timeline.",
          ]
        : [
            "Project is near completion; focus on validation and closure activities.",
          ],
  };

  const aiResult =
    await generateText(`Analyze project timeline data and predict completion date.

Project Start: ${project.startDate}
Planned End: ${project.endDate}
Total Estimated Hours: ${totalEstimated}
Completed Hours: ${completedHours}
Remaining Tasks: ${remainingTasks.length}

Provide analysis in JSON format:
{
  "predictedCompletionDate": "YYYY-MM-DD",
  "confidenceScore": 0-1,
  "risks": ["risk1", "risk2"],
  "recommendations": ["recommendation1"]
}

Return ONLY valid JSON.`);

  return parseJsonResponse<typeof fallback>(aiResult.text) || fallback;
};

export const analyzeProjectHealth = async (projectId: string) => {
  const project = await Project.findById(projectId);
  if (!project) {
    throw new NotFoundError("Project not found");
  }

  const tasks = await Task.find({ projectId });
  const overdueTasks = tasks.filter(
    (t) => t.dueDate && t.dueDate < new Date() && t.status !== "done",
  );

  const completionRate = tasks.length
    ? tasks.filter((t) => t.status === "done").length / tasks.length
    : 0;
  const healthScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        completionRate * 70 +
          (overdueTasks.length === 0 ? 30 : 30 - overdueTasks.length * 5),
      ),
    ),
  );
  const fallback = {
    healthScore,
    status:
      healthScore >= 75
        ? "healthy"
        : healthScore >= 45
          ? "at-risk"
          : "critical",
    warnings: overdueTasks.length
      ? [`${overdueTasks.length} task(s) are overdue and need attention.`]
      : [],
    suggestions: overdueTasks.length
      ? [
          "Reassign or reschedule overdue work and review blockers with the team.",
        ]
      : [
          "Keep tracking delivery cadence and close any lingering in-progress tasks.",
        ],
  };

  const aiResult =
    await generateText(`Perform a health check on this project and provide a score.

Project: ${project.name}
Status: ${project.status}
Total Tasks: ${tasks.length}
Overdue Tasks: ${overdueTasks.length}
Completed: ${tasks.filter((t) => t.status === "done").length}

Provide health analysis in JSON format:
{
  "healthScore": 0-100,
  "status": "healthy|at-risk|critical",
  "warnings": ["warning1"],
  "suggestions": ["suggestion1"]
}

Return ONLY valid JSON.`);

  return parseJsonResponse<typeof fallback>(aiResult.text) || fallback;
};

export const generateChatReply = async (
  message: string,
  projectContext?: string,
) => {
  const trimmedMessage = message.trim();
  const systemPrompt = `You are ProjectHub AI, an intelligent project management assistant. You help users with:
- Planning projects and breaking down tasks
- Estimating timelines and effort
- Identifying risks and blockers
- Suggesting best practices for agile/scrum workflows
- Writing user stories and acceptance criteria
- Analyzing team workload and productivity
Keep responses concise and actionable. Use markdown for formatting.`;

  const prompt = projectContext
    ? `${systemPrompt}\n\nProject Context: ${projectContext}\n\nUser question: ${trimmedMessage}`
    : `${systemPrompt}\n\nUser question: ${trimmedMessage}`;

  const aiResult = await generateText(prompt);
  if (aiResult.text) {
    return { reply: aiResult.text };
  }

  const retryGuidance = aiResult.error?.retryAfterSeconds
    ? ` The provider asked us to retry in about ${aiResult.error.retryAfterSeconds} seconds.`
    : "";
  const providerStatusMessage =
    aiResult.error?.kind === "quota" || aiResult.error?.kind === "rate-limit"
      ? "The AI provider is currently rate-limited for this project."
      : aiResult.error?.kind === "auth"
        ? "The AI provider rejected authentication. Please verify the OpenRouter API key in backend environment settings."
        : aiResult.error?.kind === "network"
          ? "The AI provider could not be reached due to a network/timeout issue."
          : "I couldn't reach the live AI model right now.";

  return {
    reply: `${providerStatusMessage}${retryGuidance} I can still help with your request about "${trimmedMessage}".

Here are practical next steps:
- Clarify the desired outcome and deadline
- Break the work into smaller, owner-assigned tasks
- Flag blockers, dependencies, and review points early
- Prioritize the highest-impact items first

If you want, send a bit more project context and I can help you structure the plan manually.`,
    note:
      aiResult.error?.kind === "quota" || aiResult.error?.kind === "rate-limit"
        ? `Using fallback response because the AI provider quota was exceeded.${retryGuidance}`
        : "Using fallback response because the AI provider is unavailable.",
  };
};
