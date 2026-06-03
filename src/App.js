import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Login from './pages/Login';
import Layout from './layout/Layout';
import Dashboard from './pages/Dashboard';
import ServiceProviderProfile from './pages/ServiceProviderProfile';
import UserProfile from './pages/UserProfile';
import Users from './pages/Users';
import Roles from './pages/Roles';
import ServiceCenters from './pages/ServiceCenters';
import ServiceCenter from './pages/ServiceCenter';
import Services from './pages/Services';
import Clusters from './pages/Clusters';
import Calendar from './pages/Calendar';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import BranchDashboard from './pages/BranchDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastContainer position="bottom-right" autoClose={3000} theme="light" hideProgressBar closeButton={false} />
      <Router basename="/service-gateway">
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/login" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="branch-dashboard" element={<BranchDashboard />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="jobs/:id" element={<JobDetail />} />
            <Route path="user-profile" element={<UserProfile />} />
            <Route path="service-provider-profile" element={<ServiceProviderProfile />} />
            <Route path="users" element={<Users />} />
            <Route path="roles" element={<Roles />} />
            <Route path="service-centers" element={<ServiceCenters />} />
            <Route path="service-centers/:id" element={<ServiceCenter />} />
            <Route path="services" element={<Services />} />
            <Route path="clusters" element={<Clusters />} />
            <Route path="calendar" element={<Calendar />} />
            {/* Settings route removed as it uses Modal now */}
          </Route>
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
