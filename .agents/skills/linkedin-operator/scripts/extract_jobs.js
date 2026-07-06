/**
 * extract_jobs.js
 * resiliant LinkedIn Job Search DOM scraper.
 * Evaluates the page DOM, finds job cards, and extracts metadata.
 */
(() => {
  const jobs = [];
  const processedJobIds = new Set();

  // 1. Locate all job view links on the page
  const jobLinks = Array.from(document.querySelectorAll('a[href*="/jobs/view/"], a[href*="currentJobId="]'));

  for (const link of jobLinks) {
    let url = link.href;
    let jobId = null;

    // Extract Job ID from url
    // Standard path: /jobs/view/123456789/
    // Query param: currentJobId=123456789
    const pathMatch = url.match(/\/jobs\/view\/(\d+)/);
    const paramMatch = url.match(/currentJobId=(\d+)/);

    if (pathMatch) {
      jobId = pathMatch[1];
    } else if (paramMatch) {
      jobId = paramMatch[1];
    }

    if (!jobId || processedJobIds.has(jobId)) {
      continue;
    }
    processedJobIds.add(jobId);

    // Normalize URL
    const cleanUrl = `https://www.linkedin.com/jobs/view/${jobId}/`;

    // 2. Identify the card container by traversing up from the link
    let container = link.closest('li, [class*="job-card"], [class*="card"], [class*="entity-lockup"]');
    if (!container) {
      container = link.parentElement;
    }

    // 3. Resilient metadata extraction
    // Title: default to link text, fallback to headers or title classes
    let titleText = link.innerText.trim();
    if (!titleText && container) {
      const titleElem = container.querySelector('[class*="title"], [class*="heading"], h3, h4');
      if (titleElem) titleText = titleElem.innerText.trim();
    }
    // Clean up title text (sometimes contains company or location on newlines)
    titleText = titleText.split('\n')[0].trim();

    // Company: Look for company names in subheadings, links with company, or metadata classes
    let companyText = '';
    if (container) {
      const companyElem = container.querySelector(
        'a[href*="/company/"], [class*="company"], [class*="subtitle"], [class*="brand"], [class*="secondary"]'
      );
      if (companyElem) {
        companyText = companyElem.innerText.trim().split('\n')[0];
      }
    }

    // Location: Search for location indicator classes or text
    let locationText = '';
    if (container) {
      const locationElem = container.querySelector('[class*="location"], [class*="metadata"], [class*="bullet"]');
      if (locationElem) {
        // Strip out date or other metadata if present
        locationText = locationElem.innerText.trim().split('\n')[0];
      }
    }

    // Date/Time posted: look for time elements or classes containing time/date/posted/status
    let postedTimeText = '';
    if (container) {
      const timeElem = container.querySelector('time, [class*="time"], [class*="date"], [class*="posted"], [class*="status"]');
      if (timeElem) {
        postedTimeText = timeElem.innerText.trim().split('\n')[0];
      }
    }

    // Clean up results
    if (titleText && titleText.length > 1) {
      jobs.push({
        jobId,
        title: titleText,
        company: companyText || 'Unknown Company',
        location: locationText || 'Unknown Location',
        posted: postedTimeText || 'Unknown Date',
        url: cleanUrl
      });
    }
  }

  // Return JSON representation
  return JSON.stringify(jobs, null, 2);
})();
