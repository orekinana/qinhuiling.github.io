#!/usr/bin/env node
/**
 * Pre-render content from JS data files into semantic HTML
 * Run: node prerender.js
 *
 * Reads content/en/*.js and content/zh/*.js, generates semantic HTML blocks,
 * and injects them into index.html (hidden off-screen for humans, readable by LLMs/crawlers).
 */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// ---- Load JS data files ----
// These files assign to global objects like: portfolioData.en.sections.about = {...}
// We eval them in a sandboxed context.

function loadData(lang) {
    // Each JS file does things like: portfolioData.en.sections.about = {...}
    // We need to provide a properly nested object so assignments work.
    const data = { navigation: [], profile: {}, sections: {} };
    const portfolioData = { en: {}, zh: {} };
    portfolioData[lang] = data;

    const files = [
        'consts', 'navigation', 'profile',
        'section_about', 'section_publications', 'section_projects',
        'section_honors', 'section_education', 'section_experience',
        'section_patents', 'section_services', 'section_lab',
    ];

    for (const file of files) {
        const filePath = path.join(ROOT, 'content', lang, `${file}.js`);
        if (fs.existsSync(filePath)) {
            let code = fs.readFileSync(filePath, 'utf-8');
            try {
                // Replace `const contentConsts =` with `var contentConsts =` to avoid redeclaration errors
                code = code.replace(/\bconst\s+contentConsts\b/g, 'var contentConsts');
                const fn = new Function('portfolioData', 'contentConsts', code);
                fn(portfolioData, {});
            } catch (e) {
                console.error(`Error loading ${filePath}: ${e.message}`);
            }
        }
    }

    return data;
}

// ---- HTML escape ----
function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ---- Markdown-like bold to HTML ----
function mdBold(text) {
    if (!text) return '';
    return esc(text)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n- /g, '</p><ul><li>')
        .replace(/\n    - /g, '</li><li>');
}

// ---- Renderers for each section type ----

function renderProfile(p, lang) {
    if (!p) return '';
    let html = `<div id="llm-profile-${lang}">`;
    html += `<h1>${esc(p.name)}</h1>`;
    html += `<p>${esc(p.title)}</p>`;
    html += `<p>${esc(p.affiliation)} · ${esc(p.department)}</p>`;
    if (p.researchFields) html += `<p>Research: ${esc(p.researchFields)}</p>`;
    if (p.contact) {
        html += `<p>`;
        if (p.contact.location) html += `📍 ${esc(p.contact.location)} · `;
        if (p.contact.email) html += `✉️ ${esc(p.contact.email)}`;
        html += `</p>`;
    }
    if (p.social) {
        html += `<p>`;
        const links = [];
        if (p.social.googleScholar) links.push(`Google Scholar: ${esc(p.social.googleScholar)}`);
        if (p.social.schoolWebsite) links.push(`Website: ${esc(p.social.schoolWebsite)}`);
        html += links.join(' · ');
        html += `</p>`;
    }
    html += `</div>`;
    return html;
}

function renderAbout(section, lang) {
    if (!section || !section.content) return '';
    return `<div id="llm-about-${lang}"><h2>${esc(section.title)}</h2><p>${esc(section.content)}</p></div>`;
}

function renderPublications(section, lang) {
    if (!section || !section.items) return '';
    let html = `<div id="llm-publications-${lang}"><h2>${esc(section.title)}</h2><ol>`;
    for (const item of section.items) {
        html += `<li>`;
        html += `<strong>${esc(item.title)}</strong>`;
        html += `<br><span>${esc(item.authors)}</span>`;
        html += `<br><em>${esc(item.venue)}</em>`;
        html += `</li>`;
    }
    html += `</ol></div>`;
    return html;
}

function renderProjects(section, lang) {
    if (!section || !section.items) return '';
    let html = `<div id="llm-projects-${lang}"><h2>${esc(section.title)}</h2><ul>`;
    for (const item of section.items) {
        html += `<li>`;
        html += `<strong>${esc(item.title)}</strong>`;
        if (item.type) html += ` — ${esc(item.type)}`;
        if (item.code) html += ` (${esc(item.code)})`;
        if (item.period) html += ` · ${esc(item.period)}`;
        if (item.amount) html += ` · ${esc(item.amount)}`;
        html += `</li>`;
    }
    html += `</ul></div>`;
    return html;
}

function renderHonors(section, lang) {
    if (!section || !section.items) return '';
    let html = `<div id="llm-honors-${lang}"><h2>${esc(section.title)}</h2><ul>`;
    for (const item of section.items) {
        html += `<li>`;
        html += `<strong>${esc(item.title)}</strong>`;
        if (item.organization) html += ` — ${esc(item.organization)}`;
        if (item.year) html += ` (${esc(item.year)})`;
        html += `</li>`;
    }
    html += `</ul></div>`;
    return html;
}

