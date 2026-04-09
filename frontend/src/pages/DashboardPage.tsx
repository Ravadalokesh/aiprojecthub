import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppSelector, useAppDispatch } from "../hooks/useRedux";
import { setProjects } from "../store/slices/projectsSlice";
import { projectAPI } from "../services/api";
import Layout from "../components/Layout";
import {
  FolderOpen,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { projects } = useAppSelector((state) => state.projects);
  const { user } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectAPI.getProjects();
        dispatch(setProjects(response.data.data));
      } catch (error) {
        console.error("Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, [dispatch]);

  const stats = [
    {
      label: "Total Projects",
      value: projects.length,
      color: "text-primary-600",
      bg: "bg-primary-50",
      icon: <FolderOpen className="h-6 w-6 text-primary-500" />,
    },
    {
      label: "Active",
      value: projects.filter((p) => p.status === "active").length,
      color: "text-green-600",
      bg: "bg-green-50",
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
    },
    {
      label: "Completed",
      value: projects.filter((p) => p.status === "completed").length,
      color: "text-blue-600",
      bg: "bg-blue-50",
      icon: <CheckCircle2 className="h-6 w-6 text-blue-500" />,
    },
    {
      label: "Planning",
      value: projects.filter((p) => p.status === "planning").length,
      color: "text-purple-600",
      bg: "bg-purple-50",
      icon: <Clock className="h-6 w-6 text-purple-500" />,
    },
  ];

  const statusColors: Record<string, string> = {
    planning: "bg-purple-100 text-purple-700",
    active: "bg-green-100 text-green-700",
    "on-hold": "bg-yellow-100 text-yellow-700",
    completed: "bg-blue-100 text-blue-700",
    archived: "bg-gray-100 text-gray-700",
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-gray-500 mt-1">
              Here's what's happening with your projects
            </p>
          </div>
          <button
            onClick={() => navigate("/projects")}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            View all projects <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 font-medium">
                    {stat.label}
                  </p>
                  <div className={`text-3xl font-bold mt-1 ${stat.color}`}>
                    {stat.value}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg}`}>{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Projects</h2>
            <button
              onClick={() => navigate("/projects")}
              className="text-sm text-primary-600 hover:underline"
            >
              See all
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 mt-3 text-sm">
                  Loading projects...
                </p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                <p className="text-gray-600 mb-4">No projects yet</p>
                <button
                  onClick={() => navigate("/projects")}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
                >
                  Create First Project
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project._id}
                    onClick={() => navigate(`/projects/${project._id}`)}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {project.code?.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-gray-500 truncate">
                          {project.description || "No description"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-2.5 py-1 text-xs rounded-full font-medium ${statusColors[project.status] || "bg-gray-100 text-gray-700"}`}
                      >
                        {project.status}
                      </span>
                      <span className="text-xs text-gray-400">
                        {project.members?.length || 0} members
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate("/projects")}
            className="p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white rounded-xl hover:shadow-lg transition text-left"
          >
            <FolderOpen className="h-8 w-8 mb-3 opacity-80" />
            <h3 className="font-bold text-lg">Manage Projects</h3>
            <p className="text-sm opacity-80 mt-1">
              Create, edit, and track your projects
            </p>
          </button>
          <button
            onClick={() => navigate("/teams")}
            className="p-6 bg-gradient-to-br from-purple-500 to-purple-700 text-white rounded-xl hover:shadow-lg transition text-left"
          >
            <svg
              className="h-8 w-8 mb-3 opacity-80"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            <h3 className="font-bold text-lg">Team Management</h3>
            <p className="text-sm opacity-80 mt-1">
              Build and manage your teams
            </p>
          </button>
          <button
            onClick={() => navigate("/analytics")}
            className="p-6 bg-gradient-to-br from-green-500 to-green-700 text-white rounded-xl hover:shadow-lg transition text-left"
          >
            <TrendingUp className="h-8 w-8 mb-3 opacity-80" />
            <h3 className="font-bold text-lg">View Analytics</h3>
            <p className="text-sm opacity-80 mt-1">
              Insights and performance metrics
            </p>
          </button>
        </div>
      </div>
    </Layout>
  );
}
