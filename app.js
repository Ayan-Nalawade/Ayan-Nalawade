// Portfolio data
const portfolioData = {
  "profile": {
    "name": "Ayan Nalawade",
    "age": 16,
    "location": "Ontario, CA",
    "bio": "16-year-old developer who likes working on projects that are challenging!",
    "timezone": "UTC-04:00",
    "followers": 5,
    "following": 3,
    "website": "https://ayan-nalawade.vercel.app/",
    "github": "https://github.com/Ayan-Nalawade",
    "profile_image": "https://github.com/Ayan-Nalawade.png"
  },
  "repositories": [
    {
      "name": "Chat",
      "stars": 34,
      "language": "Python",
      "description": "Access multiple models such as gpt-3/3.5, gpt-4, claude+, claude-instant, bard for free!",
      "url": "https://github.com/Ayan-Nalawade/Chat",
      "archived": true,
      "topics": ["AI", "API Integration", "Python"]
    },
    {
      "name": "JamHacks-DocsGPT",
      "stars": 3,
      "language": "TypeScript",
      "description": "Docs GPT - AI-powered documentation assistant",
      "url": "https://github.com/Ayan-Nalawade/JamHacks-DocsGPT",
      "topics": ["TypeScript", "AI", "Documentation"]
    },
    {
      "name": "PoeTokenGen",
      "stars": 2,
      "language": "Python",
      "description": "Poe Token Generation download for anyone who needs it",
      "url": "https://github.com/Ayan-Nalawade/PoeTokenGen",
      "topics": ["Python", "Authentication", "Tokens"]
    },
    {
      "name": "DocsGPT",
      "stars": 1,
      "language": "CSS",
      "description": "Docs GPT - Documentation with AI assistance",
      "url": "https://github.com/Ayan-Nalawade/DocsGPT",
      "topics": ["CSS", "Documentation", "AI"]
    },
    {
      "name": "CineMatch",
      "stars": 0,
      "language": "JavaScript",
      "description": "CineMatch is designed to provide a seamless experience for movie enthusiasts. It allows users to browse movie suggestions, manage profiles, and search for their favorite films.",
      "url": "https://github.com/Ayan-Nalawade/CineMatch",
      "topics": ["JavaScript", "React", "Movies", "Entertainment"]
    },
    {
      "name": "ListenO",
      "stars": 0,
      "language": "TypeScript",
      "description": "Listen to any song! A music streaming application built with TypeScript.",
      "url": "https://github.com/Ayan-Nalawade/ListenO",
      "topics": ["TypeScript", "Music", "Streaming", "Web APIs"]
    },
    {
      "name": "Snake",
      "stars": 0,
      "language": "Python",
      "description": "A snake game which implements PyTorch in order to play the game",
      "url": "https://github.com/Ayan-Nalawade/Snake",
      "topics": ["Python", "PyTorch", "AI/ML", "Game Development"]
    },
    {
      "name": "ChatBot",
      "stars": 0,
      "language": "TypeScript",
      "description": "A GUI version of a chatBot with modern interface",
      "url": "https://github.com/Ayan-Nalawade/ChatBot",
      "topics": ["TypeScript", "AI", "GUI", "Chat"]
    },
    {
      "name": "Ayan-Nalawade.github.io",
      "stars": 0,
      "language": "HTML",
      "description": "Personal website repository",
      "url": "https://github.com/Ayan-Nalawade/Ayan-Nalawade.github.io",
      "topics": ["HTML", "Portfolio", "Website"]
    },
    {
      "name": "DiscStorage",
      "stars": 0,
      "language": "Python",
      "description": "A simple website/code to storage images on discord",
      "url": "https://github.com/Ayan-Nalawade/DiscStorage",
      "topics": ["Python", "Discord", "Storage"]
    },
    {
      "name": "Public-Scripts",
      "stars": 0,
      "language": "Shell",
      "description": "All the scripts available to the public",
      "url": "https://github.com/Ayan-Nalawade/Public-Scripts",
      "topics": ["Shell", "Scripts", "Utilities"]
    },
    {
      "name": "Dyan-up-v1",
      "stars": 0,
      "language": "Java",
      "description": "Java application project",
      "url": "https://github.com/Ayan-Nalawade/Dyan-up-v1",
      "topics": ["Java", "Application"]
    }
  ]
};

