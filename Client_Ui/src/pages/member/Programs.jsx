import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { workoutPlanService } from '../../services/workoutPlanService'
import { nutritionPlanService } from '../../services'
import './Programs.css'

// Modern Filled Icons
const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const NutritionIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.06 22.99h1.66c.84 0 1.53-.64 1.63-1.46L23 5.05l-5 2V1h-2v8l-5-2-1.66 16.47c-.1.82.59 1.52 1.41 1.52h1.66l.39-4h5.88l.38 4zM9.02 13H7V9h2V7H7V5H5v2H3v2h2v4H3v2h2v6h4v-6h2v-2z"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/>
  </svg>
)

const FlameIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
  </svg>
)

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

const TargetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z"/>
  </svg>
)

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
)

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
  </svg>
)

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
  </svg>
)

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
  </svg>
)

const AIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 10.12h-6.78l2.74-2.82c-2.73-2.7-7.15-2.8-9.88-.1-2.73 2.71-2.73 7.08 0 9.79s7.15 2.71 9.88 0C18.32 15.65 19 14.08 19 12.1h2c0 1.98-.88 4.55-2.64 6.29-3.51 3.48-9.21 3.48-12.72 0-3.5-3.47-3.53-9.11-.02-12.58s9.14-3.47 12.65 0L21 3v7.12zM12.5 8v4.25l3.5 2.08-.72 1.21L11 13V8h1.5z"/>
  </svg>
)

const PersonIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const HybridIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const ArchiveIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m20.54 5.23-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/>
  </svg>
)

const PendingIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-4-8c.79 0 1.5-.71 1.5-1.5S8.79 9 8 9s-1.5.71-1.5 1.5S7.21 12 8 12zm8 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm0 0c.79 0 1.5-.71 1.5-1.5S16.79 9 16 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5zm-4 0c.79 0 1.5-.71 1.5-1.5S12.79 9 12 9s-1.5.71-1.5 1.5.71 1.5 1.5 1.5z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const ScheduleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  </svg>
)

const gymImages = {
  workout: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&h=200&fit=crop',
  nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=200&fit=crop',
  hybrid: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=200&fit=crop',
  mobility: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=400&h=200&fit=crop'
}

