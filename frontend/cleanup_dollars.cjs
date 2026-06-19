const fs = require('fs');
const path = require('path');

const files = ['Dashboard.jsx', 'LandingPage.jsx', 'AnalyticsDashboard.jsx'];

for (const file of files) {
  const filePath = path.join(__dirname, 'src', 'pages', file);
  if (!fs.existsSync(filePath)) continue;
  
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace $ signs embedded in strings with ₹
  content = content.replace(/\$\{q\.final_price\.toLocaleString\([^)]*\)\}/g, '${formatCurrency(q.final_price)}');
  content = content.replace(/\$\{metrics\.revenue\.toLocaleString\([^)]*\)\}/g, '${formatCurrency(metrics.revenue)}');

  // Generic dollar signs that might be hardcoded
  content = content.replace(/\$/g, '₹');
  
  // Undo the replace for template literals if any got broken (e.g., ₹{var})
  content = content.replace(/₹\{/g, '${');

  // Fix UI enhancements if applicable
  content = content.replace(/className="glass-card/g, 'className="backdrop-blur-xl bg-white/40 dark:bg-slate-900/40 shadow-xl');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(file + ' currency symbols updated.');
}
