import { cn } from "@/lib/utils";
import { TrendingDown, Shield, AlertTriangle, Zap } from "lucide-react";

interface DrawdownVelocityProps {
  maxDrawdown: number | null;
  recoveryFactor: number | null;
  className?: string;
}

type VelocityRating = 'controlled' | 'moderate' | 'fast' | 'crash';

interface VelocityZone {
  rating: VelocityRating;
  label: string;
  threshold: number;
  icon: React.ReactNode;
}

const velocityZones: VelocityZone[] = [
  { rating: 'controlled', label: 'Controlled', threshold: 5, icon: <Shield className="w-3 h-3" /> },
  { rating: 'moderate', label: 'Moderate', threshold: 15, icon: <TrendingDown className="w-3 h-3" /> },
  { rating: 'fast', label: 'Fast', threshold: 30, icon: <AlertTriangle className="w-3 h-3" /> },
  { rating: 'crash', label: 'Crash', threshold: 100, icon: <Zap className="w-3 h-3" /> },
];

function getVelocityRating(maxDrawdown: number | null, recoveryFactor: number | null): { rating: VelocityRating; value: number } {
  if (maxDrawdown === null || maxDrawdown === 0) {
    return { rating: 'controlled', value: 0 };
  }
  
  // Calculate velocity score based on drawdown severity and recovery ability
  // Higher drawdown with lower recovery = faster/worse velocity
  const recoveryPenalty = recoveryFactor !== null && recoveryFactor > 0 
    ? Math.max(0, 1 - (recoveryFactor / 3)) 
    : 1;
  
  const velocityScore = maxDrawdown * (0.5 + recoveryPenalty * 0.5);
  
  if (velocityScore < 5) return { rating: 'controlled', value: velocityScore };
  if (velocityScore < 15) return { rating: 'moderate', value: velocityScore };
  if (velocityScore < 30) return { rating: 'fast', value: velocityScore };
  return { rating: 'crash', value: velocityScore };
}

export function DrawdownVelocity({ maxDrawdown, recoveryFactor, className }: DrawdownVelocityProps) {
  const { rating, value } = getVelocityRating(maxDrawdown, recoveryFactor);
  
  // Calculate position on the vertical gauge (0-100%)
  const gaugePosition = Math.min(100, (value / 40) * 100);
  
  // Get the active zone index
  const activeZoneIndex = velocityZones.findIndex(z => z.rating === rating);
  
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
          Drawdown
        </h3>
        <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60">
          Velocity
        </p>
      </div>
      
      {/* Vertical Gauge */}
      <div className="flex-1 flex gap-3">
        {/* Zone labels */}
        <div className="flex flex-col justify-between py-1">
          {[...velocityZones].reverse().map((zone, i) => {
            const isActive = zone.rating === rating;
            const reverseIndex = velocityZones.length - 1 - i;
            return (
              <div 
                key={zone.rating}
                className={cn(
                  "flex items-center gap-1.5 transition-all duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground/40"
                )}
              >
                <span className={cn(
                  "transition-all duration-300",
                  isActive && "scale-110"
                )}>
                  {zone.icon}
                </span>
                <span className="text-[9px] font-medium tracking-wide whitespace-nowrap">
                  {zone.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Gauge bar */}
        <div className="relative w-2 rounded-full bg-muted/50 overflow-hidden">
          {/* Zone segments */}
          <div className="absolute inset-0 flex flex-col-reverse">
            {velocityZones.map((zone, i) => (
              <div 
                key={zone.rating}
                className={cn(
                  "flex-1 transition-all duration-500",
                  zone.rating === 'controlled' && "bg-foreground/20",
                  zone.rating === 'moderate' && "bg-foreground/35",
                  zone.rating === 'fast' && "bg-foreground/55",
                  zone.rating === 'crash' && "bg-foreground/80",
                )}
              />
            ))}
          </div>
          
          {/* Indicator dot */}
          <div 
            className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-lg transition-all duration-700 ease-out"
            style={{ bottom: `calc(${100 - gaugePosition}% - 6px)` }}
          />
        </div>
      </div>
      
      {/* Current value */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <div className="flex items-baseline justify-between">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Max DD
          </span>
          <span className="text-sm font-medium text-foreground tabular-nums">
            {maxDrawdown !== null ? `${maxDrawdown.toFixed(1)}%` : '—'}
          </span>
        </div>
        <div className="flex items-baseline justify-between mt-1">
          <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
            Recovery
          </span>
          <span className="text-sm font-medium text-foreground tabular-nums">
            {recoveryFactor !== null ? recoveryFactor.toFixed(2) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
}
