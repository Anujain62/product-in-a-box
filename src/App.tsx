import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Mentors from "./pages/Mentors";
import MentorDetail from "./pages/MentorDetail";
import MySessions from "./pages/MySessions";
import Community from "./pages/Community";
import Leaderboard from "./pages/Leaderboard";
import StudyGroups from "./pages/StudyGroups";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import LessonViewer from "./pages/LessonViewer";
import ThreadDetail from "./pages/ThreadDetail";
import StudyGroupDetail from "./pages/StudyGroupDetail";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminSubjects from "./pages/admin/AdminSubjects";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminMentors from "./pages/admin/AdminMentors";
import AdminCommunity from "./pages/admin/AdminCommunity";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/courses" element={<Courses />} />
            <Route path="/courses/:subjectSlug" element={<CourseDetail />} />
            <Route path="/courses/:subjectSlug/:courseSlug/:lessonSlug" element={<LessonViewer />} />
            <Route path="/mentors" element={<Mentors />} />
            <Route path="/mentors/:mentorId" element={<MentorDetail />} />
            <Route path="/my-sessions" element={<MySessions />} />
            <Route path="/community" element={<Community />} />
            <Route path="/community/:threadId" element={<ThreadDetail />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/study-groups" element={<StudyGroups />} />
            <Route path="/study-groups/:groupId" element={<StudyGroupDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/subjects" element={<AdminSubjects />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/mentors" element={<AdminMentors />} />
            <Route path="/admin/community" element={<AdminCommunity />} />
            <Route path="/admin/events" element={<AdminEvents />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
