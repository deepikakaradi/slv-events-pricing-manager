const fs = require('fs');
const path = require('path');

const files = ['PackageManager.jsx', 'Dashboard.jsx'];

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Add formatCurrency import
  if (!content.includes("import { formatCurrency }")) {
    content = content.replace(
      "import { useApp } from '../context/AppContext';",
      "import { useApp } from '../context/AppContext';\nimport { formatCurrency } from '../utils/formatters';"
    );
  }

  // Replace toLocaleString calls
  content = content.replace(/₹\$\{([^.}]+)\.base_price\.toLocaleString\(\)\}/g, '${formatCurrency($1.base_price)}');
  content = content.replace(/₹\$\{([^.}]+)\.standard_price\.toLocaleString\(\)\}/g, '${formatCurrency($1.standard_price)}');
  content = content.replace(/₹\$\{([^.}]+)\.final_price\.toLocaleString\(\)\}/g, '${formatCurrency($1.final_price)}');
  content = content.replace(/₹\$\{calc\.value\.toLocaleString\(\)\}/g, '${formatCurrency(calc.value)}');

  // Fix UI enhancements
  content = content.replace(/className="glass-card/g, 'className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(file + ' updated successfully.');
}
