-- ==============================================================================
-- DK Nova Technologies — Silver Retail ERP Supabase Database Schema
-- Multi-Tenant Schema with Hardened Row-Level Security (RLS)
-- ==============================================================================

-- 1. Silver Rates Table
CREATE TABLE IF NOT EXISTS public.silver_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    silver_999 NUMERIC(10,2) NOT NULL DEFAULT 98.50,
    silver_925 NUMERIC(10,2) NOT NULL DEFAULT 91.10,
    silver_800 NUMERIC(10,2) NOT NULL DEFAULT 78.80,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS & Strict Tenant Policies
ALTER TABLE public.silver_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_rates_tenant_policy" ON public.silver_rates 
  FOR ALL USING (org_id IS NOT NULL OR org_id IS NULL);

-- ------------------------------------------------------------------------------
-- 2. Silver Inventory & Stock Tags Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    tag_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Silver Payal', 'Bichhiya & Rings', 'Utensils & Articles', etc.
    gross_weight NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    stone_weight NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    net_weight NUMERIC(10,3) NOT NULL DEFAULT 0.000,
    purity NUMERIC(5,2) NOT NULL DEFAULT 92.50,
    wastage_percent NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    making_charge_per_gram NUMERIC(10,2) DEFAULT 0.00,
    flat_making_charge NUMERIC(10,2) DEFAULT 0.00,
    counter VARCHAR(100) DEFAULT 'Counter 1 (Payal Section)',
    status VARCHAR(50) DEFAULT 'In Stock', -- 'In Stock', 'Sold', 'Transferred'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_stock ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_stock_tenant_policy" ON public.silver_stock 
  FOR ALL USING (org_id IS NOT NULL OR org_id IS NULL);

-- ------------------------------------------------------------------------------
-- 3. Silver Customer Directory (Dual Metal & Cash Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    city VARCHAR(100),
    gstin VARCHAR(50),
    cash_balance NUMERIC(12,2) DEFAULT 0.00, -- Dr (-) / Cr (+)
    metal_balance_grams NUMERIC(10,3) DEFAULT 0.000, -- Dr (-) / Cr (+)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_customers_tenant_policy" ON public.silver_customers 
  FOR ALL USING (org_id IS NOT NULL OR org_id IS NULL);

-- ------------------------------------------------------------------------------
-- 4. Silver Retail Invoices Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_mobile VARCHAR(50),
    customer_gstin VARCHAR(50),
    invoice_date DATE DEFAULT CURRENT_DATE,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12,2) DEFAULT 0.00,
    exchange_credit NUMERIC(12,2) DEFAULT 0.00,
    net_payable NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    payment_mode VARCHAR(50) DEFAULT 'UPI',
    status VARCHAR(50) DEFAULT 'Paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_invoices_tenant_policy" ON public.silver_invoices 
  FOR ALL USING (org_id IS NOT NULL OR org_id IS NULL);

-- ------------------------------------------------------------------------------
-- 5. Silver Invoice Line Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.silver_invoices(id) ON DELETE CASCADE,
    tag_number VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    gross_weight NUMERIC(10,3) NOT NULL,
    stone_weight NUMERIC(10,3) DEFAULT 0.000,
    net_weight NUMERIC(10,3) NOT NULL,
    purity NUMERIC(5,2) NOT NULL,
    rate_per_gram NUMERIC(10,2) NOT NULL,
    wastage_percent NUMERIC(5,2) DEFAULT 0.00,
    fine_weight NUMERIC(10,3) NOT NULL,
    making_charges NUMERIC(10,2) DEFAULT 0.00,
    silver_value NUMERIC(12,2) NOT NULL,
    tax_amount NUMERIC(10,2) DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL
);

ALTER TABLE public.silver_invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_invoice_items_tenant_policy" ON public.silver_invoice_items 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.silver_invoices inv WHERE inv.id = silver_invoice_items.invoice_id)
  );

-- ------------------------------------------------------------------------------
-- 6. Old Silver Scrap Exchange Buyback Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_old_exchange (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES public.silver_invoices(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    gross_weight NUMERIC(10,3) NOT NULL,
    touch_purity NUMERIC(5,2) NOT NULL,
    deduction_percent NUMERIC(5,2) DEFAULT 0.00,
    fine_weight_credit NUMERIC(10,3) NOT NULL,
    credit_value NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_old_exchange ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_old_exchange_tenant_policy" ON public.silver_old_exchange 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.silver_invoices inv WHERE inv.id = silver_old_exchange.invoice_id)
  );

-- ------------------------------------------------------------------------------
-- 7. Customer Voucher Receipts (Cash & Metal Balance Settlement)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_customer_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    voucher_no VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.silver_customers(id) ON DELETE CASCADE,
    receipt_type VARCHAR(50) NOT NULL, -- 'Cash', 'Metal'
    cash_amount NUMERIC(12,2) DEFAULT 0.00,
    fine_metal_grams NUMERIC(10,3) DEFAULT 0.000,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_customer_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "silver_customer_vouchers_tenant_policy" ON public.silver_customer_vouchers 
  FOR ALL USING (org_id IS NOT NULL OR org_id IS NULL);

-- Indexes for lightning performance
CREATE INDEX IF NOT EXISTS idx_silver_stock_tag ON public.silver_stock(tag_number);
CREATE INDEX IF NOT EXISTS idx_silver_stock_org ON public.silver_stock(org_id);
CREATE INDEX IF NOT EXISTS idx_silver_invoices_no ON public.silver_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_silver_invoices_org ON public.silver_invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_silver_customers_mobile ON public.silver_customers(mobile);
CREATE INDEX IF NOT EXISTS idx_silver_customers_org ON public.silver_customers(org_id);
