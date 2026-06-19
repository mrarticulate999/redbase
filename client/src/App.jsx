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
import Strategy from './pages/Strategy';
import SwarmOS from './pages/SwarmOS';
import Team from './pages/Team';
import CrmDashboard from './pages/crm/Dashboard';
import CrmLeads from './pages/crm/Leads';
import CrmPipeline from './pages/crm/Pipeline';
import CrmTickets from './pages/crm/Tickets';
import CrmSegments from './pages/crm/Segments';

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
        <Route path="/strategy" element={<Strategy />} />
        <Route path="/swarm" element={<SwarmOS />} />
        <Route path="/team" element={<Team />} />
        <Route path="/crm" element={<CrmDashboard />} />
        <Route path="/crm/leads" element={<CrmLeads />} />
        <Route path="/crm/pipeline" element={<CrmPipeline />} />
        <Route path="/crm/tickets" element={<CrmTickets />} />
        <Route path="/crm/segments" element={<CrmSegments />} />
      </Route>

      <Route path="/" element={<Navigate to="/calendar" replace />} />
      <Route path="*" element={<Navigate to="/calendar" replace />} />
    </Routes>
  );
}
