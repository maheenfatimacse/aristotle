import React, { useState } from "react";
import { Header } from "@/components/Header";
import { AIPoweredWhiteboard } from "@/components/AIPoweredWhiteboard";
import { ConceptTutor } from "@/components/ConceptTutor";
import { StudentDashboard } from "@/components/StudentDashboard";
import { AdaptivePracticeEngine } from "@/components/AdaptivePracticeEngine";
import { SmartTextbookReader } from "@/components/SmartTextbookReader";
import { ExamSimulator } from "@/components/ExamSimulator";
import { EmotionalSupportCompanion } from "@/components/EmotionalSupportCompanion";
import { AuthDialog } from "@/components/AuthDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, PenTool, BarChart3, Target, FileText, Award, Heart } from "lucide-react";

interface Student {
  name: string;
  email: string;
  grade: string;
}

interface Step {
  id: string;
  content: string;
  isCorrect?: boolean;
  feedback?: string;
  hints?: string[];
}

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [showConceptTutor, setShowConceptTutor] = useState(false);
  const [currentTopic, setCurrentTopic] = useState("");
  const [activeTab, setActiveTab] = useState("whiteboard");

  // Sample dashboard data
  const dashboardData = {
    studyTime: 45,
    weeklyProgress: 78,
    correctSteps: 23,
    totalSteps: 30,
    currentStreak: 5,
    conceptsLearned: 12,
    recentSessions: [
      {
        id: "1",
        date: "Today, 2:30 PM",
        duration: 25,
        topic: "Quadratic Equations",
        accuracy: 85
      },
      {
        id: "2", 
        date: "Yesterday, 4:15 PM",
        duration: 35,
        topic: "Linear Systems",
        accuracy: 92
      },
      {
        id: "3",
        date: "Dec 23, 3:45 PM", 
        duration: 40,
        topic: "Trigonometry",
        accuracy: 76
      }
    ]
  };

  const handleAuthenticate = (userData: Student) => {
    setStudent(userData);
    setIsAuthenticated(true);
    setShowAuthDialog(false);
  };

  const handleSignOut = () => {
    setStudent(null);
    setIsAuthenticated(false);
    setActiveTab("whiteboard");
  };

  const handleStepComplete = (step: Step) => {
    console.log("Step completed:", step);
    // Here you would typically send this to your backend/AI service
  };

  const handleRequestConcept = (topic: string) => {
    setCurrentTopic(topic);
    setShowConceptTutor(true);
  };

  const handleAuthAction = () => {
    if (isAuthenticated) {
      handleSignOut();
    } else {
      setShowAuthDialog(true);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted">
        <Header 
          onAuthAction={handleAuthAction}
          isAuthenticated={false}
        />
        
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Meet Aristotle
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Your personal AI tutor for Grade 10-12 Mathematics. Get instant step-by-step guidance, 
                personalized concept explanations, and build confidence in problem-solving.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-card p-6 rounded-lg shadow-soft border">
                <PenTool className="h-12 w-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Interactive Whiteboard</h3>
                <p className="text-muted-foreground text-sm">
                  Solve problems step-by-step with real-time AI feedback and validation
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-soft border">
                <BookOpen className="h-12 w-12 text-secondary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Concept Tutor</h3>
                <p className="text-muted-foreground text-sm">
                  Get instant explanations and practice quizzes for any mathematical concept
                </p>
              </div>
              
              <div className="bg-card p-6 rounded-lg shadow-soft border">
                <BarChart3 className="h-12 w-12 text-accent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                <p className="text-muted-foreground text-sm">
                  Monitor your learning journey with detailed analytics and insights
                </p>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={() => setShowAuthDialog(true)}
                className="bg-primary text-primary-foreground hover:bg-primary-dark px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-medium"
              >
                Start Learning Today
              </button>
            </div>
          </div>
        </div>

        <AuthDialog
          isOpen={showAuthDialog}
          onClose={() => setShowAuthDialog(false)}
          onAuthenticate={handleAuthenticate}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header 
        studentName={student?.name}
        onAuthAction={handleAuthAction}
        isAuthenticated={isAuthenticated}
      />
      
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 lg:w-auto lg:grid-cols-7">
            <TabsTrigger value="whiteboard" className="flex items-center space-x-2">
              <PenTool className="h-4 w-4" />
              <span>Solve Problems</span>
            </TabsTrigger>
            <TabsTrigger value="practice" className="flex items-center space-x-2">
              <Target className="h-4 w-4" />
              <span>Practice</span>
            </TabsTrigger>
            <TabsTrigger value="textbook" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Textbook</span>
            </TabsTrigger>
            <TabsTrigger value="exam" className="flex items-center space-x-2">
              <Award className="h-4 w-4" />
              <span>Exam</span>
            </TabsTrigger>
            <TabsTrigger value="companion" className="flex items-center space-x-2">
              <Heart className="h-4 w-4" />
              <span>Companion</span>
            </TabsTrigger>
            <TabsTrigger value="concepts" className="flex items-center space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Learn Concepts</span>
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>My Progress</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="whiteboard" className="space-y-6">
            <AIPoweredWhiteboard />
          </TabsContent>

          <TabsContent value="practice" className="space-y-6">
            <AdaptivePracticeEngine />
          </TabsContent>

          <TabsContent value="textbook" className="space-y-6">
            <SmartTextbookReader />
          </TabsContent>

          <TabsContent value="exam" className="space-y-6">
            <ExamSimulator />
          </TabsContent>

          <TabsContent value="companion" className="space-y-6">
            <EmotionalSupportCompanion />
          </TabsContent>

          <TabsContent value="concepts" className="space-y-6">
            <ConceptTutor
              topic="Quadratic Equations"
              isVisible={true}
              onClose={() => {}}
            />
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <StudentDashboard data={dashboardData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
