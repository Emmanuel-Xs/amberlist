import type { QueryClient } from '@tanstack/react-query'
import { api, qk } from '#/lib/api'
import type { Note } from '#/lib/api'
import { sound } from '#/lib/feedback'
import { toast } from '#/lib/store'

/** Removes a note at once and shows an Undo toast; the server delete waits for the undo window. */
export function deleteNoteWithUndo(qc: QueryClient, id: string) {
  const prev = qc.getQueryData<Note[]>(qk.notes)
  qc.setQueryData<Note[]>(qk.notes, (old) => old?.filter((n) => n.id !== id))
  sound('delete')
  let undone = false
  setTimeout(() => {
    if (undone) return
    void api(`/notes/${id}`, { method: 'DELETE' }).finally(() => {
      void qc.invalidateQueries({ queryKey: qk.notes })
      void qc.invalidateQueries({ queryKey: qk.tasks })
    })
  }, 4200)
  toast({
    icon: 'trash',
    message: 'Note deleted',
    actionLabel: 'Undo',
    onAction: () => {
      undone = true
      sound('undo')
      if (prev) qc.setQueryData(qk.notes, prev)
    },
  })
}
