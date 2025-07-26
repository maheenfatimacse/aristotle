import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Heart, 
  MessageCircle, 
  Smile, 
  Frown, 
  Meh,
  Brain,
  Target,
  Award,
  Coffee,
  Sun,
  Moon,
  Sparkles,
  Lightbulb,
  BookOpen,
  TrendingUp,
  Clock,
  Star,
  ThumbsUp,
  ThumbsDown,
  Send,
  RefreshCw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface EmotionState {
  primary: 'happy' | 'sad' | 'frustrated' | 'confident' | 'anxious' | 'neutral';
  intensity: number; // 1-10
  context: string;
  timestamp: Date;
}

interface SupportMessage {
  id: string;
  type: 'encouragement' | 'reflection' | 'celebration' | 'break-reminder' | 'challenge' | 'motivation';
  content: string;
  emotion: EmotionState;
  timestamp: Date;
  isFromCompanion: boolean;
}

interface WellnessActivity {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  type: 'breathing' | 'reflection' | 'movement' | 'gratitude' | 'goal-setting';
  completed: boolean;
}

interface StudentMood {
  currentEmotion: EmotionState;
  recentTrend: 'improving' | 'declining' | 'stable';
  stressLevel: number; // 1-10
  studyStreak: number;
  lastBreak: Date;
  achievements: string[];
}

const WELLNESS_ACTIVITIES: WellnessActivity[] = [
  {
    id: 'breathing-1',
    title: 'Mindful Breathing',
    description: 'Take 5 deep breaths to center yourself and reduce stress',
    duration: 2,
    type: 'breathing',
    completed: false
  },
  {
    id: 'reflection-1',
    title: 'Gratitude Reflection',
    description: 'Write down 3 things you\'re grateful for today',
    duration: 5,
    type: 'reflection',
    completed: false
  },
  {
    id: 'movement-1',
    title: 'Quick Stretch',
    description: 'Stand up and stretch for 2 minutes to refresh your mind',
    duration: 2,
    type: 'movement',
    completed: false
  },
  {
    id: 'gratitude-1',
    title: 'Self-Appreciation',
    description: 'Acknowledge one thing you did well today',
    duration: 3,
    type: 'gratitude',
    completed: false
  },
  {
    id: 'goal-1',
    title: 'Mini Goal Setting',
    description: 'Set one small, achievable goal for your next study session',
    duration: 4,
    type: 'goal-setting',
    completed: false
  }
];

