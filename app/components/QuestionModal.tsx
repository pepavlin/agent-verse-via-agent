'use client'

// ---------------------------------------------------------------------------
// QuestionModal — displayed when an agent asks a clarifying question
// during a 'wait' delivery run.
//
// The user types an answer and submits it; the parent calls engine.resumeRun()
// to continue the run with the provided answer.
// ---------------------------------------------------------------------------

import { useState, useEffect, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PendingQuestion {
  /** Run ID of the paused run. */
  runId: string
  /** Name of the agent that asked the question. */
  agentName: string
  /** Agent brand colour as a 0xRRGGBB number. */
  agentColor: number
  /** The question text raised by the agent. */
  question: string
}

export interface QuestionModalProps {
  /** The question to display. Setting to null hides the modal. */
  pending: PendingQuestion | null
  /** Called when the user submits an answer. */
  onAnswer: (runId: string, answer: string) => void
  /** Called when the user dismisses without answering (cancels the run). */
  onDismiss: (runId: string) => void
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function QuestionModal({ pending, onAnswer, onDismiss }: QuestionModalProps) {
  const [answer, setAnswer] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset answer and focus textarea whenever a new question arrives
  useEffect(() => {
    if (pending) {
      setAnswer('')
      // Small delay so the modal renders before we focus
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [pending?.runId]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!pending) return null

  const colorHex = `#${pending.agentColor.toString(16).padStart(6, '0')}`

  function handleSubmit() {
    const trimmed = answer.trim()
    if (!trimmed) return
    onAnswer(pending!.runId, trimmed)
    setAnswer('')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        data-testid="question-modal-backdrop"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Otázka od agenta ${pending.agentName}`}
        data-testid="question-modal"
        className="
          fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
          w-full max-w-sm
          bg-slate-800 border border-indigo-500/60 rounded-2xl shadow-2xl
          flex flex-col overflow-hidden
        "
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-slate-700">
          {/* Agent colour dot */}
          <span
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: colorHex }}
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              {pending.agentName} potřebuje upřesnění
            </p>
            <p className="text-indigo-400 text-[11px] font-mono">čeká na vaši odpověď</p>
          </div>
          {/* Question mark icon */}
          <span
            className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 text-sm font-bold flex-shrink-0"
            aria-hidden="true"
          >
            ?
          </span>
        </div>

        {/* Body */}
        <div className="px-4 py-4 flex flex-col gap-4">
          {/* Question text */}
          <div className="bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2.5">
            <p className="text-xs text-slate-200 leading-relaxed" data-testid="question-modal-text">
              {pending.question}
            </p>
          </div>

          {/* Answer textarea */}
          <textarea
            ref={textareaRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Vaše odpověď…"
            rows={3}
            className="
              w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5
              text-sm text-slate-100 placeholder:text-slate-500
              resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500
              transition-colors
            "
            data-testid="question-modal-input"
          />

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onDismiss(pending.runId)}
              className="
                flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                bg-slate-700 hover:bg-slate-600 active:bg-slate-500
                text-slate-300 hover:text-white
              "
              data-testid="question-modal-dismiss"
            >
              Zrušit
            </button>
            <button
              onClick={handleSubmit}
              disabled={!answer.trim()}
              className="
                flex-2 px-5 py-2 rounded-lg text-sm font-semibold transition-colors
                bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                text-white disabled:opacity-40 disabled:cursor-not-allowed
              "
              data-testid="question-modal-submit"
            >
              Odeslat odpověď
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
