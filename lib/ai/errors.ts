import { APICallError, RetryError } from "ai"

// Traduit une erreur du fournisseur en message affichable à l'utilisateur.
export function toUserMessage(error: unknown): string {
  const cause = RetryError.isInstance(error) ? error.lastError : error
  if (!APICallError.isInstance(cause)) {
    return "La génération a échoué. Réessayez."
  }

  switch (cause.statusCode) {
    case 400:
      // Par exemple un modèle qui n'accepte pas de désactiver le raisonnement.
      return "Requête refusée par ce modèle : changez OPENROUTER_MODEL."
    case 401:
    case 403:
      return "Clé OpenRouter invalide : vérifiez OPENROUTER_API_KEY."
    case 402:
      return "Crédits OpenRouter épuisés."
    case 404:
      return "Modèle indisponible : changez OPENROUTER_MODEL."
    case 429:
      return "Modèle saturé ou quota du jour atteint. Réessayez dans une minute."
    default:
      return "Le fournisseur du modèle ne répond pas. Réessayez dans un instant."
  }
}
