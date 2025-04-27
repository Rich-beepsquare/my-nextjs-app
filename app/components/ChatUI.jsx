// components/ChatUI.jsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatUI() {
  const [showNotice, setShowNotice] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const resize = (el) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()
    if (userErr || !user) {
      console.error('No user session', userErr)
      return
    }

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
      setMessages([...newMsgs, assistantMsg])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages([
        ...newMsgs,
        { role: 'assistant', content: 'Oops, something went wrong.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-container d-flex flex-column">
      <div className="chat-header">AI Assistant</div>

      <div className="chat-body">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {m.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* 🛈 Privacy Notice moved to bottom of chat window */}
      {showNotice && (
        <div className="alert alert-info alert-dismissible fade show mx-3 my-2" role="alert">
          <strong>Your privacy is protected:</strong>{' '}
          Messages you send & receive are <em>not</em> used to train OpenAI’s public models.
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setShowNotice(false)}
          />
        </div>
      )}

      <form className="chat-input d-flex p-3" onSubmit={handleSubmit}>
        <textarea
          className="flex-grow-1 form-control"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            resize(e.target)
          }}
          disabled={loading}
          rows={1}
        />
        <button type="submit" className="btn btn-primary ms-2" disabled={loading}>
          {loading ? '…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
