import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { BarChart3, Loader2 } from "lucide-react";
import Layout from "../components/Layout";
import { analyticsAPI, projectAPI } from "../services/api";
import { useAppSelector, useAppDispatch } from "../hooks/useRedux";
import { setProjects } from "../store/slices/projectsSlice";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const defaultAnalytics = {
  projectHealth: { healthScore: 0, status: "unknown" },
  taskMetrics: {
    totalTasks: 0,
    completedTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    inReviewTasks: 0,
    backlogTasks: 0,
  },
  timeMetrics: { estimatedHours: 0, actualHours: 0, variance: 0 },
  riskMetrics: { overdueTasks: 0, atRiskTasks: 0, estimationAccuracy: 0 },
  priorityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
  teamPerformance: [] as any[],
};

function MetricCard({
  label,
  value,
  sublabel,
  color,
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-gray-600 text-sm font-medium">{label}</p>
      <div className={`text-3xl font-bold ${color} mt-2`}>{value}</div>
      {sublabel && <p className="text-gray-500 text-xs mt-2">{sublabel}</p>}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const { projectId } = useParams<{ projectId?: string }>();
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((state) => state.projects);
  const [selectedProject, setSelectedProject] = useState(projectId || "");
  const [analytics, setAnalytics] = useState(defaultAnalytics);
  const [velocity, setVelocity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      if (projects.length === 0) {
        try {
          const res = await projectAPI.getProjects();
          dispatch(setProjects(res.data.data));
        } catch {}
      }
    };
    fetchProjects();
  }, [dispatch, projects.length]);

  useEffect(() => {
    if (projectId) setSelectedProject(projectId);
  }, [projectId]);

  const fetchAnalytics = async (pid: string) => {
    if (!pid) return;
    setLoading(true);
    try {
      const [analyticsRes, velocityRes] = await Promise.all([
        analyticsAPI.getProjectAnalytics(pid),
        analyticsAPI.getProjectVelocity(pid, 5),
      ]);
      setAnalytics(analyticsRes.data.data);
      setVelocity(velocityRes.data.data);
    } catch {
      setAnalytics(defaultAnalytics);
      setVelocity([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedProject) fetchAnalytics(selectedProject);
  }, [selectedProject]);

  const tm = analytics.taskMetrics;
  const completionRate =
    tm.totalTasks > 0
      ? Math.round((tm.completedTasks / tm.totalTasks) * 100)
      : 0;
  const timeEfficiency =
    analytics.timeMetrics.estimatedHours > 0
      ? Math.round(
          (analytics.timeMetrics.actualHours /
            analytics.timeMetrics.estimatedHours) *
            100,
        )
      : 0;

  const taskDistribution = [
    { name: "Done", value: tm.completedTasks, color: "#10b981" },
    { name: "To Do", value: tm.todoTasks || 0, color: "#f59e0b" },
    { name: "In Progress", value: tm.inProgressTasks, color: "#3b82f6" },
    { name: "In Review", value: tm.inReviewTasks || 0, color: "#8b5cf6" },
    { name: "Backlog", value: tm.backlogTasks, color: "#6b7280" },
  ].filter((d) => d.value > 0);

  const pb = analytics.priorityBreakdown;
  const priorityData = [
    { priority: "Critical", tasks: pb.critical || 0 },
    { priority: "High", tasks: pb.high || 0 },
    { priority: "Medium", tasks: pb.medium || 0 },
    { priority: "Low", tasks: pb.low || 0 },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Project insights and performance metrics
            </p>
          </div>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.code})
              </option>
            ))}
          </select>
        </div>

        {!selectedProject ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              Select a Project
            </h3>
            <p className="text-gray-500">
              Choose a project from the dropdown to view its analytics
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <span className="ml-3 text-gray-600">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <MetricCard
                label="Project Health"
                value={`${analytics.projectHealth.healthScore}%`}
                sublabel={`Status: ${analytics.projectHealth.status}`}
                color={
                  analytics.projectHealth.healthScore >= 70
                    ? "text-green-600"
                    : "text-red-600"
                }
              />
              <MetricCard
                label="Task Completion"
                value={`${completionRate}%`}
                sublabel={`${tm.completedTasks}/${tm.totalTasks} tasks`}
                color="text-blue-600"
              />
              <MetricCard
                label="Time Efficiency"
                value={`${timeEfficiency}%`}
                sublabel={`${analytics.timeMetrics.actualHours}h / ${analytics.timeMetrics.estimatedHours}h`}
                color={
                  analytics.timeMetrics.variance <= 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              />
              <MetricCard
                label="At Risk"
                value={analytics.riskMetrics.atRiskTasks}
                sublabel={`${analytics.riskMetrics.overdueTasks} overdue tasks`}
                color="text-red-600"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Team Velocity
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={velocity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="week" />
                    <YAxis
                      yAxisId="tasks"
                      orientation="left"
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="hours"
                      orientation="right"
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value: number, name: string) =>
                        name === "Hours Logged"
                          ? [`${value}h`, name]
                          : [value, name]
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      yAxisId="tasks"
                      dataKey="tasks"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Tasks Completed"
                    />
                    <Line
                      type="monotone"
                      yAxisId="hours"
                      dataKey="hours"
                      stroke="#10b981"
                      strokeWidth={3}
                      strokeDasharray="6 4"
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      name="Hours Logged"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Task Distribution
                </h2>
                {taskDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={taskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {taskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    No tasks to display
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Priority Breakdown
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={priorityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="priority" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="tasks" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Team Performance
                </h2>
                {analytics.teamPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.teamPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="tasksCompleted"
                        fill="#3b82f6"
                        name="Tasks Completed"
                      />
                      <Bar
                        dataKey="hoursLogged"
                        fill="#10b981"
                        name="Hours Logged"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-gray-400">
                    No team data available
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Task Status Breakdown
                </h3>
                <div className="space-y-3">
                  {[
                    {
                      label: "Completed",
                      value: tm.completedTasks,
                      color: "bg-green-500",
                    },
                    {
                      label: "In Progress",
                      value: tm.inProgressTasks,
                      color: "bg-blue-500",
                    },
                    {
                      label: "Backlog",
                      value: tm.backlogTasks,
                      color: "bg-yellow-500",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600 text-sm">
                        {item.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color}`}
                            style={{
                              width: `${tm.totalTasks > 0 ? (item.value / tm.totalTasks) * 100 : 0}%`,
                            }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Risk Assessment
                </h3>
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800 font-medium">
                      {analytics.riskMetrics.overdueTasks} Overdue Tasks
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800 font-medium">
                      {analytics.riskMetrics.atRiskTasks} Tasks at Risk
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800 font-medium">
                      {analytics.riskMetrics.estimationAccuracy}% Accuracy
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Time Metrics
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Estimated</span>
                      <span className="text-sm font-semibold">
                        {analytics.timeMetrics.estimatedHours}h
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-gray-600">Actual</span>
                      <span className="text-sm font-semibold">
                        {analytics.timeMetrics.actualHours}h
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${timeEfficiency}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-medium">
                      Variance: {analytics.timeMetrics.variance}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
