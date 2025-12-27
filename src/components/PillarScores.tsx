import type { PillarScores as PillarScoresType } from "@/lib/mt5-parser";
import { cn } from "@/lib/utils";
import { Shield, Scale, TrendingUp, Target } from "lucide-react";

interface PillarScoresProps {
  scores: PillarScoresType;
  className?: string;
}

const pillars = [
  { 
    key: 'capitalProtection' as const, 
    label: 'Capital Protection', 
    max: 30, 
    Icon: Shield,
    description: 'How well you protect your money from big losses'
  },
  { 
    key: 'tradeManagement' as const, 
    label: 'Trade Management', 
    max: 25, 
    Icon: Scale,
    description: 'How well you manage each trade'
  },
  { 
    key: 'profitability' as const, 
    label: 'Profitability', 
    max: 25, 
    Icon: TrendingUp,
    description: 'How efficient you are at making money'
  },
  { 
    key: 'consistency' as const, 
    label: 'Consistency', 
    max: 20, 
    Icon: Target,
    description: 'How stable your results are over time'
  },
];

export function PillarScores({ scores, className }: PillarScoresProps) {
  return (
    <div className={cn("grid gap-3", className)}>
      {pillars.map((pillar, index) => {
        const score = scores[pillar.key];
        const percentage = (score / pillar.max) * 100;
        const Icon = pillar.Icon;
        
        // Only red if below 50%, otherwise white
        const isLow = percentage < 50;
        
        return (
          <div 
            key={pillar.key} 
            className={cn(
              "p-4 rounded-xl bg-card border border-border/50",
              "transition-all duration-300 hover:border-border",
              "animate-fade-in group"
            )}
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">{pillar.label}</span>
                  <span className="font-mono text-sm text-muted-foreground">
                    {score.toFixed(1)}<span className="text-muted-foreground/50">/{pillar.max}</span>
                  </span>
                </div>
                
                {/* Progress bar - Red if low, white otherwise */}
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      isLow ? "bg-destructive" : "bg-foreground"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}