'use client'

import dynamic from 'next/dynamic'

const ApplicationsContent = dynamic(() => import('./ApplicationsContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading applications...</p>
      </div>
    </div>
  )
})

export default function ApplicationsPage() {
  return <ApplicationsContent />
}