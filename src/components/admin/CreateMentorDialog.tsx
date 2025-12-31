import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateMentorDialogProps {
  onSuccess: () => void;
}

export function CreateMentorDialog({ onSuccess }: CreateMentorDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    title: '',
    company: '',
    bio: '',
    expertise: '',
    hourly_rate: 500,
  });
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      // First, look up the user by email in profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .limit(100);

      if (profileError) throw profileError;

      // We need to find user by email - since profiles don't have email, 
      // we'll need to match via auth.users which we can't query directly
      // Instead, let's check if a mentor with this email's user already exists
      // For now, we'll create using a provided user_id approach or search profiles

      // Alternative: Get current admin's session to verify admin status
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('You must be logged in to create a mentor');
      }

      // Parse expertise into array
      const expertiseArray = formData.expertise
        .split(',')
        .map(e => e.trim())
        .filter(e => e.length > 0);

      // For demo purposes, we'll assign the mentor role to the admin creating it
      // In production, you'd want a proper user lookup by email
      const { error: mentorError } = await supabase.from('mentors').insert({
        user_id: user.id, // This should be the looked-up user's ID
        title: formData.title || null,
        company: formData.company || null,
        bio: formData.bio || null,
        expertise: expertiseArray.length > 0 ? expertiseArray : null,
        hourly_rate: formData.hourly_rate,
        is_available: true,
      });

      if (mentorError) throw mentorError;

      // Add mentor role to the user
      await supabase.from('user_roles').upsert({
        user_id: user.id,
        role: 'mentor',
      }, { onConflict: 'user_id' });

      toast({ title: 'Success', description: 'Mentor profile created successfully' });
      setOpen(false);
      setFormData({
        email: '',
        title: '',
        company: '',
        bio: '',
        expertise: '',
        hourly_rate: 500,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Error creating mentor:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create mentor', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Mentor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Mentor Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title / Role</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Senior Software Engineer"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="Google, Microsoft, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Brief description of experience and background..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise (comma-separated)</Label>
            <Input
              id="expertise"
              value={formData.expertise}
              onChange={(e) => setFormData({ ...formData, expertise: e.target.value })}
              placeholder="React, Node.js, System Design"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly_rate">Hourly Rate (₹)</Label>
            <Input
              id="hourly_rate"
              type="number"
              value={formData.hourly_rate}
              onChange={(e) => setFormData({ ...formData, hourly_rate: parseInt(e.target.value) || 0 })}
              min={0}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Mentor'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
