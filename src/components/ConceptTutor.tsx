import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, BookOpen, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface ConceptTutorProps {
  topic: string;
  isVisible: boolean;
  onClose: () => void;
}

export const ConceptTutor = ({ topic, isVisible, onClose }: ConceptTutorProps) => {
  const [currentTab, setCurrentTab] = useState<'explanation' | 'quiz'>('explanation');
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  // Sample content - in real app, this would come from your AI/content system
  const conceptData = {
    title: "Quadratic Equations",
    explanation: `
      A quadratic equation is a polynomial equation of degree 2. The standard form is:
      
      **ax² + bx + c = 0**
      
      Where:
      • a, b, and c are constants (a ≠ 0)
      • x is the variable
      
      **Key Methods to Solve:**
      1. **Factoring**: When the equation can be written as (x + p)(x + q) = 0
      2. **Quadratic Formula**: x = (-b ± √(b² - 4ac)) / 2a
      3. **Completing the Square**: Converting to (x + h)² = k form
      
      **Common Mistakes:**
      ❌ Forgetting that a ≠ 0 (otherwise it's not quadratic)
      ❌ Sign errors when applying the quadratic formula
      ❌ Not checking if solutions are valid in the original context
    `,
    commonMistakes: [
      "Forgetting the ± symbol in quadratic formula",
      "Calculation errors in discriminant (b² - 4ac)",
      "Not simplifying the final answer"
    ]
  };

  const quizQuestions: Question[] = [
    {
      id: "1",
      question: "What is the discriminant of 2x² + 5x + 3 = 0?",
      options: ["1", "7", "25", "49"],
      correctAnswer: 0,
      explanation: "Discriminant = b² - 4ac = 5² - 4(2)(3) = 25 - 24 = 1"
    },
    {
      id: "2", 
      question: "Which method is best for solving x² - 9 = 0?",
      options: ["Quadratic formula", "Factoring", "Completing the square", "Graphing"],
      correctAnswer: 1,
      explanation: "This is a difference of squares: x² - 9 = (x-3)(x+3) = 0, so factoring is simplest."
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setShowResult(true);
    
    if (answerIndex === quizQuestions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setCurrentTab('explanation');
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizStarted(false);
  };

  if (!isVisible) return null;

  return (
    <Card className="shadow-strong border-learning-concept">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-learning-concept" />
            <CardTitle className="text-learning-concept">{conceptData.title}</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>×</Button>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant={currentTab === 'explanation' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTab('explanation')}
            className={currentTab === 'explanation' ? 'bg-learning-concept text-white' : ''}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Explanation
          </Button>
          <Button
            variant={currentTab === 'quiz' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCurrentTab('quiz')}
            className={currentTab === 'quiz' ? 'bg-learning-concept text-white' : ''}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Quick Quiz
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {currentTab === 'explanation' && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-line text-foreground">{conceptData.explanation}</div>
            </div>
            
            <div className="bg-warning-light p-4 rounded-lg">
              <h4 className="font-semibold text-warning mb-2">⚠️ Common Mistakes to Avoid:</h4>
              <ul className="space-y-1 text-sm">
                {conceptData.commonMistakes.map((mistake, index) => (
                  <li key={index} className="text-foreground">• {mistake}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {currentTab === 'quiz' && (
          <div className="space-y-4">
            {!quizStarted ? (
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">Test your understanding with a quick quiz!</p>
                <Button 
                  onClick={() => setQuizStarted(true)}
                  className="bg-learning-concept text-white hover:bg-learning-concept/90"
                >
                  Start Quiz ({quizQuestions.length} questions)
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">
                    Question {currentQuestion + 1} of {quizQuestions.length}
                  </Badge>
                  <Badge variant="outline">
                    Score: {score}/{quizQuestions.length}
                  </Badge>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">{quizQuestions[currentQuestion].question}</h4>
                  
                  <div className="grid gap-2">
                    {quizQuestions[currentQuestion].options.map((option, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className={cn(
                          "justify-start text-left h-auto p-3",
                          selectedAnswer === index && showResult && 
                          index === quizQuestions[currentQuestion].correctAnswer && "bg-success-light border-success",
                          selectedAnswer === index && showResult && 
                          index !== quizQuestions[currentQuestion].correctAnswer && "bg-destructive/10 border-destructive"
                        )}
                        onClick={() => !showResult && handleAnswerSelect(index)}
                        disabled={showResult}
                      >
                        <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
                        {option}
                        {showResult && index === quizQuestions[currentQuestion].correctAnswer && (
                          <CheckCircle className="ml-auto h-4 w-4 text-success" />
                        )}
                        {showResult && selectedAnswer === index && index !== quizQuestions[currentQuestion].correctAnswer && (
                          <XCircle className="ml-auto h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    ))}
                  </div>

                  {showResult && (
                    <div className="bg-primary-light p-4 rounded-lg">
                      <p className="text-sm text-foreground font-medium mb-2">Explanation:</p>
                      <p className="text-sm text-foreground">{quizQuestions[currentQuestion].explanation}</p>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={resetQuiz}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restart
                    </Button>
                    {showResult && (
                      <Button 
                        onClick={nextQuestion}
                        className="bg-learning-concept text-white hover:bg-learning-concept/90"
                      >
                        {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};