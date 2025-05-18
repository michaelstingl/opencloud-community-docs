/**
 * Pre-build script to update contributors before Docusaurus build
 */
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔄 Running pre-build tasks...');

// Check if GitHub token is available in the environment
if (!process.env.GITHUB_TOKEN) {
  console.log('⚠️ No GITHUB_TOKEN found. Using placeholder contributor data.');
  console.log('💡 To update contributors, set GITHUB_TOKEN environment variable.');
  process.exit(0); // Exit gracefully, don't fail the build
}

try {
  console.log('🔍 Updating contributor data...');
  
  // Check if the contributors script exists
  const scriptPath = path.resolve(__dirname, 'generate-contributors.mjs');
  
  if (fs.existsSync(scriptPath)) {
    // Run the contributor update script using a safer approach (not vulnerable to shell injection)
    execFileSync('node', [scriptPath], { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    console.log('✅ Contributor data updated successfully!');
  } else {
    console.error(`❌ Script not found: ${scriptPath}`);
  }
} catch (error) {
  console.error('❌ Error updating contributor data:', error.message);
  console.log('⚠️ Build will continue with existing contributor data');
  // Don't exit with error - we want the build to continue even if this fails
}

console.log('✅ Pre-build tasks completed');