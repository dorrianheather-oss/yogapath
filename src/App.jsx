import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Learn from './pages/Learn';
import LessonPlayer from './pages/LessonPlayer';
import PoseLibrary from './pages/PoseLibrary';
import ClassBuilder from './pages/ClassBuilder';
import Progress from './pages/Progress';
import Journey from './pages/Journey';
import Library from './pages/Library';
import Admin from './pages/Admin';
import Analytics from './pages/Analytics';
import Generator from './pages/Generator';
import AppLayout from './components/layout/AppLayout';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">🧘</div>
          <div className="w-6 h-6 border-3 border-muted border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/Dashboard" replace />} />
      <Route path="/Onboarding" element={<Onboarding />} />
      <Route element={<AppLayout />}>
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Learn" element={<Learn />} />
        <Route path="/Lesson/:lessonId" element={<LessonPlayer />} />
        <Route path="/PoseLibrary" element={<PoseLibrary />} />
        <Route path="/ClassBuilder" element={<ClassBuilder />} />
        <Route path="/Progress" element={<Progress />} />
        <Route path="/Library" element={<Library />} />
        <Route path="/Journey/:journeyId" element={<Journey />} />
        <Route path="/Admin" element={<Admin />} />
        <Route path="/Analytics" element={<Analytics />} />
        <Route path="/Generator" element={<Generator />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App