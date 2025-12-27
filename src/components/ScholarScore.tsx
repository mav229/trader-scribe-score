import { cn } from "@/lib/utils";

interface ScholarScoreProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D';
  className?: string;
}

export function ScholarScore({ score, grade, className }: ScholarScoreProps) {
  const gradeColors = {
    A: 'text-grade-a border-grade-a bg-grade-a/10',
    B: 'text-grade-b border-grade-b bg-grade-b/10',
    C: 'text-grade-c border-grade-c bg-grade-c/10',
    D: 'text-grade-d border-grade-d bg-grade-d/10',
  };

  const gradeGlow = {
    A: 'shadow-[0_0_40px_hsl(142_70%_45%/0.3)]',
    B: 'shadow-[0_0_40px_hsl(200_80%_50%/0.3)]',
    C: 'shadow-[0_0_40px_hsl(45_93%_58%/0.3)]',
    D: 'shadow-[0_0_40px_hsl(0_72%_51%/0.3)]',
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div 
        className={cn(
          "relative w-40 h-40 rounded-full border-4 flex items-center justify-center",
          "transition-all duration-500 animate-scale-in",
          gradeColors[grade],
          gradeGlow[grade]
        )}
      >
        <div className="text-center">
          <div className="text-5xl font-bold font-mono">{score}</div>
          <div className="text-sm text-muted-foreground uppercase tracking-wider">Score</div>
        </div>
      </div>
      
      <div 
        className={cn(
          "px-6 py-2 rounded-full border-2 font-bold text-2xl",
          gradeColors[grade]
        )}
      >
        Grade {grade}
      </div>
    </div>
  );
}
