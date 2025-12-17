import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '../../components/layouts/DashboardLayout'
import { useAuth } from '../../contexts/AuthContext'
import { aiService } from '../../services/aiService'
import { useToast } from '../../contexts/ToastContext'
import './AICoach.css'

// Modern Filled Icons
const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.24 2 7 4.24 7 7v.5C6.2 7.18 5.13 7 4 7c-2.21 0-4 1.79-4 4s1.79 4 4 4c.39 0 .76-.06 1.12-.15C5.04 15.28 5 15.63 5 16c0 2.21 1.79 4 4 4 1.18 0 2.23-.51 2.97-1.32C12 18.45 12 18.22 12 18v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .22 0 .45.03.68C14.77 19.49 15.82 20 17 20c2.21 0 4-1.79 4-4 0-.37-.04-.72-.12-1.05.36.09.73.15 1.12.15 2.21 0 4-1.79 4-4s-1.79-4-4-4c-1.13 0-2.2.18-3 .5V7c0-2.76-2.24-5-5-5zm-1 5c.55 0 1 .45 1 1v2c0 .55-.45 1-1 1s-1-.45-1-1V8c0-.55.45-1 1-1z"/>
  </svg>
)

const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </svg>
)

const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
)

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1l2.25 6.75L21 10l-6.75 2.25L12 19l-2.25-6.75L3 10l6.75-2.25L12 1zM5 3v4M19 17v4M3 5h4M17 19h4"/>
  </svg>
)

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
  </svg>
)

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
  </svg>
)

const AppleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
  </svg>
)

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
  </svg>
)

const ChartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
  </svg>
)

const HistoryIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
  </svg>
)

const SettingsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14 12.94c.04-.31.06-.63.06-.94 0-.31-.02-.63-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.04.31-.06.63-.06.94s.02.63.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
  </svg>
)

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
  </svg>
)

const AttachIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z"/>
  </svg>
)

const CopyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
  </svg>
)

const ThumbUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/>
  </svg>
)

const ThumbDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z"/>
  </svg>
)

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="12" r="3.2"/>
    <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
  </svg>
)

const WaterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8z"/>
  </svg>
)

const MoreIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
  </svg>
)

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
  </svg>
)