// Language statistics based on GitHub repositories
const languageStats = {
  "Python": { "count": 6, "percentage": 27.3 },
  "TypeScript": { "count": 5, "percentage": 22.7 },
  "JavaScript": { "count": 2, "percentage": 9.1 },
  "CSS": { "count": 2, "percentage": 9.1 },
  "Java": { "count": 1, "percentage": 4.5 },
  "HTML": { "count": 1, "percentage": 4.5 },
  "Shell": { "count": 1, "percentage": 4.5 },
  "Other": { "count": 4, "percentage": 18.2 }
};

// DOM Elements
let terminalInput, terminalOutput, terminalCursor;
let commandHistory = [];
let historyIndex = -1;

// Terminal commands and their functions
const terminalCommands = {
  help: () => {
    return `Available commands:
  help      - Show this help message
  skills    - Display programming language statistics
  clear     - Clear the terminal screen
  ls        - List available information sections
  about     - Show bio and personal information
  projects  - Show top GitHub repositories
  contact   - Display contact information
  whoami    - Show user profile information`;
  },
  
  skills: () => {
    let output = `Programming Language Statistics (from GitHub repositories):\n\n`;
    
    Object.entries(languageStats).forEach(([language, data]) => {
      const barLength = Math.round(data.percentage / 5); // Scale to 20 chars max
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
      output += `${language.padEnd(12)} ${bar} ${data.percentage.toFixed(1)}% (${data.count} repos)\n`;
    });
    
    output += `\nTotal repositories analyzed: 22`;
    return output;
  },
  
  clear: () => {
    if (terminalOutput) {
      terminalOutput.innerHTML = '';
    }
    return '';
  },
  
  ls: () => {
    return `Available information sections:
  about/     - Personal information and bio
  projects/  - GitHub repositories and projects
  contact/   - Contact information and links
  skills/    - Programming language statistics`;
  },
  
  about: () => {
    return `${portfolioData.profile.name}
Age: ${portfolioData.profile.age}
Location: ${portfolioData.profile.location}
Timezone: ${portfolioData.profile.timezone}

Bio: ${portfolioData.profile.bio}

GitHub: ${portfolioData.profile.github}
Website: ${portfolioData.profile.website}
Followers: ${portfolioData.profile.followers} | Following: ${portfolioData.profile.following}`;
  },
  
  projects: () => {
    const sortedRepos = portfolioData.repositories
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 6);
    
    let output = `Top GitHub Repositories:\n\n`;
    
    sortedRepos.forEach((repo, index) => {
      const stars = repo.stars > 0 ? `⭐ ${repo.stars}` : '⭐ 0';
      const archived = repo.archived ? ' [ARCHIVED]' : '';
      output += `${index + 1}. ${repo.name} ${stars}${archived}\n`;
      output += `   Language: ${repo.language}\n`;
      output += `   ${repo.description}\n`;
      output += `   ${repo.url}\n\n`;
    });
    
    return output;
  },
  
  contact: () => {
    return `Contact Information:

Location: ${portfolioData.profile.location}
Timezone: ${portfolioData.profile.timezone}

Online Presence:
• GitHub: ${portfolioData.profile.github}
• Website: ${portfolioData.profile.website}

Hobbies & Interests:
• Chess - Strategic thinking and problem solving
• Badminton and Soccer - Staying active and competitive  
• Video Games - Gaming and interactive experiences`;
  },
  
  whoami: () => {
    return `${portfolioData.profile.name}

You are viewing the portfolio of a 16-year-old developer from Ontario, CA.
Passionate about challenging projects and innovative solutions.

Current terminal session: ayan@portfolio:~$
System: Portfolio Terminal v1.0`;
  }
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing portfolio...');
    initializeTerminal();
    initializeModal();
    renderProjects();
    initializeNavigation();
    initializeScrollAnimations();
    console.log('Portfolio initialized successfully');
});

// Initialize terminal functionality
function initializeTerminal() {
    terminalInput = document.getElementById('terminal-input');
    terminalOutput = document.getElementById('terminal-output');
    terminalCursor = document.getElementById('terminal-cursor');
    
    if (!terminalInput || !terminalOutput) {
        console.error('Terminal elements not found');
        return;
    }
    
    // Handle terminal input
    terminalInput.addEventListener('keydown', handleTerminalInput);
    
    // Focus terminal input when clicking on terminal
    const terminalContainer = document.querySelector('.terminal-container');
    if (terminalContainer) {
        terminalContainer.addEventListener('click', () => {
            terminalInput.focus();
        });
    }
    
    // Update cursor position
    terminalInput.addEventListener('input', updateCursorPosition);
    terminalInput.addEventListener('keyup', updateCursorPosition);
    
    // Initial cursor position
    updateCursorPosition();
    
    // Auto-focus terminal input
    setTimeout(() => {
        terminalInput.focus();
    }, 500);
    
    console.log('Terminal initialized');
}

