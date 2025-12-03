const fs = require('fs');
const path = require('path');

// Read root package.json
const rootPkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create dist package.json with adjusted paths
const distPkg = {
  ...rootPkg,
  main: 'index.cjs',
  module: 'index.js',
  types: 'index.d.ts',
  exports: {
    '.': {
      import: './index.js',
      require: './index.cjs',
      types: './index.d.ts'
    },
    './lasereyes': {
      import: './lasereyes.js',
      require: './lasereyes.cjs',
      types: './lasereyes.d.ts'
    }
  }
};

// Remove dev-only fields
delete distPkg.devDependencies;
delete distPkg.scripts;
delete distPkg.files;

// Write dist/package.json
fs.writeFileSync('dist/package.json', JSON.stringify(distPkg, null, 2));

// Copy README.md
fs.copyFileSync('README.md', 'dist/README.md');

console.log('✓ Prepared dist/ for publishing');

