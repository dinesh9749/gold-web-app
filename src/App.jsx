import React from 'react';
import './App.css';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import FeatureGuard from './components/FeatureGuard';
import { Analytics } from "@vercel/analytics/react";

// Gold Retail ERP Pages
import Dashboard from './pages/goldRetail/Dashboard';
import GoldReports from './pages/goldRetail/GoldReports';
import Invoice from './pages/goldRetail/Invoice';
import CustomerView from './pages/goldRetail/CustomerView';
import SalesOrders from './pages/goldRetail/SalesOrders';
import MsDigiGold from './pages/goldRetail/MsDigiGold';
import MsSolderingEngraving from './pages/goldRetail/MsSolderingEngraving';
import Rateinput from './pages/goldRetail/Rateinput';
import Receipt from './pages/goldRetail/Receipt';
import Attendance from './pages/goldRetail/Attendance';
import EmployeeSetup from './pages/goldRetail/EmployeeSetup';
import Stock from './pages/goldRetail/Stock';

// Silver Retail ERP Pages
import SilverRetailDashboard from './pages/silverRetail/SilverRetailDashboard';
import SilverRetailInvoice from './pages/silverRetail/SilverRetailInvoice';
import SilverStock from './pages/silverRetail/SilverStock';
import SilverCustomerLedger from './pages/silverRetail/SilverCustomerLedger';
import SilverSalesReturn from './pages/silverRetail/SilverSalesReturn';

// Shared / Common Pages
import Settings from './pages/common/Settings';
import Login from './pages/common/Login';
import SuperAdmin from './pages/common/SuperAdmin';

function DynamicIndexRedirect() {
  const org = JSON.parse(localStorage.getItem("goldApp_org") || "null");
  const userRole = localStorage.getItem("goldApp_userRole");

  if (userRole === "superadmin") {
    return <Navigate to="/super-admin" replace />;
  }

  const activeErp = localStorage.getItem("activeErpModule") || "gold_retail";

  const hasGold = !org || !org.features || org.features.gold_retail_enabled !== false;
  const hasSilverRetail = !org || !org.features || org.features.silver_retail_enabled !== false;

  if (activeErp === 'silver_retail' && hasSilverRetail) {
    return <Navigate to="/silver-retail-dashboard" replace />;
  }
  if (hasGold) {
    return <Navigate to="/dashboard" replace />;
  }
  if (hasSilverRetail) {
    return <Navigate to="/silver-retail-dashboard" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}

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
            <Route index element={<DynamicIndexRedirect />} />

            {/* Gold Retail ERP Routes */}
            <Route path="dashboard" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="dashboard_enabled"><Dashboard /></FeatureGuard>} />
            <Route path="gold-reports" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="reports_enabled"><GoldReports /></FeatureGuard>} />
            <Route path="Invoice" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="invoice_enabled"><Invoice /></FeatureGuard>} />
            <Route path="Receipt" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="receipt_enabled"><Receipt /></FeatureGuard>} />
            <Route path="SalesOrders" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="salesorders_enabled"><SalesOrders /></FeatureGuard>} />
            <Route path="MsDigiGold" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="digigold_enabled"><MsDigiGold /></FeatureGuard>} />
            <Route path="MsSolderingEngraving" element={<FeatureGuard erpModuleKey="gold_retail_enabled" featureKey="soldering_enabled"><MsSolderingEngraving /></FeatureGuard>} />

            {/* Silver Retail ERP Routes */}
            <Route path="silver-retail-dashboard" element={<FeatureGuard erpModuleKey="silver_retail_enabled" featureKey="silver_retail_dashboard_enabled"><SilverRetailDashboard /></FeatureGuard>} />
            <Route path="silver-retail/invoice" element={<FeatureGuard erpModuleKey="silver_retail_enabled" featureKey="silver_retail_invoice_enabled"><SilverRetailInvoice /></FeatureGuard>} />
            <Route path="silver-retail/stock" element={<FeatureGuard erpModuleKey="silver_retail_enabled" featureKey="silver_retail_stock_enabled"><SilverStock /></FeatureGuard>} />
            <Route path="silver-retail/customer-ledger" element={<FeatureGuard erpModuleKey="silver_retail_enabled" featureKey="silver_retail_ledger_enabled"><SilverCustomerLedger /></FeatureGuard>} />
            <Route path="silver-retail/sales-return" element={<FeatureGuard erpModuleKey="silver_retail_enabled" featureKey="silver_retail_return_enabled"><SilverSalesReturn /></FeatureGuard>} />
            <Route path="silver-retail/rateinput" element={<FeatureGuard erpModuleKey="silver_retail_enabled" featureKey="silver_retail_rateinput_enabled"><Rateinput /></FeatureGuard>} />

            {/* Shared Module Routes */}
            <Route path="rateinput" element={<FeatureGuard featureKey="rateinput_enabled"><Rateinput /></FeatureGuard>} />
            <Route path="customerview" element={<FeatureGuard featureKey="customerview_enabled"><CustomerView /></FeatureGuard>} />
            <Route path="attendance" element={<FeatureGuard featureKey="attendance_enabled"><Attendance /></FeatureGuard>} />
            <Route path="employee-setup" element={<FeatureGuard featureKey="empsetup_enabled"><EmployeeSetup /></FeatureGuard>} />
            <Route path="Stock" element={<FeatureGuard featureKey="stock_enabled"><Stock /></FeatureGuard>} />
            <Route path="settings" element={<FeatureGuard featureKey="settings_enabled"><Settings /></FeatureGuard>} />

            <Route path="*" element={<DynamicIndexRedirect />} />
          </Route>
        </Routes>
      </Router>
      <Analytics />
    </>
  );
}

export default App;