// Handle terminal input and commands
function handleTerminalInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const command = terminalInput.value.trim();
        
        if (command) {
            // Add to command history
            commandHistory.unshift(command);
            if (commandHistory.length > 50) {
                commandHistory.pop();
            }
            historyIndex = -1;
            
            // Display command
            appendToTerminal(`ayan@portfolio:~$ ${command}`, 'command');
            
            // Execute command
            executeCommand(command);
        } else {
            appendToTerminal('ayan@portfolio:~$ ', 'command');
        }
        
        // Clear input
        terminalInput.value = '';
        updateCursorPosition();
        
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigateHistory(1);
        
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigateHistory(-1);
        
    } else if (e.key === 'Tab') {
        e.preventDefault();
        autoCompleteCommand();
    }
}

// Navigate command history
function navigateHistory(direction) {
    if (direction > 0 && historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex];
    } else if (direction < 0 && historyIndex > -1) {
        historyIndex--;
        terminalInput.value = historyIndex >= 0 ? commandHistory[historyIndex] : '';
    }
    updateCursorPosition();
}

// Auto-complete command
function autoCompleteCommand() {
    const input = terminalInput.value.toLowerCase();
    const commands = Object.keys(terminalCommands);
    const matches = commands.filter(cmd => cmd.startsWith(input));
    
    if (matches.length === 1) {
        terminalInput.value = matches[0];
        updateCursorPosition();
    } else if (matches.length > 1) {
        appendToTerminal(`Possible completions: ${matches.join(', ')}`);
    }
}

// Execute terminal command
function executeCommand(command) {
    const cmd = command.toLowerCase().trim();
    
    if (terminalCommands[cmd]) {
        const output = terminalCommands[cmd]();
        if (output) {
            appendToTerminal(output);
        }
    } else {
        appendToTerminal(`Command not found: ${command}. Type 'help' for available commands.`, 'error');
    }
}

// Append text to terminal output
function appendToTerminal(text, className = '') {
    const line = document.createElement('div');
    line.className = `terminal-line ${className}`;
    line.textContent = text;
    terminalOutput.appendChild(line);
    
    // Scroll to bottom
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Update cursor position
function updateCursorPosition() {
    if (!terminalInput || !terminalCursor) return;
    
    // Simple cursor positioning - just show it's active
    terminalCursor.style.display = 'inline';
}

// Initialize modal functionality
function initializeModal() {
    const modal = document.getElementById('project-modal');
    const modalClose = document.querySelector('.modal-close');
    
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal || e.target.classList.contains('modal-overlay')) {
                closeModal();
            }
        });
    }
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

