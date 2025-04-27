export async function callOpenAI(messages) {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    })
  
    if (!res.ok) {
      const error = await res.text()
      throw new Error(`OpenAI API error: ${error}`)
    }
  
    const data = await res.json()
    return data
  }
  