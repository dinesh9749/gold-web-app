import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabaseAPI } from '../../db/supabaseAPI';
import * as XLSX from 'xlsx';

export default function GoldReports() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, invoices, receipts, orders, stock, digigold, soldering
  const [showPdfPreviewModal, setShowPdfPreviewModal] = useState(false);

  // Data States
  const [invoices, setInvoices] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [salesOrders, setSalesOrders] = useState([]);
  const [stockItems, setStockItems] = useState([]);
  const [digiGoldSchemes, setDigiGoldSchemes] = useState([]);
  const [solderingJobs, setSolderingJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [metalRates, setMetalRates] = useState(null);

  // Helper convertToWords for A4 Invoices PDF Export
  const convertToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
      'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const numString = Math.round(Number(num) || 0).toString();
    const rupees = parseInt(numString) || 0;

    if (rupees === 0) return 'Zero Only';

    function convertNumberToWords(n) {
      if (n === 0) return '';
      if (n < 20) return ones[n];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertNumberToWords(n % 100) : '');
      if (n < 100000) return convertNumberToWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convertNumberToWords(n % 1000) : '');
      if (n < 10000000) return convertNumberToWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convertNumberToWords(n % 100000) : '');
      return convertNumberToWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convertNumberToWords(n % 10000000) : '');
    }

    return `Rupees ${convertNumberToWords(rupees)} Only`;
  };

  // Filters
  const [dateRangeOption, setDateRangeOption] = useState('month'); // today, week, month, all, custom
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Helper date formatter
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      if (typeof dateStr === 'string') {
        const clean = dateStr.split('T')[0];
        if (clean && clean.length === 10) return clean;
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
    } catch (e) {}
    return String(dateStr);
  };

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
      const api = supabaseAPI;
      
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
      const matchDate = isDateInRange(so.createdAt || so.created_at || so.orderDate || so.date || so.deliveryDate);
      const matchQuery = !searchQuery.trim() || 
        (so.customerName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [salesOrders, isDateInRange, searchQuery]);

  const filteredStockItems = useMemo(() => {
    return stockItems.filter(item => {
      const matchDate = isDateInRange(item.createdAt || item.created_at || item.entryDate || item.date);
      const matchQuery = !searchQuery.trim() || 
        (item.itemName || item.item_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.purity || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [stockItems, isDateInRange, searchQuery]);

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
      const matchDate = isDateInRange(sch.createdAt || sch.created_at || sch.startDate || sch.date);
      const matchQuery = !searchQuery.trim() || 
        (sch.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sch.schemeName || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchDate && matchQuery;
    });
  }, [digiGoldSchemes, isDateInRange, searchQuery]);

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
      totalSolderingRevenue += parseFloat(job.totalAmount ?? job.total_amount ?? job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? job.cost ?? 0);
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

  // Global master invoice map calculated chronologically across all historical invoices and soldering jobs
  const masterInvoiceMap = useMemo(() => {
    const map = {};
    try {
      const combinedAll = [];
      (invoices || []).forEach(inv => {
        const rawDate = inv.createdAt || inv.created_at || inv.date || '';
        const t = new Date(rawDate).getTime();
        combinedAll.push({
          id: inv.id,
          rawNo: inv.invoiceNo || inv.invoiceNumber || null,
          time: isNaN(t) ? 0 : t,
          source: 'Invoice'
        });
      });

      (solderingJobs || []).forEach(job => {
        const rawDate = job.createdAt || job.created_at || job.date || '';
        const t = new Date(rawDate).getTime();
        combinedAll.push({
          id: job.id,
          rawNo: job.invoiceNo || job.invoiceNumber || job.receiptNo || null,
          time: isNaN(t) ? 0 : t,
          source: 'Soldering'
        });
      });

      // Sort all-time items chronologically (oldest first)
      combinedAll.sort((a, b) => (a.time || 0) - (b.time || 0));

      const usedInvoiceNos = new Set();
      let currentSeqNum = 1001;

      combinedAll.forEach(item => {
        let finalNo = item.rawNo != null ? String(item.rawNo).trim() : '';
        if (!finalNo || finalNo.startsWith('#') || finalNo.length > 20 || usedInvoiceNos.has(finalNo)) {
          while (usedInvoiceNos.has(`INV-${currentSeqNum}`)) {
            currentSeqNum++;
          }
          finalNo = `INV-${currentSeqNum}`;
          currentSeqNum++;
        } else {
          const match = finalNo.match(/(\d+)/);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n >= currentSeqNum) currentSeqNum = n + 1;
          }
        }
        usedInvoiceNos.add(finalNo);
        if (item.id) {
          map[item.id] = finalNo;
        }
      });
    } catch (e) {
      console.error('Error generating master invoice map:', e);
    }
    return map;
  }, [invoices, solderingJobs]);

  // Unified Combined GST Filing Ledger (Invoices + Soldering Jobs sorted by Invoice Number)
  const combinedGstLedger = useMemo(() => {
    const combinedRaw = [];

    // Collect all invoices
    (filteredInvoices || []).forEach((inv, idx) => {
      let cgst = parseFloat(inv.cgstAmount ?? inv.cgst_amount ?? 0);
      let sgst = parseFloat(inv.sgstAmount ?? inv.sgst_amount ?? 0);
      let subtotal = parseFloat(inv.subtotal ?? inv.taxableAmount ?? 0);
      let grandTotal = parseFloat(inv.grandTotal ?? inv.finalAmount ?? inv.totalAmount ?? 0);
      let taxAmount = parseFloat(inv.taxAmount ?? inv.gstAmount ?? (cgst + sgst));

      // Fallback: If taxAmount is 0 but subtotal or grandTotal exists, compute 3% GST (1.5% CGST + 1.5% SGST)
      if (taxAmount === 0) {
        if (subtotal > 0) {
          taxAmount = Math.round(subtotal * 0.03 * 100) / 100;
          cgst = Math.round((taxAmount / 2) * 100) / 100;
          sgst = Math.round((taxAmount / 2) * 100) / 100;
        } else if (grandTotal > 0) {
          subtotal = Math.round((grandTotal / 1.03) * 100) / 100;
          taxAmount = Math.round((grandTotal - subtotal) * 100) / 100;
          cgst = Math.round((taxAmount / 2) * 100) / 100;
          sgst = Math.round((taxAmount / 2) * 100) / 100;
        }
      }

      if (grandTotal === 0 && subtotal > 0) {
        grandTotal = subtotal + taxAmount;
      }
      if (subtotal === 0 && grandTotal > 0) {
        subtotal = grandTotal - taxAmount;
      }

      const rawDate = inv.createdAt || inv.created_at || inv.date || '';

      // Extract actual HSN code(s) from invoice items if present
      let extractedHsn = '';
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        const hsnList = inv.items.map(i => i.hsnCode || i.hsn_code).filter(Boolean);
        if (hsnList.length > 0) {
          extractedHsn = [...new Set(hsnList)].join(', ');
        }
      }

      const assignedNo = inv.invoiceNo || inv.invoiceNumber || (inv.id && masterInvoiceMap[inv.id]) || null;

      // Calculate total gross weight from invoice items
      let totalGrossWeight = 0;
      if (Array.isArray(inv.items) && inv.items.length > 0) {
        inv.items.forEach(it => {
          const nw = Number(it.netWeight || it.net_weight) || 0;
          const wp = Number(it.wastagePct || it.wastage_pct) || 0;
          const sw = Number(it.stoneWeight || it.stone_weight) || 0;
          const itemGross = it.grossWeight != null && it.grossWeight !== ''
            ? Number(it.grossWeight)
            : (it.gross_weight != null && it.gross_weight !== ''
                ? Number(it.gross_weight)
                : Math.max(0, nw * (1 + wp / 100) - sw));
          totalGrossWeight += itemGross;
        });
      }

      combinedRaw.push({
        id: inv.id || `inv-${idx}`,
        source: 'Invoice',
        typeLabel: 'Gold Retail Sale',
        rawInvoiceNo: assignedNo,
        date: formatDate(inv.createdAt || inv.created_at || inv.date),
        rawTime: new Date(rawDate).getTime() || 0,
        customerName: inv.customerName || 'Walk-in Customer',
        hsnSac: extractedHsn || inv.hsnCode || inv.hsn_code || '7113',
        grossWeight: totalGrossWeight,
        taxableAmount: subtotal,
        gstRateLabel: '3% (1.5% CGST + 1.5% SGST)',
        cgstAmount: cgst,
        sgstAmount: sgst,
        totalGstAmount: taxAmount,
        grandTotal: grandTotal,
        paymentMode: inv.paymentMode || inv.paymentType || 'Cash',
        rawInvoice: inv
      });
    });

    // Collect all soldering jobs
    (filteredSolderingJobs || []).forEach((job, idx) => {
      const marking = parseFloat(job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? 0);
      const gst = parseFloat(job.gstAmount ?? job.gst_amount ?? (marking * 0.05) ?? 0);
      const total = parseFloat(job.totalAmount ?? job.total_amount ?? (marking + gst) ?? 0);
      const rawDate = job.createdAt || job.created_at || job.date || '';
      const assignedNo = job.invoiceNo || job.invoiceNumber || job.receiptNo || (job.id && masterInvoiceMap[job.id]) || null;

      combinedRaw.push({
        id: job.id || `job-${idx}`,
        source: 'Soldering',
        typeLabel: 'Soldering & Engraving',
        rawInvoiceNo: assignedNo,
        date: formatDate(job.createdAt || job.created_at || job.date),
        rawTime: new Date(rawDate).getTime() || 0,
        customerName: job.customerName || job.customer_name || '—',
        hsnSac: '7113',
        grossWeight: 0,
        taxableAmount: marking,
        gstRateLabel: '5% (2.5% CGST + 2.5% SGST)',
        cgstAmount: gst / 2,
        sgstAmount: gst / 2,
        totalGstAmount: gst,
        grandTotal: total,
        paymentMode: 'Service / Cash',
        rawJob: job
      });
    });

    // Map each item to its persistent sequential invoice number
    const list = combinedRaw.map(item => {
      let finalNo = item.rawInvoiceNo != null ? String(item.rawInvoiceNo).trim() : '';
      if (!finalNo || finalNo.startsWith('#') || finalNo.length > 20) {
        finalNo = (item.id && masterInvoiceMap[item.id]) || '';
      }
      return {
        ...item,
        invoiceNo: finalNo || '—'
      };
    });

    // Sort ledger continuously by Invoice Number for display
    list.sort((a, b) => {
      const matchA = String(a.invoiceNo).match(/(\d+)/);
      const matchB = String(b.invoiceNo).match(/(\d+)/);
      if (matchA && matchB) {
        const numA = parseInt(matchA[1], 10);
        const numB = parseInt(matchB[1], 10);
        if (numA !== numB) return numA - numB;
      }
      return (a.rawTime || 0) - (b.rawTime || 0);
    });

    return list;
  }, [filteredInvoices, filteredSolderingJobs, masterInvoiceMap]);

  const gstStats = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalGst = 0;
    let totalGrand = 0;
    let totalGrossWeight = 0;

    combinedGstLedger.forEach(item => {
      totalTaxable += item.taxableAmount;
      totalCgst += item.cgstAmount;
      totalSgst += item.sgstAmount;
      totalGst += item.totalGstAmount;
      totalGrand += item.grandTotal;
      totalGrossWeight += (item.grossWeight || 0);
    });

    return {
      count: combinedGstLedger.length,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalGst,
      totalGrand,
      totalGrossWeight
    };
  }, [combinedGstLedger]);

  const handleExportGSTReportCSV = () => {
    let csvRows = [];
    csvRows.push(['DK Nova Technologies - Combined GST Filing Report (GSTR-1 Format)']);
    csvRows.push([`Generated On: ${new Date().toLocaleString()}`]);
    csvRows.push([`Filter Range: ${dateRangeOption.toUpperCase()}`]);
    csvRows.push([]);

    csvRows.push(['--- GST SUMMARY TOTALS ---']);
    csvRows.push(['Total Tax Invoices Count', gstStats.count]);
    csvRows.push(['Total Invoiced Gross Weight', `${gstStats.totalGrossWeight.toFixed(3)}g`]);
    csvRows.push(['Total Taxable Value', `₹${gstStats.totalTaxable.toFixed(2)}`]);
    csvRows.push(['Total CGST Collected', `₹${gstStats.totalCgst.toFixed(2)}`]);
    csvRows.push(['Total SGST Collected', `₹${gstStats.totalSgst.toFixed(2)}`]);
    csvRows.push(['Total GST Liability', `₹${gstStats.totalGst.toFixed(2)}`]);
    csvRows.push(['Total Invoiced Amount', `₹${gstStats.totalGrand.toFixed(2)}`]);
    csvRows.push([]);

    csvRows.push(['--- DETAILED GST TAX INVOICE LEDGER (ORDERED BY INVOICE NO) ---']);
    csvRows.push(['Invoice No', 'Date', 'Type', 'HSN/SAC', 'Customer Name', 'Gross Wt (g)', 'Taxable Value (₹)', 'GST Rate', 'CGST (₹)', 'SGST (₹)', 'Total Tax (₹)', 'Invoice Total (₹)']);
    
    combinedGstLedger.forEach(item => {
      csvRows.push([
        item.invoiceNo,
        item.date,
        `"${item.typeLabel}"`,
        item.hsnSac,
        `"${item.customerName}"`,
        item.grossWeight > 0 ? item.grossWeight.toFixed(3) : '',
        `₹${item.taxableAmount.toFixed(2)}`,
        `"${item.gstRateLabel}"`,
        `₹${item.cgstAmount.toFixed(2)}`,
        `₹${item.sgstAmount.toFixed(2)}`,
        `₹${item.totalGstAmount.toFixed(2)}`,
        `₹${item.grandTotal.toFixed(2)}`
      ]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Combined_GST_Filing_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Combined GST Report to Excel (.xlsx) Handler
  const handleExportGSTReportExcel = () => {
    try {
      const wb = XLSX.utils.book_new();

      // --- SHEET 1: COMBINED GST INVOICE LEDGER ---
      const summaryAOA = [
        ['DK Nova Technologies - Combined GST Filing Report'],
        [`Generated On: ${new Date().toLocaleString()}`],
        [`Filter Range: ${dateRangeOption.toUpperCase()}`],
        [],
        ['--- GST SUMMARY TOTALS ---', ''],
        ['Total Tax Invoices Count', gstStats.count],
        ['Total Gross Weight (g)', Number(gstStats.totalGrossWeight.toFixed(3))],
        ['Total Taxable Value (₹)', Number(gstStats.totalTaxable.toFixed(2))],
        ['Total CGST Collected (₹)', Number(gstStats.totalCgst.toFixed(2))],
        ['Total SGST Collected (₹)', Number(gstStats.totalSgst.toFixed(2))],
        ['Total GST Liability (₹)', Number(gstStats.totalGst.toFixed(2))],
        ['Total Invoiced Amount (₹)', Number(gstStats.totalGrand.toFixed(2))],
        [],
        [
          'Invoice No',
          'Date',
          'Document Type',
          'HSN/SAC',
          'Customer Name',
          'Gross Wt (g)',
          'Taxable Value (₹)',
          'GST Rate',
          'CGST (₹)',
          'SGST (₹)',
          'Total GST (₹)',
          'Invoice Total (₹)',
          'Payment Mode'
        ]
      ];

      combinedGstLedger.forEach(item => {
        summaryAOA.push([
          item.invoiceNo,
          item.date,
          item.typeLabel,
          item.hsnSac,
          item.customerName,
          item.grossWeight > 0 ? Number(item.grossWeight.toFixed(3)) : '',
          Number(item.taxableAmount.toFixed(2)),
          item.gstRateLabel,
          Number(item.cgstAmount.toFixed(2)),
          Number(item.sgstAmount.toFixed(2)),
          Number(item.totalGstAmount.toFixed(2)),
          Number(item.grandTotal.toFixed(2)),
          item.paymentMode || 'Cash'
        ]);
      });

      // Total summary row
      summaryAOA.push([
        'TOTAL',
        '',
        '',
        '',
        '',
        Number(gstStats.totalGrossWeight.toFixed(3)),
        Number(gstStats.totalTaxable.toFixed(2)),
        '',
        Number(gstStats.totalCgst.toFixed(2)),
        Number(gstStats.totalSgst.toFixed(2)),
        Number(gstStats.totalGst.toFixed(2)),
        Number(gstStats.totalGrand.toFixed(2)),
        ''
      ]);

      const wsLedger = XLSX.utils.aoa_to_sheet(summaryAOA);
      wsLedger['!cols'] = [
        { wch: 16 }, // Invoice No
        { wch: 14 }, // Date
        { wch: 24 }, // Document Type
        { wch: 12 }, // HSN/SAC
        { wch: 28 }, // Customer Name
        { wch: 15 }, // Gross Wt (g)
        { wch: 18 }, // Taxable Value
        { wch: 26 }, // GST Rate
        { wch: 14 }, // CGST
        { wch: 14 }, // SGST
        { wch: 16 }, // Total GST
        { wch: 18 }, // Invoice Total
        { wch: 18 }  // Payment Mode
      ];
      XLSX.utils.book_append_sheet(wb, wsLedger, 'GST Invoice Ledger');

      // --- SHEET 2: DETAILED ITEM-LEVEL BREAKDOWN ---
      const itemsAOA = [
        [
          'Invoice No',
          'Date',
          'Customer Name',
          'Document Type',
          'Description / Product',
          'HSN/SAC',
          'Net Wt (g)',
          'Wastage %',
          'Stone Wt (g)',
          'Gross Wt (g)',
          'Rate / g (₹)',
          'Making / Marking Charge (₹)',
          'GST (₹)',
          'Total Charge (₹)'
        ]
      ];

      combinedGstLedger.forEach(item => {
        if (item.source === 'Invoice') {
          const rawInv = item.rawInvoice;
          const itemsList = Array.isArray(rawInv?.items) && rawInv.items.length > 0 ? rawInv.items : [
            { description: 'Gold Jewellery Ornament', hsnCode: '7113', netWeight: 0, wastagePct: 0, stoneWeight: 0, ratePerGram: 0, makingCharges: 0, amount: item.taxableAmount }
          ];
          itemsList.forEach(it => {
            const nw = Number(it.netWeight || it.net_weight) || 0;
            const wp = Number(it.wastagePct || it.wastage_pct) || 0;
            const sw = Number(it.stoneWeight || it.stone_weight) || 0;
            const gross = Math.max(0, nw * (1 + wp / 100) - sw);
            const rate = Number(it.rate || it.ratePerGram || it.rate_per_gram) || 0;
            const making = Number(it.makingCharges || it.making_charges) || 0;
            const amt = Number(it.amount) || 0;
            itemsAOA.push([
              item.invoiceNo,
              item.date,
              item.customerName,
              item.typeLabel,
              it.description || 'Gold Ornament',
              it.hsnCode || it.hsn_code || item.hsnSac || '7113',
              nw ? Number(nw.toFixed(3)) : '',
              wp ? Number(wp.toFixed(2)) : '',
              sw ? Number(sw.toFixed(3)) : '',
              gross ? Number(gross.toFixed(3)) : '',
              rate ? Number(rate.toFixed(2)) : '',
              making ? Number(making.toFixed(2)) : '',
              Number((amt * 0.03).toFixed(2)),
              Number((amt * 1.03).toFixed(2))
            ]);
          });
        } else {
          // Soldering job item
          const job = item.rawJob || {};
          const marking = parseFloat(job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? 0);
          const gst = parseFloat(job.gstAmount ?? job.gst_amount ?? (marking * 0.05) ?? 0);
          const total = parseFloat(job.totalAmount ?? job.total_amount ?? (marking + gst) ?? 0);
          itemsAOA.push([
            item.invoiceNo,
            item.date,
            item.customerName,
            item.typeLabel,
            job.product || job.ornament || 'Soldering & Engraving Service',
            item.hsnSac || '7113',
            '',
            '',
            '',
            '',
            '',
            Number(marking.toFixed(2)),
            Number(gst.toFixed(2)),
            Number(total.toFixed(2))
          ]);
        }
      });

      const wsItems = XLSX.utils.aoa_to_sheet(itemsAOA);
      wsItems['!cols'] = [
        { wch: 16 }, // Invoice No
        { wch: 14 }, // Date
        { wch: 24 }, // Customer Name
        { wch: 22 }, // Document Type
        { wch: 30 }, // Description
        { wch: 12 }, // HSN/SAC
        { wch: 14 }, // Net Wt
        { wch: 12 }, // Wastage %
        { wch: 14 }, // Stone Wt
        { wch: 14 }, // Gross Wt
        { wch: 14 }, // Rate/g
        { wch: 26 }, // Making/Marking
        { wch: 14 }, // GST
        { wch: 16 }  // Total Charge
      ];
      XLSX.utils.book_append_sheet(wb, wsItems, 'Invoice Item Details');

      // Export file
      const filename = `Combined_GST_Invoices_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Error exporting GST Report to Excel:', err);
      alert('Failed to export Excel report: ' + err.message);
    }
  };

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
        inv.invoiceNumber || inv.invoiceNo || (inv.id && masterInvoiceMap[inv.id]) || '—',
        formatDate(inv.createdAt || inv.created_at || inv.date),
        `"${inv.customerName || 'Walk-in'}"`,
        inv.paymentMode || inv.paymentType || 'Cash',
        `₹${parseFloat(inv.taxAmount || 0).toFixed(2)}`,
        `₹${parseFloat(inv.grandTotal || inv.finalAmount || 0).toFixed(2)}`
      ]);
    });
    csvRows.push([]);

    // Receipts Section
    csvRows.push(['--- RECEIPTS REPORT ---']);
    csvRows.push(['Receipt No', 'Date', 'Customer Name', 'Payment Mode', 'Total Paid']);
    filteredReceipts.forEach(rec => {
      csvRows.push([
        rec.receiptNumber || rec.receiptNo || '—',
        formatDate(rec.createdAt || rec.created_at || rec.date),
        `"${rec.customerName || '—'}"`,
        rec.paymentMode || 'Cash',
        `₹${parseFloat(rec.totalPaid || rec.amount || 0).toFixed(2)}`
      ]);
    });
    csvRows.push([]);

    // Sales Orders Section
    csvRows.push(['--- SALES ORDERS REPORT ---']);
    csvRows.push(['Order No', 'Order Date', 'Customer Name', 'Delivery Date', 'Status', 'Advance Paid']);
    filteredSalesOrders.forEach(so => {
      csvRows.push([
        so.orderNumber || so.orderNo || (so.id ? `#${so.id.slice(0, 6)}` : '—'),
        formatDate(so.createdAt || so.created_at || so.orderDate || so.date),
        `"${so.customerName || '—'}"`,
        formatDate(so.deliveryDate),
        (so.status || 'pending').toUpperCase(),
        `₹${parseFloat(so.advanceAmount || 0).toFixed(2)}`
      ]);
    });
    csvRows.push([]);

    // Stock Inventory Section
    csvRows.push(['--- STOCK INVENTORY REPORT ---']);
    csvRows.push(['Barcode / ID', 'Entry Date', 'Item Name', 'Purity', 'Gross Weight (g)', 'Net Weight (g)']);
    filteredStockItems.forEach(stk => {
      csvRows.push([
        stk.barcode || (stk.id ? `#${stk.id.slice(0, 6)}` : '—'),
        formatDate(stk.createdAt || stk.created_at || stk.entryDate || stk.date),
        `"${stk.itemName || stk.item_name || 'Gold Ornament'}"`,
        stk.purity || '22K',
        parseFloat(stk.grossWeight || stk.gross_weight || 0).toFixed(2),
        parseFloat(stk.netWeight || stk.net_weight || 0).toFixed(2)
      ]);
    });
    csvRows.push([]);

    // DigiGold Section
    csvRows.push(['--- DIGIGOLD SCHEMES REPORT ---']);
    csvRows.push(['Scheme / Acc No', 'Created Date', 'Customer Name', 'Scheme Name', 'Accumulated Gold (g)']);
    filteredDigiGold.forEach(sch => {
      csvRows.push([
        sch.accountNo || (sch.id ? `#${sch.id.slice(0, 6)}` : '—'),
        formatDate(sch.createdAt || sch.created_at || sch.startDate || sch.date),
        `"${sch.customerName || '—'}"`,
        `"${sch.schemeName || 'Monthly Gold Saver'}"`,
        parseFloat(sch.accumulatedGoldGrams || sch.total_gold_grams || 0).toFixed(3)
      ]);
    });
    csvRows.push([]);

    // Soldering Section
    csvRows.push(['--- SOLDERING & REPAIR REPORT ---']);
    csvRows.push(['Job ID', 'Date Received', 'Customer Name', 'Product / Job', 'Marking Charge', 'GST Amount', 'Total Charge']);
    filteredSolderingJobs.forEach(job => {
      const marking = parseFloat(job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? 0);
      const gst = parseFloat(job.gstAmount ?? job.gst_amount ?? (marking * 0.05) ?? 0);
      const total = parseFloat(job.totalAmount ?? job.total_amount ?? (marking + gst) ?? 0);
      csvRows.push([
        job.id ? `#${job.id.slice(0, 6)}` : '—',
        formatDate(job.createdAt || job.created_at || job.date),
        `"${job.customerName || job.customer_name || '—'}"`,
        `"${job.product || job.ornament || '—'}"`,
        `₹${marking.toFixed(2)}`,
        `₹${gst.toFixed(2)}`,
        `₹${total.toFixed(2)}`
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
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span>Comprehensive performance report for Invoices, Receipts, Orders, DigiGold, Stock & Repairs</span>
              <span style={{ background: 'rgba(251,191,36,0.1)', color: 'var(--gold-300)', padding: '2px 8px', borderRadius: 6, fontWeight: 700, border: '1px solid rgba(251,191,36,0.2)' }}>
                🗓️ Date: {formatDate(new Date())}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => setShowPdfPreviewModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              📄 Export to PDF (A4)
            </button>
            <button onClick={handleExportGSTReportExcel} className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, background: '#16a34a', borderColor: '#15803d', color: '#ffffff' }}>
              📊 Export to Excel (.xlsx)
            </button>
            <button onClick={handleExportCSV} className="btn-secondary" style={{ padding: '8px 14px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              📥 Export CSV
            </button>
            <button onClick={handlePrint} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
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
                ₹{summaryStats.totalSolderingRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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
              { id: 'gst_filing', label: `🏛️ GST Filing Report (${combinedGstLedger.length})` },
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
                          <td style={{ padding: '10px 10px', fontWeight: 700, color: 'var(--gold-200)' }}>{inv.invoiceNumber || inv.invoiceNo || (inv.id && masterInvoiceMap[inv.id]) || '—'}</td>
                          <td style={{ padding: '10px 10px', color: 'var(--text-muted)' }}>{formatDate(inv.createdAt || inv.created_at || inv.date)}</td>
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
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{inv.invoiceNumber || inv.invoiceNo || (inv.id && masterInvoiceMap[inv.id]) || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(inv.createdAt || inv.created_at || inv.date)}</td>
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
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(rec.createdAt || rec.created_at || rec.date)}</td>
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
                      <th style={{ padding: '10px' }}>Order No</th>
                      <th style={{ padding: '10px' }}>Order Date</th>
                      <th style={{ padding: '10px' }}>Customer</th>
                      <th style={{ padding: '10px' }}>Delivery Date</th>
                      <th style={{ padding: '10px' }}>Status</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Advance Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSalesOrders.map((so, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{so.orderNumber || so.orderNo || (so.id ? `#${so.id.slice(0, 6)}` : `ORD-${idx+1}`)}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(so.createdAt || so.created_at || so.orderDate || so.date)}</td>
                        <td style={{ padding: '10px', fontWeight: 600 }}>{so.customerName || '—'}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(so.deliveryDate)}</td>
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
                      <th style={{ padding: '10px' }}>Barcode / ID</th>
                      <th style={{ padding: '10px' }}>Entry Date</th>
                      <th style={{ padding: '10px' }}>Item Name</th>
                      <th style={{ padding: '10px' }}>Purity</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Gross Wt (g)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Net Wt (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStockItems.map((stk, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{stk.barcode || (stk.id ? `#${stk.id.slice(0, 6)}` : `STK-${idx+1}`)}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(stk.createdAt || stk.created_at || stk.entryDate || stk.date)}</td>
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
                      <th style={{ padding: '10px' }}>Scheme / Acc No</th>
                      <th style={{ padding: '10px' }}>Created Date</th>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Scheme</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Accumulated Gold (g)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDigiGold.map((sch, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{sch.accountNo || (sch.id ? `#${sch.id.slice(0, 6)}` : `SCH-${idx+1}`)}</td>
                        <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(sch.createdAt || sch.created_at || sch.startDate || sch.date)}</td>
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
                      <th style={{ padding: '10px' }}>Invoice No</th>
                      <th style={{ padding: '10px' }}>Date Received</th>
                      <th style={{ padding: '10px' }}>Customer</th>
                      <th style={{ padding: '10px' }}>Product / Job</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Marking Charge</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>GST (5%)</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Total Charge</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSolderingJobs.map((job, idx) => {
                      const marking = parseFloat(job.markingCharges ?? job.marking_charges ?? job.charge ?? job.amount ?? 0);
                      const gst = parseFloat(job.gstAmount ?? job.gst_amount ?? (marking * 0.05) ?? 0);
                      const total = parseFloat(job.totalAmount ?? job.total_amount ?? (marking + gst) ?? 0);
                      let invNo = job.invoiceNo || job.invoiceNumber || job.receiptNo;
                      if (!invNo || invNo.startsWith('#') || invNo.length > 20) {
                        invNo = (job.id && masterInvoiceMap[job.id]) || '—';
                      }
                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px', fontWeight: 700, color: 'var(--gold-200)' }}>{invNo}</td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{formatDate(job.createdAt || job.created_at || job.date)}</td>
                          <td style={{ padding: '10px', fontWeight: 600 }}>{job.customerName || job.customer_name || '—'}</td>
                          <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>{job.product || job.ornament || '—'}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>₹{marking.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', color: 'var(--text-muted)' }}>₹{gst.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#fb923c' }}>
                            ₹{total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: COMBINED GST FILING REPORT */}
          {activeTab === 'gst_filing' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* GST Filing Summary Header Card */}
              <div className="card" style={{ padding: 20, background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14, marginBottom: 18 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: 'var(--gold-300)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      🏛️ Combined GST Filing Report (Invoices & Soldering)
                    </h3>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Unified sequential tax invoice ledger ordered continuously by Invoice Number for GSTR-1 & GST returns
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <button onClick={() => setShowPdfPreviewModal(true)} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      📄 Export to PDF (A4)
                    </button>
                    <button onClick={handleExportGSTReportExcel} className="btn-primary" style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, background: '#16a34a', borderColor: '#15803d', color: '#ffffff' }}>
                      📊 Export to Excel (.xlsx)
                    </button>
                    <button onClick={handleExportGSTReportCSV} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                      📥 Export GSTR-1 CSV
                    </button>
                  </div>
                </div>

                {/* GST KPI Statistics Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--gold-300)', fontWeight: 700, textTransform: 'uppercase' }}>Tax Invoices Count</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-300)', marginTop: 4 }}>
                      {gstStats.count} Invoices
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}>
                    <div style={{ fontSize: 10, color: 'var(--gold-200)', fontWeight: 700, textTransform: 'uppercase' }}>Total Gross Weight</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold-200)', marginTop: 4 }}>
                      {gstStats.totalGrossWeight.toFixed(3)}g
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)' }}>
                    <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase' }}>Total Taxable Turnover</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
                      ₹{gstStats.totalTaxable.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)' }}>
                    <div style={{ fontSize: 10, color: '#c084fc', fontWeight: 700, textTransform: 'uppercase' }}>CGST Collected</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#c084fc', marginTop: 4 }}>
                      ₹{gstStats.totalCgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(236,72,153,0.08)', border: '1px solid rgba(236,72,153,0.2)' }}>
                    <div style={{ fontSize: 10, color: '#f472b6', fontWeight: 700, textTransform: 'uppercase' }}>SGST Collected</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f472b6', marginTop: 4 }}>
                      ₹{gstStats.totalSgst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ fontSize: 10, color: '#4ade80', fontWeight: 700, textTransform: 'uppercase' }}>Total GST Liability</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#4ade80', marginTop: 4 }}>
                      ₹{gstStats.totalGst.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sequential Invoice Table */}
              <div className="card" style={{ padding: 20 }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '10px' }}>Invoice No</th>
                        <th style={{ padding: '10px' }}>Date</th>
                        <th style={{ padding: '10px' }}>Document Type</th>
                        <th style={{ padding: '10px' }}>HSN/SAC</th>
                        <th style={{ padding: '10px' }}>Customer Name</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Gross Wt (g)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Taxable Value (₹)</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>GST Rate</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>CGST (₹)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>SGST (₹)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Total GST (₹)</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Invoice Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {combinedGstLedger.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '10px', fontWeight: 800, color: 'var(--gold-200)' }}>{item.invoiceNo}</td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{item.date}</td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              background: item.source === 'Invoice' ? 'rgba(56,189,248,0.1)' : 'rgba(251,146,60,0.1)',
                              color: item.source === 'Invoice' ? '#38bdf8' : '#fb923c',
                              border: `1px solid ${item.source === 'Invoice' ? 'rgba(56,189,248,0.2)' : 'rgba(251,146,60,0.2)'}`
                            }}>
                              {item.typeLabel}
                            </span>
                          </td>
                          <td style={{ padding: '10px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.hsnSac}</td>
                          <td style={{ padding: '10px', fontWeight: 600 }}>{item.customerName}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 600, color: 'var(--gold-200)' }}>
                            {item.grossWeight > 0 ? `${item.grossWeight.toFixed(3)}g` : '—'}
                          </td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>₹{item.taxableAmount.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'center', fontSize: 11, color: 'var(--text-muted)' }}>{item.gstRateLabel}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#f472b6' }}>₹{item.totalGstAmount.toFixed(2)}</td>
                          <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#4ade80' }}>₹{item.grandTotal.toFixed(2)}</td>
                        </tr>
                      ))}
                      {combinedGstLedger.length === 0 && (
                        <tr>
                          <td colSpan="12" style={{ padding: 30, textAlign: 'center', color: 'var(--text-muted)' }}>
                            No tax invoice records found in the selected date range.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {combinedGstLedger.length > 0 && (
                      <tfoot>
                        <tr style={{
                          borderTop: '2px solid var(--gold-300)',
                          background: 'rgba(251,191,36,0.06)',
                          fontWeight: 800,
                          fontSize: 12
                        }}>
                          <td colSpan="5" style={{ padding: '12px 10px', color: 'var(--gold-300)', textAlign: 'right' }}>
                            Grand Total ({gstStats.count} Invoices):
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: 'var(--gold-200)' }}>
                            {gstStats.totalGrossWeight.toFixed(3)}g
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#38bdf8' }}>
                            ₹{gstStats.totalTaxable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 10px' }}></td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#c084fc' }}>
                            ₹{gstStats.totalCgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#f472b6' }}>
                            ₹{gstStats.totalSgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#f472b6', fontSize: 13 }}>
                            ₹{gstStats.totalGst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: '#4ade80', fontSize: 13 }}>
                            ₹{gstStats.totalGrand.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── COMBINED GST A4 INVOICES PDF PREVIEW MODAL ──────────── */}
      {showPdfPreviewModal && (
        <div className="modal-overlay" style={{ zIndex: 11000 }}>
          <div className="modal-box" style={{ maxWidth: 920, padding: 0 }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div className="modal-title" style={{ fontSize: 15, fontWeight: 700, color: 'var(--gold-300)' }}>
                  📄 Combined GST Invoices A4 PDF Export Preview ({combinedGstLedger.length} Invoices)
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Ordered sequentially by Invoice Number • Includes Gold Retail &amp; Soldering Invoices
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => window.print()}
                  className="btn-primary"
                  style={{ padding: '7px 16px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPdfPreviewModal(false)}
                  className="btn-secondary"
                  style={{ padding: '7px 14px', fontSize: 12 }}
                >
                  Close
                </button>
              </div>
            </div>

            {/* Scrollable Preview Area */}
            <div style={{
              background: '#525659',
              padding: '24px 20px',
              maxHeight: '80vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 24
            }}>
              {combinedGstLedger.length === 0 ? (
                <div style={{ padding: 40, color: '#fff', textAlign: 'center' }}>
                  No tax invoices available to export in current filter range.
                </div>
              ) : (
                combinedGstLedger.map((item, index) => {
                  const rawInv = item.rawInvoice;
                  const rawJ = item.rawJob;
                  const itemsList = rawInv?.items && rawInv.items.length > 0 ? rawInv.items : [
                    { description: 'Gold Jewellery Ornament', hsnCode: '7113', netWeight: 0, wastagePct: 0, stoneWeight: 0, amount: item.taxableAmount }
                  ];

                  const totalNetWt = itemsList.reduce((s, i) => s + (Number(i.netWeight || i.net_weight) || 0), 0);
                  const totalStoneWt = itemsList.reduce((s, i) => s + (Number(i.stoneWeight || i.stone_weight) || 0), 0);
                  const totalGrossWt = itemsList.reduce((s, i) => s + Math.max(0, (Number(i.netWeight || i.net_weight) || 0) * (1 + (Number(i.wastagePct || i.wastage_pct) || 0) / 100) - (Number(i.stoneWeight || i.stone_weight) || 0)), 0);

                  const otherChg = Number(rawInv?.otherCharges) || 0;
                  const oldGoldAmt = Number(rawInv?.oldGoldAmount) || 0;
                  const finalPayable = Number(rawInv?.finalAmount || item.grandTotal);

                  return (
                    <div key={item.id || index} style={{
                      background: '#ffffff',
                      color: '#0f172a',
                      width: '100%',
                      maxWidth: '750px',
                      padding: '32px 36px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                      borderRadius: 4,
                      fontFamily: 'sans-serif',
                      fontSize: '12px',
                      lineHeight: '1.4'
                    }}>
                      {/* Header */}
                      <div style={{ textAlign: 'center', marginBottom: 18 }}>
                        <h2 style={{ margin: '0 0 4px 0', fontSize: 24, letterSpacing: 0.5, fontWeight: 800, color: '#0f172a' }}>M S GOLD SMITH</h2>
                        <p style={{ margin: '2px 0', fontSize: 12, color: '#334155' }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
                        <p style={{ margin: '2px 0', fontSize: 12, color: '#334155' }}>Srivilliputhur, Virudhunagar - 626 125.</p>
                        <p style={{ margin: '2px 0', fontSize: 12, color: '#334155' }}><strong>GSTIN:</strong> 33BDVPR1363J1Z2 | <strong>Mobile:</strong> 94431 12034</p>
                        <h3 style={{ margin: '12px 0 4px 0', fontSize: 15, textDecoration: 'underline', fontWeight: 700, color: '#0f172a' }}>TAX INVOICE</h3>
                        <span style={{ fontSize: 11, fontStyle: 'italic', color: '#64748b' }}>Original for Recipient</span>
                      </div>

                      {/* Consignee details */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #b45309', padding: 10, marginBottom: 18, fontSize: 12, background: '#fffdf5' }}>
                        <div>
                          <strong>Consignee Details:</strong>
                          <div style={{ marginTop: 4, fontWeight: 700, fontSize: 13 }}>{item.customerName}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div><strong>Invoice No:</strong> <span style={{ fontWeight: 700, color: '#b45309' }}>{item.invoiceNo}</span></div>
                          <div><strong>Date:</strong> {item.date}</div>
                          <div><strong>Document Type:</strong> {item.typeLabel}</div>
                        </div>
                      </div>

                      {item.source === 'Invoice' ? (
                        /* Retail Invoice Table */
                        <>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18, fontSize: 11, border: '1px solid #b45309' }}>
                            <thead>
                              <tr style={{ background: '#fef3c7', borderBottom: '1px solid #b45309' }}>
                                <th style={{ border: '1px solid #b45309', padding: 6, width: 30, textAlign: 'center' }}>S.N</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'left' }}>Description of Ornaments</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, width: 55, textAlign: 'center' }}>HSN</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Net Wt (g)</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 55 }}>Wastage %</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 60 }}>Stone Wt</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Gross Wt</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Rate/g</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Making (₹)</th>
                                <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 85 }}>Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {itemsList.map((it, idx2) => {
                                const nw = Number(it.netWeight || it.net_weight) || 0;
                                const wp = Number(it.wastagePct || it.wastage_pct) || 0;
                                const sw = Number(it.stoneWeight || it.stone_weight) || 0;
                                const gross = Math.max(0, nw * (1 + wp / 100) - sw);
                                const rate = Number(it.rate || it.ratePerGram || it.rate_per_gram) || 0;
                                const making = Number(it.makingCharges || it.making_charges) || 0;
                                const amt = Number(it.amount) || 0;

                                return (
                                  <tr key={idx2}>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'center' }}>{idx2 + 1}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, fontWeight: 600 }}>{it.description || 'Gold Ornament'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'center', fontFamily: 'monospace' }}>{it.hsnCode || it.hsn_code || item.hsnSac || '7113'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{nw ? nw.toFixed(3) + 'g' : '—'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{wp ? wp + '%' : '—'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{sw ? sw.toFixed(3) + 'g' : '—'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{gross ? gross.toFixed(3) + 'g' : '—'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{rate ? '₹' + rate.toLocaleString('en-IN') : '—'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{making ? '₹' + making.toLocaleString('en-IN') : '—'}</td>
                                    <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>₹{amt ? amt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : item.taxableAmount.toFixed(2)}</td>
                                  </tr>
                                );
                              })}
                              {otherChg > 0 && (
                                <tr>
                                  <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'center' }}>{itemsList.length + 1}</td>
                                  <td style={{ border: '1px solid #b45309', padding: 6 }} colSpan="8">Other Charges / Additions</td>
                                  <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>₹{otherChg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                </tr>
                              )}
                              <tr style={{ fontWeight: 'bold', background: '#fffdf5' }}>
                                <td colSpan="3" style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>Total Weight &amp; Subtotal:</td>
                                <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{totalNetWt ? totalNetWt.toFixed(3) + 'g' : '—'}</td>
                                <td style={{ border: '1px solid #b45309' }}></td>
                                <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{totalStoneWt ? totalStoneWt.toFixed(3) + 'g' : '—'}</td>
                                <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{totalGrossWt ? totalGrossWt.toFixed(3) + 'g' : '—'}</td>
                                <td colSpan="2" style={{ border: '1px solid #b45309' }}></td>
                                <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Tax breakdown & Words */}
                          <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 11 }}>
                            <div style={{ flex: 1, border: '1px solid #b45309', padding: 10, background: '#fffdf5' }}>
                              <strong>Amount Chargeable in Words:</strong>
                              <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 700 }}>{convertToWords(finalPayable)}</div>
                            </div>
                            <div style={{ width: 290 }}>
                              <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #b45309', fontSize: 11 }}>
                                <tbody>
                                  <tr>
                                    <td style={{ border: '1px solid #b45309', padding: 4 }}>Subtotal Taxable</td>
                                    <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ border: '1px solid #b45309', padding: 4 }}>CGST ({rawInv?.cgstRate || 1.5}%)</td>
                                    <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                                  </tr>
                                  <tr>
                                    <td style={{ border: '1px solid #b45309', padding: 4 }}>SGST ({rawInv?.sgstRate || 1.5}%)</td>
                                    <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                                  </tr>
                                  <tr style={{ fontWeight: 'bold', background: '#fef3c7' }}>
                                    <td style={{ border: '1px solid #b45309', padding: 4 }}>Grand Total</td>
                                    <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.grandTotal.toFixed(2)}</td>
                                  </tr>
                                  {oldGoldAmt > 0 && (
                                    <>
                                      <tr>
                                        <td style={{ border: '1px solid #b45309', padding: 4, color: '#c00' }}>Old Gold Exchange (Deduction)</td>
                                        <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right', color: '#c00' }}>
                                          - ₹{oldGoldAmt.toFixed(2)}
                                        </td>
                                      </tr>
                                      <tr style={{ fontWeight: 'bold', background: '#fef3c7', fontSize: 12 }}>
                                        <td style={{ border: '1px solid #b45309', padding: 4 }}>Final Payable Amount</td>
                                        <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>
                                          ₹{finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </td>
                                      </tr>
                                    </>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* Soldering Invoice Table */
                        <>
                          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18, fontSize: 12, border: '1px solid #b45309' }}>
                            <thead>
                              <tr style={{ background: '#fef3c7', borderBottom: '1px solid #b45309' }}>
                                <th style={{ border: '1px solid #b45309', padding: 8, width: 35, textAlign: 'center' }}>S.N</th>
                                <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'left' }}>Description of Work / Ornaments</th>
                                <th style={{ border: '1px solid #b45309', padding: 8, width: 80, textAlign: 'center' }}>HSN</th>
                                <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Marking Charge (₹)</th>
                                <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>CGST (2.5%)</th>
                                <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>SGST (2.5%)</th>
                                <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Total Amount (₹)</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center' }}>1</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, fontWeight: 600 }}>{rawJ?.product || rawJ?.ornament || 'Soldering & Engraving Work'}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center', fontFamily: 'monospace' }}>7113</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', fontWeight: 700 }}>₹{item.grandTotal.toFixed(2)}</td>
                              </tr>
                              <tr style={{ fontWeight: 'bold', background: '#fffdf5' }}>
                                <td colSpan="3" style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>Subtotal &amp; Taxes:</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                                <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', color: '#b45309', fontSize: 13 }}>₹{item.grandTotal.toFixed(2)}</td>
                              </tr>
                            </tbody>
                          </table>

                          {/* Words & Summary */}
                          <div style={{ display: 'flex', gap: 14, marginBottom: 20, fontSize: 12 }}>
                            <div style={{ flex: 1, border: '1px solid #b45309', padding: 10, background: '#fffdf5' }}>
                              <strong>Amount Chargeable in Words:</strong>
                              <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 700 }}>{convertToWords(item.grandTotal)}</div>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Declaration & Signature */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 11 }}>
                        <div style={{ width: '60%' }}>
                          <p style={{ margin: 0 }}><strong>Declaration:</strong></p>
                          <p style={{ margin: '4px 0 0 0', fontSize: 10, lineHeight: 1.4, color: '#475569' }}>
                            We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
                          </p>
                        </div>
                        <div style={{ textAlign: 'right', width: '35%' }}>
                          <p style={{ margin: 0 }}>For <strong>M S GOLD SMITH</strong></p>
                          <p style={{ marginTop: 40, borderTop: '1px solid #b45309', display: 'inline-block', width: 140, paddingTop: 4, fontWeight: 700 }}>Authorised Signatory</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── HIDDEN MULTI-INVOICE PRINT CONTAINER FOR window.print() PDF EXPORT ─ */}
      <div className="printable-gst-pdf-container">
        <style>{`
          @page {
            size: A4 portrait;
            margin: 0mm;
          }
          @media print {
            html, body {
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
              background: #ffffff !important;
            }
            body * {
              visibility: hidden !important;
            }
            .printable-gst-pdf-container, .printable-gst-pdf-container * {
              visibility: visible !important;
            }
            .printable-gst-pdf-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .a4-pdf-page {
              page-break-after: always !important;
              break-after: page !important;
              width: 210mm !important;
              max-width: 210mm !important;
              box-sizing: border-box !important;
              padding: 10mm 12mm !important;
              margin: 0 !important;
              background: #ffffff !important;
              color: #0f172a !important;
              overflow: hidden !important;
            }
          }
          @media screen {
            .printable-gst-pdf-container {
              display: none !important;
            }
          }
        `}</style>
        {combinedGstLedger.map((item, index) => {
          const rawInv = item.rawInvoice;
          const rawJ = item.rawJob;
          const itemsList = rawInv?.items && rawInv.items.length > 0 ? rawInv.items : [
            { description: 'Gold Jewellery Ornament', hsnCode: '7113', netWeight: 0, wastagePct: 0, stoneWeight: 0, amount: item.taxableAmount }
          ];

          const totalNetWt = itemsList.reduce((s, i) => s + (Number(i.netWeight || i.net_weight) || 0), 0);
          const totalStoneWt = itemsList.reduce((s, i) => s + (Number(i.stoneWeight || i.stone_weight) || 0), 0);
          const totalGrossWt = itemsList.reduce((s, i) => s + Math.max(0, (Number(i.netWeight || i.net_weight) || 0) * (1 + (Number(i.wastagePct || i.wastage_pct) || 0) / 100) - (Number(i.stoneWeight || i.stone_weight) || 0)), 0);

          const otherChg = Number(rawInv?.otherCharges) || 0;
          const oldGoldAmt = Number(rawInv?.oldGoldAmount) || 0;
          const finalPayable = Number(rawInv?.finalAmount || item.grandTotal);

          return (
            <div key={item.id || index} className="a4-pdf-page">
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <h2 style={{ margin: '0 0 4px 0', fontSize: 24, letterSpacing: 0.5, fontWeight: 800 }}>M S GOLD SMITH</h2>
                <p style={{ margin: '2px 0', fontSize: 12 }}>No.37C, Chettiyakudi South Street, Nadaga Salai,</p>
                <p style={{ margin: '2px 0', fontSize: 12 }}>Srivilliputhur, Virudhunagar - 626 125.</p>
                <p style={{ margin: '2px 0', fontSize: 12 }}><strong>GSTIN:</strong> 33BDVPR1363J1Z2 | <strong>Mobile:</strong> 94431 12034</p>
                <h3 style={{ margin: '12px 0 4px 0', fontSize: 15, textDecoration: 'underline', fontWeight: 700 }}>TAX INVOICE</h3>
                <span style={{ fontSize: 11, fontStyle: 'italic' }}>Original for Recipient</span>
              </div>

              {/* Consignee details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', border: '1px solid #b45309', padding: 10, marginBottom: 18, fontSize: 12 }}>
                <div>
                  <strong>Consignee Details:</strong>
                  <div style={{ marginTop: 4, fontWeight: 700, fontSize: 13 }}>{item.customerName}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div><strong>Invoice No:</strong> <span>{item.invoiceNo}</span></div>
                  <div><strong>Date:</strong> {item.date}</div>
                  <div><strong>Document Type:</strong> {item.typeLabel}</div>
                </div>
              </div>

              {item.source === 'Invoice' ? (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18, fontSize: 11, border: '1px solid #b45309' }}>
                    <thead>
                      <tr style={{ background: '#fef3c7', borderBottom: '1px solid #b45309' }}>
                        <th style={{ border: '1px solid #b45309', padding: 6, width: 30, textAlign: 'center' }}>S.N</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'left' }}>Description of Ornaments</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, width: 55, textAlign: 'center' }}>HSN</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Net Wt (g)</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 55 }}>Wastage %</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 60 }}>Stone Wt</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Gross Wt</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Rate/g</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 65 }}>Making (₹)</th>
                        <th style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right', width: 85 }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemsList.map((it, idx2) => {
                        const nw = Number(it.netWeight || it.net_weight) || 0;
                        const wp = Number(it.wastagePct || it.wastage_pct) || 0;
                        const sw = Number(it.stoneWeight || it.stone_weight) || 0;
                        const gross = Math.max(0, nw * (1 + wp / 100) - sw);
                        const rate = Number(it.rate || it.ratePerGram || it.rate_per_gram) || 0;
                        const making = Number(it.makingCharges || it.making_charges) || 0;
                        const amt = Number(it.amount) || 0;

                        return (
                          <tr key={idx2}>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'center' }}>{idx2 + 1}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, fontWeight: 600 }}>{it.description || 'Gold Ornament'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'center', fontFamily: 'monospace' }}>{it.hsnCode || it.hsn_code || item.hsnSac || '7113'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{nw ? nw.toFixed(3) + 'g' : '—'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{wp ? wp + '%' : '—'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{sw ? sw.toFixed(3) + 'g' : '—'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{gross ? gross.toFixed(3) + 'g' : '—'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{rate ? '₹' + rate.toLocaleString('en-IN') : '—'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{making ? '₹' + making.toLocaleString('en-IN') : '—'}</td>
                            <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>₹{amt ? amt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : item.taxableAmount.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                      {otherChg > 0 && (
                        <tr>
                          <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'center' }}>{itemsList.length + 1}</td>
                          <td style={{ border: '1px solid #b45309', padding: 6 }} colSpan="8">Other Charges / Additions</td>
                          <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>₹{otherChg.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        </tr>
                      )}
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>Total Weight &amp; Subtotal:</td>
                        <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{totalNetWt ? totalNetWt.toFixed(3) + 'g' : '—'}</td>
                        <td style={{ border: '1px solid #b45309' }}></td>
                        <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{totalStoneWt ? totalStoneWt.toFixed(3) + 'g' : '—'}</td>
                        <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>{totalGrossWt ? totalGrossWt.toFixed(3) + 'g' : '—'}</td>
                        <td colSpan="2" style={{ border: '1px solid #b45309' }}></td>
                        <td style={{ border: '1px solid #b45309', padding: 6, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', gap: 12, marginBottom: 20, fontSize: 11 }}>
                    <div style={{ flex: 1, border: '1px solid #b45309', padding: 10 }}>
                      <strong>Amount Chargeable in Words:</strong>
                      <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 700 }}>{convertToWords(finalPayable)}</div>
                    </div>
                    <div style={{ width: 290 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #b45309', fontSize: 11 }}>
                        <tbody>
                          <tr>
                            <td style={{ border: '1px solid #b45309', padding: 4 }}>Subtotal Taxable</td>
                            <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid #b45309', padding: 4 }}>CGST ({rawInv?.cgstRate || 1.5}%)</td>
                            <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                          </tr>
                          <tr>
                            <td style={{ border: '1px solid #b45309', padding: 4 }}>SGST ({rawInv?.sgstRate || 1.5}%)</td>
                            <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                          </tr>
                          <tr style={{ fontWeight: 'bold', background: '#fef3c7' }}>
                            <td style={{ border: '1px solid #b45309', padding: 4 }}>Grand Total</td>
                            <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>₹{item.grandTotal.toFixed(2)}</td>
                          </tr>
                          {oldGoldAmt > 0 && (
                            <>
                              <tr>
                                <td style={{ border: '1px solid #b45309', padding: 4, color: '#c00' }}>Old Gold Exchange (Deduction)</td>
                                <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right', color: '#c00' }}>
                                  - ₹{oldGoldAmt.toFixed(2)}
                                </td>
                              </tr>
                              <tr style={{ fontWeight: 'bold', background: '#fef3c7', fontSize: 12 }}>
                                <td style={{ border: '1px solid #b45309', padding: 4 }}>Final Payable Amount</td>
                                <td style={{ border: '1px solid #b45309', padding: 4, textAlign: 'right' }}>
                                  ₹{finalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 18, fontSize: 12, border: '1px solid #b45309' }}>
                    <thead>
                      <tr style={{ background: '#fef3c7', borderBottom: '1px solid #b45309' }}>
                        <th style={{ border: '1px solid #b45309', padding: 8, width: 35, textAlign: 'center' }}>S.N</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'left' }}>Description of Work / Ornaments</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, width: 80, textAlign: 'center' }}>HSN</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Marking Charge (₹)</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>CGST (2.5%)</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 90 }}>SGST (2.5%)</th>
                        <th style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', width: 110 }}>Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center' }}>1</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, fontWeight: 600 }}>{rawJ?.product || rawJ?.ornament || 'Soldering & Engraving Work'}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'center' }}>7113</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right', fontWeight: 700 }}>₹{item.grandTotal.toFixed(2)}</td>
                      </tr>
                      <tr style={{ fontWeight: 'bold' }}>
                        <td colSpan="3" style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>Subtotal &amp; Taxes:</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.taxableAmount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.cgstAmount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.sgstAmount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #b45309', padding: 8, textAlign: 'right' }}>₹{item.grandTotal.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ display: 'flex', gap: 14, marginBottom: 20, fontSize: 12 }}>
                    <div style={{ flex: 1, border: '1px solid #b45309', padding: 10 }}>
                      <strong>Amount Chargeable in Words:</strong>
                      <div style={{ marginTop: 6, fontStyle: 'italic', fontWeight: 700 }}>{convertToWords(item.grandTotal)}</div>
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 30, fontSize: 11 }}>
                <div style={{ width: '60%' }}>
                  <p style={{ margin: 0 }}><strong>Declaration:</strong></p>
                  <p style={{ margin: '4px 0 0 0', fontSize: 10, lineHeight: 1.4 }}>
                    We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
                  </p>
                </div>
                <div style={{ textAlign: 'right', width: '35%' }}>
                  <p style={{ margin: 0 }}>For <strong>M S GOLD SMITH</strong></p>
                  <p style={{ marginTop: 40, borderTop: '1px solid #b45309', display: 'inline-block', width: 140, paddingTop: 4, fontWeight: 700 }}>Authorised Signatory</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
