const fs = require('fs');
const path = require('path');

function cleanFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We want to replace `$` with `` EXCEPT inside backticks where `${` is used for template literals.
  // The easiest way:
  // 1. Just look for `$` followed by `{formatCurrency` and remove the `$`.
  if (content.includes('${formatCurrency')) {
    // If it's inside backticks like `` `... ${formatCurrency(x)}` ``, removing the $ breaks the template literal!
    // But in QuoteBuilder/PricingEngine, many are just inside JSX text: `<span>${formatCurrency(x)}</span>`
    // Let's replace `<span>${formatCurrency` with `<span>₹{formatCurrency` ? No, `formatCurrency` already returns ₹ if styled as currency!
    // Wait, if `formatCurrency` uses `style: 'currency', currency: 'INR'`, it ALREADY INCLUDES '₹'.
    // So we don't need `₹` prefix OR `$` prefix.
    // If it's a template literal: `` `Upsell: ${formatCurrency(x)}` `` -> this is correct.
    // If it's JSX text: `<span>${formatCurrency(x)}</span>` -> this prints `$₹12,000`. We should change it to `<span>{formatCurrency(x)}</span>`.
    
    content = content.replace(/>\$\{formatCurrency/g, '>{formatCurrency');
    changed = true;
  }
  
  // What about jsPDF lines?
  // `doc.text(\`Estimated Price: \${formatCurrency(...)}\`)`
  // Here, `\${` is evaluated and formatCurrency returns `₹12,000`. So it's fine.
  // But wait, there might be literal `$` in the text like `Estimated Price: $${formatCurrency(...)}`
  if (content.includes('Price: $${')) {
    content = content.replace(/Price: \$\$\{/g, 'Price: ${');
    changed = true;
  }

  // Find remaining `$` in JSX text nodes
  if (content.match(/>\$[^{]/)) {
    content = content.replace(/>\$(?=[0-9])/g, '>₹');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Cleaned ${path.basename(filePath)}`);
  }
}

['QuoteBuilder.jsx', 'PackageManager.jsx', 'PricingEngine.jsx', 'LandingPage.jsx', 'Dashboard.jsx'].forEach(file => {
  cleanFile(path.join(__dirname, 'src', 'pages', file));
});
