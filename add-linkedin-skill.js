#!/usr/bin/env node

/**
 * add-linkedin-skill.js
 * Navigates to LinkedIn Add Skill page, types the skill name,
 * waits for dynamic experience checkboxes (Meltwater, Neighborhood Health Plan, Edgewater Tech),
 * checks them, and clicks Save.
 */

const { execSync, execFileSync } = require('child_process');

function addSkill(skillName, experiences = ['Meltwater', 'Neighborhood Health Plan', 'Edgewater Technology']) {
  console.log(`\n➕ Adding skill to LinkedIn: "${skillName}"...`);
  
  // 1. Navigate to Add Skill form
  execSync(`node chrome-control.js navigate "https://www.linkedin.com/in/fred-brown-638163/skills/edit/forms/new/"`);
  execSync('sleep 3.5');

  // 2. Type skill name
  const typeJs = `
    const input = document.querySelector('input[placeholder*="Skill"]');
    if (!input) return { error: 'Skill input not found' };

    input.focus();
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(input, ${JSON.stringify(skillName)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return 'Typed skill';
  `;
  try {
    execFileSync('node', ['chrome-control.js', 'eval', typeJs], { encoding: 'utf-8' });
  } catch (e) {}

  // Wait 1.5s for dynamic checkboxes to populate
  execSync('sleep 1.5');

  // 3. Select experience checkboxes
  const checkJs = `
    const checkedRoles = [];
    const targetKeywords = ${JSON.stringify(experiences)};

    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    checkboxes.forEach(c => {
      const card = c.closest('li') || c.closest('.artdeco-form__group') || c.parentElement.parentElement;
      const text = card ? card.innerText : '';
      
      const shouldCheck = targetKeywords.some(kw => text.toLowerCase().includes(kw.toLowerCase()));
      if (shouldCheck && !c.checked) {
        c.click();
        const roleTitle = text.split('\\n')[0].trim();
        if (roleTitle) checkedRoles.push(roleTitle);
      }
    });

    return { skill: ${JSON.stringify(skillName)}, checkedRoles };
  `;

  try {
    const rawResult = execFileSync('node', ['chrome-control.js', 'eval', checkJs], { encoding: 'utf-8' });
    console.log("  Linked Experiences:", rawResult.trim());
  } catch (e) {
    console.error("  Eval error:", e.message);
  }

  // 4. Click Save
  execSync('sleep 1.0');
  const saveJs = `
    const saveBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.innerText.trim() === 'Save');
    if (saveBtn) {
      saveBtn.click();
      return 'Saved';
    }
    return 'Save button not found';
  `;
  try {
    const rawSave = execFileSync('node', ['chrome-control.js', 'eval', saveJs], { encoding: 'utf-8' });
    console.log("  Save Action:", rawSave.trim());
  } catch (e) {}

  execSync('sleep 2.5');
}

const skillToAdd = process.argv[2];
if (!skillToAdd) {
  console.log("Usage: node add-linkedin-skill.js '<Skill Name>'");
  process.exit(1);
}

addSkill(skillToAdd);
