const FALLBACK = "Une erreur est survenue. Merci de réessayer.";

// Backend error messages are already user-friendly French strings (see
// backend/src/middleware/errorHandler.js). This guards against surfacing raw
// network/driver errors (e.g. "Network Error", "MongoServerError: ...") when
// the API is unreachable or returns something unexpected.
export function getErrorMessage(error: unknown, fallback: string = FALLBACK): string {
  const apiMessage = (error as any)?.response?.data?.message;
  if (typeof apiMessage === "string" && apiMessage.length > 0 && !/error|exception/i.test(apiMessage)) {
    return apiMessage;
  }

  if ((error as any)?.message === "Network Error") {
    return "Impossible de contacter le serveur. Vérifiez votre connexion.";
  }

  return fallback;
}
