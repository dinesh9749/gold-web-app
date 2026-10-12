import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://xwcbibsuxxuwiryvkrnu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3Y2JpYnN1eHh1d2lyeXZrcm51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODcxNTksImV4cCI6MjA5NzI2MzE1OX0.XOU0GSl_HkD3W66yHN6Kxe3re4ZYhCR41WxzQYuXgGY';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const tables = [
  'attendance',
  'cities',
  'customers',
  'employees',
  'gold_collections',
  'gold_schemes',
  'invoice_items',
  'invoices',
  'metal_rates',
  'order_products',
  'organizations',
  'receipt_items',
  'receipt_payments',
  'receipts',
  'roles',
  'sales_orders',
  'silver_customer_vouchers',
  'silver_customers',
  'silver_invoice_items',
  'silver_invoices',
  'silver_old_exchange',
  'silver_rates',
  'silver_stock',
  'soldering_engraving_jobs',
  'states',
  'stock_transactions'
];

async function runBackup() {
  console.log('🚀 Starting complete database backup...');
  const backupData = {
    metadata: {
      timestamp: new Date().toISOString(),
      organization: 'DK Nova Technologies',
      projectUrl: SUPABASE_URL,
      tableCount: tables.length
    },
    tables: {}
  };

  const backupDir = path.resolve('backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        console.warn(`⚠️ Warning fetching ${table}:`, error.message);
        backupData.tables[table] = { error: error.message, count: 0, rows: [] };
      } else {
        backupData.tables[table] = { count: data.length, rows: data };
        console.log(`✅ Backed up ${table}: ${data.length} records`);
      }
    } catch (err) {
      console.error(`❌ Failed table ${table}:`, err.message);
      backupData.tables[table] = { error: err.message, count: 0, rows: [] };
    }
  }

  const filename = `db_backup_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  const filePath = path.join(backupDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

  // Also write to a stable latest backup file
  const latestPath = path.join(backupDir, 'latest_db_backup.json');
  fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf-8');

  console.log(`\n🎉 Backup successfully created at: ${filePath}`);
  console.log(`Latest backup copy at: ${latestPath}`);
}

runBackup().catch(err => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
