const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      processDir(full);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(full, 'utf8');
      if (!content.includes('export const dynamic =')) {
        content = "export const dynamic = 'force-dynamic';\n\n" + content;
        fs.writeFileSync(full, content, 'utf8');
        console.log('Updated:', full);
      }
    }
  }
}

processDir('src/app/(dashboard)');
console.log('Finished updating dashboard pages and layout.');
