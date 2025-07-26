import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  Target,
  BookOpen,
  Timer,
  Award,
  TrendingUp,
  Brain,
  FileText,
  CheckSquare,
  PenTool,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ExamQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'written';
  marks: number;
  timeLimit: number; // in minutes
  options?: string[];
  correctAnswer?: string;
  expectedSteps?: string[];
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface ExamSession {
  id: string;
  examType: string;
  startTime: Date;
  endTime?: Date;
  totalTime: number; // in minutes
  questions: ExamQuestion[];
  answers: Array<{
    questionId: string;
    answer: string;
    timeSpent: number;
    isCorrect: boolean;
    marksObtained: number;
  }>;
  performance: {
    totalMarks: number;
    obtainedMarks: number;
    accuracy: number;
    averageTime: number;
    timeManagement: number; // percentage of time used effectively
    topicPerformance: Record<string, { correct: number; total: number; accuracy: number }>;
  };
}

interface ExamType {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  totalMarks: number;
  questionCount: number;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const EXAM_TYPES: ExamType[] = [
  {
    id: 'unit-test',
    name: 'Unit Test',
    description: 'Single topic assessment (30 minutes)',
    duration: 30,
    totalMarks: 25,
    questionCount: 10,
    topics: ['Quadratic Equations'],
    difficulty: 'medium'
  },
  {
    id: 'mid-term',
    name: 'Mid-Term Exam',
    description: 'Multiple topics assessment (90 minutes)',
    duration: 90,
    totalMarks: 50,
    questionCount: 20,
    topics: ['Quadratic Equations', 'Linear Systems', 'Functions'],
    difficulty: 'medium'
  },
  {
    id: 'final-exam',
    name: 'Final Exam',
    description: 'Complete syllabus assessment (180 minutes)',
    duration: 180,
    totalMarks: 100,
    questionCount: 40,
    topics: ['Quadratic Equations', 'Linear Systems', 'Functions', 'Trigonometry', 'Probability'],
    difficulty: 'hard'
  },
  {
    id: 'board-practice',
    name: 'Board Exam Practice',
    description: 'Real board exam format (210 minutes)',
    duration: 210,
    totalMarks: 80,
    questionCount: 35,
    topics: ['All Topics'],
    difficulty: 'hard'
  }
];

export const ExamSimulator = () => {
  const { toast } = useToast();
  const [selectedExamType, setSelectedExamType] = useState<ExamType | null>(null);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [examPhase, setExamPhase] = useState<'setup' | 'exam' | 'completed'>('setup');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [examStartTime, setExamStartTime] = useState<Date | null>(null);

  // Timer effect
  useEffect(() => {
    if (examPhase === 'exam' && timeRemaining > 0 && !isPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examPhase, timeRemaining, isPaused]);

  // Generate exam questions using LLM
  const generateExamQuestions = async (examType: ExamType): Promise<ExamQuestion[]> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const questions: ExamQuestion[] = [];
    
    try {
      for (let i = 0; i < examType.questionCount; i++) {
        const questionType = i < examType.questionCount * 0.7 ? 'mcq' : 'written';
        const prompt = `Generate a Grade 11 Math ${questionType.toUpperCase()} question for ${examType.topics.join(', ')} with difficulty ${examType.difficulty}.
        
        For MCQ: Return JSON with text, options array, correctAnswer, and marks.
        For written: Return JSON with text, expectedSteps array, and marks.
        
        Make it appropriate for ${examType.name} level.`;
        
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
            const questionData = JSON.parse(resultText);
            questions.push({
              id: `q${i + 1}`,
              text: questionData.text || `Question ${i + 1}`,
              type: questionType,
              marks: questionData.marks || 2,
              timeLimit: Math.floor(examType.duration / examType.questionCount),
              options: questionData.options,
              correctAnswer: questionData.correctAnswer,
              expectedSteps: questionData.expectedSteps,
              topic: examType.topics[Math.floor(Math.random() * examType.topics.length)],
              difficulty: examType.difficulty
            });
          } catch {
            // Fallback question
            questions.push(getFallbackQuestion(i, questionType, examType));
          }
        } else {
          questions.push(getFallbackQuestion(i, questionType, examType));
        }
      }
    } catch (error) {
      // Generate fallback questions
      for (let i = 0; i < examType.questionCount; i++) {
        const questionType = i < examType.questionCount * 0.7 ? 'mcq' : 'written';
        questions.push(getFallbackQuestion(i, questionType, examType));
      }
    }
    
