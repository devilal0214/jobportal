'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Users, 
  UserPlus,
  Shield,
  Settings,
  LogOut,
  Briefcase,
  FileText,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  Plus,
  Edit
} from 'lucide-react'

interface Role {
  id: string
  name: string
  description: string
}

interface UserData {
  id: string
  name: string
  email: string
  isActive: boolean
  avatar?: string
  phone?: string
  joinDate: string
  createdAt: string
  updatedAt: string
  role?: Role
  stats: {
    createdJobs: number
    assignedJobs: number
  }
}

interface User {
  id: string
  name: string
  email: string
  role?: Role
  isActive: boolean
  createdAt: string
}

export default function UsersPage() {
  // State for infinite scroll users
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const itemsPerPage = 10
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: ''
  })

  // Initial load will be placed after function definitions

  const fetchRoles = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const rolesData = await response.json()
        // Ensure rolesData is an array
        const rolesArray = Array.isArray(rolesData) ? rolesData : []
        setRoles(rolesArray)
        // Set default role to first available role
        if (rolesArray.length > 0 && !formData.role) {
          setFormData(prev => ({ ...prev, role: rolesArray[0].id }))
        }
      } else {
        const errorData = await response.json()
        console.error('Failed to fetch roles:', response.status, response.statusText, errorData)
        setRoles([])
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error)
      setRoles([])
    }
  }, [formData.role])

  // Fetch users data with pagination
  const fetchUsersData = useCallback(async (page: number, limit: number = itemsPerPage) => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`/api/admin/users?limit=${limit}&page=${page}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch users')
    }

    const data = await response.json()
    return {
      items: data.users || [],
      total: data.total || 0,
      hasMore: page < (data.totalPages || 1)
    }
  }, [])

  // Load more users for infinite scroll
  const loadMoreUsers = useCallback(async () => {
    if (loading || !hasMore) return

    setLoading(true)
    try {
      const data = await fetchUsersData(currentPage)
      
      if (data.items.length > 0) {
        setUsers(prev => {
          // Create a map of existing user IDs to avoid duplicates
          const existingIds = new Set(prev.map(user => user.id))
          const newUsers = data.items.filter((user: User) => !existingIds.has(user.id))
          return [...prev, ...newUsers]
        })
        setCurrentPage(prev => prev + 1)
      }
      
      setTotalUsers(data.total)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchUsersData, loading, hasMore, currentPage])

  // Refresh function - resets and loads first page
  const refreshUsers = useCallback(async () => {
    setLoading(true)
    setUsers([])
    setCurrentPage(1)
    setHasMore(true)
    
    try {
      const data = await fetchUsersData(1)
      setUsers(data.items)
      setCurrentPage(2)
      setTotalUsers(data.total)
      setHasMore(data.hasMore)
    } catch (error) {
      console.error('Failed to refresh users:', error)
    } finally {
      setLoading(false)
    }
  }, [fetchUsersData])

  // Scroll handler for infinite scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout | null = null
    
    const handleScroll = () => {
      // Clear previous timeout
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
      
      // Debounce scroll events
      scrollTimeout = setTimeout(() => {
        if (
          window.innerHeight + document.documentElement.scrollTop >=
          document.documentElement.offsetHeight - 100 &&
          hasMore &&
          !loading
        ) {
          loadMoreUsers()
        }
      }, 100) // 100ms debounce
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeout) {
        clearTimeout(scrollTimeout)
      }
    }
  }, [hasMore, loading, loadMoreUsers])

  // Initial load effect
  useEffect(() => {
    refreshUsers()
    fetchRoles()
  }, [refreshUsers, fetchRoles])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const url = editingUser ? `/api/admin/users/${editingUser.id}` : '/api/admin/users'
      const method = editingUser ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        refreshUsers()
        setShowAddForm(false)
        setEditingUser(null)
        setFormData({ 
          name: '', 
          email: '', 
          password: '', 
          role: roles.length > 0 ? roles[0].id : '' 
        })
      }
    } catch (error) {
      console.error('Failed to save user:', error)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role?.id || (roles.length > 0 ? roles[0].id : '')
    })
    setShowAddForm(true)
  }

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        if (response.ok) {
          refreshUsers()
        }
      } catch (error) {
        console.error('Failed to delete user:', error)
      }
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      })
      if (response.ok) {
        refreshUsers()
      }
    } catch (error) {
      console.error('Failed to update user status:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Users className="h-6 w-6 mr-2 text-indigo-600" />
                  User Management
                </h1>
                <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
              </div>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </button>
            </div>
          </div>

          {showAddForm && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h3 className="text-lg text-gray-950 font-medium mb-4">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 text-gray-600 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required={!editingUser}
                    placeholder={editingUser ? 'Leave blank to keep current password' : ''}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border text-gray-600 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a role</option>
                    {Array.isArray(roles) && roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2 flex gap-2">
                  <button
                    type="submit"
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    {editingUser ? 'Update' : 'Create'} User
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false)
                      setEditingUser(null)
                      setFormData({ 
                        name: '', 
                        email: '', 
                        password: '', 
                        role: roles.length > 0 ? roles[0].id : '' 
                      })
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-indigo-600 font-medium text-sm">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role?.name === 'Administrator' ? 'bg-purple-100 text-purple-800' :
                        user.role?.name === 'Human Resources' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role?.name || 'Guest'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {user.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Infinite Scroll Loading Indicator */}
          {loading && (
            <div className="flex justify-center py-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">Loading more users...</div>
            </div>
          )}
          
          {/* Users Count */}
          {totalUsers > 0 && (
            <div className="px-4 py-3 bg-white border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {users.length} of {totalUsers} users
                {!hasMore && users.length > 0 && <span className="ml-2 text-gray-500">(All users loaded)</span>}
              </div>
            </div>
          )}

          <div className="px-6 py-4 border-t border-gray-200">
            <Link href="/admin" className="text-indigo-600 hover:text-indigo-500">
              &larr; Back to Admin Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
