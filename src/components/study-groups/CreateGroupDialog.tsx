import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useCreateStudyGroup } from '@/hooks/useStudyGroups';
import { useSubjects } from '@/hooks/useSubjects';
import { toast } from 'sonner';

interface CreateGroupDialogProps {
  children?: React.ReactNode;
}

export function CreateGroupDialog({ children }: CreateGroupDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('');
  const [maxMembers, setMaxMembers] = useState('20');
  const [monthlyPrice, setMonthlyPrice] = useState('99');
  
  const { data: subjects } = useSubjects();
  const createMutation = useCreateStudyGroup();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!name.trim()) return;

    createMutation.mutate(
      { 
        name: name.trim(), 
        description: description.trim() || undefined,
        subject_id: subjectId || undefined,
        max_members: parseInt(maxMembers) || 20,
        monthly_price: parseInt(monthlyPrice) || 99,
      },
      {
        onSuccess: (group) => {
          setOpen(false);
          setName('');
          setDescription('');
          setSubjectId('');
          setMaxMembers('20');
          setMonthlyPrice('99');
          toast.success('Study group created!');
          navigate(`/study-groups/${group.id}`);
        },
        onError: (error) => {
          toast.error('Failed to create group: ' + error.message);
        },
      }
    );
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && !user) {
      navigate('/auth');
      return;
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" /> Create Group
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Study Group</DialogTitle>
          <DialogDescription>
            Start a new study group and invite others to learn together.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Group Name</Label>
            <Input
              id="name"
              placeholder="e.g., Arrays & Strings Mastery"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject (Optional)</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects?.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what the group is about..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members</Label>
              <Input
                id="maxMembers"
                type="number"
                min="2"
                max="100"
                value={maxMembers}
                onChange={(e) => setMaxMembers(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyPrice">Monthly Price (₹)</Label>
              <Input
                id="monthlyPrice"
                type="number"
                min="0"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!name.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