    return questions;
  };

  // Fallback questions
  const getFallbackQuestion = (index: number, type: 'mcq' | 'written', examType: ExamType): ExamQuestion => {
    const fallbackQuestions = {
      mcq: [
        {
          text: 'What is the solution to x² - 4 = 0?',
          options: ['x = ±2', 'x = ±4', 'x = 2', 'x = -2'],
          correctAnswer: 'x = ±2'
        },
        {
          text: 'If f(x) = 2x + 3, what is f(5)?',
          options: ['10', '13', '15', '17'],
          correctAnswer: '13'
        }
      ],
      written: [
        {
          text: 'Solve the quadratic equation: x² - 9 = 0',
          expectedSteps: ['x² = 9', 'x = ±√9', 'x = ±3']
        },
        {
          text: 'Find the domain of the function f(x) = √(x - 2)',
          expectedSteps: ['x - 2 ≥ 0', 'x ≥ 2', 'Domain: [2, ∞)']
        }
      ]
    };
    
    const question = fallbackQuestions[type][index % fallbackQuestions[type].length];
    
    return {
      id: `q${index + 1}`,
      text: question.text,
      type,
      marks: type === 'mcq' ? 1 : 3,
      timeLimit: Math.floor(examType.duration / examType.questionCount),
      options: question.options,
      correctAnswer: question.correctAnswer,
      expectedSteps: question.expectedSteps,
      topic: examType.topics[0],
      difficulty: examType.difficulty
    };
  };

  // Start exam
  const startExam = async () => {
    if (!selectedExamType) return;
    
    const questions = await generateExamQuestions(selectedExamType);
    
    const session: ExamSession = {
      id: Date.now().toString(),
      examType: selectedExamType.name,
      startTime: new Date(),
      totalTime: selectedExamType.duration,
      questions,
      answers: [],
      performance: {
        totalMarks: selectedExamType.totalMarks,
        obtainedMarks: 0,
        accuracy: 0,
        averageTime: 0,
        timeManagement: 0,
        topicPerformance: {}
      }
    };
    
    setCurrentSession(session);
    setExamPhase('exam');
    setTimeRemaining(selectedExamType.duration * 60); // Convert to seconds
    setExamStartTime(new Date());
    setQuestionStartTime(new Date());
  };

  // Submit answer
  const submitAnswer = () => {
    if (!currentSession || !questionStartTime) return;
    
    const currentQuestion = currentSession.questions[currentQuestionIndex];
    const timeSpent = (new Date().getTime() - questionStartTime.getTime()) / 1000;
    const answer = currentQuestion.type === 'mcq' 
      ? selectedOption !== null ? currentQuestion.options?.[selectedOption] || '' : ''
      : currentAnswer;
    
    if (!answer.trim()) {
      toast({ title: 'Please provide an answer', variant: 'destructive' });
      return;
    }
    
    // Simple validation (in real app, use LLM for written answers)
    const isCorrect = currentQuestion.type === 'mcq' 
      ? answer === currentQuestion.correctAnswer
      : answer.toLowerCase().includes('correct') || Math.random() > 0.5; // Simplified
    
    const marksObtained = isCorrect ? currentQuestion.marks : 0;
    
    // Update session
    const updatedSession = {
      ...currentSession,
      answers: [...currentSession.answers, {
        questionId: currentQuestion.id,
        answer,
        timeSpent,
        isCorrect,
        marksObtained
      }],
      performance: {
        ...currentSession.performance,
        obtainedMarks: currentSession.performance.obtainedMarks + marksObtained,
        accuracy: ((currentSession.performance.obtainedMarks + marksObtained) / currentSession.performance.totalMarks) * 100,
        averageTime: (currentSession.performance.averageTime + timeSpent) / 2
      }
    };
    
    setCurrentSession(updatedSession);
    
    // Move to next question or end exam
    if (currentQuestionIndex < currentSession.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setSelectedOption(null);
      setQuestionStartTime(new Date());
    } else {
      endExam();
    }
  };

  // End exam
  const endExam = () => {
    if (!currentSession) return;
    
    const completedSession = {
      ...currentSession,
      endTime: new Date()
    };
    
    setCurrentSession(completedSession);
    setExamPhase('completed');
    
    toast({
      title: 'Exam completed!',
      description: `Score: ${completedSession.performance.obtainedMarks}/${completedSession.performance.totalMarks}`,
    });
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get revision suggestions
  const getRevisionSuggestions = (performance: ExamSession['performance']) => {
    const suggestions = [];
    
    if (performance.accuracy < 60) {
      suggestions.push('Focus on fundamental concepts and practice more basic problems');
    }
    if (performance.timeManagement < 70) {
      suggestions.push('Work on time management - practice timed mock tests');
    }
    
    const weakTopics = Object.entries(performance.topicPerformance)
      .filter(([_, stats]) => stats.accuracy < 70)
      .map(([topic, _]) => topic);
    
    if (weakTopics.length > 0) {
      suggestions.push(`Review these topics: ${weakTopics.join(', ')}`);
    }
    
    return suggestions.length > 0 ? suggestions : ['Great job! Keep practicing to maintain your performance'];
  };

  if (examPhase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-aristotle-blue">
              <FileText className="h-5 w-5" />
              Exam Paper Simulator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {EXAM_TYPES.map((examType) => (
                <Card
                  key={examType.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedExamType?.id === examType.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedExamType(examType)}
                >
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{examType.name}</h3>
                        <Badge variant="outline">{examType.difficulty}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{examType.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Duration:</span>
                          <br />
                          <span className="text-muted-foreground">{examType.duration} minutes</span>
                        </div>
                        <div>
                          <span className="font-medium">Marks:</span>
                          <br />
                          <span className="text-muted-foreground">{examType.totalMarks}</span>
                        </div>
                        <div>
                          <span className="font-medium">Questions:</span>
                          <br />
                          <span className="text-muted-foreground">{examType.questionCount}</span>
                        </div>
                        <div>
                          <span className="font-medium">Topics:</span>
                          <br />
                          <span className="text-muted-foreground">{examType.topics.length}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              onClick={startExam}
              disabled={!selectedExamType}
              className="w-full bg-aristotle-blue hover:bg-aristotle-blue/90"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examPhase === 'exam' && currentSession) {
    const currentQuestion = currentSession.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / currentSession.questions.length) * 100;
    
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Exam Header */}
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{currentSession.examType}</h3>
                <p className="text-sm text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {currentSession.questions.length}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-2xl font-bold text-red-600">
                  <Clock className="h-6 w-6" />
                  {formatTime(timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">Time Remaining</div>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
            
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPaused(!isPaused)}
                >
                  {isPaused ? <Play className="h-4 w-4 mr-1" /> : <Pause className="h-4 w-4 mr-1" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Marks: {currentQuestion.marks}
                </span>
              </div>
              <Badge variant="outline">{currentQuestion.difficulty}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="shadow-elegant">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Question {currentQuestionIndex + 1}</span>
                <Badge variant="outline">{currentQuestion.type.toUpperCase()}</Badge>
              </div>
              <div className="text-lg leading-relaxed">{currentQuestion.text}</div>
            </div>

            {currentQuestion.type === 'mcq' ? (
              /* MCQ Options */
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedOption === index ? "default" : "outline"}
                    className="w-full justify-start h-auto p-4 text-left"
                    onClick={() => setSelectedOption(index)}
                  >
                    <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              /* Written Answer */
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Your Answer:</label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Write your solution here..."
                    className="w-full min-h-[200px] p-4 border border-input rounded-lg resize-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Time spent: {questionStartTime ? Math.floor((new Date().getTime() - questionStartTime.getTime()) / 1000) : 0}s
              </div>
              <Button
                onClick={submitAnswer}
                className="bg-aristotle-blue hover:bg-aristotle-blue/90"
                size="lg"
              >
                {currentQuestionIndex < currentSession.questions.length - 1 ? 'Next Question' : 'Finish Exam'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (examPhase === 'completed' && currentSession) {
    const performance = currentSession.performance;
    const suggestions = getRevisionSuggestions(performance);
    
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-aristotle-blue">
              <Award className="h-5 w-5" />
              Exam Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {performance.obtainedMarks}/{performance.totalMarks}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {performance.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {performance.averageTime.toFixed(1)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Time/Question</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {currentSession.answers.filter(a => a.isCorrect).length}/{currentSession.questions.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </CardContent>
              </Card>
            </div>

            {/* Revision Suggestions */}
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Revision Suggestions
                </h4>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="text-primary">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setExamPhase('setup');
                  setCurrentSession(null);
                  setCurrentQuestionIndex(0);
                  setSelectedExamType(null);
                }}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Take Another Exam
              </Button>
              <Button
                onClick={() => setShowAnswers(!showAnswers)}
                variant="outline"
                className="flex-1"
              >
                {showAnswers ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAnswers ? 'Hide' : 'View'} Answers
              </Button>
            </div>

            {/* Detailed Analysis */}
            {showAnswers && (
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-3">Detailed Analysis</h4>
                  <div className="space-y-3">
                    {currentSession.questions.map((question, index) => {
                      const answer = currentSession.answers[index];
                      return (
                        <div key={question.id} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Question {index + 1}</span>
                            <div className="flex items-center gap-2">
                              {answer?.isCorrect ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600" />
                              )}
                              <span className="text-sm">
                                {answer?.marksObtained}/{question.marks} marks
                              </span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{question.text}</p>
                          <div className="text-xs text-muted-foreground">
                            Your answer: {answer?.answer} • Time: {answer?.timeSpent.toFixed(1)}s
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}; 