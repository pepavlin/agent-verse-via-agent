'use client'

interface ChatMessageProps {
  message: {
    id: string
    content: string
    role: string
    createdAt: Date
  }
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-white'
            : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className={`text-xs mt-1 block ${isUser ? 'text-primary-light' : 'text-neutral-500 dark:text-neutral-400'}`}>
          {new Date(message.createdAt).toLocaleTimeString()}
        </span>
      </div>
    </div>
  )
}
