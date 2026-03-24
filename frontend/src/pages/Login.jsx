import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Citizen");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email, role);
    if (!result.success) {
      setError(result.message || "Unable to login");
      return;
    }
    navigate(role === "Officer" ? "/officer" : "/citizen", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-8 w-full max-w-md">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            Citizen&apos;s Eye
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 mt-1">Welcome back</h1>
          <p className="text-sm text-slate-500">
            Use the seeded emails in the README to explore both roles.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-slate-600 block mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="aditi.rao@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-slate-600 block mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="Citizen">Citizen</option>
              <option value="Officer">Officer</option>
            </select>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 text-white py-2 rounded-lg font-semibold hover:bg-brand-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

