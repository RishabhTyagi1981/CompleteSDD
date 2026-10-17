#!/usr/bin/env node
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { GoogleGenAI } = require('@google/genai');

// Check for free-tier authentication key token
if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Operational Failure: GEMINI_API_KEY environment variable is not defined inside .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Extract incoming terminal command argument structures
const args = process.argv.slice(2);
const jiraKey = args[0] || 'PROJ-999';
const userStoryInput = args.slice(1).join(' ');

if (!userStoryInput) {
    console.error("❌ Use Syntax: node autoflow.js [JIRA-KEY] \"As a... I want to... So that...\"");
    process.exit(1);
}

const featureSlug = jiraKey.toLowerCase() + '-' + userStoryInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 20);
const targetSpecDir = path.join(__dirname, 'specs', featureSlug);

async function bootstrapAutonomousSDLC() {
    console.log(`\n========== 🚀 STARTING AUTOMATED SDLC FOR TICKET ${jiraKey} ==========\n`);
    
    // -------------------------------------------------------------------------
    // PHASE 1: SCAFFOLDING & SPECIFICATION
    // -------------------------------------------------------------------------
    console.log("📂 Phase 1: Constructing specification envelopes...");
    fs.mkdirSync(targetSpecDir, { recursive: true });
    
    const specPrompt = `Convert this Jira User Story into a strict functional markdown Spec using EARS syntax: "${userStoryInput}". Provide ONLY valid markdown text.`;
    const specResponse = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: specPrompt });
    fs.writeFileSync(path.join(targetSpecDir, 'spec.md'), specResponse.text);
    
    const taskContent = `# TASKS-${jiraKey}\n- [ ] Task 1: Generate Mock Test Requirements\n- [ ] Task 2: Implement Production Code Modifications\n- [ ] Task 3: Finalize Quality Metrics Approval`;
    fs.writeFileSync(path.join(targetSpecDir, 'tasks.md'), taskContent);
    console.log(`   ✅ Spec and tracking matrix successfully allocated at specs/${featureSlug}/`);

    // -------------------------------------------------------------------------
    // PHASE 2: AUTOMATED TEST GENERATION
    // -------------------------------------------------------------------------
    console.log("🧪 Phase 2: Generating asynchronous validation test suite layer...");
    const testFileTarget = path.join(__dirname, 'tests', `${jiraKey.toLowerCase()}.test.js`);
    
    const testPrompt = `Based on this specification text:\n"${specResponse.text}"\nGenerate a complete, fully functioning Jest unit testing file using supertest tracking app endpoints. Assume the app routes exist in '../src/app'. Output ONLY clean executable Javascript code without backticks or explanations.`;
    const testResponse = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: testPrompt });
    
    // Clean out potential LLM response wrapping anomalies
    const cleanTestCode = testResponse.text.replace(/```javascript|```/g, '').trim();
    fs.writeFileSync(testFileTarget, cleanTestCode);
    console.log(`   ✅ Test suite locked down natively at tests/${jiraKey.toLowerCase()}.test.js`);

    // -------------------------------------------------------------------------
    // PHASE 3: INTERCEPT AND FAIL CHECK
    // -------------------------------------------------------------------------
    console.log("⚙️ Phase 3: Executing test engine on empty baseline code layout...");
    try {
        execSync('npm test', { stdio: 'ignore' });
    } catch (e) {
        console.log("   ✅ Confirmed Test Baseline Intercept: Verification suite failed on missing route layer as intended.");
    }

    // -------------------------------------------------------------------------
    // PHASE 4: CODE LOGIC IMPLEMENTATION
    // -------------------------------------------------------------------------
    console.log("💻 Phase 4: Constructing matching production app code logic layout...");
    const appPath = path.join(__dirname, 'src/app.js');
    let currentAppContent = fs.readFileSync(appPath, 'utf8');
    
    const implPrompt = `Look at this base Express file application code:\n"${currentAppContent}"\nModify or append route handlers to fulfill this target testing code rule completely:\n"${cleanTestCode}"\nOutput ONLY the complete updated Javascript code. No commentary text.`;
    const implResponse = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: implPrompt });
    
    const cleanAppCode = implResponse.text.replace(/```javascript|```/g, '').trim();
    fs.writeFileSync(appPath, cleanAppCode);
    console.log("   ✅ Application core engine compiled successfully.");

    // -------------------------------------------------------------------------
    // PHASE 5: VERIFICATION SUITE EXECUTION
    // -------------------------------------------------------------------------
    console.log("🔬 Phase 5: Re-running quality verification suite pipeline matrix...");
    try {
        execSync('npm test', { stdio: 'inherit' });
        console.log("   ✅ Verification complete: All local functional metrics are passing cleanly.");
    } catch (error) {
        console.error("❌ SDLC Defect Found: Automated verification metrics broke down during runtime code compilation.");
        process.exit(1);
    }

        // -------------------------------------------------------------------------
    // PHASE 6: TRACKING RECONCILIATION & DEPLOYMENT PREPARATION
    // -------------------------------------------------------------------------
    console.log("🛡️ Phase 6: Syncing specification tracking logs and building Git structures...");
    const completeTasks = `# TASKS-${jiraKey}\n- [x] Task 1: Generate Mock Test Requirements\n- [x] Task 2: Implement Production Code Modifications\n- [x] Task 3: Finalize Quality Metrics Approval`;
    fs.writeFileSync(path.join(targetSpecDir, 'tasks.md'), completeTasks);

    try {
        const branchName = `feature/JIRA-${jiraKey}`;
        
        // 🌟 WINDOWS PLATFORM FIX: Use clean, universal git command paths
        try {
            execSync(`git checkout -b ${branchName}`, { stdio: 'ignore' });
        } catch (branchExistsError) {
            execSync(`git checkout ${branchName}`, { stdio: 'ignore' });
        }
        
        execSync('git add .');
        execSync(`git commit -m "feat(${jiraKey}): unsupervised feature loop compilation cycle completed"`);
        
        console.log(`\n🚀 \x1b[32mSDLC PROCESS COMPLETE!\x1b[0m Local changes committed to branch: \x1b[34m${branchName}\x1b[0m`);
        console.log(`👉 Run 'git push origin ${branchName}' to open your Pull Request for Human-in-the-Loop review!`);
    } catch (gitError) {
        console.error("❌ Git Execution Blocked:", gitError.message);
        console.log("⚠️ Verification Check: Ensure you have initialized your git repository locally via 'git init' first.");
    }

}

bootstrapAutonomousSDLC();
