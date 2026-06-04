const { execSync } = require('child_process');

function run(command) {
  console.log('> ' + command);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (err) {
    console.error(`Command failed: ${command}`);
    process.exit(1);
  }
}

// Bump version
run('npm run bump-version');
// Commit and push version bump
run('git add package.json');
run('git commit -m "chore: bump version"');
run('git push');

// Build targets sequentially
const builds = [
  'npm run android:build',
  'npm run electron:build -- --linux',
  'npm run electron:build -- --win',
  'npm run electron:build -- --mac',
];
for (const cmd of builds) {
  run(cmd);
}

console.log('All builds completed successfully.');
