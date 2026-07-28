import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { silverStore } from '../../db/silverRetailStore';
import { Tag, Plus, Search, Trash2, Edit3, ArrowLeft, Barcode, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SilverStock() {
  const navigate = useNavigate();
  const [stock, setStock] = useState([]);
  const [rates, setRates] = useState(silverStore.getRates());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    tagNumber: '',
    category: 'Silver Payal',
    grossWeight: 100,
    stoneWeight: 0,
    purity: 92.5,
    wastagePercent: 3.5,
    makingChargePerGram: 18,
    flatMakingCharge: 0,
    counter: 'Counter 1 (Payal Section)'
  });

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = () => {
    setStock(silverStore.getStock());
    setRates(silverStore.getRates());
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      tagNumber: `SLV-${Math.floor(1000 + Math.random() * 9000)}`,
      category: 'Silver Payal',
      grossWeight: 120.00,
      stoneWeight: 0.00,
      purity: 92.5,
      wastagePercent: 3.5,
      makingChargePerGram: 18,
      flatMakingCharge: 0,
      counter: 'Counter 1 (Payal Section)'
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowAddModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const gWt = parseFloat(formData.grossWeight) || 0;
    const sWt = parseFloat(formData.stoneWeight) || 0;
    const nWt = Math.max(0, gWt - sWt);

    const payload = {
      ...formData,
      id: editingItem ? editingItem.id : undefined,
      netWeight: nWt,
      grossWeight: gWt,
      stoneWeight: sWt,
      purity: parseFloat(formData.purity) || 92.5,
      wastagePercent: parseFloat(formData.wastagePercent) || 0,
      makingChargePerGram: parseFloat(formData.makingChargePerGram) || 0
    };

    silverStore.saveStockItem(payload);
    loadStock();
    setShowAddModal(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to remove this stock tag?')) {
      silverStore.deleteStockItem(id);
      loadStock();
    }
  };

  const filteredStock = stock.filter(item => {
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.tagNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalGrams = filteredStock.reduce((acc, curr) => acc + (parseFloat(curr.grossWeight) || 0), 0);
  const totalNetGrams = filteredStock.reduce((acc, curr) => acc + (parseFloat(curr.netWeight) || 0), 0);

  return (
    <div style={{ padding: '24px 32px', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={() => navigate('/silver-retail-dashboard')}
            style={{ padding: 8, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', cursor: 'pointer', color: 'var(--text-primary)' }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: '#f8fafc' }}>
              Silver Inventory & Barcode Tag Management
            </h1>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              DK Nova Technologies — Counter-wise Silver Stock Vault
            </span>
          </div>
        </div>

        <button 
          onClick={handleOpenAdd}
          style={{
            padding: '10px 18px',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 4px 14px rgba(56, 189, 248, 0.3)'
          }}
        >
          <Plus size={16} /> Add Silver Stock Tag
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Total Stock Gross Wt</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#38bdf8', marginTop: 4 }}>
            {totalGrams.toFixed(2)} g
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{(totalGrams / 1000).toFixed(3)} Kg Vault Total</div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Net Silver Weight</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginTop: 4 }}>
            {totalNetGrams.toFixed(2)} g
          </div>
          <div style={{ fontSize: 11, color: '#818cf8', fontWeight: 600 }}>Excluding Stone Weights</div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Active Stock Tags</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#34d399', marginTop: 4 }}>
            {filteredStock.length} Items
          </div>
          <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>All Tagged & Barcoded</div>
        </div>

        <div className="card" style={{ padding: 18, borderRadius: 14 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Metal Value</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fbbf24', marginTop: 4 }}>
            ₹ {((totalNetGrams * rates.silver925)).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 11, color: '#fbbf24' }}>@ ₹ {rates.silver925}/g</div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="card" style={{ padding: 18, borderRadius: 16, marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          {['All', 'Silver Payal', 'Bichhiya & Rings', 'Utensils & Articles', 'Silver Coins & Bars', 'Silver Ornaments'].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: '1px solid',
                borderColor: categoryFilter === cat ? '#38bdf8' : 'var(--border-default)',
                background: categoryFilter === cat ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-subtle)',
                color: categoryFilter === cat ? '#38bdf8' : 'var(--text-primary)',
                fontSize: 12,
                fontWeight: categoryFilter === cat ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '6px 12px' }}>
          <Search size={16} color="#94a3b8" />
          <input 
            type="text" 
            placeholder="Search by Tag # or Title..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ border: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: 12, outline: 'none' }}
          />
        </div>
      </div>

      {/* Stock Table */}
      <div className="card" style={{ padding: 20, borderRadius: 18 }}>
        <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
          <thead>
            <tr>
              <th>Barcode Tag</th>
              <th>Ornament Description</th>
              <th>Category</th>
              <th>Counter Location</th>
              <th>Purity</th>
              <th>Gross Wt</th>
              <th>Net Wt</th>
              <th>Wastage %</th>
              <th>MC (₹/g)</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.map(item => (
              <tr key={item.id}>
                <td>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#38bdf8', fontWeight: 800 }}>
                    <Barcode size={16} /> {item.tagNumber}
                  </span>
                </td>
                <td style={{ fontWeight: 600 }}>{item.title}</td>
                <td><span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-default)' }}>{item.category}</span></td>
                <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>{item.counter}</td>
                <td style={{ fontWeight: 700, color: '#818cf8' }}>{item.purity}%</td>
                <td style={{ fontWeight: 700, color: '#f8fafc' }}>{item.grossWeight}g</td>
                <td style={{ fontWeight: 700, color: '#34d399' }}>{item.netWeight || item.grossWeight}g</td>
                <td>{item.wastagePercent}%</td>
                <td>₹ {item.makingChargePerGram}/g</td>
                <td>
                  <span style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 700,
                    background: item.status === 'In Stock' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: item.status === 'In Stock' ? '#34d399' : '#ef4444'
                  }}>
                    {item.status}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button onClick={() => handleOpenEdit(item)} style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', marginRight: 8 }}>
                    <Edit3 size={15} />
                  </button>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 580, padding: 28, borderRadius: 20, background: 'var(--bg-surface)' }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#f8fafc', marginBottom: 20 }}>
              {editingItem ? 'Edit Silver Stock Tag' : 'Create New Silver Stock Tag'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>ITEM TITLE / DESCRIPTION</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>BARCODE TAG #</label>
                <input 
                  type="text" 
                  required
                  value={formData.tagNumber}
                  onChange={(e) => setFormData({ ...formData, tagNumber: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: '#38bdf8', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>CATEGORY</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                >
                  <option value="Silver Payal">Silver Payal</option>
                  <option value="Bichhiya & Rings">Bichhiya & Rings</option>
                  <option value="Utensils & Articles">Utensils & Articles</option>
                  <option value="Silver Coins & Bars">Silver Coins & Bars</option>
                  <option value="Silver Ornaments">Silver Ornaments</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>GROSS WEIGHT (g)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.grossWeight}
                  onChange={(e) => setFormData({ ...formData, grossWeight: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: '#f8fafc', fontWeight: 700 }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>STONE WEIGHT (g)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.stoneWeight}
                  onChange={(e) => setFormData({ ...formData, stoneWeight: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>PURITY %</label>
                <select
                  value={formData.purity}
                  onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                >
                  <option value={99.9}>99.9% Fine Silver</option>
                  <option value={92.5}>92.5% Sterling Silver</option>
                  <option value={80.0}>80.0% Utility Silver</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>WASTAGE %</label>
                <input 
                  type="number" 
                  step="0.1"
                  value={formData.wastagePercent}
                  onChange={(e) => setFormData({ ...formData, wastagePercent: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>MAKING CHARGE (₹/g)</label>
                <input 
                  type="number" 
                  step="1"
                  value={formData.makingChargePerGram}
                  onChange={(e) => setFormData({ ...formData, makingChargePerGram: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>COUNTER LOCATION</label>
                <select
                  value={formData.counter}
                  onChange={(e) => setFormData({ ...formData, counter: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', marginTop: 4, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)' }}
                >
                  <option value="Counter 1 (Payal Section)">Counter 1 (Payal Section)</option>
                  <option value="Counter 2 (Pooja Section)">Counter 2 (Pooja Section)</option>
                  <option value="Counter 3 (Bullion Vault)">Counter 3 (Bullion Vault)</option>
                </select>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--border-default)', background: 'var(--bg-subtle)', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #38bdf8, #0284c7)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  Save Stock Tag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
