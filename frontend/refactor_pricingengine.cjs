const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'PricingEngine.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add formatCurrency import
if (!content.includes("import { formatCurrency }")) {
  content = content.replace(
    "import { useApp } from '../context/AppContext';",
    "import { useApp } from '../context/AppContext';\nimport { formatCurrency } from '../utils/formatters';"
  );
}

// Replace toLocaleString calls
content = content.replace(/₹\$\{pkg\.base_price\.toLocaleString\(\)\}/g, '${formatCurrency(pkg.base_price)}');
content = content.replace(/₹\$\{rule\.price_multiplier \*\ 100\}/g, 'Multiplier: ${rule.price_multiplier}x');
content = content.replace(/₹\$\{service\.standard_price\.toLocaleString\(\)\}/g, '${formatCurrency(service.standard_price)}');

// Fix glass-card UI
content = content.replace(/className="glass-card/g, 'className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl');

fs.writeFileSync(filePath, content, 'utf8');
console.log('PricingEngine.jsx updated successfully.');
