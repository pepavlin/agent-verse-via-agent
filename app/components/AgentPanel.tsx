'use client'

// ---------------------------------------------------------------------------
// AgentPanel — unified panel that opens when a user clicks on an agent.
//
// Modes:
//   Run  — enter a task description, choose delivery (Počkat / Inbox),
//          click Spustit. Clean, focused on the task at hand.
//   Edit — change agent name, goal, and persona; click Uložit to save.
//
// Design principle: each mode does exactly one thing, nothing more.
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import type { AgentDef } from './agents-config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PanelMode = 'run' | 'edit'
export type DeliveryMode = 'wait' | 'inbox'

/**
 * Phase for wait-delivery runs.
 *
 * - idle    : no active run — show the normal Run form
 * - running : run is executing — show a spinner
 * - done    : run completed — show the result inline
 * - error   : run failed — show the error message inline
 */
export type WaitRunPhase = 'idle' | 'running' | 'done' | 'error'

export interface RunTaskPayload {
  agentId: string
  task: string
  delivery: DeliveryMode
}

export interface EditSavePayload {
  agentId: string
  name: string
  goal: string
  persona: string
}

export interface AgentPanelProps {
  /** Agent definition to display. Setting to null closes the panel. */
  agentDef: AgentDef | null
  /** Called when the user closes the panel (× button or backdrop). */
  onClose: () => void
  /** Called when the user submits a task in Run mode. */
  onRunTask: (payload: RunTaskPayload) => void
  /** Called when the user saves edits in Edit mode. */
  onEditSave: (payload: EditSavePayload) => void
  /**
   * Optional list of child agent definitions resolved from agentDef.childAgentIds.
   * When present, the submit button label changes to indicate delegation.
   */
  childAgentDefs?: AgentDef[]
  /**
   * Phase of the active wait-delivery run.
   * Controls whether the Run tab shows the form, a spinner, or an inline result.
   */
  waitPhase?: WaitRunPhase
  /** Result text displayed when waitPhase === 'done'. */
  waitResult?: string
  /** Error text displayed when waitPhase === 'error'. */
  waitError?: string
  /** Called when the user clicks "Nový úkol" to reset the panel to the form. */
  onNewTask?: () => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentPanel({
  agentDef,
  onClose,
  onRunTask,
  onEditSave,
  childAgentDefs,
  waitPhase = 'idle',
  waitResult,
  waitError,
  onNewTask,
}: AgentPanelProps) {
  const [mode, setMode] = useState<PanelMode>('run')

  // Run mode state
  const [task, setTask] = useState('')
  const [delivery, setDelivery] = useState<DeliveryMode>('wait')

  // Edit mode state — seeded from agentDef
  const [editName, setEditName] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [editPersona, setEditPersona] = useState('')

  // Reset all state whenever the selected agent changes
  useEffect(() => {
    if (agentDef) {
      setEditName(agentDef.name)
      setEditGoal(agentDef.goal ?? '')
      setEditPersona(agentDef.persona ?? '')
      setTask('')
      setDelivery('wait')
      setMode('run')
    }
  }, [agentDef?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!agentDef) return null

  const colorHex = `#${agentDef.color.toString(16).padStart(6, '0')}`
  const hasDelegation = childAgentDefs && childAgentDefs.length > 0

  // ---- Handlers ----

  function handleRun() {
    const trimmed = task.trim()
    if (!trimmed) return
    onRunTask({ agentId: agentDef!.id, task: trimmed, delivery })
  }

  function handleSave() {
    const trimmedName = editName.trim()
    if (!trimmedName) return
    onEditSave({
      agentId: agentDef!.id,
      name: trimmedName,
      goal: editGoal.trim(),
      persona: editPersona.trim(),
    })
    onClose()
  }

  // ---- Render ----

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        aria-hidden="true"
        onClick={onClose}
        data-testid="agent-panel-backdrop"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Agent panel: ${agentDef.name}`}
        className="fixed z-40 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
                   w-full max-w-sm
                   bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl
                   flex flex-col overflow-hidden"
        data-testid="agent-panel"
      >
        {/* ── Header ── */}
        <div
          className="flex items-center gap-3 px-5 pt-5 pb-4"
          style={{ borderBottom: '1px solid rgba(51,65,85,0.6)' }}
        >
          {/* Agent colour accent dot */}
          <span
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 ring-2 ring-white/10"
            style={{ background: colorHex }}
            aria-hidden="true"
          />

          {/* Name + role */}
          <div className="flex-1 min-w-0">
            <p
              className="text-white font-semibold text-sm leading-tight truncate"
              data-testid="agent-panel-name"
            >
              {agentDef.name}
            </p>
            <p className="text-slate-500 text-[11px] font-mono mt-0.5">{agentDef.role}</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 w-7 h-7 flex items-center justify-center
                       rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0 text-base"
            aria-label="Zavřít panel"
          >
            ✕
          </button>
        </div>

        {/* ── Mode toggle (pill) ── */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex bg-slate-800 rounded-lg p-0.5 gap-0.5">
            <ModeButton
              label="Run"
              active={mode === 'run'}
              onClick={() => setMode('run')}
              testId="tab-run"
            />
            <ModeButton
              label="Edit"
              active={mode === 'edit'}
              onClick={() => setMode('edit')}
              testId="tab-edit"
            />
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-5 py-4 flex flex-col gap-3">
          {mode === 'run' ? (
            <>
              {waitPhase === 'idle' ? (
                <RunForm
                  task={task}
                  delivery={delivery}
                  onTaskChange={setTask}
                  onDeliveryChange={setDelivery}
                  onSubmit={handleRun}
                  hasDelegation={hasDelegation ?? false}
                />
              ) : (
                <WaitResult
                  phase={waitPhase}
                  result={waitResult}
                  error={waitError}
                  onNewTask={onNewTask}
                />
              )}
            </>
          ) : (
            <EditForm
              name={editName}
              goal={editGoal}
              persona={editPersona}
              onNameChange={setEditName}
              onGoalChange={setEditGoal}
              onPersonaChange={setEditPersona}
              onSave={handleSave}
            />
          )}
        </div>
      </div>
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface ModeButtonProps {
  label: string
  active: boolean
  onClick: () => void
  testId: string
}

function ModeButton({ label, active, onClick, testId }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all
        ${active
          ? 'bg-slate-700 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      {label}
    </button>
  )
}

// ---- Run form ----

interface RunFormProps {
  task: string
  delivery: DeliveryMode
  onTaskChange: (v: string) => void
  onDeliveryChange: (v: DeliveryMode) => void
  onSubmit: () => void
  /** Whether this agent delegates to child agents (changes button label). */
  hasDelegation: boolean
}

function RunForm({ task, delivery, onTaskChange, onDeliveryChange, onSubmit, hasDelegation }: RunFormProps) {
  return (
    <>
      {/* Task textarea */}
      <textarea
        value={task}
        onChange={(e) => onTaskChange(e.target.value)}
        placeholder="Zadejte úkol pro agenta…"
        rows={4}
        className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-3
                   text-sm text-slate-100 placeholder:text-slate-600
                   resize-none focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                   transition-colors"
        data-testid="run-task-input"
      />

      {/* Delivery toggle */}
      <DeliveryToggle value={delivery} onChange={onDeliveryChange} />

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!task.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                   bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   text-white disabled:opacity-30 disabled:cursor-not-allowed
                   shadow-sm"
        data-testid="run-submit-btn"
      >
        {hasDelegation ? 'Spustit s delegací' : 'Spustit'}
      </button>
    </>
  )
}

// ---- Delivery toggle (pill-style segmented control) ----

interface DeliveryToggleProps {
  value: DeliveryMode
  onChange: (v: DeliveryMode) => void
}

function DeliveryToggle({ value, onChange }: DeliveryToggleProps) {
  return (
    <fieldset>
      <legend className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
        Doručení
      </legend>
      <div className="flex bg-slate-800/60 border border-slate-700/60 rounded-xl p-0.5 gap-0.5">
        <DeliveryOption
          id="delivery-wait"
          label="Počkat"
          active={value === 'wait'}
          onClick={() => onChange('wait')}
        />
        <DeliveryOption
          id="delivery-inbox"
          label="Inbox"
          active={value === 'inbox'}
          onClick={() => onChange('inbox')}
        />
      </div>
    </fieldset>
  )
}

interface DeliveryOptionProps {
  id: string
  label: string
  active: boolean
  onClick: () => void
}

function DeliveryOption({ id, label, active, onClick }: DeliveryOptionProps) {
  return (
    <button
      type="button"
      id={id}
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 py-1.5 text-sm rounded-lg transition-all font-medium
        ${active
          ? 'bg-slate-700 text-white shadow-sm'
          : 'text-slate-500 hover:text-slate-300'
        }`}
    >
      {label}
    </button>
  )
}

