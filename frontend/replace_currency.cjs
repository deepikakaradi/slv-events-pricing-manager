const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = content
    .replace(/\$\$\{/g, '₹${') // Replaces $${var} with ₹${var}
    .replace(/'\$'/g, "'₹'")     // Replaces '$' with '₹'
    .replace(/"\$"/g, '"₹"')     // Replaces "$" with "₹"
    .replace(/\(\$\)/g, '(₹)')   // Replaces ($) with (₹)
    .replace(/>\s*\$\s*</g, '>₹<') // Replaces >$< with >₹<
    .replace(/>\$\s*/g, '>₹')    // Replaces >$ with >₹
    .replace(/\$([0-9]+)/g, '₹$1'); // Replaces $100 with ₹100
  
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
console.log('Currency symbols replaced.');
