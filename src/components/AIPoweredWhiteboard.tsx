import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Camera, 
  Upload, 
  Check, 
  X, 
  HelpCircle, 
  Lightbulb, 
  Eraser,
  RotateCcw,
  MessageCircle,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ValidationResult {
  isCorrect: boolean;
  errorType?: 'syntax' | 'calculation' | 'conceptual';
  feedback: string;
  encouragement: string;
}

interface Step {
  id: string;
  content: string;
  validation?: ValidationResult;
  timestamp: Date;
}

interface Question {
  text: string;
  imageUrl?: string;
}

export const AIPoweredWhiteboard = () => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State management
  const [question, setQuestion] = useState<Question>({ text: "" });
  const [currentStep, setCurrentStep] = useState("");
  const [steps, setSteps] = useState<Step[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [inputMode, setInputMode] = useState<'typing' | 'handwriting'>('typing');

  // AI Validation Logic (Simulated)
  const validateStep = (step: string, questionText: string): ValidationResult => {
    const stepLower = step.toLowerCase().trim();
    const numbers = step.match(/-?\d+\.?\d*/g) || [];
    
    // Example validation for the given problem: 2x = 7 - (4)^2 + 16
    if (questionText.includes("2x = 7 - (4)^2 + 16")) {
      if (stepLower.includes("2x = 7 - 16 + 16")) {
        return {
          isCorrect: true,
          feedback: "Perfect! You correctly calculated (4)² = 16 and maintained the order of operations.",
          encouragement: "Great start! Keep going with the next step."
        };
      }
      
      if (stepLower.includes("2x = 9 + 16") || stepLower.includes("2x = 9")) {
        return {
          isCorrect: false,
          errorType: 'calculation',
          feedback: "Calculation error: 7 - 16 = -9, not 9. Remember that 7 - 16 gives a negative result.",
          encouragement: "Don't worry, calculation errors happen! Try redoing the subtraction step."
        };
      }
      
      if (stepLower.includes("2x = 7 + 16 + 16")) {
        return {
          isCorrect: false,
          errorType: 'conceptual',
          feedback: "Conceptual error: You need to calculate (4)² first, then apply the negative sign. (4)² = 16, so -(4)² = -16.",
          encouragement: "Good effort! Remember the order of operations: parentheses and exponents first."
        };
      }
    }

    // Generic validation
    if (step.length < 3) {
      return {
        isCorrect: false,
        errorType: 'syntax',
        feedback: "Please write a more complete step showing your work.",
        encouragement: "Take your time and show each calculation clearly."
      };
    }

    // Default positive response for demonstration
    return {
      isCorrect: true,
      feedback: "This step looks good! Make sure to double-check your arithmetic.",
      encouragement: "You're doing well! Continue with your solution."
    };
  };

  // Canvas drawing functions
  const setupCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = 'hsl(var(--primary))';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Draw lined paper background
        drawLinedBackground(ctx, canvas.width, canvas.height);
      }
    }
  };

  const drawLinedBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.save();
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 1;
    
    // Draw horizontal lines every 30 pixels
    for (let y = 30; y < height; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    setInputMode('handwriting');
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawLinedBackground(ctx, canvas.width, canvas.height);
      }
    }
  };

  // Step validation handler
  const handleStepValidation = () => {
    if (!currentStep.trim()) {
      toast({
        title: "Empty Step",
        description: "Please write your step before checking it.",
        variant: "destructive"
      });
      return;
    }

    const validation = validateStep(currentStep, question.text);
    const newStep: Step = {
      id: Date.now().toString(),
      content: currentStep,
      validation,
      timestamp: new Date()
    };

    setSteps(prev => [...prev, newStep]);
    setCurrentStep("");
    
    // Show feedback toast
    toast({
      title: validation.isCorrect ? "Correct Step!" : "Step Needs Revision",
      description: validation.feedback,
      variant: validation.isCorrect ? "default" : "destructive"
    });
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setQuestion(prev => ({
          ...prev,
          imageUrl: event.target?.result as string
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Progressive hints
  const getProgressiveHint = (stepNumber: number): string => {
    const hints = [
      "Start by identifying what operations need to be performed first.",
      "Remember the order of operations: parentheses, exponents, multiplication/division, addition/subtraction.",
      "Calculate (4)² first, then apply the negative sign.",
      "Work from left to right for addition and subtraction of the same precedence."
    ];
    return hints[Math.min(stepNumber, hints.length - 1)];
  };

  // [1] Add imports for image capture, VLM API call, and OCR fallback
  // [2] Add utility to capture a specific line from the canvas as an image
  const captureLineImage = (canvas: HTMLCanvasElement, lineIndex: number, lineHeight: number) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const y = lineIndex * lineHeight;
    const imageData = ctx.getImageData(0, y, canvas.width, lineHeight);
    // Create a temporary canvas to hold the line
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = lineHeight;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return null;
    tempCtx.putImageData(imageData, 0, 0);
    return tempCanvas.toDataURL('image/png');
  };

  // [3] Add VLM API call (Gemini Pro Vision or similar)
  async function validateHandwrittenStepWithVLM(imageDataUrl: string, question: string, previousSteps: string[]) {
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    // Example Gemini Pro Vision API endpoint (replace with actual endpoint)
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=' + apiKey;
    const prompt = `Extract the handwritten math step from this image and validate it as part of the following problem.\nProblem: ${question}\nPrevious steps: ${previousSteps.join(' | ')}\nReturn JSON: {extractedStep, isCorrect, errorType, feedback, encouragement}`;
    const body = {
      contents: [
        { parts: [
          { text: prompt },
          { inlineData: { mimeType: 'image/png', data: imageDataUrl.split(',')[1] } }
        ] }
      ]
    };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('VLM API error');
    const data = await response.json();
    // Parse the LLM's response (assume it returns a JSON string in the text field)
    try {
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return JSON.parse(text);
    } catch {
      throw new Error('VLM response parse error');
    }
  }

  // [4] Add OCR fallback (using Tesseract.js or similar, pseudo-code)
  async function ocrExtractTextFromImage(imageDataUrl: string) {
    // You would import Tesseract.js and use it here
    // Example: const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng');
    // For now, return a placeholder
    return 'OCR extracted step (implement with Tesseract.js)';
  }

  // [5] Refactor step submission to use VLM with OCR fallback
  const handleHandwrittenStepSubmit = async (lineIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const lineHeight = 40; // match your horizontal line spacing
    const imageDataUrl = captureLineImage(canvas, lineIndex, lineHeight);
    if (!imageDataUrl) return;
    let result;
    try {
      result = await validateHandwrittenStepWithVLM(imageDataUrl, question.text, steps.map(s => s.content));
    } catch (vlmError) {
      // Fallback to OCR
      const extractedStep = await ocrExtractTextFromImage(imageDataUrl);
      // Now validate with LLM (text-only)
      // ... call your LLM API with extractedStep, question, previousSteps ...
      result = {
        extractedStep,
        isCorrect: false,
        errorType: 'ocr-fallback',
        feedback: 'VLM failed, used OCR fallback. Please check your step.',
        encouragement: 'Try to write more clearly!'
      };
    }
    // Add the step to history
    setSteps(prev => [...prev, {
      id: Date.now().toString(),
      content: result.extractedStep,
      validation: {
        isCorrect: result.isCorrect,
        errorType: result.errorType,
        feedback: result.feedback,
        encouragement: result.encouragement
      },
      timestamp: new Date()
    }]);
    // Concept gap detection: if repeated conceptual errors, trigger concept review
    const conceptualErrors = steps.filter(s => s.validation?.errorType === 'conceptual').length;
    if (result.errorType === 'conceptual' && conceptualErrors >= 1) {
      // Show concept tutor or prompt review
      setShowExplanation(true);
    }
  };

  useEffect(() => {
    setupCanvas();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Question Input Section */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-aristotle-blue">
            <MessageCircle className="h-5 w-5" />
            Enter Your Math Problem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type your question:</label>
              <Textarea
                value={question.text}
                onChange={(e) => setQuestion(prev => ({ ...prev, text: e.target.value }))}
                placeholder="e.g., Solve: 2x = 7 - (4)² + 16"
                className="min-h-[100px] resize-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Or upload an image:</label>
              <div className="flex flex-col gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      // Camera capture using browser APIs
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                        const video = document.createElement('video');
                        video.srcObject = stream;
                        await video.play();
                        // Create a canvas to capture a frame
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = video.videoWidth;
                        tempCanvas.height = video.videoHeight;
                        const ctx = tempCanvas.getContext('2d');
                        if (ctx) {
                          ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
                          const dataUrl = tempCanvas.toDataURL('image/png');
                          setQuestion(prev => ({ ...prev, imageUrl: dataUrl }));
                        }
                        // Stop the video stream
                        stream.getTracks().forEach(track => track.stop());
                      } catch (err) {
                        toast({ title: 'Camera access denied or not available.' });
                      }
                    }}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                
                {question.imageUrl && (
                  <div className="mt-2">
                    <img 
                      src={question.imageUrl} 
                      alt="Uploaded question" 
                      className="max-w-full h-auto rounded-lg border"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {question.text && (
            <div className="p-3 bg-learning-accent/10 rounded-lg">
              <p className="text-sm font-medium text-learning-accent">Problem to solve:</p>
              <p className="text-foreground mt-1">{question.text}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Whiteboard Section */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-aristotle-blue">
              Solution Workspace
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={inputMode === 'typing' ? 'default' : 'outline'}>
                {inputMode === 'typing' ? 'Typing Mode' : 'Handwriting Mode'}
              </Badge>
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
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Lined, scrollable whiteboard area with per-line Check Step buttons */}
          {/* [Overlay visual feedback for each step directly on the whiteboard lines] */}
          <div
            className="border border-border rounded-lg bg-background p-0 overflow-x-auto overflow-y-auto"
            style={{ maxHeight: 420, minHeight: 200, position: 'relative' }}
          >
            <div style={{ position: 'relative', width: 800, height: 400 }}>
              <canvas
                ref={canvasRef}
                width={800}
                height={400}
                className="w-full h-auto cursor-crosshair border border-learning-accent/20 rounded absolute top-0 left-0 z-0"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
              {/* Render horizontal lines, Check Step buttons, and feedback overlays */}
              {Array.from({ length: 10 }).map((_, i) => {
                // Find the step for this line (if any)
                const step = steps[i];
                const isCorrect = step?.validation?.isCorrect;
                const errorType = step?.validation?.errorType;
                const feedback = step?.validation?.feedback;
                return (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: i * 40,
                      width: '100%',
                      height: 40,
                      display: 'flex',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    {/* Line highlight for feedback */}
                    {step && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          width: '100%',
                          height: 40,
                          background:
                            isCorrect === true
                              ? 'rgba(34,197,94,0.10)' // green
                              : isCorrect === false
                              ? 'rgba(239,68,68,0.10)' // red
                              : 'transparent',
                          zIndex: 1,
                          pointerEvents: 'none',
                        }}
                      />
                    )}
                    {/* Line itself */}
                    <div
                      style={{
                        borderBottom: '1px solid #d1d5db',
                        width: 'calc(100% - 120px)',
                        height: 1,
                        position: 'absolute',
                        left: 0,
                        top: 39,
                        zIndex: 2,
                        pointerEvents: 'none',
                      }}
                    />
                    {/* Feedback icon and tooltip */}
                    {step && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: 8,
                          zIndex: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          pointerEvents: 'auto',
                        }}
                        title={feedback || ''}
                      >
                        {isCorrect === true && (
                          <span style={{ color: '#22c55e', fontSize: 22 }}>✔️</span>
                        )}
                        {isCorrect === false && (
                          <span style={{ color: '#ef4444', fontSize: 22 }}>❌</span>
                        )}
                        {errorType && (
                          <span style={{ color: '#f59e42', fontSize: 14, marginLeft: 4 }}>
                            {errorType.charAt(0).toUpperCase() + errorType.slice(1)}
                          </span>
                        )}
                      </div>
                    )}
                    {/* Check Step button */}
                    <div
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: 4,
                        zIndex: 4,
                        pointerEvents: 'auto',
                      }}
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleHandwrittenStepSubmit(i)}
                        style={{ minWidth: 90 }}
                      >
                        Check Step
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Text input for typing mode */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Step {steps.length + 1}:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputMode(inputMode === 'typing' ? 'handwriting' : 'typing')}
              >
                Switch to {inputMode === 'typing' ? 'Handwriting' : 'Typing'} Mode
              </Button>
            </div>
            
            <Textarea
              value={currentStep}
              onChange={(e) => {
                setCurrentStep(e.target.value);
                setInputMode('typing');
              }}
              placeholder="Type your solution step here... (e.g., '2x = 7 - 16 + 16')"
              className="min-h-[80px] resize-none"
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHints(!showHints)}
                >
                  <HelpCircle className="h-4 w-4 mr-2" />
                  Get Hint
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExplanation(!showExplanation)}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Explain Concept
                </Button>
              </div>
              
              <Button
                onClick={handleStepValidation}
                disabled={!currentStep.trim()}
                className="bg-aristotle-blue hover:bg-aristotle-blue/90"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Check Step
              </Button>
            </div>

            {/* Hints Panel */}
            {showHints && (
              <Card className="bg-learning-hint/5 border-learning-hint/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 text-learning-hint mt-0.5" />
                    <div>
                      <p className="font-medium text-learning-hint mb-1">💡 Hint:</p>
                      <p className="text-sm text-foreground">{getProgressiveHint(steps.length)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Explanation Panel */}
            {showExplanation && (
              <Card className="bg-wisdom-green/5 border-wisdom-green/20">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-wisdom-green mt-0.5" />
                    <div>
                      <p className="font-medium text-wisdom-green mb-1">📚 Concept Explanation:</p>
                      <p className="text-sm text-foreground mb-2">
                        <strong>Order of Operations (PEMDAS/BODMAS):</strong>
                      </p>
                      <ol className="text-sm text-foreground space-y-1 ml-4">
                        <li>1. <strong>P</strong>arentheses/Brackets first</li>
                        <li>2. <strong>E</strong>xponents/Orders (powers, roots)</li>
                        <li>3. <strong>M</strong>ultiplication and <strong>D</strong>ivision (left to right)</li>
                        <li>4. <strong>A</strong>ddition and <strong>S</strong>ubtraction (left to right)</li>
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Steps History */}
      {steps.length > 0 && (
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="text-aristotle-blue">Solution Steps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <Card key={step.id} className={cn(
                  "border-l-4 transition-colors",
                  step.validation?.isCorrect 
                    ? "border-l-learning-correct bg-learning-correct/5" 
                    : "border-l-learning-incorrect bg-learning-incorrect/5"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold",
                        step.validation?.isCorrect 
                          ? "bg-learning-correct" 
                          : "bg-learning-incorrect"
                      )}>
                        {step.validation?.isCorrect ? 
                          <Check className="h-4 w-4" /> : 
                          <X className="h-4 w-4" />
                        }
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Step {index + 1}</span>
                          {step.validation?.errorType && (
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "text-xs",
                                step.validation.errorType === 'syntax' && "border-orange-500 text-orange-700",
                                step.validation.errorType === 'calculation' && "border-red-500 text-red-700",
                                step.validation.errorType === 'conceptual' && "border-purple-500 text-purple-700"
                              )}
                            >
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {step.validation.errorType === 'syntax' && 'Syntax Error'}
                              {step.validation.errorType === 'calculation' && 'Calculation Error'}
                              {step.validation.errorType === 'conceptual' && 'Conceptual Error'}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="font-mono text-foreground bg-background p-2 rounded border">
                          {step.content}
                        </div>
                        
                        {step.validation && (
                          <div className="space-y-1">
                            <p className={cn(
                              "text-sm font-medium",
                              step.validation.isCorrect ? "text-learning-correct" : "text-learning-incorrect"
                            )}>
                              {step.validation.feedback}
                            </p>
                            <p className="text-xs text-muted-foreground italic">
                              {step.validation.encouragement}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};