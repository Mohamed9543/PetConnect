import { useEffect, useState } from "react";
import { api, getErrorMessage } from "../api";
import type { UserDetailResponse } from "../types";
import { Badge } from "./Badge";
import { Skeleton } from "./States";

export function UserDetailModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [detail, setDetail] = useState<UserDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setDetail(null);
    setError("");
    api
      .get(`/admin/users/${userId}`)
      .then(({ data }) => setDetail(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [userId]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-card-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Fiche utilisateur</h2>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}
        {!detail && !error && <Skeleton rows={4} />}

        {detail && (
          <div className="user-detail-body">
            <section className="detail-section">
              <h3>Informations principales</h3>
              <p>
                <strong>
                  {detail.user.role === "association"
                    ? detail.user.organizationName || "—"
                    : `${detail.user.firstName} ${detail.user.lastName}`}
                </strong>{" "}
                {detail.user.verified && <Badge label="Vérifié" variant="info" />}
              </p>
              <p>{detail.user.email}</p>
              <p>{detail.user.city || "—"}</p>
              <p>
                {detail.user.isBlocked ? (
                  <Badge label="Bloqué" variant="error" />
                ) : (
                  <Badge label="Actif" variant="success" />
                )}
              </p>
            </section>

            <section className="detail-section">
              <h3>Annonces ({detail.animals.length})</h3>
              {detail.animals.length === 0 && <p className="text-muted">Aucune annonce.</p>}
              <ul className="detail-list">
                {detail.animals.map((animal) => (
                  <li key={animal._id}>
                    {animal.name} — <Badge label={animal.status} variant="neutral" />
                  </li>
                ))}
              </ul>
            </section>

            <section className="detail-section">
              <h3>Signalements ({detail.reports.length})</h3>
              {detail.reports.length === 0 && <p className="text-muted">Aucun signalement.</p>}
              <ul className="detail-list">
                {detail.reports.map((report) => (
                  <li key={report._id}>
                    {report.reference} — {report.type === "lost" ? "Perdu" : "Trouvé"} —{" "}
                    <Badge label={report.status} variant="neutral" />
                  </li>
                ))}
              </ul>
            </section>

            <section className="detail-section">
              <h3>Demandes d'adoption ({detail.adoptionRequests.length})</h3>
              {detail.adoptionRequests.length === 0 && <p className="text-muted">Aucune demande.</p>}
              <ul className="detail-list">
                {detail.adoptionRequests.map((req) => (
                  <li key={req._id}>
                    {req.animal?.name || "Animal supprimé"} — <Badge label={req.status} variant="neutral" />
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
