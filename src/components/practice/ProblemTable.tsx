import { Link } from 'react-router-dom';
import { CheckCircle2, Circle, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface Problem {
  id: string;
  title: string;
  difficulty: string | null;
  xp_reward: number;
  lesson_id: string | null;
}

interface UserAttempt {
  problem_id: string;
  solved: boolean;
  attempts: number;
}

interface ProblemTableProps {
  problems: Problem[];
  userAttempts: UserAttempt[];
}

const difficultyConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  easy: { label: 'Easy', color: 'text-[#00b8a3]', bgColor: 'bg-[#00b8a3]/10' },
  medium: { label: 'Medium', color: 'text-[#ffc01e]', bgColor: 'bg-[#ffc01e]/10' },
  hard: { label: 'Hard', color: 'text-[#ff375f]', bgColor: 'bg-[#ff375f]/10' },
};

export function ProblemTable({ problems, userAttempts }: ProblemTableProps) {
  const getAttemptStatus = (problemId: string) => {
    const attempt = userAttempts.find((a) => a.problem_id === problemId);
    if (!attempt) return 'todo';
    return attempt.solved ? 'solved' : 'attempted';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'solved':
        return <CheckCircle2 className="h-5 w-5 text-[#00b8a3]" />;
      case 'attempted':
        return <Circle className="h-5 w-5 fill-[#ffc01e] text-[#ffc01e]" />;
      default:
        return <Minus className="h-5 w-5 text-muted-foreground/50" />;
    }
  };

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[60px]">Status</TableHead>
              <TableHead className="w-[60px]">#</TableHead>
              <TableHead>Title</TableHead>
              <TableHead className="w-[100px]">Difficulty</TableHead>
              <TableHead className="w-[80px] text-right">XP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map((problem, index) => {
              const status = getAttemptStatus(problem.id);
              const config = difficultyConfig[problem.difficulty || 'easy'];

              return (
                <TableRow key={problem.id} className="group">
                  <TableCell>{getStatusIcon(status)}</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {index + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      to={`/practice/${problem.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {problem.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${config.color} ${config.bgColor}`}>
                      {config.label}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="font-mono">
                      +{problem.xp_reward}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="divide-y md:hidden">
        {problems.map((problem, index) => {
          const status = getAttemptStatus(problem.id);
          const config = difficultyConfig[problem.difficulty || 'easy'];

          return (
            <Link
              key={problem.id}
              to={`/practice/${problem.id}`}
              className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
            >
              {getStatusIcon(status)}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-muted-foreground">
                    {index + 1}.
                  </span>
                  <span className="font-medium truncate">{problem.title}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-xs font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    +{problem.xp_reward} XP
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {problems.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-3 mb-3">
            <Circle className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No problems found</p>
        </div>
      )}
    </div>
  );
}
