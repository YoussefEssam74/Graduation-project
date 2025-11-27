"use client";

import { useState } from "react";
import {
  Brain,
  Send,
  Zap,
  MessageSquare,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function AICoachPage() {
  const user = { firstName: "Youssef" }; // Demo user
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "ai"; content: string; timestamp: string }[]
  >([
    {
      role: "ai",
      content: `Hi ${user?.firstName || "there"}! I'm your AI fitness coach. I can help you with workout tips, nutrition advice, form corrections, and personalized recommendations based on your InBody data. How can I assist you today?`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  const suggestedPrompts = [
    "What should I eat after my workout?",
    "How can I improve my bench press?",
    "Create a meal plan for muscle gain",
    "What exercises target lower back?",
    "How much protein do I need daily?",
    "Tips for better recovery",
  ];

  const handleSendMessage = () => {
    if (!message.trim()) return;

    // Add user message
    const newUserMessage = {
      role: "user" as const,
      content: message,
      timestamp: new Date().toLocaleTimeString(),
    };

    // Simulate AI response
    const aiResponse = {
      role: "ai" as const,
      content: `Great question! Based on your current stats and goals, here's my recommendation: ${message.toLowerCase().includes("protein") ? "Aim for 1.6-2.2g of protein per kg of body weight. At your current weight of 75.5kg, that's around 120-165g daily. Focus on lean sources like chicken, fish, eggs, and Greek yogurt." : message.toLowerCase().includes("workout") || message.toLowerCase().includes("eat") ? "Within 30-60 minutes post-workout, consume a meal with both protein and carbs. A great option would be chicken breast with rice and vegetables, or a protein shake with banana and oats." : "I'd be happy to help with that! For personalized advice, I can analyze your InBody measurements, workout history, and nutrition data to give you the most accurate recommendations."}`,
      timestamp: new Date().toLocaleTimeString(),
    };

    setChatHistory([...chatHistory, newUserMessage, aiResponse]);
    setMessage("");
  };

  const handlePromptClick = (prompt: string) => {
    setMessage(prompt);
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold">
          <span className="text-foreground">AI </span>
          <span className="text-primary">Coach</span>
        </h1>
        <p className="text-muted-foreground mt-1">
          Get instant fitness advice powered by AI
        </p>
      </div>

      {/* Stats Banner */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="p-4 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Messages Today</div>
              <div className="text-2xl font-bold">12</div>
            </div>
            <MessageSquare className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Tokens Available</div>
              <div className="text-2xl font-bold">250</div>
            </div>
            <Zap className="h-8 w-8 text-primary" />
          </div>
        </Card>

        <Card className="p-4 border border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Cost per Message</div>
              <div className="text-2xl font-bold">1</div>
            </div>
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Chat Container */}
      <Card className="border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">AI Fitness Coach</h3>
                <p className="text-xs text-muted-foreground">Always available to help</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="h-[500px] overflow-y-auto p-6 space-y-4">
          {chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] ${
                  msg.role === "user"
                    ? "bg-primary text-white"
                    : "bg-muted"
                } rounded-2xl px-4 py-3`}
              >
                <p className="text-sm">{msg.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    msg.role === "user" ? "text-white/70" : "text-muted-foreground"
                  }`}
                >
                  {msg.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Suggested Prompts */}
        {chatHistory.length === 1 && (
          <div className="px-6 pb-4">
            <p className="text-sm text-muted-foreground mb-3">Suggested questions:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handlePromptClick(prompt)}
                  className="text-left p-3 bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 text-sm transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Input */}
        <div className="p-4 border-t border-border bg-background">
          <div className="flex gap-2">
            <Input
              placeholder="Ask me anything about fitness, nutrition, or training..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1"
            />
            <Button onClick={handleSendMessage} disabled={!message.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <Zap className="h-3 w-3 text-primary" />
            Each message costs 1 token
          </p>
        </div>
      </Card>

      {/* CTA for Voice Program */}
      <Card className="p-6 border-2 border-primary bg-gradient-to-r from-primary/10 to-secondary/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-foreground">Want a Complete </span>
              <span className="text-primary">AI Program?</span>
            </h3>
            <p className="text-muted-foreground mb-3">
              Use our voice AI to generate a fully personalized workout and nutrition plan
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Personalized to your goals</span>
              </div>
              <div className="flex items-center gap-1">
                <Brain className="h-4 w-4 text-primary" />
                <span>AI-powered analysis</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-primary" />
                <span>50 tokens</span>
              </div>
            </div>
          </div>
          <Link href="/generate-program">
            <Button size="lg" className="px-8">
              Generate Program
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
