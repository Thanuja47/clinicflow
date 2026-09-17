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
      const isClientComponent = content.includes("'use client';") || content.includes('"use client";');

      if (isClientComponent) {
        // Remove export const dynamic from client components
        if (content.includes("export const dynamic = 'force-dynamic';")) {
          content = content.replace(/export const dynamic = 'force-dynamic';\n*/g, '');
          fs.writeFileSync(full, content, 'utf8');
          console.log('Removed dynamic export from Client Component:', full);
        }
      } else {
        // Server component or Route handler -> Ensure export const dynamic = 'force-dynamic'; is present
        if (!content.includes("export const dynamic = 'force-dynamic';")) {
          content = "export const dynamic = 'force-dynamic';\n\n" + content;
          fs.writeFileSync(full, content, 'utf8');
          console.log('Added dynamic export to Server Component / Route Handler:', full);
        }
      }
    }
  }
}

processDir('src/app');
console.log('Finished updating client and server export rules.');
