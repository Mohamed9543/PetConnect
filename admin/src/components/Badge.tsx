type Variant = "success" | "warning" | "error" | "info" | "neutral";

export function Badge({ label, variant = "neutral" }: { label: string; variant?: Variant }) {
  return <span className={`badge badge-${variant}`}>{label}</span>;
}
