import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Plus, Pencil, Trash2, Video, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lesson {
  id: string;
  title: string;
  slug: string;
  content: string | null;
  video_url: string | null;
  course_id: string;
  duration_minutes: number | null;
  xp_reward: number;
  order_index: number;
  is_published: boolean;
  created_at: string;
  courses?: { title: string; subjects?: { name: string } | null } | null;
}

interface Course {
  id: string;
  title: string;
  subjects?: { name: string } | null;
}

export default function AdminLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [filterCourseId, setFilterCourseId] = useState<string>('all');
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    video_url: '',
    course_id: '',
    duration_minutes: 10,
    xp_reward: 10,
    order_index: 0,
    is_published: true,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [lessonsRes, coursesRes] = await Promise.all([
        supabase
          .from('lessons')
          .select('*, courses(title, subjects(name))')
          .order('course_id')
          .order('order_index'),
        supabase.from('courses').select('id, title, subjects(name)').order('title'),
      ]);

      if (lessonsRes.error) throw lessonsRes.error;
      if (coursesRes.error) throw coursesRes.error;

      setLessons(lessonsRes.data || []);
      setCourses(coursesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error', description: 'Failed to fetch data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingLesson(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      video_url: '',
      course_id: filterCourseId !== 'all' ? filterCourseId : (courses[0]?.id || ''),
      duration_minutes: 10,
      xp_reward: 10,
      order_index: lessons.filter(l => l.course_id === (filterCourseId !== 'all' ? filterCourseId : courses[0]?.id)).length,
      is_published: true,
    });
    setDialogOpen(true);
  }

  function openEditDialog(lesson: Lesson) {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      slug: lesson.slug,
      content: lesson.content || '',
      video_url: lesson.video_url || '',
      course_id: lesson.course_id,
      duration_minutes: lesson.duration_minutes || 10,
      xp_reward: lesson.xp_reward,
      order_index: lesson.order_index,
      is_published: lesson.is_published,
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const dataToSave = {
        ...formData,
        video_url: formData.video_url || null,
        content: formData.content || null,
      };

      if (editingLesson) {
        const { error } = await supabase
          .from('lessons')
          .update(dataToSave)
          .eq('id', editingLesson.id);

        if (error) throw error;
        toast({ title: 'Success', description: 'Lesson updated successfully' });
      } else {
        const { error } = await supabase.from('lessons').insert(dataToSave);

        if (error) throw error;
        toast({ title: 'Success', description: 'Lesson created successfully' });
      }

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      console.error('Error saving lesson:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const { error } = await supabase.from('lessons').delete().eq('id', id);

      if (error) throw error;
      toast({ title: 'Success', description: 'Lesson deleted successfully' });
      fetchData();
    } catch (error: any) {
      console.error('Error deleting lesson:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  const filteredLessons = filterCourseId === 'all' 
    ? lessons 
    : lessons.filter(l => l.course_id === filterCourseId);

  return (
    <AdminLayout title="Lessons" description="Manage lesson content and videos">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <Select value={filterCourseId} onValueChange={setFilterCourseId}>
          <SelectTrigger className="w-full sm:w-[300px]">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title} {course.subjects?.name ? `(${course.subjects.name})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? 'Edit Lesson' : 'Create Lesson'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Course</Label>
                <Select
                  value={formData.course_id}
                  onValueChange={(value) => setFormData({ ...formData, course_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="video_url">Video URL (optional)</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={8}
                  placeholder="# Lesson Content&#10;&#10;Write your lesson content in Markdown..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration_minutes}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 0 })
                    }
                  />
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
                <div className="space-y-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order_index}
                    onChange={(e) =>
                      setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })}
                />
                <Label htmlFor="is_published">Published</Label>
              </div>

              <Button type="submit" className="w-full">
                {editingLesson ? 'Update' : 'Create'} Lesson
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredLessons.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No lessons found. Create your first lesson.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLessons.map((lesson) => (
                  <TableRow key={lesson.id}>
                    <TableCell className="font-medium">{lesson.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {lesson.courses?.title || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {lesson.video_url && (
                          <Badge variant="outline" className="gap-1">
                            <Video className="h-3 w-3" />
                            Video
                          </Badge>
                        )}
                        {lesson.content && (
                          <Badge variant="outline" className="gap-1">
                            <FileText className="h-3 w-3" />
                            Text
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{lesson.duration_minutes || 0} min</TableCell>
                    <TableCell>{lesson.xp_reward} XP</TableCell>
                    <TableCell>
                      <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
                        {lesson.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(lesson)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(lesson.id)}>
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
