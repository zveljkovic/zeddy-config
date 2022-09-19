const fs = require('fs');
const path = require('path');
fs.writeFileSync(path.join('dist', 'cjs', 'package.json'), `{"type": "commonjs"}`);
fs.writeFileSync(path.join('dist', 'esm', 'package.json'), `{"type": "module"}`);
