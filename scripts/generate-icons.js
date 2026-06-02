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
  let hasImageMagick = false;
  try {
    execSync('which convert', { stdio: 'ignore' });
    hasImageMagick = true;
  } catch (e) {
    hasImageMagick = false;
  }
  
  if (hasImageMagick) {
    try {
      // Generate .ico for Windows
      console.log('  📦 Generating Windows icon (.ico)...');
      execSync(`convert "${sourceIcon}" -define icon:auto-resize=256,128,96,64,48,32,16 "${path.join(iconDir, 'icon.ico')}"`, { stdio: 'inherit' });
    } catch (e) {
      console.log('  ⚠️  Windows .ico generation failed, skipping...');
    }
    
    try {
      // Generate .icns for macOS
      console.log('  📦 Generating macOS icon (.icns)...');
      execSync(`convert "${sourceIcon}" -define icon:auto-resize=512,256,128,64,32,16 "${path.join(iconDir, 'icon.icns')}"`, { stdio: 'inherit' });
    } catch (e) {
      console.log('  ⚠️  macOS .icns generation failed, skipping...');
    }
  } else {
    console.log('  ℹ️  ImageMagick not found, using fallback...');
  }
  
  // Always copy PNG for Linux
  fs.copyFileSync(sourceIcon, path.join(iconDir, 'icon.png'));
  console.log('  📦 PNG icon copied for Linux');
  
  console.log('✅ Icon generation complete!');
  console.log(`   Icons saved to: ${iconDir}`);
  
} catch (error) {
  console.error('❌ Icon generation failed:', error.message);
  process.exit(1);
}
