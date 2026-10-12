import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('backups/latest_db_backup.json', 'utf8'));
const invoices = backup.tables['invoices'].rows || [];
const jobs = backup.tables['soldering_engraving_jobs'].rows || [];

const usedNos = new Set();
// Reserve existing invoice numbers
invoices.forEach(inv => {
  if (inv.invoice_no) {
    usedNos.add(inv.invoice_no);
  }
});

// Sort jobs chronologically
jobs.sort((a, b) => {
  const ta = new Date(a.created_at || a.date).getTime() || 0;
  const tb = new Date(b.created_at || b.date).getTime() || 0;
  return ta - tb;
});

let currentSeq = 1001;
const updates = [];

jobs.forEach(job => {
  while (usedNos.has(`INV-${currentSeq}`)) {
    currentSeq++;
  }
  const assignedNo = `INV-${currentSeq}`;
  usedNos.add(assignedNo);
  currentSeq++;

  updates.push({
    id: job.id,
    invNo: assignedNo
  });
});

console.log(`Generated ${updates.length} updates.`);
console.log(`Highest assigned: INV-${currentSeq - 1}`);
console.log(`Next sequence: INV-${currentSeq}`);

// Generate SQL VALUES statement
const valuesClause = updates.map(u => `('${u.id}'::uuid, '${u.invNo}')`).join(',\n');

const sql = `
UPDATE soldering_engraving_jobs AS s
SET 
  invoice_number = v.inv_no,
  invoice_no = v.inv_no
FROM (VALUES
${valuesClause}
) AS v(id, inv_no)
WHERE s.id = v.id;

UPDATE organizations
SET next_invoice_number = 'INV-${currentSeq}'
WHERE login_slug = 'msgold' OR id = '00000000-0000-0000-0000-000000000000';
`;

fs.writeFileSync('scripts/backfill_migration.sql', sql, 'utf-8');
console.log('✅ Generated scripts/backfill_migration.sql successfully!');
