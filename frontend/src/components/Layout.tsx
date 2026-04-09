import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  BarChart3,
  FolderOpen,
  LayoutDashboard,
  Users,
  Search,
  Plus,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks/useRedux";
import { logout } from "../store/slices/authSlice";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { projects } = useAppSelector((state) => state.projects);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const searchResults =
    searchQuery.trim().length > 0
      ? projects.filter(
          (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.code.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 w-64 h-screen bg-white border-r border-gray-200 flex flex-col z-20">
        {/* Logo */}
        <div
          className="p-6 border-b border-gray-200 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <h1 className="text-2xl font-bold text-primary-600">ProjectHub</h1>
          <p className="text-xs text-gray-400 mt-0.5">AI-Enhanced PM</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <NavItem
            label="Dashboard"
            href="/dashboard"
            icon={<LayoutDashboard className="h-5 w-5" />}
            active={location.pathname === "/dashboard"}
          />
          <NavItem
            label="Projects"
            href="/projects"
            icon={<FolderOpen className="h-5 w-5" />}
            active={location.pathname.startsWith("/projects")}
          />
          <NavItem
            label="Teams"
            href="/teams"
            icon={<Users className="h-5 w-5" />}
            active={location.pathname === "/teams"}
          />
          <NavItem
            label="Analytics"
            href="/analytics"
            icon={<BarChart3 className="h-5 w-5" />}
            active={location.pathname.startsWith("/analytics")}
          />
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate text-sm">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div className="flex-1 relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSearch(true);
                }}
                onFocus={() => setShowSearch(true)}
                onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {showSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full max-w-md mt-1 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  {searchResults.slice(0, 5).map((p) => (
                    <button
                      key={p._id}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
                      onMouseDown={() => {
                        navigate(`/projects/${p._id}`);
                        setSearchQuery("");
                        setShowSearch(false);
                      }}
                    >
                      <div className="font-medium text-sm text-gray-900">
                        {p.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {p.code} - {p.status}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <button
                onClick={() => navigate("/projects")}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> New Project
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  label,
  href,
  icon,
  active,
}: {
  label: string;
  href: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-left text-sm font-medium ${
        active
          ? "bg-primary-50 text-primary-700"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <span
        className={`shrink-0 ${active ? "text-primary-600" : "text-gray-400"}`}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
