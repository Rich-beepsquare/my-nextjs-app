import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import * as pdfParse from 'pdf-parse/lib/pdf-parse.js'
import mammoth from 'mammoth'

// Helper to split text into ~500-character chunks
function chunkText(text, size = 500) {
  const chunks = []
  let i = 0
  while (i < text.length) {
    chunks.push(text.slice(i, i + size))
    i += size
  }
  return chunks
}

export async function POST(req) {
  const { filePath, fileType, uploadId } = await req.json()
  const bucket = 'user-uploads'

  try {
    // Get user ID from upload row
    const { data: uploadRow, error: fetchUploadErr } = await supabase
      .from('uploads')
      .select('user_id')
      .eq('id', uploadId)
      .single()
    if (fetchUploadErr) throw new Error(fetchUploadErr.message)
    const userId = uploadRow.user_id

    // 1. Download from Supabase Storage
    const { data: fileData, error: downloadErr } = await supabase
      .storage
      .from(bucket)
      .download(filePath)
    if (downloadErr) throw new Error(downloadErr.message || 'Download failed')

    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath))
    const buffer = await fileData.arrayBuffer()
    await fs.writeFile(tempFilePath, Buffer.from(buffer))

    // 2. Extract text
    let extractedText = ''
    if (fileType === 'application/pdf') {
      const pdfBuffer = await fs.readFile(tempFilePath)
      const parsed = await pdfParse(pdfBuffer)
      extractedText = parsed.text
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const docBuffer = await fs.readFile(tempFilePath)
      const result = await mammoth.extractRawText({ buffer: docBuffer })
      extractedText = result.value
    } else {
      throw new Error('Unsupported file type')
    }

    // 3. Save snippet (first 500 chars)
    const { error: updateErr } = await supabase
      .from('uploads')
      .update({ snippet: extractedText.slice(0, 500) })
      .eq('id', uploadId)
    if (updateErr) throw new Error(updateErr.message)

    // 4. Save full content as chunks
    const chunks = chunkText(extractedText, 500)
    const chunkInserts = chunks.map((chunk, index) => ({
      upload_id: uploadId,
      user_id: userId,
      chunk_index: index,
      content: chunk,
    }))

    const { error: chunkErr } = await supabase
      .from('document_chunks')
      .insert(chunkInserts)
    if (chunkErr) throw new Error(chunkErr.message)

    return NextResponse.json({
      success: true,
      chars: extractedText.length,
      chunks: chunkInserts.length,
    })
  } catch (err) {
    console.error('Extraction error →', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
