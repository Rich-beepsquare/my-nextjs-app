// app/api/upload/route.js
import { NextResponse } from 'next/server'
import { createClient }   from '@supabase/supabase-js'
import jwt                from 'jsonwebtoken'

// pull in exactly the names you defined in .env.local
const SUPABASE_URL              = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_JWT_SECRET       = process.env.SUPABASE_JWT_SECRET

// debug‐log so you can verify these are truthy at startup
console.log('Loaded env:', {
  SUPABASE_URL:              Boolean(SUPABASE_URL),
  SUPABASE_SERVICE_ROLE_KEY: Boolean(SUPABASE_SERVICE_ROLE_KEY),
  SUPABASE_JWT_SECRET:       Boolean(SUPABASE_JWT_SECRET),
})

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_JWT_SECRET) {
  throw new Error(
    'Missing one of SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_JWT_SECRET'
  )
}

// initialize Supabase with your service‐role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// choose either 'edge' or 'nodejs' runtime
export const config = { runtime: 'edge' }

export async function POST(request) {
  // 1) authenticate the request via Bearer JWT
  const auth = request.headers.get('authorization') || ''
  if (!auth.startsWith('Bearer ')) {
    return new NextResponse('Missing or malformed Authorization header', { status: 401 })
  }
  const token = auth.split(' ')[1]

  let payload
  try {
    payload = jwt.verify(token, SUPABASE_JWT_SECRET)
  } catch {
    return new NextResponse('Invalid or expired token', { status: 401 })
  }

  const userId = payload.sub
  if (!userId) {
    return new NextResponse('Token payload missing "sub"', { status: 401 })
  }

  // 2) parse the multipart/form‐data
  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof Blob)) {
    return new NextResponse('No file provided', { status: 400 })
  }
  const filename    = String(form.get('filename') || file.name || `upload-${Date.now()}`)
  const buffer      = Buffer.from(await file.arrayBuffer())
  const contentType = file.type || 'application/octet-stream'
  const path        = `${userId}/${filename}`

  // 3) upload to your Supabase Storage bucket
  const { error: upErr } = await supabase
    .storage
    .from('user-uploads')
    .upload(path, buffer, { contentType, upsert: false })

  if (upErr) {
    console.error('Storage upload error:', upErr)
    return new NextResponse('Storage upload failed', { status: 500 })
  }

  const { data: urlData } = supabase
    .storage
    .from('user-uploads')
    .getPublicUrl(path)

  // 4) record the upload in your `uploads` table
  const { error: dbErr } = await supabase
    .from('uploads')
    .insert({
      user_id:   userId,
      file_name: filename,
      file_url:  urlData.publicUrl
    })

  if (dbErr) {
    console.error('DB insert error:', dbErr)
    return new NextResponse('Failed to record upload', { status: 500 })
  }

  // 5) return the public URL
  return NextResponse.json({ publicUrl: urlData.publicUrl })
}
