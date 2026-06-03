#!/usr/bin/env node

/**
 * Icon Generation Script
 * Converts logo.png to required formats for Electron Builder
 * Requires: imagemagick (convert command) or use npm package
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const isWin = process.platform === 'win32';
    const imCmd = isWin ? 'magick' : 'convert';

    try {
      // Generate .ico (Windows) or .ico for other platforms using appropriate command
      console.log('  📦 Generating Windows icon (.ico)...');
      execSync(`${imCmd} "${sourceIcon}" -resize 256x256 "${path.join(iconDir, 'icon.ico')}"`, { stdio: 'inherit' });
    } catch (e) {
      console.log('  ⚠️  Windows .ico generation failed, skipping...');
    }

    try {
      // Generate .icns (macOS) using appropriate command
      console.log('  📦 Generating macOS icon (.icns)...');
      execSync(`${imCmd} "${sourceIcon}" -resize 512x512 "${path.join(iconDir, 'icon.icns')}"`, { stdio: 'inherit' });
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
