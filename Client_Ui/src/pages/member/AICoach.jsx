import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { aiService } from '../../services/aiService'
import { useToast } from '../../contexts/ToastContext'

// Icons
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
)

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
)

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

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

function AICoach() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! 👋 I'm your AI fitness coach. I can help you with:

• **Personalized workout plans**
• **Nutrition advice**
• **Exercise form guidance**
• **Recovery tips**

What would you like to work on today?`
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Workout Plan Generator State
  const [workoutForm, setWorkoutForm] = useState({
    fitnessGoal: 'muscle_gain',
    experienceLevel: 'intermediate',
    daysPerWeek: 4,
    equipmentAccess: 'full_gym',
    focusAreas: [],
    injuries: ''
  })
  const [generatedWorkoutPlan, setGeneratedWorkoutPlan] = useState(null)
  const [generatingWorkout, setGeneratingWorkout] = useState(false)

  // Nutrition Plan Generator State
  const [nutritionForm, setNutritionForm] = useState({
    goal: 'muscle_gain',
    dietaryRestrictions: [],
    mealsPerDay: 4,
    currentWeight: '',
    targetWeight: '',
    allergies: ''
  })
  const [generatedNutritionPlan, setGeneratedNutritionPlan] = useState(null)
  const [generatingNutrition, setGeneratingNutrition] = useState(false)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!inputText.trim() || loading) return

    const userMessage = inputText.trim()
    setInputText('')
    setMessages(prev => [...prev, { type: 'user', text: userMessage }])
    setLoading(true)

    try {
      const response = await aiService.geminiChat({
        userId: user.userId,
        message: userMessage
      })

      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: response.response || response.message || 'Sorry, I could not process your request.'
      }])
    } catch (err) {
      console.error('AI Chat error:', err)
      setMessages(prev => [...prev, { 
        type: 'ai', 
        text: 'Sorry, I encountered an error. Please try again later.'
      }])
      toast.error('Failed to get AI response')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Generate Workout Plan
  const handleGenerateWorkoutPlan = async () => {
    setGeneratingWorkout(true)
    try {
      const response = await aiService.generateWorkoutPlan({
        userId: user.userId,
        ...workoutForm
      })
      setGeneratedWorkoutPlan(response)
      toast.success('Workout plan generated! (50 tokens used)')
    } catch (err) {
      console.error('Error generating workout plan:', err)
      toast.error(err.response?.data?.message || 'Failed to generate workout plan. Make sure you have enough tokens.')
    } finally {
      setGeneratingWorkout(false)
    }
  }

  // Generate Nutrition Plan
  const handleGenerateNutritionPlan = async () => {
    setGeneratingNutrition(true)
    try {
      const response = await aiService.generateNutritionPlan({
        userId: user.userId,
        ...nutritionForm
      })
      setGeneratedNutritionPlan(response)
      toast.success('Nutrition plan generated! (50 tokens used)')
    } catch (err) {
      console.error('Error generating nutrition plan:', err)
      toast.error(err.response?.data?.message || 'Failed to generate nutrition plan. Make sure you have enough tokens.')
    } finally {
      setGeneratingNutrition(false)
    }
  }

  const quickPrompts = [
    { icon: "💪", text: "Create a workout plan for muscle gain" },
    { icon: "🍎", text: "What should I eat before workout?" },
    { icon: "🏋️", text: "How to improve my squat form?" },
    { icon: "🩹", text: "Suggest exercises for back pain" }
  ]

  const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/^• /gm, '<span class="bullet">•</span> ')
    formatted = formatted.replace(/\n/g, '<br>')
    return formatted
  }

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
          backgroundImage: 'url(https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=800)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.2,
          maskImage: 'linear-gradient(to left, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to left, black, transparent)'
        }} />
        <div className="hero-content" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <BrainIcon style={{ width: 32, height: 32 }} />
            <h1 className="hero-title" style={{ color: 'white', margin: 0 }}>AI Fitness Coach</h1>
          </div>
          <p className="hero-subtitle" style={{ color: 'rgba(255,255,255,0.9)' }}>
            Get personalized workout plans, nutrition advice, and fitness guidance
          </p>
        </div>
        <div style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'white',
            fontSize: '0.875rem'
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }}></span>
            Online
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            padding: '0.5rem 1rem',
            borderRadius: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'white',
            fontSize: '0.875rem'
          }}>
            <ZapIcon style={{ width: 14, height: 14 }} />
            {user?.tokenBalance || 0} tokens
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button 
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <SparklesIcon style={{ width: 16, height: 16, marginRight: '0.5rem', display: 'inline' }} />
          AI Chat
        </button>
        <button 
          className={`tab ${activeTab === 'workout' ? 'active' : ''}`}
          onClick={() => setActiveTab('workout')}
        >
          <DumbbellIcon style={{ width: 16, height: 16, marginRight: '0.5rem', display: 'inline' }} />
          Workout Plan
        </button>
        <button 
          className={`tab ${activeTab === 'nutrition' ? 'active' : ''}`}
          onClick={() => setActiveTab('nutrition')}
        >
          <AppleIcon style={{ width: 16, height: 16, marginRight: '0.5rem', display: 'inline' }} />
          Nutrition Plan
        </button>
      </div>

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 380px)', minHeight: '400px' }}>
          {/* Quick Prompts */}
          <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {quickPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  className="btn btn-outline btn-sm"
                  onClick={() => setInputText(prompt.text)}
                  disabled={loading}
                >
                  <span>{prompt.icon}</span>
                  <span>{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className="chat-message"
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start',
                  flexDirection: msg.type === 'user' ? 'row-reverse' : 'row',
                  maxWidth: '85%',
                  marginLeft: msg.type === 'user' ? 'auto' : 0
                }}
              >
                <div className="chat-avatar" style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: msg.type === 'ai' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'var(--background-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: msg.type === 'ai' ? 'white' : 'var(--foreground-muted)'
                }}>
                  {msg.type === 'ai' ? <SparklesIcon style={{ width: 18, height: 18 }} /> : <UserIcon style={{ width: 18, height: 18 }} />}
                </div>
                <div className="chat-bubble" style={{
                  background: msg.type === 'ai' ? 'var(--background-secondary)' : 'var(--primary)',
                  color: msg.type === 'ai' ? 'var(--foreground)' : 'white',
                  padding: '0.875rem 1.25rem',
                  borderRadius: '1rem',
                  borderTopLeftRadius: msg.type === 'ai' ? '0.25rem' : '1rem',
                  borderTopRightRadius: msg.type === 'user' ? '0.25rem' : '1rem',
                }}>
                  <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white'
                }}>
                  <SparklesIcon style={{ width: 18, height: 18 }} />
                </div>
                <div style={{
                  background: 'var(--background-secondary)',
                  padding: '1rem 1.25rem',
                  borderRadius: '1rem',
                  borderTopLeftRadius: '0.25rem'
                }}>
                  <div className="loading-spinner" style={{ width: 20, height: 20 }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-container" style={{ borderTop: '1px solid var(--border)', background: 'var(--background-secondary)' }}>
            <input
              type="text"
              className="chat-input input-field"
              placeholder="Ask me anything about fitness..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button 
              className="btn btn-primary"
              onClick={handleSend}
              disabled={!inputText.trim() || loading}
            >
              <SendIcon style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <div style={{ padding: '0.5rem 1.5rem', background: 'var(--background-secondary)', borderTop: '1px solid var(--border)', fontSize: '0.75rem', color: 'var(--foreground-muted)', textAlign: 'center' }}>
            <ZapIcon style={{ width: 12, height: 12, display: 'inline', verticalAlign: 'middle', marginRight: '0.25rem' }} />
            1 token per message
          </div>
        </div>
      )}

      {/* Workout Plan Tab */}
      {activeTab === 'workout' && (
        <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Form */}
          <div className="card">
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)' }}>
              <h3 className="card-title" style={{ color: 'white' }}>
                <DumbbellIcon style={{ marginRight: '0.5rem' }} />
                Generate Workout Plan
              </h3>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <ZapIcon style={{ width: 12, height: 12, marginRight: '0.25rem' }} />
                50 tokens
              </span>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label">Fitness Goal</label>
                <select 
                  className="input-field"
                  value={workoutForm.fitnessGoal}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, fitnessGoal: e.target.value })}
                >
                  <option value="muscle_gain">Muscle Gain</option>
                  <option value="fat_loss">Fat Loss</option>
                  <option value="strength">Strength Training</option>
                  <option value="endurance">Endurance</option>
                  <option value="general_fitness">General Fitness</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select 
                  className="input-field"
                  value={workoutForm.experienceLevel}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, experienceLevel: e.target.value })}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Days Per Week</label>
                <select 
                  className="input-field"
                  value={workoutForm.daysPerWeek}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, daysPerWeek: parseInt(e.target.value) })}
                >
                  <option value="3">3 days</option>
                  <option value="4">4 days</option>
                  <option value="5">5 days</option>
                  <option value="6">6 days</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Equipment Access</label>
                <select 
                  className="input-field"
                  value={workoutForm.equipmentAccess}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, equipmentAccess: e.target.value })}
                >
                  <option value="full_gym">Full Gym</option>
                  <option value="home_basic">Home (Basic)</option>
                  <option value="home_dumbbells">Home (Dumbbells)</option>
                  <option value="bodyweight">Bodyweight Only</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Any Injuries? (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., lower back pain, knee injury"
                  value={workoutForm.injuries}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, injuries: e.target.value })}
                />
              </div>

              <button 
                className="btn btn-primary w-full"
                onClick={handleGenerateWorkoutPlan}
                disabled={generatingWorkout}
                style={{ marginTop: '1rem' }}
              >
                {generatingWorkout ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16 }}></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon style={{ width: 18, height: 18 }} />
                    Generate Workout Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Plan */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Workout Plan</h3>
            </div>
            <div className="card-content">
              {generatedWorkoutPlan ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {typeof generatedWorkoutPlan === 'string' 
                    ? generatedWorkoutPlan 
                    : generatedWorkoutPlan.plan || generatedWorkoutPlan.response || JSON.stringify(generatedWorkoutPlan, null, 2)}
                </div>
              ) : (
                <div className="empty-state">
                  <DumbbellIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                  <p className="empty-state-title">No workout plan yet</p>
                  <p className="empty-state-description">Fill out the form and click generate to create your personalized workout plan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Nutrition Plan Tab */}
      {activeTab === 'nutrition' && (
        <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
          {/* Form */}
          <div className="card">
            <div className="card-header" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
              <h3 className="card-title" style={{ color: 'white' }}>
                <AppleIcon style={{ marginRight: '0.5rem' }} />
                Generate Nutrition Plan
              </h3>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <ZapIcon style={{ width: 12, height: 12, marginRight: '0.25rem' }} />
                50 tokens
              </span>
            </div>
            <div className="card-content">
              <div className="form-group">
                <label className="form-label">Goal</label>
                <select 
                  className="input-field"
                  value={nutritionForm.goal}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, goal: e.target.value })}
                >
                  <option value="muscle_gain">Muscle Gain (Bulk)</option>
                  <option value="fat_loss">Fat Loss (Cut)</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="lean_bulk">Lean Bulk</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Meals Per Day</label>
                <select 
                  className="input-field"
                  value={nutritionForm.mealsPerDay}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, mealsPerDay: parseInt(e.target.value) })}
                >
                  <option value="3">3 meals</option>
                  <option value="4">4 meals</option>
                  <option value="5">5 meals</option>
                  <option value="6">6 meals</option>
                </select>
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Current Weight (kg)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g., 75"
                    value={nutritionForm.currentWeight}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, currentWeight: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Target Weight (kg)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="e.g., 80"
                    value={nutritionForm.targetWeight}
                    onChange={(e) => setNutritionForm({ ...nutritionForm, targetWeight: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dietary Restrictions</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Dairy-Free'].map(diet => (
                    <button
                      key={diet}
                      type="button"
                      className={`btn btn-sm ${nutritionForm.dietaryRestrictions.includes(diet) ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => {
                        const newRestrictions = nutritionForm.dietaryRestrictions.includes(diet)
                          ? nutritionForm.dietaryRestrictions.filter(d => d !== diet)
                          : [...nutritionForm.dietaryRestrictions, diet]
                        setNutritionForm({ ...nutritionForm, dietaryRestrictions: newRestrictions })
                      }}
                    >
                      {nutritionForm.dietaryRestrictions.includes(diet) && <CheckIcon style={{ width: 12, height: 12 }} />}
                      {diet}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Food Allergies (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., nuts, shellfish"
                  value={nutritionForm.allergies}
                  onChange={(e) => setNutritionForm({ ...nutritionForm, allergies: e.target.value })}
                />
              </div>

              <button 
                className="btn btn-success w-full"
                onClick={handleGenerateNutritionPlan}
                disabled={generatingNutrition}
                style={{ marginTop: '1rem' }}
              >
                {generatingNutrition ? (
                  <>
                    <div className="loading-spinner" style={{ width: 16, height: 16 }}></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <SparklesIcon style={{ width: 18, height: 18 }} />
                    Generate Nutrition Plan
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Plan */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Your Nutrition Plan</h3>
            </div>
            <div className="card-content">
              {generatedNutritionPlan ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                  {typeof generatedNutritionPlan === 'string' 
                    ? generatedNutritionPlan 
                    : generatedNutritionPlan.plan || generatedNutritionPlan.response || JSON.stringify(generatedNutritionPlan, null, 2)}
                </div>
              ) : (
                <div className="empty-state">
                  <AppleIcon style={{ width: 48, height: 48, opacity: 0.3 }} />
                  <p className="empty-state-title">No nutrition plan yet</p>
                  <p className="empty-state-description">Fill out the form and click generate to create your personalized nutrition plan</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

export default AICoach
