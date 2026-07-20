import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import HR from './pages/HR';
import NotFound from './pages/NotFound';
import OAuthChooseRole from './pages/OAuthChooseRole';
import DocumentViewer from './pages/DocumentViewer';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-blue"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;
  
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'HR' ? '/hr' : '/'} />;
  }

  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'HR' ? '/hr' : '/'} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'HR' ? '/hr' : '/'} /> : <Register />} />
      <Route path="/oauth/choose-role" element={<OAuthChooseRole />} />
      <Route path="/oauth/success" element={<Navigate to="/" />} />
      
      <Route path="/" element={
        <ProtectedRoute>
          {user?.role === 'HR' ? <Navigate to="/hr" /> : <Dashboard />}
        </ProtectedRoute>
      } />
      
      <Route path="/documents" element={
        <ProtectedRoute>
          <Documents />
        </ProtectedRoute>
      } />
      
      <Route path="/hr" element={
        <ProtectedRoute role="HR">
          <HR />
        </ProtectedRoute>
      } />

      <Route path="/documents/:id" element={
        <ProtectedRoute>
          <DocumentViewer />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