function Programs() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('active')
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
        <div className="programs-loading">
          <div className="loading-spinner"></div>
          <p>Loading your programs...</p>
        </div>
      </DashboardLayout>
    )
  }

  // Combine all plans
  const allPlans = [
    ...workoutPlans.map(p => ({ ...p, type: 'workout' })),
    ...nutritionPlans.map(p => ({ ...p, type: 'nutrition' }))
  ]

  // Filter by tab
  const getFilteredPlans = () => {
    switch (activeTab) {
      case 'active':
        return allPlans.filter(p => p.isActive && !p.isPending)
      case 'pending':
        return allPlans.filter(p => p.isPending)
      case 'approved':
        return allPlans.filter(p => p.isApproved && !p.isActive)
      case 'archived':
        return allPlans.filter(p => !p.isActive && !p.isPending && !p.isApproved)
      default:
        return allPlans
    }
  }

  const filteredPlans = getFilteredPlans()
  const activePlansCount = allPlans.filter(p => p.isActive && !p.isPending).length
  const pendingPlansCount = allPlans.filter(p => p.isPending).length

  return (
    <DashboardLayout role="Member">
      <div className="programs-page">
        {/* Hero Section */}
        <div className="programs-hero">
          <div className="programs-hero-content">
            <h1>Your Training Hub</h1>
            <p>Manage your AI-generated and coach-assigned plans.</p>
            <div className="programs-hero-stats">
              <span className="programs-hero-stat">
                <DumbbellIcon />
                {workoutPlans.length} Workouts
              </span>
              <span className="programs-hero-stat">
                <NutritionIcon />
                {nutritionPlans.length} Nutrition
              </span>
            </div>
            <div className="programs-hero-actions">
              <button className="generate-ai-btn">
                <SparklesIcon />
                Generate AI Program
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="programs-tabs">
          <button 
            className={`programs-tab ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Active
            {activePlansCount > 0 && <span className="programs-tab-count">{activePlansCount}</span>}
          </button>
          <button 
            className={`programs-tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending Approval
            {pendingPlansCount > 0 && <span className="programs-tab-count pending">{pendingPlansCount}</span>}
          </button>
          <button 
            className={`programs-tab ${activeTab === 'approved' ? 'active' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            Approved
          </button>
          <button 
            className={`programs-tab ${activeTab === 'archived' ? 'active' : ''}`}
            onClick={() => setActiveTab('archived')}
          >
            Archived
          </button>
        </div>

        {/* Programs Grid */}
        <div className="programs-grid">
          {filteredPlans.length === 0 && activeTab === 'active' ? (
            <>
              {/* Empty State */}
              <div className="programs-empty">
                <DumbbellIcon />
                <h3>No active programs</h3>
                <p>Generate an AI program or ask your coach to create one for you!</p>
              </div>
            </>
          ) : filteredPlans.length === 0 ? (
            <div className="programs-empty">
              <ArchiveIcon />
              <h3>No {activeTab} programs</h3>
              <p>You don't have any {activeTab} programs at the moment.</p>
            </div>
          ) : (
            filteredPlans.map(plan => (
              <div 
                key={plan.planId || plan.id} 
                className={`program-card ${plan.isArchived ? 'archived' : ''}`}
              >
                {/* Card Image */}
                <div className="program-card-image">
                  <div 
                    className="program-card-image-bg"
                    style={{ backgroundImage: `url(${gymImages[plan.type] || gymImages.workout})` }}
                  />
                  <div className="program-card-image-overlay" />
                  
                  {/* Badges */}
                  <div className="program-card-badges">
                    <span className={`program-badge ${plan.type}`}>
                      {plan.type === 'workout' && <DumbbellIcon />}
                      {plan.type === 'nutrition' && <NutritionIcon />}
                      {plan.type === 'hybrid' && <HybridIcon />}
                      {plan.type === 'workout' ? 'Workout' : plan.type === 'nutrition' ? 'Diet Plan' : 'Hybrid'}
                    </span>
                    {plan.isPending && (
                      <span className="program-badge pending">
                        <PendingIcon />
                        Pending
                      </span>
                    )}
                    {plan.isApproved && !plan.isActive && (
                      <span className="program-badge approved">
                        <CheckCircleIcon />
                        Approved
                      </span>
                    )}
                  </div>
                  
                  {/* Meta */}
                  <div className="program-card-meta">
                    <p className="program-card-source">
                      {plan.isAIGenerated ? <AIIcon /> : <PersonIcon />}
                      {plan.isAIGenerated ? 'PulseAI' : (plan.coachName || 'Coach')}
                    </p>
                    <h3 className="program-card-title">{plan.name || plan.planName}</h3>
                  </div>
                </div>

                {/* Card Body */}
                <div className="program-card-body">
                  {/* Progress (for active plans) */}
                  {plan.isActive && !plan.isPending && (
                    <div className="program-progress">
                      <div className="program-progress-header">
                        <span className="program-progress-label">Progress</span>
                        <span className={`program-progress-value ${(plan.progressPercentage || 0) > 80 ? 'high' : ''}`}>
                          {plan.progressPercentage || 0}%
                        </span>
                      </div>
                      <div className="program-progress-bar">
                        <div 
                          className={`program-progress-fill ${(plan.progressPercentage || 0) > 80 ? 'high' : ''}`}
                          style={{ width: `${plan.progressPercentage || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Pending Alert */}
                  {plan.isPending && (
                    <div className="program-alert">
                      <p><strong>Action Required:</strong> Please review the plan details before accepting.</p>
                    </div>
                  )}

                  {/* Ready Status (for approved) */}
                  {plan.isApproved && !plan.isActive && (
                    <div className="program-ready-status">
                      <div className="program-ready-dot" />
                      <span className="program-ready-text">Ready to start</span>
                    </div>
                  )}

                  {/* Macro Stats for nutrition plans */}
                  {plan.type === 'nutrition' && !plan.isPending && (
                    <div className="program-macros">
                      <div className="program-macro-stat calories">
                        <div className="program-macro-value">{plan.targetCalories || 2200}</div>
                        <div className="program-macro-label">Calories</div>
                      </div>
                      <div className="program-macro-stat protein">
                        <div className="program-macro-value">{plan.proteinGrams || 150}g</div>
                        <div className="program-macro-label">Protein</div>
                      </div>
                      <div className="program-macro-stat carbs">
                        <div className="program-macro-value">{plan.carbsGrams || 220}g</div>
                        <div className="program-macro-label">Carbs</div>
                      </div>
                      <div className="program-macro-stat fat">
                        <div className="program-macro-value">{plan.fatGrams || 70}g</div>
                        <div className="program-macro-label">Fat</div>
                      </div>
                    </div>
                  )}

                  {/* Date Info */}
                  <div className="program-date">
                    <CalendarIcon />
                    <span>
                      {plan.isArchived ? 'Finished: ' : plan.isPending ? 'Created: ' : 'Started: '}
                      {plan.startDate ? new Date(plan.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="program-card-actions">
                    {plan.isPending ? (
                      <>
                        <button className="program-btn program-btn-review" onClick={() => handleViewPlan(plan)}>
                          Review Plan
                        </button>
                        <button className="program-btn-icon">
                          <ChatIcon />
                        </button>
                      </>
                    ) : plan.isApproved && !plan.isActive ? (
                      <button className="program-btn program-btn-start">
                        <PlayIcon />
                        Start Now
                      </button>
                    ) : (
                      <>
                        <button className="program-btn program-btn-primary" onClick={() => handleViewPlan(plan)}>
                          Details
                        </button>
                        <button className="program-btn-icon" title="Download PDF">
                          <DownloadIcon />
                        </button>
                        <button className="program-btn-icon" title="Share Link">
                          <ShareIcon />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Create New Card */}
          {activeTab === 'active' && (
            <div className="program-card-new">
              <div className="program-card-new-icon">
                <PlusIcon />
              </div>
              <h3>Create New Plan</h3>
              <p>Use AI to generate a custom workout or diet plan in seconds.</p>
            </div>
          )}
        </div>

        {/* Mobile FAB */}
        <button className="programs-fab">
          <SparklesIcon />
        </button>
      </div>

      {/* Plan Details Modal */}
      {selectedPlan && (
        <div className="programs-modal-overlay" onClick={closeModal}>
          <div className="programs-modal" onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`programs-modal-header ${selectedPlan.type}`}>
              <div className="programs-modal-header-content">
                {selectedPlan.type === 'workout' ? <DumbbellIcon /> : <NutritionIcon />}
                <h3>{selectedPlan.type === 'workout' ? 'Workout' : 'Nutrition'} Plan Details</h3>
              </div>
              <button className="programs-modal-close" onClick={closeModal}>
                <XIcon />
              </button>
            </div>

            {/* Modal Body */}
            <div className="programs-modal-body">
              <h4>{selectedPlan.name || selectedPlan.planName}</h4>
              <p>{selectedPlan.description || 'No description available'}</p>

              {selectedPlan.type === 'workout' && (
                <div className="programs-modal-info-grid">
                  <div className="programs-modal-info-row">
                    <span className="programs-modal-info-label">
                      <CalendarIcon /> Duration
                    </span>
                    <span className="programs-modal-info-value">{selectedPlan.duration || 4} weeks</span>
                  </div>
                  <div className="programs-modal-info-row">
                    <span className="programs-modal-info-label">
                      <FlameIcon /> Difficulty
                    </span>
                    <span className="programs-modal-info-value">{selectedPlan.difficulty || 'Intermediate'}</span>
                  </div>
                  <div className="programs-modal-info-row">
                    <span className="programs-modal-info-label">
                      <ClockIcon /> Days per Week
                    </span>
                    <span className="programs-modal-info-value">{selectedPlan.daysPerWeek || 3}</span>
                  </div>
                  <div className="programs-modal-info-row">
                    <span className="programs-modal-info-label">
                      <TargetIcon /> Progress
                    </span>
                    <span className="programs-modal-info-value" style={{ color: '#3B82F6' }}>{selectedPlan.progressPercentage || 0}%</span>
                  </div>
                </div>
              )}

              {selectedPlan.type === 'nutrition' && (
                <div className="programs-modal-info-grid">
                  <div className="programs-modal-info-row calories">
                    <span className="programs-modal-info-label">Daily Calories</span>
                    <span className="programs-modal-info-value">{selectedPlan.targetCalories || 2200} kcal</span>
                  </div>
                  <div className="programs-modal-info-row protein">
                    <span className="programs-modal-info-label">Protein</span>
                    <span className="programs-modal-info-value">{selectedPlan.proteinGrams || 150}g</span>
                  </div>
                  <div className="programs-modal-info-row carbs">
                    <span className="programs-modal-info-label">Carbohydrates</span>
                    <span className="programs-modal-info-value">{selectedPlan.carbsGrams || 220}g</span>
                  </div>
                  <div className="programs-modal-info-row fat">
                    <span className="programs-modal-info-label">Fat</span>
                    <span className="programs-modal-info-value">{selectedPlan.fatGrams || 70}g</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="programs-modal-footer">
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Programs
