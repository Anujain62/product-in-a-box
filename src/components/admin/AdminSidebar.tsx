import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  MessageSquare,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  FileText,
  Code,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Subjects', href: '/admin/subjects', icon: BookOpen },
  { label: 'Courses', href: '/admin/courses', icon: GraduationCap },
  { label: 'Lessons', href: '/admin/lessons', icon: FileText },
  { label: 'Problems', href: '/admin/problems', icon: Code },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Mentors', href: '/admin/mentors', icon: Users },
  { label: 'Community', href: '/admin/community', icon: MessageSquare },
  { label: 'Events', href: '/admin/events', icon: Calendar },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-border bg-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        {!collapsed && (
          <Link to="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              B
            </div>
            <span className="font-semibold">Admin Panel</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && 'mx-auto')}
        >
          {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href || 
            (item.href !== '/admin' && location.pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="absolute bottom-4 left-0 right-0 px-2">
        <Link
          to="/"
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Back to Site</span>}
        </Link>
      </div>
    </aside>
  );
}
