'use client'

import { useActionState, useEffect, useState } from 'react'
import { Sheet } from '@/components/sheet'
import { SubmitButton } from '@/components/submit-button'
import { focusRing } from '@/lib/ui'
import { createProject, updateProject, deleteProject, type ActionState } from './actions'
import type { FreelanceProject, FreelanceProjectStatus } from '@/lib/types'

const field =
  'ios-field w-full min-h-[52px] rounded-[13px] px-4 py-3 text-base text-[#24202a] outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-100'

const label = 'eyebrow mb-2 block'

const STATUSES: { value: FreelanceProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function ProjectFormSheet({
  open,
  onClose,
  project,
  today,
}: {
  open: boolean
  onClose: () => void
  project?: FreelanceProject
  today: string
}) {
  const editing = Boolean(project)
  const [state, action] = useActionState<ActionState, FormData>(
    editing ? updateProject : createProject,
    {}
  )
  const [deleteState, deleteAction] = useActionState<ActionState, FormData>(deleteProject, {})
  const [status, setStatus] = useState<FreelanceProjectStatus>(project?.status ?? 'active')
  const [confirmDelete, setConfirmDelete] = useState(false)

  const done = state.ok || deleteState.ok
  useEffect(() => {
    if (done) onClose()
  }, [done, onClose])

  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Edit project' : 'New project'}>
      <form action={action} className="space-y-4 pb-2">
        {editing && <input type="hidden" name="id" value={project!.id} />}

        <div>
          <label htmlFor="project-title" className={label}>Project title</label>
          <input
            id="project-title"
            name="title"
            className={field}
            placeholder="e.g. Website redesign"
            defaultValue={project?.title}
            required
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor="project-client" className={label}>Client name</label>
          <input
            id="project-client"
            name="client_name"
            className={field}
            placeholder="e.g. Acme Corp"
            defaultValue={project?.client_name}
            required
            maxLength={80}
          />
        </div>

        <div>
          <label htmlFor="project-quoted" className={label}>Quoted amount</label>
          <input
            id="project-quoted"
            name="quoted_amount"
            className={field}
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            defaultValue={project?.quoted_amount}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="project-start" className={label}>Start date</label>
            <input
              id="project-start"
              name="start_date"
              className={field}
              type="date"
              defaultValue={project?.start_date ?? today}
              required
            />
          </div>
          <div>
            <label htmlFor="project-end" className={label}>
              End date <span className="font-normal normal-case">(optional)</span>
            </label>
            <input
              id="project-end"
              name="end_date"
              className={field}
              type="date"
              defaultValue={project?.end_date ?? ''}
            />
          </div>
        </div>

        <div>
          <p id="project-status-label" className={label}>Status</p>
          <div className="grid grid-cols-4 gap-1 rounded-[13px] bg-[#e8e6eb]/80 p-1" role="group" aria-labelledby="project-status-label">
            {STATUSES.map((s) => (
              <button
                key={s.value}
                type="button"
                aria-pressed={status === s.value}
                onClick={() => setStatus(s.value)}
                className={`h-9 cursor-pointer rounded-[10px] px-1 text-[11px] font-bold transition ${
                  status === s.value ? 'bg-[#29242f] text-white shadow-sm' : 'text-[color:var(--text-muted)]'
                } ${focusRing}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <input type="hidden" name="status" value={status} />
        </div>

        <div>
          <label htmlFor="project-description" className={label}>
            Description <span className="font-normal normal-case">(optional)</span>
          </label>
          <textarea
            id="project-description"
            name="description"
            className={`${field} min-h-[80px] resize-none py-3`}
            placeholder="Scope of work, deliverables…"
            defaultValue={project?.description ?? ''}
            maxLength={500}
          />
        </div>

        {state.error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
            {state.error}
          </p>
        )}

        <SubmitButton pendingLabel="Saving…">
          {editing ? 'Save changes' : 'Add project'}
        </SubmitButton>
      </form>

      {editing && (
        <div className="mt-2 border-t border-slate-200 pt-3">
          {confirmDelete ? (
            <form action={deleteAction} className="space-y-2">
              <input type="hidden" name="id" value={project!.id} />
              <p className="text-sm text-slate-700">
                Delete “{project!.title}”? Its payment records will be removed, but the income
                already logged to your accounts stays in your transaction history. This cannot be
                undone.
              </p>
              {deleteState.error && (
                <p role="alert" className="rounded-xl bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
                  {deleteState.error}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className={`min-h-[48px] flex-1 cursor-pointer rounded-[14px] border border-slate-300 font-medium text-slate-700 transition active:scale-[0.98] ${focusRing}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`min-h-[48px] flex-1 cursor-pointer rounded-[14px] bg-rose-600 font-semibold text-white transition active:scale-[0.98] ${focusRing}`}
                >
                  Delete
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={`min-h-[44px] w-full cursor-pointer rounded-[14px] text-sm font-semibold text-rose-700 transition hover:bg-rose-50 ${focusRing}`}
            >
              Delete project
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}
