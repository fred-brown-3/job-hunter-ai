#!/usr/bin/env node

/**
 * get-active-profile.js
 * Utility to resolve the active candidate profile across all scripts and workflows.
 * 
 * Rules:
 * 1. Scans `profiles/` directory, ignoring 'template' and hidden files.
 * 2. If exactly 1 candidate profile exists, auto-selects it without prompting.
 * 3. If multiple profiles exist:
 *    - Checks command-line flag: --profile <name>
 *    - Checks `.state/active_profile.json`
 *    - If run via CLI, allows interactive or argument-based selection.
 * 4. Parses candidate metadata (Full Name, Slug, Email, Phone) from `personal_info.md`.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = __dirname;
const PROFILES_DIR = path.join(ROOT_DIR, 'profiles');
const STATE_DIR = path.join(ROOT_DIR, '.state');
const ACTIVE_PROFILE_FILE = path.join(STATE_DIR, 'active_profile.json');

function listAvailableProfiles() {
  if (!fs.existsSync(PROFILES_DIR)) return [];
  return fs.readdirSync(PROFILES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory() && dirent.name !== 'template' && !dirent.name.startsWith('.'))
    .map(dirent => dirent.name);
}

function parsePersonalInfo(profileDir) {
  const infoPath = path.join(profileDir, 'personal_info.md');
  const metadata = {
    fullName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    slug: path.basename(profileDir),
    profileDir: profileDir
  };

  if (!fs.existsSync(infoPath)) return metadata;

  const content = fs.readFileSync(infoPath, 'utf-8');
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|')) continue;

    // Match markdown table row e.g. | **Full Name** | Fred Brown |
    const cells = trimmed.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length >= 2) {
      const key = cells[0].replace(/\*\*/g, '').toLowerCase();
      const val = cells[1];

      if (key === 'full name') metadata.fullName = val;
      else if (key === 'first name' && !metadata.firstName) metadata.firstName = val;
      else if (key === 'last name' && !metadata.lastName) metadata.lastName = val;
      else if (key === 'email') metadata.email = val;
      else if (key === 'phone') metadata.phone = val;
    }
  }

  // Fallbacks
  if (!metadata.fullName) {
    if (metadata.firstName && metadata.lastName) {
      metadata.fullName = `${metadata.firstName} ${metadata.lastName}`;
    } else {
      metadata.fullName = metadata.slug
        .split('_')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  if (!metadata.slug && metadata.fullName) {
    metadata.slug = metadata.fullName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  }

  return metadata;
}

function getActiveProfile(targetProfileSlug = null) {
  const profiles = listAvailableProfiles();

  if (profiles.length === 0) {
    throw new Error('No candidate profiles found in profiles/. Please run the candidate intake skill first.');
  }

  let selectedSlug = targetProfileSlug;

  // Check CLI argument if not explicitly provided
  if (!selectedSlug) {
    const args = process.argv.slice(2);
    const profileArgIdx = args.indexOf('--profile');
    if (profileArgIdx !== -1 && args[profileArgIdx + 1]) {
      selectedSlug = args[profileArgIdx + 1];
    }
  }

  // Single profile auto-detection
  if (!selectedSlug && profiles.length === 1) {
    selectedSlug = profiles[0];
  }

  // Check .state/active_profile.json
  if (!selectedSlug && fs.existsSync(ACTIVE_PROFILE_FILE)) {
    try {
      const state = JSON.parse(fs.readFileSync(ACTIVE_PROFILE_FILE, 'utf-8'));
      if (state.active_profile && profiles.includes(state.active_profile)) {
        selectedSlug = state.active_profile;
      }
    } catch (e) {}
  }

  // If still not selected, default to first available or fail
  if (!selectedSlug) {
    if (profiles.length > 0) {
      selectedSlug = profiles[0];
    } else {
      throw new Error('Multiple profiles exist but no active profile is selected. Specify with --profile <name> or set in .state/active_profile.json.');
    }
  }

  if (!profiles.includes(selectedSlug)) {
    throw new Error(`Specified profile "${selectedSlug}" does not exist in profiles/. Available: ${profiles.join(', ')}`);
  }

  // Ensure state directory exists and persist selection
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(ACTIVE_PROFILE_FILE, JSON.stringify({ active_profile: selectedSlug, updated_at: new Date().toISOString() }, null, 2), 'utf-8');

  const profileDir = path.join(PROFILES_DIR, selectedSlug);
  return parsePersonalInfo(profileDir);
}

function setActiveProfile(slug) {
  const profiles = listAvailableProfiles();
  if (!profiles.includes(slug)) {
    throw new Error(`Profile "${slug}" does not exist in profiles/. Available: ${profiles.join(', ')}`);
  }
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  fs.writeFileSync(ACTIVE_PROFILE_FILE, JSON.stringify({ active_profile: slug, updated_at: new Date().toISOString() }, null, 2), 'utf-8');
  return parsePersonalInfo(path.join(PROFILES_DIR, slug));
}

// When run directly as CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const setIdx = args.indexOf('--set');
  if (setIdx !== -1 && args[setIdx + 1]) {
    const profile = setActiveProfile(args[setIdx + 1]);
    console.log(`Active profile set to: ${profile.fullName} (${profile.slug})`);
    process.exit(0);
  }

  try {
    const profile = getActiveProfile();
    console.log(JSON.stringify(profile, null, 2));
  } catch (err) {
    console.error(`❌ Error: ${err.message}`);
    process.exit(1);
  }
}

module.exports = {
  getActiveProfile,
  setActiveProfile,
  listAvailableProfiles,
  parsePersonalInfo
};
