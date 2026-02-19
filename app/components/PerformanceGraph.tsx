'use client'

interface PerformanceGraphProps {
  data: Array<{
    timestamp: Date
    responseTime: number
    success: boolean
  }>
  agentName: string
}

export default function PerformanceGraph({ data, agentName }: PerformanceGraphProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 bg-neutral-800 rounded-lg flex items-center justify-center">
        <p className="text-neutral-500 text-sm">No performance data available</p>
      </div>
    )
  }

  // Calculate max value for scaling
  const maxResponseTime = Math.max(...data.map(d => d.responseTime || 0))
  const scaleFactor = 150 / (maxResponseTime || 1) // 150px max height

  // Calculate positions for SVG
  const width = 600
  const height = 180
  const padding = 20
  const dataWidth = width - (padding * 2)
  const dataHeight = height - (padding * 2)
  const step = dataWidth / (data.length - 1 || 1)

  const points = data.map((d, i) => {
    const x = padding + (i * step)
    const y = height - padding - ((d.responseTime || 0) * scaleFactor)
    return { x, y, success: d.success, responseTime: d.responseTime }
  })

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  return (
    <div className="bg-neutral-800 rounded-lg p-4">
      <h4 className="text-sm font-medium text-neutral-300 mb-3">
        Response Time History - {agentName}
      </h4>
      <svg 
        width="100%" 
        height="180" 
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        {/* Grid lines */}
        <g stroke="rgba(255,255,255,0.1)" strokeWidth="1">
          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + (dataHeight / 4) * i
            return (
              <line key={i} x1={padding} y1={y} x2={width - padding} y2={y} />
            )
          })}
        </g>

        {/* Area under the curve */}
        <path
          d={`${pathData} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
          fill="rgba(99, 102, 241, 0.1)"
        />

        {/* Line chart */}
        <path
          d={pathData}
          fill="none"
          stroke="rgb(99, 102, 241)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill={p.success ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'}
              className="transition-all hover:r-6"
            >
              <title>{`${p.responseTime}ms - ${p.success ? 'Success' : 'Failed'}`}</title>
            </circle>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={padding}
          y={height - 5}
          className="text-xs fill-neutral-500"
          textAnchor="start"
        >
          Oldest
        </text>
        <text
          x={width - padding}
          y={height - 5}
          className="text-xs fill-neutral-500"
          textAnchor="end"
        >
          Latest
        </text>
        <text
          x={padding - 10}
          y={padding}
          className="text-xs fill-neutral-500"
          textAnchor="end"
        >
          {maxResponseTime}ms
        </text>
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Success</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Failed</span>
        </div>
      </div>
    </div>
  )
}
