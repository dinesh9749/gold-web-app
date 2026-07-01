import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';

const CustomerViewPage = () => {
  const outletContext = useOutletContext();
  const isAdmin = true;
  const [showModal, setShowModal] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    title: 'Mr', name: '', surname: '', mobile: '',
    city: '', address1: '', address2: '', address3: '', state: ''
  });

  const [cities, setCities] = useState(['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad']);
  const [states, setStates] = useState(['Tamil Nadu', 'Maharashtra', 'Delhi', 'Karnataka', 'Telangana']);
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [showCityInput, setShowCityInput] = useState(false);
  const [showStateInput, setShowStateInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadCustomers(); }, []);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await window.electronAPI?.getAllCustomers();
      if (response) setCustomers(response);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => setFormData({
    title: 'Mr', name: '', surname: '', mobile: '',
    city: '', address1: '', address2: '', address3: '', state: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!formData.name || !formData.surname || !formData.mobile || !formData.city || !formData.state || !formData.address1) {
      alert('Please fill all required fields');
      return;
    }
    try {
      setSubmitting(true);
      const response = await window.electronAPI?.saveCustomer(formData);
      if (response?.id) {
        await loadCustomers();
        resetForm();
        setShowModal(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (window.confirm('Delete this customer?')) {
      try {
        await window.electronAPI?.deleteCustomer(id);
        setCustomers(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  const addCity = () => {
    if (newCity.trim()) {
      setCities(prev => [...prev, newCity.trim()]);
      setFormData(prev => ({ ...prev, city: newCity.trim() }));
      setNewCity(''); setShowCityInput(false);
    }
  };

  const addState = () => {
    if (newState.trim()) {
      setStates(prev => [...prev, newState.trim()]);
      setFormData(prev => ({ ...prev, state: newState.trim() }));
      setNewState(''); setShowStateInput(false);
    }
  };

  const filtered = customers.filter(c => {
    const q = searchTerm.toLowerCase();
    return `${c.name} ${c.surname} ${c.mobile} ${c.city}`.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
        <div className="spinner" />
        <span style={{ color: 'var(--text-muted)' }}>Loading customers…</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="section-header" style={{ marginBottom: 20 }}>
        <div>
          <div className="section-title" style={{ fontSize: 18 }}>
            Customer Directory
            <span style={{
              marginLeft: 10, fontSize: 12, fontWeight: 600,
              background: 'rgba(251,191,36,0.1)', border: '1px solid var(--border-default)',
              borderRadius: 20, padding: '3px 12px', color: 'var(--gold-300)',
            }}>{customers.length} total</span>
          </div>
          <div className="section-sub">Manage all registered customers</div>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          + New Customer
        </button>
      </div>

      {/* Search bar */}
      <div style={{ marginBottom: 16, position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--text-muted)' }}>🔍</span>
        <input
          type="text"
          className="form-input"
          style={{ paddingLeft: 36 }}
          placeholder="Search by name, mobile, or city…"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👤</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>
              {searchTerm ? 'No results found' : 'No customers yet'}
            </div>
            <div className="empty-state-text">
              {searchTerm ? 'Try a different search term' : 'Create your first customer to get started'}
            </div>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Mobile</th>
                <th>City</th>
                <th>State</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>#{c.id}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: `hsl(${(c.id * 47) % 360}, 60%, 30%)`,
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>
                        {c.name?.[0]}{c.surname?.[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13 }}>
                          {c.title} {c.name} {c.surname}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.address1}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{c.mobile}</span>
                  </td>
                  <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.city}</span></td>
                  <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{c.state}</span></td>
                  <td>
                    {isAdmin && (
                      <button className="btn-danger" onClick={() => handleDeleteCustomer(c.id)}>
                        🗑 Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div className="modal-title">✦ New Customer</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="form-label">Title</label>
                    <select name="title" value={formData.title} onChange={handleChange} className="form-select">
                      <option value="Mr">Mr</option>
                      <option value="Ms">Ms</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Dr">Dr</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">First Name *</label>
                    <input type="text" name="name" value={formData.name} onChange={handleChange}
                      className="form-input" placeholder="First name" />
                  </div>
                </div>

                <ModalField label="Last Name *" name="surname" value={formData.surname} onChange={handleChange} placeholder="Last name" />
                <ModalField label="Mobile Number *" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="10-digit mobile" />

                <div style={{ marginBottom: 14 }}>
                  <label className="form-label">City *</label>
                  {showCityInput ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={newCity} onChange={e => setNewCity(e.target.value)}
                        className="form-input" placeholder="New city name" style={{ flex: 1 }} />
                      <button type="button" className="btn-primary" onClick={addCity}>Add</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select name="city" value={formData.city} onChange={handleChange} className="form-select" style={{ flex: 1 }}>
                        <option value="">Select City</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="button" className="btn-secondary" onClick={() => setShowCityInput(true)}>+ New</button>
                    </div>
                  )}
                </div>

                <ModalField label="Address Line 1 *" name="address1" value={formData.address1} onChange={handleChange} placeholder="Street address" />
                <ModalField label="Address Line 2" name="address2" value={formData.address2} onChange={handleChange} placeholder="Apartment, suite, etc." />
                <ModalField label="Address Line 3" name="address3" value={formData.address3} onChange={handleChange} placeholder="Additional info" />

                <div style={{ marginBottom: 0 }}>
                  <label className="form-label">State *</label>
                  {showStateInput ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="text" value={newState} onChange={e => setNewState(e.target.value)}
                        className="form-input" placeholder="New state name" style={{ flex: 1 }} />
                      <button type="button" className="btn-primary" onClick={addState}>Add</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select name="state" value={formData.state} onChange={handleChange} className="form-select" style={{ flex: 1 }}>
                        <option value="">Select State</option>
                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <button type="button" className="btn-secondary" onClick={() => setShowStateInput(true)}>+ New</button>
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ padding: '20px 0 0', border: 'none' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={submitting}>
                    {submitting ? '…Saving' : '✓ Create Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function ModalField({ label, name, value, onChange, placeholder }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="form-label">{label}</label>
      <input type="text" name={name} value={value} onChange={onChange}
        className="form-input" placeholder={placeholder} />
    </div>
  );
}

export default CustomerViewPage;