interface StatCardProps {
  icon: string;
  label: string;
  value: number | string;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <div className="stat-card">
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
