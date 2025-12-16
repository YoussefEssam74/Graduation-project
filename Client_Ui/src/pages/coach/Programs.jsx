import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { workoutPlanService } from '../../services/workoutPlanService'

// Icons
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
)

const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

function Programs() {
  const { user } = useAuth()
  const toast = useToast()
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    difficulty: 'Intermediate',
    duration: 4,
    daysPerWeek: 3
  })

  useEffect(() => {
    fetchTemplates()
  }, [user])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = await workoutPlanService.getCoachTemplates(user.userId)
      setTemplates(data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
      setTemplates([
        { id: 1, name: 'Beginner Full Body', description: 'Perfect for newcomers to fitness', difficulty: 'Beginner', duration: 4, daysPerWeek: 3, assignedCount: 5 },
        { id: 2, name: 'Intermediate Strength', description: 'Build strength and muscle mass', difficulty: 'Intermediate', duration: 8, daysPerWeek: 4, assignedCount: 8 },
        { id: 3, name: 'Advanced Hypertrophy', description: 'Maximum muscle growth program', difficulty: 'Advanced', duration: 12, daysPerWeek: 5, assignedCount: 3 },
        { id: 4, name: 'Fat Loss Express', description: 'High intensity fat burning', difficulty: 'Intermediate', duration: 6, daysPerWeek: 4, assignedCount: 12 }
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!newTemplate.name) {
      toast.error('Please enter a template name')
      return
    }
    try {
      await workoutPlanService.createTemplate({
        ...newTemplate,
        coachId: user.userId
      })
      toast.success('Template created successfully!')
      setShowCreateModal(false)
      setNewTemplate({ name: '', description: '', difficulty: 'Intermediate', duration: 4, daysPerWeek: 3 })
      fetchTemplates()
    } catch (err) {
      toast.error('Failed to create template')
    }
  }

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await workoutPlanService.deleteTemplate(id)
        toast.success('Template deleted')
        fetchTemplates()
      } catch (err) {
        toast.error('Failed to delete template')
      }
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch(difficulty) {
      case 'Beginner': return { bg: '#dcfce7', color: '#22c55e' }
      case 'Intermediate': return { bg: '#fef3c7', color: '#f59e0b' }
      case 'Advanced': return { bg: '#fecaca', color: '#ef4444' }
      default: return { bg: '#f5f5f5', color: '#666' }
    }
  }

  const gymImages = [
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=400&h=200&fit=crop',
    'https://images.unsplash.com/photo-1581009146145-b5ef050c149a?w=400&h=200&fit=crop'
  ]

  return (
    <DashboardLayout role="Coach">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            Workout <span style={{ color: '#ff6b35' }}>Programs</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            Create and manage workout templates for your clients
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
            <DumbbellIcon style={{ width: 18, height: 18, color: '#ff6b35' }} />
            <span style={{ color: 'white', fontWeight: '600' }}>
              {templates.length} Templates
            </span>
          </div>
        </div>
      </div>

      {/* Create Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowCreateModal(true)}
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
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(255,107,53,0.3)'
          }}
        >
          <PlusIcon />
          Create Template
        </button>
      </div>

      {/* Templates Grid */}
      {loading ? (
        <div className="card" style={{ background: 'white', borderRadius: '1rem', padding: '3rem', textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading templates...</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="card" style={{ 
          background: 'white',
          border: '2px dashed #ff6b35',
          borderRadius: '1rem',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <DumbbellIcon style={{ width: 64, height: 64, color: '#ccc', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>
            No templates yet
          </h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Create your first workout template to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #ff6b35, #ff8c42)',
              border: 'none',
              borderRadius: '0.5rem',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Create Template
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {templates.map((template, idx) => (
            <div key={template.id} className="card" style={{ 
              background: 'white',
              border: '1px solid #e0e0e0',
              borderRadius: '1rem',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease'
            }}>
              {/* Template Image */}
              <div style={{
                height: '140px',
                backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${gymImages[idx % gymImages.length]})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '1rem'
              }}>
                <span style={{
                  background: getDifficultyColor(template.difficulty).bg,
                  color: getDifficultyColor(template.difficulty).color,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {template.difficulty}
                </span>
              </div>

              <div style={{ padding: '1.25rem' }}>
                <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
                  {template.name}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>
                  {template.description || 'Custom workout template'}
                </p>

                {/* Stats */}
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                    <CalendarIcon style={{ width: 14, height: 14, color: '#ff6b35' }} />
                    <span>{template.duration} weeks</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                    <FlameIcon style={{ width: 14, height: 14, color: '#ef4444' }} />
                    <span>{template.daysPerWeek}x/week</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                    <UsersIcon style={{ width: 14, height: 14, color: '#22c55e' }} />
                    <span>{template.assignedCount || 0} assigned</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button 
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
                    <EditIcon />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDeleteTemplate(template.id)}
                    style={{
                      padding: '0.75rem',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '0.5rem',
                      cursor: 'pointer',
                      color: '#ef4444'
                    }}
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Template Modal */}
      {showCreateModal && (
        <div 
          onClick={() => setShowCreateModal(false)}
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
              <h2 style={{ fontWeight: '700', fontSize: '1.25rem' }}>Create Workout Template</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
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
                  Template Name *
                </label>
                <input
                  type="text"
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Beginner Full Body"
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
                  Description
                </label>
                <textarea
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Describe the workout program..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '2px solid #e0e0e0',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Difficulty
                  </label>
                  <select
                    value={newTemplate.difficulty}
                    onChange={(e) => setNewTemplate({ ...newTemplate, difficulty: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem',
                      background: 'white'
                    }}
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Duration (weeks)
                  </label>
                  <input
                    type="number"
                    value={newTemplate.duration}
                    onChange={(e) => setNewTemplate({ ...newTemplate, duration: parseInt(e.target.value) })}
                    min={1}
                    max={52}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', marginBottom: '0.5rem', display: 'block' }}>
                    Days/Week
                  </label>
                  <input
                    type="number"
                    value={newTemplate.daysPerWeek}
                    onChange={(e) => setNewTemplate({ ...newTemplate, daysPerWeek: parseInt(e.target.value) })}
                    min={1}
                    max={7}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={handleCreateTemplate}
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
                Create Template
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Programs
