import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';

const todayStr = () => new Date().toISOString().split('T')[0];
const fmtDate = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const emptyForm = () => ({
    name: '', role: '', mobile: '', joinDate: todayStr(),
    monthlySalary: '', otRate: '', shiftStart: '09:00', shiftEnd: '18:00',
});

export default function EmployeeSetup() {
    const outletContext = useOutletContext();
    const isAdmin = true;
    const [employees, setEmployees] = useState([]);
    const [roles, setRoles] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm());
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Role management
    const [showRoleMgr, setShowRoleMgr] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [addingRole, setAddingRole] = useState(false);

    // Edit shift inline
    const [editShift, setEditShift] = useState(null); // { empId, shiftStart, shiftEnd }

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadAll = useCallback(async () => {
        try {
            const [emps, rls] = await Promise.all([
                window.electronAPI?.getAllEmployees() || [],
                window.electronAPI?.getAllRoles() || [],
            ]);
            setEmployees(emps);
            setRoles(rls);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadAll(); }, [loadAll]);

    const openAdd = () => {
        setEditingId(null);
        setForm(emptyForm());
        setShowForm(true);
    };

    const openEdit = (emp) => {
        setEditingId(emp.id);
        setForm({
            name: emp.name, role: emp.role, mobile: emp.mobile,
            joinDate: emp.joinDate, monthlySalary: emp.monthlySalary,
            otRate: emp.otRate, shiftStart: emp.shiftStart, shiftEnd: emp.shiftEnd,
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.role || !form.mobile || !form.joinDate) return;
        setSaving(true);
        try {
            const data = { ...form, monthlySalary: parseFloat(form.monthlySalary) || 0, otRate: parseFloat(form.otRate) || 0 };
            if (editingId) {
                await window.electronAPI?.updateEmployee(editingId, data);
                showToast('Employee updated successfully');
            } else {
                await window.electronAPI?.saveEmployee(data);
                showToast('Employee added successfully');
            }
            await loadAll();
            setShowForm(false);
            setEditingId(null);
        } catch (e) { console.error(e); showToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const deleteEmployee = async (id, name) => {
        if (!window.confirm(`Delete ${name}? All attendance records will be removed.`)) return;
        try {
            await window.electronAPI?.deleteEmployee(id);
            await loadAll();
            showToast('Employee removed');
        } catch (e) { console.error(e); }
    };

    const addRole = async () => {
        if (!newRoleName.trim()) return;
        setAddingRole(true);
        try {
            await window.electronAPI?.addRole(newRoleName.trim());
            setNewRoleName('');
            await loadAll();
        } catch (e) { console.error(e); }
        finally { setAddingRole(false); }
    };

    const deleteRole = async (roleId, roleName) => {
        if (!window.confirm(`Remove role "${roleName}"?`)) return;
        try {
            await window.electronAPI?.deleteRole(roleId);
            await loadAll();
        } catch (e) { console.error(e); }
    };

    // Inline shift time save
    const saveShift = async () => {
        if (!editShift) return;
        const emp = employees.find(e => e.id === editShift.empId);
        if (!emp) return;
        try {
            await window.electronAPI?.updateEmployee(editShift.empId, {
                ...emp, shiftStart: editShift.shiftStart, shiftEnd: editShift.shiftEnd,
            });
            await loadAll();
            setEditShift(null);
            showToast('Shift time updated');
        } catch (e) { console.error(e); }
    };

    return (
        <div>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', top: 20, right: 20, zIndex: 9999,
                    padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                    background: toast.type === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)',
                    border: `1px solid ${toast.type === 'error' ? '#f87171' : '#4ade80'}`,
                    color: toast.type === 'error' ? '#f87171' : '#4ade80',
                    backdropFilter: 'blur(10px)',
                }}>{toast.type === 'error' ? '❌' : '✅'} {toast.msg}</div>
            )}

            {/* Header */}
            <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                    <div className="section-title" style={{ fontSize: 18 }}>
                        Employee Setup
                        <span style={{
                            marginLeft: 10, fontSize: 12, fontWeight: 600,
                            background: 'rgba(251,191,36,0.1)', border: '1px solid var(--border-default)',
                            borderRadius: 20, padding: '3px 12px', color: 'var(--gold-300)',
                        }}>{employees.length} staff</span>
                    </div>
                    <div className="section-sub">Manage employees, roles, shift times & salaries</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn-secondary" onClick={() => setShowRoleMgr(v => !v)}>
                        🏷 {showRoleMgr ? 'Hide' : 'Manage'} Roles
                    </button>
                    <button className="btn-primary" onClick={openAdd}>+ Add Employee</button>
                </div>
            </div>

            {/* Role Manager */}
            {showRoleMgr && (
                <div className="card" style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 12 }}>🏷 Role / Designation Management</div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                        <input
                            type="text" value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addRole()}
                            className="form-input" style={{ flex: 1, minWidth: 180 }}
                            placeholder="Enter new role name (e.g. Polisher)" />
                        <button className="btn-primary" onClick={addRole} disabled={addingRole}>
                            {addingRole ? '…' : '+ Add Role'}
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {roles.map(r => (
                            <div key={r.id} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                background: 'rgba(251,191,36,0.08)', border: '1px solid var(--border-default)',
                                borderRadius: 20, padding: '4px 12px',
                            }}>
                                <span style={{ fontSize: 12, color: 'var(--gold-300)', fontWeight: 600 }}>{r.name}</span>
                                {isAdmin && (
                                    <button onClick={() => deleteRole(r.id, r.name)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: 12, padding: 0, lineHeight: 1,
                                    }}>✕</button>
                                )}
                            </div>
                        ))}
                        {roles.length === 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No roles defined yet</span>}
                    </div>
                </div>
            )}

            {/* Add / Edit Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold-300)', marginBottom: 14 }}>
                        {editingId ? '✏️ Edit Employee' : '➕ New Employee'}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>

                            {/* Name */}
                            <div>
                                <label className="form-label">Full Name *</label>
                                <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                    className="form-input" placeholder="Employee full name" required />
                            </div>

                            {/* Role dropdown with custom add */}
                            <div>
                                <label className="form-label">Role / Designation *</label>
                                <div style={{ display: 'flex', gap: 6 }}>
                                    <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                                        className="form-input" style={{ flex: 1 }} required>
                                        <option value="">Select role…</option>
                                        {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                                    </select>
                                    <button type="button" title="Manage Roles" onClick={() => setShowRoleMgr(true)}
                                        style={{ padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-default)', background: 'var(--bg-elevated)', color: 'var(--gold-300)', cursor: 'pointer', fontSize: 14 }}>
                                        +
                                    </button>
                                </div>
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="form-label">Mobile *</label>
                                <input type="text" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                                    className="form-input" placeholder="Phone number" required />
                            </div>

                            {/* Join Date */}
                            <div>
                                <label className="form-label">Join Date *</label>
                                <input type="date" value={form.joinDate} onChange={e => setForm(p => ({ ...p, joinDate: e.target.value }))}
                                    className="form-input" required />
                            </div>

                            {/* Monthly Salary */}
                            <div>
                                <label className="form-label">Monthly Salary (₹)</label>
                                <input type="number" value={form.monthlySalary} onChange={e => setForm(p => ({ ...p, monthlySalary: e.target.value }))}
                                    className="form-input" placeholder="0.00" min="0" step="100" />
                            </div>

                            {/* OT Rate */}
                            <div>
                                <label className="form-label">OT Rate (₹/hour)</label>
                                <input type="number" value={form.otRate} onChange={e => setForm(p => ({ ...p, otRate: e.target.value }))}
                                    className="form-input" placeholder="0.00" min="0" step="10" />
                            </div>

                            {/* Shift Start */}
                            <div>
                                <label className="form-label">Shift Start Time</label>
                                <input type="time" value={form.shiftStart} onChange={e => setForm(p => ({ ...p, shiftStart: e.target.value }))}
                                    className="form-input" />
                            </div>

                            {/* Shift End */}
                            <div>
                                <label className="form-label">Shift End Time</label>
                                <input type="time" value={form.shiftEnd} onChange={e => setForm(p => ({ ...p, shiftEnd: e.target.value }))}
                                    className="form-input" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</button>
                            <button type="submit" className="btn-primary" disabled={saving}>
                                {saving ? '…Saving' : editingId ? '✓ Update Employee' : '✓ Add Employee'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Employee List */}
            {employees.length === 0 && !showForm ? (
                <div className="empty-state">
                    <div className="empty-state-icon">👥</div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No employees yet</div>
                    <div className="empty-state-text">Click "Add Employee" to get started</div>
                </div>
            ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Shift Time</th>
                                <th style={{ color: 'var(--gold-300)' }}>Monthly Salary</th>
                                <th style={{ color: '#a78bfa' }}>OT Rate/hr</th>
                                <th>Joined</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map(emp => (
                                <tr key={emp.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{
                                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                                background: `hsl(${(emp.id * 67) % 360}, 55%, 28%)`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: 14, fontWeight: 800, color: '#fff', border: '2px solid rgba(255,255,255,0.1)',
                                            }}>{emp.name[0]}</div>
                                            <div>
                                                <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-primary)' }}>{emp.name}</div>
                                                <div style={{
                                                    fontSize: 10, fontWeight: 700, color: 'var(--gold-400)',
                                                    background: 'rgba(251,191,36,0.1)', borderRadius: 4,
                                                    padding: '1px 7px', display: 'inline-block', marginTop: 2,
                                                }}>{emp.role}</div>
                                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>📱 {emp.mobile}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {editShift?.empId === emp.id ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <input type="time" value={editShift.shiftStart}
                                                    onChange={e => setEditShift(p => ({ ...p, shiftStart: e.target.value }))}
                                                    className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 100 }} />
                                                <span style={{ color: 'var(--text-muted)' }}>–</span>
                                                <input type="time" value={editShift.shiftEnd}
                                                    onChange={e => setEditShift(p => ({ ...p, shiftEnd: e.target.value }))}
                                                    className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 100 }} />
                                                <button onClick={saveShift} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, background: 'linear-gradient(135deg,#fbbf24,#d97706)', border: 'none', cursor: 'pointer', color: '#ffffff' }}>✓</button>
                                                <button onClick={() => setEditShift(null)} style={{ padding: '4px 8px', borderRadius: 6, fontSize: 12, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <div style={{
                                                    background: 'rgba(251,191,36,0.08)', border: '1px solid var(--border-default)',
                                                    borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)',
                                                }}>🕐 {emp.shiftStart} – {emp.shiftEnd}</div>
                                                <button onClick={() => setEditShift({ empId: emp.id, shiftStart: emp.shiftStart, shiftEnd: emp.shiftEnd })}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 13 }} title="Edit shift">✏️</button>
                                            </div>
                                        )}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--gold-300)' }}>
                                            ₹{Number(emp.monthlySalary).toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/month</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 700, fontSize: 13, color: '#a78bfa' }}>
                                            ₹{Number(emp.otRate).toLocaleString('en-IN')}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>/hour</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{fmtDate(emp.joinDate)}</div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }} onClick={() => openEdit(emp)}>✏️ Edit</button>
                                            {isAdmin && (
                                                <button className="btn-danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteEmployee(emp.id, emp.name)}>🗑</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
