import { supabase } from './supabaseClient';

const ensureRowReturned = (data, tableName) => {
  if (!data || data.length === 0) {
    throw new Error(`No data returned from table '${tableName}'. If you are running Supabase, verify that Row-Level Security (RLS) is disabled for '${tableName}' or that you have created an appropriate SELECT policy.`);
  }
  return data[0];
};

export const supabaseAPI = {
  // --- METAL RATES ---
  saveMetalRates: async (rateData) => {
    try {
      const { data, error } = await supabase
        .from('metal_rates')
        .insert([{
          gold_rate: rateData.goldRate,
          silver_rate: rateData.silverRate,
          gold_24_rate: rateData.gold24Rate
        }])
        .select();
      if (error) throw error;
      const row = ensureRowReturned(data, 'metal_rates');
      return { success: true, id: row.id };
    } catch (err) {
      console.error("Error saving metal rates:", err);
      return { success: false, error: err.message };
    }
  },

  getMetalRates: async () => {
    try {
      const { data, error } = await supabase
        .from('metal_rates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);
      if (error) throw error;
      return { success: true, metal_rates: data };
    } catch (err) {
      console.error("Error retrieving metal rates:", err);
      return { success: false, error: err.message };
    }
  },

  // --- SALES ORDERS ---
  saveSalesOrder: async (orderData) => {
    const { data: order, error: orderErr } = await supabase
      .from('sales_orders')
      .insert([{
        customer_name: orderData.customerName,
        advance_amount: orderData.advanceAmount || 0,
        advance_gold: orderData.advanceGold || 0,
        delivery_date: orderData.deliveryDate,
        status: orderData.status || 'incomplete'
      }])
      .select();
    if (orderErr) throw orderErr;
    const orderRow = ensureRowReturned(order, 'sales_orders');
    const orderId = orderRow.id;

    if (orderData.products && orderData.products.length > 0) {
      const productsToInsert = orderData.products.map(p => ({
        order_id: orderId,
        product_type: p.type,
        ornament: p.ornament,
        weight: parseFloat(p.weight)
      }));
      const { error: prodErr } = await supabase
        .from('order_products')
        .insert(productsToInsert);
      if (prodErr) throw prodErr;
    }
    return { id: orderId };
  },

  getAllSalesOrders: async () => {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, order_products(*)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    return data.map(so => ({
      id: so.id,
      customerName: so.customer_name,
      advanceAmount: parseFloat(so.advance_amount) || 0,
      advanceGold: parseFloat(so.advance_gold) || 0,
      deliveryDate: so.delivery_date,
      status: so.status,
      createdAt: so.created_at,
      updatedAt: so.updated_at,
      products: (so.order_products || []).map(op => ({
        type: op.product_type,
        ornament: op.ornament,
        weight: parseFloat(op.weight) || 0
      }))
    }));
  },

  updateOrderStatus: async (orderId, status) => {
    const { error } = await supabase
      .from('sales_orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);
    if (error) throw error;
    return { changes: 1 };
  },

  getSalesOrderById: async (orderId) => {
    const { data, error } = await supabase
      .from('sales_orders')
      .select('*, order_products(*)')
      .eq('id', orderId)
      .single();
    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      customerName: data.customer_name,
      advanceAmount: parseFloat(data.advance_amount) || 0,
      advanceGold: parseFloat(data.advance_gold) || 0,
      deliveryDate: data.delivery_date,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      products: (data.order_products || []).map(op => ({
        type: op.product_type,
        ornament: op.ornament,
        weight: parseFloat(op.weight) || 0
      }))
    };
  },

  deleteSalesOrder: async (orderId) => {
    const { error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', orderId);
    if (error) throw error;
    return { changes: 1 };
  },

  // --- CUSTOMERS ---
  saveCustomer: async (customerData) => {
    const { data, error } = await supabase
      .from('customers')
      .insert([{
        title: customerData.title,
        name: customerData.name,
        surname: customerData.surname,
        mobile: customerData.mobile,
        city: customerData.city,
        address1: customerData.address1,
        address2: customerData.address2 || '',
        address3: customerData.address3 || '',
        state: customerData.state
      }])
      .select();
    if (error) throw error;
    const row = ensureRowReturned(data, 'customers');
    return { id: row.id };
  },

  getAllCustomers: async () => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      title: row.title,
      name: row.name,
      surname: row.surname,
      mobile: row.mobile,
      city: row.city,
      address1: row.address1,
      address2: row.address2 || '',
      address3: row.address3 || '',
      state: row.state,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  getCustomerById: async (customerId) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      name: data.name,
      surname: data.surname,
      mobile: data.mobile,
      city: data.city,
      address1: data.address1,
      address2: data.address2 || '',
      address3: data.address3 || '',
      state: data.state,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  updateCustomer: async (customerId, customerData) => {
    const { error } = await supabase
      .from('customers')
      .update({
        title: customerData.title,
        name: customerData.name,
        surname: customerData.surname,
        mobile: customerData.mobile,
        city: customerData.city,
        address1: customerData.address1,
        address2: customerData.address2 || '',
        address3: customerData.address3 || '',
        state: customerData.state,
        updated_at: new Date().toISOString()
      })
      .eq('id', customerId);
    if (error) throw error;
    return { changes: 1 };
  },

  deleteCustomer: async (customerId) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customerId);
    if (error) throw error;
    return { changes: 1 };
  },

  searchCustomers: async (searchTerm) => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,surname.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      title: row.title,
      name: row.name,
      surname: row.surname,
      mobile: row.mobile,
      city: row.city,
      address1: row.address1,
      address2: row.address2 || '',
      address3: row.address3 || '',
      state: row.state,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
  },

  // --- EMPLOYEES ---
  saveEmployee: async (data) => {
    const { data: emp, error } = await supabase
      .from('employees')
      .insert([{
        name: data.name,
        role: data.role,
        mobile: data.mobile,
        join_date: data.joinDate,
        monthly_salary: data.monthlySalary || 0,
        ot_rate: data.otRate || 0,
        shift_start: data.shiftStart || '09:00',
        shift_end: data.shiftEnd || '18:00'
      }])
      .select();
    if (error) throw error;
    const row = ensureRowReturned(emp, 'employees');
    return { id: row.id };
  },

  updateEmployee: async (employeeId, data) => {
    const { error } = await supabase
      .from('employees')
      .update({
        name: data.name,
        role: data.role,
        mobile: data.mobile,
        join_date: data.joinDate,
        monthly_salary: data.monthlySalary || 0,
        ot_rate: data.otRate || 0,
        shift_start: data.shiftStart || '09:00',
        shift_end: data.shiftEnd || '18:00'
      })
      .eq('id', employeeId);
    if (error) throw error;
    return { changes: 1 };
  },

  getAllEmployees: async () => {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', 1)
      .order('name', { ascending: true });
    if (error) throw error;
    return data.map(r => ({
      id: r.id,
      name: r.name,
      role: r.role,
      mobile: r.mobile,
      joinDate: r.join_date,
      monthlySalary: r.monthly_salary,
      otRate: r.ot_rate || 0,
      shiftStart: r.shift_start || '09:00',
      shiftEnd: r.shift_end || '18:00',
      isActive: r.is_active,
      createdAt: r.created_at
    }));
  },

  deleteEmployee: async (employeeId) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employeeId);
    if (error) throw error;
    return { changes: 1 };
  },

  // --- ROLES ---
  getAllRoles: async () => {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data.map(r => ({ id: r.id, name: r.name }));
  },

  addRole: async (name) => {
    const { data, error } = await supabase
      .from('roles')
      .insert([{ name: name.trim() }])
      .select();
    if (error) throw error;
    const row = ensureRowReturned(data, 'roles');
    return { id: row.id };
  },

  deleteRole: async (roleId) => {
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);
    if (error) throw error;
    return { changes: 1 };
  },

  // --- ATTENDANCE ---
  markAttendance: async (data) => {
    const { data: att, error } = await supabase
      .from('attendance')
      .upsert({
        employee_id: data.employeeId,
        date: data.date,
        status: data.status,
        check_in: data.checkIn || null,
        check_out: data.checkOut || null,
        ot_hours: data.otHours || 0,
        notes: data.notes || null
      }, { onConflict: 'employee_id,date' })
      .select();
    if (error) throw error;
    const row = ensureRowReturned(att, 'attendance');
    return { id: row.id };
  },

  getAttendanceByDate: async (date) => {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, employees(*)')
      .eq('date', date);
    if (error) throw error;
    return data.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      employeeName: r.employees.name,
      employeeRole: r.employees.role,
      shiftStart: r.employees.shift_start,
      shiftEnd: r.employees.shift_end,
      otRate: r.employees.ot_rate,
      date: r.date,
      status: r.status,
      checkIn: r.check_in,
      checkOut: r.check_out,
      otHours: r.ot_hours || 0,
      notes: r.notes
    })).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  },

  getAttendanceByEmployee: async (employeeId, month, year) => {
    const mm = String(month).padStart(2, '0');
    const prefix = `${year}-${mm}`;
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .like('date', `${prefix}%`)
      .order('date', { ascending: true });
    if (error) throw error;
    return data.map(r => ({
      id: r.id,
      employeeId: r.employee_id,
      date: r.date,
      status: r.status,
      checkIn: r.check_in,
      checkOut: r.check_out,
      notes: r.notes
    }));
  },

  getMonthlySummary: async (month, year) => {
    const mm = String(month).padStart(2, '0');
    const prefix = `${year}-${mm}`;

    const { data: employees, error: empErr } = await supabase
      .from('employees')
      .select('*')
      .eq('is_active', 1)
      .order('name', { ascending: true });
    if (empErr) throw empErr;

    const { data: attendance, error: attErr } = await supabase
      .from('attendance')
      .select('*')
      .like('date', `${prefix}%`);
    if (attErr) throw attErr;

    return employees.map(emp => {
      const empAttendance = attendance.filter(a => a.employee_id === emp.id);
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let holidayDays = 0;
      let totalOtHours = 0;

      empAttendance.forEach(a => {
        if (a.status === 'present') presentDays++;
        else if (a.status === 'absent') absentDays++;
        else if (a.status === 'half') halfDays++;
        else if (a.status === 'holiday') holidayDays++;
        totalOtHours += parseFloat(a.ot_hours) || 0;
      });

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        monthlySalary: emp.monthly_salary,
        otRate: emp.ot_rate || 0,
        shiftStart: emp.shift_start || '09:00',
        shiftEnd: emp.shift_end || '18:00',
        presentDays,
        absentDays,
        halfDays,
        holidayDays,
        totalOtHours
      };
    });
  },

  // --- DIGIGOLD SCHEMES ---
  saveGoldScheme: async (data) => {
    const { data: scheme, error } = await supabase
      .from('gold_schemes')
      .insert([{
        customer_id: data.customerId,
        scheme_name: data.schemeName,
        preset_amount: data.presetAmount,
        interval_type: data.intervalType,
        start_date: data.startDate,
        status: data.status || 'active',
        tenure_months: data.tenureMonths || 11,
        maturity_date: data.maturityDate || null,
        has_bonus: data.hasBonus !== undefined ? data.hasBonus : 1,
        bonus_amount: data.bonusAmount || 0
      }])
      .select();
    if (error) throw error;
    const row = ensureRowReturned(scheme, 'gold_schemes');
    return { id: row.id };
  },

  getAllGoldSchemes: async () => {
    const { data, error } = await supabase
      .from('gold_schemes')
      .select('*, customers(*), gold_collections(*)');
    if (error) throw error;

    return data.map(gs => {
      const collections = gs.gold_collections || [];
      const totalCollected = collections.reduce((sum, c) => sum + (parseFloat(c.collected_amount) || 0), 0);
      const sortedCollections = [...collections].sort((a, b) => b.collection_date.localeCompare(a.collection_date));
      const lastCollectionDate = sortedCollections.length > 0 ? sortedCollections[0].collection_date : null;

      return {
        id: gs.id,
        customerId: gs.customer_id,
        schemeName: gs.scheme_name,
        presetAmount: gs.preset_amount,
        intervalType: gs.interval_type,
        startDate: gs.start_date,
        status: gs.status,
        tenureMonths: gs.tenure_months,
        maturityDate: gs.maturity_date,
        hasBonus: gs.has_bonus,
        bonusAmount: gs.bonus_amount,
        createdAt: gs.created_at,
        customerTitle: gs.customers?.title || '',
        customerName: gs.customers?.name || '',
        customerSurname: gs.customers?.surname || '',
        customerMobile: gs.customers?.mobile || '',
        totalCollected,
        lastCollectionDate
      };
    }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  updateGoldSchemeStatus: async (id, status) => {
    const { error } = await supabase
      .from('gold_schemes')
      .update({ status })
      .eq('id', id);
    if (error) throw error;
    return { changes: 1 };
  },

  deleteGoldScheme: async (id) => {
    const { error } = await supabase
      .from('gold_schemes')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { changes: 1 };
  },

  saveGoldCollection: async (data) => {
    const { data: coll, error } = await supabase
      .from('gold_collections')
      .insert([{
        scheme_id: data.schemeId,
        collection_date: data.collectionDate,
        collected_amount: data.collectedAmount,
        notes: data.notes || '',
        is_bonus: data.isBonus || 0
      }])
      .select();
    if (error) throw error;
    const row = ensureRowReturned(coll, 'gold_collections');
    return { id: row.id };
  },

  getGoldCollections: async (schemeId) => {
    let query = supabase.from('gold_collections').select('*');
    if (schemeId) {
      query = query.eq('scheme_id', schemeId);
    }
    const { data, error } = await query.order('collection_date', { ascending: false }).order('created_at', { ascending: false });
    if (error) throw error;

    return data.map(row => ({
      id: row.id,
      schemeId: row.scheme_id,
      collectionDate: row.collection_date,
      collectedAmount: row.collected_amount,
      notes: row.notes,
      isBonus: row.is_bonus,
      createdAt: row.created_at
    }));
  },

  deleteGoldCollection: async (id) => {
    const { error } = await supabase
      .from('gold_collections')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { changes: 1 };
  },

  // --- INVOICES ---
  saveInvoice: async (data) => {
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .insert([{
        invoice_no: data.invoiceNo,
        date: data.date,
        customer_id: data.customerId || null,
        customer_name: data.customerName,
        subtotal: data.subtotal,
        cgst_rate: data.cgstRate,
        cgst_amount: data.cgstAmount,
        sgst_rate: data.sgstRate,
        sgst_amount: data.sgstAmount,
        old_gold_weight: data.oldGoldWeight || 0,
        old_gold_amount: data.oldGoldAmount || 0,
        grand_total: data.grandTotal,
        final_amount: data.finalAmount
      }])
      .select();
    if (invErr) throw invErr;
    const invoiceRow = ensureRowReturned(invoice, 'invoices');
    const invoiceId = invoiceRow.id;

    if (data.items && data.items.length > 0) {
      const itemsToInsert = data.items.map(item => ({
        invoice_id: invoiceId,
        description: item.description,
        hsn_code: item.hsnCode,
        net_weight: item.netWeight,
        wastage_pct: item.wastagePct || 0,
        making_charges: item.makingCharges || 0,
        rate_per_gram: item.ratePerGram,
        amount: item.amount
      }));
      const { error: itemsErr } = await supabase
        .from('invoice_items')
        .insert(itemsToInsert);
      if (itemsErr) throw itemsErr;
    }
    return { id: invoiceId };
  },

  getAllInvoices: async () => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(row => ({
      id: row.id,
      invoiceNo: row.invoice_no,
      date: row.date,
      customerId: row.customer_id,
      customerName: row.customer_name,
      subtotal: row.subtotal,
      cgstRate: row.cgst_rate,
      cgstAmount: row.cgst_amount,
      sgstRate: row.sgst_rate,
      sgstAmount: row.sgst_amount,
      oldGoldWeight: row.old_gold_weight,
      oldGoldAmount: row.old_gold_amount,
      grandTotal: row.grand_total,
      finalAmount: row.final_amount,
      createdAt: row.created_at
    }));
  },

  getInvoiceById: async (id) => {
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('id', id)
      .single();
    if (invErr) throw invErr;
    if (!invoice) return null;

    return {
      id: invoice.id,
      invoiceNo: invoice.invoice_no,
      date: invoice.date,
      customerId: invoice.customer_id,
      customerName: invoice.customer_name,
      subtotal: invoice.subtotal,
      cgstRate: invoice.cgst_rate,
      cgstAmount: invoice.cgst_amount,
      sgstRate: invoice.sgst_rate,
      sgstAmount: invoice.sgst_amount,
      oldGoldWeight: invoice.old_gold_weight,
      oldGoldAmount: invoice.old_gold_amount,
      grandTotal: invoice.grand_total,
      finalAmount: invoice.final_amount,
      createdAt: invoice.created_at,
      items: (invoice.invoice_items || []).map(item => ({
        id: item.id,
        invoiceId: item.invoice_id,
        description: item.description,
        hsnCode: item.hsn_code,
        netWeight: item.net_weight,
        wastagePct: item.wastage_pct,
        makingCharges: item.making_charges,
        ratePerGram: item.rate_per_gram,
        amount: item.amount
      }))
    };
  },

  deleteInvoice: async (id) => {
    const { error } = await supabase
      .from('invoices')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { changes: 1 };
  }
};
