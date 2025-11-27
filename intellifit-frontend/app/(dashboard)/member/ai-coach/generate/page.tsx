'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, Mic, MicOff, Sparkles, Activity, ArrowRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/hooks/useAuth';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function GenerateProgramPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [programGenerated, setProgramGenerated] = useState(false);
  const [showRedirect, setShowRedirect] = useState(false);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  // Mock conversation flow
  const mockConversation = [
    { role: 'assistant' as const, content: `Hi ${user?.name}! I'm your AI fitness coach. I'll ask you a few questions to create your personalized program. Let's start - what's your primary fitness goal?`, timestamp: new Date() },
    { role: 'user' as const, content: 'I want to build muscle and lose some fat', timestamp: new Date() },
    { role: 'assistant' as const, content: 'Great goal! How many days per week can you commit to working out?', timestamp: new Date() },
    { role: 'user' as const, content: 'I can do 4 days a week', timestamp: new Date() },
    { role: 'assistant' as const, content: 'Perfect! Do you have any injuries or physical limitations I should know about?', timestamp: new Date() },
    { role: 'user' as const, content: 'No injuries, I\'m good to go', timestamp: new Date() },
    { role: 'assistant' as const, content: 'Excellent! What about dietary restrictions or allergies?', timestamp: new Date() },
    { role: 'user' as const, content: 'I\'m allergic to shellfish, but otherwise I eat everything', timestamp: new Date() },
    { role: 'assistant' as const, content: 'Got it! Last question - what\'s your current fitness level?', timestamp: new Date() },
    { role: 'user' as const, content: 'I\'d say intermediate, I\'ve been training for about a year', timestamp: new Date() },
    { role: 'system' as const, content: 'Perfect! I have all the information I need. Generating your personalized workout and nutrition plan...', timestamp: new Date() },
  ];

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (programGenerated && !showRedirect) {
      const timer = setTimeout(() => {
        setShowRedirect(true);
        setTimeout(() => {
          router.push('/member/workouts');
        }, 2000);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [programGenerated, showRedirect, router]);

  const startSession = async () => {
    setIsConnecting(true);
    setMessages([]);
    setProgramGenerated(false);
    setShowRedirect(false);

    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsConnecting(false);
    setIsActive(true);

    // Simulate conversation with delays
    let currentIndex = 0;
    const addMessage = () => {
      if (currentIndex < mockConversation.length) {
        const msg = mockConversation[currentIndex];
        setMessages(prev => [...prev, msg]);
        
        // Simulate speaking for assistant messages
        if (msg.role === 'assistant') {
          setIsSpeaking(true);
          setTimeout(() => setIsSpeaking(false), 2000);
        }
        
        currentIndex++;
        
        // Check if this is the last message
        if (currentIndex === mockConversation.length) {
          setTimeout(() => {
            setProgramGenerated(true);
            setIsActive(false);
          }, 2000);
        } else {
          setTimeout(addMessage, msg.role === 'user' ? 1500 : 3000);
        }
      }
    };
    
    addMessage();
  };

  const endSession = () => {
    setIsActive(false);
    setIsSpeaking(false);
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Generate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">AI Program</span>
        </h1>
        <p className="text-gray-600 text-lg">
          Have a voice conversation with our AI to create your personalized fitness plan
        </p>
        {!isActive && !programGenerated && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
            <span className="text-2xl">💎</span>
            <span className="text-sm text-yellow-800">This will cost <strong>50 tokens</strong></span>
          </div>
        )}
      </div>

      {/* Video Call Area */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* AI Coach Card */}
        <Card className="relative overflow-hidden border-2 border-purple-200">
          <div className="aspect-video flex flex-col items-center justify-center p-6 relative bg-gradient-to-br from-purple-50 to-blue-50">
            {/* Voice Wave Animation */}
            {isSpeaking && (
              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                <div className="flex gap-2 items-center h-20">
                  {[...Array(7)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1 bg-purple-500 rounded-full animate-sound-wave"
                      style={{
                        animationDelay: `${i * 0.1}s`,
                        height: `${Math.random() * 60 + 20}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* AI Avatar */}
            <div className="relative mb-4">
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center ${isSpeaking ? 'animate-pulse' : ''}`}>
                <Brain className="h-16 w-16 text-white" />
              </div>
              {isSpeaking && (
                <div className="absolute inset-0 rounded-full border-4 border-purple-500 animate-ping" />
              )}
            </div>

            <h2 className="text-xl font-bold text-gray-900">IntelliFit AI Coach</h2>
            <p className="text-sm text-gray-600 mt-1">Your Personal Fitness Advisor</p>

            {/* Status Indicator */}
            <div className={`mt-4 flex items-center gap-2 px-4 py-2 rounded-full ${isSpeaking ? 'bg-purple-100 border-purple-300' : 'bg-gray-100 border-gray-300'} border`}>
              <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-purple-500 animate-pulse' : isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className="text-xs font-medium">
                {programGenerated ? 'Program Generated!' : isSpeaking ? 'Speaking...' : isActive ? 'Listening...' : 'Waiting...'}
              </span>
            </div>
          </div>
        </Card>

        {/* User Card */}
        <Card className="border-2 border-blue-200">
          <div className="aspect-video flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-4 border-4 border-white shadow-lg">
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-4xl font-bold text-white">{user?.name?.charAt(0) || 'U'}</span>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900">{user?.name || 'You'}</h2>
            <p className="text-sm text-gray-600 mt-1">Member</p>

            <div className="mt-4 flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-300">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-xs font-medium">Ready</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages Container */}
      {messages.length > 0 && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <div
              ref={messageContainerRef}
              className="h-64 overflow-y-auto space-y-4 scroll-smooth"
            >
              {messages.map((msg, index) => (
                <div key={index} className="animate-fadeIn">
                  <div className={`font-semibold text-xs mb-1 ${
                    msg.role === 'assistant' ? 'text-purple-600' :
                    msg.role === 'system' ? 'text-green-600' :
                    'text-blue-600'
                  }`}>
                    {msg.role === 'assistant' ? '🤖 AI Coach' : msg.role === 'system' ? '⚡ System' : '👤 You'}:
                  </div>
                  <p className="text-gray-700 ml-4">{msg.content}</p>
                </div>
              ))}

              {programGenerated && (
                <div className="animate-fadeIn border-2 border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800 mb-2">✅ Program Generated Successfully!</p>
                      <p className="text-sm text-green-700 mb-3">
                        Your personalized 12-week muscle building and fat loss program is ready! It includes:
                      </p>
                      <ul className="text-sm text-green-700 space-y-1 ml-4">
                        <li>• 4-day strength training split</li>
                        <li>• Custom nutrition plan: 2,400 calories/day</li>
                        <li>• 180g protein, 240g carbs, 65g fats</li>
                        <li>• Shellfish-free meal options</li>
                      </ul>
                      {showRedirect && (
                        <p className="text-sm font-medium text-green-800 mt-3 animate-pulse">
                          Redirecting to your workout plans...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Call Controls */}
      <div className="flex justify-center gap-4">
        {!isActive && !programGenerated && (
          <Button
            size="lg"
            onClick={startSession}
            disabled={isConnecting}
            className="px-8 py-6 text-lg rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-6 w-6 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Mic className="h-6 w-6 mr-2" />
                Start AI Session
              </>
            )}
          </Button>
        )}

        {isActive && !programGenerated && (
          <Button
            size="lg"
            onClick={endSession}
            variant="danger"
            className="px-8 py-6 text-lg rounded-full"
          >
            <MicOff className="h-6 w-6 mr-2" />
            End Session
          </Button>
        )}

        {programGenerated && !showRedirect && (
          <Button
            size="lg"
            onClick={() => router.push('/member/workouts')}
            className="px-8 py-6 text-lg rounded-full bg-green-600 hover:bg-green-700"
          >
            View My Program
            <ArrowRight className="h-6 w-6 ml-2" />
          </Button>
        )}
      </div>

      {/* Info Banner */}
      {!isActive && !programGenerated && (
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            💡 The AI will ask about your goals, fitness level, schedule, injuries, and dietary needs
          </p>
        </div>
      )}

      <style jsx>{`
        @keyframes sound-wave {
          0%, 100% { height: 20%; }
          50% { height: 80%; }
        }
        .animate-sound-wave {
          animation: sound-wave 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
