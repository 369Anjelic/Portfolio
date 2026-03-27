// ═════════════════════════════════════════════════════════════════════════════
// DEV PORTFOLIO v2.0 - SCRIPT.JS
// ═════════════════════════════════════════════════════════════════════════════

let projectsData = JSON.parse(localStorage.getItem('devPortfolio_projects')) || {};
let currentProject = null;

// Dateitypen & Skills
const fileTypeMap = {
    '.html': 'HTML', '.js': 'JavaScript', '.jsx': 'JavaScript',
    '.ts': 'TypeScript', '.tsx': 'TypeScript', '.css': 'CSS',
    '.scss': 'SCSS', '.less': 'LESS', '.py': 'Python',
    '.java': 'Java', '.cpp': 'C++', '.c': 'C',
    '.rs': 'Rust', '.go': 'Go', '.rb': 'Ruby',
    '.php': 'PHP', '.swift': 'Swift', '.kt': 'Kotlin',
    '.dart': 'Dart', '.json': 'JSON', '.xml': 'XML',
    '.yaml': 'YAML', '.yml': 'YAML', '.md': 'Markdown',
    '.sql': 'SQL', '.sh': 'Bash'
};

const skillPatterns = {
    'Claude API': /claude|anthropic/i,
    'OpenAI API': /openai|gpt|davinci/i,
    'Canvas API': /canvas|ctx\.|getContext/i,
    'Three.js': /three\.js|threejs|THREE\./i,
    'WebGL': /webgl|gl\.|shader/i,
    'PWA': /service\s*worker|manifest\.json|offline/i,
    'React': /react|jsx|useState|useEffect/i,
    'Vue': /vue|vuex|v-bind|v-on/i,
    'Angular': /angular|@angular|typescript.*decorator/i,
    'Node.js': /node\.js|express|npm|require\(/i,
    'Express': /express|app\.get|app\.post|router\./i,
    'Database': /sql|mongodb|firebase|postgres|mysql/i,
    'Authentication': /auth|jwt|oauth|password.*hash|bcrypt/i,
    'Testing': /jest|mocha|chai|test|describe\(|it\(/i,
    'WebSocket': /websocket|socket\.io|ws\./i,
    'Animation': /animation|gsap|anime\.js|keyframe/i,
    'Voice': /audio|speech|microphone|recorder/i,
    'Machine Learning': /tensorflow|pytorch|keras|ml\./i,
    'Geolocation': /geolocation|latitude|longitude|maps/i,
    'Docker': /docker|container|dockerfile/i,
    'CI\/CD': /github.*action|travis|jenkins|pipeline/i,
    'Blockchain': /ethereum|web3|contract|solidity/i,
    'Game Dev': /game|canvas|phaser|babylon/i
};

// ─────────────────────────────────────────────────────────────────────────
// TAB SWITCHING
// ─────────────────────────────────────────────────────────────────────────

document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;
        switchTab(tabName);
    });
});

function switchTab(tabName) {
    // Update panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });
    document.getElementById(tabName).classList.add('active');

    // Update buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update header
    const titles = {
        dashboard: 'Dashboard',
        upload: 'Projekt hochladen',
        projects: 'Deine Projekte',
        files: 'Dateistruktur',
        analysis: 'Detaillierte Analyse'
    };
    document.getElementById('pageTitle').textContent = titles[tabName] || 'Dashboard';
}

// ─────────────────────────────────────────────────────────────────────────
// FILE HANDLING
// ─────────────────────────────────────────────────────────────────────────

const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');

uploadArea.addEventListener('click', () => fileInput.click());
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.background = 'linear-gradient(135deg, rgba(57, 135, 184, 0.2) 0%, rgba(20, 20, 20, 0.4) 100%)';
});
uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.background = 'linear-gradient(135deg, rgba(57, 135, 184, 0.1) 0%, rgba(20, 20, 20, 0.3) 100%)';
});
uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.background = 'linear-gradient(135deg, rgba(57, 135, 184, 0.1) 0%, rgba(20, 20, 20, 0.3) 100%)';
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const projectName = fileArray[0].webkitRelativePath.split('/')[0] || 'Unnamed Project';
    const analysis = analyzeFiles(fileArray, projectName);

    projectsData[projectName] = {
        ...analysis,
        github: null
    };

    currentProject = projectName;
    showGitHubModal();
    updateAllViews();
}

function analyzeFiles(files, projectName) {
    const stats = {
        name: projectName,
        files: 0,
        lines: 0,
        languages: {},
        skills: new Set(),
        fileList: [],
        timestamp: new Date().toLocaleString()
    };

    files.forEach(file => {
        const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
        const language = fileTypeMap[ext] || 'Other';
        const filePath = file.webkitRelativePath;

        stats.files++;
        stats.languages[language] = (stats.languages[language] || 0) + 1;
        stats.fileList.push({
            name: file.name,
            path: filePath,
            size: file.size,
            type: language
        });

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split('\n').length;
            stats.lines += lines;

            // Detect skills
            Object.entries(skillPatterns).forEach(([skill, pattern]) => {
                if (pattern.test(content)) {
                    stats.skills.add(skill);
                }
            });
        };
        reader.readAsText(file);
    });

    stats.skills = Array.from(stats.skills);
    return stats;
}

