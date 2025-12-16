import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'
import { userService } from '../../services/userService'

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const UserPlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

function Members() {
  const toast = useToast()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      setLoading(true)
      const data = await userService.getAllMembers()
      setMembers(data || [])
    } catch (err) {
      console.error('Error fetching members:', err)
      // Mock data
      setMembers([
        { userId: 1, name: 'Ahmed Hassan', email: 'ahmed@email.com', phone: '01012345678', isActive: true, subscriptionType: 'Monthly', expiresAt: '2024-02-15' },
        { userId: 2, name: 'Sara Mohamed', email: 'sara@email.com', phone: '01023456789', isActive: true, subscriptionType: 'Quarterly', expiresAt: '2024-04-20' },
        { userId: 3, name: 'Omar Ali', email: 'omar@email.com', phone: '01034567890', isActive: false, subscriptionType: 'Monthly', expiresAt: '2024-01-10' },
        { userId: 4, name: 'Nour Ahmed', email: 'nour@email.com', phone: '01045678901', isActive: true, subscriptionType: 'Annual', expiresAt: '2024-12-31' }
      ])
    } finally {
      setLoading(false)
    }
  }

  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone?.includes(searchTerm)
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && member.isActive) ||
      (filterStatus === 'inactive' && !member.isActive)
    return matchesSearch && matchesFilter
  })

  const getSubscriptionBadgeClass = (type) => {
    switch (type) {
      case 'Annual': return 'badge-success'
      case 'Quarterly': return 'badge-primary'
      case 'Monthly': return 'badge-secondary'
      default: return 'badge-secondary'
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="Reception">
        <div className="empty-state" style={{ minHeight: 400 }}>
          <div className="loading-spinner"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Reception">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>
            <span className="text-foreground">All </span>
            <span className="text-primary">Members</span>
          </h1>
          <p>View and manage gym members</p>
        </div>
        <Link to="/reception/new-member">
          <button className="btn btn-primary">
            <UserPlusIcon />
            New Member
          </button>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="card mb-6">
        <div className="card-content" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="input-with-icon" style={{ flex: '1 1 300px' }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <FilterIcon style={{ color: 'var(--muted-foreground)' }} />
              <select 
                className="input-field"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ width: 'auto', minWidth: 140 }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="badge badge-secondary" style={{ padding: '0.5rem 1rem' }}>
              {filteredMembers.length} members
            </div>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="card">
        <div className="card-content" style={{ padding: 0 }}>
          {filteredMembers.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem' }}>
              <UsersIcon className="empty-state-icon" />
              <p className="empty-state-title">No members found</p>
              <p className="empty-state-description">Try adjusting your search or filters</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Subscription</th>
                  <th>Expires</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map(member => (
                  <tr key={member.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          background: member.isActive 
                            ? 'linear-gradient(135deg, #ff6b35, #e55a2b)'
                            : '#f1f5f9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                          color: member.isActive ? '#ffffff' : '#64748b'
                        }}>
                          {member.name?.charAt(0) || 'M'}
                        </div>
                        <span style={{ fontWeight: 500 }}>{member.name}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                          <MailIcon style={{ color: 'var(--muted-foreground)' }} />
                          {member.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                          <PhoneIcon />
                          {member.phone}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getSubscriptionBadgeClass(member.subscriptionType)}`}>
                        {member.subscriptionType}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)' }}>
                      {member.expiresAt ? new Date(member.expiresAt).toLocaleDateString() : '-'}
                    </td>
                    <td>
                      <span className={`badge ${member.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm">
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Members
