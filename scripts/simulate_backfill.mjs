import fs from 'fs';

const backup = JSON.parse(fs.readFileSync('backups/latest_db_backup.json', 'utf8'));
const invoices = backup.tables['invoices'].rows || [];
const jobs = backup.tables['soldering_engraving_jobs'].rows || [];

const combinedRaw = [];

invoices.forEach(inv => {
  const d = inv.created_at || inv.date || '';
  const t = new Date(d).getTime();
  combinedRaw.push({
    id: inv.id,
    type: 'invoice',
    rawNo: inv.invoice_no,
    time: isNaN(t) ? 0 : t,
    date: inv.date,
    name: inv.customer_name
  });
});

jobs.forEach(job => {
  const d = job.created_at || job.date || '';
  const t = new Date(d).getTime();
  combinedRaw.push({
    id: job.id,
    type: 'soldering',
    rawNo: job.invoice_number || job.invoice_no || null,
    time: isNaN(t) ? 0 : t,
    date: job.date,
    name: job.customer_name
  });
});

combinedRaw.sort((a, b) => (a.time || 0) - (b.time || 0));

const usedInvoiceNos = new Set();
let currentSeqNum = 1001;

const assignments = [];

combinedRaw.forEach(item => {
  let finalNo = item.rawNo != null ? String(item.rawNo).trim() : '';
  if (!finalNo || finalNo.startsWith('#') || finalNo.length > 20 || usedInvoiceNos.has(finalNo)) {
    while (usedInvoiceNos.has(`INV-${currentSeqNum}`)) {
      currentSeqNum++;
    }
    finalNo = `INV-${currentSeqNum}`;
    currentSeqNum++;
  } else {
    const match = finalNo.match(/(\d+)/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n >= currentSeqNum) currentSeqNum = n + 1;
    }
  }
  usedInvoiceNos.add(finalNo);
  assignments.push({
    id: item.id,
    type: item.type,
    finalNo,
    date: item.date,
    time: new Date(item.time).toISOString(),
    name: item.name
  });
});

console.log('Total items processed:', assignments.length);
console.log('First 5 items:');
console.log(assignments.slice(0, 5));
console.log('Items around Aug 15:');
console.log(assignments.filter(a => a.date === '2026-08-15' || a.type === 'invoice'));
console.log('First 5 September items:');
console.log(assignments.filter(a => a.date >= '2026-09-01').slice(0, 5));
console.log('Last 5 items:');
console.log(assignments.slice(-5));
console.log('Next invoice number should be:', `INV-${currentSeqNum}`);
