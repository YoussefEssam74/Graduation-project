import { useState, useEffect } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { useToast } from '../../contexts/ToastContext'
import { subscriptionService } from '../../services/subscriptionService'
import './Subscriptions.css'

// Modern Filled Icons
const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5zm14 3c0 .6-.4 1-1 1H6c-.6 0-1-.4-1-1v-1h14v1z"/>
  </svg>
)

const CheckCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
  </svg>
)

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
)

const CancelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
  </svg>
)

const LayersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m11.99 18.54-7.37-5.73L3 14.07l9 7 9-7-1.63-1.27-7.38 5.74zM12 16l7.36-5.73L21 9l-9-7-9 7 1.63 1.27L12 16z"/>
  </svg>
)

const GroupsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12.75c1.63 0 3.07.39 4.24.9 1.08.48 1.76 1.56 1.76 2.73V18H6v-1.61c0-1.18.68-2.26 1.76-2.73 1.17-.52 2.61-.91 4.24-.91zM4 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm1.13 1.1c-.37-.06-.74-.1-1.13-.1-.99 0-1.93.21-2.78.58C.48 14.9 0 15.62 0 16.43V18h4.5v-1.61c0-.83.23-1.61.63-2.29zM20 13c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4 3.43c0-.81-.48-1.53-1.22-1.85-.85-.37-1.79-.58-2.78-.58-.39 0-.76.04-1.13.1.4.68.63 1.46.63 2.29V18H24v-1.57zM12 6c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3z"/>
  </svg>
)

const MoneyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
  </svg>
)

const AIIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 10c-2.48 0-4.5 2.02-4.5 4.5s2.02 4.5 4.5 4.5 4.5-2.02 4.5-4.5-2.02-4.5-4.5-4.5zm.5 6h-1v1h-1v-1h-1v-1h1v-1h1v1h1v1zM10 3H3v7h7V3zm-1 6H4V4h5v5zm1 4H3v7h7v-7zm-1 6H4v-5h5v5zM20 3h-7v7h7V3zm-1 6h-5V4h5v5z"/>
  </svg>
)

const TrendingUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="m16 6 2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/>
  </svg>
)

const SortIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/>
  </svg>
)

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
)

const DeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
)

const MinusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 13H5v-2h14v2z"/>
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
  </svg>
)

const ExpandIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>
  </svg>
)

const CreditCardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
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

  // Comparison table data
  const comparisonFeatures = [
    { name: 'Gym Access Hours', basic: '6 AM - 10 PM', pro: '24/7', elite: '24/7 + VIP' },
    { name: 'Monthly Tokens', basic: '10', pro: '25', elite: '100' },
    { name: 'Personal Training', basic: false, pro: '1/month', elite: '4/month' },
    { name: 'Group Classes', basic: 'Limited', pro: 'Unlimited', elite: 'Unlimited + Priority' },
    { name: 'AI Coach Access', basic: false, pro: true, elite: true },
    { name: 'Nutrition Plans', basic: false, pro: false, elite: true },
    { name: 'InBody Analysis', basic: false, pro: '1/month', elite: 'Unlimited' },
    { name: 'Spa & Sauna', basic: false, pro: true, elite: true },
    { name: 'Guest Passes', basic: '0', pro: '2/month', elite: '5/month' }
  ]

  const getTierClass = (planName) => {
    const name = planName?.toLowerCase() || ''
    if (name.includes('elite') || name.includes('premium')) return 'elite'
    if (name.includes('pro') || name.includes('athlete')) return 'pro'
    return 'basic'
  }

  return (
    <DashboardLayout role="Member">
      <div className="subscriptions-page">
        {/* Hero Section */}
        <div className="subscriptions-hero">
          <div className="subscriptions-hero-content">
            <div className="subscriptions-hero-badge">
              <LayersIcon />
              <span>Membership Plans</span>
            </div>
            <h1 className="subscriptions-hero-title">Subscription Plans</h1>
            <p className="subscriptions-hero-subtitle">
              Choose the perfect membership tier to unlock your fitness potential
            </p>
          </div>
        </div>

        {/* Current Subscription Card */}
        {currentSubscription && (
          <div className="subscriptions-current-card">
            <div className="subscriptions-current-icon">
              <CheckCircleIcon />
            </div>
            <div className="subscriptions-current-info">
              <h3>Active Subscription</h3>
              <p>Your {currentSubscription.planName || 'subscription'} is active until {new Date(currentSubscription.endDate).toLocaleDateString()}</p>
            </div>
            <div className="subscriptions-current-badge">
              <span className="status-dot"></span>
              Active
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="subscriptions-stats-grid">
          <div className="subscriptions-stat-card">
            <div className="subscriptions-stat-icon plans">
              <LayersIcon />
            </div>
            <div className="subscriptions-stat-info">
              <span className="subscriptions-stat-value">{displayPlans.length}</span>
              <span className="subscriptions-stat-label">Available Plans</span>
            </div>
          </div>
          <div className="subscriptions-stat-card">
            <div className="subscriptions-stat-icon subscribers">
              <GroupsIcon />
            </div>
            <div className="subscriptions-stat-info">
              <span className="subscriptions-stat-value">1,847</span>
              <span className="subscriptions-stat-label">Total Subscribers</span>
            </div>
          </div>
          <div className="subscriptions-stat-card">
            <div className="subscriptions-stat-icon revenue">
              <MoneyIcon />
            </div>
            <div className="subscriptions-stat-info">
              <span className="subscriptions-stat-value">350K</span>
              <span className="subscriptions-stat-label">Monthly Revenue</span>
            </div>
          </div>
          <div className="subscriptions-stat-card">
            <div className="subscriptions-stat-icon ai">
              <AIIcon />
            </div>
            <div className="subscriptions-stat-info">
              <span className="subscriptions-stat-value">89%</span>
              <span className="subscriptions-stat-label">AI Usage Rate</span>
            </div>
          </div>
        </div>

        {/* Section Title */}
        <div className="subscriptions-section-title">
          <h2>Membership Tiers</h2>
          <p>Select the plan that best fits your fitness journey</p>
        </div>

        {/* Plans Grid */}
        <div className="subscriptions-plans-grid">
          {loading ? (
            <div className="subscriptions-loading">
              <div className="loading-spinner"></div>
              <p>Loading plans...</p>
            </div>
          ) : (
            displayPlans.map((plan, index) => {
              const tierClass = getTierClass(plan.name)
              const isPopular = plan.popular || index === 1
              
              return (
                <div 
                  key={plan.planId}
                  className={`subscriptions-plan-card ${tierClass} ${isPopular ? 'popular' : ''}`}
                >
                  {isPopular && (
                    <div className="subscriptions-popular-badge">
                      <TrendingUpIcon />
                      Most Popular
                    </div>
                  )}
                  
                  <div className="subscriptions-plan-header">
                    <div className={`subscriptions-tier-badge ${tierClass}`}>
                      {tierClass === 'elite' ? 'Elite Tier' : tierClass === 'pro' ? 'Pro Tier' : 'Basic Tier'}
                    </div>
                    <div className="subscriptions-status-indicator">
                      <span className="subscriptions-status-dot active"></span>
                      Active
                    </div>
                  </div>
                  
                  <div className="subscriptions-plan-icon">
                    <CrownIcon />
                  </div>
                  
                  <h3 className="subscriptions-plan-name">{plan.name}</h3>
                  <p className="subscriptions-plan-description">
                    {tierClass === 'elite' ? 'Complete fitness experience with premium perks' : 
                     tierClass === 'pro' ? 'Enhanced features for serious athletes' : 
                     'Essential access to start your journey'}
                  </p>
                  
                  <div className="subscriptions-plan-price">
                    <span className="subscriptions-price-amount">{plan.price}</span>
                    <span className="subscriptions-price-period">EGP/month</span>
                  </div>
                  
                  <ul className="subscriptions-plan-features">
                    {(plan.features || []).map((feature, idx) => (
                      <li key={idx} className="subscriptions-feature included">
                        <CheckCircleIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                    {(plan.notIncluded || []).map((feature, idx) => (
                      <li key={`not-${idx}`} className="subscriptions-feature excluded">
                        <CancelIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="subscriptions-plan-actions">
                    <button 
                      className={`subscriptions-btn-subscribe ${tierClass}`}
                      onClick={() => {
                        setSelectedPlan(plan)
                        setShowModal(true)
                      }}
                    >
                      {currentSubscription?.planId === plan.planId ? 'Current Plan' : 'Subscribe Now'}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Bottom Grid: Comparison + Quick Assign */}
        <div className="subscriptions-bottom-grid">
          {/* Feature Comparison Table */}
          <div className="subscriptions-comparison-card">
            <div className="subscriptions-comparison-header">
              <h3>Feature Comparison</h3>
              <p>Compare what's included in each tier</p>
            </div>
            <div className="subscriptions-comparison-table-wrapper">
              <table className="subscriptions-comparison-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th className="tier-basic">Basic</th>
                    <th className="tier-pro">Pro</th>
                    <th className="tier-elite">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr key={idx}>
                      <td className="feature-name">{feature.name}</td>
                      <td className="feature-value">
                        {feature.basic === true ? (
                          <span className="feature-check"><CheckIcon /></span>
                        ) : feature.basic === false ? (
                          <span className="feature-x"><MinusIcon /></span>
                        ) : (
                          <span className="feature-text">{feature.basic}</span>
                        )}
                      </td>
                      <td className="feature-value">
                        {feature.pro === true ? (
                          <span className="feature-check"><CheckIcon /></span>
                        ) : feature.pro === false ? (
                          <span className="feature-x"><MinusIcon /></span>
                        ) : (
                          <span className="feature-text">{feature.pro}</span>
                        )}
                      </td>
                      <td className="feature-value">
                        {feature.elite === true ? (
                          <span className="feature-check"><CheckIcon /></span>
                        ) : feature.elite === false ? (
                          <span className="feature-x"><MinusIcon /></span>
                        ) : (
                          <span className="feature-text">{feature.elite}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Assign Card */}
          <div className="subscriptions-assign-card">
            <div className="subscriptions-assign-header">
              <h3>Quick Upgrade</h3>
              <p>Upgrade your membership tier</p>
            </div>
            <div className="subscriptions-assign-form">
              <div className="subscriptions-form-group">
                <label>Current Plan</label>
                <div className="subscriptions-input-wrapper">
                  <CrownIcon />
                  <input 
                    type="text" 
                    value={currentSubscription?.planName || 'No active plan'} 
                    disabled 
                  />
                </div>
              </div>
              <div className="subscriptions-form-group">
                <label>Upgrade To</label>
                <div className="subscriptions-select-wrapper">
                  <LayersIcon />
                  <select>
                    <option value="">Select a plan...</option>
                    {displayPlans.map(plan => (
                      <option key={plan.planId} value={plan.planId}>
                        {plan.name} - {plan.price} EGP/month
                      </option>
                    ))}
                  </select>
                  <ExpandIcon />
                </div>
              </div>
              <button className="subscriptions-upgrade-btn">
                <TrendingUpIcon />
                Upgrade Plan
              </button>
            </div>
          </div>
        </div>

        {/* Subscribe Modal */}
        {showModal && selectedPlan && (
          <div className="subscriptions-modal-overlay" onClick={() => { setShowModal(false); setSelectedPlan(null) }}>
            <div className="subscriptions-modal" onClick={e => e.stopPropagation()}>
              <div className="subscriptions-modal-header">
                <div className="subscriptions-modal-icon">
                  <CrownIcon />
                </div>
                <h3>Confirm Subscription</h3>
                <button 
                  className="subscriptions-modal-close"
                  onClick={() => { setShowModal(false); setSelectedPlan(null) }}
                >
                  <XIcon />
                </button>
              </div>
              
              <div className="subscriptions-modal-body">
                <div className="subscriptions-modal-plan-info">
                  <div className={`subscriptions-modal-tier ${getTierClass(selectedPlan.name)}`}>
                    {selectedPlan.name} Plan
                  </div>
                  <div className="subscriptions-modal-price">
                    <span className="amount">{selectedPlan.price}</span>
                    <span className="period">EGP/month</span>
                  </div>
                </div>

                <div className="subscriptions-modal-features">
                  <h4>What's included:</h4>
                  <ul>
                    {(selectedPlan.features || []).slice(0, 6).map((feature, idx) => (
                      <li key={idx}>
                        <CheckCircleIcon />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="subscriptions-modal-note">
                  Your subscription will start immediately and renew monthly.
                </p>
              </div>
              
              <div className="subscriptions-modal-footer">
                <button 
                  className="subscriptions-modal-btn cancel"
                  onClick={() => { setShowModal(false); setSelectedPlan(null) }}
                >
                  Cancel
                </button>
                <button 
                  className="subscriptions-modal-btn confirm"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                >
                  {subscribing ? (
                    <>
                      <div className="loading-spinner small"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCardIcon />
                      Subscribe for {selectedPlan.price} EGP
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Subscriptions