function renderEducation(section, lang) {
    if (!section || !section.items) return '';
    let html = `<div id="llm-education-${lang}"><h2>${esc(section.title)}</h2><ul>`;
    for (const item of section.items) {
        html += `<li>`;
        html += `<strong>${esc(item.degree)}</strong>`;
        html += ` — ${esc(item.institution)}`;
        if (item.period) html += ` (${esc(item.period)})`;
        if (item.description) html += `<br>${esc(item.description)}`;
        html += `</li>`;
    }
    html += `</ul></div>`;
    return html;
}

function renderExperience(section, lang) {
    if (!section || !section.items) return '';
    let html = `<div id="llm-experience-${lang}"><h2>${esc(section.title)}</h2><ul>`;
    for (const item of section.items) {
        html += `<li>`;
        html += `<strong>${esc(item.position)}</strong>`;
        html += ` — ${esc(item.organization)}`;
        if (item.period) html += ` (${esc(item.period)})`;
        if (item.description) html += `<br>${esc(item.description)}`;
        html += `</li>`;
    }
    html += `</ul></div>`;
    return html;
}

function renderPatents(section, lang) {
    if (!section || !section.items) return '';
    let html = `<div id="llm-patents-${lang}"><h2>${esc(section.title)}</h2><ul>`;
    for (const item of section.items) {
        html += `<li>`;
        html += `<strong>${esc(item.title)}</strong>`;
        if (item.inventors) html += `<br>Inventors: ${esc(item.inventors)}`;
        if (item.number) html += `<br>Patent: ${esc(item.number)}`;
        if (item.date) html += ` · ${esc(item.date)}`;
        html += `</li>`;
    }
    html += `</ul></div>`;
    return html;
}

function renderContentSection(section, lang) {
    if (!section || !section.content) return '';
    const contentHtml = mdBold(section.content);
    return `<div id="llm-${section.title ? section.title.toLowerCase().replace(/[^a-z]/g,'') : 'section'}-${lang}"><h2>${esc(section.title)}</h2><p>${contentHtml}</p></div>`;
}

function renderLangData(data, lang) {
    const sections = data.sections || {};
    let html = '';

    html += renderProfile(data.profile, lang);
    if (sections.about) html += renderAbout(sections.about, lang);
    if (sections.publications) html += renderPublications(sections.publications, lang);
    if (sections.projects) html += renderProjects(sections.projects, lang);
    if (sections.honors) html += renderHonors(sections.honors, lang);
    if (sections.education) html += renderEducation(sections.education, lang);
    if (sections.experience) html += renderExperience(sections.experience, lang);
    if (sections.patents) html += renderPatents(sections.patents, lang);
    if (sections.services) html += renderContentSection(sections.services, lang);
    if (sections.lab) html += renderContentSection(sections.lab, lang);

    return html;
}

// ---- Main ----

const indexPath = path.join(ROOT, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf-8');

// Remove any previously injected pre-rendered content
indexHtml = indexHtml.replace(
    /<!-- BEGIN PRE-RENDERED CONTENT FOR CRAWLERS -->[\s\S]*?<!-- END PRE-RENDERED CONTENT FOR CRAWLERS -->/,
    ''
);

// Generate content
const enData = loadData('en');
const zhData = loadData('zh');

let preRendered = '\n<!-- BEGIN PRE-RENDERED CONTENT FOR CRAWLERS -->\n';
preRendered += '<div style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;" aria-hidden="true">\n';
preRendered += '<article lang="en">\n';
preRendered += renderLangData(enData, 'en');
preRendered += '</article>\n';
preRendered += '<article lang="zh">\n';
preRendered += renderLangData(zhData, 'zh');
preRendered += '</article>\n';
preRendered += '</div>\n';
preRendered += '<!-- END PRE-RENDERED CONTENT FOR CRAWLERS -->\n';

// Insert after <body> tag (also remove the old llm notice div)
// Remove old LLM notice div
indexHtml = indexHtml.replace(
    /\s*<div style="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;" aria-hidden="true">[\s\S]*?<\/div>\s*/,
    '\n'
);

// Insert right after <body ...>
const bodyTag = indexHtml.match(/<body[^>]*>/);
if (bodyTag) {
    const insertPos = indexHtml.indexOf(bodyTag[0]) + bodyTag[0].length;
    indexHtml = indexHtml.slice(0, insertPos) + preRendered + indexHtml.slice(insertPos);
}

fs.writeFileSync(indexPath, indexHtml, 'utf-8');
console.log('Pre-rendered content injected into index.html');
console.log(`EN sections: ${Object.keys(enData.sections || {}).join(', ')}`);
console.log(`ZH sections: ${Object.keys(zhData.sections || {}).join(', ')}`);
