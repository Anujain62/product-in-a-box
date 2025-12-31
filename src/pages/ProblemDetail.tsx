import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Lightbulb, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Code, 
  Zap,
  Trophy,
  RotateCcw,
  Play
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Problem {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  solution: string | null;
  hints: string[] | null;
  xp_reward: number;
  lessons?: { title: string; slug: string; courses?: { title: string; slug: string; subjects?: { slug: string } | null } | null } | null;
}

interface UserAttempt {
  id: string;
  problem_id: string;
  solved: boolean;
  attempts: number;
  solved_at: string | null;
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  easy: { label: 'Easy', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
  medium: { label: 'Medium', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
  hard: { label: 'Hard', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
};

export default function ProblemDetail() {
  const { problemId } = useParams<{ problemId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [userSolution, setUserSolution] = useState('// Write your solution here\n\n');
  const [showSolution, setShowSolution] = useState(false);
  const [revealedHints, setRevealedHints] = useState<number[]>([]);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState<string>('');

  const languages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
  ];

  const handleRunCode = () => {
    setOutput('Running code...\n');
    // Simulate code execution
    setTimeout(() => {
      setOutput('> Code executed successfully!\n\n// Note: This is a simulated output.\n// In a real environment, your code would be executed on a secure server.');
    }, 500);
  };

  const { data: problem, isLoading } = useQuery({
    queryKey: ['problem', problemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('practice_problems')
        .select('*, lessons(title, slug, courses(title, slug, subjects(slug)))')
        .eq('id', problemId)
        .maybeSingle();

      if (error) throw error;
      return data as Problem | null;
    },
    enabled: !!problemId,
  });

  const { data: attempt } = useQuery({
    queryKey: ['problem-attempt', problemId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_problem_attempts')
        .select('*')
        .eq('problem_id', problemId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserAttempt | null;
    },
    enabled: !!user && !!problemId,
  });

  const submitAttempt = useMutation({
    mutationFn: async (solved: boolean) => {
      if (!user || !problemId) throw new Error('Must be logged in');

      if (attempt) {
        const { error } = await supabase
          .from('user_problem_attempts')
          .update({
            attempts: attempt.attempts + 1,
            solved: solved || attempt.solved,
            solved_at: solved && !attempt.solved ? new Date().toISOString() : attempt.solved_at,
          })
          .eq('id', attempt.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_problem_attempts')
          .insert({
            user_id: user.id,
            problem_id: problemId,
            solved,
            attempts: 1,
            solved_at: solved ? new Date().toISOString() : null,
          });

        if (error) throw error;
      }

      // Award XP if solved for the first time
      if (solved && !attempt?.solved && problem) {
        await supabase.rpc('increment_xp', { p_user_id: user.id, p_xp: problem.xp_reward });
      }

      return solved;
    },
    onSuccess: (solved) => {
      queryClient.invalidateQueries({ queryKey: ['problem-attempt', problemId] });
      queryClient.invalidateQueries({ queryKey: ['user-attempts'] });
      
      if (solved && !attempt?.solved) {
        toast.success(`Correct! You earned ${problem?.xp_reward} XP!`);
      }
    },
  });

  const handleMarkSolved = () => {
    submitAttempt.mutate(true);
  };

  const handleAttempt = () => {
    submitAttempt.mutate(false);
  };

  const revealHint = (index: number) => {
    if (!revealedHints.includes(index)) {
      setRevealedHints([...revealedHints, index]);
    }
  };

  const resetProgress = () => {
    setUserSolution('');
    setShowSolution(false);
    setRevealedHints([]);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container py-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  if (!problem) {
    return (
      <Layout>
        <div className="container py-8">
          <Card>
            <CardContent className="p-12 text-center">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Problem not found</h3>
              <Button asChild className="mt-4">
                <Link to="/practice">Back to Problems</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const config = difficultyConfig[problem.difficulty || 'medium'];
  const isSolved = attempt?.solved || false;

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/practice')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Problems
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                {problem.title}
                {isSolved && <Trophy className="h-7 w-7 text-primary" />}
              </h1>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="outline" className={config.color}>
                  {config.label}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {problem.xp_reward} XP
                </Badge>
                {attempt && (
                  <Badge variant="outline">
                    {attempt.attempts} attempt{attempt.attempts !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
            {isSolved && (
              <Badge className="bg-primary/10 text-primary border-primary/20 text-sm py-1">
                <CheckCircle className="h-4 w-4 mr-1" />
                Solved
              </Badge>
            )}
          </div>
        </div>

        {/* Problem Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Problem Description</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{problem.description || 'No description available.'}</p>
            </div>
            {problem.lessons && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Related lesson:{' '}
                  <Link
                    to={`/courses/${problem.lessons.courses?.subjects?.slug}/${problem.lessons.courses?.slug}/${problem.lessons.slug}`}
                    className="text-primary hover:underline"
                  >
                    {problem.lessons.title}
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hints */}
        {problem.hints && problem.hints.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Hints ({revealedHints.length}/{problem.hints.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" value={revealedHints.map(i => `hint-${i}`)}>
                {problem.hints.map((hint, index) => (
                  <AccordionItem key={index} value={`hint-${index}`}>
                    <AccordionTrigger
                      onClick={() => revealHint(index)}
                      className="hover:no-underline"
                    >
                      <span className="flex items-center gap-2">
                        {revealedHints.includes(index) ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                        Hint {index + 1}
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground pl-6">{hint}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Code Editor */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Your Solution
              </CardTitle>
              <div className="flex items-center gap-3">
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="secondary" size="sm" onClick={handleRunCode}>
                  <Play className="h-4 w-4 mr-2" />
                  Run
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Monaco Editor */}
            <div className="border rounded-lg overflow-hidden">
              <Editor
                height="350px"
                language={language}
                value={userSolution}
                onChange={(value) => setUserSolution(value || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>

            {/* Output Console */}
            {output && (
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2">Output</p>
                <pre className="text-sm font-mono whitespace-pre-wrap">{output}</pre>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  {!isSolved && (
                    <Button onClick={handleAttempt} variant="secondary" disabled={submitAttempt.isPending}>
                      Save Attempt
                    </Button>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={isSolved || submitAttempt.isPending}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {isSolved ? 'Already Solved' : 'Mark as Solved'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Solved?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure your solution is correct? You will earn {problem.xp_reward} XP for solving this problem.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleMarkSolved}>
                          Yes, I solved it!
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <Button asChild>
                  <Link to="/auth">Login to submit</Link>
                </Button>
              )}
              <Button variant="outline" onClick={resetProgress}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Solution */}
        {problem.solution && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Solution</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSolution(!showSolution)}
                >
                  {showSolution ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide Solution
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Reveal Solution
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showSolution ? (
                <div className="border rounded-lg overflow-hidden">
                  <Editor
                    height="300px"
                    language={language}
                    value={problem.solution}
                    theme="vs-dark"
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      padding: { top: 16, bottom: 16 },
                    }}
                  />
                </div>
              ) : (
                <div className="bg-secondary/30 p-8 rounded-lg text-center">
                  <EyeOff className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Try solving it yourself first!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
