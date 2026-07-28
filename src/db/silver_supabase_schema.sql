-- ==============================================================================
-- DK Nova Technologies — Silver Retail ERP Supabase Database Schema
-- Run this script in your Supabase SQL Editor to create tables & initial seeds.
-- ==============================================================================

-- 1. Silver Rates Table
CREATE TABLE IF NOT EXISTS public.silver_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    silver_999 NUMERIC(10,2) NOT NULL DEFAULT 98.50,
    silver_925 NUMERIC(10,2) NOT NULL DEFAULT 91.10,
    silver_800 NUMERIC(10,2) NOT NULL DEFAULT 78.80,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.silver_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read silver_rates" ON public.silver_rates FOR SELECT USING (true);
CREATE POLICY "Allow authenticated manage silver_rates" ON public.silver_rates FOR ALL USING (true);

-- Insert Default Rate Seed
INSERT INTO public.silver_rates (silver_999, silver_925, silver_800) 
VALUES (98.50, 91.10, 78.80)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 2. Silver Inventory & Stock Tags Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Allow public select silver_stock" ON public.silver_stock FOR SELECT USING (true);
CREATE POLICY "Allow full manage silver_stock" ON public.silver_stock FOR ALL USING (true);

-- Stock Seeds
INSERT INTO public.silver_stock (tag_number, title, category, gross_weight, stone_weight, net_weight, purity, wastage_percent, making_charge_per_gram, counter) VALUES
('SLV-1001', 'Heavy Bridal Silver Payal Pair', 'Silver Payal', 185.500, 5.500, 180.000, 92.50, 4.00, 18.00, 'Counter 1 (Payal Section)'),
('SLV-1002', 'Silver Pooja Thali Set (5 Pcs)', 'Utensils & Articles', 650.000, 0.000, 650.000, 80.00, 2.50, 12.00, 'Counter 2 (Pooja Section)'),
('SLV-1003', 'Silver Coin 100g (Ganesh Lakshmi 999)', 'Silver Coins & Bars', 100.000, 0.000, 100.000, 99.90, 0.00, 0.00, 'Counter 3 (Bullion Vault)'),
('SLV-1004', 'Designer Silver Chotti / Hair Chain', 'Silver Ornaments', 75.200, 3.200, 72.000, 92.50, 5.00, 22.00, 'Counter 1 (Payal Section)')
ON CONFLICT (tag_number) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 3. Silver Customer Directory (Dual Metal & Cash Ledger)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(50),
    city VARCHAR(100),
    gstin VARCHAR(50),
    cash_balance NUMERIC(12,2) DEFAULT 0.00, -- Dr (-) / Cr (+)
    metal_balance_grams NUMERIC(10,3) DEFAULT 0.000, -- Dr (-) / Cr (+)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all silver_customers" ON public.silver_customers FOR ALL USING (true);

INSERT INTO public.silver_customers (name, mobile, city, cash_balance, metal_balance_grams) VALUES
('Rajesh Kumar', '+91 98765 43210', 'Madurai', -16550.00, 0.000),
('Pooja Sharma', '+91 98123 45678', 'Chennai', 0.00, 45.250),
('Murugan Jewellers', '+91 94431 11223', 'Salem', -125000.00, -120.000)
ON CONFLICT DO NOTHING;

-- ------------------------------------------------------------------------------
-- 4. Silver Retail Invoices Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Allow all silver_invoices" ON public.silver_invoices FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 5. Silver Invoice Line Items
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Allow all silver_invoice_items" ON public.silver_invoice_items FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 6. Old Silver Scrap Exchange Buyback Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_old_exchange (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE POLICY "Allow all silver_old_exchange" ON public.silver_old_exchange FOR ALL USING (true);

-- ------------------------------------------------------------------------------
-- 7. Customer Voucher Receipts (Cash & Metal Balance Settlement)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.silver_customer_vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    voucher_no VARCHAR(100) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.silver_customers(id) ON DELETE CASCADE,
    receipt_type VARCHAR(50) NOT NULL, -- 'Cash', 'Metal'
    cash_amount NUMERIC(12,2) DEFAULT 0.00,
    fine_metal_grams NUMERIC(10,3) DEFAULT 0.000,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.silver_customer_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all silver_customer_vouchers" ON public.silver_customer_vouchers FOR ALL USING (true);

-- Indexes for lightning performance
CREATE INDEX IF NOT EXISTS idx_silver_stock_tag ON public.silver_stock(tag_number);
CREATE INDEX IF NOT EXISTS idx_silver_invoices_no ON public.silver_invoices(invoice_no);
CREATE INDEX IF NOT EXISTS idx_silver_customers_mobile ON public.silver_customers(mobile);
