import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Target,
  BookOpen,
  Trophy,
  Calendar
} from "lucide-react";

interface DashboardData {
  studyTime: number; // minutes today
  weeklyProgress: number; // percentage
  correctSteps: number;
  totalSteps: number;
  currentStreak: number;
  conceptsLearned: number;
  recentSessions: Array<{
    id: string;
    date: string;
    duration: number;
    topic: string;
    accuracy: number;
  }>;
}

interface StudentDashboardProps {
  data: DashboardData;
}

export const StudentDashboard = ({ data }: StudentDashboardProps) => {
  const accuracy = data.totalSteps > 0 ? (data.correctSteps / data.totalSteps) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Learning Dashboard</h2>
        <Badge variant="outline" className="text-primary">
          <Calendar className="h-4 w-4 mr-1" />
          Today
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary-light to-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Study Time Today</p>
                <p className="text-2xl font-bold text-primary">{data.studyTime}m</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-success-light to-success/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold text-success">{accuracy.toFixed(0)}%</p>
              </div>
              <Target className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-accent-light to-accent/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-accent">{data.currentStreak} days</p>
              </div>
              <Trophy className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-secondary-light to-secondary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concepts Learned</p>
                <p className="text-2xl font-bold text-secondary">{data.conceptsLearned}</p>
              </div>
              <BookOpen className="h-8 w-8 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>Weekly Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Weekly Goal</span>
                <span>{data.weeklyProgress}%</span>
              </div>
              <Progress value={data.weeklyProgress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-success" />
                <span>Correct: {data.correctSteps}</span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-destructive" />
                <span>Incorrect: {data.totalSteps - data.correctSteps}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{session.topic}</p>
                    <p className="text-xs text-muted-foreground">{session.date}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={session.accuracy >= 80 ? "default" : "secondary"} className="text-xs">
                      {session.accuracy}%
                    </Badge>
                    <p className="text-xs text-muted-foreground">{session.duration}m</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-success-light rounded-lg">
              <h4 className="font-semibold text-success mb-2">Strengths</h4>
              <p className="text-sm text-foreground">Algebraic manipulation, Equation solving</p>
            </div>
            <div className="text-center p-4 bg-warning-light rounded-lg">
              <h4 className="font-semibold text-warning mb-2">Needs Practice</h4>
              <p className="text-sm text-foreground">Quadratic formula, Complex numbers</p>
            </div>
            <div className="text-center p-4 bg-primary-light rounded-lg">
              <h4 className="font-semibold text-primary mb-2">Recommended</h4>
              <p className="text-sm text-foreground">Practice factoring, Review trigonometry</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};