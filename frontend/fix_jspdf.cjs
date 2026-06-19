const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'QuoteBuilder.jsx');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let insideExportPDF = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const exportPDF = () => {')) {
    insideExportPDF = true;
  }
  
  if (insideExportPDF) {
    // Replace '₹' with 'Rs. ' in jsPDF lines because jsPDF default fonts don't support ₹
    lines[i] = lines[i].replace(/₹/g, 'Rs. ');
  }
  
  if (insideExportPDF && lines[i].includes('doc.save(')) {
    insideExportPDF = false;
  }
}

fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
console.log('Fixed jsPDF currency symbols.');
