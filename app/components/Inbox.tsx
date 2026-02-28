'use client'

// ---------------------------------------------------------------------------
// Inbox — visual feed of agent task messages
//
// Three message types rendered as visual feed cards:
//   ✓  Hotovo   (done)     — task completed, emerald accent
//   ?  Otázka   (question) — agent working or waiting for answer, indigo accent
//   ✕  Chyba    (error)    — task failed, red accent
//
// Design principles:
//   - No tables, no IDs, no raw timestamps — only human-readable content
//   - Type is communicated visually first (icon + color + label)
//   - Agent identity shown via colour dot + name
//   - Feed layout: newest cards first, scrollable
// ---------------------------------------------------------------------------

import { useState } from 'react'
import type { InboxMessage, InboxMessageType } from './use-inbox'

// ---------------------------------------------------------------------------
// Visual config per message type
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  InboxMessageType,
  {
    icon: string
    label: string
    /** Left border accent colour class */
    borderColor: string
    /** Subtle card background tint */
    cardBg: string
    /** Icon circle background */
    iconBg: string
    /** Icon foreground colour */
    iconColor: string
    /** Type label colour */
    labelColor: string
  }
> = {
  done: {
    icon: '✓',
    label: 'Hotovo',
    borderColor: 'border-l-emerald-500',
    cardBg: 'bg-emerald-950/40',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    labelColor: 'text-emerald-300',
  },
  question: {
    icon: '?',
    label: 'Otázka',
    borderColor: 'border-l-indigo-500',
    cardBg: 'bg-indigo-950/40',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    labelColor: 'text-indigo-300',
  },
  error: {
    icon: '✕',
    label: 'Chyba',
    borderColor: 'border-l-red-500',
    cardBg: 'bg-red-950/40',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    labelColor: 'text-red-300',
  },
}

// ---------------------------------------------------------------------------
// MessageCard
// ---------------------------------------------------------------------------

interface MessageCardProps {
  message: InboxMessage
  onDismiss: (id: string) => void
  onReply?: (id: string, answer: string) => void
}

function MessageCard({ message, onDismiss, onReply }: MessageCardProps) {
  const cfg = TYPE_CONFIG[message.type]
  const colorHex = `#${message.agentColor.toString(16).padStart(6, '0')}`
  const isQuestion = message.type === 'question'
  /** True while the agent is processing (not yet awaiting user reply) */
  const isWorking = isQuestion && !message.awaitingAnswer
  const canReply = isQuestion && message.awaitingAnswer && onReply

  const [answer, setAnswer] = useState('')

  function handleReply() {
    const trimmed = answer.trim()
    if (!trimmed || !onReply) return
    onReply(message.id, trimmed)
    setAnswer('')
  }

  return (
    <div
      data-testid={`inbox-message-${message.id}`}
      className={`
        relative flex flex-col gap-3 rounded-xl p-3.5
        ${cfg.cardBg} border border-slate-600/30
        border-l-4 ${cfg.borderColor}
        transition-all duration-200
      `}
    >
      {/* ── Header row: type indicator + agent info + dismiss ── */}
      <div className="flex items-center gap-2.5">

        {/* Type icon — large circle */}
        <span
          className={`
            w-7 h-7 flex items-center justify-center rounded-full flex-shrink-0
            text-sm font-bold ${cfg.iconBg} ${cfg.iconColor}
            ${isWorking ? 'animate-pulse' : ''}
          `}
          aria-label={cfg.label}
        >
          {cfg.icon}
        </span>

        {/* Type label */}
        <span className={`text-xs font-semibold ${cfg.labelColor} flex-shrink-0`}>
          {cfg.label}
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Agent identity: colour dot + name */}
        <span className="flex items-center gap-1.5 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: colorHex }}
            aria-hidden="true"
          />
          <span className="text-xs text-slate-300 font-medium truncate max-w-[80px]">
            {message.agentName}
          </span>
        </span>

        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(message.id)}
          className="
            ml-1 w-5 h-5 flex items-center justify-center flex-shrink-0
            text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 rounded
            text-[10px] transition-colors
          "
          aria-label={`Odebrat zprávu od ${message.agentName}`}
          data-testid={`dismiss-${message.id}`}
        >
          ✕
        </button>
      </div>

      {/* ── Task description — context in smaller text ── */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 -mt-1">
        {message.task}
      </p>

      {/* ── Result / status text — main content ── */}
      {message.text && (
        <p className="text-xs text-slate-100 leading-relaxed">
          {message.text}
        </p>
      )}

      {/* ── Inline reply form (shown only when agent awaits user answer) ── */}
      {canReply && (
        <div
          className="flex flex-col gap-2 pt-1 border-t border-indigo-500/20"
          data-testid={`inbox-reply-form-${message.id}`}
        >
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleReply()
              }
            }}
            placeholder="Napište odpověď…"
            rows={2}
            className="
              w-full bg-slate-900/80 border border-indigo-500/40 rounded-lg px-2.5 py-2
              text-xs text-slate-100 placeholder:text-slate-500
              resize-none focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400/50
              transition-colors
            "
            data-testid={`inbox-reply-input-${message.id}`}
          />
          <button
            onClick={handleReply}
            disabled={!answer.trim()}
            className="
              self-end px-3 py-1.5 rounded-lg text-xs font-semibold
              bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
              text-white disabled:opacity-40 disabled:cursor-not-allowed
              transition-colors
            "
            data-testid={`inbox-reply-submit-${message.id}`}
          >
            Odeslat
          </button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// InboxToggleButton
