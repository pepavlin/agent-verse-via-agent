'use client'

// ---------------------------------------------------------------------------
// AgentPanel — unified panel that opens when a user clicks on an agent.
//
// Modes:
//   Run  — enter a task, choose delivery (Počkat / Inbox), click Spustit
//   Edit — change agent name, goal, persona; click Uložit
// ---------------------------------------------------------------------------

import { useState, useEffect } from 'react'
import type { AgentDef } from './agents-config'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PanelMode = 'run' | 'edit'
export type DeliveryMode = 'wait' | 'inbox'

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
   * Displayed in the Run panel so the user knows which sub-agents will be dispatched.
   */
  childAgentDefs?: AgentDef[]
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentPanel({ agentDef, onClose, onRunTask, onEditSave, childAgentDefs }: AgentPanelProps) {
  const [mode, setMode] = useState<PanelMode>('run')

  // Run mode state
  const [task, setTask] = useState('')
  const [delivery, setDelivery] = useState<DeliveryMode>('wait')

  // Edit mode state (seeded from agentDef)
  const [editName, setEditName] = useState('')
  const [editGoal, setEditGoal] = useState('')
  const [editPersona, setEditPersona] = useState('')

  // Seed edit fields whenever the selected agent changes
  useEffect(() => {
    if (agentDef) {
      setEditName(agentDef.name)
      setEditGoal(agentDef.goal ?? '')
      setEditPersona(agentDef.persona ?? '')
      // Reset run state on agent change
      setTask('')
      setDelivery('wait')
      setMode('run')
    }
  }, [agentDef?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!agentDef) return null

  const colorHex = `#${agentDef.color.toString(16).padStart(6, '0')}`

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
      {/* Backdrop — click to close */}
      <div
        className="fixed inset-0 z-30"
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
                   bg-slate-800 border border-slate-600 rounded-2xl shadow-2xl
                   flex flex-col overflow-hidden"
        data-testid="agent-panel"
      >
        {/* ── Header ── */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-700">
          {/* Agent colour dot */}
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: colorHex }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight truncate">
              {agentDef.name}
            </p>
            <p className="text-indigo-400 text-[11px] font-mono">{agentDef.role}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white w-6 h-6 flex items-center justify-center
                       rounded-lg hover:bg-slate-700 transition-colors flex-shrink-0"
            aria-label="Zavřít panel"
          >
            ✕
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex border-b border-slate-700">
          <TabButton
            label="Run"
            active={mode === 'run'}
            onClick={() => setMode('run')}
            testId="tab-run"
          />
          <TabButton
            label="Edit"
            active={mode === 'edit'}
            onClick={() => setMode('edit')}
            testId="tab-edit"
          />
        </div>

        {/* ── Body ── */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {mode === 'run' ? (
            <RunForm
              task={task}
              delivery={delivery}
              onTaskChange={setTask}
              onDeliveryChange={setDelivery}
              onSubmit={handleRun}
              childAgentDefs={childAgentDefs}
            />
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

interface TabButtonProps {
  label: string
  active: boolean
  onClick: () => void
  testId: string
}

function TabButton({ label, active, onClick, testId }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      data-testid={testId}
      className={`flex-1 py-2 text-sm font-medium transition-colors
        ${active
          ? 'text-white border-b-2 border-indigo-500 bg-slate-800'
          : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent hover:bg-slate-700/50'
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
  /** Child agents to be dispatched when this run starts (delegation mode). */
  childAgentDefs?: AgentDef[]
}

function RunForm({ task, delivery, onTaskChange, onDeliveryChange, onSubmit, childAgentDefs }: RunFormProps) {
  const hasDelegation = childAgentDefs && childAgentDefs.length > 0

  return (
    <>
      {/* Task textarea */}
      <textarea
        value={task}
        onChange={(e) => onTaskChange(e.target.value)}
        placeholder="Zadejte úkol pro agenta…"
        rows={4}
        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5
                   text-sm text-slate-100 placeholder:text-slate-500
                   resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                   transition-colors"
        data-testid="run-task-input"
      />

      {/* Delegation badge — shows which child agents will be dispatched */}
      {hasDelegation && (
        <div
          className="flex flex-col gap-1.5 rounded-lg bg-amber-950/30 border border-amber-700/40 px-3 py-2.5"
          data-testid="delegation-badge"
        >
          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
            Delegace · sub-agenti
          </p>
          <div className="flex flex-wrap gap-1.5">
            {childAgentDefs.map((child) => (
              <span
                key={child.id}
                className="flex items-center gap-1 bg-slate-800/80 rounded-full px-2 py-0.5"
                data-testid={`delegation-child-${child.id}`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: `#${child.color.toString(16).padStart(6, '0')}` }}
                />
                <span className="text-[11px] text-slate-200 font-medium">{child.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">{child.role}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Delivery choice */}
      <fieldset>
        <legend className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Doručení
        </legend>
        <div className="flex gap-5">
          <RadioOption
            id="delivery-wait"
            name="delivery"
            value="wait"
            label="Počkat"
            checked={delivery === 'wait'}
            onChange={() => onDeliveryChange('wait')}
          />
          <RadioOption
            id="delivery-inbox"
            name="delivery"
            value="inbox"
            label="Inbox"
            checked={delivery === 'inbox'}
            onChange={() => onDeliveryChange('inbox')}
          />
        </div>
      </fieldset>

      {/* Submit */}
      <button
        onClick={onSubmit}
        disabled={!task.trim()}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
                   bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   text-white disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="run-submit-btn"
      >
        {hasDelegation ? 'Spustit s delegací' : 'Spustit'}
      </button>
    </>
  )
}

interface RadioOptionProps {
  id: string
  name: string
  value: string
  label: string
  checked: boolean
  onChange: () => void
}

function RadioOption({ id, name, value, label, checked, onChange }: RadioOptionProps) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 cursor-pointer text-sm text-slate-300 select-none"
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-indigo-500 w-4 h-4 cursor-pointer"
      />
      {label}
    </label>
  )
}

// ---- Edit form ----

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
        <label htmlFor="edit-name" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Jméno
        </label>
        <input
          id="edit-name"
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2
                     text-sm text-slate-100
                     focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                     transition-colors"
          data-testid="edit-name-input"
        />
      </div>

      {/* Goal */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-goal" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Goal
        </label>
        <textarea
          id="edit-goal"
          value={goal}
          onChange={(e) => onGoalChange(e.target.value)}
          placeholder="Co má agent dosáhnout?"
          rows={2}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2
                     text-sm text-slate-100 placeholder:text-slate-500
                     resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                     transition-colors"
          data-testid="edit-goal-input"
        />
      </div>

      {/* Persona */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="edit-persona" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Persona
        </label>
        <textarea
          id="edit-persona"
          value={persona}
          onChange={(e) => onPersonaChange(e.target.value)}
          placeholder="Jak se agent chová a komunikuje?"
          rows={2}
          className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2
                     text-sm text-slate-100 placeholder:text-slate-500
                     resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                     transition-colors"
          data-testid="edit-persona-input"
        />
      </div>

      {/* Save */}
      <button
        onClick={onSave}
        disabled={!name.trim()}
        className="w-full py-2.5 rounded-lg text-sm font-semibold transition-colors
                   bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                   text-white disabled:opacity-40 disabled:cursor-not-allowed"
        data-testid="edit-save-btn"
      >
        Uložit
      </button>
    </>
  )
}
