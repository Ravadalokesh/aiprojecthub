import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { projectAPI, taskAPI, aiAPI, teamAPI } from "../services/api";
import { useAppSelector } from "../hooks/useRedux";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Users,
  Trash2,
  Brain,
  Loader2,
} from "lucide-react";
import type { Project, Task, User as AppUser } from "../types";

const STATUS_COLUMNS = [
  { key: "backlog", label: "Backlog", color: "bg-gray-100" },
  { key: "todo", label: "To Do", color: "bg-yellow-50" },
  { key: "in-progress", label: "In Progress", color: "bg-blue-50" },
  { key: "in-review", label: "In Review", color: "bg-purple-50" },
  { key: "done", label: "Done", color: "bg-green-50" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-200 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    assignee: "",
    priority: "medium",
    status: "backlog",
    dueDate: "",
    estimatedHours: "",
  });
  const [aiTaskInput, setAiTaskInput] = useState("");
  const [tab, setTab] = useState<"board" | "list" | "ai">("board");
  const [taskScope, setTaskScope] = useState<"all" | "mine">("all");
  const [teamMembers, setTeamMembers] = useState<AppUser[]>([]);

  const isOwner = !!project && !!user && project.owner?._id === user._id;
  const assignableMembers = (() => {
    const entries = new Map<string, { _id: string; label: string }>();

    const addMember = (raw: any) => {
      if (!raw) return;
      const id =
        typeof raw === "string"
          ? raw
          : typeof raw._id === "string"
            ? raw._id
            : "";

      if (!id || entries.has(id)) return;

      const name =
        typeof raw === "object" && typeof raw.name === "string"
          ? raw.name.trim()
          : "";
      const email =
        typeof raw === "object" && typeof raw.email === "string"
          ? raw.email.trim()
          : "";

      const label =
        name && email
          ? `${name} (${email})`
          : name || email || `Member ${id.slice(-6)}`;

      entries.set(id, { _id: id, label });
    };

    addMember(project?.owner as any);
    (project?.members || []).forEach(addMember);
    teamMembers.forEach(addMember);

    return Array.from(entries.values());
  })();

  useEffect(() => {
    if (!isOwner) {
      setTaskScope("all");
    }
  }, [isOwner]);

  useEffect(() => {
    if (!projectId) return;
    const fetchData = async () => {
      try {
        const projRes = await projectAPI.getProject(projectId);
        const loadedProject = projRes.data.data;
        setProject(loadedProject);

        const teamId =
          typeof loadedProject.team === "string"
            ? loadedProject.team
            : loadedProject.team?._id;

        if (teamId) {
          try {
            const teamRes = await teamAPI.getTeam(teamId);
            setTeamMembers(teamRes.data.data.members || []);
          } catch {
            setTeamMembers([]);
          }
        } else {
          setTeamMembers([]);
        }
      } catch (err) {
        console.error("Failed to fetch project data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !project || !user) return;

    const fetchTasks = async () => {
      try {
        const filter =
          isOwner && taskScope === "mine" ? { assignee: user._id } : undefined;
        const tasksRes = await taskAPI.getTasks(projectId, filter);
        setTasks(tasksRes.data.data);
      } catch (_err) {
        setTasks([]);
      }
    };

    fetchTasks();
  }, [projectId, project, user, isOwner, taskScope]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    try {
      const payload: any = {
        title: taskForm.title,
        description: taskForm.description,
        priority: taskForm.priority,
        status: taskForm.status,
      };
      if (taskForm.assignee) payload.assignee = taskForm.assignee;
      if (taskForm.dueDate) payload.dueDate = taskForm.dueDate;
      if (taskForm.estimatedHours)
        payload.estimatedHours = Number(taskForm.estimatedHours);

      const res = await taskAPI.createTask(projectId, payload);
      setTasks([res.data.data, ...tasks]);
      setTaskForm({
        title: "",
        description: "",
        assignee: "",
        priority: "medium",
        status: "backlog",
        dueDate: "",
        estimatedHours: "",
      });
      setShowTaskForm(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create task");
    }
  };

  const handleAiParse = async () => {
    if (!aiTaskInput.trim() || !projectId) return;
    setAiLoading(true);
    try {
      const res = await aiAPI.parseTask(aiTaskInput, project?.name || "");
      setTaskForm({
        title: res.data.data.title || "",
        description: res.data.data.description || "",
        assignee: "",
        priority: res.data.data.priority || "medium",
        status: "backlog",
        dueDate: "",
        estimatedHours: res.data.data.estimatedHours?.toString() || "",
      });
      setAiTaskInput("");
      setShowTaskForm(true);
    } catch {
      alert("AI parsing failed. Please create the task manually.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const res = await taskAPI.updateTask(taskId, {
        status: newStatus,
      } as any);
      setTasks(tasks.map((t) => (t._id === taskId ? res.data.data : t)));
    } catch {
      alert("Failed to update task status");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await taskAPI.deleteTask(taskId);
      setTasks(tasks.filter((t) => t._id !== taskId));
    } catch {
      alert("Failed to delete task");
    }
  };

  const fetchAiInsights = async () => {
    if (!projectId) return;
    setAiLoading(true);
    try {
      const [healthRes, recRes] = await Promise.all([
        aiAPI.getProjectHealth(projectId),
        aiAPI.getRecommendations(projectId),
      ]);
      setAiInsights({
        health: healthRes.data.data,
        recommendations: recRes.data.data,
      });
    } catch {
      setAiInsights({
        health: {
          healthScore: 0,
          status: "unknown",
          warnings: [],
          suggestions: [],
        },
        recommendations: [],
      });
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-600">Project not found</p>
          <button
            onClick={() => navigate("/projects")}
            className="mt-4 text-primary-600 hover:underline"
          >
            Back to Projects
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.name}
              </h1>
              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                {project.code}
              </span>
            </div>
            <p className="text-gray-600 text-sm mt-1">{project.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              {project.members?.slice(0, 5).map((m: any, i: number) => (
                <div
                  key={m._id || i}
                  className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold border-2 border-white"
                >
                  {(m.name || "U").charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
            <span className="text-xs text-gray-500">
              <Users className="h-3.5 w-3.5 inline mr-1" />
              {project.members?.length || 0}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: "board" as const, label: "Board" },
            { id: "list" as const, label: "List" },
            { id: "ai" as const, label: "AI Insights" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                if (t.id === "ai" && !aiInsights) fetchAiInsights();
              }}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                tab === t.id
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.id === "ai" && (
                <Sparkles className="h-3.5 w-3.5 inline mr-1" />
              )}
              {t.label}
            </button>
          ))}
        </div>

        {isOwner && (
          <div className="inline-flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setTaskScope("all")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition ${
                taskScope === "all"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setTaskScope("mine")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition ${
                taskScope === "mine"
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-600"
              }`}
            >
              My Tasks
            </button>
          </div>
        )}

        {/* AI Task Bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Brain className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary-500" />
            <input
              type="text"
              placeholder="Describe a task in natural language and AI will parse it..."
              value={aiTaskInput}
              onChange={(e) => setAiTaskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAiParse()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={handleAiParse}
            disabled={aiLoading || !aiTaskInput.trim()}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition flex items-center gap-2"
          >
            {aiLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            AI Parse
          </button>
          <button
            onClick={() => setShowTaskForm(true)}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Add Task
          </button>
        </div>

        {/* Task Create Modal */}
        {showTaskForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create Task
              </h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, title: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm({ ...taskForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignee
                    </label>
                    <select
                      value={taskForm.assignee}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, assignee: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Unassigned</option>
                      {assignableMembers.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, priority: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={taskForm.status}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {STATUS_COLUMNS.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={(e) =>
                        setTaskForm({ ...taskForm, dueDate: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Est. Hours
                    </label>
                    <input
                      type="number"
                      value={taskForm.estimatedHours}
                      onChange={(e) =>
                        setTaskForm({
                          ...taskForm,
                          estimatedHours: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      min="0"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                  >
                    Create Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Board View */}
        {tab === "board" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STATUS_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.key);
              return (
                <div
                  key={col.key}
                  className={`flex-shrink-0 w-72 rounded-lg ${col.color} p-3`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-800 text-sm">
                      {col.label}
                    </h3>
                    <span className="text-xs bg-white px-2 py-0.5 rounded-full text-gray-600 font-medium">
                      {colTasks.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {colTasks.map((task) => (
                      <div
                        key={task._id}
                        className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition cursor-pointer group"
                        onClick={() => navigate(`/tasks/${task._id}`)}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-gray-900 flex-1">
                            {task.title}
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task._id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition"
                          >
                            <Trash2 className="h-3 w-3 text-red-400" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 text-xs rounded ${PRIORITY_COLORS[task.priority]}`}
                          >
                            {task.priority}
                          </span>
                          <span className="text-xs text-gray-500">
                            {task.assignee?.name || "Unassigned"}
                          </span>
                          {task.dueDate && (
                            <span className="text-xs text-gray-500">
                              {new Date(task.dueDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {/* Quick status changer */}
                        <div className="mt-2 pt-2 border-t border-gray-50">
                          <select
                            value={task.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) =>
                              handleStatusChange(task._id, e.target.value)
                            }
                            className="text-xs bg-gray-50 border-0 rounded px-1 py-0.5 w-full focus:ring-1 focus:ring-primary-500"
                          >
                            {STATUS_COLUMNS.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List View */}
        {tab === "list" && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Task
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Priority
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Assignee
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Due Date
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No tasks yet. Create one above!
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr
                      key={task._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/tasks/${task._id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {task.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={task.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleStatusChange(task._id, e.target.value)
                          }
                          className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-primary-500"
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s.key} value={s.key}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs rounded ${PRIORITY_COLORS[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {task.assignee?.name || "Unassigned"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {task.dueDate
                          ? new Date(task.dueDate).toLocaleDateString()
                          : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTask(task._id);
                          }}
                          className="p-1 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* AI Insights Tab */}
        {tab === "ai" && (
          <div className="space-y-6">
            {aiLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                <span className="ml-3 text-gray-600">
                  AI is analyzing your project...
                </span>
              </div>
            ) : aiInsights ? (
              <>
                {/* Health Score */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary-600" /> Project
                    Health
                  </h3>
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-24">
                      <svg
                        className="w-24 h-24 -rotate-90"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="#e5e7eb"
                          strokeWidth="8"
                          fill="none"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke={
                            aiInsights.health.healthScore >= 70
                              ? "#10b981"
                              : aiInsights.health.healthScore >= 40
                                ? "#f59e0b"
                                : "#ef4444"
                          }
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={`${(aiInsights.health.healthScore / 100) * 251.3} 251.3`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-900">
                          {aiInsights.health.healthScore}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-medium text-gray-900 capitalize">
                        {aiInsights.health.status}
                      </p>
                      {aiInsights.health.warnings?.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {aiInsights.health.warnings.map(
                            (w: string, i: number) => (
                              <li
                                key={i}
                                className="text-sm text-amber-700 flex items-start gap-1"
                              >
                                <span className="shrink-0">&#9888;</span> {w}
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                      {aiInsights.health.suggestions?.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {aiInsights.health.suggestions.map(
                            (s: string, i: number) => (
                              <li
                                key={i}
                                className="text-sm text-primary-700 flex items-start gap-1"
                              >
                                <span className="shrink-0">&#10003;</span> {s}
                              </li>
                            ),
                          )}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" /> AI
                    Recommendations
                  </h3>
                  {aiInsights.recommendations?.length > 0 ? (
                    <div className="space-y-3">
                      {aiInsights.recommendations.map((r: any, i: number) => (
                        <div
                          key={i}
                          className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100"
                        >
                          <h4 className="font-medium text-gray-900">
                            {r.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {r.description}
                          </p>
                          {r.action && (
                            <p className="text-sm text-primary-700 mt-2 font-medium">
                              Action: {r.action}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No recommendations available yet.
                    </p>
                  )}
                </div>

                <button
                  onClick={fetchAiInsights}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-primary-600 text-white rounded-lg hover:opacity-90 transition flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" /> Refresh AI Insights
                </button>
              </>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">
                  Click the AI Insights tab to analyze your project.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
