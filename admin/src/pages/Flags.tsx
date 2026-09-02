import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api";
import { Badge } from "../components/Badge";
import { Pagination } from "../components/Pagination";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { Skeleton, EmptyState, ErrorState } from "../components/States";
import { useToast } from "../components/ToastContext";
import type { AdminFlag } from "../types";

const targetLabel: Record<AdminFlag["targetType"], string> = {
  user: "👤 Utilisateur",
  animal: "🐾 Annonce",
  report: "🚨 Signalement",
  message: "💬 Message",
};

const statusVariant: Record<AdminFlag["status"], "warning" | "success" | "neutral"> = {
  pending: "warning",
  reviewed: "success",
  dismissed: "neutral",
};

const PAGE_SIZE = 20;

export function Flags() {
  const [flags, setFlags] = useState<AdminFlag[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<"pending" | "all">("pending");
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pendingAction, setPendingAction] = useState<{ flag: AdminFlag; status: AdminFlag["status"] } | null>(null);
  const { showToast } = useToast();

  const load = () => {
    setFlags(null);
    setError("");
    api
      .get("/flags", { params: statusFilter === "pending" ? { status: "pending" } : {} })
      .then(({ data }) => setFlags(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(load, [statusFilter]);
  useEffect(() => setPage(1), [statusFilter]);

  const confirmUpdate = async () => {
    if (!pendingAction) return;
    const { flag, status } = pendingAction;
    try {
      await api.put(`/flags/${flag._id}`, { status });
      showToast(status === "reviewed" ? "Contenu marqué comme traité." : "Signalement rejeté.", "success");
      load();
    } catch (err) {
      showToast(getErrorMessage(err), "error");
    } finally {
      setPendingAction(null);
    }
  };

  const pages = flags ? Math.max(1, Math.ceil(flags.length / PAGE_SIZE)) : 1;
  const pageItems = flags ? flags.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  return (
    <div>
      <h1 className="page-title">Contenus signalés</h1>
      <p className="page-subtitle">Signalements d'utilisateurs, d'annonces ou de messages par la communauté</p>

      <div className="tabs-row">
        <button
          className={`tab-chip${statusFilter === "pending" ? " active" : ""}`}
          onClick={() => setStatusFilter("pending")}
        >
          En attente
        </button>
        <button className={`tab-chip${statusFilter === "all" ? " active" : ""}`} onClick={() => setStatusFilter("all")}>
          Tous
        </button>
      </div>

      {error && <ErrorState message={error} onRetry={load} />}
      {!flags && !error && <Skeleton />}

      {flags && (
        <div className="card">
          <table>
            <thead>
              <tr>
                <th>Cible</th>
                <th>Motif</th>
                <th>Signalé par</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((flag) => (
                <tr key={flag._id}>
                  <td>{targetLabel[flag.targetType]}</td>
                  <td>{flag.reason}</td>
                  <td>{flag.reporter ? `${flag.reporter.firstName} ${flag.reporter.lastName}` : "—"}</td>
                  <td>
                    <Badge label={flag.status} variant={statusVariant[flag.status]} />
                  </td>
                  <td>{new Date(flag.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td>
                    {flag.status === "pending" && (
                      <>
                        <button
                          className="action-link primary"
                          onClick={() => setPendingAction({ flag, status: "reviewed" })}
                        >
                          Traité
                        </button>
                        <button
                          className="action-link danger"
                          onClick={() => setPendingAction({ flag, status: "dismissed" })}
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {flags.length === 0 && <EmptyState message="Aucun contenu signalé." />}
          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!pendingAction}
        title={pendingAction?.status === "reviewed" ? "Marquer comme traité" : "Rejeter le signalement"}
        message="Confirmer cette action de modération ?"
        confirmLabel="Confirmer"
        danger={pendingAction?.status === "dismissed"}
        onConfirm={confirmUpdate}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
