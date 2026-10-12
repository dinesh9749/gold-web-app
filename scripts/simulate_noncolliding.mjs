import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('backups/latest_db_backup.json', 'utf8'));
const invoices = backup.tables['invoices'].rows || [];
const jobs = backup.tables['soldering_engraving_jobs'].rows || [];

// Collect all existing non-null, immutable invoice numbers already present in the invoices table
const fixedInvoiceNumbers = new Map();
invoices.forEach(inv => {
  if (inv.invoice_no) {
    fixedInvoiceNumbers.set(String(inv.id), inv.invoice_no);
  }
});

const usedNos = new Set();
// Reserve the existing retail invoice numbers first so nothing collides with them
for (const no of fixedInvoiceNumbers.values()) {
  usedNos.add(no);
}

// Now sort all soldering jobs chronologically
jobs.sort((a, b) => {
  const ta = new Date(a.created_at || a.date).getTime() || 0;
  const tb = new Date(b.created_at || b.date).getTime() || 0;
  return ta - tb;
});

let currentSeq = 1001;
const jobAssignments = [];

jobs.forEach(job => {
  // Find next available sequence number that does NOT collide with existing retail invoices
  while (usedNos.has(`INV-${currentSeq}`)) {
    currentSeq++;
  }
  const assignedNo = `INV-${currentSeq}`;
  usedNos.add(assignedNo);
  currentSeq++;

  jobAssignments.push({
    id: job.id,
    date: job.date,
    created_at: job.created_at,
    customer_name: job.customer_name,
    assignedNo
  });
});

console.log('Total jobs:', jobAssignments.length);
console.log('First 3 jobs:');
console.log(jobAssignments.slice(0, 3));
console.log('Jobs around 1022 - 1026:');
console.log(jobAssignments.filter(j => ['INV-1022', 'INV-1025', 'INV-1026'].includes(j.assignedNo)));
console.log('First September job:');
console.log(jobAssignments.filter(j => j.date >= '2026-09-01')[0]);
console.log('Last 3 jobs:');
console.log(jobAssignments.slice(-3));
console.log('Highest number reached:', `INV-${currentSeq - 1}`);
console.log('Next number should be:', `INV-${currentSeq}`);
