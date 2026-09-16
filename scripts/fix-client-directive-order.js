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

      // Remove any misplaced export const dynamic
      content = content.replace(/export const dynamic = 'force-dynamic';\n\n/g, '');
      content = content.replace(/export const dynamic = 'force-dynamic';\n/g, '');

      if (content.startsWith("'use client';") || content.startsWith('"use client";')) {
        // Place 'use client'; first, then export const dynamic = 'force-dynamic';
        content = content.replace(/^['"]use client['"];?\n*/, "'use client';\nexport const dynamic = 'force-dynamic';\n\n");
      } else {
        // Server component
        content = "export const dynamic = 'force-dynamic';\n\n" + content;
      }

      fs.writeFileSync(full, content, 'utf8');
      console.log('Fixed:', full);
    }
  }
}

processDir('src/app/(dashboard)');
console.log('Finished fixing directive order for dashboard files.');
