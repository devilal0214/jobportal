'use client'

import { useState } from 'react'
import { Users, Briefcase, Clock } from 'lucide-react'
import Link from 'next/link'

interface DashboardStats {
  newApplications: number
  totalApplications: number
  underReview: number
  totalJobs: number
}

export default function HomePage() {
  const [stats] = useState<DashboardStats>({
    newApplications: 10,
    totalApplications: 150,
    underReview: 5,
    totalJobs: 12
  })

  const [applications] = useState([
    {
      id: '1',
      candidateName: 'Salman Ansari',
      position: 'Graphic Designer',
      applyDate: '09-Sep-25',
      status: 'Interview'
    },
    {
      id: '2',
      candidateName: 'Aniker',
      position: 'Junior Graphic Designer',
      applyDate: '05-Sep-25',
      status: 'Reject'
    },
    {
      id: '3',
      candidateName: 'Charu KK',
      position: 'WordPress Developer',
      applyDate: '05-Sep-25',
      status: 'Review Pending'
    },
    {
      id: '4',
      candidateName: 'Amir',
      position: 'Junior Graphic Designer',
      applyDate: '05-Sep-25',
      status: 'Under-Review'
    }
  ])

  const [jobOpenings] = useState([
    {
      id: '1',
      position: 'Graphic Designer Intern',
      applications: { total: 1, new: 1, interviewing: 10, shortlisted: 30, rejected: 5 }
    },
    {
      id: '2',
      position: 'WordPress Developer Jr.',
      applications: { total: 1, new: 1, interviewing: 10, shortlisted: 30, rejected: 5 }
    },
    {
      id: '3',
      position: 'Graphic Designer Jr.',
      applications: { total: 1, new: 1, interviewing: 10, shortlisted: 30, rejected: 5 }
    },
    {
      id: '4',
      position: 'Graphic Designer Senior',
      applications: { total: 1, new: 1, interviewing: 10, shortlisted: 30, rejected: 5 }
    },
    {
      id: '5',
      position: 'Motion Designer Jr.',
      applications: { total: 1, new: 1, interviewing: 10, shortlisted: 30, rejected: 5 }
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'interview':
        return 'text-green-600'
      case 'reject':
        return 'text-red-600'
      case 'review pending':
        return 'text-gray-600'
      case 'under-review':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Job Portal</h1>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/jobs" className="text-gray-700 hover:text-gray-900">
                Job Openings
              </Link>
              <Link href="/applications" className="text-gray-700 hover:text-gray-900">
                Job Applications
              </Link>
              <Link href="/admin" className="text-gray-700 hover:text-gray-900">
                Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.newApplications}
                </div>
                <div className="text-sm text-gray-600">New Application</div>
                <div className="text-xs text-gray-500">Pending for Review</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-3xl font-bold text-gray-900">
                  {stats.totalApplications}
                </div>
                <div className="text-sm text-gray-600">Total Application</div>
                <div className="text-xs text-gray-500">for All Job Profiles</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-3xl font-bold text-gray-900">
                  05
                </div>
                <div className="text-sm text-gray-600">Application Under-Review</div>
                <div className="text-xs text-gray-500">167 Application Rejected</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest Job Applications */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Latest Job Applications</h2>
                <Link 
                  href="/applications" 
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  View All Applications
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apply for
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Apply Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {app.candidateName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {app.applyDate}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={getStatusColor(app.status)}>
                          {app.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Job Openings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">Job Openings</h2>
                <Link 
                  href="/jobs/new" 
                  className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                >
                  Add New Opening
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Positions
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Application
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobOpenings.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {job.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex justify-center space-x-4 text-sm">
                          <span className="text-blue-600">{job.applications.total}</span>
                          <span className="text-green-600">{job.applications.new}</span>
                          <span className="text-purple-600">{job.applications.interviewing}</span>
                          <span className="text-orange-600">{job.applications.shortlisted}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
