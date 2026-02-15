import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout/Layout';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import UploadDocument from './pages/UploadDocument';
import DocumentDetail from './pages/DocumentDetail';
import PendingApprovals from './pages/PendingApprovals';
import Admin from './pages/Admin';
import Loading from './components/ui/Loading';

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen text="Loading..." />;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/upload"
        element={
          <ProtectedRoute>
            <Layout>
              <UploadDocument />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents"
        element={
          <ProtectedRoute>
            <Layout>
              <Documents />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/documents/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <DocumentDetail />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/pending"
        element={
          <ProtectedRoute>
            <Layout>
              <PendingApprovals />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <Layout>
              <Admin />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Home />}
      />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
