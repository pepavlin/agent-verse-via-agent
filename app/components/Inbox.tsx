'use client'

// ---------------------------------------------------------------------------
// Inbox — visual feed of agent task messages
//
// Shows messages grouped by type:
//   ✓  Hotovo   (done)     — task completed, green accent
//   ?  Otázka   (question) — task in progress, indigo/blue accent
//   ✕  Chyba    (error)    — task failed, red accent
//
// No tables, no IDs, no raw timestamps — just human-readable cards.
// ---------------------------------------------------------------------------

import type { InboxMessage, InboxMessageType } from './use-inbox'

// ---------------------------------------------------------------------------
// Visual config per message type
// ---------------------------------------------------------------------------

const TYPE_CONFIG: Record<
  InboxMessageType,
  { icon: string; label: string; borderColor: string; iconBg: string; iconColor: string; labelColor: string }
> = {
  done: {
    icon: '✓',
    label: 'Hotovo',
    borderColor: 'border-l-emerald-500',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    labelColor: 'text-emerald-400',
  },
  question: {
    icon: '?',
    label: 'Otázka',
    borderColor: 'border-l-indigo-500',
    iconBg: 'bg-indigo-500/20',
    iconColor: 'text-indigo-400',
    labelColor: 'text-indigo-400',
  },
  error: {
    icon: '✕',
    label: 'Chyba',
    borderColor: 'border-l-red-500',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    labelColor: 'text-red-400',
  },
}

// ---------------------------------------------------------------------------
// MessageCard
// ---------------------------------------------------------------------------

interface MessageCardProps {
  message: InboxMessage
  onDismiss: (id: string) => void
}

function MessageCard({ message, onDismiss }: MessageCardProps) {
  const cfg = TYPE_CONFIG[message.type]
  const colorHex = `#${message.agentColor.toString(16).padStart(6, '0')}`
  const isInProgress = message.type === 'question'

  return (
    <div
      data-testid={`inbox-message-${message.id}`}
      className={`
        relative flex flex-col gap-2 rounded-lg p-3
        bg-slate-700/60 border border-slate-600/50
        border-l-4 ${cfg.borderColor}
        transition-all duration-200
      `}
    >
      {/* Header row: type badge + agent name + dismiss */}
      <div className="flex items-center gap-2">
        {/* Type icon */}
        <span
          className={`
            w-5 h-5 flex items-center justify-center rounded-full flex-shrink-0
            text-[11px] font-bold ${cfg.iconBg} ${cfg.iconColor}
            ${isInProgress ? 'animate-pulse' : ''}
          `}
          aria-label={cfg.label}
        >
          {cfg.icon}
        </span>

        {/* Type label */}
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${cfg.labelColor}`}>
          {cfg.label}
        </span>

        {/* Spacer */}
        <span className="flex-1" />

        {/* Agent name with colour dot */}
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
            ml-1 w-4 h-4 flex items-center justify-center flex-shrink-0
            text-slate-500 hover:text-slate-200 rounded
            text-[10px] transition-colors
          "
          aria-label={`Odebrat zprávu od ${message.agentName}`}
          data-testid={`dismiss-${message.id}`}
        >
          ✕
        </button>
      </div>

      {/* Task description */}
      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
        {message.task}
      </p>

      {/* Result / status text */}
      {message.text && (
        <p className="text-xs text-slate-200 leading-relaxed">
          {message.text}
        </p>
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
}

export function InboxPanel({ messages, isOpen, onClose, onDismiss, onClearAll }: InboxPanelProps) {
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
          bg-slate-800/95 backdrop-blur-sm
          border border-slate-600 rounded-xl shadow-2xl
          overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700 flex-shrink-0">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span aria-hidden="true">✉</span>
            Inbox
          </h2>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-[11px] text-slate-400 hover:text-slate-200 transition-colors"
                data-testid="inbox-clear-all"
              >
                Vymazat vše
              </button>
            )}
            <button
              onClick={onClose}
              className="
                w-6 h-6 flex items-center justify-center
                text-slate-400 hover:text-white rounded-lg hover:bg-slate-700
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
              className="flex flex-col items-center justify-center py-10 text-center"
              data-testid="inbox-empty"
            >
              <span className="text-3xl mb-3 opacity-30" aria-hidden="true">✉</span>
              <p className="text-sm text-slate-500">Žádné zprávy</p>
              <p className="text-xs text-slate-600 mt-1">
                Spusťte úkol s doručením do Inboxu
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageCard key={msg.id} message={msg} onDismiss={onDismiss} />
            ))
          )}
        </div>

        {/* Footer — message count */}
        {messages.length > 0 && (
          <div className="px-4 py-2 border-t border-slate-700 flex-shrink-0">
            <p className="text-[11px] text-slate-500 text-center">
              {messages.length} {messages.length === 1 ? 'zpráva' : messages.length < 5 ? 'zprávy' : 'zpráv'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
