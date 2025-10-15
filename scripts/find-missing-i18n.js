const fs = require('fs');
const path = require('path');

function walk(dir){
  const files = [];
  for(const name of fs.readdirSync(dir)){
    const full = path.join(dir,name);
    const stat = fs.statSync(full);
    if(stat.isDirectory()) files.push(...walk(full));
    else if(/\.(ts|tsx|js|jsx)$/.test(name)) files.push(full);
  }
  return files;
}

const src = path.join(__dirname,'..','src');
const files = walk(src);
const keyRegex = /t\(\s*['\"]([^'\"\)]+?)['\"]\s*[,)\}]/g;
const keys = new Set();
for(const f of files){
  const content = fs.readFileSync(f,'utf8');
  let m;
  while((m = keyRegex.exec(content))){
    if(m[1].startsWith('admin.')) keys.add(m[1]);
  }
}

const en = fs.readFileSync(path.join(__dirname,'..','src','i18n','locales','en.ts'),'utf8');
const zh = fs.readFileSync(path.join(__dirname,'..','src','i18n','locales','zh.ts'),'utf8');

const missing = [];
for(const k of [...keys].sort()){
  const quoted = `'${k}'`;
  if(!en.includes(quoted) || !zh.includes(quoted)){
    missing.push({key:k, inEn: en.includes(quoted), inZh: zh.includes(quoted)});
  }
}

console.log(JSON.stringify(missing, null, 2));
