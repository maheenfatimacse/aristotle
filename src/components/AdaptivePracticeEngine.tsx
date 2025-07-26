import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Target,
  TrendingUp,
  Brain,
  PenTool,
  CheckSquare,
  BarChart3,
  RotateCcw,
  Play,
  Pause
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'written';
  difficulty: 'easy' | 'medium' | 'advanced';
  topic: string;
  options?: string[]; // for MCQ
  correctAnswer?: string; // for MCQ
  expectedSteps?: string[]; // for written problems
}

interface PracticeSession {
  id: string;
  topic: string;
  questionType: 'mcq' | 'written';
  startTime: Date;
  endTime?: Date;
  questions: Question[];
  answers: Array<{
    questionId: string;
    answer: string;
    isCorrect: boolean;
    timeSpent: number;
    difficulty: string;
  }>;
  performance: {
    totalQuestions: number;
    correctAnswers: number;
    averageTime: number;
    accuracy: number;
    difficultyProgression: string[];
  };
}

interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'advanced';
  questionCount: number;
}

const GRADE_11_MATH_TOPICS: Topic[] = [
  {
    id: 'quadratic-equations',
    name: 'Quadratic Equations',
    description: 'Solving quadratic equations using factoring, completing the square, and quadratic formula',
    difficulty: 'medium',
    questionCount: 15
  },
  {
    id: 'linear-systems',
    name: 'Linear Systems',
    description: 'Solving systems of linear equations using substitution, elimination, and graphing',
    difficulty: 'easy',
    questionCount: 12
  },
  {
    id: 'trigonometry',
    name: 'Trigonometry',
    description: 'Trigonometric ratios, identities, and solving trigonometric equations',
    difficulty: 'advanced',
    questionCount: 18
  },
  {
    id: 'functions',
    name: 'Functions',
    description: 'Function notation, domain, range, and transformations',
    difficulty: 'medium',
    questionCount: 14
  },
  {
    id: 'probability',
    name: 'Probability',
    description: 'Basic probability, permutations, combinations, and probability distributions',
    difficulty: 'medium',
    questionCount: 16
  }
];