// ─────────────────────────────────────────────────────────────────────────
// GITHUB MODAL
// ─────────────────────────────────────────────────────────────────────────

function showGitHubModal() {
    document.getElementById('githubModal').classList.add('active');
    document.getElementById('githubUrl').value = '';
}

function closeModal() {
    document.getElementById('githubModal').classList.remove('active');
}

async function fetchGitHubData() {
    const url = document.getElementById('githubUrl').value.trim();
    if (!url) {
        closeModal();
        return;
    }

    try {
        const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) {
            alert('Ungültige GitHub-URL');
            return;
        }

        const [, owner, repo] = match;
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
        const data = await response.json();

        if (data.message === 'Not Found') {
            alert('Repo nicht gefunden');
            return;
        }

        projectsData[currentProject].github = {
            url: `https://github.com/${owner}/${repo}`,
            name: data.name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            language: data.language,
            pushed_at: new Date(data.pushed_at).toLocaleDateString('de-DE')
        };

        localStorage.setItem('devPortfolio_projects', JSON.stringify(projectsData));
        closeModal();
        updateAllViews();
        document.getElementById('uploadMessage').innerHTML = `<div class="upload-message">✅ Projekt analysiert & GitHub verknüpft!</div>`;
        setTimeout(() => {
            document.getElementById('uploadMessage').innerHTML = '';
        }, 3000);
    } catch (error) {
        alert('Fehler beim Abrufen von GitHub-Daten');
    }
}

function linkGitHubLater(projectName) {
    currentProject = projectName;
    showGitHubModal();
}

// ─────────────────────────────────────────────────────────────────────────
// VIEWS UPDATE
// ─────────────────────────────────────────────────────────────────────────

function updateAllViews() {
    updateStats();
    updateProjectsView();
    updateFilesView();
    updateAnalysisView();
}

function updateStats() {
    const projects = Object.values(projectsData);
    const totalProjects = projects.length;
    const totalLines = projects.reduce((sum, p) => sum + p.lines, 0);
    const totalFiles = projects.reduce((sum, p) => sum + p.files, 0);
    const totalStars = projects.reduce((sum, p) => sum + (p.github?.stars || 0), 0);

    document.getElementById('total-projects').textContent = totalProjects;
    document.getElementById('total-lines').textContent = totalLines.toLocaleString();
    document.getElementById('total-files').textContent = totalFiles;
    document.getElementById('total-stars').textContent = totalStars;

    document.getElementById('qs-projects').textContent = totalProjects;
    document.getElementById('qs-files').textContent = totalFiles;
    document.getElementById('qs-lines').textContent = totalLines.toLocaleString();
}

