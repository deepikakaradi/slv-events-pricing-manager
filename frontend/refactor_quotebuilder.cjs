const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'QuoteBuilder.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Add formatCurrency import
if (!content.includes("import { formatCurrency }")) {
  content = content.replace(
    "import { useApp } from '../context/AppContext';",
    "import { useApp } from '../context/AppContext';\nimport { formatCurrency } from '../utils/formatters';"
  );
}

// Replace toLocaleString calls with formatCurrency
content = content.replace(/₹\$\{p\.base_price\.toLocaleString\(\)\}/g, '${formatCurrency(p.base_price)}');
content = content.replace(/₹\$\{svc\.standard_price\.toLocaleString\(\)\}/g, '${formatCurrency(svc.standard_price)}');
content = content.replace(/₹\$\{item\.total\.toLocaleString\(\)\}/g, '${formatCurrency(item.total)}');
content = content.replace(/₹\$\{calcResult\.subtotal\.toLocaleString\([^)]*\)\}/g, '${formatCurrency(calcResult.subtotal)}');
content = content.replace(/\-\\\$?\$\{calcResult\.discount\.toLocaleString\([^)]*\)\}/g, '-${formatCurrency(calcResult.discount)}');
content = content.replace(/₹\$\{calcResult\.tax\.toLocaleString\([^)]*\)\}/g, '${formatCurrency(calcResult.tax)}');
content = content.replace(/₹\$\{calcResult\.final_price\.toLocaleString\([^)]*\)\}/g, '${formatCurrency(calcResult.final_price)}');
content = content.replace(/\$\$\{calcResult\.ai_recommendations\.upsell\.estimated_price\.toLocaleString\(\)\}/g, '${formatCurrency(calcResult.ai_recommendations.upsell.estimated_price)}');

// Fix jsPDF export (use formatCurrency then replace ₹ with INR for jsPDF compatibility)
content = content.replace(
  /\`Rs\. \$\{item\.custom_price\.toLocaleString\(\)\}\`/g,
  "formatCurrency(item.custom_price).replace('₹', 'Rs. ')"
);
content = content.replace(
  /\`Rs\. \$\{item\.total\.toLocaleString\(\)\}\`/g,
  "formatCurrency(item.total).replace('₹', 'Rs. ')"
);
content = content.replace(
  /\`Rs\. \$\{calcResult\.subtotal\.toLocaleString\([^)]*\)\}\`/g,
  "formatCurrency(calcResult.subtotal).replace('₹', 'Rs. ')"
);
content = content.replace(
  /\`\-Rs\. \$\{calcResult\.discount\.toLocaleString\([^)]*\)\}\`/g,
  "'-' + formatCurrency(calcResult.discount).replace('₹', 'Rs. ')"
);
content = content.replace(
  /\`Rs\. \$\{calcResult\.tax\.toLocaleString\([^)]*\)\}\`/g,
  "formatCurrency(calcResult.tax).replace('₹', 'Rs. ')"
);
content = content.replace(
  /\`Rs\. \$\{calcResult\.final_price\.toLocaleString\([^)]*\)\}\`/g,
  "formatCurrency(calcResult.final_price).replace('₹', 'Rs. ')"
);
content = content.replace(
  /Rs\. \$\{calcResult\.ai_recommendations\.upsell\.estimated_price\.toLocaleString\(\)\}/g,
  "${formatCurrency(calcResult.ai_recommendations.upsell.estimated_price).replace('₹', 'Rs. ')}"
);

// Fix UI enhancements (Glassmorphism)
content = content.replace(/className="glass-card/g, 'className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-2xl');

fs.writeFileSync(filePath, content, 'utf8');
console.log('QuoteBuilder.jsx updated successfully.');
