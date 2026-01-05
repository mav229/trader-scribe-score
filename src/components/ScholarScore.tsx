import { cn } from "@/lib/utils";
import { GraduationCap } from "lucide-react";

interface ScholarScoreProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  className?: string;
}

export function ScholarScore({ score, className }: ScholarScoreProps) {
  // Calculate arc percentage for the score gauge
  const percentage = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75;

  return (
    <div className={cn("flex flex-col items-center", className)}>
      {/* Graduation Cap - White */}
      <div className="relative mb-6 animate-float">
        <GraduationCap className="w-16 h-16 text-foreground relative z-10" strokeWidth={1.5} />
      </div>

      {/* Score Circle - Black and White */}
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
        
        {/* Score arc - White */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="88"
            cy="88"
            r="54"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference * 0.75}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-light tracking-tight text-foreground">
            {score}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
            Score
          </span>
        </div>
      </div>
    </div>
  );
}