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
  let content = fs.readFileSync(file, 'utf-8');
  
  // Relaxed regex to match "(event)" or "(e)" and capture the setter function
  const regex = /<div\s+className=\"relative([^>]*)\">[\s\S]*?<Search[^>]*>[\s\S]*?<input[^>]*value=\{([^}]+)\}[^>]*onChange=\{\s*\((?:e|event)\)\s*=>\s*([^\(]+)\((?:e|event)\.target\.value\)\s*\}[^>]*placeholder=\"([^\"]+)\"[^>]*\/>[\s\S]*?<\/div>/g;
  
  let didReplace = false;
  let newContent = content.replace(regex, (full, divClass, valueVar, onChangeVar, placeholder) => {
    didReplace = true;
    return `<SearchBar
            value={${valueVar}}
            onChange={${onChangeVar}}
            placeholder="${placeholder}"
            className="relative${divClass}"
          />`;
  });

  if (didReplace) {
    if (!newContent.includes('import { SearchBar }')) {
      newContent = "import { SearchBar } from \"@/components/ui/search-bar\";\n" + newContent;
    }
    fs.writeFileSync(file, newContent, 'utf-8');
    console.log('Replaced in', file);
    count++;
  }
}

console.log('Total files replaced:', count);
