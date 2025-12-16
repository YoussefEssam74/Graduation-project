import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { workoutPlanService } from '../../services/workoutPlanService'
import { nutritionPlanService } from '../../services'

// Icons
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
  </svg>
)

const gymImages = {
  workout: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop'
}

function Programs() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('workout')
  const [workoutPlans, setWorkoutPlans] = useState([])
  const [nutritionPlans, setNutritionPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [user])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      const [workouts, nutrition] = await Promise.all([
        workoutPlanService.getUserPlans(user.userId).catch(() => []),
        nutritionPlanService.getUserPlans(user.userId).catch(() => [])
      ])
      setWorkoutPlans(workouts || [])
      setNutritionPlans(nutrition || [])
    } catch (err) {
      console.error('Error fetching plans:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleViewPlan = (plan) => {
    setSelectedPlan(plan)
  }

  const closeModal = () => {
    setSelectedPlan(null)
  }

  if (loading) {
    return (
      <DashboardLayout role="Member">
        <div className="empty-state" style={{ minHeight: 400, background: 'white', borderRadius: '1rem', padding: '3rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading your programs...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="Member">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&h=400&fit=crop)',
        marginBottom: '2rem'
      }}>
        <div className="hero-content">
          <h1 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>
            My <span style={{ color: '#ff6b35' }}>Programs</span>
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            View your workout routines and nutrition plans
          </p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <span style={{ 
              background: 'rgba(255,107,53,0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              border: '1px solid rgba(255,107,53,0.5)',
              color: 'white',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <DumbbellIcon style={{ width: 16, height: 16 }} />
              {workoutPlans.length} Workouts
            </span>
            <span style={{ 
              background: 'rgba(34,197,94,0.2)',
              padding: '0.5rem 1rem',
              borderRadius: '2rem',
              border: '1px solid rgba(34,197,94,0.5)',
              color: 'white',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <AppleIcon style={{ width: 16, height: 16 }} />
              {nutritionPlans.length} Nutrition
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '2rem',
        background: '#f5f5f5',
        padding: '0.5rem',
        borderRadius: '1rem',
        maxWidth: '500px'
      }}>
        <button 
          onClick={() => setActiveTab('workout')}
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            border: 'none',
            borderRadius: '0.75rem',
            background: activeTab === 'workout' ? 'linear-gradient(135deg, #ff6b35, #ff8c42)' : 'transparent',
            color: activeTab === 'workout' ? 'white' : '#666',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'workout' ? '0 4px 15px rgba(255,107,53,0.3)' : 'none'
          }}
        >
          <DumbbellIcon style={{ width: 20, height: 20 }} />
          Workout Plans
          {workoutPlans.length > 0 && (
            <span style={{ 
              background: activeTab === 'workout' ? 'rgba(255,255,255,0.2)' : '#ff6b35', 
              color: activeTab === 'workout' ? 'white' : 'white',
              padding: '0.2rem 0.5rem',
              borderRadius: '1rem',
              fontSize: '0.75rem'
            }}>{workoutPlans.length}</span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('nutrition')}
          style={{
            flex: 1,
            padding: '1rem 1.5rem',
            border: 'none',
            borderRadius: '0.75rem',
            background: activeTab === 'nutrition' ? 'linear-gradient(135deg, #22c55e, #4ade80)' : 'transparent',
            color: activeTab === 'nutrition' ? 'white' : '#666',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'all 0.3s ease',
            boxShadow: activeTab === 'nutrition' ? '0 4px 15px rgba(34,197,94,0.3)' : 'none'
          }}
        >
          <AppleIcon style={{ width: 20, height: 20 }} />
          Nutrition Plans
          {nutritionPlans.length > 0 && (
            <span style={{ 
              background: activeTab === 'nutrition' ? 'rgba(255,255,255,0.2)' : '#22c55e', 
              color: 'white',
              padding: '0.2rem 0.5rem',
              borderRadius: '1rem',
              fontSize: '0.75rem'
            }}>{nutritionPlans.length}</span>
          )}
        </button>
      </div>

      {/* Workout Plans Tab */}
      {activeTab === 'workout' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {workoutPlans.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="card" style={{ 
                background: 'white',
                border: '2px dashed #ff6b35',
                borderRadius: '1rem',
                padding: '3rem',
                textAlign: 'center'
              }}>
                <DumbbellIcon style={{ width: 64, height: 64, color: '#ccc', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>
                  No workout plans assigned
                </h3>
                <p style={{ color: '#666' }}>Ask your coach to create a workout program for you!</p>
              </div>
            </div>
          ) : (
            workoutPlans.map(plan => (
              <div key={plan.planId} className="card" style={{ 
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '1rem',
                overflow: 'hidden',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease'
              }}>
                {/* Plan Image */}
                <div style={{
                  height: '140px',
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${gymImages.workout})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '1rem'
                }}>
                  <span style={{
                    background: plan.isActive ? '#22c55e' : '#9ca3af',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {plan.isActive ? '● Active' : '○ Completed'}
                  </span>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
                    {plan.name || plan.planName}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem', lineHeight: 1.5 }}>
                    {plan.description || 'Custom workout plan designed for your goals'}
                  </p>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                      <CalendarIcon style={{ width: 14, height: 14, color: '#ff6b35' }} />
                      <span>{plan.duration || 4} weeks</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                      <FlameIcon style={{ width: 14, height: 14, color: '#ef4444' }} />
                      <span>{plan.difficulty || 'Intermediate'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: '#555' }}>
                      <ClockIcon style={{ width: 14, height: 14, color: '#22c55e' }} />
                      <span>{plan.daysPerWeek || 3}x/week</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                      <span style={{ color: '#666', fontWeight: '500' }}>Progress</span>
                      <span style={{ color: '#ff6b35', fontWeight: '700' }}>{plan.progressPercentage || 0}%</span>
                    </div>
                    <div style={{ 
                      height: '8px', 
                      background: '#e0e0e0', 
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${plan.progressPercentage || 0}%`, 
                        height: '100%',
                        background: 'linear-gradient(90deg, #ff6b35, #ff8c42)',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }}></div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleViewPlan({ ...plan, type: 'workout' })}
                    style={{ 
                      width: '100%',
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
                    <EyeIcon style={{ width: 18, height: 18 }} />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Nutrition Plans Tab */}
      {activeTab === 'nutrition' && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {nutritionPlans.length === 0 ? (
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="card" style={{ 
                background: 'white',
                border: '2px dashed #22c55e',
                borderRadius: '1rem',
                padding: '3rem',
                textAlign: 'center'
              }}>
                <AppleIcon style={{ width: 64, height: 64, color: '#ccc', margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: '#333', marginBottom: '0.5rem' }}>
                  No nutrition plans assigned
                </h3>
                <p style={{ color: '#666' }}>Talk to your coach about getting a diet plan!</p>
              </div>
            </div>
          ) : (
            nutritionPlans.map(plan => (
              <div key={plan.planId} className="card" style={{ 
                background: 'white',
                border: '1px solid #e0e0e0',
                borderRadius: '1rem',
                overflow: 'hidden'
              }}>
                {/* Plan Image */}
                <div style={{
                  height: '140px',
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.5)), url(${gymImages.nutrition})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '1rem'
                }}>
                  <span style={{
                    background: plan.isActive ? '#22c55e' : '#9ca3af',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {plan.isActive ? '● Active' : '○ Completed'}
                  </span>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontWeight: '700', fontSize: '1.1rem', color: '#333', marginBottom: '0.5rem' }}>
                    {plan.name || plan.planName}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1rem' }}>
                    {plan.description || 'Custom nutrition plan for your goals'}
                  </p>

                  {/* Macro Stats */}
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '0.75rem',
                    marginBottom: '1.25rem'
                  }}>
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#fff8f5', 
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: '1px solid #ffe0d5'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ff6b35' }}>
                        {plan.targetCalories || 2200}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Calories
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#f0fdf4', 
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: '1px solid #dcfce7'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#22c55e' }}>
                        {plan.proteinGrams || 150}g
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Protein
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#fffbeb', 
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: '1px solid #fef3c7'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#f59e0b' }}>
                        {plan.carbsGrams || 220}g
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Carbs
                      </div>
                    </div>
                    <div style={{ 
                      padding: '0.75rem', 
                      background: '#fef2f2', 
                      borderRadius: '0.5rem',
                      textAlign: 'center',
                      border: '1px solid #fecaca'
                    }}>
                      <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>
                        {plan.fatGrams || 70}g
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#666', textTransform: 'uppercase', fontWeight: '600' }}>
                        Fat
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleViewPlan({ ...plan, type: 'nutrition' })}
                    style={{ 
                      width: '100%',
                      padding: '0.75rem',
                      background: 'linear-gradient(135deg, #22c55e, #4ade80)',
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
                    <EyeIcon style={{ width: 18, height: 18 }} />
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div 
          onClick={closeModal}
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
            onClick={e => e.stopPropagation()} 
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
              background: selectedPlan.type === 'workout' 
                ? 'linear-gradient(135deg, #ff6b35, #ff8c42)' 
                : 'linear-gradient(135deg, #22c55e, #4ade80)',
              padding: '1.5rem',
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {selectedPlan.type === 'workout' ? <DumbbellIcon /> : <AppleIcon />}
                <h3 style={{ fontWeight: '700', fontSize: '1.25rem' }}>
                  {selectedPlan.type === 'workout' ? 'Workout' : 'Nutrition'} Plan Details
                </h3>
              </div>
              <button 
                onClick={closeModal}
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
                <XIcon style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '1.5rem' }}>
              <h4 style={{ fontWeight: '700', fontSize: '1.25rem', color: '#333', marginBottom: '0.5rem' }}>
                {selectedPlan.name || selectedPlan.planName}
              </h4>
              <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                {selectedPlan.description || 'No description available'}
              </p>

              {selectedPlan.type === 'workout' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CalendarIcon style={{ width: 16, height: 16, color: '#ff6b35' }} /> Duration
                    </span>
                    <span style={{ fontWeight: '600', color: '#333' }}>{selectedPlan.duration || 4} weeks</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FlameIcon style={{ width: 16, height: 16, color: '#ef4444' }} /> Difficulty
                    </span>
                    <span style={{ fontWeight: '600', color: '#333' }}>{selectedPlan.difficulty || 'Intermediate'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <ClockIcon style={{ width: 16, height: 16, color: '#22c55e' }} /> Days per Week
                    </span>
                    <span style={{ fontWeight: '600', color: '#333' }}>{selectedPlan.daysPerWeek || 3}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f8f9fa', borderRadius: '0.5rem' }}>
                    <span style={{ color: '#666', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <TargetIcon style={{ width: 16, height: 16, color: '#ff6b35' }} /> Progress
                    </span>
                    <span style={{ fontWeight: '600', color: '#ff6b35' }}>{selectedPlan.progressPercentage || 0}%</span>
                  </div>
                </div>
              )}

              {selectedPlan.type === 'nutrition' && (
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fff8f5', borderRadius: '0.5rem', border: '1px solid #ffe0d5' }}>
                    <span style={{ color: '#666' }}>Daily Calories</span>
                    <span style={{ fontWeight: '700', color: '#ff6b35' }}>{selectedPlan.targetCalories || 2200} kcal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#f0fdf4', borderRadius: '0.5rem', border: '1px solid #dcfce7' }}>
                    <span style={{ color: '#666' }}>Protein</span>
                    <span style={{ fontWeight: '700', color: '#22c55e' }}>{selectedPlan.proteinGrams || 150}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fffbeb', borderRadius: '0.5rem', border: '1px solid #fef3c7' }}>
                    <span style={{ color: '#666' }}>Carbohydrates</span>
                    <span style={{ fontWeight: '700', color: '#f59e0b' }}>{selectedPlan.carbsGrams || 220}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                    <span style={{ color: '#666' }}>Fat</span>
                    <span style={{ fontWeight: '700', color: '#ef4444' }}>{selectedPlan.fatGrams || 70}g</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e0e0e0', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={closeModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Programs
