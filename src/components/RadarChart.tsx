import { cn } from "@/lib/utils";

interface RadarChartProps {
  data: {
    consistency: number; // 0-100
    slUsage: number; // 0-100
    winRate: number; // 0-100
    riskReward: number; // 0-100
  };
  size?: number;
  className?: string;
}

export function RadarChart({ data, size = 200, className }: RadarChartProps) {
  const center = size / 2;
  const maxRadius = size * 0.35;
  
  // Normalize values to 0-1 range
  const normalize = (value: number) => Math.min(Math.max(value / 100, 0), 1);
  
  const values = {
    top: normalize(data.consistency),
    right: normalize(data.slUsage),
    bottom: normalize(data.winRate),
    left: normalize(data.riskReward),
  };
  
  // Calculate points for the data shape (diamond orientation)
  const getPoint = (direction: 'top' | 'right' | 'bottom' | 'left', radius: number) => {
    const r = radius * maxRadius;
    switch (direction) {
      case 'top': return { x: center, y: center - r };
      case 'right': return { x: center + r, y: center };
      case 'bottom': return { x: center, y: center + r };
      case 'left': return { x: center - r, y: center };
    }
  };
  
  // Grid lines (concentric diamonds)
  const gridLevels = [0.25, 0.5, 0.75, 1];
  
  // Data shape path
  const dataPoints = [
    getPoint('top', values.top),
    getPoint('right', values.right),
    getPoint('bottom', values.bottom),
    getPoint('left', values.left),
  ];
  const dataPath = `M ${dataPoints[0].x} ${dataPoints[0].y} L ${dataPoints[1].x} ${dataPoints[1].y} L ${dataPoints[2].x} ${dataPoints[2].y} L ${dataPoints[3].x} ${dataPoints[3].y} Z`;
  
  const labelOffset = size * 0.15;
  
  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div className="relative" style={{ padding: labelOffset }}>
        <svg width={size} height={size} className="overflow-visible">
          {/* Grid diamonds */}
          {gridLevels.map((level, i) => {
            const points = [
              getPoint('top', level),
              getPoint('right', level),
              getPoint('bottom', level),
              getPoint('left', level),
            ];
            const path = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`;
            return (
              <path
                key={i}
                d={path}
                fill="none"
                stroke="hsl(var(--foreground))"
                strokeWidth="1"
                opacity={0.15}
              />
            );
          })}
          
          {/* Axis lines */}
          <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.15" />
          <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="hsl(var(--foreground))" strokeWidth="1" opacity="0.15" />
          
          {/* Data shape */}
          <path
            d={dataPath}
            fill="hsl(var(--foreground))"
            fillOpacity="0.08"
            stroke="hsl(var(--foreground))"
            strokeWidth="1.5"
            opacity="0.6"
          />
          
          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="3"
              fill="hsl(var(--foreground))"
              opacity="0.8"
            />
          ))}
          
          {/* Center dot */}
          <circle cx={center} cy={center} r="2" fill="hsl(var(--foreground))" opacity="0.4" />
          
          {/* Labels inside SVG for proper positioning */}
          <text 
            x={center} 
            y={center - maxRadius - 12} 
            textAnchor="middle" 
            className="fill-muted-foreground text-[10px] font-medium tracking-wide"
          >
            Consistency
          </text>
          <text 
            x={center + maxRadius + 14} 
            y={center + 3} 
            textAnchor="start" 
            className="fill-muted-foreground text-[10px] font-medium tracking-wide"
          >
            SL
          </text>
          <text 
            x={center} 
            y={center + maxRadius + 18} 
            textAnchor="middle" 
            className="fill-muted-foreground text-[10px] font-medium tracking-wide"
          >
            Win Rate
          </text>
          <text 
            x={center - maxRadius - 14} 
            y={center + 3} 
            textAnchor="end" 
            className="fill-muted-foreground text-[10px] font-medium tracking-wide"
          >
            R:R
          </text>
        </svg>
      </div>
    </div>
  );
}
