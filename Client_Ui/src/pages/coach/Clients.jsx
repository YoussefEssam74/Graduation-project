import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { userService } from '../../services/userService'
import { workoutPlanService } from '../../services/workoutPlanService'

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

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
  </svg>
)

const MessageIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

function Clients() {
  const { user } = useAuth()
  const toast = useToast()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedClient, setSelectedClient] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [templates, setTemplates] = useState([])

  useEffect(() => {
    fetchClients()
    fetchTemplates()
  }, [user])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const data = await userService.getCoachClients(user.userId)
      setClients(data || [])
    } catch (err) {
      console.error('Error fetching clients:', err)
      setClients([
        { userId: 1, name: 'Ahmed Hassan', email: 'ahmed@example.com', isActive: true, totalWorkouts: 45, currentWeight: 78, fitnessGoal: 'Build Muscle', hasActivePlan: true, progress: 72 },
        { userId: 2, name: 'Sara Mohamed', email: 'sara@example.com', isActive: true, totalWorkouts: 32, currentWeight: 58, fitnessGoal: 'Weight Loss', hasActivePlan: true, progress: 85 },
        { userId: 3, name: 'Omar Ali', email: 'omar@example.com', isActive: true, totalWorkouts: 28, currentWeight: 85, fitnessGoal: 'General Fitness', hasActivePlan: false, progress: 45 },
        { userId: 4, name: 'Nour Ahmed', email: 'nour@example.com', isActive: false, totalWorkouts: 12, currentWeight: 62, fitnessGoal: 'Strength', hasActivePlan: false, progress: 20 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const data = await workoutPlanService.getTemplates()
      setTemplates(data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
      setTemplates([
        { id: 1, name: 'Beginner Full Body', difficulty: 'Beginner', duration: 4 },
        { id: 2, name: 'Intermediate Strength', difficulty: 'Intermediate', duration: 8 },
        { id: 3, name: 'Advanced Hypertrophy', difficulty: 'Advanced', duration: 12 }
      ])
    }
  }

  const handleAssignPlan = (client) => {
    setSelectedClient(client)
    setShowAssignModal(true)
  }

  const handleAssignTemplate = async (templateId) => {
    try {
      await workoutPlanService.assignPlan({
        memberId: selectedClient.userId,
        coachId: user.userId,
        templateId: templateId
      })
      toast.success(`Plan assigned to ${selectedClient.name}!`)
      setShowAssignModal(false)
      fetchClients()
    } catch (err) {
      toast.error('Failed to assign plan')
    }
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && client.isActive) ||
      (filterStatus === 'inactive' && !client.isActive)
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <DashboardLayout role="Coach">
        <div className="empty-state" style={{ minHeight: 400, background: 'white', borderRadius: '1rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading clients...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Coach">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            My <span style={{ color: '#ff6b35' }}>Clients</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Manage and track your assigned clients
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
              {clients.length} Total Clients
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card" style={{ 
        marginBottom: '1.5rem',
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '1rem',
        padding: '1rem 1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <SearchIcon style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
            <input
              type="text"
              placeholder="Search clients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e0e0e0',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={e => e.target.style.borderColor = '#ff6b35'}
              onBlur={e => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <FilterIcon style={{ color: '#666' }} />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '0.75rem 1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '0.5rem',
                fontSize: '1rem',
                cursor: 'pointer',
                background: 'white'
              }}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Clients Grid */}
      {filteredClients.length === 0 ? (
        <div className="card" style={{ 
          background: 'white',
          border: '2px dashed #ff6b35',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <UsersIcon style={{ width: 64, height: 64, color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>
            No clients found
          </h3>
          <p style={{ color: '#666' }}>
            {searchTerm ? 'Try adjusting your search' : 'You have no assigned clients yet'}
          </p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {filteredClients.map(client => (
            <div key={client.userId} className="card" style={{ 
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '1rem',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              {/* Client Header */}
              <div style={{ 
                background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '700',
                    fontSize: '1.25rem',
                    color: 'white'
                  }}>
                    {client.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 style={{ fontWeight: '600', color: 'white', marginBottom: '0.25rem' }}>{client.name}</h3>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>{client.email}</span>
                  </div>
                </div>
                <span style={{
                  background: client.isActive ? '#22c55e' : '#9ca3af',
                  color: 'white',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {client.isActive ? '● Active' : '○ Inactive'}
                </span>
              </div>

              <div style={{ padding: '1.25rem' }}>
                {/* Stats Row */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6b35' }}>
                      {client.totalWorkouts || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Workouts</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#333' }}>
                      {client.currentWeight || '-'}<span style={{ fontSize: '0.75rem', fontWeight: '400', color: '#666' }}>kg</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Weight</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>
                      {client.progress || 0}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>Progress</div>
                  </div>
                </div>

                {/* Goal & Plan */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <TargetIcon style={{ color: '#ff6b35' }} />
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '0.125rem' }}>Goal</div>
                      <div style={{ fontWeight: '600', color: '#333' }}>{client.fitnessGoal || 'Not set'}</div>
                    </div>
                  </div>
                  <span style={{
                    background: client.hasActivePlan ? '#dcfce7' : '#fef3c7',
                    color: client.hasActivePlan ? '#22c55e' : '#f59e0b',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {client.hasActivePlan ? '✓ Has Plan' : '! No Plan'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: '500' }}>Progress</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: '600', color: '#ff6b35' }}>{client.progress || 0}%</span>
                  </div>
                  <div style={{ 
                    height: '8px',
                    background: '#e0e0e0',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${client.progress || 0}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ff6b35, #ff8c42)',
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
                    onClick={() => handleAssignPlan(client)}
                    style={{ 
                      flex: 1,
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                      border: 'none',
                      borderRadius: '0.5rem',
                      color: 'white',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ClipboardIcon />
                    Assign Plan
                  </button>
                  <button style={{
                    padding: '0.75rem',
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: '#666'
                  }} title="Message">
                    <MessageIcon />
                  </button>
                  <button style={{
                    padding: '0.75rem',
                    background: '#f5f5f5',
                    border: '1px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    color: '#666'
                  }} title="View Progress">
                    <ChartIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assign Plan Modal */}
      {showAssignModal && selectedClient && (
        <div 
          onClick={() => setShowAssignModal(false)}
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
            {/* Modal Header */}
            <div style={{ 
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              padding: '1.5rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ fontWeight: '700', fontSize: '1.25rem' }}>Assign Workout Plan</h2>
              <button 
                onClick={() => setShowAssignModal(false)}
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
            
            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Select a plan to assign to <strong style={{ color: '#333' }}>{selectedClient.name}</strong>
              </p>
              
              {templates.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <ClipboardIcon style={{ width: 48, height: 48, color: '#ccc', margin: '0 auto 1rem' }} />
                  <h4 style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>No templates available</h4>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>Create workout templates in the Programs section first</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {templates.map(template => (
                    <div
                      key={template.id}
                      onClick={() => handleAssignTemplate(template.id)}
                      style={{ 
                        padding: '1rem',
                        border: '2px solid #e0e0e0',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ff6b35'
                        e.currentTarget.style.background = '#fff8f5'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#e0e0e0'
                        e.currentTarget.style.background = 'white'
                      }}
                    >
                      <div>
                        <h4 style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem' }}>{template.name}</h4>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                          <span style={{
                            background: template.difficulty === 'Beginner' ? '#dcfce7' : 
                                       template.difficulty === 'Intermediate' ? '#fef3c7' : '#fecaca',
                            color: template.difficulty === 'Beginner' ? '#22c55e' : 
                                  template.difficulty === 'Intermediate' ? '#f59e0b' : '#ef4444',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}>{template.difficulty}</span>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {template.duration} weeks
                          </span>
                        </div>
                      </div>
                      <button style={{
                        padding: '0.5rem 1rem',
                        background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}>Assign</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Clients
