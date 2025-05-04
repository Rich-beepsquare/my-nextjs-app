// app/components/MyDocuments.jsx
'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Table, Button, Modal, Spinner } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function MyDocuments() {
  const [uploads, setUploads]       = useState([])
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState(null)

  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [showDelete, setShowDelete]   = useState(false)
  const [deleteFile, setDeleteFile]   = useState(null)

  // 1) Fetch the user’s uploads
  const fetchUploads = async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { session },
        error: sessionErr
      } = await supabase.auth.getSession()
      if (sessionErr || !session?.user) {
        throw new Error(sessionErr?.message || 'No active session')
      }
      const user = session.user

      const { data, error: uploadsErr } = await supabase
        .from('uploads')
        .select(`
          id,
          file_name,
          file_url,
          file_type,
          uploaded_at
        `)
        .eq('user_id', user.id)
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

  // 2) Run on mount
  useEffect(() => {
    fetchUploads()
  }, [])

  // Preview handlers
  const handlePreview = (file) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  // Delete handlers
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
      setDeleteFile(null)
      fetchUploads()
    } catch (err) {
      console.error('Error deleting upload →', err.message || err)
      alert('Failed to delete file')
    }
  }

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Documents</h2>

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
                  {file.file_type
                    ? file.file_type.replace('application/', '')
                    : 'unknown'}
                </td>
                <td className="text-end">
                  <a
                    href={file.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-sm btn-outline-primary me-1"
                  >
                    <i className="bi bi-download" />
                  </a>
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
          {previewFile && (
            <>
              <p>
                <strong>Excerpt from {previewFile.file_name}:</strong>
              </p>
              <blockquote className="border-start ps-3 fst-italic">
                {/* placeholder until you wire up RAG */}
                “No snippet available.”
              </blockquote>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPreview(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
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

