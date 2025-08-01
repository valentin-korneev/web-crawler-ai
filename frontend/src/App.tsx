import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contractors from './pages/Contractors';
import ContractorPages from './pages/ContractorPages';
import ForbiddenWords from './pages/ForbiddenWords';
import MCCCodes from './pages/MCCCodes';
import ScanResults from './pages/ScanResults';
import ScanSessions from './pages/ScanSessions';
import Users from './pages/Users';
import Login from './pages/Login';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="contractors" element={<Contractors />} />
            <Route path="contractors/:contractorId/pages" element={<ContractorPages />} />
            <Route path="forbidden-words" element={<ForbiddenWords />} />
            <Route path="mcc-codes" element={<MCCCodes />} />
            <Route path="scan-results" element={<ScanResults />} />
            <Route path="scan-sessions" element={<ScanSessions />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </Box>
    </AuthProvider>
  );
}

export default App; 