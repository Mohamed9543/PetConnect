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
import type { AdminAnimal, PaginatedResponse } from "../types";

const statusVariant: Record<string, "success" | "warning" | "neutral"> = {
  available: "success",
  pending: "warning",
  adopted: "neutral",
};

const typeOptions = [
  { value: "dog", label: "Chien" },
  { value: "cat", label: "Chat" },
  { value: "other", label: "Autre" },
];

const statusOptions = [
  { value: "available", label: "Disponible" },
  { value: "pending", label: "En attente" },
  { value: "adopted", label: "Adopté" },
];

export function Animals() {
  const [result, setResult] = useState<PaginatedResponse<AdminAnimal> | null>(null);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<AdminAnimal | null>(null);
  const { page, search, filters, setPage, setSearch, setFilter } = useQueryState();
  const { showToast } = useToast();

  const load = () => {
    setError("");
    api
      .get("/admin/animals", { params: buildQuery({ page, search, type: filters.type, status: filters.status, limit: 20 }) })
      .then(({ data }) => setResult(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, [page, search, filters.type, filters.status]);

  const remove = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/animals/${toDelete._id}`);
      showToast("Annonce supprimée.", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div>
      <h1 className="page-title">Annonces d'adoption</h1>
      <p className="page-subtitle">{result ? `${result.total} annonces` : "Chargement..."}</p>

      <div className="toolbar-row">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un animal, une race, une ville..." />
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
                <th>Animal</th>
                <th>Type</th>
                <th>Propriétaire</th>
                <th>Statut</th>
                <th>Publié le</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((animal) => (
                <tr key={animal._id}>
                  <td>{animal.name}</td>
                  <td>{animal.type}</td>
                  <td>{animal.owner ? `${animal.owner.firstName} ${animal.owner.lastName}` : "—"}</td>
                  <td>
                    <Badge label={animal.status} variant={statusVariant[animal.status] ?? "neutral"} />
                  </td>
                  <td>{new Date(animal.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    <button className="action-link danger" onClick={() => setToDelete(animal)}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.data.length === 0 && <EmptyState message="Aucune annonce." />}
          <Pagination page={result.page} pages={result.pages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Supprimer l'annonce"
        message={`Supprimer définitivement l'annonce de ${toDelete?.name} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        danger
        onConfirm={remove}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
