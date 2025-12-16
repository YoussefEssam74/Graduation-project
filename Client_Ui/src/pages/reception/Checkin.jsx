import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useToast } from '../../contexts/ToastContext'
import { userService } from '../../services/userService'

// Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
  </svg>
)

const UserCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/>
  </svg>
)

const LogInIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
  </svg>
)

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
  </svg>
)

function Checkin() {
  const toast = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recentCheckins, setRecentCheckins] = useState([])
  const [searching, setSearching] = useState(false)
  const [currentlyInGym, setCurrentlyInGym] = useState(0)

  useEffect(() => {
    fetchRecentCheckins()
    // Simulating real-time count
    setCurrentlyInGym(23)
  }, [])

  const fetchRecentCheckins = async () => {
    // Mock data
    setRecentCheckins([
      { id: 1, name: 'Ahmed Hassan', time: '10:30 AM', type: 'in', memberId: 'M001' },
      { id: 2, name: 'Sara Mohamed', time: '10:25 AM', type: 'out', memberId: 'M002' },
      { id: 3, name: 'Omar Ali', time: '10:15 AM', type: 'in', memberId: 'M003' },
      { id: 4, name: 'Nour Ahmed', time: '10:00 AM', type: 'in', memberId: 'M004' }
    ])
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) return
    
    setSearching(true)
    try {
      const results = await userService.searchMembers(searchTerm)
      setSearchResults(results || [])
    } catch (err) {
      // Mock results
      setSearchResults([
        { userId: 1, name: 'Ahmed Hassan', email: 'ahmed@email.com', phone: '01012345678', isActive: true, isInGym: false },
        { userId: 2, name: 'Ahmed Ali', email: 'ali@email.com', phone: '01023456789', isActive: true, isInGym: true }
      ])
    } finally {
      setSearching(false)
    }
  }

  const handleCheckin = async (member) => {
    try {
      // API call would go here
      toast.success(`${member.name} checked in successfully!`)
      setSearchResults(prev => prev.map(m => 
        m.userId === member.userId ? { ...m, isInGym: true } : m
      ))
      setCurrentlyInGym(prev => prev + 1)
      fetchRecentCheckins()
    } catch (err) {
      toast.error('Check-in failed')
    }
  }

  const handleCheckout = async (member) => {
    try {
      // API call would go here
      toast.success(`${member.name} checked out successfully!`)
      setSearchResults(prev => prev.map(m => 
        m.userId === member.userId ? { ...m, isInGym: false } : m
      ))
      setCurrentlyInGym(prev => prev - 1)
      fetchRecentCheckins()
    } catch (err) {
      toast.error('Check-out failed')
    }
  }

  return (
    <DashboardLayout role="Reception">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <h1>
            <span className="text-foreground">Member </span>
            <span className="text-primary">Check-in</span>
          </h1>
          <p>Search and check members in or out</p>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.75rem',
          padding: '0.75rem 1.25rem',
          background: 'var(--card)',
          borderRadius: '0.75rem',
          border: '1px solid var(--border)'
        }}>
          <ActivityIcon style={{ color: 'var(--success)' }} />
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>{currentlyInGym}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>Currently in Gym</div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="card mb-6">
        <div className="card-content" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="input-with-icon" style={{ flex: 1 }}>
              <SearchIcon />
              <input
                type="text"
                placeholder="Search by name, email, phone, or member ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn btn-primary" onClick={handleSearch} disabled={searching}>
              {searching ? (
                <div className="loading-spinner" style={{ width: 20, height: 20, borderWidth: 2 }}></div>
              ) : (
                <>
                  <SearchIcon />
                  Search
                </>
              )}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>
                Search Results ({searchResults.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {searchResults.map(member => (
                  <div key={member.userId} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: 'var(--background-secondary)',
                    borderRadius: '0.75rem',
                    borderLeft: member.isInGym ? '4px solid var(--success)' : '4px solid var(--border)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: member.isInGym 
                          ? 'linear-gradient(135deg, #ff6b35, #e55a2b)'
                          : '#f8fafc',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: member.isInGym ? '#ffffff' : '#64748b'
                      }}>
                        {member.name?.charAt(0) || 'M'}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{member.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                          {member.email} • {member.phone}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span className={`badge ${member.isInGym ? 'badge-success' : 'badge-secondary'}`}>
                        {member.isInGym ? 'In Gym' : 'Not in Gym'}
                      </span>
                      {member.isInGym ? (
                        <button 
                          className="btn btn-outline"
                          onClick={() => handleCheckout(member)}
                        >
                          <LogOutIcon />
                          Check Out
                        </button>
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => handleCheckin(member)}
                        >
                          <LogInIcon />
                          Check In
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="text-foreground">Today's </span>
            <span className="text-primary">Activity</span>
          </h3>
        </div>
        <div className="card-content">
          {recentCheckins.length === 0 ? (
            <div className="empty-state">
              <UserCheckIcon className="empty-state-icon" />
              <p className="empty-state-title">No activity today</p>
              <p className="empty-state-description">Check-ins and check-outs will appear here</p>
            </div>
          ) : (
            <div className="data-list">
              {recentCheckins.map(checkin => (
                <div key={checkin.id} className="data-list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: checkin.type === 'in' 
                        ? 'linear-gradient(135deg, #ff6b35, #e55a2b)'
                        : '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      color: checkin.type === 'in' ? '#ffffff' : '#64748b'
                    }}>
                      {checkin.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 500 }}>{checkin.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        ID: {checkin.memberId}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted-foreground)' }}>
                      <ClockIcon />
                      <span style={{ fontSize: '0.875rem' }}>{checkin.time}</span>
                    </div>
                    <span className={`badge ${checkin.type === 'in' ? 'badge-success' : 'badge-secondary'}`}>
                      {checkin.type === 'in' ? 'Check In' : 'Check Out'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

export default Checkin
