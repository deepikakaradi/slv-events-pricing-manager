const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'LandingPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import { formatCurrency }")) {
  content = content.replace(
    "import { useApp } from '../context/AppContext';",
    "import { useApp } from '../context/AppContext';\nimport { formatCurrency } from '../utils/formatters';"
  );
}

// Fix Base Package Cost
content = content.replace(
  /<span>\$\{calcBase\.toLocaleString\(\)\}<\/span>/g,
  "<span>{formatCurrency(calcBase)}</span>"
);

// Fix Estimated Catering
content = content.replace(
  /<span>\$\{\(calcGuests \* \(calcEvent === 'wedding' \? 45 : 25\)\)\.toLocaleString\(\)\}<\/span>/g,
  "<span>{formatCurrency(calcGuests * (calcEvent === 'wedding' ? 45 : 25))}</span>"
);

// Fix Luxury GST Tax (18%)
content = content.replace(
  /<span>\s*\$\{Math\.round\(\(\(calcBase \* \(calcGuests < 75 \? 0\.8 : calcGuests <= 150 \? 1\.0 : calcGuests <= 300 \? 1\.4 : 2\.0\)\) \+ \(calcGuests \* \(calcEvent === 'wedding' \? 45 : 25\)\)\) \* 0\.18\)\.toLocaleString\(\)\}\s*<\/span>/g,
  "<span>{formatCurrency(Math.round(((calcBase * (calcGuests < 75 ? 0.8 : calcGuests <= 150 ? 1.0 : calcGuests <= 300 ? 1.4 : 2.0)) + (calcGuests * (calcEvent === 'wedding' ? 45 : 25))) * 0.18))}</span>"
);

// Fix Total Price
content = content.replace(
  /<span className="text-3xl font-extrabold gold-text">\$\{getEstimate\(\)\.toLocaleString\(\)\}<\/span>/g,
  '<span className="text-3xl font-extrabold gold-text">{formatCurrency(getEstimate())}</span>'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed LandingPage.jsx');
