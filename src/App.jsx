import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingScreen } from './components/Shared';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import StudentHome from './pages/StudentHome';
import StudentSchedule from './pages/StudentSchedule';
import StudentPayment from './pages/StudentPayment';
import StudentProfile from './pages/StudentProfile';
import TrainerHome from './pages/TrainerHome';
import TrainerSchedule from './pages/TrainerSchedule';
import TrainerStudents from './pages/TrainerStudents';
import TrainerFinance from './pages/TrainerFinance';
import TrainerPlans from './pages/TrainerPlans';
import JoinTrainer from './pages/JoinTrainer';
import ResetPassword from './pages/ResetPassword';
import OnboardingTutorial from './components/OnboardingTutorial';
import { useState, useEffect } from 'react';

function ProtectedRoute({ children, requiredRole }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!session) return <Navigate to="/" replace />;
  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === 'trainer' ? '/trainer' : '/student'} replace />;
  }
  return children;
}

function AuthRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  const joinRedirect = sessionStorage.getItem('joinRedirect');
  if (session && profile && joinRedirect) {
    return <Navigate to={joinRedirect} replace />;
  }

  if (session && profile) {
    return <Navigate to={profile.role === 'trainer' ? '/trainer' : '/student'} replace />;
  }
  return <AuthPage />;
}

function LandingRoute() {
  const { session, profile, loading } = useAuth();
  if (loading) return <LoadingScreen />;

  if (session && profile) {
    return <Navigate to={profile.role === 'trainer' ? '/trainer' : '/student'} replace />;
  }
  return <LandingPage />;
}

// Wrapper that shows tutorial on first access
function WithOnboarding({ children, role }) {
  const { profile } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (profile) {
      const key = `fitagenda_onboarding_${profile.id}`;
      const seen = localStorage.getItem(key);
      if (!seen) {
        setShowTutorial(true);
      }
    }
  }, [profile]);

  function completeTutorial() {
    if (profile) {
      const key = `fitagenda_onboarding_${profile.id}`;
      localStorage.setItem(key, 'true');
    }
    setShowTutorial(false);
  }

  return (
    <>
      {showTutorial && <OnboardingTutorial role={role} onComplete={completeTutorial} />}
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingRoute />} />
          <Route path="/auth" element={<AuthRoute />} />
          <Route path="/join/:trainerId" element={<JoinTrainer />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Student */}
          <Route path="/student" element={
            <ProtectedRoute requiredRole="student">
              <WithOnboarding role="student"><StudentHome /></WithOnboarding>
            </ProtectedRoute>
          } />
          <Route path="/student/schedule" element={
            <ProtectedRoute requiredRole="student"><StudentSchedule /></ProtectedRoute>
          } />
          <Route path="/student/payment" element={
            <ProtectedRoute requiredRole="student"><StudentPayment /></ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute requiredRole="student"><StudentProfile /></ProtectedRoute>
          } />

          {/* Trainer */}
          <Route path="/trainer" element={
            <ProtectedRoute requiredRole="trainer">
              <WithOnboarding role="trainer"><TrainerHome /></WithOnboarding>
            </ProtectedRoute>
          } />
          <Route path="/trainer/schedule" element={
            <ProtectedRoute requiredRole="trainer"><TrainerSchedule /></ProtectedRoute>
          } />
          <Route path="/trainer/students" element={
            <ProtectedRoute requiredRole="trainer"><TrainerStudents /></ProtectedRoute>
          } />
          <Route path="/trainer/finance" element={
            <ProtectedRoute requiredRole="trainer"><TrainerFinance /></ProtectedRoute>
          } />
          <Route path="/trainer/plans" element={
            <ProtectedRoute requiredRole="trainer"><TrainerPlans /></ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}