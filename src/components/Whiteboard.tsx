import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eraser, RotateCcw, Check, X, HelpCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: string;
  content: string;
  isCorrect?: boolean;
  feedback?: string;
  hints?: string[];
}

interface WhiteboardProps {
  onStepComplete: (step: Step) => void;
  onRequestConcept: (topic: string) => void;
}

export const Whiteboard = ({ onStepComplete, onRequestConcept }: WhiteboardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStep, setCurrentStep] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [showHint, setShowHint] = useState(false);

  // Simulate AI validation
  const validateStep = (content: string): { isCorrect: boolean; feedback: string; hints?: string[] } => {
    // This is a simplified simulation - in real implementation, this would call your AI API
    const stepLower = content.toLowerCase();
    
    if (stepLower.includes("mistake") || stepLower.includes("wrong")) {
      return {
        isCorrect: false,
        feedback: "There seems to be an error in this step. Check your calculation.",
        hints: ["Review the previous step", "Double-check your arithmetic", "Consider the order of operations"]
      };
    }
    
    if (stepLower.includes("correct") || stepLower.includes("right") || stepLower.length > 10) {
      return {
        isCorrect: true,
        feedback: "Great work! This step is correct."
      };
    }
    
    return {
      isCorrect: false,
      feedback: "Please write out your step more clearly.",
      hints: ["Show your work step by step", "Include units if applicable"]
    };
  };

  const handleStepSubmit = () => {
    if (!currentStep.trim()) return;

    const validation = validateStep(currentStep);
    const newStep: Step = {
      id: Date.now().toString(),
      content: currentStep,
      isCorrect: validation.isCorrect,
      feedback: validation.feedback,
      hints: validation.hints
    };

    setSteps(prev => [...prev, newStep]);
    onStepComplete(newStep);
    setCurrentStep("");
    setShowHint(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
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
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#2563eb';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Main Whiteboard */}
      <Card className="shadow-medium">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Problem Solving Workspace</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={clearCanvas}>
                  <Eraser className="h-4 w-4 mr-2" />
                  Clear
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSteps([])}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Canvas for drawing */}
            <div className="border border-border rounded-lg bg-background p-4">
              <canvas
                ref={canvasRef}
                width={800}
                height={300}
                className="w-full h-auto cursor-crosshair"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>

            {/* Step Input */}
            <div className="space-y-3">
              <textarea
                value={currentStep}
                onChange={(e) => setCurrentStep(e.target.value)}
                placeholder="Describe your step here... (e.g., 'First, I'll solve for x by adding 5 to both sides')"
                className="w-full min-h-[80px] p-3 border border-input rounded-lg bg-background resize-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHint(!showHint)}
                  >
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Need Help?
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRequestConcept("current topic")}
                  >
                    <Lightbulb className="h-4 w-4 mr-2" />
                    Explain Concept
                  </Button>
                </div>
                <Button
                  onClick={handleStepSubmit}
                  disabled={!currentStep.trim()}
                  className="bg-primary text-primary-foreground hover:bg-primary-dark"
                >
                  Check Step
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps History */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <Card key={step.id} className={cn(
            "border-l-4",
            step.isCorrect 
              ? "border-l-learning-correct bg-success-light/20" 
              : "border-l-learning-incorrect bg-destructive/5"
          )}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={cn(
                  "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold",
                  step.isCorrect 
                    ? "bg-learning-correct text-white" 
                    : "bg-learning-incorrect text-white"
                )}>
                  {step.isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="font-medium">Step {index + 1}</div>
                  <div className="text-foreground">{step.content}</div>
                  <div className={cn(
                    "text-sm",
                    step.isCorrect ? "text-learning-correct" : "text-learning-incorrect"
                  )}>
                    {step.feedback}
                  </div>
                  {step.hints && !step.isCorrect && showHint && (
                    <div className="mt-2 p-3 bg-learning-hint/10 rounded-lg">
                      <div className="text-sm font-medium text-learning-hint mb-1">💡 Hints:</div>
                      <ul className="text-sm text-learning-hint space-y-1">
                        {step.hints.map((hint, hintIndex) => (
                          <li key={hintIndex}>• {hint}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};