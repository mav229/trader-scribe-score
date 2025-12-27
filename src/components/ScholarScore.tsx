import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

interface ScholarScoreProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  className?: string;
}

export function ScholarScore({ score, grade, className }: ScholarScoreProps) {
  const gradeColors = {
    A: 'text-grade-a',
    B: 'text-grade-b',
    C: 'text-grade-c',
    D: 'text-grade-d',
  };

  const gradeBg = {
    A: 'bg-grade-a/10 border-grade-a/30',
    B: 'bg-grade-b/10 border-grade-b/30',
    C: 'bg-grade-c/10 border-grade-c/30',
    D: 'bg-grade-d/10 border-grade-d/30',
  };

  // Calculate arc percentage for the score gauge
  const percentage = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Graduation Cap with Animation */}
      <div className="relative mb-6 animate-float">
        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-xl" />
        <GraduationCap className="w-16 h-16 text-primary relative z-10" strokeWidth={1.5} />
      </div>

      {/* Score Circle */}
      <div className="relative w-44 h-44">
        {/* Background arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="88"
            cy="88"
            r="54"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference * 0.75}
            strokeDashoffset={0}
          />
        </svg>
        
        {/* Score arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="88"
            cy="88"
            r="54"
            fill="none"
            stroke={`hsl(var(--grade-${grade.toLowerCase()}))`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference * 0.75}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px hsl(var(--grade-${grade.toLowerCase()}) / 0.5))` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-5xl font-light tracking-tight", gradeColors[grade])}>
            {score}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Score
          </span>
        </div>
      </div>

      {/* Grade Badge */}
      <div 
        className={cn(
          "mt-6 px-8 py-2 rounded-full border font-medium text-lg tracking-wide",
          "transition-all duration-300",
          gradeBg[grade],
          gradeColors[grade]
        )}
      >
        Grade {grade}
      </div>
    </div>
  );
}