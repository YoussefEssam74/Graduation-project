import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'
import { userService } from '../../services/userService'

// Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
)

const BanIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

function Users() {
  const toast = useToast()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Member',
    password: ''
  })

  const roles = ['Member', 'Coach', 'Receptionist', 'Admin']

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Mock data for now
      setUsers([
        { id: 1, name: 'Ahmed Hassan', email: 'ahmed@example.com', phone: '01012345678', role: 'Member', status: 'active', joinDate: '2024-01-15' },
        { id: 2, name: 'Sara Mohamed', email: 'sara@example.com', phone: '01123456789', role: 'Member', status: 'active', joinDate: '2024-02-20' },
        { id: 3, name: 'Omar Ali', email: 'omar@example.com', phone: '01234567890', role: 'Coach', status: 'active', joinDate: '2023-11-10' },
        { id: 4, name: 'Nour Ahmed', email: 'nour@example.com', phone: '01098765432', role: 'Member', status: 'inactive', joinDate: '2024-03-05' },
        { id: 5, name: 'Mohamed Khaled', email: 'mohamed@example.com', phone: '01187654321', role: 'Receptionist', status: 'active', joinDate: '2023-09-01' },
        { id: 6, name: 'Fatma Ibrahim', email: 'fatma@example.com', phone: '01076543210', role: 'Admin', status: 'active', joinDate: '2023-06-15' },
        { id: 7, name: 'Khaled Youssef', email: 'khaled@example.com', phone: '01165432109', role: 'Member', status: 'active', joinDate: '2024-04-10' },
        { id: 8, name: 'Mona Saeed', email: 'mona@example.com', phone: '01254321098', role: 'Coach', status: 'active', joinDate: '2024-01-25' }
      ])
    } catch (err) {
      console.error('Error fetching users:', err)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return { bg: '#fecaca', color: '#dc2626' }
      case 'Coach': return { bg: '#dbeafe', color: '#2563eb' }
      case 'Receptionist': return { bg: '#fef3c7', color: '#d97706' }
      default: return { bg: '#dcfce7', color: '#22c55e' }
    }
  }

  const getStatusColor = (status) => {
    return status === 'active' 
      ? { bg: '#dcfce7', color: '#22c55e' }
      : { bg: '#f5f5f5', color: '#666' }
  }

  const handleOpenModal = (user = null) => {
    if (user) {
      setSelectedUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        password: ''
      })
    } else {
      setSelectedUser(null)
      setFormData({ name: '', email: '', phone: '', role: 'Member', password: '' })
    }
    setShowModal(true)
  }

  const handleSaveUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required')
      return
    }
    try {
      if (selectedUser) {
        toast.success('User updated successfully!')
      } else {
        toast.success('User created successfully!')
      }
      setShowModal(false)
      fetchUsers()
    } catch (err) {
      toast.error('Failed to save user')
    }
  }

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus } : u))
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  return (
    <DashboardLayout role="Admin">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            User <span style={{ color: '#ff6b35' }}>Management</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Manage all users in the system
          </p>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            background: 'rgba(255,107,53,0.2)',
            padding: '0.5rem 1rem',
            borderRadius: '2rem',
            marginTop: '1rem',
            border: '1px solid rgba(255,107,53,0.5)'
          }}>
            <UsersIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              {users.length} Total Users
            </span>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="card" style={{
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
            <SearchIcon style={{ 
              position: 'absolute', 
              left: '1rem', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: '#999'
            }} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e0e0e0',
                borderRadius: '0.5rem',
                fontSize: '1rem'
              }}
            />
          </div>

          {/* Role Filter */}
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              background: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Roles</option>
            {roles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              border: '2px solid #e0e0e0',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              background: 'white',
              minWidth: '150px'
            }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Add User Button */}
          <button
            onClick={() => handleOpenModal()}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <PlusIcon />
            Add User
          </button>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="card" style={{ 
          background: 'white',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading users...</p>
        </div>
      ) : (
        <div className="card" style={{
          background: 'white',
          border: '1px solid #e0e0e0',
          borderRadius: '1rem',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e0e0e0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>User</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Contact</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#333' }}>Join Date</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: '#333' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, idx) => (
                <tr 
                  key={user.id}
                  style={{ 
                    borderBottom: idx < filteredUsers.length - 1 ? '1px solid #e0e0e0' : 'none',
                    background: idx % 2 === 0 ? 'white' : '#fafafa'
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '700'
                      }}>
                        {user.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: '600', color: '#333' }}>{user.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#555' }}>
                        <MailIcon style={{ width: 14, height: 14, color: '#ff6b35' }} />
                        {user.email}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#999' }}>{user.phone}</div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: getRoleColor(user.role).bg,
                      color: getRoleColor(user.role).color,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <ShieldIcon style={{ width: 12, height: 12 }} />
                      {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      background: getStatusColor(user.status).bg,
                      color: getStatusColor(user.status).color,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '1rem',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      {user.status === 'active' ? <CheckIcon style={{ width: 12, height: 12 }} /> : null}
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#666', fontSize: '0.875rem' }}>
                    {new Date(user.joinDate).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenModal(user)}
                        style={{
                          padding: '0.5rem',
                          background: 'rgba(255,107,53,0.1)',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: '#ff6b35'
                        }}
                        title="Edit"
                      >
                        <EditIcon />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        style={{
                          padding: '0.5rem',
                          background: user.status === 'active' ? '#fef2f2' : '#dcfce7',
                          border: 'none',
                          borderRadius: '0.5rem',
                          cursor: 'pointer',
                          color: user.status === 'active' ? '#dc2626' : '#22c55e'
                        }}
                        title={user.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        {user.status === 'active' ? <BanIcon /> : <CheckIcon />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredUsers.length === 0 && (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <UserIcon style={{ width: 64, height: 64, color: '#ccc', margin: '0 auto 1rem' }} />
              <h3 style={{ color: '#333', marginBottom: '0.5rem' }}>No users found</h3>
              <p style={{ color: '#666' }}>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <div 
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: '1rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
            }}
          >
            <div style={{ 
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              padding: '1.5rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontWeight: '700', fontSize: '1.25rem' }}>
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button 
                onClick={() => setShowModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'white'
                }}
              >
                <XIcon />
              </button>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    background: 'white'
                  }}
                >
                  {roles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {!selectedUser && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Password *
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              )}

              <button
                onClick={handleSaveUser}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer'
                }}
              >
                {selectedUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Users
