import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Search, MoreHorizontal, Shield, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  total_xp: number;
  current_streak: number;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: 'admin' | 'mentor' | 'user';
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const [profilesRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (profilesRes.error) throw profilesRes.error;
      if (rolesRes.error) throw rolesRes.error;

      setProfiles(profilesRes.data || []);

      const rolesMap = new Map<string, string[]>();
      (rolesRes.data || []).forEach((role: UserRole) => {
        const existing = rolesMap.get(role.user_id) || [];
        rolesMap.set(role.user_id, [...existing, role.role]);
      });
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function toggleAdminRole(userId: string, hasAdminRole: boolean) {
    try {
      if (hasAdminRole) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        if (error) throw error;
        toast({ title: 'Success', description: 'Admin role removed' });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });

        if (error) throw error;
        toast({ title: 'Success', description: 'Admin role granted' });
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  async function toggleMentorRole(userId: string, hasMentorRole: boolean) {
    try {
      if (hasMentorRole) {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'mentor');

        if (error) throw error;
        toast({ title: 'Success', description: 'Mentor role removed' });
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'mentor' });

        if (error) throw error;
        toast({ title: 'Success', description: 'Mentor role granted' });
      }

      fetchUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  }

  const filteredProfiles = profiles.filter(
    (profile) =>
      profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.user_id.includes(searchQuery)
  );

  return (
    <AdminLayout title="Users" description="Manage platform users and roles">
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredProfiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead>Streak</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => {
                  const roles = userRoles.get(profile.user_id) || ['user'];
                  const hasAdminRole = roles.includes('admin');
                  const hasMentorRole = roles.includes('mentor');

                  return (
                    <TableRow key={profile.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback>
                              {profile.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{profile.full_name || 'Anonymous'}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {profile.user_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {roles.map((role) => (
                            <Badge
                              key={role}
                              variant={role === 'admin' ? 'default' : role === 'mentor' ? 'secondary' : 'outline'}
                              className="capitalize"
                            >
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{profile.total_xp.toLocaleString()}</TableCell>
                      <TableCell>{profile.current_streak} days</TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(profile.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleAdminRole(profile.user_id, hasAdminRole)}>
                              <Shield className="h-4 w-4 mr-2" />
                              {hasAdminRole ? 'Remove Admin' : 'Make Admin'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleMentorRole(profile.user_id, hasMentorRole)}>
                              <UserX className="h-4 w-4 mr-2" />
                              {hasMentorRole ? 'Remove Mentor' : 'Make Mentor'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
