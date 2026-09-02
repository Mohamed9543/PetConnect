import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../AuthContext";
import { api } from "../api";
import { ThemeToggle } from "./ThemeToggle";

const navItems = [
  { to: "/", label: "Tableau de bord", icon: "📊", end: true },
  { to: "/users", label: "Utilisateurs", icon: "👥" },
  { to: "/animals", label: "Annonces", icon: "🐾" },
  { to: "/reports", label: "Signalements", icon: "🚨" },
  { to: "/flags", label: "Contenus signalés", icon: "🛡️", flagKey: true },
];

export function Layout() {
  const { admin, logout } = useAuth();
  const [pendingFlags, setPendingFlags] = useState(0);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then(({ data }) => setPendingFlags(data.pendingFlags))
      .catch(() => {});
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">🐾 PetConnect Admin</div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
              {item.flagKey && pendingFlags > 0 && <span className="sidebar-badge">{pendingFlags}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div style={{ padding: "0 12px 10px", fontSize: 13, color: "var(--text-secondary)" }}>
            {admin?.firstName} {admin?.lastName}
          </div>
          <ThemeToggle />
          <button className="logout-btn" onClick={logout}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
