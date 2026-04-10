import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  Users,
  BarChart3,
  Lightbulb,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Layout,
  CheckSquare,
  FolderOpen,
} from "lucide-react";
import { useAppSelector } from "../hooks/useRedux";
import PublicLayout from "../components/PublicLayout";

interface PublicProject {
  _id: string;
  name: string;
  code: string;
  description?: string;
  status: string;
  members?: Array<unknown>;
}

const getPublicApiBaseUrl = () => {
  const configured = (import.meta.env.VITE_API_URL || "")
    .trim()
    .replace(/\/+$/, "");

  if (!configured) {
    return import.meta.env.DEV ? "/api" : "http://localhost:5000/api";
  }

  if (configured === "/api" || configured.endsWith("/api")) {
    return configured;
  }

  if (/^https?:\/\/[^/]+$/i.test(configured)) {
    return `${configured}/api`;
  }

  return configured;
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const fetchPublicProjects = async () => {
      try {
        const response = await fetch(
          `${getPublicApiBaseUrl()}/projects/public`,
        );
        if (!response.ok) {
          throw new Error("Failed to load projects");
        }

        const payload = (await response.json()) as {
          data?: PublicProject[];
        };
        setPublicProjects(payload.data || []);
      } catch (_error) {
        setPublicProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchPublicProjects();
  }, []);

  const handleProjectClick = () => {
    if (token) {
      navigate("/projects");
    } else {
      // Show login modal via parent
      const event = new CustomEvent("openLoginModal");
      window.dispatchEvent(event);
    }
  };

  const handlePublicProjectClick = (projectId: string) => {
    if (token) {
      navigate(`/projects/${projectId}`);
      return;
    }

    const event = new CustomEvent("openLoginModal");
    window.dispatchEvent(event);
  };

  return (
    <PublicLayout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Manage Your Projects with AI Power
              </h1>
              <p className="text-xl text-primary-100 mb-8">
                ProjectHub helps teams collaborate, plan smart, and deliver on
                time with AI-powered insights and real-time analytics.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleProjectClick}
                  className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition flex items-center gap-2"
                >
                  Get Started <ArrowRight size={20} />
                </button>
                <button
                  onClick={() =>
                    document.getElementById("features")?.scrollIntoView()
                  }
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition"
                >
                  Learn More
                </button>
              </div>
            </div>

            {/* Right Project Board Illustration */}
            <div className="hidden md:block">
              <div className="bg-white rounded-2xl shadow-2xl p-6 space-y-4">
                {/* Project Board Header */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <Layout className="text-primary-600" size={24} />
                    <span className="font-bold text-gray-900">
                      Project Board
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {["Todo", "In Progress", "Done"].map((status) => (
                      <div
                        key={status}
                        className="text-xs font-semibold text-gray-500 px-2 py-1 bg-gray-100 rounded"
                      >
                        {status}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Board Columns */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Todo Column */}
                  <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                    <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full" />
                      Todo
                    </div>
                    {[
                      { title: "Design UI", assignee: "Sarah" },
                      { title: "Setup DB", assignee: "Mike" },
                    ].map((task, i) => (
                      <div
                        key={i}
                        className="bg-white p-2 rounded border border-gray-200 text-xs space-y-1"
                      >
                        <div className="font-semibold text-gray-800">
                          {task.title}
                        </div>
                        <div className="text-gray-500">{task.assignee}</div>
                      </div>
                    ))}
                  </div>

                  {/* In Progress Column */}
                  <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                    <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full" />
                      In Progress
                    </div>
                    {[
                      { title: "API Development", assignee: "John" },
                      { title: "Testing", assignee: "Lisa" },
                    ].map((task, i) => (
                      <div
                        key={i}
                        className="bg-white p-2 rounded border border-blue-200 text-xs space-y-1"
                      >
                        <div className="font-semibold text-gray-800">
                          {task.title}
                        </div>
                        <div className="text-gray-500">{task.assignee}</div>
                      </div>
                    ))}
                  </div>

                  {/* Done Column */}
                  <div className="bg-green-50 rounded-lg p-3 space-y-3">
                    <div className="font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full" />
                      Done
                    </div>
                    {[
                      { title: "Project Setup", assignee: "Alex" },
                      { title: "Documentation", assignee: "Emma" },
                    ].map((task, i) => (
                      <div
                        key={i}
                        className="bg-white p-2 rounded border border-green-200 text-xs space-y-1 opacity-75"
                      >
                        <div className="font-semibold text-gray-800 flex items-center gap-1">
                          <CheckSquare size={14} className="text-green-600" />
                          {task.title}
                        </div>
                        <div className="text-gray-500">{task.assignee}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Members */}
                <div className="border-t pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-primary-600" />
                    <span className="text-sm font-semibold text-gray-700">
                      Team Members
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    {["#3B82F6", "#10B981", "#F59E0B", "#EF4444"].map(
                      (color, i) => (
                        <div
                          key={i}
                          className="w-8 h-8 rounded-full border-2 border-white"
                          style={{ backgroundColor: color }}
                        />
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to manage projects effectively
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="text-primary-600" size={32} />,
                title: "AI-Powered Insights",
                description:
                  "Get intelligent recommendations and predictions to optimize your project timeline",
              },
              {
                icon: <Users className="text-primary-600" size={32} />,
                title: "Team Collaboration",
                description:
                  "Work together seamlessly with real-time updates and team management tools",
              },
              {
                icon: <BarChart3 className="text-primary-600" size={32} />,
                title: "Advanced Analytics",
                description:
                  "Track progress, velocity, and health metrics with detailed dashboards",
              },
              {
                icon: <Lightbulb className="text-primary-600" size={32} />,
                title: "Smart Task Parser",
                description:
                  "AI automatically breaks down complex requirements into actionable tasks",
              },
              {
                icon: <TrendingUp className="text-primary-600" size={32} />,
                title: "Timeline Predictions",
                description:
                  "Predict project completion dates with machine learning algorithms",
              },
              {
                icon: <CheckCircle className="text-primary-600" size={32} />,
                title: "Complete Automation",
                description:
                  "Automate repetitive tasks and focus on what really matters",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition border border-gray-200"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Project Management?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of teams using ProjectHub to deliver projects on time
            and within budget
          </p>
          <button
            onClick={handleProjectClick}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Start Free Now <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "10K+", label: "Active Projects" },
              { number: "50K+", label: "Team Members" },
              { number: "98%", label: "Uptime" },
              { number: "99%", label: "Satisfaction" },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Projects */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-2">
                Explore Public Projects
              </h2>
              <p className="text-gray-600">
                Preview live workspaces created by teams on ProjectHub
              </p>
            </div>
            <button
              onClick={handleProjectClick}
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Open your workspace
            </button>
          </div>

          {loadingProjects ? (
            <div className="text-center py-10 text-gray-500">
              Loading public projects...
            </div>
          ) : publicProjects.length === 0 ? (
            <div className="text-center py-14 bg-gray-50 rounded-xl border border-gray-200">
              <FolderOpen className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600">No public projects available yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicProjects.slice(0, 6).map((project) => (
                <button
                  key={project._id}
                  onClick={() => handlePublicProjectClick(project._id)}
                  className="text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-5 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500 font-mono mt-1">
                        {project.code}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 capitalize">
                      {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-4 line-clamp-2">
                    {project.description || "No description provided"}
                  </p>
                  <p className="text-xs text-gray-500 mt-4">
                    Members: {project.members?.length || 0}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {[
              {
                q: "Is ProjectHub free to use?",
                a: "Yes! ProjectHub offers a free tier with unlimited projects and team members. Premium features are available with paid plans.",
              },
              {
                q: "How does AI help my projects?",
                a: "Our AI analyzes your project data to provide recommendations, predict timelines, identify risks, and suggest optimizations.",
              },
              {
                q: "Can I integrate with other tools?",
                a: "Yes! ProjectHub supports integrations with popular tools like Slack, Jira, GitHub, and more.",
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. We use enterprise-grade encryption and comply with SOC 2, GDPR, and other standards.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {faq.q}
                </h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-white font-semibold mb-4">ProjectHub</h3>
              <p className="text-sm">
                AI-powered project management for modern teams
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => {
                      navigate("/");
                      setTimeout(() => {
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                    className="hover:text-white transition text-left"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    className="hover:text-white transition"
                  >
                    Security
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li>
                  <button
                    onClick={() => navigate("/about")}
                    className="hover:text-white transition text-left"
                  >
                    About
                  </button>
                </li>
                <li>
                  <a
                    href="#"
                    target="_blank"
                    className="hover:text-white transition"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; 2024 ProjectHub. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </PublicLayout>
  );
}
