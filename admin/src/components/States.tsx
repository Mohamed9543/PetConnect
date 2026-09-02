export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: rows }).map((_, i) => (
        <div className="skeleton-row" key={i} />
      ))}
    </div>
  );
}

export function EmptyState({ message = "Aucun résultat." }: { message?: string }) {
  return <div className="empty-state">{message}</div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-state">
      <div className="error-banner">{message}</div>
      {onRetry && (
        <button className="btn-secondary" onClick={onRetry}>
          Réessayer
        </button>
      )}
    </div>
  );
}
