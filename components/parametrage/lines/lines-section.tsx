import { ActivateLineButton } from "@/components/parametrage/lines/activate-line-button"
import { LineEditor } from "@/components/parametrage/lines/editor/line-editor"
import { LineOwnershipNotice } from "@/components/parametrage/lines/line-ownership-notice"
import { LinePicker } from "@/components/parametrage/lines/line-picker"
import { TestPostPanel } from "@/components/parametrage/lines/test-post-panel"
import { getEditorialLines, getImportedPosts } from "@/lib/parametrage/queries"
import {
  isEditableLineCode,
  type EditableLineCode,
  type EditorialLine,
} from "@/lib/parametrage/types"
import { requireProfile } from "@/lib/supabase/auth"

const EDITOR_SECTIONS: ("identity" | "examples" | "voice" | "defaults")[] = [
  "identity",
  "examples",
  "voice",
  "defaults",
]

type EditableLine = EditorialLine & { code: EditableLineCode }

function isEditableLine(line: EditorialLine): line is EditableLine {
  return isEditableLineCode(line.code)
}

// Onglet Lignes de /parametrage (E2, US5, US7) : chaque admin modifie la ligne de son équipe (D15).
export async function LinesSection({ lineCode }: { lineCode: string | undefined }) {
  const [profile, lines, importedPosts] = await Promise.all([
    requireProfile(),
    getEditorialLines(),
    getImportedPosts(),
  ])

  const editableLines = lines.filter(isEditableLine)
  const myLine = lines.find((line) => line.id === profile.line_id) ?? null
  const myCode = myLine && isEditableLine(myLine) ? myLine.code : null
  const selectedCode: EditableLineCode = isEditableLineCode(lineCode) ? lineCode : (myCode ?? "marketing")
  const selected = editableLines.find((line) => line.code === selectedCode)
  if (!selected) throw new Error("Ligne éditoriale introuvable.")
  const isMine = selected.id === profile.line_id

  return (
    <section aria-labelledby="lines-title" className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="grid gap-1">
          <h2 id="lines-title" className="font-heading text-2xl">
            Lignes éditoriales
          </h2>
          <p className="max-w-[720px] text-muted-foreground">
            Qui vous êtes, de quoi vous parlez et comment vous sonnez, pour chaque équipe. Chaque admin
            modifie la ligne de son équipe.
          </p>
        </div>
        <LinePicker
          lines={editableLines.map(({ code, name, configured }) => ({ code, name, configured }))}
          selectedCode={selectedCode}
          myCode={myCode}
        />
      </div>

      {isMine ? (
        <>
          <LineEditor
            key={`${selected.id}-edit`}
            line={selected}
            importedPosts={importedPosts}
            sections={EDITOR_SECTIONS}
          />
          <TestPostPanel lineId={selected.id} lineName={selected.name} />
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-card p-4">
            <div className="grid gap-0.5">
              <p className="font-medium">Activation de la ligne {selected.name}</p>
              <p className="text-sm text-muted-foreground">
                {selected.configured
                  ? "La ligne est active. Ses modifications sont enregistrées automatiquement."
                  : "Testez la ligne, puis activez la v1. Tant qu'elle n'est pas active, le calendrier affiche « Ligne éditoriale non configurée »."}
              </p>
            </div>
            <ActivateLineButton
              lineId={selected.id}
              lineName={selected.name}
              configured={selected.configured}
              mode="settings"
            />
          </div>
        </>
      ) : (
        <>
          <LineOwnershipNotice
            line={selected}
            myLineName={myLine?.name ?? null}
            currentLineEditable={myCode !== null}
          />
          <LineEditor
            key={`${selected.id}-read`}
            line={selected}
            importedPosts={importedPosts}
            sections={EDITOR_SECTIONS}
            readOnly
          />
        </>
      )}

      <p className="text-sm text-subtle-foreground">
        Ligne Neutre : appliquée quand le paramétrage est passé. Elle n&apos;est pas modifiable.
      </p>
    </section>
  )
}
