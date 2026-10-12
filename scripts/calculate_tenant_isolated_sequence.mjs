import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('backups/latest_db_backup.json', 'utf8'));
const invoices = backup.tables['invoices'].rows || [];
const jobs = backup.tables['soldering_engraving_jobs'].rows || [];

const MSGOLD_ORG_ID = '00000000-0000-0000-0000-000000000000';
const DK_ORG_ID = '004ae35b-5197-4ae2-ab27-b62cd8069a7f';

// 1. Process DK organization
const dkInvoices = invoices.filter(i => i.org_id === DK_ORG_ID);
const dkJobs = jobs.filter(j => j.org_id === DK_ORG_ID);

console.log(`DK org: ${dkInvoices.length} invoices, ${dkJobs.length} soldering jobs.`);

// 2. Process MS Gold organization
const msInvoices = invoices.filter(i => i.org_id === MSGOLD_ORG_ID);
const msJobs = jobs.filter(j => j.org_id === MSGOLD_ORG_ID);

console.log(`MS Gold org: ${msInvoices.length} invoices, ${msJobs.length} soldering jobs.`);

// Sort MS Gold jobs chronologically
msJobs.sort((a, b) => {
  const ta = new Date(a.created_at || a.date).getTime() || 0;
  const tb = new Date(b.created_at || b.date).getTime() || 0;
  return ta - tb;
});

// Build MS Gold combined timeline
const msTimeline = [];
msInvoices.forEach(inv => {
  const t = new Date(inv.created_at || inv.date).getTime() || 0;
  msTimeline.push({
    id: inv.id,
    type: 'invoice',
    time: t,
    date: inv.date,
    name: inv.customer_name,
    fixedNo: inv.invoice_no // e.g. INV-1023, INV-1024
  });
});

msJobs.forEach(job => {
  const t = new Date(job.created_at || job.date).getTime() || 0;
  msTimeline.push({
    id: job.id,
    type: 'soldering',
    time: t,
    date: job.date,
    name: job.customer_name
  });
});

msTimeline.sort((a, b) => a.time - b.time);

const msAssignments = [];
let currentSeq = 1001;
const usedNos = new Set();

// Reserve fixed invoices first (INV-1023, INV-1024)
msTimeline.forEach(item => {
  if (item.type === 'invoice' && item.fixedNo) {
    usedNos.add(item.fixedNo);
  }
});

msTimeline.forEach(item => {
  if (item.type === 'invoice') {
    msAssignments.push({
      ...item,
      assignedNo: item.fixedNo
    });
  } else {
    while (usedNos.has(`INV-${currentSeq}`)) {
      currentSeq++;
    }
    const assignedNo = `INV-${currentSeq}`;
    usedNos.add(assignedNo);
    currentSeq++;
    msAssignments.push({
      ...item,
      assignedNo
    });
  }
});

console.log('\n--- MS Gold First 5 Items ---');
console.log(msAssignments.slice(0, 5).map(a => `${a.assignedNo} | ${a.date} | ${a.type} | ${a.name}`));

console.log('\n--- MS Gold Items around Aug 15 (20 - 26) ---');
console.log(msAssignments.slice(20, 26).map(a => `${a.assignedNo} | ${a.date} | ${a.type} | ${a.name}`));

console.log('\n--- MS Gold First 3 September Items ---');
const sepItems = msAssignments.filter(a => a.date >= '2026-09-01');
console.log(sepItems.slice(0, 3).map(a => `${a.assignedNo} | ${a.date} | ${a.type} | ${a.name}`));

console.log('\n--- MS Gold Last 3 Items ---');
console.log(msAssignments.slice(-3).map(a => `${a.assignedNo} | ${a.date} | ${a.type} | ${a.name}`));

const msJobUpdates = msAssignments.filter(a => a.type === 'soldering');
const msValuesClause = msJobUpdates.map(u => `('${u.id}'::uuid, '${u.assignedNo}')`).join(',\n');

// Also update DK org jobs
const dkJobUpdates = [
  { id: 'f7f50d30-0c0b-4e94-982f-804d315c1e89', no: 'INV-1002' },
  { id: '4bbc58d7-467c-4f0b-94d9-2d8bd1a26afe', no: 'INV-1003' },
  { id: '53305814-40aa-4b62-8422-97542eb0098b', no: 'INV-1004' },
  { id: 'ba2ced01-02c1-4211-ac94-b8c9a53300b1', no: 'INV-1005' }
];
const dkValuesClause = dkJobUpdates.map(u => `('${u.id}'::uuid, '${u.no}')`).join(',\n');

const sql = `
-- Update MS Gold soldering jobs with completely isolated sequence starting from INV-1001 (rajameera gold)
UPDATE soldering_engraving_jobs AS s
SET 
  invoice_number = v.inv_no,
  invoice_no = v.inv_no
FROM (VALUES
${msValuesClause}
) AS v(id, inv_no)
WHERE s.id = v.id;

-- Update DK tenant soldering jobs
UPDATE soldering_engraving_jobs AS s
SET 
  invoice_number = v.inv_no,
  invoice_no = v.inv_no
FROM (VALUES
${dkValuesClause}
) AS v(id, inv_no)
WHERE s.id = v.id;

-- Set next invoice number for MS Gold
UPDATE organizations
SET next_invoice_number = 'INV-${currentSeq}'
WHERE id = '${MSGOLD_ORG_ID}';

-- Set next invoice number for DK
UPDATE organizations
SET next_invoice_number = 'INV-1006'
WHERE id = '${DK_ORG_ID}';
`;

fs.writeFileSync('scripts/tenant_isolated_backfill.sql', sql, 'utf-8');
console.log(`\nGenerated scripts/tenant_isolated_backfill.sql. Next MS Gold seq: INV-${currentSeq}`);
