import { CheckCircle2, Circle, Target } from 'lucide-react';

interface ProblemStatsProps {
  total: number;
  solved: number;
  easy: { total: number; solved: number };
  medium: { total: number; solved: number };
  hard: { total: number; solved: number };
}

export function ProblemStats({ total, solved, easy, medium, hard }: ProblemStatsProps) {
  const getPercentage = (value: number, max: number) => (max > 0 ? (value / max) * 100 : 0);

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Overall Progress */}
      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16">
            <svg className="h-16 w-16 -rotate-90 transform">
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-muted"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                strokeDasharray={`${getPercentage(solved, total) * 1.76} 176`}
                className="text-primary"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold">{solved}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Solved</p>
            <p className="text-2xl font-bold">{solved}/{total}</p>
          </div>
        </div>
      </div>

      {/* Easy */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[#00b8a3]">Easy</span>
          <span className="text-sm text-muted-foreground">{easy.solved}/{easy.total}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[#00b8a3] transition-all"
            style={{ width: `${getPercentage(easy.solved, easy.total)}%` }}
          />
        </div>
      </div>

      {/* Medium */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[#ffc01e]">Medium</span>
          <span className="text-sm text-muted-foreground">{medium.solved}/{medium.total}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[#ffc01e] transition-all"
            style={{ width: `${getPercentage(medium.solved, medium.total)}%` }}
          />
        </div>
      </div>

      {/* Hard */}
      <div className="rounded-xl border bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-medium text-[#ff375f]">Hard</span>
          <span className="text-sm text-muted-foreground">{hard.solved}/{hard.total}</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-[#ff375f] transition-all"
            style={{ width: `${getPercentage(hard.solved, hard.total)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
