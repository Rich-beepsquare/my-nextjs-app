import { useState } from 'react'
import { Table, Button, Modal } from 'react-bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

export default function MyDocuments({ uploads, onRefresh }) {
  const [showPreview, setShowPreview] = useState(false)
  const [previewFile, setPreviewFile]   = useState(null)
  const [showDelete, setShowDelete]     = useState(false)
  const [deleteFile, setDeleteFile]     = useState(null)

  // Open the snippet modal
  const handlePreview = (file) => {
    setPreviewFile(file)
    setShowPreview(true)
  }

  // Open the delete modal
  const handleDeleteConfirm = (file) => {
    setDeleteFile(file)
    setShowDelete(true)
  }

  // Actually delete (you’d call your API here)
  const handleDelete = async () => {
    if (!deleteFile) return
    // await fetch(`/api/uploads/${deleteFile.id}`, { method: 'DELETE' })
    setShowDelete(false)
    setDeleteFile(null)
    onRefresh?.()
  }

  return (
    <div className="container my-4">
      <h2 className="mb-4">My Documents</h2>
      <Table hover responsive className="align-middle">
        <thead className="table-light">
          <tr>
            <th>Document</th>
            <th>Uploaded</th>
            <th>Size</th>
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
              <td>{file.size}</td>
              <td className="text-end">
                <a
                  href={file.file_url}
                  target="_blank"
                  rel="noopener"
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

      {/* Snippet Preview Modal */}
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
                {previewFile.snippet ||
                  `“No snippet available.” /* replace with your RAG‐retrieved excerpt */`}
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
