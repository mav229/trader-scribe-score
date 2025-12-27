import type { ExtractedData } from "@/lib/mt5-parser";
import { cn } from "@/lib/utils";

interface ExtractedMetricsProps {
  data: ExtractedData;
  className?: string;
}

function MetricValue({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  if (value === null) {
    return <span className="text-muted-foreground italic">—</span>;
  }
  return <span className="font-mono text-foreground">{value}{suffix}</span>;
}

function MetricRow({ label, value, suffix = '' }: { label: string; value: number | null; suffix?: string }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <MetricValue value={value} suffix={suffix} />
    </div>
  );
}

export function ExtractedMetrics({ data, className }: ExtractedMetricsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {/* Summary */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Summary
        </h3>
        <div className="space-y-1">
          <MetricRow label="Max Drawdown" value={data.summary.maxDrawdownPct} suffix="%" />
          <MetricRow label="Recovery Factor" value={data.summary.recoveryFactor} />
          <MetricRow label="Profit Factor" value={data.summary.profitFactor} />
          <MetricRow label="Trades/Week" value={data.summary.tradesPerWeek} />
          <MetricRow label="Avg Hold Time" value={data.summary.avgHoldTimeMinutes} suffix=" min" />
        </div>
      </div>

      {/* Profit & Loss */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Profit & Loss
        </h3>
        <div className="space-y-1">
          <MetricRow label="Gross Profit" value={data.profitLoss.grossProfit} suffix=" USD" />
          <MetricRow label="Gross Loss" value={data.profitLoss.grossLoss} suffix=" USD" />
          <div className="flex justify-between items-center py-1.5">
            <span className="text-muted-foreground text-sm">Daily PnL Points</span>
            <span className="font-mono text-foreground">
              {data.profitLoss.dailyPnL ? `${data.profitLoss.dailyPnL.length} days` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Long & Short */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Long & Short
        </h3>
        <div className="space-y-1">
          <MetricRow label="Avg Win" value={data.longShort.avgWin} suffix=" USD" />
          <MetricRow label="Avg Loss" value={data.longShort.avgLoss} suffix=" USD" />
          <MetricRow label="Long Trades" value={data.longShort.longTrades} />
          <MetricRow label="Short Trades" value={data.longShort.shortTrades} />
        </div>
      </div>

      {/* Risk */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Risk Metrics
        </h3>
        <div className="space-y-1">
          <MetricRow label="Max Consec. Losses" value={data.risk.maxConsecutiveLosses} />
          <MetricRow label="MFE" value={data.risk.mfe} suffix="%" />
          <MetricRow label="MAE" value={data.risk.mae} suffix="%" />
        </div>
      </div>

      {/* Symbols */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in md:col-span-2 lg:col-span-2" style={{ animationDelay: '400ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Symbol Concentration
        </h3>
        {data.symbols.concentration && data.symbols.concentration.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.symbols.concentration.map((sym, i) => (
              <div 
                key={i}
                className="px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm font-mono"
              >
                {sym.symbol}: {sym.percent.toFixed(1)}%
              </div>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground italic text-sm">No symbol data available</span>
        )}
      </div>
    </div>
  );
}
