import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseAPI } from '../../db/supabaseAPI';

export default function GoldReports() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, invoices, receipts, orders, stock, digigold, soldering

  // Data States
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [digiGoldSchemes, setDigiGoldSchemes] = useState([]);
  const [solderingJobs, setSolderingJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [metalRates, setMetalRates] = useState(null);

  // Filters
  const [dateRangeOption, setDateRangeOption] = useState('month'); // today, week, month, all, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper date calculators
  const getFilterDates = useCallback(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateRangeOption === 'today') {
      return { start: todayStr, end: todayStr };
    }
    if (dateRangeOption === 'week') {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - 7);
      return { start: startOfWeek.toISOString().split('T')[0], end: todayStr };
    }
    if (dateRangeOption === 'month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfMonth.toISOString().split('T')[0], end: todayStr };
    }
    if (dateRangeOption === 'custom') {
      return { start: customStartDate, end: customEndDate };
    }
    return { start: null, end: null }; // All time
  }, [dateRangeOption, customStartDate, customEndDate]);

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true);
      const api = window.electronAPI || supabaseAPI;
      
      const [invRes, recRes, ordRes, stkRes, digiRes, soldRes, empRes, ratesRes] = await Promise.allSettled([
        api.getAllInvoices ? api.getAllInvoices() : [],
        api.getAllReceipts ? api.getAllReceipts() : [],
        api.getAllSalesOrders ? api.getAllSalesOrders() : [],
        api.getAllStockTransactions ? api.getAllStockTransactions() : [],
        api.getAllGoldSchemes ? api.getAllGoldSchemes() : [],
        api.getAllSolderingJobs ? api.getAllSolderingJobs() : [],
        api.getAllEmployees ? api.getAllEmployees() : [],
        api.getMetalRates ? api.getMetalRates() : null,
      ]);

      setInvoices(invRes.status === 'fulfilled' && Array.isArray(invRes.value) ? invRes.value : []);
      setReceipts(recRes.status === 'fulfilled' && Array.isArray(recRes.value) ? recRes.value : []);
      setSalesOrders(ordRes.status === 'fulfilled' && Array.isArray(ordRes.value) ? ordRes.value : []);
      setStockItems(stkRes.status === 'fulfilled' && Array.isArray(stkRes.value) ? stkRes.value : []);
      setDigiGoldSchemes(digiRes.status === 'fulfilled' && Array.isArray(digiRes.value) ? digiRes.value : []);
      setSolderingJobs(soldRes.status === 'fulfilled' && Array.isArray(soldRes.value) ? soldRes.value : []);
      setEmployees(empRes.status === 'fulfilled' && Array.isArray(empRes.value) ? empRes.value : []);
      
      if (ratesRes.status === 'fulfilled' && ratesRes.value) {
        setMetalRates(ratesRes.value.metal_rates?.[0] || ratesRes.value);
      }
    } catch (err) {
      console.error("Error loading collective reports data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Date filtering logic
  const isDateInRange = useCallback((dateStr) => {
    if (!dateStr) return true;
    const { start, end } = getFilterDates();
    if (!start && !end) return true;
    
    // Normalize date string (YYYY-MM-DD or ISO)
    const formatted = dateStr.split('T')[0];
    if (start && formatted < start) return false;
    if (end && formatted > end) return false;
    return true;
  }, [getFilterDates]);

  // Filtered Datasets
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchDate = isDateInRange(inv.createdAt || inv.created_at || inv.date);
      const matchQuery = !searchQuery.trim() || 
        (inv.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.invoiceNumber || inv.invoiceNo || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [invoices, isDateInRange, searchQuery]);

  const filteredReceipts = useMemo(() => {
    return receipts.filter(rec => {
      const matchDate = isDateInRange(rec.createdAt || rec.created_at || rec.date);
      const matchQuery = !searchQuery.trim() || 
        (rec.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (rec.receiptNumber || rec.receiptNo || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [receipts, isDateInRange, searchQuery]);

  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const matchDate = isDateInRange(so.createdAt || so.created_at || so.deliveryDate);
      const matchQuery = !searchQuery.trim() || 
        (so.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [salesOrders, isDateInRange, searchQuery]);

  const filteredStockItems = useMemo(() => {
    return stockItems.filter(item => {
      const matchQuery = !searchQuery.trim() || 
        (item.itemName || item.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.purity || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [stockItems, searchQuery]);

  const filteredSolderingJobs = useMemo(() => {
    return solderingJobs.filter(job => {
      const matchDate = isDateInRange(job.createdAt || job.created_at || job.date);
      const matchQuery = !searchQuery.trim() || 
        (job.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (job.ornament || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [solderingJobs, isDateInRange, searchQuery]);

  const filteredDigiGold = useMemo(() => {
    return digiGoldSchemes.filter(sch => {
      const matchQuery = !searchQuery.trim() || 
        (sch.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sch.schemeName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [digiGoldSchemes, searchQuery]);

  // Aggregated Summary Statistics
  const summaryStats = useMemo(() => {
    // Invoices summary
    let totalSalesAmt = 0;
    let totalGstAmt = 0;
    let cashSales = 0;
    let upiSales = 0;
    let cardSales = 0;
    let bankSales = 0;

    filteredInvoices.forEach(inv => {
      const grandTotal = parseFloat(inv.grandTotal || inv.finalAmount || inv.totalAmount || 0);
      const gst = parseFloat(inv.taxAmount || inv.gstAmount || 0);
      totalSalesAmt += grandTotal;
      totalGstAmt += gst;

      const mode = (inv.paymentMode || inv.paymentType || 'Cash').toLowerCase();
      if (mode.includes('upi') || mode.includes('online')) upiSales += grandTotal;
      else if (mode.includes('card')) cardSales += grandTotal;
      else if (mode.includes('bank') || mode.includes('net')) bankSales += grandTotal;
      else cashSales += grandTotal;
    });

    // Receipts summary
    let totalReceiptsCollected = 0;
    filteredReceipts.forEach(rec => {
      totalReceiptsCollected += parseFloat(rec.totalPaid || rec.amount || rec.receivedAmount || 0);
    });

    // Sales Orders summary
    let totalOrdersCount = filteredSalesOrders.length;
    let totalOrderAdvance = 0;
    let pendingOrdersCount = 0;
    filteredSalesOrders.forEach(so => {
      totalOrderAdvance += parseFloat(so.advanceAmount || 0);
      if (so.status !== 'delivered' && so.status !== 'completed') {
        pendingOrdersCount++;
      }
    });

    // Stock Inventory summary
    let totalGrossWeight = 0;
    let totalNetWeight = 0;
    filteredStockItems.forEach(stk => {
      totalGrossWeight += parseFloat(stk.grossWeight || stk.gross_weight || 0);
      totalNetWeight += parseFloat(stk.netWeight || stk.net_weight || 0);
    });

    // DigiGold summary
    let totalDigiGoldAccs = filteredDigiGold.length;
    let totalDigiGoldWeight = 0;
    filteredDigiGold.forEach(sch => {
      totalDigiGoldWeight += parseFloat(sch.accumulatedGoldGrams || sch.total_gold_grams || 0);
    });

    // Soldering summary
    let totalSolderingJobs = filteredSolderingJobs.length;
    let totalSolderingRevenue = 0;
    filteredSolderingJobs.forEach(job => {
      totalSolderingRevenue += parseFloat(job.charge || job.amount || job.cost || 0);
    });

    return {
      totalSalesAmt,
      totalGstAmt,
      cashSales,
      upiSales,
      cardSales,
      bankSales,
      totalReceiptsCollected,
      totalOrdersCount,
      totalOrderAdvance,
      pendingOrdersCount,
      totalGrossWeight,
      totalNetWeight,
      totalDigiGoldAccs,
      totalDigiGoldWeight,
      totalSolderingJobs,
      totalSolderingRevenue,
    };
  }, [filteredInvoices, filteredReceipts, filteredSalesOrders, filteredStockItems, filteredDigiGold, filteredSolderingJobs]);

  // Export CSV Handler
  const handleExportCSV = () => {
    let csvRows = [];
    csvRows.push(['DK Nova Technologies - Gold ERP Collective Report']);
    csvRows.push([`Generated On: ${new Date().toLocaleString()}`]);
    csvRows.push([`Filter Range: ${dateRangeOption.toUpperCase()}`]);
    csvRows.push([]);

    // Summary Section
    csvRows.push(['--- EXECUTIVE SUMMARY ---']);
    csvRows.push(['Metric', 'Value']);
    csvRows.push(['Total Invoices Revenue', `₹${summaryStats.totalSalesAmt.toFixed(2)}`]);
    csvRows.push(['Total Invoices Count', filteredInvoices.length]);
    csvRows.push(['Total Payment Receipts Collected', `₹${summaryStats.totalReceiptsCollected.toFixed(2)}`]);
    csvRows.push(['Total Active Sales Orders', summaryStats.pendingOrdersCount]);
    csvRows.push(['Total Stock Weight (Gross / Net)', `${summaryStats.totalGrossWeight.toFixed(2)}g / ${summaryStats.totalNetWeight.toFixed(2)}g`]);
    csvRows.push(['DigiGold Total Weight Accumulated', `${summaryStats.totalDigiGoldWeight.toFixed(3)}g`]);
    csvRows.push(['Soldering & Engraving Revenue', `₹${summaryStats.totalSolderingRevenue.toFixed(2)}`]);
    csvRows.push([]);

    // Invoices Section
    csvRows.push(['--- INVOICES REPORT ---']);
    csvRows.push(['Invoice No', 'Date', 'Customer Name', 'Payment Mode', 'GST', 'Grand Total']);
    filteredInvoices.forEach(inv => {
      csvRows.push([
        inv.invoiceNumber || inv.invoiceNo || '—',
        inv.createdAt?.split('T')[0] || inv.date || '—',
        `"${inv.customerName || 'Walk-in'}"`,
        inv.paymentMode || inv.paymentType || 'Cash',
        `₹${parseFloat(inv.taxAmount || 0).toFixed(2)}`,
        `₹${parseFloat(inv.grandTotal || inv.finalAmount || 0).toFixed(2)}`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Gold_ERP_Collective_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ paddingBottom: 40, fontFamily: 'var(--font-family)', color: 'var(--text-primary)' }}>
      {/* ── HEADER & FILTER BAR ────────────────────────────────────── */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24, background: 'var(--bg-elevated)', borderRadius: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-300)', display: 'flex', alignItems: 'center', gap: 10 }}>
              📈 Gold ERP Collective Reports & Analytics
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Comprehensive performance report for Invoices, Receipts, Orders, DigiGold, Stock & Repairs
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              📥 Export CSV
            </button>
            <button onClick={handlePrint} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              🖨️ Print Full Report
            </button>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
          paddingTop: 16,
          borderTop: '1px solid var(--border-subtle)'
        }}>
          {/* Quick Date Range Buttons */}
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-default)', padding: 4, borderRadius: 10, border: '1px solid var(--border-default)' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'all', label: 'All Time' },
              { id: 'custom', label: 'Custom' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setDateRangeOption(opt.id)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 700,
                  border: 'none',
                  background: dateRangeOption === opt.id ? 'var(--gold-300)' : 'transparent',
                  color: dateRangeOption === opt.id ? '#1e1b18' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom Date Pickers */}
          {dateRangeOption === 'custom' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="form-input"
                style={{ padding: '5px 10px', fontSize: 12 }}
              />
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>to</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="form-input"
                style={{ padding: '5px 10px', fontSize: 12 }}
              />
            </div>
          )}

          {/* Search Box */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="form-input"
              placeholder="🔍 Search by customer, invoice #, receipt #..."
              style={{ width: '100%', padding: '6px 12px', fontSize: 12 }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          ⌛ Gathering collective report data across modules...
        </div>
      ) : (
        <>
          {/* ── TOP KPI CARDS ─────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16, marginBottom: 24 }}>
            {/* KPI 1: Invoices */}
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #fbbf24' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Invoices Revenue</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', margin: '6px 0 2px 0' }}>
                ₹{summaryStats.totalSalesAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {filteredInvoices.length} invoices generated
              </div>
            </div>

            {/* KPI 2: Receipts */}
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #4ade80' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Receipts</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#4ade80', margin: '6px 0 2px 0' }}>
                ₹{summaryStats.totalReceiptsCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {filteredReceipts.length} payment receipts
              </div>
            </div>

            {/* KPI 3: Sales Orders */}
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #38bdf8' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sales Orders</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', margin: '6px 0 2px 0' }}>
                {summaryStats.pendingOrdersCount} Active
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                ₹{summaryStats.totalOrderAdvance.toLocaleString('en-IN')} advance collected ({summaryStats.totalOrdersCount} total)
              </div>
            </div>

            {/* KPI 4: Stock Weight */}
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #a78bfa' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Gold Stock</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#a78bfa', margin: '6px 0 2px 0' }}>
                {summaryStats.totalNetWeight.toFixed(2)} g
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {summaryStats.totalGrossWeight.toFixed(2)}g gross weight ({filteredStockItems.length} items)
              </div>
            </div>

            {/* KPI 5: DigiGold */}
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #f472b6' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>DigiGold Schemes</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#f472b6', margin: '6px 0 2px 0' }}>
                {summaryStats.totalDigiGoldWeight.toFixed(3)} g
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {summaryStats.totalDigiGoldAccs} scheme accounts
              </div>
            </div>

            {/* KPI 6: Soldering */}
            <div className="card" style={{ padding: 18, borderLeft: '4px solid #fb923c' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soldering & Service</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fb923c', margin: '6px 0 2px 0' }}>
                ₹{summaryStats.totalSolderingRevenue.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {summaryStats.totalSolderingJobs} jobs processed
              </div>
            </div>
          </div>

          {/* ── REPORT CATEGORY TABS ─────────────────────────────────── */}
          <div style={{
            display: 'flex',
            gap: 8,
            borderBottom: '1px solid var(--border-default)',
            marginBottom: 20,
            overflowX: 'auto',
            paddingBottom: 4
          }}>
            {[
              { id: 'overview', label: '📊 Overview & Charts' },
              { id: 'invoices', label: `🧾 Invoices (${filteredInvoices.length})` },
              { id: 'receipts', label: `💳 Receipts (${filteredReceipts.length})` },
              { id: 'orders', label: `📦 Sales Orders (${filteredSalesOrders.length})` },
              { id: 'stock', label: `🏆 Gold Inventory (${filteredStockItems.length})` },
              { id: 'digigold', label: `💰 DigiGold (${filteredDigiGold.length})` },
              { id: 'soldering', label: `🔧 Soldering (${filteredSolderingJobs.length})` },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--gold-300)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--gold-300)' : 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB CONTENT VIEWS ──────────────────────────────────── */}

          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Payment Mode Breakdown Card */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--gold-300)' }}>
                  💳 Sales Revenue Payment Mode Breakdown
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Cash Payments</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
                      ₹{summaryStats.cashSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                    <div style={{ fontSize: 11, color: '#38bdf8', fontWeight: 600 }}>UPI / QR Online</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                      ₹{summaryStats.upiSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <div style={{ fontSize: 11, color: '#c084fc', fontWeight: 600 }}>Debit / Credit Card</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                      ₹{summaryStats.cardSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ padding: 14, borderRadius: 10, background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)' }}>
                    <div style={{ fontSize: 11, color: '#fb923c', fontWeight: 600 }}>Bank Transfer / NEFT</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fb923c', marginTop: 4 }}>
                      ₹{summaryStats.bankSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Transactions Combined Table */}
              <div className="card" style={{ padding: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--gold-300)' }}>
                  ⚡ Recent Invoices Summary
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '8px 10px' }}>Invoice #</th>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                        <th style={{ padding: '8px 10px' }}>Customer Name</th>
                        <th style={{ padding: '8px 10px' }}>Payment Mode</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Tax (GST)</th>
                        <th style={{ padding: '8px 10px', textAlign: 'right' }}>Grand Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInvoices.slice(0, 10).map((inv, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--gold-200)' }}>{inv.invoiceNumber || inv.invoiceNo || `INV-${idx+1}`}</td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{inv.createdAt?.split('T')[0] || inv.date || '—'}</td>
                          <td style={{ padding: '10px 10px', fontWeight: 600 }}>{inv.customerName || 'Walk-in Customer'}</td>
                          <td style={{ padding: '10px 10px' }}>
                            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(251,191,36,0.1)', color: 'var(--gold-300)', fontSize: 10, fontWeight: 700 }}>
                              {inv.paymentMode || inv.paymentType || 'Cash'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 10px', textAlign: 'right' }}>₹{parseFloat(inv.taxAmount || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 10px', textAlign: 'right', fontWeight: 800, color: '#4ade80' }}>
                            ₹{parseFloat(inv.grandTotal || inv.finalAmount || inv.totalAmount || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {filteredInvoices.length === 0 && (
                        <tr>
                          <td colSpan="6" style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No invoice records found in selected range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVOICES REPORT */}
          {activeTab === 'invoices' && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-300)' }}>Detailed Gold Invoice Ledger</h3>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                  Total: ₹{summaryStats.totalSalesAmt.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Invoice No</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Customer</th>
                      <th style={{ padding: '10px' }}>Mobile</th>
                      <th style={{ padding: '10px' }}>Payment Mode</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>GST</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{inv.invoiceNumber || inv.invoiceNo || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{inv.createdAt?.split('T')[0] || inv.date || '—'}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{inv.customerName || 'Walk-in'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{inv.customerMobile || inv.mobile || '—'}</td>
                        <td style={{ padding: '10px' }}>{inv.paymentMode || inv.paymentType || 'Cash'}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>₹{parseFloat(inv.taxAmount || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#4ade80' }}>
                          ₹{parseFloat(inv.grandTotal || inv.finalAmount || inv.totalAmount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RECEIPTS REPORT */}
          {activeTab === 'receipts' && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-300)' }}>Payment Receipts Collected</h3>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#4ade80' }}>
                  Total Collected: ₹{summaryStats.totalReceiptsCollected.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Receipt No</th>
                      <th style={{ padding: '10px' }}>Date</th>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Payment Mode</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.map((rec, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{rec.receiptNumber || rec.receiptNo || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{rec.createdAt?.split('T')[0] || rec.date || '—'}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{rec.customerName || '—'}</td>
                        <td style={{ padding: '10px' }}>{rec.paymentMode || 'Cash'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#4ade80' }}>
                          ₹{parseFloat(rec.totalPaid || rec.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: SALES ORDERS */}
          {activeTab === 'orders' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--gold-300)' }}>Sales Orders Status</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Customer</th>
                      <th style={{ padding: '10px' }}>Delivery Date</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Advance Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesOrders.map((so, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{so.customerName || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{so.deliveryDate || '—'}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{
                            padding: '3px 8px', borderRadius: 12, fontSize: 10, fontWeight: 700,
                            background: so.status === 'delivered' ? 'rgba(74,222,128,0.1)' : 'rgba(251,191,36,0.1)',
                            color: so.status === 'delivered' ? '#4ade80' : '#fbbf24'
                          }}>
                            {(so.status || 'pending').toUpperCase()}
                          </span>
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800 }}>₹{parseFloat(so.advanceAmount || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: STOCK & INVENTORY */}
          {activeTab === 'stock' && (
            <div className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-300)' }}>Gold Stock Inventory Summary</h3>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  Total Net Weight: <strong>{summaryStats.totalNetWeight.toFixed(2)}g</strong>
                </div>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Item Name</th>
                      <th style={{ padding: '10px' }}>Purity</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Gross Wt (g)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Net Wt (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockItems.map((stk, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{stk.itemName || stk.item_name || 'Gold Ornament'}</td>
                        <td style={{ padding: '10px', color: 'var(--gold-200)', fontWeight: 700 }}>{stk.purity || '22K'}</td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>{parseFloat(stk.grossWeight || stk.gross_weight || 0).toFixed(2)}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#a78bfa' }}>
                          {parseFloat(stk.netWeight || stk.net_weight || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DIGIGOLD SCHEMES */}
          {activeTab === 'digigold' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--gold-300)' }}>DigiGold Scheme Accounts</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Scheme</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Accumulated Gold (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDigiGold.map((sch, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{sch.customerName || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{sch.schemeName || 'Monthly Gold Saver'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#f472b6' }}>
                          {parseFloat(sch.accumulatedGoldGrams || sch.total_gold_grams || 0).toFixed(3)} g
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: SOLDERING & REPAIR */}
          {activeTab === 'soldering' && (
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: 'var(--gold-300)' }}>M.S. Soldering & Engraving Jobs</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '10px' }}>Job ID</th>
                      <th style={{ padding: '10px' }}>Customer</th>
                      <th style={{ padding: '10px' }}>Ornament</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSolderingJobs.map((job, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{job.id ? `#${job.id.slice(0, 6)}` : `JOB-${idx+1}`}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{job.customerName || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{job.ornament || '—'}</td>
                        <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#fb923c' }}>
                          ₹{parseFloat(job.charge || job.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
