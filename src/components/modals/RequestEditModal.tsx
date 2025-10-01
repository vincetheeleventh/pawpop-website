'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface RequestEditModalProps {
  isOpen: boolean
  onClose: () => void
  artworkId: string
  artworkImageUrl: string
}

export default function RequestEditModal({
  isOpen,
  onClose,
  artworkId,
  artworkImageUrl
}: RequestEditModalProps) {
  const [editText, setEditText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [requestStatus, setRequestStatus] = useState<{
    edit_request_count: number
    remaining_requests: number
    can_request_edit: boolean
  } | null>(null)

  // Fetch current request status when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchRequestStatus()
      setEditText('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen, artworkId])

  const fetchRequestStatus = async () => {
    try {
      const response = await fetch(`/api/artwork/request-edit?artwork_id=${artworkId}`)
      const data = await response.json()
      
      if (data.success) {
        setRequestStatus(data)
      }
    } catch (err) {
      console.error('Error fetching request status:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editText.trim()) {
      setError('Please describe what you\'d like us to change')
      return
    }

    if (editText.length > 250) {
      setError('Please keep your request under 250 characters')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/artwork/request-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          artwork_id: artworkId,
          edit_request_text: editText.trim()
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit edit request')
      }

      setSuccess(true)
      
      // Update request status
      if (data.edit_request_count !== undefined) {
        setRequestStatus({
          edit_request_count: data.edit_request_count,
          remaining_requests: data.remaining_requests,
          can_request_edit: data.remaining_requests > 0
        })
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
      }, 2000)

    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <h2 className="text-2xl font-arvo font-bold text-text-primary">
            Request Edits
          </h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            // Success State
            <div className="text-center py-8">
              <div className="text-6xl mb-4">✨</div>
              <h3 className="text-2xl font-arvo font-bold text-text-primary mb-3">
                Request Submitted!
              </h3>
              <p className="text-gray-600 font-geist mb-4">
                We've received your edit request. Our team will review it and create an updated version for you.
              </p>
              <p className="text-sm text-gray-500 font-geist">
                You'll receive an email when the updated artwork is ready.
              </p>
              {requestStatus && requestStatus.remaining_requests === 0 && (
                <div className="mt-4 bg-naples-yellow/10 border border-naples-yellow/30 rounded-lg p-4">
                  <p className="text-sm text-gray-700 font-geist">
                    This was your final edit request for this artwork.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Artwork Preview */}
              <div className="flex justify-center">
                <div className="bg-gradient-to-br from-naples-yellow/20 to-mindaro/10 rounded-xl p-4 inline-block">
                  <img 
                    src={artworkImageUrl}
                    alt="Your artwork"
                    className="w-48 h-48 object-contain rounded-lg"
                  />
                </div>
              </div>


              {/* Text Area */}
              <div>
                <label className="block text-sm font-geist font-semibold text-text-primary mb-2">
                  Your Edit Request
                </label>
                <textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  placeholder="Example: Make my pet smaller..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg font-geist focus:outline-none focus:ring-2 focus:ring-cyclamen/50 focus:border-cyclamen transition-all"
                  rows={2}
                  maxLength={250}
                  disabled={loading}
                />
                <div className="flex justify-end items-center mt-2">
                  <p className="text-xs text-gray-500 font-geist">
                    {editText.length}/250
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600 font-geist">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-arvo font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !editText.trim()}
                  className="flex-1 px-6 py-3 bg-cyclamen hover:bg-cyclamen/90 text-white rounded-xl font-arvo font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>

              {/* Info Note */}
              <div className="bg-naples-yellow/10 border border-naples-yellow/30 rounded-lg p-4">
                <p className="text-xs text-gray-600 font-geist">
                  💡 <strong>Tip:</strong> You can request up to 2 edits per artwork. Our team typically completes edit requests within 24 hours.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
