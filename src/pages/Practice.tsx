import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Code2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeSubscription } from '@/hooks/useRealtimeSubscription';
import { Layout } from '@/components/layout/Layout';
import { ProblemStats } from '@/components/practice/ProblemStats';
import { ProblemFilters } from '@/components/practice/ProblemFilters';
import { ProblemTable } from '@/components/practice/ProblemTable';
import { Skeleton } from '@/components/ui/skeleton';

interface Problem {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  xp_reward: number;
  hints: string[] | null;
  lesson_id: string | null;
}

interface UserAttempt {
  problem_id: string;
  solved: boolean;
  attempts: number;
}

export default function Practice() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('default');

  const { data: problems = [], isLoading: problemsLoading } = useQuery({
    queryKey: ['practice_problems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*')
        .order('created_at');
      if (error) throw error;
      return data as Problem[];
    },
  });

  const { data: userAttempts = [], isLoading: attemptsLoading } = useQuery({
    queryKey: ['user_problem_attempts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_problem_attempts')
        .select('problem_id, solved, attempts')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as UserAttempt[];
    },
    enabled: !!user,
  });

  useRealtimeSubscription({ table: 'practice_problems', queryKey: ['practice_problems'] });

  const stats = useMemo(() => {
    const solvedIds = new Set(userAttempts.filter((a) => a.solved).map((a) => a.problem_id));
    const easy = { total: 0, solved: 0 };
    const medium = { total: 0, solved: 0 };
    const hard = { total: 0, solved: 0 };

    problems.forEach((p) => {
      const isSolved = solvedIds.has(p.id);
      if (p.difficulty === 'easy') { easy.total++; if (isSolved) easy.solved++; }
      else if (p.difficulty === 'medium') { medium.total++; if (isSolved) medium.solved++; }
      else if (p.difficulty === 'hard') { hard.total++; if (isSolved) hard.solved++; }
    });

    return { total: problems.length, solved: solvedIds.size, easy, medium, hard };
  }, [problems, userAttempts]);

  const filteredProblems = useMemo(() => {
    let result = [...problems];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s));
    }
    if (difficulty !== 'all') result = result.filter((p) => p.difficulty === difficulty);
    if (status !== 'all' && user) {
      const attemptMap = new Map(userAttempts.map((a) => [a.problem_id, a]));
      result = result.filter((p) => {
        const attempt = attemptMap.get(p.id);
        if (status === 'todo') return !attempt;
        if (status === 'attempted') return attempt && !attempt.solved;
        if (status === 'solved') return attempt?.solved;
        return true;
      });
    }
    const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
    if (sortBy === 'difficulty-asc') result.sort((a, b) => (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0) - (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0));
    else if (sortBy === 'difficulty-desc') result.sort((a, b) => (difficultyOrder[b.difficulty as keyof typeof difficultyOrder] || 0) - (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] || 0));
    else if (sortBy === 'title-asc') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'title-desc') result.sort((a, b) => b.title.localeCompare(a.title));
    else if (sortBy === 'xp-desc') result.sort((a, b) => b.xp_reward - a.xp_reward);
    return result;
  }, [problems, search, difficulty, status, sortBy, user, userAttempts]);

  const isLoading = problemsLoading || attemptsLoading;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card">
          <div className="container py-8">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Code2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Practice Problems</h1>
                <p className="text-muted-foreground">Sharpen your skills with hands-on coding challenges</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container py-6 space-y-6">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : (
            <ProblemStats {...stats} />
          )}
          <ProblemFilters search={search} onSearchChange={setSearch} difficulty={difficulty} onDifficultyChange={setDifficulty} status={status} onStatusChange={setStatus} sortBy={sortBy} onSortChange={setSortBy} />
          {isLoading ? (
            <div className="space-y-2">{[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
          ) : (
            <ProblemTable problems={filteredProblems} userAttempts={userAttempts} />
          )}
        </div>
      </div>
    </Layout>
  );
}
