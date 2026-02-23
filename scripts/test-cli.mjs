import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const cliPath = path.join(rootDir, 'packages/cli/dist/index.js');
const tempDir = path.join(rootDir, 'temp-test-refactor');

console.log('🧪 Starting CLI Refactor Test...');

// Clean up previous runs
if (fs.existsSync(tempDir)) {
  console.log('🧹 Cleaning up old test directory...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}

// Ensure CLI is built
console.log('🔨 Building CLI...');
try {
  execSync('npm run build', { cwd: path.join(rootDir, 'packages/cli'), stdio: 'inherit' });
} catch (error) {
  console.error('❌ CLI Build Failed');
  process.exit(1);
}

// Run CLI help to verify basic structure
console.log(`🚀 Verifying CLI structure...`);

try {
  const output = execSync(`node ${cliPath} --help`).toString();
  if (output.includes('new <project-name>')) {
    console.log('✅ CLI Entry point works');
  } else {
    console.error('❌ CLI Entry point failed');
    console.error(output);
    process.exit(1);
  }
} catch (error) {
  console.error('❌ CLI Execution Failed');
  process.exit(1);
}

// Manual verification needed for prompts/templates
console.log('⚠ Full verification requires manual interactive testing due to prompts.');
console.log(`Run: node packages/cli/dist/index.js new temp-test-refactor`);