// ---------------------------------------------------------------------------

interface InboxToggleButtonProps {
  unreadCount: number
  isOpen: boolean
  onClick: () => void
}

export function InboxToggleButton({ unreadCount, isOpen, onClick }: InboxToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      title="Inbox"
      aria-label={`Inbox${unreadCount > 0 ? ` — ${unreadCount} nových` : ''}`}
      data-testid="inbox-toggle-btn"
      className={`
        relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
        text-xs font-medium transition-colors
        ${isOpen
          ? 'bg-indigo-600/80 text-white border border-indigo-500'
          : 'bg-slate-800/80 backdrop-blur-sm text-slate-300 border border-slate-700 hover:bg-slate-700/80 hover:text-white'
        }
      `}
    >
      {/* Mailbox icon (text-based, no external deps) */}
      <span className="text-sm leading-none" aria-hidden="true">✉</span>
      <span>Inbox</span>

      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          data-testid="inbox-unread-badge"
          className="
            absolute -top-1.5 -right-1.5
            min-w-[16px] h-4 px-1
            flex items-center justify-center
            bg-red-500 text-white text-[10px] font-bold rounded-full
            leading-none
          "
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

// ---------------------------------------------------------------------------
// InboxPanel
// ---------------------------------------------------------------------------

interface InboxPanelProps {
  messages: InboxMessage[]
  isOpen: boolean
  onClose: () => void
  onDismiss: (id: string) => void
  onClearAll: () => void
  /** Called when the user submits a reply to an agent's question in the inbox. */
  onReply?: (id: string, answer: string) => void
}

export function InboxPanel({ messages, isOpen, onClose, onDismiss, onClearAll, onReply }: InboxPanelProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop (click to close) */}
      <div
        className="fixed inset-0 z-40"
        aria-hidden="true"
        onClick={onClose}
        data-testid="inbox-backdrop"
      />

      {/* Panel */}
      <div
        role="region"
        aria-label="Inbox"
        data-testid="inbox-panel"
        className="
          fixed right-4 top-[88px] z-50
          w-80 max-h-[calc(100vh-120px)]
          flex flex-col
          bg-slate-900/95 backdrop-blur-sm
          border border-slate-700/60 rounded-2xl shadow-2xl
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/60 flex-shrink-0">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span aria-hidden="true" className="text-slate-400">✉</span>
            Inbox
            {messages.length > 0 && (
              <span className="text-[10px] font-normal text-slate-500 ml-0.5">
                {messages.length}
              </span>
            )}
          </h2>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors"
                data-testid="inbox-clear-all"
              >
                Vymazat vše
              </button>
            )}
            <button
              onClick={onClose}
              className="
                w-6 h-6 flex items-center justify-center
                text-slate-500 hover:text-white rounded-lg hover:bg-slate-700/60
                text-xs transition-colors
              "
              aria-label="Zavřít inbox"
              data-testid="inbox-close-btn"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message feed */}
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 min-h-0">
          {messages.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-testid="inbox-empty"
            >
              <span className="text-4xl mb-3 opacity-20 select-none" aria-hidden="true">✉</span>
              <p className="text-sm font-medium text-slate-500">Žádné zprávy</p>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                Spusťte úkol s doručením do Inboxu
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageCard key={msg.id} message={msg} onDismiss={onDismiss} onReply={onReply} />
            ))
          )}
        </div>

        {/* Footer — message count */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-700/60 flex-shrink-0">
            <p className="text-[11px] text-slate-600 text-center">
              {messages.length} {messages.length === 1 ? 'zpráva' : messages.length < 5 ? 'zprávy' : 'zpráv'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
