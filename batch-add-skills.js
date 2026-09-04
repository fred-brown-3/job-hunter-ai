const { execSync } = require('child_process');

const skillsToAdd = [
  'Generative AI',
  'Large Language Models (LLM)',
  'Data Modeling',
  'Business Intelligence (BI)',
  'MySQL',
  'Data Pipelines',
  'REST APIs',
  'System Architecture',
  'Looker Studio',
  'Technical Leadership',
  'PostgreSQL',
  'Strategic Planning',
  'Cross-Functional Team Leadership',
  'Incident Management',
  'Service Level Agreements (SLA)'
];

console.log(`🚀 Batch adding ${skillsToAdd.length} high-value technical & leadership skills to LinkedIn...\n`);

for (const skill of skillsToAdd) {
  try {
    execSync(`node add-linkedin-skill.js "${skill}"`, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Error adding skill "${skill}":`, e.message);
  }
}

console.log("\n✅ All batch skills successfully processed!");