function updateProjectsView() {
    const container = document.getElementById('projectsContainer');
    const projects = Object.entries(projectsData);

    if (projects.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1/-1;">
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <div style="color: var(--text);">Keine Projekte vorhanden</div>
                    <div style="font-size: 12px; color: var(--text-muted); margin-top: 10px;">Gehe zum Upload-Tab um Projekte hinzuzufügen</div>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(([name, data]) => `
        <div class="project-card">
            <div class="project-header">
                <div class="project-title">📂 ${name}</div>
            </div>
            <div class="project-stats">
                <div class="project-stat">
                    <strong>${data.lines.toLocaleString()}</strong>
                    <span>Code-Zeilen</span>
                </div>
                <div class="project-stat">
                    <strong>${data.files}</strong>
                    <span>Dateien</span>
                </div>
                <div class="project-stat">
                    <strong>${data.skills.length}</strong>
                    <span>Skills</span>
                </div>
                <div class="project-stat">
                    <strong>${Object.keys(data.languages).length}</strong>
                    <span>Sprachen</span>
                </div>
            </div>
            <div class="lang-tags">
                ${Object.keys(data.languages).map(lang => `<span class="lang-tag">${lang}</span>`).join('')}
            </div>
            <div class="skill-list">
                <strong>Skills:</strong> ${data.skills.slice(0, 3).join(', ') || 'Keine'}
            </div>
            ${data.github ? `
                <div class="github-section">
                    <a href="${data.github.url}" target="_blank" class="github-link">🌐 ${data.github.name}</a>
                    <div style="color: var(--text-muted); font-size: 10px; margin-bottom: 6px;">${data.github.description || ''}</div>
                    <div class="github-stats">
                        <span class="github-stat">⭐ ${data.github.stars} Stars</span>
                        <span class="github-stat">🍴 ${data.github.forks} Forks</span>
                        <span class="github-stat">📝 ${data.github.language || 'N/A'}</span>
                    </div>
                </div>
            ` : `
                <div class="github-section" style="border-style: dashed;">
                    <div style="color: var(--text-muted); margin-bottom: 8px;">Kein GitHub-Repo verknüpft</div>
                    <button class="btn-secondary" onclick="linkGitHubLater('${name}')" style="width: 100%;">Jetzt verknüpfen</button>
                </div>
            `}
            <div class="project-buttons">
                <button class="btn-secondary" onclick="deleteProject('${name}')">Löschen</button>
            </div>
        </div>
    `).join('');
}

function updateFilesView() {
    const container = document.getElementById('filesContainer');
    const projects = Object.entries(projectsData);

    if (projects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📭</div>
                <div style="color: var(--text);">Keine Dateien vorhanden</div>
            </div>
        `;
        return;
    }

    container.innerHTML = projects.map(([projectName, data]) => `
        <div class="file-card">
            <h3>📂 ${projectName} <span style="color: var(--text-muted); font-size: 12px; font-weight: 400;">${data.fileList.length} Dateien</span></h3>
            <div class="file-list">
                ${data.fileList.map(file => `
                    <div class="file-item">
                        <div class="file-name">${file.name}</div>
                        <div class="file-meta">
                            <span>${file.type}</span>
                            <span>${(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function updateAnalysisView() {
    const projects = Object.values(projectsData);

    if (projects.length === 0) {
        document.getElementById('topSkills').innerHTML = '<div class="empty-state" style="padding: 30px;"><div class="empty-icon">📭</div></div>';
        document.getElementById('languages').innerHTML = '<div class="empty-state" style="padding: 30px;"><div class="empty-icon">📭</div></div>';
        document.getElementById('stats').innerHTML = '<div class="empty-state" style="padding: 30px;"><div class="empty-icon">📭</div></div>';
        return;
    }

    const allSkills = {};
    const allLanguages = {};

    projects.forEach(project => {
        project.skills.forEach(skill => {
            allSkills[skill] = (allSkills[skill] || 0) + 1;
        });
        Object.entries(project.languages).forEach(([lang, count]) => {
            allLanguages[lang] = (allLanguages[lang] || 0) + count;
        });
    });

    const topSkills = Object.entries(allSkills).sort((a, b) => b[1] - a[1]).slice(0, 10);
    document.getElementById('topSkills').innerHTML = topSkills.map(([skill, count]) => {
        const level = Math.min(95, 30 + (count * 20));
        return `
            <div class="skill-item">
                <div class="skill-header">
                    <span class="skill-name">🎯 ${skill}</span>
                    <span class="skill-percent">${level}%</span>
                </div>
                <div class="skill-bar">
                    <div class="skill-fill" style="width: ${level}%"></div>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('languages').innerHTML = Object.entries(allLanguages)
        .sort((a, b) => b[1] - a[1])
        .map(([lang, count]) => {
            const level = Math.min(95, 30 + (count * 10));
            return `
                <div class="skill-item">
                    <div class="skill-header">
                        <span class="skill-name">📚 ${lang}</span>
                        <span class="skill-percent">${count} Dateien</span>
                    </div>
                    <div class="skill-bar">
                        <div class="skill-fill" style="width: ${level}%"></div>
                    </div>
                </div>
            `;
        }).join('');

    const totalLines = projects.reduce((sum, p) => sum + p.lines, 0);
    const totalFiles = projects.reduce((sum, p) => sum + p.files, 0);
    const totalStars = projects.reduce((sum, p) => sum + (p.github?.stars || 0), 0);
    const totalForks = projects.reduce((sum, p) => sum + (p.github?.forks || 0), 0);
    const linkedRepos = projects.filter(p => p.github).length;

    document.getElementById('stats').innerHTML = `
        <div class="stats-item">
            <span class="stats-label">📊 Projekte</span>
            <span class="stats-value">${projects.length}</span>
        </div>
        <div class="stats-item">
            <span class="stats-label">💻 Code-Zeilen</span>
            <span class="stats-value">${totalLines.toLocaleString()}</span>
        </div>
        <div class="stats-item">
            <span class="stats-label">📁 Dateien</span>
            <span class="stats-value">${totalFiles}</span>
        </div>
        <div class="stats-item">
            <span class="stats-label">⭐ GitHub Stars</span>
            <span class="stats-value">${totalStars}</span>
        </div>
        <div class="stats-item">
            <span class="stats-label">🍴 GitHub Forks</span>
            <span class="stats-value">${totalForks}</span>
        </div>
        <div class="stats-item">
            <span class="stats-label">🔗 Verknüpfte Repos</span>
            <span class="stats-value">${linkedRepos}</span>
        </div>
    `;
}

function deleteProject(projectName) {
    if (confirm(`Projekt "${projectName}" wirklich löschen?`)) {
        delete projectsData[projectName];
        localStorage.setItem('devPortfolio_projects', JSON.stringify(projectsData));
        updateAllViews();
    }
}

// Initialize
window.addEventListener('load', () => {
    updateAllViews();
});
