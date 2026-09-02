import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api";
import { StatCard } from "../components/StatCard";
import { Chart } from "../components/Chart";
import { ErrorState } from "../components/States";
import type { Stats, TimeRange, TimeseriesResponse } from "../types";

const cards: { key: keyof Stats; label: string; icon: string; suffix?: string }[] = [
  { key: "users", label: "Utilisateurs", icon: "👥" },
  { key: "animals", label: "Animaux publiés", icon: "🐾" },
  { key: "adoptedAnimals", label: "Adoptions réalisées", icon: "🏠" },
  { key: "openReports", label: "Signalements actifs", icon: "🚨" },
  { key: "foundReports", label: "Animaux retrouvés", icon: "🎉" },
  { key: "associations", label: "Associations", icon: "🏢" },
  { key: "pendingFlags", label: "Contenus à modérer", icon: "🛡️" },
];

const ranges: { value: TimeRange; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "7d", label: "7 jours" },
  { value: "30d", label: "30 jours" },
  { value: "3m", label: "3 mois" },
  { value: "1y", label: "1 an" },
];

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [timeseries, setTimeseries] = useState<TimeseriesResponse | null>(null);
  const [range, setRange] = useState<TimeRange>("7d");
  const [error, setError] = useState("");

  const loadStats = () => {
    api
      .get("/admin/stats")
      .then(({ data }) => setStats(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(loadStats, []);

  useEffect(() => {
    setTimeseries(null);
    api
      .get("/admin/stats/timeseries", { params: { range } })
      .then(({ data }) => setTimeseries(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [range]);

  return (
    <div>
      <h1 className="page-title">Tableau de bord</h1>
      <p className="page-subtitle">Vue d'ensemble de l'activité PetConnect</p>

      {error && <ErrorState message={error} onRetry={loadStats} />}

      <div className="stat-grid">
        {cards.map((card) => (
          <StatCard key={card.key} icon={card.icon} label={card.label} value={stats ? stats[card.key] : "—"} />
        ))}
        <StatCard icon="📈" label="Taux d'adoption" value={stats ? `${stats.adoptionRate}%` : "—"} />
        <StatCard icon="🧭" label="Taux d'animaux retrouvés" value={stats ? `${stats.foundRate}%` : "—"} />
      </div>

      <div className="period-tabs">
        {ranges.map((r) => (
          <button
            key={r.value}
            className={`tab-chip${range === r.value ? " active" : ""}`}
            onClick={() => setRange(r.value)}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="chart-grid">
        <Chart title="Utilisateurs" data={timeseries?.series.users ?? []} color="#2e7d32" />
        <Chart title="Annonces" data={timeseries?.series.animals ?? []} color="#f57c00" />
        <Chart title="Adoptions" data={timeseries?.series.adoptions ?? []} color="#1565c0" />
        <Chart title="Signalements" data={timeseries?.series.reports ?? []} color="#c62828" />
      </div>
    </div>
  );
}