// Render projects
function renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) {
        console.error('Projects grid not found');
        return;
    }
    
    // Sort repositories by stars (descending)
    const sortedRepos = portfolioData.repositories.sort((a, b) => b.stars - a.stars);
    
    projectsGrid.innerHTML = sortedRepos.map(repo => `
        <div class="project-card glass-card" data-project="${repo.name}">
            <div class="project-header">
                <div>
                    <h3 class="project-name">${repo.name}</h3>
                    ${repo.archived ? '<span class="project-status archived">Archived</span>' : ''}
                </div>
                <div class="project-stars">
                    <span>★</span>
                    <span>${repo.stars}</span>
                </div>
            </div>
            
            <div class="project-language">${repo.language}</div>
            
            <p class="project-description">${repo.description}</p>
            
            <div class="project-topics">
                ${repo.topics.map(topic => `<span class="project-topic">${topic}</span>`).join('')}
            </div>
            
            <div class="project-actions">
                <a href="${repo.url}" target="_blank" class="glass-button glass-button-primary">
                    <span>View on GitHub</span>
                </a>
                <button class="glass-button glass-button-secondary preview-btn" data-repo="${repo.name}" type="button">
                    <span>View Details</span>
                </button>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for preview buttons
    setTimeout(() => {
        document.querySelectorAll('.preview-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                const repoName = this.getAttribute('data-repo');
                openProjectModal(repoName);
            });
        });
    }, 100);
}

// Open project details modal
function openProjectModal(repoName) {
    const repo = portfolioData.repositories.find(r => r.name === repoName);
    const modal = document.getElementById('project-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('project-content');
    
    if (!repo || !modal) {
        console.error('Repository not found or modal not available:', repoName);
        return;
    }
    
    modalTitle.textContent = `${repo.name} - Project Details`;
    
    const projectDetails = `
        <div class="project-details">
            <h2>${repo.name}</h2>
            <p><strong>Language:</strong> ${repo.language}</p>
            <p><strong>Stars:</strong> ★ ${repo.stars}</p>
            ${repo.archived ? '<p><strong>Status:</strong> Archived</p>' : ''}
            
            <h3>Description</h3>
            <p>${repo.description}</p>
            
            <h3>Topics</h3>
            <div class="modal-topics">
                ${repo.topics.map(topic => `<span class="modal-topic">${topic}</span>`).join('')}
            </div>
            
            <h3>Repository</h3>
            <p>Visit the <a href="${repo.url}" target="_blank" style="color: var(--color-primary);">GitHub repository</a> to view the complete source code and documentation.</p>
            
            <div class="project-note">
                <p><em>View the complete project details and source code on GitHub.</em></p>
            </div>
        </div>
        
        <style>
            .project-details h2 {
                color: var(--color-text);
                margin-bottom: 1rem;
                font-size: 1.5rem;
            }
            
            .project-details h3 {
                color: var(--color-text);
                margin: 1.5rem 0 0.5rem 0;
                font-size: 1.2rem;
            }
            
            .project-details p {
                margin-bottom: 1rem;
                line-height: 1.6;
                color: var(--color-text-secondary);
            }
            
            .modal-topics {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }
            
            .modal-topic {
                background: rgba(var(--color-primary-rgb), 0.1);
                color: var(--color-primary);
                padding: 0.25rem 0.5rem;
                border-radius: 1rem;
                font-size: 0.8rem;
                border: 1px solid rgba(var(--color-primary-rgb), 0.3);
            }
            
            .project-note {
                background: var(--color-secondary);
                border-left: 3px solid var(--color-primary);
                padding: 1rem;
                margin-top: 2rem;
                border-radius: 0.5rem;
            }
            
            .project-note p {
                margin: 0;
                font-style: italic;
                color: var(--color-text-secondary);
            }
        </style>
    `;
    
    modalContent.innerHTML = projectDetails;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('project-modal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Initialize navigation
function initializeNavigation() {
    // Handle navigation links with proper smooth scrolling
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href').substring(1);
            console.log('Navigating to:', targetId);
            smoothScrollTo(targetId);
        });
    });
    
    // Handle hero "View Projects" button
    const viewProjectsBtn = document.querySelector('.hero-actions a[href="#projects"]');
    if (viewProjectsBtn) {
        viewProjectsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('View Projects button clicked');
            smoothScrollTo('projects');
        });
    }
    
    // Update active nav link on scroll
    window.addEventListener('scroll', updateActiveNavLink);
    
    console.log('Navigation initialized');
}

// Smooth scroll to target
function smoothScrollTo(targetId, offset = 80) {
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
        console.error('Target element not found:', targetId);
        return;
    }
    
    const targetPosition = targetElement.offsetTop - offset;
    console.log('Scrolling to position:', targetPosition);
    
    window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
    });
}

// Update active navigation link
function updateActiveNavLink() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link[href^="#"]');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.clientHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

// Initialize scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Observe all glass cards and sections
    document.querySelectorAll('.glass-card, .section-title').forEach(el => {
        observer.observe(el);
    });
}

// Add scroll animation styles
const style = document.createElement('style');
style.textContent = `
    .glass-card, .section-title {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), 
                    transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .glass-card.animate-in, .section-title.animate-in {
        opacity: 1;
        transform: translateY(0);
    }
    
    .terminal-output::-webkit-scrollbar {
        width: 6px;
    }
    
    .terminal-output::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
    }
    
    .terminal-output::-webkit-scrollbar-thumb {
        background: rgba(var(--color-primary-rgb), 0.5);
        border-radius: 3px;
    }
    
    .terminal-output::-webkit-scrollbar-thumb:hover {
        background: rgba(var(--color-primary-rgb), 0.7);
    }
`;
document.head.appendChild(style);

// Initialize on page load
window.addEventListener('load', function() {
    console.log('Ayan Nalawade Portfolio - Clean Professional Design Loaded');
});