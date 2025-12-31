import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Code, Filter, Search, Trophy, Zap } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Problem {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  xp_reward: number;
  hints: string[] | null;
  lessons?: { title: string; courses?: { title: string } | null } | null;
}

interface UserAttempt {
  problem_id: string;
  solved: boolean;
  attempts: number;
}

const difficultyConfig: Record<string, { label: string; color: string; points: number }> = {
  easy: { label: 'Easy', color: 'bg-green-500/10 text-green-500 border-green-500/20', points: 1 },
  medium: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', points: 2 },
  hard: { label: 'Hard', color: 'bg-red-500/10 text-red-500 border-red-500/20', points: 3 },
};

export default function Practice() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  const { data: problems, isLoading } = useQuery({
    queryKey: ['practice-problems'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('id, title, description, difficulty, xp_reward, hints, lessons(title, courses(title))')
        .order('difficulty')
        .order('title');

      if (error) throw error;
      return data as Problem[];
    },
  });

  const { data: userAttempts } = useQuery({
    queryKey: ['user-attempts', user?.id],
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

  const attemptsMap = new Map(userAttempts?.map(a => [a.problem_id, a]) || []);

  const filteredProblems = problems?.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(search.toLowerCase()) ||
      problem.description?.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || problem.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  }) || [];

  const stats = {
    total: problems?.length || 0,
    solved: userAttempts?.filter(a => a.solved).length || 0,
    easy: problems?.filter(p => p.difficulty === 'easy').length || 0,
    medium: problems?.filter(p => p.difficulty === 'medium').length || 0,
    hard: problems?.filter(p => p.difficulty === 'hard').length || 0,
  };

  return (
    <Layout>
      <div className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Code className="h-8 w-8 text-primary" />
            Practice Problems
          </h1>
          <p className="text-muted-foreground mt-2">
            Sharpen your skills with coding challenges
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.solved}</p>
              <p className="text-sm text-muted-foreground">Solved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-500">{stats.easy}</p>
              <p className="text-sm text-muted-foreground">Easy</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-yellow-500">{stats.medium}</p>
              <p className="text-sm text-muted-foreground">Medium</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{stats.hard}</p>
              <p className="text-sm text-muted-foreground">Hard</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Problems List */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : filteredProblems.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No problems found</h3>
              <p className="text-muted-foreground">
                {search || difficultyFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Check back later for new challenges'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredProblems.map((problem) => {
              const attempt = attemptsMap.get(problem.id);
              const config = difficultyConfig[problem.difficulty || 'medium'];

              return (
                <Link key={problem.id} to={`/practice/${problem.id}`}>
                  <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                          {problem.title}
                        </CardTitle>
                        {attempt?.solved && (
                          <Trophy className="h-5 w-5 text-primary shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={config.color}>
                          {config.label}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <Zap className="h-3 w-3" />
                          {problem.xp_reward} XP
                        </Badge>
                        {problem.hints && problem.hints.length > 0 && (
                          <Badge variant="outline">
                            {problem.hints.length} hints
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {problem.description || 'No description available'}
                      </p>
                      {problem.lessons && (
                        <p className="text-xs text-muted-foreground mt-3">
                          Related: {problem.lessons.title}
                        </p>
                      )}
                      {attempt && !attempt.solved && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {attempt.attempts} attempt{attempt.attempts !== 1 ? 's' : ''}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
