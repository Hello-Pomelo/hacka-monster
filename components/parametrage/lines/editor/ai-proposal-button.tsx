import { useTransition } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"

import { proposeLineAction } from "@/app/(app)/parametrage/actions"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { LineProposal } from "@/lib/parametrage/types"

type AiProposalButtonProps = {
  lineId: string
  hasProposal: boolean
  // Enregistre d'abord les posts collés : l'action relit la ligne en base.
  beforePropose: () => Promise<void>
  onProposal: (proposal: LineProposal) => void
  disabled?: boolean
}

// Proposition de la voix, des piliers et des réglages par l'IA (E1, étape 3 ; US2). Rien n'est
// enregistré ici : l'éditeur applique la proposition, puis son enregistrement automatique la garde.
export function AiProposalButton({
  lineId,
  hasProposal,
  beforePropose,
  onProposal,
  disabled = false,
}: AiProposalButtonProps) {
  const [pending, startTransition] = useTransition()

  function propose() {
    startTransition(async () => {
      try {
        await beforePropose()
        const result = await proposeLineAction(lineId)
        if (!result.ok) {
          toast.error(result.error)
          return
        }
        onProposal(result.data)
        toast.success("Proposition appliquée : relisez chaque champ.")
      } catch {
        toast.error("La proposition a échoué. Vérifiez votre connexion puis réessayez.")
      }
    })
  }

  return (
    <Button type="button" className="h-10 px-4" onClick={propose} disabled={disabled || pending}>
      {pending ? <Spinner aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      {pending
        ? "L'IA analyse vos posts… (30 s au plus)"
        : hasProposal
          ? "Proposer à nouveau"
          : "Proposer avec l'IA"}
    </Button>
  )
}
