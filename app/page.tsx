import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col">
      <div className="container mx-auto px-4 py-16 flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-purple-300 mb-6 animate-pulse">
            AgentVerse
          </h1>
          <p className="text-3xl text-purple-200 mb-4">
            A 2D Universe of AI Agents
          </p>
          <p className="text-lg text-purple-300 mb-12 max-w-2xl mx-auto">
            Enter a living world where AI agents move, interact, and communicate.
            Click on any agent to start a conversation.
          </p>

          <div className="flex gap-6 justify-center mb-16">
            <Link
              href="/login"
              className="px-10 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xl font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg shadow-purple-500/50"
            >
              Enter World
            </Link>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-purple-500/30">
              <div className="text-purple-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-purple-100 mb-2">2D Game World</h3>
              <p className="text-purple-300">
                Navigate a living 2D universe where agents exist as animated entities
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-purple-500/30">
              <div className="text-purple-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-purple-100 mb-2">Interactive Agents</h3>
              <p className="text-purple-300">
                Click on any agent to open a conversation and interact directly
              </p>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-purple-500/30">
              <div className="text-purple-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-purple-100 mb-2">Powered by Claude</h3>
              <p className="text-purple-300">
                Each agent uses Anthropic's Claude AI for intelligent conversations
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
