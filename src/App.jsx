
import React from 'react';
import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Invoice from './pages/Invoice';
import CustomerView from './pages/CustomerView';
import SalesOrders from './pages/SalesOrders';
import MsDigiGold from './pages/MsDigiGold';
import Settings from './pages/Settings';
import Rateinput from './pages/Rateinput'
import Receipt from './pages/Receipt'
import Attendance from './pages/Attendance'
import EmployeeSetup from './pages/EmployeeSetup'




function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="Invoice" element={<Invoice />} />

          <Route path="Receipt" element={<Receipt />} />
          <Route path="rateinput" element={<Rateinput />} />
          <Route path="customerview" element={<CustomerView />} />
          <Route path="SalesOrders" element={<SalesOrders />} />
          <Route path="MsDigiGold" element={<MsDigiGold />} />
          <Route path="settings" element={<Settings />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="employee-setup" element={<EmployeeSetup />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />


        </Route>
      </Routes>
    </Router>
  );
}

export default App;