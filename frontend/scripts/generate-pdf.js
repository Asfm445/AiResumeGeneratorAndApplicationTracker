const puppeteer = require('puppeteer');

/**
 * generate-pdf.js
 * Mirrors ResumeDocument.tsx exactly:
 *  - Serif body font (Georgia)
 *  - Centered header: NAME (4xl, uppercase, tracking-widest)
 *  - Contact row: headline | email | phone | location | github | linkedin
 *  - Section headings: uppercase, black border-bottom, tracking-widest
 *  - Experience: bold title right-aligned dates, company uppercase, stack italic, bullet list
 *  - Projects: same pattern as experience
 *  - Education: degree | dates, school uppercase, relevant courses
 *  - Skills: left-border strip, label min-w 150px, values serif
 */
async function generate(data) {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const experiences = data.professional_experience || data.experience || [];
    const projects    = data.projects    || [];
    const skills      = data.skills      || {};
    const education   = data.education   || [];

    const ensureArray = (input) => {
        if (!input) return [];
        if (Array.isArray(input)) return input;
        if (typeof input === 'string') return input.split('\n').filter(Boolean);
        return [String(input)];
    };

    const pipe = '<span style="color:#9ca3af;margin:0 6px;">|</span>';

    // ── Contact row items (only render if truthy) ─────────────────────────────
    const contactItems = [
        data.headline  ? `<span style="text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">${data.headline}</span>` : null,
        data.email     ? `<span style="font-weight:600;color:#111;">${data.email}</span>` : null,
        data.phone     ? `<span>${data.phone}</span>` : null,
        data.location  ? `<span>${data.location}</span>` : null,
        data.github    ? `<span>${data.github}</span>` : null,
        data.linkedin  ? `<span>${data.linkedin}</span>` : null,
    ].filter(Boolean).join(pipe);

    // ── Section heading ───────────────────────────────────────────────────────
    const sectionH = (label) =>
        `<h2 style="font-family:'Arial',sans-serif;font-size:9pt;font-weight:700;text-transform:uppercase;
                    letter-spacing:0.12em;border-bottom:1.5px solid #000;padding-bottom:3px;
                    margin:22px 0 10px 0;">${label}</h2>`;

    // ── Bullet list ───────────────────────────────────────────────────────────
    const bulletList = (points) =>
        `<ul style="margin:6px 0 0 16px;padding:0;list-style:disc outside;">
            ${ensureArray(points).filter(Boolean).map(p =>
                `<li style="margin-bottom:4px;text-align:justify;padding-left:2px;">${p}</li>`
            ).join('')}
        </ul>`;

    // ── Experience items ──────────────────────────────────────────────────────
    const expHtml = experiences.map(exp => {
        const title   = exp.job_title || exp.role_title || exp.position || exp.role || exp.title || '';
        const company = exp.company   || exp.company_name || exp.organization || '';
        const dates   = exp.dates     || (exp.start_date && exp.end_date
                            ? `${exp.start_date} – ${exp.end_date}`
                            : exp.start_date || exp.end_date || '');
        const stack   = exp.technologies || exp.tech_stack || exp.stack || exp.tools;
        const points  = exp.bullets || exp.bullet_points || exp.responsibilities
                        || exp.achievements || exp.short_description || exp.description || exp.highlights;

        return `
        <div style="margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <span style="font-weight:700;font-size:10.5pt;color:#0f172a;">${title}</span>
                <span style="font-size:8pt;font-style:italic;text-transform:uppercase;
                             letter-spacing:0.06em;color:#6b7280;font-family:'Arial',sans-serif;">${dates}</span>
            </div>
            <div style="font-family:'Arial',sans-serif;font-weight:700;font-size:9pt;
                        text-transform:uppercase;letter-spacing:0.05em;color:#1e1b4b;margin:2px 0 4px 0;">${company}</div>
            ${stack ? `<div style="font-style:italic;font-size:8pt;color:#6b7280;margin-bottom:4px;">
                Stack: ${Array.isArray(stack) ? stack.join(' • ') : stack}
            </div>` : ''}
            ${bulletList(points)}
        </div>`;
    }).join('');

    // ── Project items ─────────────────────────────────────────────────────────
    const projHtml = projects.map(proj => {
        const title  = proj.project_name || proj.name  || proj.title || '';
        const dates  = proj.dates        || (proj.start_date && proj.end_date
                            ? `${proj.start_date} – ${proj.end_date}`
                            : proj.start_date || proj.end_date || '');
        const role   = proj.role         || proj.job_title || proj.position;
        const stack  = proj.technologies || proj.tech_stack || proj.stack || proj.tools;
        const points = proj.bullets      || proj.bullet_points || proj.description
                        || proj.key_achievements || proj.achievements || proj.highlights
                        || proj.short_description;

        return `
        <div style="margin-bottom:18px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <span style="font-weight:700;font-size:10pt;color:#0f172a;">${title}</span>
                <span style="font-size:8pt;font-style:italic;text-transform:uppercase;
                             letter-spacing:0.06em;color:#6b7280;">${dates}</span>
            </div>
            ${role ? `<div style="font-size:8pt;font-weight:700;text-transform:uppercase;
                                  letter-spacing:0.1em;color:#4338ca;margin:2px 0;">ROLE: ${role}</div>` : ''}
            ${stack ? `<div style="font-style:italic;font-size:8pt;color:#6b7280;margin-bottom:4px;">
                Stack: ${Array.isArray(stack) ? stack.join(' • ') : stack}
            </div>` : ''}
            ${bulletList(points)}
        </div>`;
    }).join('');

    // ── Education items ───────────────────────────────────────────────────────
    const eduHtml = education.map(edu => {
        const degree  = edu.degree || edu.type || '';
        const field   = edu.field_of_study ? ` in ${edu.field_of_study}` : '';
        const school  = edu.school || edu.university || edu.institution || '';
        const dates   = edu.dates  || (edu.start_date && edu.end_date
                            ? `${edu.start_date} – ${edu.end_date || 'Present'}`
                            : edu.start_date || edu.end_date || '');
        const courses = edu.relevant_courses || edu.relevant_coursework || edu.coursework;

        return `
        <div style="margin-bottom:14px;">
            <div style="display:flex;justify-content:space-between;align-items:baseline;">
                <span style="font-weight:700;font-size:10pt;color:#0f172a;">${degree}${field}</span>
                <span style="font-size:8pt;font-style:italic;text-transform:uppercase;
                             letter-spacing:0.05em;color:#6b7280;">${dates}</span>
            </div>
            <div style="font-family:'Arial',sans-serif;font-weight:700;font-size:9pt;
                        text-transform:uppercase;letter-spacing:0.05em;color:#1e1b4b;margin:2px 0;">${school}</div>
            ${courses ? `<div style="font-size:8pt;font-style:italic;color:#6b7280;margin-top:2px;">
                <span style="font-weight:700;font-style:normal;text-transform:uppercase;margin-right:4px;">Relevant Coursework:</span>
                ${Array.isArray(courses) ? courses.join(', ') : courses}
            </div>` : ''}
        </div>`;
    }).join('');

    // ── Skills rows ───────────────────────────────────────────────────────────
    const skillsHtml = Object.entries(skills).map(([type, list]) => `
        <div style="display:flex;align-items:flex-start;font-size:9pt;
                    border-left:2px solid #e5e7eb;padding:3px 0 3px 12px;margin-bottom:4px;">
            <span style="font-family:'Arial',sans-serif;font-weight:700;text-transform:uppercase;
                         letter-spacing:0.06em;color:#1e1b4b;min-width:150px;flex-shrink:0;">
                ${type.replace(/_/g, ' ')}
            </span>
            <span style="color:#374151;font-family:Georgia,serif;">
                ${Array.isArray(list) ? list.join(', ') : String(list)}
            </span>
        </div>
    `).join('');

    // ── Full HTML ─────────────────────────────────────────────────────────────
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', Times, serif;
    font-size: 10pt;
    line-height: 1.6;
    color: #1a1a1a;
    background: #ffffff;
  }
  .page {
    width: 816px;
    min-height: 1056px;
    padding: 48px;
    background: #ffffff;
  }
  /* Header */
  .resume-name {
    font-size: 28pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: #000000;
    text-align: center;
    line-height: 1.1;
    margin-bottom: 8px;
  }
  .contact-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 2px;
    font-size: 8pt;
    font-family: Arial, sans-serif;
    color: #4b5563;
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 10px;
    margin-bottom: 0;
  }
  /* Summary italic */
  .summary-text {
    font-style: italic;
    color: #374151;
    text-align: justify;
    line-height: 1.7;
  }
  /* Footer */
  .footer {
    margin-top: 40px;
    font-size: 7pt;
    color: #9ca3af;
    text-align: center;
    font-style: italic;
    font-family: Arial, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.25em;
  }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <header style="text-align:center;margin-bottom:24px;">
    <div class="resume-name">${data.name || 'Resume'}</div>
    <div class="contact-row">${contactItems}</div>
  </header>

  <!-- Summary -->
  ${(data.professional_summary || data.summary) ? `
  <section style="margin-bottom:22px;">
    ${sectionH('Professional Summary')}
    <p class="summary-text">${data.professional_summary || data.summary}</p>
  </section>` : ''}

  <!-- Experience -->
  ${experiences.length > 0 ? `
  <section style="margin-bottom:22px;">
    ${sectionH('Professional Experience')}
    ${expHtml}
  </section>` : ''}

  <!-- Projects -->
  ${projects.length > 0 ? `
  <section style="margin-bottom:22px;font-family:Arial,sans-serif;">
    ${sectionH('Projects')}
    ${projHtml}
  </section>` : ''}

  <!-- Education -->
  ${education.length > 0 ? `
  <section style="margin-bottom:22px;font-family:Arial,sans-serif;">
    ${sectionH('Education')}
    ${eduHtml}
  </section>` : ''}

  <!-- Skills -->
  ${Object.keys(skills).length > 0 ? `
  <section style="margin-bottom:22px;font-family:Arial,sans-serif;">
    ${sectionH('Technical Skills')}
    <div style="margin-top:6px;">${skillsHtml}</div>
  </section>` : ''}

  <div class="footer">AI Optimized • Built for modern careers</div>
</div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        width:  '816px',
        height: '1056px',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    return pdfBuffer;
}

module.exports = generate;
