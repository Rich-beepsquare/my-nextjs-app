import { supabase } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import * as pdfParse from 'pdf-parse/lib/pdf-parse.js'
import mammoth from 'mammoth'

export async function POST(req) {
  const { filePath, fileType, uploadId } = await req.json()
  const bucket = 'user-uploads'

  console.log('Requested filePath →', filePath)

  try {
    // 1. Download file from Supabase Storage
    const { data: fileData, error: downloadErr } = await supabase
      .storage
      .from(bucket)
      .download(filePath)

    console.log('Download result →', { fileData, downloadErr })

    if (downloadErr) {
      throw new Error(downloadErr.message || 'Download failed')
    }

    // 2. Write to a temporary file on disk
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath))
    const buffer = await fileData.arrayBuffer()
    await fs.writeFile(tempFilePath, Buffer.from(buffer))

    // 3. Extract text from PDF or DOCX
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

    // 4. Update uploads table with extracted snippet
    const { error: updateErr } = await supabase
      .from('uploads')
      .update({ snippet: extractedText.slice(0, 500) })
      .eq('id', uploadId)

    if (updateErr) {
      throw new Error(updateErr.message)
    }

    return NextResponse.json({ success: true, chars: extractedText.length })
  } catch (err) {
    console.error('Extraction error →', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
