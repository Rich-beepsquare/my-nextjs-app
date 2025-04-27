// components/ChatUI.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatUI() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  // 1) Load history
  useEffect(() => {
    ;(async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .order('created_at', { ascending: true })

      if (error) {
        console.error('History load error:', error)
        setMessages([{ role: 'assistant', content: 'Error loading history.' }])
      } else if (data.length) {
        setMessages(data.map((m) => ({ role: m.role, content: m.content })))
      } else {
        setMessages([
          { role: 'assistant', content: 'Hello! How can I help you today?' },
        ])
      }
    })()
  }, [])

  // 2) Scroll to bottom on new message or loading state
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // 3) Auto-resize textarea
  const resize = (el) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  // 4) Send & receive
  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    // Fetch current user
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      console.error('No user session', userErr)
      return
    }

    // Append user message
    const newMsgs = [
      ...messages,
      { role: 'user', content: text, user_id: user.id },
    ]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMsgs }),
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)

      const { message: assistantMsg } = await res.json()
      setMessages((msgs) => [...msgs, assistantMsg])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages((msgs) => [
        ...msgs,
        { role: 'assistant', content: 'Oops, something went wrong.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-container d-flex flex-column">
      <div className="chat-header">AI Assistant</div>

      {/* Chat messages */}
      <div className="chat-body flex-grow-1 overflow-auto mb-3">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}

        {/* Typing indicator bubble */}
        {loading && (
          <div className="bubble assistant typing d-flex align-items-center">
            <div
              className="spinner-border spinner-border-sm text-primary me-2"
              role="status"
            >
              <span className="visually-hidden">Loading…</span>
            </div>
            <em>Typing…</em>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input form */}
      <form className="chat-input d-flex" onSubmit={handleSubmit}>
        <textarea
          className="flex-grow-1 form-control"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            resize(e.target)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
          disabled={loading}
          rows={1}
        />

        <button
          type="submit"
          className="btn btn-primary ms-2"
          disabled={loading}
        >
          {loading ? (
            <span
              className="spinner-border spinner-border-sm"
              role="status"
              aria-hidden="true"
            />
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  )
}
