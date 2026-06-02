#!/usr/bin/env node

/**
 * Icon Generation Script
 * Converts logo.png to required formats for Electron Builder
 * Requires: imagemagick (convert command) or use npm package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const iconDir = path.join(__dirname, '..', 'src', 'electron', '.icon-ico');
const sourceIcon = path.join(__dirname, '..', 'bbe8df3b-a24d-4ec9-bf1b-21076a554fd7.png');

// Create icon directory if it doesn't exist
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Check if source icon exists
if (!fs.existsSync(sourceIcon)) {
  console.error(`❌ Source icon not found: ${sourceIcon}`);
  process.exit(1);
}

console.log('🎨 Generating icons for all platforms...');

try {
  // Try using imagemagick if available
  try {
    execSync('which convert', { stdio: 'ignore' });
    
    // Generate .ico for Windows
    console.log('  📦 Generating Windows icon (.ico)...');
    execSync(`convert "${sourceIcon}" -define icon:auto-resize=256,128,96,64,48,32,16 "${path.join(iconDir, 'icon.ico')}"`, { stdio: 'inherit' });
    
    // Generate .icns for macOS
    console.log('  📦 Generating macOS icon (.icns)...');
    execSync(`convert "${sourceIcon}" -define icon:auto-resize=512,256,128,64,32,16 "${path.join(iconDir, 'icon.icns')}"`, { stdio: 'inherit' });
    
  } catch (e) {
    // If imagemagick not available, try using jimp
    console.log('  ℹ️  ImageMagick not found, using npm packages...');
    
    // For now, copy the PNG as a placeholder
    fs.copyFileSync(sourceIcon, path.join(iconDir, 'icon.png'));
    console.log('  ⚠️  Copied PNG as placeholder. For production, install ImageMagick:');
    console.log('      macOS: brew install imagemagick');
    console.log('      Linux: sudo apt-get install imagemagick');
    console.log('      Windows: choco install imagemagick');
  }
  
  // Always copy PNG for Linux
  fs.copyFileSync(sourceIcon, path.join(iconDir, 'icon.png'));
  
  console.log('✅ Icon generation complete!');
  console.log(`   Icons saved to: ${iconDir}`);
  
} catch (error) {
  console.error('❌ Icon generation failed:', error.message);
  process.exit(1);
}
