import { useEffect, useState } from "react";
import { api, buildQuery, getErrorMessage } from "../api";
import { Badge } from "../components/Badge";
import { SearchBar } from "../components/SearchBar";
import { Filters } from "../components/Filters";
import { Pagination } from "../components/Pagination";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { UserDetailModal } from "../components/UserDetailModal";
import { Skeleton, EmptyState, ErrorState } from "../components/States";
import { useToast } from "../components/ToastContext";
import { useQueryState } from "../hooks/useQueryState";
import type { AdminUser, PaginatedResponse } from "../types";

const roleOptions = [
  { value: "user", label: "Particulier" },
  { value: "association", label: "Association" },
  { value: "admin", label: "Admin" },
];

const statusOptions = [
  { value: "active", label: "Actif" },
  { value: "blocked", label: "Bloqué" },
  { value: "verified", label: "Vérifié" },
  { value: "unverified", label: "Non vérifié" },
];

export function Users() {
  const [result, setResult] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{ user: AdminUser; action: "block" | "verify" } | null>(null);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const { page, search, filters, setPage, setSearch, setFilter } = useQueryState();
  const { showToast } = useToast();

  const load = () => {
    setError("");
    api
      .get("/admin/users", { params: buildQuery({ page, search, role: filters.role, status: filters.status, limit: 20 }) })
      .then(({ data }) => setResult(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, [page, search, filters.role, filters.status]);

  const toggleBlock = async (user: AdminUser) => {
    try {
      await api.put(`/admin/users/${user._id}/block`);
      showToast(user.isBlocked ? "Utilisateur débloqué." : "Utilisateur bloqué.", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setConfirmTarget(null);
    }
  };

  const toggleVerify = async (user: AdminUser) => {
    try {
      await api.put(`/admin/users/${user._id}/verify`);
      showToast(user.verified ? "Badge retiré." : "Association vérifiée.", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setConfirmTarget(null);
    }
  };

  const handleConfirm = () => {
    if (!confirmTarget) return;
    if (confirmTarget.action === "block") toggleBlock(confirmTarget.user);
    else toggleVerify(confirmTarget.user);
  };

  return (
    <div>
      <h1 className="page-title">Utilisateurs</h1>
      <p className="page-subtitle">{result ? `${result.total} comptes` : "Chargement..."}</p>

      <div className="toolbar-row">
        <SearchBar value={search} onChange={setSearch} placeholder="Rechercher un nom, un email..." />
        <Filters
          filters={[
            { key: "role", label: "Tous les rôles", options: roleOptions },
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
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Ville</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((user) => (
                <tr key={user._id}>
                  <td className="clickable" onClick={() => setDetailUserId(user._id)}>
                    {user.role === "association" ? user.organizationName || "—" : `${user.firstName} ${user.lastName}`}
                    {user.verified && " ✓"}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.role === "admin" && <Badge label="Admin" variant="info" />}
                    {user.role === "association" && <Badge label="Association" variant="info" />}
                    {user.role === "user" && <Badge label="Particulier" variant="neutral" />}
                  </td>
                  <td>{user.city || "—"}</td>
                  <td>
                    {user.isBlocked ? <Badge label="Bloqué" variant="error" /> : <Badge label="Actif" variant="success" />}
                  </td>
                  <td>
                    {user.role === "association" && (
                      <button
                        className="action-link info"
                        onClick={() => setConfirmTarget({ user, action: "verify" })}
                      >
                        {user.verified ? "Retirer le badge" : "Vérifier"}
                      </button>
                    )}
                    <button className="action-link danger" onClick={() => setConfirmTarget({ user, action: "block" })}>
                      {user.isBlocked ? "Débloquer" : "Bloquer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {result.data.length === 0 && <EmptyState message="Aucun utilisateur." />}
          <Pagination page={result.page} pages={result.pages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.action === "block" ? "Confirmer l'action" : "Confirmer la vérification"}
        message={
          confirmTarget?.action === "block"
            ? `${confirmTarget.user.isBlocked ? "Débloquer" : "Bloquer"} le compte de ${confirmTarget.user.firstName} ${confirmTarget.user.lastName} ?`
            : `${confirmTarget?.user.verified ? "Retirer le badge de" : "Vérifier"} ${confirmTarget?.user.organizationName || ""} ?`
        }
        confirmLabel="Confirmer"
        danger={confirmTarget?.action === "block" && !confirmTarget.user.isBlocked}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmTarget(null)}
      />

      {detailUserId && <UserDetailModal userId={detailUserId} onClose={() => setDetailUserId(null)} />}
    </div>
  );
}
