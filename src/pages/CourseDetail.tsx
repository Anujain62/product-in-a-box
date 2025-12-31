import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Play, CheckCircle, Lock, Clock, BookOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const sampleModules = [
  { title: 'Introduction', lessons: [{ title: 'Course Overview', duration: 5, completed: false }, { title: 'Setting Up Environment', duration: 10, completed: false }] },
  { title: 'Fundamentals', lessons: [{ title: 'Core Concepts', duration: 15, completed: false }, { title: 'Basic Examples', duration: 20, completed: false }, { title: 'Practice Problems', duration: 30, completed: false }] },
  { title: 'Intermediate', lessons: [{ title: 'Advanced Patterns', duration: 25, completed: false }, { title: 'Real-world Applications', duration: 20, completed: false }] },
  { title: 'Advanced', lessons: [{ title: 'Complex Scenarios', duration: 30, completed: false }, { title: 'Interview Questions', duration: 45, completed: false }] },
];

export default function CourseDetail() {
  const { subjectSlug } = useParams();
  const subjectName = subjectSlug?.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || 'Course';

  return (
    <Layout>
      <div className="container py-8">
        <Link to="/courses" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Courses
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <Badge className="mb-4">Free Course</Badge>
              <h1 className="text-3xl font-bold mb-4">{subjectName}</h1>
              <p className="text-muted-foreground">Comprehensive curriculum with hands-on practice and real interview problems.</p>
              <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4" /> 40+ Lessons</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> 20+ Hours</span>
              </div>
            </div>

            {/* Modules */}
            <Card>
              <CardHeader>
                <CardTitle>Course Curriculum</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {sampleModules.map((module, idx) => (
                    <AccordionItem key={idx} value={`module-${idx}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{module.title}</span>
                          <Badge variant="secondary">{module.lessons.length} lessons</Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pt-2">
                          {module.lessons.map((lesson, lessonIdx) => (
                            <div key={lessonIdx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                  <Play className="h-4 w-4 text-primary" />
                                </div>
                                <span>{lesson.title}</span>
                              </div>
                              <span className="text-sm text-muted-foreground">{lesson.duration} min</span>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card className="sticky top-24">
              <CardContent className="p-6">
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center mb-6">
                  <Play className="h-12 w-12 text-primary" />
                </div>
                <Button className="w-full mb-4" size="lg">Start Learning</Button>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Progress</span><span>0%</span></div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
