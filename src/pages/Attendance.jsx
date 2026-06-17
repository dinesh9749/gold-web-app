import { useState, useEffect, useCallback } from 'react';

const statusConfig = {
    present: { label: 'Present', color: '#4ade80', bg: 'rgba(74,222,128,0.12)', icon: '✅' },
    absent: { label: 'Absent', color: '#f87171', bg: 'rgba(248,113,113,0.12)', icon: '❌' },
    half: { label: 'Half Day', color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', icon: '🌗' },
    holiday: { label: 'Holiday', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)', icon: '🎉' },
};

const todayStr = () => new Date().toISOString().split('T')[0];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Calculate hours between two HH:MM strings
function hoursBetween(start, end) {
    if (!start || !end) return 0;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff / 60 : 0;
}

export default function AttendancePage() {
    const [tab, setTab] = useState('daily');

    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState([]);
    const [loadingAtt, setLoadingAtt] = useState(false);
    const [savingRows, setSavingRows] = useState({});
    const [selectedDate, setSelectedDate] = useState(todayStr());

    const now = new Date();
    const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);
    const [summaryYear, setSummaryYear] = useState(now.getFullYear());
    const [summary, setSummary] = useState([]);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Load employees
    const loadEmployees = useCallback(async () => {
        try {
            const res = await window.electronAPI?.getAllEmployees() || [];
            setEmployees(res);
        } catch (e) { console.error(e); }
    }, []);

    useEffect(() => { loadEmployees(); }, [loadEmployees]);

    // Load daily attendance — merges saved records with full employee list
    const loadAttendance = useCallback(async () => {
        setLoadingAtt(true);
        try {
            const marked = await window.electronAPI?.getAttendanceByDate(selectedDate) || [];
            const merged = employees.map(emp => {
                const rec = marked.find(a => a.employeeId === emp.id);
                return {
                    employeeId: emp.id,
                    employeeName: emp.name,
                    employeeRole: emp.role,
                    shiftStart: emp.shiftStart,
                    shiftEnd: emp.shiftEnd,
                    otRate: emp.otRate || 0,
                    monthlySalary: emp.monthlySalary || 0,
                    status: rec?.status || 'present',
                    checkIn: rec?.checkIn || emp.shiftStart || '',
                    checkOut: rec?.checkOut || emp.shiftEnd || '',
                    otHours: rec?.otHours || 0,
                    notes: rec?.notes || '',
                    saved: !!rec,
                };
            });
            setAttendance(merged);
        } catch (e) { console.error(e); }
        finally { setLoadingAtt(false); }
    }, [selectedDate, employees]);

    useEffect(() => {
        if (tab === 'daily' && employees.length > 0) loadAttendance();
    }, [tab, selectedDate, employees, loadAttendance]);

    // Load monthly summary
    const loadSummary = useCallback(async () => {
        setLoadingSummary(true);
        try {
            const res = await window.electronAPI?.getMonthlySummary(summaryMonth, summaryYear) || [];
            setSummary(res);
        } catch (e) { console.error(e); }
        finally { setLoadingSummary(false); }
    }, [summaryMonth, summaryYear]);

    useEffect(() => { if (tab === 'summary') loadSummary(); }, [tab, summaryMonth, summaryYear, loadSummary]);

    // Update a field in attendance row
    const updateRow = (empId, field, value) =>
        setAttendance(prev => prev.map(r => r.employeeId === empId ? { ...r, [field]: value, saved: false } : r));

    // Save single row
    const saveRow = async (row) => {
        setSavingRows(prev => ({ ...prev, [row.employeeId]: true }));
        try {
            await window.electronAPI?.markAttendance({
                employeeId: row.employeeId,
                date: selectedDate,
                status: row.status,
                checkIn: row.checkIn,
                checkOut: row.checkOut,
                otHours: parseFloat(row.otHours) || 0,
                notes: row.notes,
            });
            setAttendance(prev => prev.map(r => r.employeeId === row.employeeId ? { ...r, saved: true } : r));
        } catch (e) { console.error(e); }
        finally { setSavingRows(prev => ({ ...prev, [row.employeeId]: false })); }
    };

    const saveAllRows = async () => { for (const row of attendance) await saveRow(row); };

    // Stats for header chips
    const todayStats = attendance.reduce((acc, r) => { acc[r.status] = (acc[r.status] || 0) + 1; return acc; }, {});

    // Helper: compute daily OT pay
    const calcDayPay = (row) => {
        const workedHours = hoursBetween(row.checkIn, row.checkOut);
        const shiftHours = hoursBetween(row.shiftStart, row.shiftEnd);
        const extraHours = parseFloat(row.otHours) || 0;
        // Per-day base = monthlySalary / 26 (working days assumption)
        const perDay = (row.monthlySalary || 0) / 26;
        const statusFactor = row.status === 'present' ? 1 : row.status === 'half' ? 0.5 : row.status === 'holiday' ? 1 : 0;
        const base = perDay * statusFactor;
        const otPay = (row.otRate || 0) * extraHours;
        return { base, otPay, total: base + otPay, workedHours: workedHours.toFixed(1), shiftHours: shiftHours.toFixed(1) };
    };

    return (
        <div>
            {/* Header */}
            <div className="section-header" style={{ marginBottom: 20 }}>
                <div>
                    <div className="section-title" style={{ fontSize: 18 }}>
                        Attendance
                        <span style={{
                            marginLeft: 10, fontSize: 12, fontWeight: 600,
                            background: 'rgba(251,191,36,0.1)', border: '1px solid var(--border-default)',
                            borderRadius: 20, padding: '3px 12px', color: 'var(--gold-300)',
                        }}>{employees.length} staff</span>
                    </div>
                    <div className="section-sub">Daily tracking with OT hours & shift-based salary calculation</div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                    {tab === 'daily' && <button className="btn-primary" onClick={saveAllRows}>💾 Save All</button>}
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 18, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 8 }}>
                {[
                    { id: 'daily', label: '📋 Daily Attendance' },
                    { id: 'summary', label: '📊 Monthly Summary' },
                ].map(t => (
                    <button key={t.id} onClick={() => setTab(t.id)} style={{
                        padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        border: 'none', cursor: 'pointer', transition: 'all 0.15s',
                        background: tab === t.id ? 'linear-gradient(135deg, #fbbf24, #d97706)' : 'var(--bg-elevated)',
                        color: tab === t.id ? '#000' : 'var(--text-secondary)',
                    }}>{t.label}</button>
                ))}
            </div>

            {/* ── DAILY ATTENDANCE ─────────────────────────────────────── */}
            {tab === 'daily' && (
                <div>
                    {/* Date picker + status chips */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '8px 14px' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📅</span>
                            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }} />
                        </div>
                        {Object.entries(statusConfig).map(([k, v]) => (
                            <div key={k} style={{ background: v.bg, border: `1px solid ${v.color}44`, borderRadius: 8, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ fontSize: 12 }}>{v.icon}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: v.color }}>{todayStats[k] || 0}</span>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.label}</span>
                            </div>
                        ))}
                    </div>

                    {employees.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">👥</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No employees found</div>
                            <div className="empty-state-text">Add employees in the Employee Setup page first</div>
                        </div>
                    ) : loadingAtt ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 40 }}>
                            <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                            <table className="data-table" style={{ minWidth: 1000 }}>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Status</th>
                                        <th>Shift</th>
                                        <th>Check In</th>
                                        <th>Check Out</th>
                                        <th style={{ color: '#a78bfa' }}>OT Hrs</th>
                                        <th>Notes</th>
                                        <th style={{ color: 'var(--gold-300)' }}>Day Pay</th>
                                        <th>Save</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendance.map(row => {
                                        const { base, otPay, total, workedHours, shiftHours } = calcDayPay(row);
                                        return (
                                            <tr key={row.employeeId} style={{ background: row.saved ? 'rgba(74,222,128,0.03)' : undefined }}>
                                                {/* Employee */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                                                            background: `hsl(${(row.employeeId * 67) % 360}, 55%, 28%)`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 12, fontWeight: 800, color: '#fff',
                                                        }}>{row.employeeName?.[0]}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{row.employeeName}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.employeeRole}</div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Status buttons */}
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            {['present', 'absent'].map(k => {
                                                                const v = statusConfig[k];
                                                                return (
                                                                    <button key={k} onClick={() => updateRow(row.employeeId, 'status', k)} style={{
                                                                        padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                                                                        border: `1px solid ${row.status === k ? v.color : 'transparent'}`,
                                                                        background: row.status === k ? v.bg : 'var(--bg-elevated)',
                                                                        color: row.status === k ? v.color : 'var(--text-muted)',
                                                                        cursor: 'pointer',
                                                                    }}>{v.icon} {v.label}</button>
                                                                );
                                                            })}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            {['half', 'holiday'].map(k => {
                                                                const v = statusConfig[k];
                                                                return (
                                                                    <button key={k} onClick={() => updateRow(row.employeeId, 'status', k)} style={{
                                                                        padding: '3px 8px', borderRadius: 5, fontSize: 10, fontWeight: 700,
                                                                        border: `1px solid ${row.status === k ? v.color : 'transparent'}`,
                                                                        background: row.status === k ? v.bg : 'var(--bg-elevated)',
                                                                        color: row.status === k ? v.color : 'var(--text-muted)',
                                                                        cursor: 'pointer',
                                                                    }}>{v.icon} {v.label}</button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Shift */}
                                                <td>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        🕐 {row.shiftStart} – {row.shiftEnd}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                                                        Worked {workedHours}h / {shiftHours}h
                                                    </div>
                                                </td>

                                                {/* Check In */}
                                                <td>
                                                    <input type="time" value={row.checkIn} onChange={e => updateRow(row.employeeId, 'checkIn', e.target.value)}
                                                        className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 100 }} />
                                                </td>

                                                {/* Check Out */}
                                                <td>
                                                    <input type="time" value={row.checkOut} onChange={e => updateRow(row.employeeId, 'checkOut', e.target.value)}
                                                        className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 100 }} />
                                                </td>

                                                {/* OT Hours */}
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <input type="number" value={row.otHours} min="0" max="24" step="0.5"
                                                            onChange={e => updateRow(row.employeeId, 'otHours', e.target.value)}
                                                            className="form-input" style={{ padding: '4px 8px', fontSize: 12, width: 70 }} />
                                                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>hrs</span>
                                                    </div>
                                                    {row.otRate > 0 && (
                                                        <div style={{ fontSize: 10, color: '#a78bfa', marginTop: 2 }}>
                                                            +₹{(parseFloat(row.otHours || 0) * row.otRate).toFixed(0)} OT
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Notes */}
                                                <td>
                                                    <input type="text" value={row.notes} onChange={e => updateRow(row.employeeId, 'notes', e.target.value)}
                                                        className="form-input" style={{ padding: '4px 8px', fontSize: 11 }} placeholder="Note…" />
                                                </td>

                                                {/* Day Pay estimate */}
                                                <td>
                                                    <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--gold-300)', whiteSpace: 'nowrap' }}>
                                                        ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </div>
                                                    {otPay > 0 && (
                                                        <div style={{ fontSize: 10, color: '#a78bfa' }}>+ ₹{otPay.toFixed(0)} OT</div>
                                                    )}
                                                </td>

                                                {/* Save button */}
                                                <td>
                                                    <button onClick={() => saveRow(row)} disabled={savingRows[row.employeeId]} style={{
                                                        padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                                                        background: row.saved ? 'rgba(74,222,128,0.15)' : 'linear-gradient(135deg,#fbbf24,#d97706)',
                                                        border: row.saved ? '1px solid #4ade80' : 'none',
                                                        color: row.saved ? '#4ade80' : '#000', transition: 'all 0.15s',
                                                    }}>
                                                        {savingRows[row.employeeId] ? '…' : row.saved ? '✓' : 'Save'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── MONTHLY SUMMARY ──────────────────────────────────────── */}
            {tab === 'summary' && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '8px 14px' }}>
                            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📅</span>
                            <select value={summaryMonth} onChange={e => setSummaryMonth(+e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                                {monthNames.map((m, i) => <option key={m} value={i + 1} style={{ background: 'var(--bg-card)' }}>{m}</option>)}
                            </select>
                            <input type="number" value={summaryYear} onChange={e => setSummaryYear(+e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, outline: 'none', width: 60 }} />
                        </div>
                        <button className="btn-secondary" onClick={loadSummary}>↻ Refresh</button>
                    </div>

                    {loadingSummary ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 40 }}>
                            <div className="spinner" /><span style={{ color: 'var(--text-muted)' }}>Loading…</span>
                        </div>
                    ) : summary.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>No data for this month</div>
                            <div className="empty-state-text">Mark attendance in the Daily tab to see summaries here</div>
                        </div>
                    ) : (
                        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
                            <table className="data-table" style={{ minWidth: 900 }}>
                                <thead>
                                    <tr>
                                        <th>Employee</th>
                                        <th>Shift</th>
                                        <th style={{ color: '#4ade80' }}>✅ Present</th>
                                        <th style={{ color: '#f87171' }}>❌ Absent</th>
                                        <th style={{ color: '#fbbf24' }}>🌗 Half</th>
                                        <th style={{ color: '#a78bfa' }}>🎉 Holiday</th>
                                        <th style={{ color: '#a78bfa' }}>OT Hrs</th>
                                        <th style={{ color: 'var(--gold-300)' }}>Net Salary</th>
                                        <th style={{ color: 'var(--gold-300)' }}>OT Pay</th>
                                        <th style={{ color: 'var(--gold-300)' }}>Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {summary.map(emp => {
                                        const workingDays = emp.presentDays + (emp.halfDays * 0.5);
                                        const totalMarked = emp.presentDays + emp.absentDays + emp.halfDays + emp.holidayDays;
                                        const perDay = totalMarked > 0 ? emp.monthlySalary / totalMarked : emp.monthlySalary / 26;
                                        const netSalary = perDay * workingDays;
                                        const otPay = (emp.otRate || 0) * (emp.totalOtHours || 0);
                                        const grandTotal = netSalary + otPay;
                                        return (
                                            <tr key={emp.id}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                        <div style={{
                                                            width: 30, height: 30, borderRadius: '50%',
                                                            background: `hsl(${(emp.id * 67) % 360}, 55%, 28%)`,
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: 12, fontWeight: 800, color: '#fff',
                                                        }}>{emp.name[0]}</div>
                                                        <div>
                                                            <div style={{ fontWeight: 600, fontSize: 13 }}>{emp.name}</div>
                                                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{emp.role}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                        🕐 {emp.shiftStart} – {emp.shiftEnd}
                                                    </div>
                                                </td>
                                                <td><StatBadge value={emp.presentDays} color="#4ade80" /></td>
                                                <td><StatBadge value={emp.absentDays} color="#f87171" /></td>
                                                <td><StatBadge value={emp.halfDays} color="#fbbf24" /></td>
                                                <td><StatBadge value={emp.holidayDays} color="#a78bfa" /></td>
                                                <td>
                                                    <span style={{ fontWeight: 700, fontSize: 13, color: '#a78bfa' }}>
                                                        {(emp.totalOtHours || 0).toFixed(1)} hrs
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--gold-300)' }}>
                                                        ₹{netSalary.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{workingDays} days</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 700, fontSize: 13, color: '#a78bfa' }}>
                                                        ₹{otPay.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>₹{emp.otRate}/hr</div>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--gold-200)' }}>
                                                        ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                                    </div>
                                                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>of ₹{emp.monthlySalary.toLocaleString('en-IN')}</div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatBadge({ value, color }) {
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: 8, fontWeight: 800, fontSize: 14,
            background: `${color}18`, color,
        }}>{value}</span>
    );
}
