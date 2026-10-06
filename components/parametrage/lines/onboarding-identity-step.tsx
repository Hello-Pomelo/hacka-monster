import { LineEditor } from "@/components/parametrage/lines/editor/line-editor"
import { CurrentLineSwitch, LineChoiceForm } from "@/components/parametrage/lines/line-choice-form"
import { getEditorialLines, getImportedPosts } from "@/lib/parametrage/queries"
import { isEditableLineCode } from "@/lib/parametrage/types"
import { requireProfile } from "@/lib/supabase/auth"

// Étape « Identité et exemples » de l'onboarding (E1, étapes 1 à 3 regroupées au hackathon).
// Le choix de la ligne renseigne profiles.line_id (contrat 3) ; l'éditeur s'enregistre seul.
export async function OnboardingIdentityStep() {
  const [profile, lines, importedPosts] = await Promise.all([
    requireProfile(),
    getEditorialLines(),
    getImportedPosts(),
  ])

  const myLine = lines.find((line) => line.id === profile.line_id) ?? null

  if (!myLine || !isEditableLineCode(myLine.code)) {
    return (
      <section aria-labelledby="line-choice-title" className="grid gap-4 rounded-xl bg-card p-6">
        <div className="grid gap-1">
          <h2 id="line-choice-title" className="font-heading text-2xl">
            Votre ligne éditoriale
          </h2>
          <p className="text-muted-foreground">Choisissez la ligne éditoriale de votre équipe.</p>
        </div>
        <LineChoiceForm lines={lines} currentCode={null} />
      </section>
    )
  }

  return (
    <CurrentLineSwitch lines={lines} current={myLine}>
      <LineEditor
        key={myLine.id}
        line={myLine}
        importedPosts={importedPosts}
        sections={["identity", "examples", "voice", "defaults"]}
      />
    </CurrentLineSwitch>
  )
}
