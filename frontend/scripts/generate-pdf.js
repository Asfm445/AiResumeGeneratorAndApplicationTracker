const puppeteer = require('puppeteer');

async function generate(data) {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    const experiences = data.professional_experience || data.experience || [];
    const projects = data.projects || [];
    const skills = data.skills || {};
    const education = data.education || [];

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            
            body { 
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
                line-height: 1.5; 
                color: #000; 
                margin: 0; 
                padding: 0;
                font-size: 10pt;
            }
            .container {
                padding: 40px 50px;
            }
            .header { 
                margin-bottom: 20px;
            }
            .name { 
                font-size: 28pt; 
                font-weight: 700; 
                margin: 0;
                line-height: 1.1;
            }
            .headline { 
                font-size: 14pt; 
                font-weight: 400; 
                margin: 5px 0 10px 0;
                color: #333;
            }
            .contact-info {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                font-size: 9pt;
                color: #000;
                margin-top: 10px;
            }
            .contact-item {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            h2 { 
                font-size: 13pt;
                font-weight: 700;
                text-transform: uppercase;
                border-bottom: 2px solid #000;
                padding-bottom: 2px;
                margin: 25px 0 10px 0;
                letter-spacing: 0.5px;
            }
            
            .section { margin-bottom: 15px; }
            
            .item-header { 
                display: flex; 
                justify-content: space-between; 
                align-items: baseline;
                font-weight: 700;
                font-size: 11pt;
            }
            .item-subheader {
                display: flex;
                justify-content: space-between;
                font-style: italic;
                font-size: 10pt;
                margin-bottom: 4px;
                color: #333;
            }
            
            ul { 
                padding-left: 18px; 
                margin: 4px 0 12px 0; 
            }
            li { 
                margin-bottom: 3px; 
                text-align: justify;
            }
            
            .skills-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 10px;
            }
            .skill-group {
                margin-bottom: 8px;
            }
            .skill-label {
                font-weight: 700;
                display: block;
                font-size: 10pt;
                margin-bottom: 1px;
            }
            .skill-values {
                font-size: 10pt;
                display: block;
            }

            .project-item {
                margin-bottom: 15px;
            }
            .project-title {
                font-weight: 700;
                font-size: 11pt;
            }
            .project-tech {
                font-style: italic;
                font-size: 10pt;
                margin-bottom: 4px;
            }

            @media print {
                .container { padding: 0; }
                body { padding: 40px 50px; }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 class="name">${data.name || 'Your Name'}</h1>
                <div class="headline">${data.headline || ''}</div>
                <div class="contact-info">
                    ${data.email ? `<div class="contact-item">📧 ${data.email}</div>` : ''}
                    ${data.phone ? `<div class="contact-item">📞 ${data.phone}</div>` : ''}
                    ${data.location ? `<div class="contact-item">📍 ${data.location}</div>` : ''}
                    ${data.github ? `<div class="contact-item">🔗 GitHub</div>` : ''}
                    ${data.linkedin ? `<div class="contact-item">🔗 LinkedIn</div>` : ''}
                </div>
            </div>

            ${(data.professional_summary || data.summary) ? `
            <div class="section">
                <h2>Summary</h2>
                <div style="text-align: justify;">${data.professional_summary || data.summary}</div>
            </div>
            ` : ''}
            
            ${experiences.length > 0 ? `
            <div class="section">
                <h2>Professional Experience</h2>
                ${experiences.map(exp => {
                    const title = exp.job_title || exp.role_title || exp.role || exp.position || exp.title || '';
                    const company = exp.company || exp.company_name || exp.organization || '';
                    const startDate = exp.start_date || '';
                    const endDate = exp.end_date || '';
                    const dates = exp.dates || `${startDate}${startDate && endDate ? ' – ' : ''}${endDate}`;
                    const location = exp.location || '';
                    const points = Array.isArray(exp.bullets || exp.bullet_points || exp.responsibilities || exp.description) 
                        ? (exp.bullets || exp.bullet_points || exp.responsibilities || exp.description) 
                        : (typeof (exp.bullets || exp.bullet_points || exp.responsibilities || exp.description) === 'string' 
                            ? (exp.bullets || exp.bullet_points || exp.responsibilities || exp.description).split('\n') 
                            : []);

                    return `
                        <div class="item-header">
                            <span>${title}, ${company}</span>
                            <span>${dates}</span>
                        </div>
                        ${location ? `<div class="item-subheader"><span></span><span>${location}</span></div>` : ''}
                        <ul>${points.filter(Boolean).map(b => `<li>${b}</li>`).join('')}</ul>
                    `;
                }).join('')}
            </div>
            ` : ''}

            ${Object.keys(skills).length > 0 ? `
            <div class="section">
                <h2>Skills</h2>
                <div class="skills-container">
                    ${Object.entries(skills).map(([key, val]) => `
                        <div class="skill-group">
                            <span class="skill-label">${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            <span class="skill-vals">${Array.isArray(val) ? val.join(', ') : val}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${projects.length > 0 ? `
            <div class="section">
                <h2>Projects</h2>
                ${projects.map(proj => {
                    const title = proj.project_name || proj.name || proj.title || '';
                    const tech = Array.isArray(proj.technologies || proj.tech_stack) 
                        ? (proj.technologies || proj.tech_stack).join(', ') 
                        : (proj.technologies || proj.tech_stack || '');
                    const points = Array.isArray(proj.bullets || proj.bullet_points || proj.description) 
                        ? (proj.bullets || proj.bullet_points || proj.description) 
                        : [];

                    return `
                        <div class="project-item">
                            <div class="project-title">${title}</div>
                            ${tech ? `<div class="project-tech">${tech}</div>` : ''}
                            <ul>${points.filter(Boolean).map(b => `<li>${b}</li>`).join('')}</ul>
                        </div>
                    `;
                }).join('')}
            </div>
            ` : ''}

            ${education.length > 0 ? `
            <div class="section">
                <h2>Education</h2>
                ${education.map(edu => {
                    const degree = edu.degree || edu.type || '';
                    const school = edu.school || edu.university || edu.institution || '';
                    const dates = edu.dates || (edu.start_date && edu.end_date ? `${edu.start_date} – ${edu.end_date}` : edu.start_date || edu.end_date || '');
                    const location = edu.location || '';
                    
                    return `
                        <div class="item-header">
                            <span>${degree}, ${school}</span>
                            <span>${dates}</span>
                        </div>
                        ${location ? `<div class="item-subheader"><span></span><span>${location}</span></div>` : ''}
                        ${edu.description ? `<div style="margin-top: 4px;">${edu.description}</div>` : ''}
                        ${edu.coursework ? `<div style="margin-top: 2px;">Relevant Coursework: ${edu.coursework}</div>` : ''}
                    `;
                }).join('')}
            </div>
            ` : ''}
        </div>
    </body>
    </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' }
    });

    await browser.close();
    return pdfBuffer;
}

module.exports = generate;
