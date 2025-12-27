import type { PillarScores as PillarScoresType } from "@/lib/mt5-parser";
import { cn } from "@/lib/utils";

interface PillarScoresProps {
  scores: PillarScoresType;
  className?: string;
}

const pillars = [
  { 
    key: 'capitalProtection' as const, 
    label: 'Capital Protection', 
    max: 30, 
    icon: '🛡️',
    description: 'How well you protect your money from big losses'
  },
  { 
    key: 'tradeManagement' as const, 
    label: 'Trade Management', 
    max: 25, 
    icon: '⚖️',
    description: 'How well you manage each trade (win rate, streaks, frequency)'
  },
  { 
    key: 'profitability' as const, 
    label: 'Profitability', 
    max: 25, 
    icon: '📈',
    description: 'How efficient you are at making money'
  },
  { 
    key: 'consistency' as const, 
    label: 'Consistency', 
    max: 20, 
    icon: '🎯',
    description: 'How stable your results are over time'
  },
];

export function PillarScores({ scores, className }: PillarScoresProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      {pillars.map((pillar, index) => {
        const score = scores[pillar.key];
        const percentage = (score / pillar.max) * 100;
        
        return (
          <div 
            key={pillar.key} 
            className="p-4 rounded-lg bg-card border border-border animate-fade-in group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{pillar.icon}</span>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">{pillar.label}</span>
                  <span className="text-xs text-muted-foreground hidden group-hover:block">
                    {pillar.description}
                  </span>
                </div>
              </div>
              <span className="font-mono text-sm text-muted-foreground">
                {score.toFixed(1)} / {pillar.max}
              </span>
            </div>
            
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  percentage >= 80 ? "bg-grade-a" :
                  percentage >= 60 ? "bg-grade-b" :
                  percentage >= 40 ? "bg-grade-c" : "bg-grade-d"
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