// ---- Wait delivery result ----

interface WaitResultProps {
  phase: 'running' | 'done' | 'error'
  result?: string
  error?: string
  onNewTask?: () => void
}

/**
 * Replaces the RunForm while a wait-delivery run is in progress or has finished.
 *
 * - running : shows a spinner with "Zpracovávám…"
 * - done    : shows the result text with an emerald accent + "Nový úkol" button
 * - error   : shows the error text with a red accent  + "Nový úkol" button
 */
function WaitResult({ phase, result, error, onNewTask }: WaitResultProps) {
  if (phase === 'running') {
    return (
      <div
        className="flex flex-col items-center gap-4 py-8 text-slate-400"
        data-testid="wait-running-indicator"
      >
        <div className="w-7 h-7 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm">Zpracovávám…</span>
      </div>
    )
  }

  const isDone = phase === 'done'

  return (
    <div className="flex flex-col gap-3" data-testid="wait-result-panel">
      {/* Status header */}
      <div
        className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wider ${
          isDone ? 'text-emerald-500' : 'text-red-500'
        }`}
      >
        <span aria-hidden="true" className="text-sm">{isDone ? '✓' : '✕'}</span>
        <span>{isDone ? 'Hotovo' : 'Chyba'}</span>
      </div>

      {/* Result / error body */}
      <div
        className={`rounded-xl px-3.5 py-3 text-sm text-slate-200 bg-slate-800/60 border leading-relaxed whitespace-pre-wrap ${
          isDone ? 'border-emerald-800/30' : 'border-red-800/30'
        }`}
      >
        {isDone ? (result ?? '') : (error ?? '')}
      </div>

      {/* Reset to form */}
      <button
        onClick={onNewTask}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                   bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300
                   border border-slate-700/60"
        data-testid="wait-new-task-btn"
      >
        Nový úkol
      </button>
    </div>
  )
}

// ---- Edit form — name, goal, and persona ----

interface EditFormProps {
  name: string
  goal: string
  persona: string
  onNameChange: (v: string) => void
  onGoalChange: (v: string) => void
  onPersonaChange: (v: string) => void
  onSave: () => void
}

function EditForm({ name, goal, persona, onNameChange, onGoalChange, onPersonaChange, onSave }: EditFormProps) {
  return (
    <>
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-name" className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Jméno
        </label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5
                     text-sm text-slate-100
                     focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                     transition-colors"
          data-testid="edit-name-input"
        />
      </div>

      {/* Goal */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-goal" className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Goal
        </label>
        <textarea
          id="edit-goal"
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
          placeholder="Co má agent dosáhnout?"
          rows={2}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5
                     text-sm text-slate-100 placeholder:text-slate-600
                     resize-none focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                     transition-colors"
          data-testid="edit-goal-input"
        />
      </div>

      {/* Persona */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-persona" className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Persona
        </label>
        <textarea
          id="edit-persona"
          value={persona}
          onChange={(e) => onPersonaChange(e.target.value)}
          placeholder="Jak se agent chová a komunikuje?"
          rows={2}
          className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl px-3.5 py-2.5
                     text-sm text-slate-100 placeholder:text-slate-600
                     resize-none focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/50
                     transition-colors"
          data-testid="edit-persona-input"
        />
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={!name.trim()}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all
                   bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   text-white disabled:opacity-30 disabled:cursor-not-allowed
                   shadow-sm"
        data-testid="edit-save-btn"
      >
        Uložit
      </button>
    </>
  )
}
