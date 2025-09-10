'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { isValidEmail } from '@/lib/utils'
import type { UserProfile } from '@/lib/supabase-user'

export default function UserDashboard() {
  const params = useParams()
  const email = decodeURIComponent(params.email as string)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!email || !isValidEmail(email)) {
      setError('Invalid email address')
      setLoading(false)
      return
    }

    fetchUserProfile()
  }, [email])

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/user/artworks?email=${encodeURIComponent(email)}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch user profile')
      }

      setUserProfile(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your artworks...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.history.back()}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">No Artworks Found</h1>
          <p className="text-gray-600 mb-6">We couldn't find any artworks for {email}</p>
          <a 
            href="/"
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Create Your First Artwork
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Your PawPop Gallery</h1>
          <p className="text-gray-600">{email}</p>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{userProfile.stats.total_artworks}</div>
              <div className="text-sm text-gray-500">Total Artworks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{userProfile.stats.completed_artworks}</div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{userProfile.stats.total_orders}</div>
              <div className="text-sm text-gray-500">Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">${(userProfile.stats.total_spent_cents / 100).toFixed(2)}</div>
              <div className="text-sm text-gray-500">Total Spent</div>
            </div>
          </div>
        </div>

        {/* Artworks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userProfile.artworks.map((artwork) => (
            <div key={artwork.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Artwork Image */}
              <div className="aspect-square bg-gray-100 relative">
                {artwork.generated_images?.artwork_preview ? (
                  <img
                    src={artwork.generated_images.artwork_preview}
                    alt={`${artwork.pet_name || 'Pet'} artwork`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎨</div>
                      <div className="text-sm text-gray-500">
                        {artwork.generation_step === 'pending' ? 'Creating...' : 'Processing...'}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Status Badge */}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    artwork.generation_step === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : artwork.generation_step === 'failed'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {artwork.generation_step === 'completed' ? 'Ready' : 
                     artwork.generation_step === 'failed' ? 'Failed' : 'Processing'}
                  </span>
                </div>
              </div>

              {/* Artwork Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {artwork.pet_name || 'Unnamed Pet'}
                </h3>
                <p className="text-sm text-gray-500 mb-3">
                  Created {new Date(artwork.created_at).toLocaleDateString()}
                </p>
                
                {artwork.generation_step === 'completed' && artwork.access_token && (
                  <a
                    href={`/artwork/${artwork.access_token}`}
                    className="block w-full bg-purple-600 text-white text-center py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Artwork
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {userProfile.artworks.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎨</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Artworks Yet</h2>
            <p className="text-gray-600 mb-6">Create your first masterpiece!</p>
            <a
              href="/"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Upload Photo Now
            </a>
          </div>
        )}

        {/* Recent Orders */}
        {userProfile.orders.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Orders</h2>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userProfile.orders.slice(0, 5).map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {(order as any).artworks?.pet_name || 'Unknown Pet'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {order.product_type.replace('_', ' ')} - {order.product_size}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            order.order_status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.order_status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                            order.order_status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.order_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(order.price_cents / 100).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
