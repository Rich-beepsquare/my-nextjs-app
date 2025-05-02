'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function ChatUI({ assistantId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef(null)

  // Load chat history once on mount
  useEffect(() => {
    ;(async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser()
      if (userErr || !user) return console.error('No user session', userErr)

      const { data, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('History load error:', error)
        setMessages([{ role: 'assistant', content: 'Error loading history.' }])
      } else if (data.length) {
        setMessages(data.map(m => ({
          role:    m.role,
          content: m.content,
          ts:      new Date(m.created_at)
        })))
      } else {
        setMessages([{ role: 'assistant', content: 'Hello! How can I help you today?', ts: new Date() }])
      }
    })()
  }, [])

  // Scroll to bottom on each message update
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [messages])

  // Auto-resize the textarea
  const resize = el => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const handleSubmit = async e => {
    e.preventDefault()
    const text = input.trim()
    if (!text) return

    const { data: { user }, error: userErr } = await supabase.auth.getUser()
    if (userErr || !user) return console.error('No user session', userErr)

    const newMsgs = [
      ...messages,
      { role: 'user', content: text, user_id: user.id, ts: new Date() }
    ]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      // Include assistantId in your request
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ assistantId, messages: newMsgs })
      })
      if (!res.ok) throw new Error(`Status ${res.status}`)

      const { message: assistantMsg } = await res.json()
      setMessages([...newMsgs, { ...assistantMsg, ts: new Date() }])
    } catch (err) {
      console.error('Chat error:', err)
      setMessages([...newMsgs, { role: 'assistant', content: 'Oops, something went wrong.', ts: new Date() }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-container d-flex flex-column">
      <div className="chat-header">AI Assistant</div>
      <div className="chat-body">
        {messages.map((m,i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form className="chat-input d-flex" onSubmit={handleSubmit}>
        <textarea
          className="flex-grow-1"
          placeholder="Type a message..."
          value={input}
          onChange={e => { setInput(e.target.value); resize(e.target) }}
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
