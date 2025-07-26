import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookOpen, 
  Lightbulb, 
  MessageCircle, 
  Link, 
  Highlighter,
  FileText,
  Upload,
  Search,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  Eye,
  Brain,
  Target,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface TextbookChapter {
  id: string;
  title: string;
  content: string;
  pageNumber: number;
  topics: string[];
  difficulty: 'easy' | 'medium' | 'advanced';
}

interface Highlight {
  id: string;
  text: string;
  explanation: string;
  timestamp: Date;
  chapterId: string;
  pageNumber: number;
}

interface Note {
  id: string;
  text: string;
  timestamp: Date;
  chapterId: string;
  pageNumber: number;
}

interface ReadingSession {
  id: string;
  chapterId: string;
  startTime: Date;
  endTime?: Date;
  highlights: Highlight[];
  notes: Note[];
  timeSpent: number;
  pagesRead: number;
}

// Sample NCERT Grade 11 Math chapters
const NCERT_CHAPTERS: TextbookChapter[] = [
  {
    id: 'ch1-sets',
    title: 'Chapter 1: Sets',
    content: `1.1 Introduction
Sets are used to define the concepts of relations and functions. The study of geometry, sequences, probability, etc., requires the knowledge of sets.

1.2 Sets and their Representations
A set is a well-defined collection of objects. The objects in a set are called its elements or members.

Example 1: The collection of all vowels in the English alphabet is a set.
Example 2: The collection of all natural numbers less than 10 is a set.

1.3 The Empty Set
A set which does not contain any element is called the empty set or the null set or the void set.

1.4 Finite and Infinite Sets
A set which is empty or consists of a definite number of elements is called finite otherwise, the set is called infinite.

1.5 Equal Sets
Two sets A and B are said to be equal if they have exactly the same elements and we write A = B. Otherwise, the sets are said to be unequal and we write A ≠ B.`,
    pageNumber: 1,
    topics: ['Sets', 'Venn Diagrams', 'Operations on Sets'],
    difficulty: 'easy'
  },
  {
    id: 'ch2-relations-functions',
    title: 'Chapter 2: Relations and Functions',
    content: `2.1 Introduction
The concept of the term 'relation' in mathematics has been drawn from the meaning of relation in English language, according to which two objects or quantities are related if there is a recognisable connection or link between the two objects or quantities.

2.2 Cartesian Products of Sets
Suppose A is a set of 2 colours and B is a set of 3 objects, i.e.,
A = {red, blue}and B = {b, c, s},
where b, c and s represent a particular bag, coat and shirt, respectively.

2.3 Relations
A Relation R from a non-empty set A to a non-empty set B is a subset of the cartesian product A × B. The subset is derived by describing a relationship between the first element and the second element of the ordered pairs in A × B.

2.4 Functions
A relation f from a set A to a set B is said to be a function if every element of set A has one and only one image in set B.

Example: Let A = {1, 2, 3, 4} and B = {1, 4, 9, 16, 25}. Consider the rule f(x) = x². Then, f(1) = 1, f(2) = 4, f(3) = 9, f(4) = 16.`,
    pageNumber: 15,
    topics: ['Relations', 'Functions', 'Domain', 'Range'],
    difficulty: 'medium'
  },
  {
    id: 'ch3-trigonometric-functions',
    title: 'Chapter 3: Trigonometric Functions',
    content: `3.1 Introduction
The word 'trigonometry' is derived from the Greek words 'trigon' and 'metron' and it means 'measuring the sides of a triangle'. The subject was originally developed to solve geometric problems involving triangles.

3.2 Angles
Angle is a measure of rotation of a given ray about its initial point. The original ray is called the initial side and the final position of the ray after rotation is called the terminal side of the angle.

3.3 Trigonometric Functions
In earlier classes, we have studied trigonometric ratios for acute angles as the ratio of sides of a right angled triangle. We will now extend the definition of trigonometric ratios to any angle in terms of radian measure and study them as trigonometric functions.

3.4 Trigonometric Functions of Sum and Difference of Two Angles
In this Section, we shall derive expressions for trigonometric functions of the sum and difference of two angles (A + B) and (A – B) in terms of the trigonometric functions of A and B.

Example: cos (A + B) = cos A cos B – sin A sin B
         sin (A + B) = sin A cos B + cos A sin B`,
    pageNumber: 35,
    topics: ['Trigonometric Ratios', 'Identities', 'Equations'],
    difficulty: 'advanced'
  }
];

