// app/api/chat/route.js
import { NextResponse } from 'next/server'
import { OpenAI } from 'openai'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase with service key (for server-side writes)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req) {
  try {
    const { messages } = await req.json()

    // 1) Call GPT-4
    const res = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    })
    const choice = res.choices?.[0]
    const assistant = choice?.message || { role: 'assistant', content: '' }

    // 2) Shape assistant message
    const assistantMsg = {
      role: assistant.role,
      content:
        typeof assistant.content === 'string'
          ? assistant.content
          : Array.isArray(assistant.content?.parts)
          ? assistant.content.parts.join('')
          : '',
    }

    // 3) Persist both the user’s last message and assistant reply
    const userMsg = messages[messages.length - 1]
    const insertData = [
      { user_id: userMsg.user_id, role: userMsg.role, content: userMsg.content },
      { user_id: userMsg.user_id, role: assistantMsg.role, content: assistantMsg.content },
    ]
    const { error: dbError } = await supabase
      .from('messages')
      .insert(insertData)

    if (dbError) throw dbError

    // 4) Return assistant reply
    return NextResponse.json({ message: assistantMsg })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json(
      { message: { role: 'assistant', content: 'Server error.' } },
      { status: 500 }
    )
  }
}
