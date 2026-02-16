'use client'

import { useState } from 'react'
import { MessageSquare, X } from 'lucide-react'

export default function GlobalChat() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleChat = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={toggleChat}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-secondary-dark to-secondary hover:from-secondary hover:to-secondary-dark text-white p-4 rounded-full shadow-lg transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-secondary-dark focus:ring-offset-2 focus:ring-offset-neutral-900"
          aria-label="Open chat with project manager"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-3rem)] bg-neutral-900 rounded-lg shadow-2xl border border-neutral-700 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-secondary-dark to-secondary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-white" />
              <h3 className="text-white font-semibold">Project Manager</h3>
            </div>
            <button
              onClick={toggleChat}
              className="text-white hover:bg-white/20 rounded-full p-1 transition-colors focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Content - iframe */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src="https://n8n.pavlin.dev/webhook/c8f1bc9a-da20-4755-a083-792e0d10964b/chat"
              className="w-full h-full border-0"
              title="Project Manager Chat"
              allow="clipboard-write"
            />
          </div>
        </div>
      )}

      {/* Mobile-responsive styles */}
      <style jsx>{`
        @media (max-width: 640px) {
          .fixed.bottom-6.right-6.w-\\[400px\\] {
            width: calc(100vw - 2rem);
            height: calc(100vh - 2rem);
            bottom: 1rem;
            right: 1rem;
          }
        }
      `}</style>
    </>
  )
}
