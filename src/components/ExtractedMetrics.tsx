import type { ExtractedData } from "@/lib/mt5-parser";
import { cn } from "@/lib/utils";

interface ExtractedMetricsProps {
  data: ExtractedData;
  className?: string;
}

function MetricValue({ value, suffix = '' }: { value: number | null; suffix?: string }) {
  if (value === null) {
    return <span className="text-muted-foreground/50">—</span>;
  }
  const formatted = typeof value === 'number' ? 
    (Math.abs(value) >= 1000 ? value.toFixed(0) : value.toFixed(2)) : value;
  return <span className="font-mono text-foreground">{formatted}{suffix}</span>;
}

function MetricRow({ label, value, suffix = '' }: { 
  label: string; 
  value: number | null; 
  suffix?: string;
}) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-border/30 last:border-0">
      <span className="text-muted-foreground text-sm">{label}</span>
      <MetricValue value={value} suffix={suffix} />
    </div>
  );
}

function MetricCard({ title, children, delay = 0 }: { 
  title: string; 
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <div 
      className="p-5 rounded-xl bg-card border border-border/50 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <h3 className="text-xs font-medium uppercase tracking-[0.15em] text-primary mb-4">
        {title}
      </h3>
      <div className="space-y-0">
        {children}
      </div>
    </div>
  );
}

export function ExtractedMetrics({ data, className }: ExtractedMetricsProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      <MetricCard title="Summary" delay={0}>
        <MetricRow label="Total Trades" value={data.summary.totalTrades} />
        <MetricRow label="Win Rate" value={data.summary.winRate} suffix="%" />
        <MetricRow label="Net Profit" value={data.summary.netProfit} suffix=" USD" />
        <MetricRow label="Trades/Week" value={data.summary.tradesPerWeek} />
        <MetricRow label="Expectancy" value={data.summary.expectancy} suffix=" USD" />
      </MetricCard>

      <MetricCard title="Capital Protection" delay={50}>
        <MetricRow label="Max Drawdown" value={data.summary.maxDrawdownPct} suffix="%" />
        <MetricRow label="Recovery Factor" value={data.summary.recoveryFactor} />
        <MetricRow label="Sharpe Ratio" value={data.summary.sharpeRatio} />
        <MetricRow label="MAE Ratio" value={data.risk.maeRatio} />
      </MetricCard>

      <MetricCard title="Profitability" delay={100}>
        <MetricRow label="Profit Factor" value={data.summary.profitFactor} />
        <MetricRow label="Risk:Reward" value={data.longShort.riskRewardRatio} />
        <MetricRow label="Gross Profit" value={data.profitLoss.grossProfit} suffix=" USD" />
        <MetricRow label="Gross Loss" value={data.profitLoss.grossLoss} suffix=" USD" />
      </MetricCard>

      <MetricCard title="Win/Loss Stats" delay={150}>
        <MetricRow label="Average Win" value={data.longShort.avgWin} suffix=" USD" />
        <MetricRow label="Average Loss" value={data.longShort.avgLoss} suffix=" USD" />
        <MetricRow label="Largest Win" value={data.profitLoss.largestWin} suffix=" USD" />
        <MetricRow label="Largest Loss" value={data.profitLoss.largestLoss} suffix=" USD" />
      </MetricCard>

      <MetricCard title="Risk & Streaks" delay={200}>
        <MetricRow label="Max Consec. Wins" value={data.risk.maxConsecutiveWins} />
        <MetricRow label="Max Consec. Losses" value={data.risk.maxConsecutiveLosses} />
      </MetricCard>

      <MetricCard title="Consistency" delay={250}>
        <MetricRow label="Profitable Days" value={data.profitLoss.profitableDaysPercent} suffix="%" />
        <MetricRow label="Long Trades" value={data.longShort.longTrades} />
        <MetricRow label="Short Trades" value={data.longShort.shortTrades} />
        <div className="flex justify-between items-center py-2">
          <span className="text-muted-foreground text-sm">Daily PnL Points</span>
          <span className="font-mono text-foreground">
            {data.profitLoss.dailyPnL ? `${data.profitLoss.dailyPnL.length} days` : '—'}
          </span>
        </div>
      </MetricCard>
    </div>
  );
}