const fs = require('fs');

const files = [
  'app/dashboard/staff/page.tsx',
  'app/dashboard/ledger/page.tsx',
  'app/dashboard/payroll/page.tsx',
  'app/dashboard/attendance/page.tsx',
  'app/dashboard/devices/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace <Modal ...> with <Modal theme="light" ...>
  // We need to match <Modal but avoid adding theme="light" multiple times.
  content = content.replace(/<Modal(?![^>]*theme="light")/g, '<Modal theme="light"');
  
  fs.writeFileSync(file, content, 'utf8');
});
console.log('Modal tags updated');
