'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, ArrowLeft, ExternalLink, MessageSquare, Clock, Upload } from 'lucide-react'
import { AdminReview } from '@/lib/admin-review'

interface ReviewDetailPageProps {
  params: {
    reviewId: string
  }
}

export default function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const router = useRouter()
  const [review, setReview] = useState<AdminReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchReview()
  }, [params.reviewId])

  const fetchReview = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reviews/${params.reviewId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch review')
      }
      
      const data = await response.json()
      setReview(data.review)
      setNotes(data.review?.review_notes || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load review')
    } finally {
      setLoading(false)
    }
  }

  const processReview = async (status: 'approved' | 'rejected') => {
    if (!review) return

    try {
      setProcessing(true)
      const response = await fetch(`/api/admin/reviews/${params.reviewId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          notes: notes.trim() || undefined,
          reviewedBy: 'admin@pawpopart.com' // TODO: Get from auth
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process review')
      }

      // Refresh the review data
      await fetchReview()
      
      // Show success message
      const successDiv = document.createElement('div')
      successDiv.setAttribute('data-testid', 'success-message')
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50'
      successDiv.textContent = `Review ${status} successfully!`
      document.body.appendChild(successDiv)
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv)
        }
      }, 3000)
      
      // Redirect back to reviews list after a short delay
      setTimeout(() => {
        router.push('/admin/reviews')
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process review')
    } finally {
      setProcessing(false)
    }
  }

  const handleManualUpload = async () => {
    if (!uploadFile || !review) return

    try {
      setUploading(true)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('image', uploadFile)
      formData.append('reviewId', params.reviewId)
      formData.append('notes', notes.trim() || 'Manually replaced image')
      formData.append('reviewedBy', 'admin@pawpopart.com') // TODO: Get from auth

      const response = await fetch(`/api/admin/reviews/${params.reviewId}/manual-upload`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload replacement image')
      }

      // Refresh the review data
      await fetchReview()
      
      // Show success message
      const successDiv = document.createElement('div')
      successDiv.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50'
      successDiv.textContent = 'Image replaced and review approved successfully!'
      document.body.appendChild(successDiv)
      
      // Remove success message after 3 seconds
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv)
        }
      }, 3000)
      
      // Redirect back to reviews list after a short delay
      setTimeout(() => {
        router.push('/admin/reviews')
      }, 1500)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload replacement image')
    } finally {
      setUploading(false)
      setUploadFile(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-6 h-6 text-green-500" />
      case 'rejected':
        return <XCircle className="w-6 h-6 text-red-500" />
      default:
        return <Clock className="w-6 h-6 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getReviewTypeDisplay = (type: string) => {
    return type === 'artwork_proof' ? 'Artwork Proof' : 'High-Res File'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyclamen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review...</p>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Review Not Found</h2>
          <p className="text-gray-600 mb-4">{error || 'The requested review could not be found.'}</p>
          <button
            onClick={() => router.push('/admin/reviews')}
            className="bg-cyclamen text-white px-4 py-2 rounded-lg hover:bg-cyclamen/90 transition-colors"
          >
            Back to Reviews
          </button>
        </div>
      </div>
    )
  }

  const isPending = review.status === 'pending'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/admin/reviews')}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Review Details</h1>
                  <p className="text-gray-600" data-testid="customer-name">
                    {review.customer_name}
                    {review.pet_name && <span data-testid="pet-name"> • {review.pet_name}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusIcon(review.status)}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                  {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column - Image and Details */}
          <div className="space-y-6">
            {/* Image */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Image for Review</h3>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <img 
                  src={review.image_url} 
                  alt="Review image"
                  className="max-w-full max-h-96 object-contain rounded mx-auto"
                  data-testid="artwork-image"
                />
              </div>
              <div className="mt-4 flex justify-center">
                <a
                  href={review.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  View Full Size
                </a>
              </div>
            </div>

            {/* Source Images */}
            {review.source_images && (review.source_images.pet_mom_photo || review.source_images.pet_photo) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Photos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {review.source_images.pet_mom_photo && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Pet Mom Photo</label>
                      <div className="bg-gray-100 rounded-lg p-2">
                        <img 
                          src={review.source_images.pet_mom_photo} 
                          alt="Pet mom photo"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    </div>
                  )}
                  {review.source_images.pet_photo && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-2 block">Pet Photo</label>
                      <div className="bg-gray-100 rounded-lg p-2">
                        <img 
                          src={review.source_images.pet_photo} 
                          alt="Pet photo"
                          className="w-full h-32 object-cover rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Customer Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Name</label>
                  <p className="text-gray-900" data-testid="customer-name">{review.customer_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900" data-testid="customer-email">{review.customer_email}</p>
                </div>
                {review.pet_name && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pet Name</label>
                    <p className="text-gray-900" data-testid="pet-name">{review.pet_name}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Review Type</label>
                  <p className="text-gray-900" data-testid="review-type">{getReviewTypeDisplay(review.review_type)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="text-gray-900">
                    {new Date(review.created_at).toLocaleDateString()} at {new Date(review.created_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>

            {/* FAL.ai Reference */}
            {review.fal_generation_url && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">FAL.ai Generation Reference</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <a 
                    href={review.fal_generation_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-mono text-sm break-all"
                    data-testid="fal-generation-link"
                  >
                    <ExternalLink className="w-4 h-4 mr-2 flex-shrink-0" />
                    {review.fal_generation_url}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Review Actions */}
          <div className="space-y-6">
            
            {/* Review Status */}
            {!isPending && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Status</h3>
                <div className="flex items-center space-x-3 mb-4">
                  {getStatusIcon(review.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(review.status)}`}>
                    {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                  </span>
                </div>
                {review.reviewed_by && (
                  <div className="text-sm text-gray-600">
                    <p>Reviewed by {review.reviewed_by}</p>
                    <p>on {new Date(review.reviewed_at!).toLocaleString()}</p>
                  </div>
                )}
              </div>
            )}

            {/* Review Notes */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <MessageSquare className="w-5 h-5 inline mr-2" />
                Review Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isPending ? "Add notes about this review (optional)..." : "Review notes"}
                disabled={!isPending}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-cyclamen focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600"
                data-testid="review-notes"
              />
              <p className="text-sm text-gray-500 mt-2">
                {isPending 
                  ? "Notes will be saved with your review decision and can help improve future generations."
                  : "These notes were saved with the review decision."
                }
              </p>
            </div>

            {/* Action Buttons */}
            {isPending && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Decision</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => processReview('approved')}
                    disabled={processing}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                    data-testid="approve-button"
                  >
                    <CheckCircle className="w-5 h-5 mr-2" />
                    {processing ? 'Processing...' : 'Approve'}
                  </button>
                  
                  {/* Manual Upload Button */}
                  <div className="border-t pt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manual Upload Proof Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-cyclamen file:text-white hover:file:bg-cyclamen/90 mb-3"
                    />
                    {uploadFile && (
                      <div className="mb-3 p-2 bg-gray-50 rounded border">
                        <p className="text-sm text-gray-600">Selected: {uploadFile.name}</p>
                      </div>
                    )}
                    <button
                      onClick={handleManualUpload}
                      disabled={!uploadFile || uploading || processing}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                      data-testid="manual-upload-button"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      {uploading ? 'Uploading...' : 'Manual Upload Proof Image'}
                    </button>
                    <p className="text-xs text-gray-500 mt-2">
                      This will replace the generated image and automatically approve the review.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to reject this review?')) {
                        // Add test ID to confirm dialog for E2E tests
                        const confirmButton = document.querySelector('[data-testid="confirm-reject"]')
                        if (confirmButton) {
                          confirmButton.setAttribute('data-testid', 'confirm-reject')
                        }
                        processReview('rejected')
                      }
                    }}
                    disabled={processing}
                    className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center"
                    data-testid="reject-button"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Important:</strong> Customer orders are on hold until you make a decision. 
                    Approved items will continue through the fulfillment process.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                {review.artwork_token && (
                  <a
                    href={`/artwork/${review.artwork_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 inline mr-2" />
                    View Customer Artwork Page
                  </a>
                )}
                <button
                  onClick={() => router.push('/admin/reviews')}
                  className="block w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  ← Back to All Reviews
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
