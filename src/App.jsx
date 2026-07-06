import React from 'react';
import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';
import CustomerView from './pages/CustomerView';
import SalesOrders from './pages/SalesOrders';
import MsDigiGold from './pages/MsDigiGold';
import MsSolderingEngraving from './pages/MsSolderingEngraving';
import Settings from './pages/Settings';
import Rateinput from './pages/Rateinput';
import Receipt from './pages/Receipt';
import Attendance from './pages/Attendance';
import EmployeeSetup from './pages/EmployeeSetup';
import PosterCreate from './pages/PosterCreate';
import Login from './pages/Login';
import SuperAdmin from './pages/SuperAdmin';
import FeatureGuard from './components/FeatureGuard';
import { Analytics } from "@vercel/analytics/react";

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/super-admin" element={
            <FeatureGuard isSuperAdminOnly={true}>
              <SuperAdmin />
            </FeatureGuard>
          } />

          <Route path="/" element={
            <FeatureGuard>
              <Layout />
            </FeatureGuard>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<FeatureGuard featureKey="dashboard_enabled"><Dashboard /></FeatureGuard>} />
            <Route path="Invoice" element={<FeatureGuard featureKey="invoice_enabled"><Invoice /></FeatureGuard>} />
            <Route path="Receipt" element={<FeatureGuard featureKey="receipt_enabled"><Receipt /></FeatureGuard>} />
            <Route path="rateinput" element={<FeatureGuard featureKey="rateinput_enabled"><Rateinput /></FeatureGuard>} />
            <Route path="customerview" element={<FeatureGuard featureKey="customerview_enabled"><CustomerView /></FeatureGuard>} />
            <Route path="SalesOrders" element={<FeatureGuard featureKey="salesorders_enabled"><SalesOrders /></FeatureGuard>} />
            <Route path="MsDigiGold" element={<FeatureGuard featureKey="digigold_enabled"><MsDigiGold /></FeatureGuard>} />
            <Route path="MsSolderingEngraving" element={<FeatureGuard featureKey="soldering_enabled"><MsSolderingEngraving /></FeatureGuard>} />
            <Route path="attendance" element={<FeatureGuard featureKey="attendance_enabled"><Attendance /></FeatureGuard>} />
            <Route path="employee-setup" element={<FeatureGuard featureKey="empsetup_enabled"><EmployeeSetup /></FeatureGuard>} />
            <Route path="settings" element={<FeatureGuard featureKey="settings_enabled"><Settings /></FeatureGuard>} />
            <Route path="poster-create" element={<FeatureGuard featureKey="poster_enabled"><PosterCreate /></FeatureGuard>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default App;
