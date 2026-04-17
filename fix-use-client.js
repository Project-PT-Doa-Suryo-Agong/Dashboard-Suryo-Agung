const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

const files = getFiles('app').filter(f => f.endsWith('.tsx'));
let count = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('import { SearchBar } from "@/components/ui/search-bar";\n"use client";')) {
    content = content.replace(
      'import { SearchBar } from "@/components/ui/search-bar";\n"use client";',
      '"use client";\nimport { SearchBar } from "@/components/ui/search-bar";'
    );
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
    count++;
  } else if (content.includes('import { SearchBar } from "@/components/ui/search-bar";\n\n"use client";')) {
    content = content.replace(
      'import { SearchBar } from "@/components/ui/search-bar";\n\n"use client";',
      '"use client";\nimport { SearchBar } from "@/components/ui/search-bar";\n'
    );
    fs.writeFileSync(file, content);
    console.log('Fixed', file);
    count++;
  } else {
    // Regex for cases where there might be other imports
    const regex = /import { SearchBar } from \"@\/components\/ui\/search-bar\";\r?\n\"use client\";/;
    if (regex.test(content)) {
        content = content.replace(regex, "\"use client\";\nimport { SearchBar } from \"@/components/ui/search-bar\";");
        fs.writeFileSync(file, content);
        console.log('Fixed (regex pattern)', file);
        count++;
    }
  }
}
console.log('Total fixed:', count);
