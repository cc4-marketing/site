const fs = require('fs');
const path = require('path');

const updateOrderInDir = (dir) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.mdx')) {
      const filePath = path.join(dir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      
      content = content.replace(/order:\s*(\d+)/, (match, orderStr) => {
        return `order: ${parseInt(orderStr) + 1}`;
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${file}`);
    } else if (fs.statSync(path.join(dir, file)).isDirectory()) {
      updateOrderInDir(path.join(dir, file));
    }
  }
};

updateOrderInDir('./src/content/modules/module-1');
updateOrderInDir('./src/content/modules/module-2');
console.log('Done!');
