interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  return (
    <div className="pagination">
      <button className="pagination-btn" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        ← Précédent
      </button>
      <span className="pagination-info">
        Page {page} / {pages}
      </span>
      <button className="pagination-btn" disabled={page >= pages} onClick={() => onPageChange(page + 1)}>
        Suivant →
      </button>
    </div>
  );
}
