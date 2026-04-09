import { useEffect, useState } from "react";
import { teamAPI } from "../services/api";
import Layout from "../components/Layout";
import { Plus, Users, Trash2, UserPlus, Crown, Loader2 } from "lucide-react";
import type { Team } from "../types";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [memberEmail, setMemberEmail] = useState("");
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const res = await teamAPI.getTeams();
      setTeams(res.data.data);
    } catch {
      console.error("Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await teamAPI.createTeam(form);
      setTeams([res.data.data, ...teams]);
      setForm({ name: "", description: "" });
      setShowCreate(false);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to create team");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this team?")) return;
    try {
      await teamAPI.deleteTeam(id);
      setTeams(teams.filter((t) => t._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete team");
    }
  };

  const handleAddMember = async (teamId: string) => {
    if (!memberEmail.trim()) return;
    try {
      const res = await teamAPI.addMember(teamId, memberEmail);
      setTeams(teams.map((t) => (t._id === teamId ? res.data.data : t)));
      setMemberEmail("");
      setShowAddMember(null);
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to add member");
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      const res = await teamAPI.removeMember(teamId, memberId);
      setTeams(teams.map((t) => (t._id === teamId ? res.data.data : t)));
    } catch (err: any) {
      alert(err.response?.data?.message || "Cannot remove member");
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
            <p className="text-gray-600 mt-1">Manage your teams and members</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            <Plus className="h-4 w-4" /> New Team
          </button>
        </div>

        {/* Create Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Create Team
              </h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 transition"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Teams List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : teams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No teams yet
            </h3>
            <p className="text-gray-500 mb-4">
              Create a team to start collaborating
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create Team
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team._id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {team.name}
                    </h3>
                    {team.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {team.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setShowAddMember(
                          showAddMember === team._id ? null : team._id,
                        )
                      }
                      className="p-2 hover:bg-gray-100 rounded-lg transition text-primary-600"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(team._id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Add member form */}
                {showAddMember === team._id && (
                  <div className="flex gap-2 mb-4 p-3 bg-blue-50 rounded-lg">
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="Enter member email..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleAddMember(team._id)
                      }
                    />
                    <button
                      onClick={() => handleAddMember(team._id)}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition"
                    >
                      Add
                    </button>
                  </div>
                )}

                {/* Members */}
                <div className="flex flex-wrap gap-2">
                  {team.members?.map((member: any) => (
                    <div
                      key={member._id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg group"
                    >
                      <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">
                        {(member.name || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm text-gray-700">
                        {member.name || member.email}
                      </span>
                      {(team.lead as any)?._id === member._id && (
                        <Crown className="h-3.5 w-3.5 text-amber-500" />
                      )}
                      {(team.lead as any)?._id !== member._id && (
                        <button
                          onClick={() =>
                            handleRemoveMember(team._id, member._id)
                          }
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-red-100 rounded transition"
                        >
                          <Trash2 className="h-3 w-3 text-red-400" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
