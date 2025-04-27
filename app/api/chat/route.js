// app/api/chat/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

export const runtime = 'nodejs'  // ensure this runs under Node.js

// Initialize Supabase with the Service Role key (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  // Instantiate OpenAI inside the handler
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  try {
    const { messages } = await request.json()

    // 1) Send chat completion request to GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    })
    const choice = completion.choices?.[0]
    const assistant = choice?.message || { role: 'assistant', content: '' }

    // Normalize assistant content if it comes in parts
    const assistantContent =
      typeof assistant.content === 'string'
        ? assistant.content
        : Array.isArray(assistant.content?.parts)
        ? assistant.content.parts.join('')
        : ''

    // 2) Persist both the user’s last message and assistant reply
    const userMsg = messages[messages.length - 1]
    const records = [
      {
        user_id: userMsg.user_id,
        role: userMsg.role,
        content: userMsg.content,
      },
      {
        user_id: userMsg.user_id,
        role: assistant.role,
        content: assistantContent,
      },
    ]

    const { error: dbError } = await supabase.from('messages').insert(records)
    if (dbError) throw dbError

    // 3) Return the assistant’s reply to the client
    return NextResponse.json({
      message: { role: assistant.role, content: assistantContent },
    })
  } catch (err) {
    console.error('⚠️ /api/chat error:', err)
    return NextResponse.json(
      { message: { role: 'assistant', content: 'Server error.' } },
      { status: 500 }
    )
  }
}