export const SmartTextbookReader = () => {
  const { toast } = useToast();
  const [currentChapter, setCurrentChapter] = useState<TextbookChapter>(NCERT_CHAPTERS[0]);
  const [selectedText, setSelectedText] = useState('');
  const [explanation, setExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [currentSession, setCurrentSession] = useState<ReadingSession | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [readingProgress, setReadingProgress] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(200); // words per minute

  // Start reading session
  const startReadingSession = () => {
    const session: ReadingSession = {
      id: Date.now().toString(),
      chapterId: currentChapter.id,
      startTime: new Date(),
      highlights: [],
      notes: [],
      timeSpent: 0,
      pagesRead: 1
    };
    setCurrentSession(session);
    setIsReading(true);
  };

  // Get AI explanation for selected text
  const getExplanation = async (text: string) => {
    if (!text.trim()) return;
    
    setIsExplaining(true);
    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    try {
      const prompt = `Explain this NCERT Grade 11 Math concept in simple terms: "${text}"
      
      Provide:
      1. Simple explanation
      2. Key points to remember
      3. Related concepts from previous chapters
      4. Example if applicable
      
      Format as JSON: {explanation, keyPoints, relatedConcepts, example}`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      
      if (!response.ok) throw new Error('Failed to get explanation');
      
      const data = await response.json();
      const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      try {
        const result = JSON.parse(resultText);
        setExplanation(result.explanation || 'Explanation not available');
        
        // Save highlight
        const highlight: Highlight = {
          id: Date.now().toString(),
          text,
          explanation: result.explanation,
          timestamp: new Date(),
          chapterId: currentChapter.id,
          pageNumber: currentChapter.pageNumber
        };
        setHighlights(prev => [...prev, highlight]);
        
        toast({
          title: 'Explanation generated!',
          description: 'Check the explanation panel for details.',
        });
      } catch {
        setExplanation('Explanation generated successfully!');
      }
    } catch (error) {
      setExplanation('Unable to generate explanation. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to get AI explanation.',
        variant: 'destructive'
      });
    } finally {
      setIsExplaining(false);
    }
  };

  // Handle text selection
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setSelectedText(selectedText);
      getExplanation(selectedText);
    }
  };

  // Add note
  const addNote = () => {
    if (!newNote.trim()) return;
    
    const note: Note = {
      id: Date.now().toString(),
      text: newNote,
      timestamp: new Date(),
      chapterId: currentChapter.id,
      pageNumber: currentChapter.pageNumber
    };
    
    setNotes(prev => [...prev, note]);
    setNewNote('');
    
    toast({
      title: 'Note added!',
      description: 'Your note has been saved.',
    });
  };

  // Navigate to next/previous chapter
  const navigateChapter = (direction: 'next' | 'prev') => {
    const currentIndex = NCERT_CHAPTERS.findIndex(ch => ch.id === currentChapter.id);
    if (direction === 'next' && currentIndex < NCERT_CHAPTERS.length - 1) {
      setCurrentChapter(NCERT_CHAPTERS[currentIndex + 1]);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentChapter(NCERT_CHAPTERS[currentIndex - 1]);
    }
  };

  // Search in textbook
  const searchInTextbook = (query: string) => {
    if (!query.trim()) return;
    
    const results = NCERT_CHAPTERS.filter(chapter => 
      chapter.content.toLowerCase().includes(query.toLowerCase()) ||
      chapter.title.toLowerCase().includes(query.toLowerCase())
    );
    
    if (results.length > 0) {
      setCurrentChapter(results[0]);
      toast({
        title: 'Search result found!',
        description: `Found in ${results[0].title}`,
      });
    } else {
      toast({
        title: 'No results found',
        description: 'Try a different search term.',
        variant: 'destructive'
      });
    }
  };

  // Calculate reading progress
  useEffect(() => {
    if (currentSession) {
      const totalChapters = NCERT_CHAPTERS.length;
      const currentIndex = NCERT_CHAPTERS.findIndex(ch => ch.id === currentChapter.id);
      const progress = ((currentIndex + 1) / totalChapters) * 100;
      setReadingProgress(progress);
    }
  }, [currentChapter, currentSession]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="shadow-elegant">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-aristotle-blue">
                <BookOpen className="h-5 w-5" />
                Smart NCERT Textbook Reader
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Interactive reading with AI-powered explanations
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{currentChapter.difficulty}</Badge>
              <Badge variant="outline">Page {currentChapter.pageNumber}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Navigation and Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateChapter('prev')}
                disabled={NCERT_CHAPTERS.findIndex(ch => ch.id === currentChapter.id) === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateChapter('next')}
                disabled={NCERT_CHAPTERS.findIndex(ch => ch.id === currentChapter.id) === NCERT_CHAPTERS.length - 1}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNotes(!showNotes)}
              >
                <FileText className="h-4 w-4 mr-1" />
                Notes ({notes.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startReadingSession}
                disabled={isReading}
              >
                <Play className="h-4 w-4 mr-1" />
                Start Reading
              </Button>
            </div>
          </div>
          
          {/* Reading Progress */}
          {isReading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Reading Progress</span>
                <span>{readingProgress.toFixed(1)}%</span>
              </div>
              <Progress value={readingProgress} />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Reading Area */}
        <div className="lg:col-span-2 space-y-4">
          {/* Chapter Content */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="text-aristotle-blue">{currentChapter.title}</CardTitle>
              <div className="flex items-center gap-2">
                {currentChapter.topics.map((topic, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="prose prose-sm max-w-none leading-relaxed"
                onMouseUp={handleTextSelection}
                style={{ 
                  userSelect: 'text',
                  cursor: 'text',
                  lineHeight: '1.8',
                  fontSize: '16px'
                }}
              >
                {currentChapter.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-4">
                    {paragraph}
                  </p>
                ))}
              </div>
              
              {/* Reading Instructions */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900 mb-1">💡 How to use Smart Reading:</p>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• <strong>Highlight any text</strong> to get instant AI explanation</li>
                      <li>• <strong>Click "Start Reading"</strong> to track your progress</li>
                      <li>• <strong>Add notes</strong> for important concepts</li>
                      <li>• <strong>Search</strong> for specific topics across chapters</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search Textbook</label>
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for topics..."
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={() => searchInTextbook(searchQuery)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Note */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Add Note</label>
                  <div className="space-y-2">
                    <Textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Write your note here..."
                      className="min-h-[80px] resize-none"
                    />
                    <Button
                      size="sm"
                      onClick={addNote}
                      disabled={!newNote.trim()}
                    >
                      Add Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Explanation Panel */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-aristotle-blue">
                <Brain className="h-5 w-5" />
                AI Explanation
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isExplaining ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Generating explanation...
                </div>
              ) : explanation ? (
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-900 mb-1">Selected Text:</p>
                    <p className="text-sm text-green-800 italic">"{selectedText}"</p>
                  </div>
                  <div className="prose prose-sm">
                    <p>{explanation}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Highlight any text to get AI explanation</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Highlights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Highlighter className="h-5 w-5" />
                Highlights ({highlights.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {highlights.length > 0 ? (
                  highlights.map((highlight) => (
                    <div key={highlight.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-sm font-medium text-yellow-900 mb-1">
                        "{highlight.text}"
                      </p>
                      <p className="text-xs text-yellow-800 line-clamp-2">
                        {highlight.explanation}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {highlight.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No highlights yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes Panel */}
          {showNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Notes ({notes.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {notes.length > 0 ? (
                    notes.map((note) => (
                      <div key={note.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-900">{note.text}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {note.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No notes yet
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}; 