function AICoach() {
  const { user } = useAuth()
  const toast = useToast()
  const [activeTab, setActiveTab] = useState('chat')
  const [messages, setMessages] = useState([
    {
      type: 'ai',
      text: `Hey ${user?.name?.split(' ')[0] || 'there'}! 👋 Great to see you! Based on your recent activity, I've designed a **progressive chest workout** that builds on last week's gains.`,
      time: new Date(),
      workout: {
        title: "Progressive Chest Day",
        duration: "~45 min",
        exercises: [
          { name: "Incline Dumbbell Press", sets: "4 × 8-10 reps", weight: "+5lbs from last week", isNew: false },
          { name: "Cable Flyes (High-to-Low)", sets: "3 × 12-15 reps", isNew: true },
          { name: "Push-ups to Failure", sets: "3 sets", isNew: false }
        ]
      }
    }
  ])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Chat History
  const [chatHistory] = useState([
    { id: 1, title: "Upper Body Split Review", date: "Today" },
    { id: 2, title: "Nutrition Macro Adjustment", date: "Yesterday" },
    { id: 3, title: "Recovery Protocol", date: "2 days ago" }
  ])

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

  // Handle suggestion clicks
  const handleSuggestion = (text) => {
    setInputText(text)
  }

  // Suggestions
  const suggestions = [
    { icon: <CameraIcon style={{ width: 14, height: 14 }} />, text: "Analyze Meal Photo", color: "blue" },
    { icon: <DumbbellIcon style={{ width: 14, height: 14 }} />, text: "Post-Workout Stretch", color: "orange" },
    { icon: <WaterIcon style={{ width: 14, height: 14 }} />, text: "Log Hydration", color: "green" }
  ]

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

  const formatMessage = (text) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    formatted = formatted.replace(/^• /gm, '<span class="bullet">•</span> ')
    formatted = formatted.replace(/\n/g, '<br>')
    return formatted
  }

  const getUserInitials = () => {
    if (!user?.name) return 'U'
    const names = user.name.split(' ')
    return names.length >= 2 
      ? `${names[0][0]}${names[1][0]}`.toUpperCase()
      : names[0][0].toUpperCase()
  }

  return (
    <DashboardLayout role="Member">
      <div className="ai-coach-page">
        <div className="ai-coach-layout">
          {/* Sidebar */}
          <aside className="ai-coach-sidebar">
            {/* Logo */}
            <div className="ai-coach-logo">
              <div className="ai-coach-logo-icon">
                <BrainIcon style={{ width: 20, height: 20 }} />
              </div>
              <div className="ai-coach-logo-text">
                <h1>PulseCoach</h1>
                <p>AI Fitness Assistant</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="ai-coach-nav">
              <div className="ai-coach-nav-section">
                <div className="ai-coach-nav-label">Menu</div>
                <button 
                  className={`ai-coach-nav-item ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                >
                  <ChatIcon />
                  AI Coach Chat
                </button>
                <button 
                  className={`ai-coach-nav-item ${activeTab === 'workout' ? 'active' : ''}`}
                  onClick={() => setActiveTab('workout')}
                >
                  <DumbbellIcon />
                  Workouts
                </button>
                <button 
                  className={`ai-coach-nav-item ${activeTab === 'nutrition' ? 'active' : ''}`}
                  onClick={() => setActiveTab('nutrition')}
                >
                  <AppleIcon />
                  Nutrition
                </button>
                <button className="ai-coach-nav-item">
                  <ChartIcon />
                  Progress
                </button>
              </div>

              {/* Chat History */}
              <div className="ai-coach-nav-section">
                <div className="ai-coach-nav-label">Chat History</div>
                {chatHistory.map(chat => (
                  <div key={chat.id} className="ai-coach-history-item">
                    <HistoryIcon />
                    <div>
                      <h4>{chat.title}</h4>
                      <p>{chat.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </nav>

            {/* User Profile */}
            <div className="ai-coach-user-profile">
              <div className="ai-coach-user-avatar">
                {getUserInitials()}
              </div>
              <div className="ai-coach-user-info">
                <h3>{user?.name || 'Member'}</h3>
                <p>Premium Member</p>
              </div>
              <button className="ai-coach-settings-btn">
                <SettingsIcon style={{ width: 18, height: 18 }} />
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="ai-coach-main">
            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <>
                {/* Header */}
                <header className="ai-coach-header">
                  <div className="ai-coach-header-left">
                    <div className="ai-coach-avatar">
                      <div className="ai-coach-avatar-img">
                        <BrainIcon style={{ width: 20, height: 20 }} />
                      </div>
                      <div className="ai-coach-avatar-status"></div>
                    </div>
                    <div className="ai-coach-header-info">
                      <h2>
                        Coach AI
                        <span className="ai-coach-header-badge">Fitness Specialist</span>
                      </h2>
                      <div className="ai-coach-header-status">
                        <span className="ai-coach-status-dot"></span>
                        Gemini AI Connected
                      </div>
                    </div>
                  </div>
                  <div className="ai-coach-header-actions">
                    <button className="ai-coach-export-btn">
                      <DownloadIcon style={{ width: 16, height: 16 }} />
                      Export Chat
                    </button>
                    <button className="ai-coach-more-btn">
                      <MoreIcon style={{ width: 20, height: 20 }} />
                    </button>
                  </div>
                </header>

                {/* Messages */}
                <div className="ai-coach-messages" style={{ paddingBottom: '140px' }}>
                  <div className="ai-coach-date-separator">
                    <span>Today</span>
                  </div>

                  {messages.map((msg, idx) => (
                    <div key={idx} className={`ai-coach-message ${msg.type}`}>
                      <div className={`ai-coach-message-avatar ${msg.type}`}>
                        {msg.type === 'ai' ? (
                          <BrainIcon style={{ width: 16, height: 16 }} />
                        ) : (
                          getUserInitials()
                        )}
                      </div>
                      <div className="ai-coach-message-content">
                        {msg.type === 'ai' && (
                          <span className="ai-coach-message-sender">Coach AI</span>
                        )}
                        <div className={`ai-coach-message-bubble ${msg.type}`}>
                          <div dangerouslySetInnerHTML={{ __html: formatMessage(msg.text) }} />
                          
                          {/* Workout Card */}
                          {msg.workout && (
                            <div className="ai-coach-workout-card">
                              <div className="ai-coach-workout-header">
                                <h3>
                                  <DumbbellIcon style={{ width: 18, height: 18 }} />
                                  {msg.workout.title}
                                </h3>
                                <span>{msg.workout.duration}</span>
                              </div>
                              <div className="ai-coach-exercise-list">
                                {msg.workout.exercises.map((exercise, exIdx) => (
                                  <div key={exIdx} className="ai-coach-exercise-item">
                                    <div className="ai-coach-exercise-checkbox"></div>
                                    <div className="ai-coach-exercise-info">
                                      <h4>
                                        {exercise.name}
                                        {exercise.isNew && <span className="ai-coach-exercise-new">NEW</span>}
                                      </h4>
                                      <p>{exercise.sets} {exercise.weight && `• ${exercise.weight}`}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <button className="ai-coach-start-workout-btn">
                                <PlayIcon style={{ width: 16, height: 16 }} />
                                Start Workout
                              </button>
                            </div>
                          )}
                        </div>
                        
                        {msg.type === 'ai' && (
                          <div className="ai-coach-message-actions">
                            <button className="ai-coach-message-action">
                              <CopyIcon style={{ width: 14, height: 14 }} />
                            </button>
                            <button className="ai-coach-message-action">
                              <ThumbUpIcon style={{ width: 14, height: 14 }} />
                            </button>
                            <button className="ai-coach-message-action">
                              <ThumbDownIcon style={{ width: 14, height: 14 }} />
                            </button>
                          </div>
                        )}
                        
                        {msg.type === 'user' && msg.time && (
                          <span className="ai-coach-message-time">
                            {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓✓
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="ai-coach-message ai">
                      <div className="ai-coach-message-avatar ai">
                        <BrainIcon style={{ width: 16, height: 16 }} />
                      </div>
                      <div className="ai-coach-message-content">
                        <span className="ai-coach-message-sender">Coach AI</span>
                        <div className="ai-coach-message-bubble ai">
                          <div className="ai-coach-typing">
                            <div className="ai-coach-typing-dot"></div>
                            <div className="ai-coach-typing-dot"></div>
                            <div className="ai-coach-typing-dot"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="ai-coach-input-area">
                  {/* Suggestions */}
                  <div className="ai-coach-suggestions">
                    {suggestions.map((suggestion, idx) => (
                      <button 
                        key={idx} 
                        className={`ai-coach-suggestion ${suggestion.color}`}
                        onClick={() => handleSuggestion(suggestion.text)}
                      >
                        {suggestion.icon}
                        {suggestion.text}
                      </button>
                    ))}
                  </div>

                  {/* Input Bar */}
                  <div className="ai-coach-input-bar">
                    <button className="ai-coach-attach-btn">
                      <AttachIcon style={{ width: 20, height: 20 }} />
                    </button>
                    <textarea
                      placeholder="Ask about workouts, nutrition, or get personalized advice..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      rows={1}
                      disabled={loading}
                    />
                    <div className="ai-coach-input-actions">
                      <button className="ai-coach-voice-btn">
                        <MicIcon style={{ width: 18, height: 18 }} />
                      </button>
                      <button 
                        className="ai-coach-send-btn"
                        onClick={handleSend}
                        disabled={!inputText.trim() || loading}
                      >
                        <SendIcon style={{ width: 18, height: 18 }} />
                      </button>
                    </div>
                  </div>

                  <p className="ai-coach-input-disclaimer">
                    AI responses are for guidance only. Consult professionals for medical advice.
                  </p>
                </div>
              </>
            )}
            {/* Workout Plan Tab */}
            {activeTab === 'workout' && (
              <div style={{ padding: '2rem', overflowY: 'auto', height: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {/* Form */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: '1.25rem 1.5rem', 
                      background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 700 }}>
                        <DumbbellIcon style={{ width: 20, height: 20 }} />
                        Generate Workout Plan
                      </h3>
                      <span style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ZapIcon style={{ width: 12, height: 12 }} />
                        50 tokens
                      </span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Fitness Goal</label>
                        <select 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
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

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Experience Level</label>
                        <select 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
                          value={workoutForm.experienceLevel}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, experienceLevel: e.target.value })}
                        >
                          <option value="beginner">Beginner</option>
                          <option value="intermediate">Intermediate</option>
                          <option value="advanced">Advanced</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Days Per Week</label>
                        <select 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
                          value={workoutForm.daysPerWeek}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, daysPerWeek: parseInt(e.target.value) })}
                        >
                          <option value="3">3 days</option>
                          <option value="4">4 days</option>
                          <option value="5">5 days</option>
                          <option value="6">6 days</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Equipment Access</label>
                        <select 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
                          value={workoutForm.equipmentAccess}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, equipmentAccess: e.target.value })}
                        >
                          <option value="full_gym">Full Gym</option>
                          <option value="home_basic">Home (Basic)</option>
                          <option value="home_dumbbells">Home (Dumbbells)</option>
                          <option value="bodyweight">Bodyweight Only</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Any Injuries? (Optional)</label>
                        <input
                          type="text"
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem'
                          }}
                          placeholder="e.g., lower back pain, knee injury"
                          value={workoutForm.injuries}
                          onChange={(e) => setWorkoutForm({ ...workoutForm, injuries: e.target.value })}
                        />
                      </div>

                      <button 
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: 'linear-gradient(135deg, #3B82F6, #2563EB)',
                          border: 'none',
                          borderRadius: '0.75rem',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          marginTop: '1rem',
                          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}
                        onClick={handleGenerateWorkoutPlan}
                        disabled={generatingWorkout}
                      >
                        {generatingWorkout ? (
                          <>
                            <div className="ai-coach-typing" style={{ padding: 0 }}>
                              <div className="ai-coach-typing-dot" style={{ width: 6, height: 6 }}></div>
                              <div className="ai-coach-typing-dot" style={{ width: 6, height: 6 }}></div>
                              <div className="ai-coach-typing-dot" style={{ width: 6, height: 6 }}></div>
                            </div>
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
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: '1.25rem 1.5rem', 
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Your Workout Plan</h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {generatedWorkoutPlan ? (
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#334155' }}>
                          {typeof generatedWorkoutPlan === 'string' 
                            ? generatedWorkoutPlan 
                            : generatedWorkoutPlan.plan || generatedWorkoutPlan.response || JSON.stringify(generatedWorkoutPlan, null, 2)}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                          <DumbbellIcon style={{ width: 48, height: 48, color: '#cbd5e1', marginBottom: '1rem' }} />
                          <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>No workout plan yet</p>
                          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Fill out the form and click generate to create your personalized workout plan</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Nutrition Plan Tab */}
            {activeTab === 'nutrition' && (
              <div style={{ padding: '2rem', overflowY: 'auto', height: '100%' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                  {/* Form */}
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: '1.25rem 1.5rem', 
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <h3 style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontWeight: 700 }}>
                        <AppleIcon style={{ width: 20, height: 20 }} />
                        Generate Nutrition Plan
                      </h3>
                      <span style={{ 
                        background: 'rgba(255,255,255,0.2)', 
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}>
                        <ZapIcon style={{ width: 12, height: 12 }} />
                        50 tokens
                      </span>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Goal</label>
                        <select 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
                          value={nutritionForm.goal}
                          onChange={(e) => setNutritionForm({ ...nutritionForm, goal: e.target.value })}
                        >
                          <option value="muscle_gain">Muscle Gain (Bulk)</option>
                          <option value="fat_loss">Fat Loss (Cut)</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="lean_bulk">Lean Bulk</option>
                        </select>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Meals Per Day</label>
                        <select 
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem',
                            background: 'white'
                          }}
                          value={nutritionForm.mealsPerDay}
                          onChange={(e) => setNutritionForm({ ...nutritionForm, mealsPerDay: parseInt(e.target.value) })}
                        >
                          <option value="3">3 meals</option>
                          <option value="4">4 meals</option>
                          <option value="5">5 meals</option>
                          <option value="6">6 meals</option>
                        </select>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Current Weight (kg)</label>
                          <input
                            type="number"
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem 1rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.75rem',
                              fontSize: '0.875rem'
                            }}
                            placeholder="e.g., 75"
                            value={nutritionForm.currentWeight}
                            onChange={(e) => setNutritionForm({ ...nutritionForm, currentWeight: e.target.value })}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Target Weight (kg)</label>
                          <input
                            type="number"
                            style={{ 
                              width: '100%', 
                              padding: '0.75rem 1rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '0.75rem',
                              fontSize: '0.875rem'
                            }}
                            placeholder="e.g., 80"
                            value={nutritionForm.targetWeight}
                            onChange={(e) => setNutritionForm({ ...nutritionForm, targetWeight: e.target.value })}
                          />
                        </div>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Dietary Restrictions</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                          {['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Dairy-Free'].map(diet => (
                            <button
                              key={diet}
                              type="button"
                              style={{
                                padding: '0.5rem 0.75rem',
                                borderRadius: '9999px',
                                border: nutritionForm.dietaryRestrictions.includes(diet) ? 'none' : '1px solid #e2e8f0',
                                background: nutritionForm.dietaryRestrictions.includes(diet) ? '#10B981' : 'white',
                                color: nutritionForm.dietaryRestrictions.includes(diet) ? 'white' : '#64748b',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
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

                      <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, color: '#1e293b', fontSize: '0.875rem' }}>Food Allergies (Optional)</label>
                        <input
                          type="text"
                          style={{ 
                            width: '100%', 
                            padding: '0.75rem 1rem',
                            border: '1px solid #e2e8f0',
                            borderRadius: '0.75rem',
                            fontSize: '0.875rem'
                          }}
                          placeholder="e.g., nuts, shellfish"
                          value={nutritionForm.allergies}
                          onChange={(e) => setNutritionForm({ ...nutritionForm, allergies: e.target.value })}
                        />
                      </div>

                      <button 
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          background: 'linear-gradient(135deg, #10B981, #059669)',
                          border: 'none',
                          borderRadius: '0.75rem',
                          color: 'white',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          cursor: 'pointer',
                          marginTop: '1rem',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                        }}
                        onClick={handleGenerateNutritionPlan}
                        disabled={generatingNutrition}
                      >
                        {generatingNutrition ? (
                          <>
                            <div className="ai-coach-typing" style={{ padding: 0 }}>
                              <div className="ai-coach-typing-dot" style={{ width: 6, height: 6 }}></div>
                              <div className="ai-coach-typing-dot" style={{ width: 6, height: 6 }}></div>
                              <div className="ai-coach-typing-dot" style={{ width: 6, height: 6 }}></div>
                            </div>
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
                  <div style={{ 
                    background: 'rgba(255, 255, 255, 0.7)', 
                    backdropFilter: 'blur(12px)',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      padding: '1.25rem 1.5rem', 
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <h3 style={{ margin: 0, fontWeight: 700, color: '#1e293b' }}>Your Nutrition Plan</h3>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                      {generatedNutritionPlan ? (
                        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#334155' }}>
                          {typeof generatedNutritionPlan === 'string' 
                            ? generatedNutritionPlan 
                            : generatedNutritionPlan.plan || generatedNutritionPlan.response || JSON.stringify(generatedNutritionPlan, null, 2)}
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                          <AppleIcon style={{ width: 48, height: 48, color: '#cbd5e1', marginBottom: '1rem' }} />
                          <p style={{ fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>No nutrition plan yet</p>
                          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Fill out the form and click generate to create your personalized nutrition plan</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default AICoach
