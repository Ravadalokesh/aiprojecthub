import { ArrowRight, Code, Lightbulb, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppSelector } from "../hooks/useRedux";
import PublicLayout from "../components/PublicLayout";

export default function AboutPage() {
  const navigate = useNavigate();
  const { token } = useAppSelector((state) => state.auth);

  const handleGetStarted = () => {
    if (token) {
      navigate("/dashboard");
    } else {
      const event = new CustomEvent("openSignupModal");
      window.dispatchEvent(event);
    }
  };

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-block bg-white bg-opacity-20 text-white px-4 py-2 rounded-full mb-6">
            Student Project
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            About ProjectHub
          </h1>
          <p className="text-xl text-primary-100 max-w-2xl mx-auto">
            A modern web application for project management, built with
            cutting-edge technologies to help teams collaborate effectively.
          </p>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Project Overview
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                ProjectHub is a comprehensive project management platform
                developed as a student project. It combines modern frontend
                technologies with a robust backend to provide teams with a
                seamless collaboration experience.
              </p>
              <p className="text-lg text-gray-600 mb-6">
                The project demonstrates full-stack web development skills,
                including real-time collaboration, AI-powered insights, and
                professional UI/UX design.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">
                    Built with React & TypeScript
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">
                    Node.js & Express backend
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">MongoDB database</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-primary-600 rounded-full"></div>
                  <span className="text-gray-700">
                    AI-powered features with OpenRouter
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-100 to-primary-50 rounded-2xl p-12">
              <div className="space-y-8">
                <div className="text-center">
                  <div className="text-5xl font-bold text-primary-600 mb-2">
                    Full Stack
                  </div>
                  <p className="text-gray-600">Web Application</p>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-lg p-4 border-l-4 border-primary-600">
                    <div className="font-semibold text-gray-900 mb-1">
                      Frontend
                    </div>
                    <div className="text-sm text-gray-600">
                      React, TypeScript, Tailwind CSS, Vite
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-primary-600">
                    <div className="font-semibold text-gray-900 mb-1">
                      Backend
                    </div>
                    <div className="text-sm text-gray-600">
                      Node.js, Express, MongoDB, JWT
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-4 border-l-4 border-primary-600">
                    <div className="font-semibold text-gray-900 mb-1">
                      Features
                    </div>
                    <div className="text-sm text-gray-600">
                      Real-time sync, AI insights, Analytics
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Key Features Implemented
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: <Code className="text-primary-600" size={48} />,
                title: "Modern Tech Stack",
                description:
                  "Built with latest web technologies including React, TypeScript, Node.js, and MongoDB for optimal performance.",
              },
              {
                icon: <Lightbulb className="text-primary-600" size={48} />,
                title: "AI-Powered Insights",
                description:
                  "Integrated AI features using OpenRouter API to provide intelligent project recommendations and analysis.",
              },
              {
                icon: <BookOpen className="text-primary-600" size={48} />,
                title: "Real-Time Collaboration",
                description:
                  "Real-time updates, team management, and live project tracking for seamless team cooperation.",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-8 shadow-lg">
                <div className="mb-4">{item.icon}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Outcomes */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Learning Outcomes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              "Full-stack web application development",
              "React hooks and component architecture",
              "Express.js backend development",
              "MongoDB database design",
              "RESTful API design and integration",
              "User authentication with JWT",
              "Real-time data synchronization",
              "Responsive UI/UX design",
              "State management with Redux Toolkit",
              "API integration with third-party services",
              "Docker containerization",
              "Production-ready deployment practices",
            ].map((outcome, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-6 border border-gray-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-5 h-5 bg-primary-600 rounded-full mt-1 flex-shrink-0"></div>
                  <p className="text-gray-700 font-semibold">{outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Details */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Frontend
              </h3>
              <ul className="space-y-3">
                {[
                  "React 18",
                  "TypeScript",
                  "Tailwind CSS",
                  "Redux Toolkit",
                  "Vite",
                ].map((tech, idx) => (
                  <li
                    key={idx}
                    className="text-gray-600 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                    {tech}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Backend</h3>
              <ul className="space-y-3">
                {["Node.js", "Express.js", "MongoDB", "Mongoose", "JWT"].map(
                  (tech, idx) => (
                    <li
                      key={idx}
                      className="text-gray-600 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                      {tech}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className="bg-white rounded-lg p-8 shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Services
              </h3>
              <ul className="space-y-3">
                {["OpenRouter AI", "Socket.io", "Redis", "Docker", "Linux"].map(
                  (tech, idx) => (
                    <li
                      key={idx}
                      className="text-gray-600 flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-primary-600 rounded-full"></span>
                      {tech}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl font-bold mb-6">Ready to Try ProjectHub?</h2>
          <p className="text-xl text-primary-100 mb-8">
            Experience a modern approach to project management. Start free
            today.
          </p>
          <button
            onClick={handleGetStarted}
            className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition inline-flex items-center gap-2"
          >
            Get Started Free <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="mb-2">
            &copy; 2024 ProjectHub. An Educational Project.
          </p>
          <p className="text-sm">Built with modern web technologies</p>
        </div>
      </footer>
    </PublicLayout>
  );
}
