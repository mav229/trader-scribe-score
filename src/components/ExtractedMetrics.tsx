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
  const formatted = typeof value === 'number' ? 
    (Math.abs(value) >= 1000 ? value.toFixed(0) : value.toFixed(2)) : value;
  return <span className="font-mono text-foreground">{formatted}{suffix}</span>;
}

function MetricRow({ label, value, suffix = '', description }: { 
  label: string; 
  value: number | null; 
  suffix?: string;
  description?: string;
}) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0 group">
      <div className="flex flex-col">
        <span className="text-muted-foreground text-sm">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground/70 hidden group-hover:block">{description}</span>
        )}
      </div>
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
          <MetricRow 
            label="Total Trades" 
            value={data.summary.totalTrades} 
            description="How many trades total"
          />
          <MetricRow 
            label="Win Rate" 
            value={data.summary.winRate} 
            suffix="%" 
            description="% of trades that made profit"
          />
          <MetricRow 
            label="Net Profit" 
            value={data.summary.netProfit} 
            suffix=" USD" 
            description="Total profit minus losses"
          />
          <MetricRow 
            label="Trades/Week" 
            value={data.summary.tradesPerWeek} 
            description="Average trades per week"
          />
          <MetricRow 
            label="Expectancy" 
            value={data.summary.expectancy} 
            suffix=" USD" 
            description="Average profit per trade"
          />
        </div>
      </div>

      {/* Capital Protection */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '100ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Capital Protection
        </h3>
        <div className="space-y-1">
          <MetricRow 
            label="Max Drawdown" 
            value={data.summary.maxDrawdownPct} 
            suffix="%" 
            description="Biggest drop from peak"
          />
          <MetricRow 
            label="Recovery Factor" 
            value={data.summary.recoveryFactor} 
            description="Net profit / max drawdown"
          />
          <MetricRow 
            label="Sharpe Ratio" 
            value={data.summary.sharpeRatio} 
            description="Risk-adjusted return"
          />
          <MetricRow 
            label="MAE Ratio" 
            value={data.risk.maeRatio} 
            description="How much profit lost to dips"
          />
        </div>
      </div>

      {/* Profitability */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '200ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Profitability
        </h3>
        <div className="space-y-1">
          <MetricRow 
            label="Profit Factor" 
            value={data.summary.profitFactor} 
            description="Gross profit / gross loss"
          />
          <MetricRow 
            label="Risk:Reward" 
            value={data.longShort.riskRewardRatio} 
            description="Avg win / avg loss"
          />
          <MetricRow 
            label="Gross Profit" 
            value={data.profitLoss.grossProfit} 
            suffix=" USD" 
          />
          <MetricRow 
            label="Gross Loss" 
            value={data.profitLoss.grossLoss} 
            suffix=" USD" 
          />
        </div>
      </div>

      {/* Trade Wins & Losses */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '300ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Win/Loss Stats
        </h3>
        <div className="space-y-1">
          <MetricRow 
            label="Average Win" 
            value={data.longShort.avgWin} 
            suffix=" USD" 
            description="Avg profit per winning trade"
          />
          <MetricRow 
            label="Average Loss" 
            value={data.longShort.avgLoss} 
            suffix=" USD" 
            description="Avg loss per losing trade"
          />
          <MetricRow 
            label="Largest Win" 
            value={data.profitLoss.largestWin} 
            suffix=" USD" 
          />
          <MetricRow 
            label="Largest Loss" 
            value={data.profitLoss.largestLoss} 
            suffix=" USD" 
          />
        </div>
      </div>

      {/* Risk & Streaks */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '400ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Risk & Streaks
        </h3>
        <div className="space-y-1">
          <MetricRow 
            label="Max Consec. Wins" 
            value={data.risk.maxConsecutiveWins} 
            description="Longest winning streak"
          />
          <MetricRow 
            label="Max Consec. Losses" 
            value={data.risk.maxConsecutiveLosses} 
            description="Longest losing streak"
          />
          <MetricRow 
            label="MFE" 
            value={data.risk.mfe} 
            suffix=" USD" 
            description="Max profit before closing"
          />
          <MetricRow 
            label="MAE" 
            value={data.risk.mae} 
            suffix=" USD" 
            description="Max loss before closing"
          />
        </div>
      </div>

      {/* Consistency */}
      <div className="p-4 rounded-lg bg-card border border-border animate-fade-in" style={{ animationDelay: '500ms' }}>
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <span className="text-primary">●</span>
          Consistency
        </h3>
        <div className="space-y-1">
          <MetricRow 
            label="Profitable Days" 
            value={data.profitLoss.profitableDaysPercent} 
            suffix="%" 
            description="% of days in profit"
          />
          <MetricRow 
            label="Long Trades" 
            value={data.longShort.longTrades} 
            description="Buy positions"
          />
          <MetricRow 
            label="Short Trades" 
            value={data.longShort.shortTrades} 
            description="Sell positions"
          />
          <div className="flex justify-between items-center py-1.5">
            <span className="text-muted-foreground text-sm">Daily PnL Points</span>
            <span className="font-mono text-foreground">
              {data.profitLoss.dailyPnL ? `${data.profitLoss.dailyPnL.length} days` : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
