import { useState, useEffect } from 'react';
import { Calendar, X, Plus, Trash2 } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function SalesOrderPage() {
  const outletContext = useOutletContext();
  const isAdmin = true;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceGold, setAdvanceGold] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [status, setStatus] = useState('incomplete');
  const [products, setProducts] = useState([]);
  const [notes, setNotes] = useState('');
  const [metalRates, setMetalRates] = useState({ gold22: 0, gold24: 0, silver: 0 });
  const [submitting, setSubmitting] = useState(false);

  // New product
  const [newProductType, setNewProductType] = useState('Gold 24ct');
  const [newOrnament, setNewOrnament] = useState('Chain');
  const [newWeight, setNewWeight] = useState('');

  const productTypeOptions = ['Gold 24ct', 'Silver', 'Gold 916'];
  const ornamentOptions = ['Chain', 'Bangles', 'Ring', 'Necklace', 'Earrings', 'Bracelet', 'Anklet', 'Pendant'];

  useEffect(() => {
    loadOrders();
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      const res = await window.electronAPI?.getMetalRates();
      if (res?.success && res.metal_rates?.length > 0) {
        const r = res.metal_rates[0];
        setMetalRates({
          gold22: parseFloat(r.gold_rate) || 0,
          gold24: parseFloat(r.gold_24_rate) || 0,
          silver: parseFloat(r.silver_rate) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching metal rates:', error);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI?.getAllSalesOrders();
      if (response) setOrders(response);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = () => {
    setCustomerName(''); setAdvanceAmount(''); setAdvanceGold('');
    setDeliveryDate(''); setStatus('incomplete'); setProducts([]);
    setNotes('');
    setShowModal(true);
  };

  const addProductToOrder = () => {
    if (!newWeight) { alert('Please enter weight'); return; }
    setProducts(prev => [...prev, { type: newProductType, ornament: newOrnament, weight: parseFloat(newWeight) }]);
    setShowProductModal(false);
    setNewProductType('Gold 24ct'); setNewOrnament('Chain'); setNewWeight('');
  };

  const handleSubmitOrder = async () => {
    if (!customerName || products.length === 0 || !deliveryDate) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const orderData = {
        customerName, products,
        advanceAmount: parseFloat(advanceAmount) || 0,
        advanceGold: parseFloat(advanceGold) || 0,
        deliveryDate, status,
        notes: notes || null
      };
      const response = await window.electronAPI?.saveSalesOrder(orderData);
      if (response?.id) {
        await loadOrders();
        setShowModal(false);
      }
    } catch (error) {
      console.error('Error creating order:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (orderId, newStatus) => {
    try {
      const response = await window.electronAPI?.updateOrderStatus(orderId, newStatus);
      if (response) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      }
    } catch (error) { console.error(error); }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Delete this order?')) {
      try {
        await window.electronAPI?.deleteSalesOrder(orderId);
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } catch (error) { console.error(error); }
    }
  };

  const removeProduct = (idx) => setProducts(prev => prev.filter((_, i) => i !== idx));

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—';

  const filtered = orders.filter(o =>
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedCount = orders.filter(o => o.status === 'complete').length;
  const pendingCount = orders.filter(o => o.status !== 'complete').length;

  const getLiveRateForType = (type) => {
    if (type === 'Gold 916') return metalRates.gold22;
    if (type === 'Gold 24ct') return metalRates.gold24;
    if (type === 'Silver') return metalRates.silver;
    return 0;
  };

  const liveRate = getLiveRateForType(newProductType);
  const calculatedValue = liveRate * (parseFloat(newWeight) || 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Loading orders…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>Sales Orders</div>
          <div className="section-sub">Track & manage jewellery orders</div>
        </div>
        <button className="btn-primary" onClick={handleCreateOrder}>
          + Create Order
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <StatChip icon="📦" label="Total" value={orders.length} color="var(--text-secondary)" />
        <StatChip icon="✅" label="Completed" value={completedCount} color="#4ade80" />
        <StatChip icon="⏳" label="Pending" value={pendingCount} color="#fbbf24" />
      </div>

      {/* Search */}
      <div style={{ marginBottom: 14, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search by customer name…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Orders table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🛒</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No orders yet</div>
            <div className="empty-state-text">Create your first sales order to get started</div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Advance</th>
                <th>Delivery</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id}>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--gold-300)',
                      background: 'rgba(251,191,36,0.08)',
                      padding: '2px 8px', borderRadius: 4,
                    }}>#{order.id}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: `hsl(${(order.id * 53) % 360}, 55%, 30%)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 700, color: '#fff',
                      }}>{order.customerName?.[0]}</div>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{order.customerName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {order.products?.slice(0, 2).map((p, idx) => (
                        <span key={idx} className="product-chip">{p.ornament} {p.weight}g</span>
                      ))}
                      {order.products?.length > 2 && (
                        <span className="product-chip">+{order.products.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {order.advanceAmount > 0 && (
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#4ade80' }}>
                        ₹{order.advanceAmount.toLocaleString('en-IN')}
                      </div>
                    )}
                    {order.advanceGold > 0 && (
                      <div style={{ fontSize: 11, color: '#fbbf24' }}>{order.advanceGold}g gold</div>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(order.deliveryDate)}</span>
                  </td>
                  <td>
                    <select
                      value={order.status}
                      onChange={e => handleChangeStatus(order.id, e.target.value)}
                      className={`badge ${order.status === 'complete' ? 'badge-success' : 'badge-warning'}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '3px 8px', fontSize: 11, fontWeight: 700 }}
                    >
                      <option value="incomplete">● Pending</option>
                      <option value="complete">● Complete</option>
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        style={{
                          padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600,
                          background: 'rgba(251,191,36,0.08)', border: '1px solid var(--border-default)',
                          color: 'var(--gold-300)', cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onClick={() => setSelectedOrder(order)}
                      >View</button>
                      {isAdmin && (
                        <button className="btn-danger" onClick={() => handleDeleteOrder(order.id)}>
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── CREATE ORDER MODAL ─────────────────────────────── */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <div className="modal-title">✦ Create New Order</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Customer Name */}
              <div>
                <label className="form-label">Customer Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)}
                  className="form-input" placeholder="Enter customer name" />
              </div>

              {/* Products */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label className="form-label" style={{ margin: 0 }}>Products *</label>
                  <button type="button" className="btn-primary"
                    style={{ padding: '5px 14px', fontSize: 12 }}
                    onClick={() => setShowProductModal(true)}>
                    <Plus size={12} /> Add Item
                  </button>
                </div>
                {products.length === 0 ? (
                  <div style={{
                    border: '1px dashed var(--border-default)', borderRadius: 8,
                    padding: '18px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13,
                  }}>No items yet — click "Add Item" above</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {products.map((p, idx) => {
                      const itemRate = getLiveRateForType(p.type);
                      const itemVal = itemRate * p.weight;
                      return (
                        <div key={idx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px',
                          border: '1px solid var(--border-subtle)',
                        }}>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span className="product-chip">{p.type}</span>
                            <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{p.ornament} — {p.weight}g</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {itemVal > 0 && (
                              <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 13 }}>
                                ₹{Math.round(itemVal).toLocaleString('en-IN')}
                              </span>
                            )}
                            <button onClick={() => removeProduct(idx)}
                              style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Advance & Delivery */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Advance Amount (₹)</label>
                  <input type="number" value={advanceAmount} onChange={e => setAdvanceAmount(e.target.value)}
                    className="form-input" placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Advance Gold (g)</label>
                  <input type="number" step="0.1" value={advanceGold} onChange={e => setAdvanceGold(e.target.value)}
                    className="form-input" placeholder="0.0" />
                </div>
              </div>

              {/* Gold/Metal Balance Calculations */}
              {products.length > 0 && (() => {
                const grouped = products.reduce((acc, p) => {
                  if (!acc[p.type]) {
                    acc[p.type] = { type: p.type, weight: 0 };
                  }
                  acc[p.type].weight += p.weight;
                  return acc;
                }, {});
                const groupedList = Object.values(grouped);
                const typesList = Object.keys(grouped);
                const goldType = typesList.find(t => t.toLowerCase().includes('gold')) || typesList[0];

                return (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ⚖️ Gold & Metal Balance Summary
                    </div>
                    {groupedList.map((item, idx) => {
                      const type = item.type;
                      const totalWeight = item.weight;
                      const liveRate = getLiveRateForType(type);
                      const convertedAdvance = liveRate > 0 ? (parseFloat(advanceAmount) || 0) / liveRate : 0;
                      const appliedAdvanceGold = (type === goldType) ? (parseFloat(advanceGold) || 0) : 0;
                      const totalAdvanceWeight = convertedAdvance + appliedAdvanceGold;
                      const balanceWeight = totalWeight - totalAdvanceWeight;

                      return (
                        <div key={type} style={{
                          borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
                          paddingTop: idx > 0 ? 10 : 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            <span>{type} Total</span>
                            <span>{totalWeight.toFixed(3)}g</span>
                          </div>
                          {(parseFloat(advanceAmount) > 0 && liveRate > 0) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                              <span>Advance ₹{parseFloat(advanceAmount).toLocaleString('en-IN')} converted ({liveRate.toLocaleString('en-IN')}/g):</span>
                              <span>{convertedAdvance.toFixed(3)}g</span>
                            </div>
                          )}
                          {appliedAdvanceGold > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                              <span>Advance Metal Weight:</span>
                              <span>{appliedAdvanceGold.toFixed(3)}g</span>
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            fontWeight: 700,
                            color: balanceWeight > 0 ? 'var(--text-gold)' : '#4ade80',
                            borderTop: '1px dashed var(--border-subtle)',
                            paddingTop: 4,
                            marginTop: 2
                          }}>
                            <span>Balance Weight to collect:</span>
                            <span>{balanceWeight.toFixed(3)}g</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="form-label">Delivery Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)}
                      className="form-input" style={{ paddingLeft: 34 }} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)} className="form-select">
                    <option value="incomplete">Pending</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes / Custom Instructions</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="form-input"
                  placeholder="Enter any design instructions, metal purity details, or delivery remarks..."
                  rows="3"
                  style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button type="button" className="btn-primary" onClick={handleSubmitOrder} disabled={submitting}>
                {submitting ? '…Saving' : '✓ Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ADD PRODUCT MODAL ─────────────────────────────── */}
      {showProductModal && (
        <div className="modal-overlay" style={{ zIndex: 60 }}>
          <div className="modal-box" style={{ maxWidth: 380 }}>
            <div className="modal-header">
              <div className="modal-title">Add Product Item</div>
              <button className="modal-close" onClick={() => setShowProductModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="form-label">Metal Type</label>
                <select value={newProductType} onChange={e => setNewProductType(e.target.value)} className="form-select">
                  {productTypeOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Ornament</label>
                <select value={newOrnament} onChange={e => setNewOrnament(e.target.value)} className="form-select">
                  {ornamentOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Weight (grams) *</label>
                <input type="number" step="0.1" value={newWeight} onChange={e => setNewWeight(e.target.value)}
                  className="form-input" placeholder="e.g. 12.5" />
              </div>

              {liveRate > 0 && (
                <div style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 10,
                  padding: 12,
                  marginTop: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                    <span>Live Rate ({newProductType}):</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{liveRate.toLocaleString('en-IN')}/g</span>
                  </div>
                  {calculatedValue > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderTop: '1px solid var(--border-subtle)', paddingTop: 6, marginTop: 4 }}>
                      <span style={{ fontWeight: 600 }}>Est. Metal Value:</span>
                      <span style={{ fontWeight: 800, color: '#4ade80' }}>₹{Math.round(calculatedValue).toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowProductModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={addProductToOrder}>Add to Order</button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAILS MODAL ───────────────────────────── */}
      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <div className="modal-title">Order #{selectedOrder.id}</div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <DetailField label="Customer" value={selectedOrder.customerName} />
                <DetailField label="Status" value={
                  <span className={`badge ${selectedOrder.status === 'complete' ? 'badge-success' : 'badge-warning'}`}>
                    {selectedOrder.status === 'complete' ? '✅ Complete' : '⏳ Pending'}
                  </span>
                } />
                <DetailField label="Advance Amount" value={`₹${selectedOrder.advanceAmount?.toLocaleString('en-IN')}`} />
                <DetailField label="Advance Gold" value={`${selectedOrder.advanceGold || 0}g`} />
                <DetailField label="Delivery Date" value={formatDate(selectedOrder.deliveryDate)} />
                <DetailField label="Created At" value={formatDate(selectedOrder.createdAt)} />
              </div>

              <div style={{ marginBottom: 4 }}>
                <label className="form-label">Products</label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {selectedOrder.products?.map((p, idx) => {
                  const itemRate = getLiveRateForType(p.type);
                  const itemVal = itemRate * p.weight;
                  return (
                    <div key={idx} style={{
                      background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{p.type} — {p.ornament}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Weight: {p.weight}g</div>
                      </div>
                      {itemVal > 0 && (
                        <span style={{ fontWeight: 700, color: '#4ade80', fontSize: 13 }}>
                          ₹{Math.round(itemVal).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Gold/Metal Balance Calculations */}
              {(selectedOrder.products || []).length > 0 && (() => {
                const grouped = selectedOrder.products.reduce((acc, p) => {
                  if (!acc[p.type]) {
                    acc[p.type] = { type: p.type, weight: 0 };
                  }
                  acc[p.type].weight += p.weight;
                  return acc;
                }, {});
                const groupedList = Object.values(grouped);
                const typesList = Object.keys(grouped);
                const goldType = typesList.find(t => t.toLowerCase().includes('gold')) || typesList[0];

                return (
                  <div style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 10,
                    padding: '12px 14px',
                    marginTop: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      ⚖️ Gold & Metal Balance Summary
                    </div>
                    {groupedList.map((item, idx) => {
                      const type = item.type;
                      const totalWeight = item.weight;
                      const liveRate = getLiveRateForType(type);
                      const convertedAdvance = liveRate > 0 ? (selectedOrder.advanceAmount || 0) / liveRate : 0;
                      const appliedAdvanceGold = (type === goldType) ? (selectedOrder.advanceGold || 0) : 0;
                      const totalAdvanceWeight = convertedAdvance + appliedAdvanceGold;
                      const balanceWeight = totalWeight - totalAdvanceWeight;

                      return (
                        <div key={type} style={{
                          borderTop: idx > 0 ? '1px solid var(--border-subtle)' : 'none',
                          paddingTop: idx > 0 ? 10 : 0,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                            <span>{type} Total</span>
                            <span>{totalWeight.toFixed(3)}g</span>
                          </div>
                          {(selectedOrder.advanceAmount > 0 && liveRate > 0) && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                              <span>Advance ₹{selectedOrder.advanceAmount.toLocaleString('en-IN')} converted ({liveRate.toLocaleString('en-IN')}/g):</span>
                              <span>{convertedAdvance.toFixed(3)}g</span>
                            </div>
                          )}
                          {appliedAdvanceGold > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)' }}>
                              <span>Advance Metal Weight:</span>
                              <span>{appliedAdvanceGold.toFixed(3)}g</span>
                            </div>
                          )}
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: 13,
                            fontWeight: 700,
                            color: balanceWeight > 0 ? 'var(--text-gold)' : '#4ade80',
                            borderTop: '1px dashed var(--border-subtle)',
                            paddingTop: 4,
                            marginTop: 2
                          }}>
                            <span>Balance Weight to collect:</span>
                            <span>{balanceWeight.toFixed(3)}g</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {selectedOrder.notes && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Notes</div>
                  <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 14px',
                    border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-primary)',
                    whiteSpace: 'pre-wrap', lineHeight: 1.4
                  }}>
                    {selectedOrder.notes}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatChip({ icon, label, value, color }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 10, padding: '10px 16px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      <span>{icon}</span>
      <div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 16, fontWeight: 800, color }}>{value}</div>
      </div>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
    </div>
  );
}