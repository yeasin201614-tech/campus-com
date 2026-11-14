"use client";

export interface GrowthPoint {
  label: string;
  users: number;
  events: number;
}

export function GrowthChart({ data }: { data: GrowthPoint[] }) {
  const maxVal = Math.max(10, ...data.flatMap((d) => [d.users, d.events]));
  const width = 620;
  const height = 220;
  const padX = 36;
  const padY = 24;

  const toCoords = (vals: number[]) =>
    vals
      .map((val, idx) => {
        const x = padX + (idx * (width - padX * 2)) / Math.max(1, vals.length - 1);
        const y = height - padY - (val / maxVal) * (height - padY * 2);
        return `${x},${y}`;
      })
      .join(" ");

  const userPoints = toCoords(data.map((d) => d.users));
  const eventPoints = toCoords(data.map((d) => d.events));

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-end gap-4 text-xs font-semibold">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple" /> Users
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-teal" /> Events
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 overflow-visible">
        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = height - padY - ratio * (height - padY * 2);
          return (
            <line
              key={ratio}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="currentColor"
              className="text-border"
              strokeDasharray="4 4"
            />
          );
        })}

        <polyline
          fill="none"
          stroke="#6038ED"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={userPoints}
        />
        <polyline
          fill="none"
          stroke="#19B99A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={eventPoints}
        />

        {data.map((d, idx) => {
          const x = padX + (idx * (width - padX * 2)) / Math.max(1, data.length - 1);
          return (
            <text
              key={d.label}
              x={x}
              y={height - 4}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px]"
            >
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
