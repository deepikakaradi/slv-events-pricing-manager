const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.match(/\.toLocaleString\(/) && !content.includes('formatCurrency')) {
    content = content.replace(
      "import { useApp } from '../context/AppContext';",
      "import { useApp } from '../context/AppContext';\nimport { formatCurrency } from '../utils/formatters';"
    );
    changed = true;
  }

  // Find all ${...toLocaleString(...)} and replace with {formatCurrency(...)}
  // This regex matches ${ followed by anything up to .toLocaleString( optionally some args ) }
  const regex = /\$\{([^$]+)\.toLocaleString\([^)]*\)\}/g;
  if (regex.test(content)) {
    content = content.replace(regex, '${formatCurrency($1)}');
    changed = true;
  }

  // Also catch `{something.toLocaleString()}`
  const regex2 = /\{([^}]+)\.toLocaleString\([^)]*\)\}/g;
  if (regex2.test(content)) {
    content = content.replace(regex2, '{formatCurrency($1)}');
    changed = true;
  }

  // Remove $
  if (content.includes('$')) {
    // We only want to replace $ if it's acting as a currency symbol. 
    // BUT we must not break template literals `${`
    // A safe way: replace \$ followed by a number or formatCurrency
    // Or just replace all \$ and then restore `₹{` to `${`.
    content = content.replace(/\$/g, '₹');
    content = content.replace(/₹\{/g, '${');
    
    // Some jsPDF commands use $ in template literals, but we've restored `${`.
    changed = true;
  }

  // Also remove `toLocaleString` from Dashboard.jsx or other files if remaining
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${path.basename(filePath)}`);
  }
}

['QuoteBuilder.jsx', 'PackageManager.jsx', 'PricingEngine.jsx', 'LandingPage.jsx', 'Dashboard.jsx'].forEach(file => {
  cleanFile(path.join(__dirname, 'src', 'pages', file));
});
