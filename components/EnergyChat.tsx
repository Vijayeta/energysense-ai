'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, X, Bot, Zap } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Why did my consumption spike?',
  'What is my most expensive month?',
  'How can I reduce costs quickly?',
  'Compare summer vs winter usage',
]

export default function EnergyChat({ uploadId }: { uploadId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 150)
    }
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uploadId, messages: updated }),
      })
      const data = await res.json()
      setMessages([...updated, { role: 'assistant', content: data.reply ?? 'Sorry, something went wrong.' }])
    } catch {
      setMessages([...updated, { role: 'assistant', content: 'Connection error. Please try again.' }])
    } finally {
      setIsLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <>
      {/* Chat panel — fixed height so flex scroll works at any message length */}
      <div
        className={`fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96 h-[520px] max-h-[75vh] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col transition-all duration-200 origin-bottom-right ${
          isOpen
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 shrink-0 bg-gradient-to-r from-green-50 to-white rounded-t-2xl">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shadow-sm">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 leading-none">Energy AI Assistant</p>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <p className="text-xs text-gray-400">Powered by Claude</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Messages — flex-1 + min-h-0 ensures scroll works regardless of content height */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {messages.length === 0 && (
            <div>
              <p className="text-xs text-gray-400 mb-3 text-center">Try asking one of these</p>
              <div className="flex flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={isLoading}
                    className="text-sm bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-200 text-gray-600 px-4 py-2.5 rounded-xl transition-colors border border-gray-100 text-left w-full disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shrink-0 mb-0.5">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-end gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center shrink-0">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input — shrink-0 keeps it pinned to the bottom */}
        <div className="px-3 py-3 border-t border-gray-100 flex gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) sendMessage(input) }}
            placeholder="Ask about your energy data..."
            disabled={isLoading}
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 bg-gray-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        className={`fixed bottom-6 right-4 sm:right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg ${
          isOpen
            ? 'bg-gray-800 hover:bg-gray-900 shadow-gray-900/30'
            : 'bg-gradient-to-br from-green-500 to-emerald-700 hover:from-green-400 hover:to-emerald-600 shadow-green-600/40'
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open AI chat'}
      >
        <div className="relative flex items-center justify-center">
          {isOpen ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <>
              <Bot className="h-6 w-6 text-white" />
              <Zap className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300" />
            </>
          )}
        </div>
        {!isOpen && messages.length > 0 && (
          <span className="absolute top-0.5 right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>
    </>
  )
}
