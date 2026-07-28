import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { silverStore } from '../../db/silverRetailStore';
import { ShoppingBag, Tag, RefreshCw, BarChart3, TrendingUp, Layers, ArrowUpRight, Award, Clock } from 'lucide-react';

export default function SilverRetailDashboard() {
  const navigate = useNavigate();
  const [rates, setRates] = useState(silverStore.getRates());
  const [stock, setStock] = useState(silverStore.getStock());
  const [invoices, setInvoices] = useState(silverStore.getInvoices());

  useEffect(() => {
    setRates(silverStore.getRates());
    setStock(silverStore.getStock());
    setInvoices(silverStore.getInvoices());
  }, []);

  // Compute live stats
  const totalStockItems = stock.filter(s => s.status === 'In Stock');
  const totalStockGrams = totalStockItems.reduce((acc, curr) => acc + (parseFloat(curr.grossWeight) || 0), 0);
  const sterlingStockGrams = totalStockItems.filter(s => s.purity === 92.5).reduce((acc, curr) => acc + (parseFloat(curr.grossWeight) || 0), 0);

  const todayInvoices = invoices.filter(inv => inv.invoiceDate === new Date().toISOString().split('T')[0]);
  const todaySalesVal = todayInvoices.reduce((acc, curr) => acc + (parseFloat(curr.netPayable) || 0), 0);
  const todaySalesGrams = todayInvoices.reduce((acc, curr) => {
    const itemGrams = (curr.items || []).reduce((iAcc, item) => iAcc + (parseFloat(item.grossWeight) || 0), 0);
    return acc + itemGrams;
  }, 0);

  const silverCategories = [
    { title: 'Silver Payal (Anklets)', categoryKey: 'Silver Payal', icon: '🦶', color: '#38bdf8' },
    { title: 'Bichhiya & Toe Rings', categoryKey: 'Bichhiya & Rings', icon: '💍', color: '#818cf8' },
    { title: 'Utensils & Pooja Articles', categoryKey: 'Utensils & Articles', icon: '🍽️', color: '#34d399' },
    { title: 'Silver Coins & Bars (999 Fine)', categoryKey: 'Silver Coins & Bars', icon: '🪙', color: '#fbbf24' },
    { title: 'Silver Ornaments & Chains', categoryKey: 'Silver Ornaments', icon: '✨', color: '#f472b6' },
  ];

  return (
    <div style={{ padding: '24px 32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      {/* Header Banner - DK Nova Technologies */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        borderRadius: 20,
        padding: '28px 32px',
        marginBottom: 28,
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 20
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>🥈</span>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                DK Nova Technologies — Silver Retail ERP
              </h1>
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                Enterprise Silver Jewellery Billing, Inventory & Exchange Platform
              </span>
            </div>
          </div>
        </div>

        {/* Live Silver Rates Box */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(10px)',
          borderRadius: 16,
          padding: '16px 22px',
          display: 'flex',
          gap: 24,
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Board Rate (22ct)
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
              ₹ {rates.boardRate || rates.silver999 || 250} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>/ g</span>
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: 20 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              RTGS Pure / Kacha
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#818cf8', marginTop: 2 }}>
              ₹ {rates.rtgsPureRate || 250} / ₹ {rates.rtgsKachaRate || 245}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: 20 }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Cash Pure / Kacha
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginTop: 2 }}>
              ₹ {rates.cashPureRate || 245} / ₹ {rates.cashKachaRate || 250}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Average Rate
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
              ₹ {rates.averageRate || 245}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.12)', paddingLeft: 20 }}>
            <button
              onClick={() => navigate('/silver-retail/rateinput')}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #38bdf8, #2563eb)',
                color: '#ffffff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span>✏️</span> Set Rates
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 28 }}>
        <div className="card" style={{ padding: 22, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Today's Retail Sales</div>
            <TrendingUp size={18} color="#38bdf8" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8', margin: '10px 0 4px 0' }}>
            ₹ {todaySalesVal.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>
            {todaySalesGrams.toFixed(2)} g Sold Today ({todayInvoices.length} Bills)
          </div>
        </div>

        <div className="card" style={{ padding: 22, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Silver Stock</div>
            <Layers size={18} color="#f8fafc" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#f8fafc', margin: '10px 0 4px 0' }}>
            {(totalStockGrams / 1000).toFixed(3)} Kg
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {totalStockItems.length} Tagged Items Active
          </div>
        </div>

        <div className="card" style={{ padding: 22, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>92.5% Sterling Silver</div>
            <Award size={18} color="#818cf8" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#818cf8', margin: '10px 0 4px 0' }}>
            {(sterlingStockGrams / 1000).toFixed(3)} Kg
          </div>
          <div style={{ fontSize: 12, color: '#818cf8', fontWeight: 600 }}>
            Hallmarked Sterling Stock
          </div>
        </div>

        <div className="card" style={{ padding: 22, borderRadius: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Total Valuation</div>
            <BarChart3 size={18} color="#fbbf24" />
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#fbbf24', margin: '10px 0 4px 0' }}>
            ₹ {((totalStockGrams * rates.silver925)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>
            Based on 925 Sterling Rate
          </div>
        </div>
      </div>

      {/* Main Grid: Stock Categories & Quick Action Hub */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Left Column: Inventory Category Breakdown */}
        <div className="card" style={{ padding: 24, borderRadius: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              Silver Inventory Categories & Stock Weight
            </h3>
            <button 
              onClick={() => navigate('/silver-retail/stock')}
              style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Manage Stock Tags <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {silverCategories.map((cat, idx) => {
              const catItems = totalStockItems.filter(s => s.category === cat.categoryKey);
              const catGrams = catItems.reduce((acc, curr) => acc + (parseFloat(curr.grossWeight) || 0), 0);
              return (
                <div key={idx} style={{
                  padding: '14px 18px',
                  borderRadius: 14,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `${cat.color}15`,
                      border: `1px solid ${cat.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22
                    }}>
                      {cat.icon}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{cat.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                        {catItems.length} Tagged Items in Stock
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 15, color: '#f8fafc' }}>
                      {catGrams.toFixed(2)} g
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Est: ₹ {((catGrams * rates.silver925)).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Quick Action Navigation */}
        <div className="card" style={{ padding: 24, borderRadius: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
            Silver Retail Quick Action Hub
          </h3>

          <button 
            onClick={() => navigate('/silver-retail/invoice')}
            style={{
              padding: '14px 18px',
              fontSize: 13,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
            }}
          >
            <ShoppingBag size={18} /> New Silver POS Retail Invoice
          </button>

          <button 
            onClick={() => navigate('/silver-retail/stock')}
            style={{
              padding: '14px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 12,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            <Tag size={18} color="#818cf8" /> Add / Manage Silver Stock Tags
          </button>

          <button 
            onClick={() => navigate('/silver-retail/customer-ledger')}
            style={{
              padding: '14px 18px',
              fontSize: 13,
              fontWeight: 600,
              borderRadius: 12,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10
            }}
          >
            <RefreshCw size={18} color="#fbbf24" /> Customer Fine Metal Ledgers
          </button>

          <div style={{
            marginTop: 'auto',
            padding: 16,
            borderRadius: 14,
            background: 'rgba(56, 189, 248, 0.06)',
            border: '1px dashed rgba(56, 189, 248, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8' }}>💡 DK Nova Technologies Notice</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, lineHeight: '1.4' }}>
              Standard GST on Silver Jewellery is 3% (1.5% CGST + 1.5% SGST). Purity calculation defaults to Fine Silver 999.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Silver Retail Invoices Table */}
      <div className="card" style={{ padding: 24, borderRadius: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
            Recent Silver Retail Sales Bills
          </h3>
          <button 
            onClick={() => navigate('/silver-retail/invoice')}
            style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
          >
            + Create Invoice
          </button>
        </div>

        <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th>Invoice No</th>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Items Bought</th>
              <th>Old Silver Credit</th>
              <th>Total Net Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((tx, i) => (
              <tr key={i}>
                <td><code style={{ color: '#38bdf8', fontWeight: 700 }}>{tx.invoiceNo || tx.id}</code></td>
                <td style={{ fontWeight: 600 }}>{tx.customerName}</td>
                <td style={{ color: 'var(--text-muted)' }}>{tx.customerMobile || '-'}</td>
                <td>{tx.items?.map(it => it.title).join(', ') || 'Silver Items'}</td>
                <td style={{ color: '#fbbf24', fontWeight: 600 }}>
                  {tx.exchangeCredit > 0 ? `₹ ${tx.exchangeCredit}` : '-'}
                </td>
                <td style={{ fontWeight: 700, color: '#34d399' }}>₹ {tx.netPayable?.toLocaleString('en-IN')}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tx.invoiceDate}</td>
                <td>
                  <span style={{
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: 700,
                    background: 'rgba(52, 211, 153, 0.15)',
                    color: '#34d399',
                    border: '1px solid rgba(52, 211, 153, 0.3)'
                  }}>
                    {tx.status || 'Paid'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
