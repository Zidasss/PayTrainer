import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoadingScreen } from './components/Shared';
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
  if (session && profile) {
    return <Navigate to={profile.role === 'trainer' ? '/trainer' : '/student'} replace />;
  }
  return <AuthPage />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<AuthRoute />} />
          <Route path="/join/:trainerId" element={
            <ProtectedRoute><JoinTrainer /></ProtectedRoute>
          } />

          {/* Student */}
          <Route path="/student" element={
            <ProtectedRoute requiredRole="student"><StudentHome /></ProtectedRoute>
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
            <ProtectedRoute requiredRole="trainer"><TrainerHome /></ProtectedRoute>
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
