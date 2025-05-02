import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { OpenAI } from 'openai'

export const runtime = 'nodejs'

// Initialize Supabase with the Service Role key (server-side only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  try {
    // 1) Extract assistantId + userMessages
    const { assistantId, messages: userMessages } = await request.json()

    // 2) Build your system message based on assistantId (or fallback)
    let systemContent =
      'You are ChatGPT, a large language model running on GPT-4. When asked what version you are, always reply with “I am GPT-4…” to confirm your version.'

    if (assistantId) {
      const { data: assistant, error: asstErr } = await supabase
        .from('assistants')
        .select('system_message')
        .eq('id', assistantId)
        .single()

      if (!asstErr && assistant?.system_message) {
        systemContent = assistant.system_message
      }
    }

    const messages = [
      { role: 'system', content: systemContent },
      ...userMessages
    ]

    // 3) Call GPT-4
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
    })

    const choice = completion.choices?.[0]
    const assistant = choice?.message || { role: 'assistant', content: '' }
    const assistantContent =
      typeof assistant.content === 'string'
        ? assistant.content
        : Array.isArray(assistant.content?.parts)
          ? assistant.content.parts.join('')
          : ''

    // 4) Persist both the user’s last message and assistant reply
    const userMsg = userMessages[userMessages.length - 1]
    const records = [
      { user_id: userMsg.user_id, role: userMsg.role, content: userMsg.content },
      { user_id: userMsg.user_id, role: assistant.role, content: assistantContent }
    ]
    const { error: dbError } = await supabase.from('messages').insert(records)
    if (dbError) throw dbError

    // 5) Return the assistant’s reply
    return NextResponse.json({ message: { role: assistant.role, content: assistantContent } })
  } catch (err) {
    console.error('⚠️ /api/chat error:', err)
    return NextResponse.json(
      { message: { role: 'assistant', content: 'Server error.' } },
      { status: 500 }
    )
  }
}
