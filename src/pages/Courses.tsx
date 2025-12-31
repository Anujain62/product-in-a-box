import { Link } from 'react-router-dom';
import { Code, Server, Layers, Cpu, Network, Database, Brain, ArrowRight, BookOpen, Clock, Users } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const subjects = [
  { name: 'Data Structures & Algorithms', slug: 'dsa', icon: Code, color: 'dsa', lessons: 120, hours: 40, students: '12K+', description: 'Master pattern-based problem solving for FAANG interviews. Two Pointers, Sliding Window, DP, Graphs, and more.' },
  { name: 'System Design', slug: 'system-design', icon: Server, color: 'system-design', lessons: 45, hours: 20, students: '8K+', description: 'Design scalable distributed systems. Load balancers, databases, caching, microservices architecture.' },
  { name: 'Low Level Design', slug: 'lld', icon: Layers, color: 'lld', lessons: 30, hours: 15, students: '5K+', description: 'SOLID principles, design patterns, and clean architecture for building maintainable software.' },
  { name: 'Operating Systems', slug: 'os', icon: Cpu, color: 'os', lessons: 35, hours: 18, students: '6K+', description: 'Processes, threads, memory management, file systems, and concurrency for interviews.' },
  { name: 'Computer Networks', slug: 'cn', icon: Network, color: 'cn', lessons: 25, hours: 12, students: '4K+', description: 'OSI model, TCP/IP, HTTP, DNS, and network security fundamentals.' },
  { name: 'Database Management', slug: 'dbms', icon: Database, color: 'dbms', lessons: 30, hours: 14, students: '5K+', description: 'SQL, normalization, indexing, transactions, and query optimization.' },
  { name: 'AI & Machine Learning', slug: 'aiml', icon: Brain, color: 'aiml', lessons: 40, hours: 25, students: '7K+', description: 'Applied ML fundamentals, neural networks, and practical implementations.' },
];

export default function Courses() {
  return (
    <Layout>
      <div className="container py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">100% Free Content</Badge>
          <h1 className="text-4xl font-bold mb-4">Explore Our Courses</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive, pattern-based curriculum designed for placements and real-world engineering
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Card key={subject.slug} className="group hover:shadow-lg transition-all hover:border-primary/30">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-${subject.color}/10`}>
                    <Icon className={`h-6 w-6 text-${subject.color}`} />
                  </div>
                  <CardTitle>{subject.name}</CardTitle>
                  <CardDescription>{subject.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> {subject.lessons} lessons</span>
                    <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {subject.hours}h</span>
                    <span className="flex items-center gap-1"><Users className="h-4 w-4" /> {subject.students}</span>
                  </div>
                  <Button className="w-full group-hover:bg-primary" variant="secondary" asChild>
                    <Link to={`/courses/${subject.slug}`}>
                      Start Learning <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
