import { cn } from "@/lib/utils";

interface RadarChartProps {
  data: {
    consistency: number; // 0-100
    slUsage: number; // 0-100
    winRate: number; // 0-100
    riskReward: number; // 0-100
  };
  className?: string;
}

export function RadarChart({ data, className }: RadarChartProps) {
  const size = 200;
  const center = size / 2;
  const maxRadius = 70;
  
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
  
  return (
    <div className={cn("flex flex-col", className)}>
      <div className="relative">
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
                stroke="hsl(var(--border))"
                strokeWidth="1"
                opacity={0.3}
              />
            );
          })}
          
          {/* Axis lines */}
          <line x1={center} y1={center - maxRadius} x2={center} y2={center + maxRadius} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" />
          <line x1={center - maxRadius} y1={center} x2={center + maxRadius} y2={center} stroke="hsl(var(--border))" strokeWidth="1" opacity="0.3" />
          
          {/* Data shape */}
          <path
            d={dataPath}
            fill="hsl(var(--primary))"
            fillOpacity="0.2"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
          />
          
          {/* Data points */}
          {dataPoints.map((point, i) => (
            <circle
              key={i}
              cx={point.x}
              cy={point.y}
              r="4"
              fill="hsl(var(--primary))"
            />
          ))}
          
          {/* Center dot */}
          <circle cx={center} cy={center} r="3" fill="hsl(var(--foreground))" />
        </svg>
        
        {/* Labels */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 text-xs font-medium text-foreground">
          Consistency
        </span>
        <span className="absolute top-1/2 right-0 translate-x-4 -translate-y-1/2 text-xs font-medium text-foreground">
          SL usage
        </span>
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6 text-xs font-medium text-foreground">
          WR
        </span>
        <span className="absolute top-1/2 left-0 -translate-x-8 -translate-y-1/2 text-xs font-medium text-foreground">
          RR
        </span>
      </div>
    </div>
  );
}
