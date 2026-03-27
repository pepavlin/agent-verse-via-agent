'use client'

// ---------------------------------------------------------------------------
// AgentPanel — unified panel that opens when a user clicks on an agent.
//
// Modes:
//   Chat — chat-style view combining interaction history with a task input
//           at the bottom (messenger-style); default mode
//   Edit — change agent name, goal, persona; click Uložit
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'
import type { AgentDef } from './agents-config'
import type { AgentHistoryEntry } from './use-agent-history'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PanelMode = 'chat' | 'edit'
export type DeliveryMode = 'wait' | 'inbox'

/**
 * Phase for wait-delivery runs.
 * Kept for API compatibility — the chat view shows results inline via history entries.
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
  /** Interaction history entries for this agent (ordered oldest → newest). */
  history?: AgentHistoryEntry[]
  /** Called when the user closes the panel (× button or backdrop). */
  onClose: () => void
  /** Called when the user submits a task in Chat mode. */
  onRunTask: (payload: RunTaskPayload) => void
  /** Called when the user saves edits in Edit mode. */
  onEditSave: (payload: EditSavePayload) => void
  /**
   * Optional list of child agent definitions resolved from agentDef.childAgentIds.
   * When present, the submit button shows a delegation hint in the tooltip.
   */
  childAgentDefs?: AgentDef[]
  /**
   * Phase of the active wait-delivery run.
   * Kept for API compatibility — results appear in the history chat feed.
   */
  waitPhase?: WaitRunPhase
  /** Result text displayed when waitPhase === 'done'. */
  waitResult?: string
  /** Error text displayed when waitPhase === 'error'. */
  waitError?: string
  /** Called when the user clicks "Nový úkol" to reset the panel to the form. */
  onNewTask?: () => void
  /** Called when the user clicks "Smazat historii" in the Chat view. */
  onClearHistory?: () => void
  /**
   * Increment this counter to scroll the chat to the bottom
   * (e.g. immediately after a task is submitted).
   * @deprecated No longer required — the chat auto-scrolls on history changes.
   */
  historyBump?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AgentPanel({
  agentDef,
  history = [],
  onClose,
  onRunTask,
  onEditSave,
  childAgentDefs,
  waitPhase = 'idle',
  waitResult,
  waitError,
  onNewTask,
  onClearHistory,
  historyBump = 0,
}: AgentPanelProps) {
  const [mode, setMode] = useState<PanelMode>('chat')

  // Chat mode state
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
      // Reset chat state on agent change
      setTask('')
      setDelivery('wait')
      setMode('chat')
    }
  }, [agentDef?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // historyBump kept for API compatibility — switching to chat is a no-op
  // since chat is always the default/active view.
  // (Auto-scroll is handled inside ChatView via history.length effect.)
  useEffect(() => {
    if (historyBump > 0) {
      setMode('chat')
    }
  }, [historyBump])

  if (!agentDef) return null

  const colorHex = `#${agentDef.color.toString(16).padStart(6, '0')}`

  // ---- Handlers ----

  function handleRun() {
    const trimmed = task.trim()
    if (!trimmed) return
    onRunTask({ agentId: agentDef!.id, task: trimmed, delivery })
    setTask('')
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

        {/* ── Tab bar ── */}
        <div className="flex border-b border-slate-700">
          <TabButton
            label={`Chat${history.length > 0 ? ` (${history.length})` : ''}`}
            active={mode === 'chat'}
            onClick={() => setMode('chat')}
            testId="tab-chat"
          />
          <TabButton
            label="Edit"
            active={mode === 'edit'}
            onClick={() => setMode('edit')}
            testId="tab-edit"
          />
        </div>

        {/* ── Body ── */}
        {mode === 'chat' && (
          <ChatView
            history={history}
            agentName={agentDef.name}
            agentColor={colorHex}
            task={task}
            delivery={delivery}
            onTaskChange={setTask}
            onDeliveryChange={setDelivery}
            onSubmit={handleRun}
            onClear={onClearHistory}
          />
        )}

        {mode === 'edit' && (
          <div className="px-5 py-4 flex flex-col gap-3">
            <EditForm
              name={editName}
              goal={editGoal}
              persona={editPersona}
              onNameChange={setEditName}
              onGoalChange={setEditGoal}
              onPersonaChange={setEditPersona}
              onSave={handleSave}
            />
          </div>
        )}
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
      className={`flex-1 py-2.5 text-sm font-medium transition-all border-b-2
        ${active
          ? 'border-indigo-500 text-white'
          : 'border-transparent text-slate-500 hover:text-slate-300'
        }`}
    >
      {label}
    </button>
  )
}

// ---- Chat view (history + input combined) ----

interface ChatViewProps {
  history: AgentHistoryEntry[]
  agentName: string
  agentColor: string
  task: string
  delivery: DeliveryMode
  onTaskChange: (v: string) => void
  onDeliveryChange: (v: DeliveryMode) => void
  onSubmit: () => void
  onClear?: () => void
}

