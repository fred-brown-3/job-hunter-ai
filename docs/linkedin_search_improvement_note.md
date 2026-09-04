# Tech Note: LinkedIn Company Connection & Recruiter Search Improvement

## Issue Identified
When looking up LinkedIn connections or recruiters for target companies whose names are common proper nouns or human first/last names (e.g. "Harvey", "One", "Stripe"), text-based keyword fallback search returns people with matching names (e.g. "Harvey Gish", "Mary Harvey") rather than employees working at the specific target company.

## Root Cause
When the target company is not listed in `KNOWN_COMPANY_IDS`, the search script falls back to keyword searching (`keywords=<CompanyName>`) which matches individual profile names, past company mentions, or headline keywords rather than strictly filtering by the target company URN URN (`currentCompany=["<ID>"]`).

## Required Improvements & Future Resolution
1. **Strict Company URN Resolution**: Before executing network connection searches, resolve the exact LinkedIn Company ID URN by navigating directly to `https://www.linkedin.com/company/<company-slug>/about/` or extracting the entity URN from the company page.
2. **Company ID Cache Expansion**: Maintain an updated `KNOWN_COMPANY_IDS` map in both `lookup-linkedin-connections.js` and `lookup-linkedin-recruiters.js`.
3. **Discontinuation Policy**: Until strict URN resolution is enforced for all new companies, discontinue relying on unverified fallback keyword searches when company URN resolution returns ambiguous results.
