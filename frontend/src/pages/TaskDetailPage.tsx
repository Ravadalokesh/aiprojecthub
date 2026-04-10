import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { taskAPI, projectAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Tag,
  Loader2,
  Trash2,
  Calendar,
  User,
} from "lucide-react";
import type { Task, User as AppUser } from "../types";
import { useAppSelector } from "../hooks/useRedux";

const STATUS_OPTIONS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To Do" },
  { key: "in-progress", label: "In Progress" },
  { key: "in-review", label: "In Review" },
  { key: "done", label: "Done" },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: "bg-gray-200 text-gray-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [task, setTask] = useState<Task | null>(null);
  const [projectMembers, setProjectMembers] = useState<AppUser[]>([]);
  const [isProjectOwner, setIsProjectOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "backlog",
    assignee: "",
    dueDate: "",
    estimatedHours: "",
    actualHours: "",
    progress: 0,
  });

  useEffect(() => {
    if (!taskId) return;
    const fetchTask = async () => {
      try {
        const res = await taskAPI.getTask(taskId);
        const t = res.data.data;
        setTask(t);

        try {
          const projectRes = await projectAPI.getProject(t.projectId);
          const project = projectRes.data.data;
          setProjectMembers(project.members || []);
          setIsProjectOwner(project.owner?._id === user?._id);
        } catch (_error) {
          setProjectMembers([]);
          setIsProjectOwner(false);
        }

        setEditForm({
          title: t.title,
          description: t.description || "",
          priority: t.priority,
          status: t.status,
          assignee: t.assignee?._id || "",
          dueDate: t.dueDate
            ? new Date(t.dueDate).toISOString().split("T")[0]
            : "",
          estimatedHours: t.estimatedHours?.toString() || "",
          actualHours: t.actualHours?.toString() || "",
          progress: t.progress || 0,
        });
      } catch {
        console.error("Failed to fetch task");
      } finally {
        setLoading(false);
      }
    };
    fetchTask();
  }, [taskId]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId) return;
    try {
      const payload: any = {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        status: editForm.status,
        progress: editForm.progress,
      };
      if (isProjectOwner) {
        payload.assignee = editForm.assignee || null;
      }
      if (editForm.dueDate) payload.dueDate = editForm.dueDate;
      if (editForm.estimatedHours)
        payload.estimatedHours = Number(editForm.estimatedHours);
      if (editForm.actualHours)
        payload.actualHours = Number(editForm.actualHours);

      const res = await taskAPI.updateTask(taskId, payload);
      setTask(res.data.data);
      setEditing(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update task");
    }
  };

  const handleQuickStatus = async (status: string) => {
    if (!taskId) return;
    try {
      const res = await taskAPI.updateTask(taskId, { status } as any);
      setTask(res.data.data);
      setEditForm((prev) => ({ ...prev, status }));
    } catch {
      alert("Failed to update status");
    }
  };

  const handleAddSubtask = async () => {
    if (!taskId || !subtaskTitle.trim()) return;
    try {
      const res = await taskAPI.addSubtask(taskId, subtaskTitle);
      setTask(res.data.data);
      setSubtaskTitle("");
    } catch {
      alert("Failed to add subtask");
    }
  };

  const handleDeleteTask = async () => {
    if (!taskId || !confirm("Delete this task permanently?")) return;
    try {
      await taskAPI.deleteTask(taskId);
      navigate(-1);
    } catch {
      alert("Failed to delete task");
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

  if (!task) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-600">Task not found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 text-primary-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex-1">
            {editing ? (
              <input
                type="text"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                className="text-2xl font-bold text-gray-900 w-full border-b-2 border-primary-500 focus:outline-none pb-1"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              {editing ? "Cancel" : "Edit"}
            </button>
            <button
              onClick={handleDeleteTask}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
              {editing ? (
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={5}
                />
              ) : (
                <p className="text-gray-600 whitespace-pre-wrap">
                  {task.description || "No description provided."}
                </p>
              )}
            </div>

            {/* Progress */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Progress</h3>
                <span className="text-sm font-medium text-primary-600">
                  {editing ? editForm.progress : task.progress}%
                </span>
              </div>
              {editing ? (
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editForm.progress}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      progress: Number(e.target.value),
                    })
                  }
                  className="w-full accent-primary-600"
                />
              ) : (
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
            </div>

            {/* Subtasks */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                Subtasks (
                {task.subtasks?.filter((s) => s.completed).length || 0}/
                {task.subtasks?.length || 0})
              </h3>
              <div className="space-y-2 mb-4">
                {task.subtasks?.length === 0 ? (
                  <p className="text-sm text-gray-500">No subtasks yet.</p>
                ) : (
                  task.subtasks?.map((st) => (
                    <div
                      key={st._id}
                      className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                    >
                      {st.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-300 shrink-0" />
                      )}
                      <span
                        className={`text-sm ${st.completed ? "line-through text-gray-400" : "text-gray-700"}`}
                      >
                        {st.title}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskTitle}
                  onChange={(e) => setSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSubtask()}
                  placeholder="Add a subtask..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={handleAddSubtask}
                  disabled={!subtaskTitle.trim()}
                  className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Save button for editing */}
            {editing && (
              <button
                onClick={handleUpdate}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
              >
                Save Changes
              </button>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Status */}
            <div className="bg-white rounded-lg shadow p-4">
              <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                Status
              </h4>
              <div className="space-y-1">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.key}
                    onClick={() => handleQuickStatus(s.key)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
                      task.status === s.key
                        ? "bg-primary-100 text-primary-700 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="bg-white rounded-lg shadow p-4 space-y-4">
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Priority
                </h4>
                {editing ? (
                  <select
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                ) : (
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium ${PRIORITY_COLORS[task.priority]}`}
                  >
                    {task.priority}
                  </span>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <User className="h-3 w-3" /> Assignee
                </h4>
                {editing && isProjectOwner ? (
                  <select
                    value={editForm.assignee}
                    onChange={(e) =>
                      setEditForm({ ...editForm, assignee: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Unassigned</option>
                    {projectMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-gray-700">
                    {task.assignee?.name || "Unassigned"}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Due Date
                </h4>
                {editing ? (
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                ) : (
                  <p className="text-sm text-gray-700">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "Not set"}
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Hours
                </h4>
                {editing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editForm.estimatedHours}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          estimatedHours: e.target.value,
                        })
                      }
                      placeholder="Est."
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="number"
                      value={editForm.actualHours}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          actualHours: e.target.value,
                        })
                      }
                      placeholder="Actual"
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-700">
                    {task.estimatedHours
                      ? `${task.estimatedHours}h estimated`
                      : "Not set"}
                    {task.actualHours ? ` / ${task.actualHours}h actual` : ""}
                  </p>
                )}
              </div>

              {task.tags && task.tags.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Tags
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {task.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                  Created
                </h4>
                <p className="text-sm text-gray-700">
                  {new Date(task.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
