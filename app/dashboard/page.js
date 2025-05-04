'use client'

import { useState, useEffect } from 'react'
import { supabase }           from '../lib/supabase'
import MyDocuments            from '../components/MyDocuments'

export default function DashboardPage() {
  const [uploads, setUploads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    async function loadUploads() {
      const { data, error } = await supabase
        .from('uploads')
        .select('*')
        .order('uploaded_at', { ascending: false })

      if (error) {
        console.error('Error loading uploads:', error)
        setError(error)
      } else {
        // ensure we never set undefined
        setUploads(data ?? [])
      }
      setLoading(false)
    }
    loadUploads()
  }, [])

  if (loading) return <div className="container py-5">Loading your documents…</div>
  if (error)   return <div className="container py-5 text-danger">Error: {error.message}</div>

  return (
    <div className="container py-5">
      <h2 className="mb-4">My Documents</h2>
      <MyDocuments uploads={uploads} />
    </div>
  )
}
