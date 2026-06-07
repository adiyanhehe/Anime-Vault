#!/usr/bin/env node

/**
 * Icon Generation Script
 * Converts logo.png to required formats for Electron Builder
 * Requires: ImageMagick (`magick` or `convert` command) installed on the system.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory where the generated icons are stored (used by electron‑builder).
const iconDir = path.join(__dirname, '..', 'src', 'electron', '.icon-ico');
// Source PNG (the original logo). Adjust if your asset lives elsewhere.
const sourceIcon = path.join(__dirname, '..', 'bbe8df3b-a24d-4ec9-bf1b-21076a554fd7.png');

// Ensure the output directory exists.
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Verify source PNG exists.
if (!fs.existsSync(sourceIcon)) {
  console.error(`❌ Source icon not found: ${sourceIcon}`);
  process.exit(1);
}

console.log('🎨 Generating icons for all platforms...');

try {
  // Detect ImageMagick's command (magick for v7+, convert for older versions).
  let imageMagickCmd = null;
  try {
    execSync('magick -version', { stdio: 'ignore' });
    imageMagickCmd = 'magick';
  } catch (_) {
    try {
      execSync('convert -version', { stdio: 'ignore' });
      imageMagickCmd = 'convert';
    } catch (__) {
      // No ImageMagick found
    }
  }

  // On Windows generate .ico, on macOS generate .icns.
  if (imageMagickCmd) {
    if (process.platform === 'win32') {
      console.log('  📦 Generating Windows icon (.ico)...');
      execSync(`${imageMagickCmd} "${sourceIcon}" -define icon:auto-resize="256,128,96,64,48,32,16" "${path.join(iconDir, 'icon.ico')}"`, { stdio: 'inherit' });
    } else if (process.platform === 'darwin') {
      console.log('  📦 Generating macOS icon (.icns)...');
      execSync(`${imageMagickCmd} "${sourceIcon}" -define icon:auto-resize="512,256,128,64,32,16" "${path.join(iconDir, 'icon.icns')}"`, { stdio: 'inherit' });
    } else {
      console.log('  ℹ️  Skipping .ico/.icns generation on this platform (Linux/Android).');
    }
  } else {
    console.log('  ℹ️  ImageMagick not available – only PNG will be copied.');
  }

  // Always copy PNG – Linux/Android rely on this.
  // Remove any stale .ico/.icns files left from previous builds on non‑Windows/macOS platforms
  if (!['win32','darwin'].includes(process.platform)) {
    try { fs.unlinkSync(path.join(iconDir, 'icon.ico')); console.log('  🗑️  Removed stale .ico'); } catch (_) {}
    try { fs.unlinkSync(path.join(iconDir, 'icon.icns')); console.log('  🗑️  Removed stale .icns'); } catch (_) {}
  }

  // Copy PNG for all platforms (required by Electron Builder)
  fs.copyFileSync(sourceIcon, path.join(iconDir, 'icon.png'));
  console.log('  📦 PNG icon copied');

  // electron-builder looks for `build/icon.ico` by default for Windows. The
  // script writes the .ico into `src/electron/.icon-ico/`, so mirror it into
  // the `build/` directory (creating it on demand) so the NSIS installer and
  // the in-app exe get the real logo instead of Electron's default icon.
  const buildDir = path.join(__dirname, '..', 'build');
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
  }
  const icoSource = path.join(iconDir, 'icon.ico');
  if (fs.existsSync(icoSource)) {
    fs.copyFileSync(icoSource, path.join(buildDir, 'icon.ico'));
    console.log('  📦 Windows icon copied to build/icon.ico');
  } else {
    console.warn('  ⚠️  icon.ico not found in src/electron/.icon-ico/ – Windows builds will fall back to the default Electron icon');
  }

  console.log('✅ Icon generation completed successfully.');
} catch (err) {
  console.error('❌ Icon generation failed:', err.message);
  process.exit(1);
}
