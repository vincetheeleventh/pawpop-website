'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, ExternalLink, Eye, MessageSquare } from 'lucide-react'
import { AdminReview } from '@/lib/admin-review'

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'artwork_proof' | 'highres_file'>('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [filter])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/reviews?type=${filter === 'all' ? '' : filter}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews')
      }
      
      const data = await response.json()
      setReviews(data.reviews || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
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

  const pendingCount = reviews.filter(r => r.status === 'pending').length

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center" data-testid="loading-state">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyclamen mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Reviews</h1>
                <p className="mt-2 text-gray-600">
                  Human-in-the-loop quality control for artwork and high-res files
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {pendingCount > 0 && (
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {pendingCount} pending review{pendingCount !== 1 ? 's' : ''}
                  </div>
                )}
                <button
                  onClick={fetchReviews}
                  className="bg-cyclamen text-white px-4 py-2 rounded-lg hover:bg-cyclamen/90 transition-colors"
                  data-testid="refresh-button"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-cyclamen text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="filter-all"
            >
              All Reviews ({reviews.length})
            </button>
            <button
              onClick={() => setFilter('artwork_proof')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'artwork_proof'
                  ? 'bg-cyclamen text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="filter-artwork-proof"
            >
              Artwork Proofs ({reviews.filter(r => r.review_type === 'artwork_proof').length})
            </button>
            <button
              onClick={() => setFilter('highres_file')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'highres_file'
                  ? 'bg-cyclamen text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              data-testid="filter-highres-file"
            >
              High-Res Files ({reviews.filter(r => r.review_type === 'highres_file').length})
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" data-testid="error-message">
            <p className="text-red-800">Error loading reviews: {error}</p>
          </div>
        )}

        {/* Reviews List */}
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center" data-testid="empty-state">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending reviews</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No reviews have been created yet.' 
                : `No ${getReviewTypeDisplay(filter).toLowerCase()} reviews found.`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow" data-testid="review-item">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {getStatusIcon(review.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(review.status)}`}>
                          {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                        </span>
                        <span className="text-sm text-gray-500" data-testid="review-type">
                          {getReviewTypeDisplay(review.review_type)}
                        </span>
                        <span className="text-sm text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()} at {new Date(review.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1" data-testid="customer-name">
                            {review.customer_name}
                            {review.pet_name && <span className="text-gray-600" data-testid="pet-name"> ({review.pet_name})</span>}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2" data-testid="customer-email">{review.customer_email}</p>
                          <p className="text-xs text-gray-500 font-mono">ID: {review.id}</p>
                        </div>
                        
                        <div className="flex justify-center">
                          <div className="bg-gray-100 rounded-lg p-2">
                            <img 
                              src={review.image_url} 
                              alt="Review image"
                              className="w-32 h-32 object-contain rounded"
                              data-testid="artwork-image"
                            />
                          </div>
                        </div>
                      </div>

                      {review.fal_generation_url && (
                        <div className="mb-4">
                          <a 
                            href={review.fal_generation_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                            data-testid="fal-generation-link"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            View FAL.ai Generation
                          </a>
                        </div>
                      )}

                      {review.review_notes && (
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="flex items-center mb-2">
                            <MessageSquare className="w-4 h-4 text-gray-500 mr-2" />
                            <span className="text-sm font-medium text-gray-700">Review Notes</span>
                          </div>
                          <p className="text-sm text-gray-600">{review.review_notes}</p>
                          {review.reviewed_by && (
                            <p className="text-xs text-gray-500 mt-2">
                              By {review.reviewed_by} on {new Date(review.reviewed_at!).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      <a
                        href={`/admin/reviews/${review.review_id}`}
                        className="inline-flex items-center px-4 py-2 bg-cyclamen text-white rounded-lg hover:bg-cyclamen/90 transition-colors text-sm font-medium"
                        data-testid="review-detail-link"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Review
                      </a>
                      
                      {review.artwork_token && (
                        <a
                          href={`/artwork/${review.artwork_token}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Artwork
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