export const AdaptivePracticeEngine = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // State management
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [questionType, setQuestionType] = useState<'mcq' | 'written'>('mcq');
  const [currentSession, setCurrentSession] = useState<PracticeSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState<Date | null>(null);
  const [sessionPhase, setSessionPhase] = useState<'setup' | 'practicing' | 'completed'>('setup');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'advanced'>('easy');
  const [performance, setPerformance] = useState({
    correct: 0,
    total: 0,
    averageTime: 0,
    currentStreak: 0
  });

  // Generate question using LLM
  const generateQuestion = async (topic: string, difficulty: string, type: 'mcq' | 'written'): Promise<Question> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const prompt = `Generate a Grade 11 Math ${type.toUpperCase()} question for the topic: ${topic} with difficulty: ${difficulty}. 
    For MCQ: Return JSON with text, options array, and correctAnswer.
    For written: Return JSON with text and expectedSteps array.
    Make it challenging but appropriate for Grade 11 level.`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (!response.ok) throw new Error('Failed to generate question');
      
      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // Parse the LLM response (assuming it returns JSON)
      const questionData = JSON.parse(generatedText);
      
      return {
        id: Date.now().toString(),
        text: questionData.text,
        type,
        difficulty: difficulty as 'easy' | 'medium' | 'advanced',
        topic,
        options: questionData.options,
        correctAnswer: questionData.correctAnswer,
        expectedSteps: questionData.expectedSteps
      };
    } catch (error) {
      // Fallback to predefined questions
      return getFallbackQuestion(topic, difficulty, type);
    }
  };

  // Fallback questions if LLM fails
  const getFallbackQuestion = (topic: string, difficulty: string, type: 'mcq' | 'written'): Question => {
    const fallbackQuestions = {
      'quadratic-equations': {
        easy: {
          mcq: {
            text: 'What is the solution to x² - 4 = 0?',
            options: ['x = ±2', 'x = ±4', 'x = 2', 'x = -2'],
            correctAnswer: 'x = ±2'
          },
          written: {
            text: 'Solve the quadratic equation: x² - 9 = 0',
            expectedSteps: ['x² = 9', 'x = ±√9', 'x = ±3']
          }
        }
      }
    };
    
    const question = fallbackQuestions[topic as keyof typeof fallbackQuestions]?.[difficulty as keyof typeof fallbackQuestions]?.[type];
    
    return {
      id: Date.now().toString(),
      text: question?.text || 'Solve: 2x + 3 = 7',
      type,
      difficulty: difficulty as 'easy' | 'medium' | 'advanced',
      topic,
      options: question?.options,
      correctAnswer: question?.correctAnswer,
      expectedSteps: question?.expectedSteps
    };
  };

  // Validate answer using LLM (same as whiteboard)
  const validateAnswer = async (question: Question, answer: string): Promise<{
    isCorrect: boolean;
    feedback: string;
    explanation: string;
  }> => {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    const prompt = `Question: ${question.text}
    Student's answer: ${answer}
    Correct answer: ${question.correctAnswer || question.expectedSteps?.join(', ')}
    Is the student's answer correct? Provide feedback and explanation. Return JSON: {isCorrect: boolean, feedback: string, explanation: string}`;
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (!response.ok) throw new Error('Failed to validate answer');
      
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      return JSON.parse(resultText);
    } catch (error) {
      // Simple fallback validation
      const isCorrect = question.type === 'mcq' 
        ? answer === question.correctAnswer
        : answer.toLowerCase().includes('correct');
      
      return {
        isCorrect,
        feedback: isCorrect ? 'Great job!' : 'Try again!',
        explanation: 'Check your work carefully.'
      };
    }
  };

  // Start practice session
  const startSession = async () => {
    if (!selectedTopic) return;
    
    const session: PracticeSession = {
      id: Date.now().toString(),
      topic: selectedTopic.name,
      questionType,
      startTime: new Date(),
      questions: [],
      answers: [],
      performance: {
        totalQuestions: 0,
        correctAnswers: 0,
        averageTime: 0,
        accuracy: 0,
        difficultyProgression: []
      }
    };
    
    setCurrentSession(session);
    setSessionPhase('practicing');
    
    // Generate first question
    const firstQuestion = await generateQuestion(selectedTopic.id, difficulty, questionType);
    setCurrentQuestion(firstQuestion);
    setQuestionStartTime(new Date());
  };

  // Submit answer
  const submitAnswer = async () => {
    if (!currentQuestion || !currentSession || !questionStartTime) return;
    
    const timeSpent = (new Date().getTime() - questionStartTime.getTime()) / 1000;
    const answer = questionType === 'mcq' 
      ? selectedOption !== null ? currentQuestion.options?.[selectedOption] || '' : ''
      : currentAnswer;
    
    if (!answer.trim()) {
      toast({ title: 'Please provide an answer', variant: 'destructive' });
      return;
    }
    
    // Validate answer
    const validation = await validateAnswer(currentQuestion, answer);
    
    // Update session
    const updatedSession = {
      ...currentSession,
      questions: [...currentSession.questions, currentQuestion],
      answers: [...currentSession.answers, {
        questionId: currentQuestion.id,
        answer,
        isCorrect: validation.isCorrect,
        timeSpent,
        difficulty
      }],
      performance: {
        ...currentSession.performance,
        totalQuestions: currentSession.performance.totalQuestions + 1,
        correctAnswers: currentSession.performance.correctAnswers + (validation.isCorrect ? 1 : 0),
        averageTime: (currentSession.performance.averageTime + timeSpent) / 2,
        accuracy: ((currentSession.performance.correctAnswers + (validation.isCorrect ? 1 : 0)) / (currentSession.performance.totalQuestions + 1)) * 100,
        difficultyProgression: [...currentSession.performance.difficultyProgression, difficulty]
      }
    };
    
    setCurrentSession(updatedSession);
    setPerformance({
      correct: updatedSession.performance.correctAnswers,
      total: updatedSession.performance.totalQuestions,
      averageTime: updatedSession.performance.averageTime,
      currentStreak: validation.isCorrect ? performance.currentStreak + 1 : 0
    });
    
    // Show feedback
    toast({
      title: validation.isCorrect ? 'Correct!' : 'Incorrect',
      description: validation.feedback,
      variant: validation.isCorrect ? 'default' : 'destructive'
    });
    
    // Adapt difficulty based on performance
    const accuracy = updatedSession.performance.accuracy;
    if (accuracy > 80 && difficulty !== 'advanced') {
      setDifficulty('advanced');
    } else if (accuracy < 60 && difficulty !== 'easy') {
      setDifficulty('easy');
    }
    
    // Generate next question or end session
    if (updatedSession.performance.totalQuestions >= 10) {
      endSession(updatedSession);
    } else {
      const nextQuestion = await generateQuestion(selectedTopic!.id, difficulty, questionType);
      setCurrentQuestion(nextQuestion);
      setQuestionStartTime(new Date());
      setCurrentAnswer('');
      setSelectedOption(null);
    }
  };

  // End session
  const endSession = (session: PracticeSession) => {
    const completedSession = {
      ...session,
      endTime: new Date()
    };
    
    setCurrentSession(completedSession);
    setSessionPhase('completed');
    
    toast({
      title: 'Practice session completed!',
      description: `Accuracy: ${session.performance.accuracy.toFixed(1)}%`,
    });
  };

  // Canvas drawing for written problems
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  useEffect(() => {
    setupCanvas();
  }, []);

  if (sessionPhase === 'setup') {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-aristotle-blue">
              <Brain className="h-5 w-5" />
              Adaptive Practice Engine
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Topic Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Choose a Topic</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {GRADE_11_MATH_TOPICS.map((topic) => (
                  <Card
                    key={topic.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTopic?.id === topic.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTopic(topic)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{topic.name}</h4>
                        <p className="text-sm text-muted-foreground">{topic.description}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{topic.difficulty}</Badge>
                          <span className="text-sm text-muted-foreground">{topic.questionCount} questions</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Question Type Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Choose Question Type</h3>
              <div className="flex gap-4">
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md flex-1",
                    questionType === 'mcq' && "ring-2 ring-primary"
                  )}
                  onClick={() => setQuestionType('mcq')}
                >
                  <CardContent className="p-4 text-center">
                    <CheckSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold">Multiple Choice</h4>
                    <p className="text-sm text-muted-foreground">Quick practice with options</p>
                  </CardContent>
                </Card>
                <Card
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md flex-1",
                    questionType === 'written' && "ring-2 ring-primary"
                  )}
                  onClick={() => setQuestionType('written')}
                >
                  <CardContent className="p-4 text-center">
                    <PenTool className="h-8 w-8 mx-auto mb-2 text-primary" />
                    <h4 className="font-semibold">Written Problems</h4>
                    <p className="text-sm text-muted-foreground">Step-by-step solutions</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={startSession}
              disabled={!selectedTopic}
              className="w-full bg-aristotle-blue hover:bg-aristotle-blue/90"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Practice Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionPhase === 'practicing' && currentQuestion) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Progress Header */}
        <Card className="shadow-elegant">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold">{selectedTopic?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Question {performance.total + 1} of 10 • {questionType.toUpperCase()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{performance.correct}</div>
                <div className="text-sm text-muted-foreground">Correct</div>
              </div>
            </div>
            <Progress value={(performance.total / 10) * 100} className="mt-4" />
          </CardContent>
        </Card>

        {/* Question */}
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-aristotle-blue">Question {performance.total + 1}</CardTitle>
              <Badge variant="outline">{difficulty}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-lg">{currentQuestion.text}</div>

            {questionType === 'mcq' ? (
              /* MCQ Options */
              <div className="space-y-2">
                {currentQuestion.options?.map((option, index) => (
                  <Button
                    key={index}
                    variant={selectedOption === index ? "default" : "outline"}
                    className="w-full justify-start h-auto p-4"
                    onClick={() => setSelectedOption(index)}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              /* Written Answer Area */
              <div className="space-y-4">
                <div className="border border-border rounded-lg p-4">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    className="w-full h-auto cursor-crosshair border border-input rounded"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Or type your answer:</label>
                  <textarea
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    placeholder="Type your solution here..."
                    className="w-full min-h-[100px] p-3 border border-input rounded-lg resize-none"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={submitAnswer}
              className="w-full bg-aristotle-blue hover:bg-aristotle-blue/90"
              size="lg"
            >
              Submit Answer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionPhase === 'completed' && currentSession) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-aristotle-blue">
              <BarChart3 className="h-5 w-5" />
              Practice Session Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-primary">
                    {currentSession.performance.accuracy.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Accuracy</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {currentSession.performance.correctAnswers}/{currentSession.performance.totalQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">Correct Answers</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {currentSession.performance.averageTime.toFixed(1)}s
                  </div>
                  <div className="text-sm text-muted-foreground">Avg. Time</div>
                </CardContent>
              </Card>
            </div>

            {/* Difficulty Progression */}
            <div className="space-y-3">
              <h4 className="font-semibold">Difficulty Progression</h4>
              <div className="flex gap-2">
                {currentSession.performance.difficultyProgression.map((diff, index) => (
                  <Badge
                    key={index}
                    variant={diff === 'easy' ? 'default' : diff === 'medium' ? 'secondary' : 'destructive'}
                  >
                    {diff}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setSessionPhase('setup');
                  setCurrentSession(null);
                  setPerformance({ correct: 0, total: 0, averageTime: 0, currentStreak: 0 });
                }}
                className="flex-1"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Practice Again
              </Button>
              <Button
                onClick={() => {
                  setSessionPhase('setup');
                  setCurrentSession(null);
                  setSelectedTopic(null);
                  setPerformance({ correct: 0, total: 0, averageTime: 0, currentStreak: 0 });
                }}
                variant="outline"
                className="flex-1"
              >
                Choose Different Topic
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}; 