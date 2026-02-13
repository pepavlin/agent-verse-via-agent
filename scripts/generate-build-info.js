const fs = require('fs');
const path = require('path');

const buildInfo = {
  deployDate: new Date().toISOString(),
};

const outputPath = path.join(__dirname, '..', 'public', 'build-info.json');
fs.writeFileSync(outputPath, JSON.stringify(buildInfo, null, 2));

console.log('Build info generated:', buildInfo);
