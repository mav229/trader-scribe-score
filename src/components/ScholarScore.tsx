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
    <div className={cn("flex flex-col items-center w-48", className)}>
      {/* Graduation Cap */}
      <div className="mb-4 animate-float">
        <GraduationCap className="w-12 h-12 text-foreground" strokeWidth={1.5} />
      </div>

      {/* Score Circle */}
      <div className="relative w-36 h-36">
        {/* Background arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="72"
            cy="72"
            r="44"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44 * 0.75}
            strokeDashoffset={0}
          />
        </svg>
        
        {/* Score arc */}
        <svg className="absolute inset-0 w-full h-full -rotate-[135deg]">
          <circle
            cx="72"
            cy="72"
            r="44"
            fill="none"
            stroke="hsl(var(--foreground))"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 44 * 0.75}
            strokeDashoffset={2 * Math.PI * 44 - (percentage / 100) * 2 * Math.PI * 44 * 0.75}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-light tracking-tight text-foreground">
            {score}
          </span>
          <div className="flex flex-col items-center mt-0.5">
            <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">
              Scholar
            </span>
            <span className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground -mt-0.5">
              Score
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}