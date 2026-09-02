import { useEffect, useState } from "react";
import { api, buildQuery, getErrorMessage } from "../api";
import { Badge } from "../components/Badge";
import { SearchBar } from "../components/SearchBar";
import { Filters } from "../components/Filters";
import { Pagination } from "../components/Pagination";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Skeleton, EmptyState, ErrorState } from "../components/States";
import { useToast } from "../components/ToastContext";
import { useQueryState } from "../hooks/useQueryState";
import type { AdminReport, PaginatedResponse } from "../types";

const statusMeta: Record<AdminReport["status"], { label: string; variant: "info" | "warning" | "success" | "neutral" }> = {
  active: { label: "Actif", variant: "info" },
  in_progress: { label: "En cours", variant: "warning" },
  found: { label: "Retrouvé", variant: "success" },
  resolved: { label: "Résolu", variant: "neutral" },
};

const typeOptions = [
  { value: "lost", label: "Perdu" },
  { value: "found", label: "Trouvé" },
];

const statusOptions = [
  { value: "active", label: "Actif" },
  { value: "in_progress", label: "En cours" },
  { value: "found", label: "Retrouvé" },
  { value: "resolved", label: "Résolu" },
];

export function Reports() {
  const [result, setResult] = useState<PaginatedResponse<AdminReport> | null>(null);
  const [error, setError] = useState("");
  const [toResolve, setToResolve] = useState<AdminReport | null>(null);
  const { page, search, filters, setPage, setSearch, setFilter } = useQueryState();
  const { showToast } = useToast();

  const load = () => {
    setError("");
    api
      .get("/admin/reports", { params: buildQuery({ page, search, type: filters.type, status: filters.status, limit: 20 }) })
      .then(({ data }) => setResult(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, [page, search, filters.type, filters.status]);

  const resolve = async () => {
    if (!toResolve) return;
    try {
      await api.put(`/admin/reports/${toResolve._id}/resolve`);
      showToast("Signalement marqué comme résolu.", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setToResolve(null);
    }
  };

  return (
    <div>
      <h1 className="page-title">Signalements</h1>
      <p className="page-subtitle">{result ? `${result.total} signalements` : "Chargement..."}</p>

      <div className="toolbar-row">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher une référence, un animal..." />
        <Filters
          filters={[
            { key: "type", label: "Tous les types", options: typeOptions },
            { key: "status", label: "Tous les statuts", options: statusOptions },
          ]}
          values={filters}
          onChange={setFilter}
        />
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!result && !error && <Skeleton />}

      {result && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Type</th>
                <th>Animal</th>
                <th>Auteur</th>
                <th>Statut</th>
                <th>Publié le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((report) => {
                const status = statusMeta[report.status];
                return (
                  <tr key={report._id}>
                    <td style={{ fontFamily: "monospace" }}>{report.reference}</td>
                    <td>{report.type === "lost" ? "🚨 Perdu" : "🐾 Trouvé"}</td>
                    <td>{report.animalName || report.animalType}</td>
                    <td>{report.user ? `${report.user.firstName} ${report.user.lastName}` : "—"}</td>
                    <td>
                      <Badge label={status.label} variant={status.variant} />
                    </td>
                    <td>{new Date(report.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td>
                      {report.status !== "resolved" && (
                        <button className="action-link primary" onClick={() => setToResolve(report)}>
                          Marquer résolu
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {result.data.length === 0 && <EmptyState message="Aucun signalement." />}
          <Pagination page={result.page} pages={result.pages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!toResolve}
        title="Marquer comme résolu"
        message={`Marquer le signalement ${toResolve?.reference} comme résolu ?`}
        confirmLabel="Confirmer"
        onConfirm={resolve}
        onCancel={() => setToResolve(null)}
      />
    </div>
  );
}
