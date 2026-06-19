const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'PricingEngine.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard_price formatting
content = content.replace(
  /\$\{svc\.standard_price\.toLocaleString\(undefined,\s*\{\s*minimumFractionDigits:\s*2\s*\}\)\}/g,
  "{formatCurrency(svc.standard_price)}"
);

// Specifically replace any remaining $ signs
content = content.replace(/\$/g, '₹');

// Fix string templates
content = content.replace(/₹\{/g, '${');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed PricingEngine.jsx');
