'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, Button, Modal, Spinner, Form } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function MyDocuments() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [fileInput, setFileInput] = useState(null)

  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteFile, setDeleteFile] = useState(null)

  const bucket = 'user-uploads'

  const getUserId = async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user) throw error || new Error('No user session')
    return user.id
  }

  const fetchUploads = async () => {
    setLoading(true)
    setError(null)
    try {
      const userId = await getUserId()
      const { data, error: uploadsErr } = await supabase
        .from('uploads')
        .select('id, file_name, file_url, file_type, uploaded_at, snippet')

        .eq('user_id', userId)
        .order('uploaded_at', { ascending: false })

      if (uploadsErr) throw uploadsErr
      setUploads(data ?? [])
    } catch (err) {
      console.error('Error fetching uploads →', err.message || err)
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUploads()
  }, [])

  const handleFileChange = (e) => {
    setFileInput(e.target.files?.[0] || null)
    setUploadError(null)
  }

  const handleUpload = async () => {
    if (!fileInput) return
    setUploading(true)
    setUploadError(null)
  
    try {
      const userId = await getUserId()
      const filePath = `${userId}/${Date.now()}_${fileInput.name}`
  
      // 1. Upload file to Supabase Storage
      const { error: storageErr } = await supabase.storage
        .from(bucket)
        .upload(filePath, fileInput, { cacheControl: '3600', upsert: false })
  
      if (storageErr) throw storageErr
  
      // 2. Insert metadata into `uploads` table
      const { data: insertData, error: insertErr } = await supabase
        .from('uploads')
        .insert({
          user_id: userId,
          file_name: fileInput.name,
          file_url: filePath, // storing just the storage key
          file_type: fileInput.type,
          uploaded_at: new Date().toISOString(),
        })
        .select('id') // we need the new row’s ID for snippet update
  
      if (insertErr) throw insertErr
  
      const uploadId = insertData?.[0]?.id
      if (!uploadId) throw new Error('Missing upload ID after insert')
  
      // 3. Call API route to extract text and save snippet
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath,
          fileType: fileInput.type,
          uploadId,
        }),
      })
  
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Text extraction failed')
      }
  
      // 4. Refresh list
      setFileInput(null)
      fetchUploads()
    } catch (err) {
      console.error('Error uploading file →', err.message || err)
      setUploadError(err)
    } finally {
      setUploading(false)
    }
  }
  

  const handleDownload = async (filePath) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(filePath, 60) // 60-second link
      if (error) throw error
      window.open(data.signedUrl, '_blank')
    } catch (err) {
      alert('Failed to download file')
      console.error('Download error →', err.message || err)
    }
  }

  const handlePreview = (file) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  const handleDeleteConfirm = (file) => {
    setDeleteFile(file)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    if (!deleteFile) return
    try {
      const { error: delErr } = await supabase
        .from('uploads')
        .delete()
        .eq('id', deleteFile.id)
      if (delErr) throw delErr
      setShowDelete(false)
      fetchUploads()
    } catch (err) {
      console.error('Error deleting upload →', err.message || err)
      alert('Failed to delete file')
    }
  }

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Documents</h2>

      <div className="mb-3 d-flex align-items-center">
        <Form.Control
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
        />
        <Button className="ms-2" disabled={!fileInput || uploading} onClick={handleUpload}>
          {uploading ? 'Uploading…' : 'Upload'}
        </Button>
      </div>
      {uploadError && (
        <div className="text-danger mb-3">
          Error uploading file: {uploadError.message || String(uploadError)}
        </div>
      )}

      {loading ? (
        <Spinner animation="border" />
      ) : error ? (
        <div className="text-danger">Error: {error.message}</div>
      ) : uploads.length === 0 ? (
        <p>No documents uploaded yet.</p>
      ) : (
        <Table hover responsive className="align-middle">
          <thead className="table-light">
            <tr>
              <th>Document</th>
              <th>Uploaded</th>
              <th>Type</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((file) => (
              <tr key={file.id}>
                <td>
                  <i
                    className={
                      file.file_type === 'application/pdf'
                        ? 'bi bi-file-earmark-pdf-fill text-danger me-2'
                        : 'bi bi-file-earmark-word-fill text-primary me-2'
                    }
                    style={{ fontSize: '1.25rem' }}
                  />
                  {file.file_name}
                </td>
                <td>{new Date(file.uploaded_at).toLocaleString()}</td>
                <td className="text-capitalize">
                  {file.file_type?.split('/')[1] || 'unknown'}
                </td>
                <td className="text-end">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-1"
                    onClick={() => handleDownload(file.file_url)}
                  >
                    <i className="bi bi-download" />
                  </Button>
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="me-1"
                    onClick={() => handlePreview(file)}
                  >
                    <i className="bi bi-eye" />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDeleteConfirm(file)}
                  >
                    <i className="bi bi-trash" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Preview Modal */}
      <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Document Snippet Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {previewFile ? (
            <>
              <p>
                <strong>Excerpt from {previewFile.file_name}:</strong>
              </p>
              <blockquote className="border-start ps-3 fst-italic">
                {previewFile.snippet || '“No snippet available.”'}
              </blockquote>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete{' '}
          <strong>{deleteFile?.file_name}</strong>? This cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
