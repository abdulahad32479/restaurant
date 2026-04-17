const fs = require('fs');

const files = [
  'app/dashboard/payroll/[id]/page.tsx',
  'app/dashboard/staff/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace dark Table import with LightTable
  content = content.replace(/import\s+\{\s*Table\s*\}\s+from\s+'@\/src\/components\/Table';/g, "import { LightTable as Table } from '@/src/components/LightTable';");
  
  // Replace dark text classes
  content = content.replace(/text-white/g, 'text-slate-900');
  content = content.replace(/text-tertiary/g, 'text-slate-500');
  
  // Backgrounds and borders
  content = content.replace(/bg-secondary/g, 'bg-white');
  content = content.replace(/bg-bg-main/g, 'bg-white');
  content = content.replace(/border-base/g, 'border-slate-200');
  
  // Specific wrapper backgrounds 
  content = content.replace(/bg-white border border-slate-200 rounded-\[2rem\]/g, 'bg-white border border-slate-200 rounded-xl');
  content = content.replace(/bg-white border border-slate-200 rounded-2xl/g, 'bg-white border border-slate-200 rounded-xl');
  
  // Shadows & special effects
  content = content.replace(/shadow-glow-primary/g, 'shadow-sm');
  content = content.replace(/shadow-2xl/g, 'shadow-sm');
  
  // Specific button styles (hover and such)
  content = content.replace(/hover:bg-white\/5/g, 'hover:bg-slate-50');
  content = content.replace(/hover:bg-white\/10/g, 'hover:bg-slate-50');
  content = content.replace(/bg-white\/5/g, 'bg-white');
  content = content.replace(/border border-white\/5/g, 'border border-slate-200');

  // Badges usually credit/debit
  content = content.replace(/bg-error\/10 text-error border-error\/20/g, 'bg-rose-100 text-rose-700 border-rose-200');
  content = content.replace(/text-error bg-error\/5 border-error\/10/g, 'text-rose-700 bg-rose-50 border-rose-100');
  content = content.replace(/text-error/g, 'text-rose-600');
  content = content.replace(/bg-error/g, 'bg-rose-600');
  content = content.replace(/border-error/g, 'border-rose-400');
  
  content = content.replace(/bg-success\/10 text-success border-success\/20/g, 'bg-emerald-100 text-emerald-700 border-emerald-200');
  content = content.replace(/text-success bg-success\/5 border-success\/10/g, 'text-emerald-700 bg-emerald-50 border-emerald-100');
  content = content.replace(/text-success/g, 'text-emerald-600');
  content = content.replace(/bg-success/g, 'bg-emerald-600');
  content = content.replace(/border-success/g, 'border-emerald-400');
  
  content = content.replace(/shadow-glow-error/g, 'shadow-sm');
  content = content.replace(/shadow-glow-success/g, 'shadow-sm');

  // Any explicit text colors that were missed
  content = content.replace(/text-\[11px\] font-black text-slate-900 uppercase/g, 'text-sm font-semibold text-slate-800');
  content = content.replace(/font-black/g, 'font-semibold');
  
  // Modals theme addition
  content = content.replace(/<Modal(?![^>]*theme="light")/g, '<Modal theme="light"');

  fs.writeFileSync(file, content, 'utf8');
});
console.log('Conversion script executed');