function ChatView({
  history,
  agentName,
  agentColor,
  task,
  delivery,
  onTaskChange,
  onDeliveryChange,
  onSubmit,
  onClear,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever entries change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length])

  return (
    <div className="flex flex-col min-h-0">
      {/* ── Message history ── */}
      {history.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-10 px-4 text-center"
          data-testid="history-empty"
        >
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-slate-400 text-sm font-medium">Žádná historie</p>
          <p className="text-slate-600 text-xs mt-1">Zadejte úkol níže a zahajte konverzaci</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex flex-col gap-3 px-4 py-3 overflow-y-auto max-h-64"
          data-testid="history-list"
        >
          {history.map((entry) => (
            <HistoryEntry
              key={entry.id}
              entry={entry}
              agentName={agentName}
              agentColor={agentColor}
            />
          ))}
        </div>
      )}

      {/* ── Input area ── */}
      <div className="border-t border-slate-700 px-4 pt-3 pb-4 flex flex-col gap-2.5 bg-slate-800/80">
        {/* Delivery choice */}
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Doručení
          </span>
          <div className="flex gap-4">
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
        </div>

        {/* Textarea + send button */}
        <div className="flex gap-2 items-end">
          <textarea
            value={task}
            onChange={(e) => onTaskChange(e.target.value)}
            onKeyDown={(e) => {
              // Ctrl+Enter or Cmd+Enter submits
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault()
                onSubmit()
              }
            }}
            placeholder="Zadejte úkol pro agenta…"
            rows={2}
            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2
                       text-sm text-slate-100 placeholder:text-slate-500
                       resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
                       transition-colors"
            data-testid="run-task-input"
          />
          <button
            onClick={onSubmit}
            disabled={!task.trim()}
            className="flex-shrink-0 px-3 py-2 rounded-lg text-sm font-semibold transition-colors
                       bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                       text-white disabled:opacity-40 disabled:cursor-not-allowed h-[58px] w-[52px]
                       flex items-center justify-center"
            data-testid="run-submit-btn"
            title="Spustit (Ctrl+Enter)"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Footer: entry count + clear button */}
        {history.length > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-600">
              {history.length} {history.length === 1 ? 'interakce' : history.length < 5 ? 'interakce' : 'interakcí'}
            </span>
            {onClear && (
              <button
                onClick={onClear}
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                data-testid="history-clear-btn"
              >
                Smazat historii
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---- Radio option for delivery choice ----

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
      className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300 select-none"
    >
      <input
        type="radio"
        id={id}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="accent-indigo-500 w-3.5 h-3.5 cursor-pointer"
      />
      {label}
    </label>
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

// ---- History entry ----

interface HistoryEntryProps {
  entry: AgentHistoryEntry
  agentName: string
  agentColor: string
}

function HistoryEntry({ entry, agentName, agentColor }: HistoryEntryProps) {
  const time = formatTime(entry.timestamp)

  return (
    <div
      className="flex flex-col gap-2"
      data-testid={`history-entry-${entry.id}`}
    >
      {/* User task bubble (right-aligned) */}
      <div className="flex flex-col items-end gap-1">
        <div
          className="max-w-[85%] bg-indigo-600/80 border border-indigo-500/50 rounded-2xl rounded-tr-sm
                     px-3 py-2 text-sm text-white leading-relaxed"
          data-testid={`history-task-${entry.id}`}
        >
          {entry.task}
        </div>
        <span className="text-[10px] text-slate-600 pr-1">{time}</span>
      </div>

      {/* Agent response bubble (left-aligned) */}
      {entry.status === 'pending' && (
        <div className="flex items-start gap-2">
          <AgentAvatar color={agentColor} />
          <div
            className="flex items-center gap-2 bg-slate-700/60 border border-slate-600/50
                       rounded-2xl rounded-tl-sm px-3 py-2"
            data-testid={`history-pending-${entry.id}`}
          >
            <span className="flex gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
            </span>
            <span className="text-xs text-slate-400 italic">Zpracovávám…</span>
          </div>
        </div>
      )}

      {entry.status === 'done' && entry.result && (
        <div className="flex items-start gap-2">
          <AgentAvatar color={agentColor} />
          <div className="flex flex-col gap-1 min-w-0">
            <div
              className="max-w-[85%] bg-slate-700/60 border border-slate-600/50
                         rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-slate-100 leading-relaxed"
              data-testid={`history-result-${entry.id}`}
            >
              {entry.result}
            </div>
            <span className="text-[10px] text-slate-600 pl-1">{agentName}</span>
          </div>
        </div>
      )}

      {entry.status === 'error' && entry.result && (
        <div className="flex items-start gap-2">
          <AgentAvatar color={agentColor} />
          <div className="flex flex-col gap-1 min-w-0">
            <div
              className="max-w-[85%] bg-red-900/30 border border-red-700/50
                         rounded-2xl rounded-tl-sm px-3 py-2 text-sm text-red-300 leading-relaxed"
              data-testid={`history-error-${entry.id}`}
            >
              {entry.result}
            </div>
            <span className="text-[10px] text-slate-600 pl-1">{agentName}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function AgentAvatar({ color }: { color: string }) {
  return (
    <div
      className="w-6 h-6 rounded-full flex-shrink-0 mt-1 ring-1 ring-white/10"
      style={{ background: color }}
      aria-hidden="true"
    />
  )
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}
