import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Brain, User, Settings, LogOut } from "lucide-react";

interface HeaderProps {
  studentName?: string;
  onAuthAction: () => void;
  isAuthenticated: boolean;
}

export const Header = ({ studentName, onAuthAction, isAuthenticated }: HeaderProps) => {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-primary">
            <Brain className="h-8 w-8" />
            <span className="text-xl font-bold">Aristotle</span>
          </div>
          <span className="text-sm text-muted-foreground">AI Tutor</span>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && studentName ? (
            <>
              <span className="text-sm text-muted-foreground">Welcome, {studentName}</span>
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Button variant="ghost" size="sm" onClick={onAuthAction}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={onAuthAction} className="bg-primary text-primary-foreground hover:bg-primary-dark">
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};