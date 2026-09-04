<!-- TEMPLATE DIRECTIVE: Max 1 candidate header block -->
# {{CANDIDATE_NAME}}
{{CONTACT_INFO_BAR}}

---

<!-- TEMPLATE DIRECTIVE: Target Headline (1 line) & Executive Summary (Max 1 paragraph, 3-4 sentences max) -->
## {{TARGET_HEADLINE}}

{{TAILORED_EXECUTIVE_SUMMARY}}

---

<!-- TEMPLATE DIRECTIVE: Max 3 category bullet groups -->
## CORE TECHNICAL COMPETENCIES

{{TECHNICAL_COMPETENCIES_BLOCK}}

---

<!-- TEMPLATE DIRECTIVE: Max 3 featured projects/accomplishments total (selected by job relevance) -->
## FEATURED TECHNICAL ACCOMPLISHMENTS & SYSTEMS

{{#each FEATURED_PROJECTS}}
<!-- ITEM DIRECTIVE: 1 project block per item -->
### **{{PROJECT_NAME}}** | *{{PROJECT_TECH_STACK}}*
- **Architecture & Story**: {{PROJECT_STORY}}
- **Business Impact & Metrics**: {{PROJECT_IMPACT}}

{{/each}}
---

<!-- TEMPLATE DIRECTIVE: Should list all companies with physical location (City, State); Provide full detail on roles/projects/impact related to target job. -->
## PROFESSIONAL EXPERIENCE

{{#each EMPLOYMENT_HISTORY}}
### **{{COMPANY_NAME}}** | {{COMPANY_LOCATION}}
**{{ROLE_TITLE}}** | {{DATES_OF_EMPLOYMENT}}

{{#if HAS_ROLE_PROGRESSION}}
<!-- ITEM DIRECTIVE: Max 5 role progression items for this company -->
#### **Role Progression**
{{#each ROLE_PROGRESSION_ITEMS}}
- **{{PROGRESSION_TITLE}}** (*{{PROGRESSION_DURATION}}*): {{PROGRESSION_DESCRIPTION}}
{{/each}}
{{/if}}
#### **Key Achievements & Operational Impact**
{{#each ACHIEVEMENT_BULLETS}}
- {{BULLET_CONTENT}}
{{/each}}

{{/each}}
---

<!-- TEMPLATE DIRECTIVE: All Degrees, Certifications -->
## EDUCATION & CREDENTIALS

{{#each EDUCATION_AND_CREDENTIALS}}
- {{CREDENTIAL_ITEM}}
{{/each}}

---

<!-- TEMPLATE DIRECTIVE: Mandatory Volunteer Experience -->
## VOLUNTEER EXPERIENCE

- **Community Mentor / Volunteer Coordinator** (2020 – Present) | Local Community Organization. Mentoring junior developers and coordinating community STEM workshops.
- **Volunteer Bishop and Executive Leader** (2017 - 2023) - LDS Church (Derry, NH). Managed administration, financial budgets, welfare relief funds, pastoral care, and digital transition of all community services during COVID-19 for 500+ enrolled members.
- **Missionary** (1994 - 1996) - LDS Church (Arcadia, CA Mission). Conducted full-time community service and team mentorship in Spanish.



---

<!-- TEMPLATE DIRECTIVE: Mandatory Other Items -->
## OTHER ITEMS

- **Eagle Scout** - BSA - 1987 (Order of the Arrow)
- **Languages**: Spanish (Fluent, non-native), English (Native).
- **Hobbies & Personal Interests**: Volleyball, Disc Golf, Music.

