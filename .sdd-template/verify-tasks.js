#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const SPECS_DIR = path.join(__dirname, '../specs');
if (!fs.existsSync(SPECS_DIR)) process.exit(0);
const featureDirs = fs.readdirSync(SPECS_DIR).filter(file => fs.statSync(path.join(SPECS_DIR, file)).isDirectory());
let validationFailed = false;
featureDirs.forEach(dir => {
    const tasksPath = path.join(SPECS_DIR, dir, 'tasks.md');
    if (fs.existsSync(tasksPath)) {
        const content = fs.readFileSync(tasksPath, 'utf8');
        const incompleteTaskRegex = /^\s*-\s*\[\s*\]\s+(.+)\$/gm;
        let match;
        while ((match = incompleteTaskRegex.exec(content)) !== null) {
            console.error(`\x1b[31m❌ SDD Open Task Found in specs/${dir}/tasks.md: "${match[1].trim()}"\x1b[0m`);
            validationFailed = true;
        }
    }
});
if (validationFailed) { console.error("\n\x1b[41m COMMIT BLOCKED \x1b[0m\n"); process.exit(1); }
else { console.log("✅ SDD Tasks Validated!"); process.exit(0); }
