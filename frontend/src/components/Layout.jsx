import { useAuth } from "../context/AuthContext.jsx";

export default function Layout({ title, children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Citizen&apos;s Eye
            </p>
            <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          </div>
          {user && (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role}</p>
              </div>
              <button
                onClick={logout}
                className="px-3 py-1 text-sm border border-slate-300 rounded-md hover:bg-slate-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