export const EmotionalSupportCompanion = () => {
  const { toast } = useToast();
  const [studentMood, setStudentMood] = useState<StudentMood>({
    currentEmotion: {
      primary: 'neutral',
      intensity: 5,
      context: 'Starting fresh',
      timestamp: new Date()
    },
    recentTrend: 'stable',
    stressLevel: 3,
    studyStreak: 0,
    lastBreak: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    achievements: []
  });
  
  const [messages, setMessages] = useState<SupportMessage[]>([
    {
      id: '1',
      type: 'encouragement',
      content: "Hello! I'm Aristotle, your wisest friend and mentor! 😊 I'm here to guide you through your learning journey, help you solve problems, and remind you of your amazing potential. What's on your mind today? 🌟",
      emotion: { primary: 'happy', intensity: 7, context: 'greeting', timestamp: new Date() },
      timestamp: new Date(),
      isFromCompanion: true
    }
  ]);
  
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showWellnessActivities, setShowWellnessActivities] = useState(false);
  const [currentActivity, setCurrentActivity] = useState<WellnessActivity | null>(null);
  const [activityTimer, setActivityTimer] = useState(0);
  const [isActivityActive, setIsActivityActive] = useState(false);
  const [showMoodTracker, setShowMoodTracker] = useState(false);
  const [breakReminder, setBreakReminder] = useState(false);

  // Emotion detection using LLM
  const detectEmotion = async (text: string, context: string): Promise<EmotionState> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    try {
      const prompt = `Analyze the emotional state of this student message: "${text}"
      Context: ${context}
      
      Return JSON with:
      - primary: 'happy', 'sad', 'frustrated', 'confident', 'anxious', or 'neutral'
      - intensity: 1-10 scale
      - context: brief description of the emotional context
      
      Be empathetic and understanding.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        
        try {
          const emotion = JSON.parse(resultText);
          return {
            primary: emotion.primary || 'neutral',
            intensity: emotion.intensity || 5,
            context: emotion.context || 'general',
            timestamp: new Date()
          };
        } catch {
          return { primary: 'neutral', intensity: 5, context: 'general', timestamp: new Date() };
        }
      }
    } catch (error) {
      console.error('Emotion detection failed:', error);
    }
    
    return { primary: 'neutral', intensity: 5, context: 'general', timestamp: new Date() };
  };

  // Generate empathetic response
  const generateSupportiveResponse = async (studentMessage: string, emotion: EmotionState, context: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    try {
      const prompt = `You are Aristotle, the wisest friend and mentor to this student. The student says: "${studentMessage}"
      
      Student's emotional state: ${emotion.primary} (intensity: ${emotion.intensity}/10)
      Context: ${context}
      
      Respond as Aristotle would - with wisdom, empathy, and guidance:
      
      1. **Show deep understanding** - Acknowledge their feelings and situation
      2. **Ask thoughtful questions** - "What's really bothering you?" or "Can you tell me more about this?"
      3. **Offer solutions** - "Would you like me to help you create a plan to solve this?" or "I have some ideas that might help"
      4. **Build confidence** - Remind them of their strengths and past successes
      5. **Use encouraging emojis** - Add relevant emojis like 😊 🌟 💪 🎯 🧠 ✨
      6. **Be solution-oriented** - Don't just sympathize, help them find a way forward
      
      Keep it warm, wise, and actionable. Like a caring mentor who truly wants to help them grow.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here for you! 😊 What's on your mind?";
      }
    } catch (error) {
      console.error('Response generation failed:', error);
    }
    
    return "I'm here for you! 😊 What's on your mind?";
  };

  // Send message
  const sendMessage = async () => {
    if (!currentMessage.trim()) return;
    
    const userMessage: SupportMessage = {
      id: Date.now().toString(),
      type: 'encouragement',
      content: currentMessage,
      emotion: { primary: 'neutral', intensity: 5, context: 'user input', timestamp: new Date() },
      timestamp: new Date(),
      isFromCompanion: false
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);
    
    // Detect emotion and generate response
    const emotion = await detectEmotion(currentMessage, 'student interaction');
    const response = await generateSupportiveResponse(currentMessage, emotion, 'general');
    
    const companionMessage: SupportMessage = {
      id: (Date.now() + 1).toString(),
      type: 'encouragement',
      content: response,
      emotion: { primary: 'happy', intensity: 7, context: 'support', timestamp: new Date() },
      timestamp: new Date(),
      isFromCompanion: true
    };
    
    setMessages(prev => [...prev, companionMessage]);
    setIsTyping(false);
    
    // Update student mood
    setStudentMood(prev => ({
      ...prev,
      currentEmotion: emotion,
      stressLevel: emotion.primary === 'frustrated' || emotion.primary === 'anxious' 
        ? Math.min(prev.stressLevel + 1, 10) 
        : Math.max(prev.stressLevel - 1, 1)
    }));
    
    // Check if break reminder is needed
    if (studentMood.stressLevel > 7) {
      setTimeout(() => setBreakReminder(true), 2000);
    }
  };

  // Start wellness activity
  const startActivity = (activity: WellnessActivity) => {
    setCurrentActivity(activity);
    setActivityTimer(activity.duration * 60);
    setIsActivityActive(true);
    setShowWellnessActivities(false);
  };

  // Activity timer effect
  useEffect(() => {
    if (isActivityActive && activityTimer > 0) {
      const timer = setInterval(() => {
        setActivityTimer(prev => {
          if (prev <= 1) {
            completeActivity();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isActivityActive, activityTimer]);

  // Complete activity
  const completeActivity = () => {
    if (!currentActivity) return;
    
    setIsActivityActive(false);
    setCurrentActivity(null);
    
    // Update wellness activities
    const updatedActivities = WELLNESS_ACTIVITIES.map(activity => 
      activity.id === currentActivity.id ? { ...activity, completed: true } : activity
    );
    
    // Update student mood
    setStudentMood(prev => ({
      ...prev,
      stressLevel: Math.max(prev.stressLevel - 2, 1),
      currentEmotion: { ...prev.currentEmotion, primary: 'happy', intensity: 8 }
    }));
    
          toast({
        title: 'Wellness activity completed! 🌟',
        description: 'Amazing job taking care of yourself! You\'re building great habits! 💪',
      });
  };

  // Get emotion icon
  const getEmotionIcon = (emotion: string) => {
    switch (emotion) {
      case 'happy': return <Smile className="h-5 w-5 text-green-600" />;
      case 'sad': return <Frown className="h-5 w-5 text-blue-600" />;
      case 'frustrated': return <Meh className="h-5 w-5 text-orange-600" />;
      case 'confident': return <Star className="h-5 w-5 text-yellow-600" />;
      case 'anxious': return <Brain className="h-5 w-5 text-purple-600" />;
      default: return <Meh className="h-5 w-5 text-gray-600" />;
    }
  };

  // Get mood color
  const getMoodColor = (emotion: string) => {
    switch (emotion) {
      case 'happy': return 'text-green-600 bg-green-50';
      case 'sad': return 'text-blue-600 bg-blue-50';
      case 'frustrated': return 'text-orange-600 bg-orange-50';
      case 'confident': return 'text-yellow-600 bg-yellow-50';
      case 'anxious': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-aristotle-blue">
            <Heart className="h-5 w-5" />
            Aristotle - Your Wisest Friend & Mentor 🌟
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">How are you feeling today? 😊</p>
              <div className="flex items-center gap-2">
                {getEmotionIcon(studentMood.currentEmotion.primary)}
                <span className="font-medium capitalize">{studentMood.currentEmotion.primary}</span>
                <Badge variant="outline">Stress: {studentMood.stressLevel}/10</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMoodTracker(!showMoodTracker)}
              >
                <TrendingUp className="h-4 w-4 mr-1" />
                Mood Tracker
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWellnessActivities(!showWellnessActivities)}
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Wellness Activities
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="shadow-elegant">
            <CardHeader>
                          <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Chat with Your Wise Friend Aristotle 💬
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Messages */}
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.isFromCompanion ? "justify-start" : "justify-end"
                    )}
                  >
                    {message.isFromCompanion && (
                      <div className="w-8 h-8 rounded-full bg-aristotle-blue flex items-center justify-center">
                        <Heart className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-xs p-3 rounded-lg",
                        message.isFromCompanion
                          ? "bg-blue-50 text-blue-900"
                          : "bg-aristotle-blue text-white"
                      )}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {!message.isFromCompanion && (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <Smile className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-aristotle-blue flex items-center justify-center">
                      <Heart className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <Input
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  placeholder="Tell me what's on your mind... 😊"
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!currentMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Mood Tracker */}
          {showMoodTracker && (
            <Card>
              <CardHeader>
                            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Mood Tracker 📊
            </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stress Level</span>
                    <span className="text-sm font-medium">{studentMood.stressLevel}/10</span>
                  </div>
                  <Progress value={studentMood.stressLevel * 10} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Study Streak</span>
                    <span className="text-sm font-medium">{studentMood.studyStreak} days</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Break</span>
                    <span className="text-sm font-medium">
                      {Math.floor((Date.now() - studentMood.lastBreak.getTime()) / (1000 * 60 * 60))}h ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Wellness Activities */}
          {showWellnessActivities && (
            <Card>
              <CardHeader>
                            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Wellness Activities ✨
            </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {WELLNESS_ACTIVITIES.map((activity) => (
                  <Button
                    key={activity.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => startActivity(activity)}
                    disabled={activity.completed}
                  >
                    <div className="text-left">
                      <div className="font-medium">{activity.title}</div>
                      <div className="text-xs text-muted-foreground">{activity.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">{activity.duration} min</div>
                    </div>
                    {activity.completed && <CheckCircle className="h-4 w-4 ml-2 text-green-600" />}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
                          <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Quick Actions 💡
            </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const message = "I'm feeling overwhelmed and stressed with my studies. I don't know where to start and I'm losing confidence.";
                  setCurrentMessage(message);
                }}
              >
                <Frown className="h-4 w-4 mr-2" />
                I'm Stressed 😰
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const message = "I just solved a really difficult problem! I'm feeling so proud and excited about my progress!";
                  setCurrentMessage(message);
                }}
              >
                <Star className="h-4 w-4 mr-2" />
                I'm Excited! ⭐
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const message = "I keep making the same mistakes and I feel like I'm not good enough. I'm getting frustrated with myself.";
                  setCurrentMessage(message);
                }}
              >
                <Meh className="h-4 w-4 mr-2" />
                I'm Frustrated 😤
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const message = "I'm feeling sad and demotivated. I don't think I can do this anymore.";
                  setCurrentMessage(message);
                }}
              >
                <Frown className="h-4 w-4 mr-2" />
                I'm Sad 😢
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const message = "I need help creating a study plan. Can you guide me?";
                  setCurrentMessage(message);
                }}
              >
                <Target className="h-4 w-4 mr-2" />
                Need Study Plan 📋
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Activity Modal */}
      {currentActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                {currentActivity.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{currentActivity.description}</p>
              
              {isActivityActive ? (
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    {Math.floor(activityTimer / 60)}:{(activityTimer % 60).toString().padStart(2, '0')}
                  </div>
                  <Progress value={((currentActivity.duration * 60 - activityTimer) / (currentActivity.duration * 60)) * 100} />
                  <Button
                    onClick={() => setIsActivityActive(false)}
                    variant="outline"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="text-3xl font-bold text-primary">
                    {currentActivity.duration}:00
                  </div>
                  <Button
                    onClick={() => setIsActivityActive(true)}
                    className="w-full"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Activity
                  </Button>
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentActivity(null);
                  setIsActivityActive(false);
                  setActivityTimer(0);
                }}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Break Reminder */}
      {breakReminder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5" />
                Time for a Break!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                I notice you might be feeling a bit stressed. 😊 Remember, even the greatest minds need breaks! Taking a short pause can help you feel refreshed and more focused. Would you like to try a quick wellness activity? 🌟
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setBreakReminder(false);
                    setShowWellnessActivities(true);
                  }}
                  className="flex-1"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Try Wellness Activity
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setBreakReminder(false)}
                  className="flex-1"
                >
                  Maybe Later
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}; 