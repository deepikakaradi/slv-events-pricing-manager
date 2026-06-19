const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Import formatCurrency if not present and we need to use it
      if (content.match(/\.toLocaleString\(/) && !content.includes('formatCurrency')) {
        content = content.replace(
          "import { useApp } from '../context/AppContext';",
          "import { useApp } from '../context/AppContext';\nimport { formatCurrency } from '../utils/formatters';"
        );
        changed = true;
      }

      // Replace `.toLocaleString(undefined, { minimumFractionDigits: 2 })` or similar
      if (content.match(/\.toLocaleString\([^)]*\)/)) {
        content = content.replace(/\$\{([^.}]+)\.toLocaleString\([^)]*\)\}/g, '${formatCurrency($1)}');
        content = content.replace(/\$\{([^.}]+\.[^.}]+)\.toLocaleString\([^)]*\)\}/g, '${formatCurrency($1)}');
        content = content.replace(/\$\{([^}]+)\.toLocaleString\([^)]*\)\}/g, '${formatCurrency($1)}');
        changed = true;
      }

      // Special string replace for $ inside JSX
      if (content.includes('$')) {
        content = content.replace(/\$/g, '₹');
        content = content.replace(/₹\{/g, '${'); // revert template literals
        changed = true;
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Cleaned up ${file}`);
      }
    }
  }
}

processDir(path.join(__dirname, 'src'));
console.log('Global cleanup completed.');
