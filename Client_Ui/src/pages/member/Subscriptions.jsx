import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { subscriptionService } from '../../services/subscriptionService'

// Icons
const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/>
  </svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

function Subscriptions() {
  const { user } = useAuth()
  const toast = useToast()
  const [plans, setPlans] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [user])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansData, subscriptionData] = await Promise.all([
        subscriptionService.getActivePlans().catch(() => null),
        subscriptionService.hasActiveSubscription(user.userId).catch(() => null)
      ])
      
      if (plansData) {
        setPlans(plansData)
      } else {
        // Fallback plans if API fails
        setPlans(defaultPlans)
      }
      
      setCurrentSubscription(subscriptionData)
    } catch (err) {
      console.error('Error fetching subscription data:', err)
      setPlans(defaultPlans)
    } finally {
      setLoading(false)
    }
  }

  const defaultPlans = [
    {
      planId: 1,
      name: 'Basic',
      price: 299,
      durationMonths: 1,
      features: [
        'Gym access (6AM - 10PM)',
        'Basic equipment',
        '5 tokens monthly',
        'Locker room access'
      ],
      notIncluded: [
        'Personal training',
        'Group classes',
        'AI coach access',
        'Nutrition plans'
      ]
    },
    {
      planId: 2,
      name: 'Premium',
      price: 499,
      durationMonths: 1,
      popular: true,
      features: [
        '24/7 Gym access',
        'All equipment',
        '25 tokens monthly',
        'Group classes',
        'Sauna & spa',
        '1 PT session/month'
      ],
      notIncluded: [
        'Unlimited AI coach',
        'Nutrition plans'
      ]
    },
    {
      planId: 3,
      name: 'Elite',
      price: 899,
      durationMonths: 1,
      features: [
        '24/7 Gym access',
        'All premium equipment',
        '100 tokens monthly',
        'Unlimited group classes',
        'Sauna, spa & pool',
        '4 PT sessions/month',
        'AI coach access',
        'Custom nutrition plans',
        'InBody analysis'
      ],
      notIncluded: []
    }
  ]

  const handleSubscribe = async () => {
    if (!selectedPlan) return
    
    setSubscribing(true)
    try {
      await subscriptionService.createSubscription({
        userId: user.userId,
        planId: selectedPlan.planId,
        startDate: new Date().toISOString()
      })
      
      toast.success(`Successfully subscribed to ${selectedPlan.name} plan!`)
      setShowModal(false)
      setSelectedPlan(null)
      fetchData()
    } catch (err) {
      console.error('Subscription error:', err)
      toast.error(err.response?.data?.message || 'Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(false)
    }
  }

  const displayPlans = plans.length > 0 ? plans : defaultPlans

  return (
    <DashboardLayout role="Member">
      {/* Hero Banner */}
      <div className="hero-banner" style={{
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '50%',
          height: '100%',
          backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          maskImage: 'linear-gradient(to left, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
        }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-title" style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CrownIcon style={{ width: 32, height: 32 }} />
            Subscription Plans
          </h1>
          <p className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Choose the perfect plan to achieve your fitness goals
          </p>
        </div>
        {currentSubscription && (
          <div style={{
            position: 'absolute',
            top: '1.5rem',
            right: '1.5rem',
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.75rem 1.25rem',
            borderRadius: '0.75rem',
            color: 'white'
          }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>Current Plan</span>
            <div style={{ fontWeight: 700 }}>{currentSubscription.planName || 'Active'}</div>
          </div>
        )}
      </div>

      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="card" style={{ marginBottom: '2rem', borderLeft: '4px solid #22c55e' }}>
          <div className="card-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 56,
                height: 56,
                borderRadius: '1rem',
                background: 'rgba(34, 197, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#22c55e'
              }}>
                <CheckIcon style={{ width: 28, height: 28 }} />
              </div>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Active Subscription</h3>
                <p style={{ color: 'var(--foreground-muted)' }}>
                  Your {currentSubscription.planName || 'subscription'} is active until {new Date(currentSubscription.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="badge badge-success" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>Active</span>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1' }} className="empty-state">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          displayPlans.map((plan) => (
            <div 
              key={plan.planId}
              className="pricing-card"
              style={{
                borderColor: plan.popular ? '#ff6b35' : 'var(--border)',
                position: 'relative'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(135deg, #ff6b35, #dc2626)',
                  color: 'white',
                  padding: '0.25rem 1rem',
                  borderRadius: '1rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <StarIcon style={{ width: 12, height: 12 }} />
                  MOST POPULAR
                </div>
              )}
              
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 className="pricing-title">{plan.name}</h3>
                <div className="pricing-price">
                  {plan.price}
                  <span> EGP/mo</span>
                </div>
              </div>

              <ul className="pricing-features">
                {(plan.features || []).map((feature, idx) => (
                  <li key={idx}>
                    <CheckIcon style={{ width: 16, height: 16, color: '#22c55e' }} />
                    <span>{feature}</span>
                  </li>
                ))}
                {(plan.notIncluded || []).map((feature, idx) => (
                  <li key={`not-${idx}`} style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}>
                    <XIcon style={{ width: 16, height: 16, color: '#ef4444' }} />
                    <span style={{ textDecoration: 'line-through' }}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => {
                  setSelectedPlan(plan)
                  setShowModal(true)
                }}
                style={{ marginTop: '1rem' }}
              >
                {currentSubscription?.planId === plan.planId ? 'Current Plan' : 'Subscribe Now'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* Features Comparison */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Why Subscribe?</h3>
        </div>
        <div className="card-content">
          <div className="grid-cols-4" style={{ gap: '1.5rem' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(255, 107, 53, 0.1)', 
                color: '#ff6b35',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <DumbbellIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Premium Equipment</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>Access to state-of-the-art fitness equipment</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(59, 130, 246, 0.1)', 
                color: '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <UsersIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Group Classes</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>Join yoga, HIIT, spinning & more</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(139, 92, 246, 0.1)', 
                color: '#8b5cf6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <ZapIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>AI Coach</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>Get personalized fitness guidance</p>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{ 
                width: 56, height: 56, borderRadius: '1rem', 
                background: 'rgba(34, 197, 94, 0.1)', 
                color: '#22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem'
              }}>
                <CalendarIcon />
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Flexible Access</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)' }}>Train anytime with 24/7 access</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscribe Modal */}
      {showModal && selectedPlan && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setSelectedPlan(null) }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}>
              <h3 className="modal-title" style={{ color: 'white' }}>
                <CrownIcon style={{ marginRight: '0.5rem' }} />
                Confirm Subscription
              </h3>
              <button 
                className="modal-close"
                onClick={() => { setShowModal(false); setSelectedPlan(null) }}
                style={{ color: 'white' }}
              >
                <XIcon />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                background: 'var(--background-secondary)', 
                borderRadius: '1rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--foreground-muted)', marginBottom: '0.5rem' }}>
                  {selectedPlan.name} Plan
                </div>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>
                  {selectedPlan.price}
                  <span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--foreground-muted)' }}> EGP/mo</span>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>What's included:</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {(selectedPlan.features || []).slice(0, 5).map((feature, idx) => (
                    <li key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0', color: 'var(--foreground-muted)' }}>
                      <CheckIcon style={{ width: 16, height: 16, color: '#22c55e' }} />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <p style={{ fontSize: '0.75rem', color: 'var(--foreground-muted)', textAlign: 'center' }}>
                Your subscription will start immediately and renew monthly.
              </p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-secondary"
                onClick={() => { setShowModal(false); setSelectedPlan(null) }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16 }}></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCardIcon style={{ width: 18, height: 18 }} />
                    Subscribe for {selectedPlan.price} EGP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default Subscriptions
