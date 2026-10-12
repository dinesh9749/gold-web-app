import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('backups/latest_db_backup.json', 'utf8'));

const orgs = [
  {
    "id": "4ef990e8-8f0d-4e95-8d6b-dbae6084ce7c",
    "name": "sankar",
    "login_slug": "sankar",
    "is_active": true,
    "created_at": "2026-07-22 10:36:52.336895+00",
    "next_invoice_number": "INV-1001",
    "next_receipt_number": "REC-1001",
    "is_superadmin": false
  },
  {
    "id": "004ae35b-5197-4ae2-ab27-b62cd8069a7f",
    "name": "dk",
    "login_slug": "dk",
    "is_active": true,
    "created_at": "2026-07-10 08:50:54.343465+00",
    "next_invoice_number": "INV-1007",
    "next_receipt_number": "REC-1001",
    "is_superadmin": false
  },
  {
    "id": "a6e16d14-7c3c-4921-bebf-ba4bc2e91fd6",
    "name": "demo",
    "login_slug": "demo",
    "is_active": true,
    "created_at": "2026-08-26 04:32:50.091222+00",
    "next_invoice_number": "INV-1001",
    "next_receipt_number": "REC-1001",
    "is_superadmin": false
  },
  {
    "id": "00000000-0000-0000-0000-000000000001",
    "name": "DK Nova Technologies Admin",
    "login_slug": "superadmin",
    "is_active": true,
    "created_at": "2026-10-04 10:31:57.595463+00",
    "next_invoice_number": "INV-1001",
    "next_receipt_number": "REC-1001",
    "is_superadmin": true
  },
  {
    "id": "00000000-0000-0000-0000-000000000000",
    "name": "DK Nova Technologies",
    "login_slug": "msgold",
    "is_active": true,
    "created_at": "2026-07-06 13:09:06.127947+00",
    "next_invoice_number": "INV-1111",
    "next_receipt_number": "REC-1002",
    "is_superadmin": false
  }
];

backup.tables['organizations'] = { count: orgs.length, rows: orgs };
fs.writeFileSync('backups/latest_db_backup.json', JSON.stringify(backup, null, 2), 'utf-8');
console.log('✅ Successfully updated latest_db_backup.json with organizations data!');
