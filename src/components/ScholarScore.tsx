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
      <div className="relative mb-3 animate-float">
        <GraduationCap className="w-10 h-10 text-foreground relative z-10" strokeWidth={1.5} />
      </div>

      {/* Score Circle - Black and White */}
      <div className="relative w-28 h-28">
        {/* Background arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="56"
            cy="56"
            r="38"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38 * 0.75}
            strokeDashoffset={0}
          />
        </svg>
        
        {/* Score arc - White */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="56"
            cy="56"
            r="38"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 38 * 0.75}
            strokeDashoffset={2 * Math.PI * 38 * 0.75 - (percentage / 100) * 2 * Math.PI * 38 * 0.75}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-light tracking-tight text-foreground">
            {score}
          </span>
          <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground mt-0.5">
            Score
          </span>
        </div>
      </div>
    </div>
  );
}