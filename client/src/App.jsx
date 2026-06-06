import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Calendar from './pages/Calendar';
import Communications from './pages/Communications';
import Tasks from './pages/Tasks';
import Finance from './pages/Finance';
import Learning from './pages/Learning';
import Clients from './pages/Clients';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/communications" element={<Communications />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/finance" element={<Finance />} />
        <Route path="/learning" element={<Learning />} />
        <Route path="/clients" element={<Clients />} />
      </Route>

      <Route path="/" element={<Navigate to="/calendar" replace />} />
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Routes>
  );
}
