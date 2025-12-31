import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Problem {
  id: string;
  title: string;
  description: string | null;
  difficulty: string | null;
  solution: string | null;
  hints: string[] | null;
  lesson_id: string | null;
  xp_reward: number;
  created_at: string;
  lessons?: { title: string; courses?: { title: string } | null } | null;
}

interface Lesson {
  id: string;
  title: string;
  courses?: { title: string } | null;
}

export default function AdminProblems() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState<Problem | null>(null);
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [hintsInput, setHintsInput] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    solution: '',
    hints: [] as string[],
    lesson_id: '' as string | null,
    xp_reward: 20,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [problemsRes, lessonsRes] = await Promise.all([
        supabase
          .from('practice_problems')
          .select('*, lessons(title, courses(title))')
          .order('created_at', { ascending: false }),
        supabase.from('lessons').select('id, title, courses(title)').order('title'),
      ]);

      if (problemsRes.error) throw problemsRes.error;
      if (lessonsRes.error) throw lessonsRes.error;

      setProblems(problemsRes.data || []);
      setLessons(lessonsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingProblem(null);
    setFormData({
      title: '',
      description: '',
      difficulty: 'medium',
      solution: '',
      hints: [],
      lesson_id: null,
      xp_reward: 20,
    });
    setHintsInput('');
    setDialogOpen(true);
  }

  function openEditDialog(problem: Problem) {
    setEditingProblem(problem);
    setFormData({
      title: problem.title,
      description: problem.description || '',
      difficulty: problem.difficulty || 'medium',
      solution: problem.solution || '',
      hints: problem.hints || [],
      lesson_id: problem.lesson_id,
      xp_reward: problem.xp_reward,
    });
    setHintsInput((problem.hints || []).join('\n'));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const hints = hintsInput.split('\n').filter(h => h.trim());
      const dataToSave = {
        ...formData,
        hints: hints.length > 0 ? hints : null,
        description: formData.description || null,
        solution: formData.solution || null,
        lesson_id: formData.lesson_id || null,
      };

      if (editingProblem) {
        const { error } = await supabase
          .from('practice_problems')
          .update(dataToSave)
          .eq('id', editingProblem.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Problem updated successfully' });
      } else {
        const { error } = await supabase.from('practice_problems').insert(dataToSave);

        if (error) throw error;
        toast({ title: 'Success', description: 'Problem created successfully' });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving problem:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this problem?')) return;

    try {
      const { error } = await supabase.from('practice_problems').delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Problem deleted successfully' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting problem:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  const filteredProblems = filterDifficulty === 'all'
    ? problems
    : problems.filter(p => p.difficulty === filterDifficulty);

  const difficultyColors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-500 border-green-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    hard: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  return (
    <AdminLayout title="Practice Problems" description="Manage coding challenges and exercises">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Problem
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProblem ? 'Edit Problem' : 'Create Problem'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Two Sum"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Given an array of integers nums and an integer target..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="xp">XP Reward</Label>
                  <Input
                    id="xp"
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) =>
                      setFormData({ ...formData, xp_reward: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Related Lesson (optional)</Label>
                <Select
                  value={formData.lesson_id || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, lesson_id: value === 'none' ? null : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lesson" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No linked lesson</SelectItem>
                    {lessons.map((lesson) => (
                      <SelectItem key={lesson.id} value={lesson.id}>
                        {lesson.title} {lesson.courses?.title ? `(${lesson.courses.title})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hints">Hints (one per line)</Label>
                <Textarea
                  id="hints"
                  value={hintsInput}
                  onChange={(e) => setHintsInput(e.target.value)}
                  rows={3}
                  placeholder="Try using a hash map...&#10;Think about what you need to find..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solution">Solution</Label>
                <Textarea
                  id="solution"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                  rows={6}
                  placeholder="function twoSum(nums, target) {&#10;  // solution code..."
                  className="font-mono text-sm"
                />
              </div>

              <Button type="submit" className="w-full">
                {editingProblem ? 'Update' : 'Create'} Problem
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredProblems.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No problems found. Create your first practice problem.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Linked Lesson</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Hints</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProblems.map((problem) => (
                  <TableRow key={problem.id}>
                    <TableCell className="font-medium">{problem.title}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={`capitalize ${difficultyColors[problem.difficulty || 'medium']}`}
                      >
                        {problem.difficulty || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {problem.lessons?.title || '—'}
                    </TableCell>
                    <TableCell>{problem.xp_reward} XP</TableCell>
                    <TableCell>
                      {problem.hints && problem.hints.length > 0 && (
                        <Badge variant="secondary" className="gap-1">
                          <Lightbulb className="h-3 w-3" />
                          {problem.hints.length}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(problem)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(problem.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
