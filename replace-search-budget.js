const fs = require('fs');

for (const file of ['app/management/budget/page.tsx', 'app/management/kpi/page.tsx']) {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content.replace(/<input\s+type=\"text\"\s+value=\{searchTerm\}\s+onChange=\{\(event\) => setSearchTerm\(event\.target\.value\)\}\s+placeholder=\"([^\"]+)\"\s+className=\"([^\"]+)\"\s*\/>/g, '<SearchBar\n            value={searchTerm}\n            onChange={setSearchTerm}\n            placeholder=\"$1\"\n            className=\"$2\"\n          />');
  
  if (content !== newContent) {
    if (!newContent.includes('import { SearchBar }')) {
       newContent = newContent.replace('import { apiFetch }', 'import { apiFetch }\nimport { SearchBar } from "@/components/ui/search-bar"');
    }
    fs.writeFileSync(file, newContent);
    console.log('Replaced', file);
  } else {
    console.log('No regex match in', file);
  }
}
