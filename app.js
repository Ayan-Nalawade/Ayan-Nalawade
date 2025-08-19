// Portfolio JavaScript - Animations and Interactions
class PortfolioApp {
    constructor() {
        this.init();
    }

    init() {
        this.setupLoader();
        this.setupNavigation();
        this.setupScrollAnimations();
        this.setupSkillBars();
        this.setupParallax();
        this.setupSmoothScrolling();
        this.setupMobileNav();
    }

    // Loading Animation
    setupLoader() {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const loader = document.getElementById('loader');
                if (loader) {
                    loader.classList.add('hidden');
                    
                    // Start hero animations after loader
                    setTimeout(() => {
                        this.startHeroAnimations();
                    }, 500);
                }
            }, 2000); // Show loader for 2 seconds
        });
    }

    startHeroAnimations() {
        // Hero animations are handled by CSS, but we can add additional JS animations here
        const heroElements = document.querySelectorAll('.hero-greeting, .hero-subtitle, .hero-location, .hero-actions, .hero-scroll');
        heroElements.forEach((element, index) => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }

    // Navigation
    setupNavigation() {
        const nav = document.getElementById('nav');
        const navLinks = document.querySelectorAll('.nav-link');

        // Update active nav link on scroll
        window.addEventListener('scroll', () => {
            const scrollPos = window.scrollY + 100;
            
            // Add/remove nav background based on scroll
            if (scrollPos > 100) {
                nav.style.background = 'rgba(31, 33, 33, 0.98)';
                nav.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
            } else {
                nav.style.background = 'rgba(31, 33, 33, 0.95)';
                nav.style.boxShadow = 'none';
            }

            // Update active nav link
            const sections = document.querySelectorAll('section[id]');
            sections.forEach(section => {
                const sectionTop = section.offsetTop - 150;
                const sectionBottom = sectionTop + section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                    navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        });
    }

    // Mobile Navigation
    setupMobileNav() {
        const navToggle = document.getElementById('nav-toggle');
        const navMenu = document.querySelector('.nav-menu');

        if (navToggle && navMenu) {
            navToggle.addEventListener('click', () => {
                navToggle.classList.toggle('active');
                navMenu.classList.toggle('active');
            });

            // Close mobile menu when clicking on a link
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    navToggle.classList.remove('active');
                    navMenu.classList.remove('active');
                });
            });
        }
    }

    // Scroll Animations using Intersection Observer
    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    
                    // Special handling for different sections
                    if (entry.target.classList.contains('skills')) {
                        this.animateSkillBars();
                    }
                    
                    if (entry.target.classList.contains('projects')) {
                        this.animateProjectCards();
                    }
                }
            });
        }, observerOptions);

        // Observe all sections and cards
        const elementsToAnimate = document.querySelectorAll('.section, .about-card, .interest-card, .skill-category, .project-card, .contact-card');
        elementsToAnimate.forEach(el => {
            el.classList.add('animate-in');
            observer.observe(el);
        });

        // Additional animations for specific elements
        this.setupStaggeredAnimations();
    }

    setupStaggeredAnimations() {
        const staggerObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const items = entry.target.querySelectorAll('.interest-card, .project-card, .contact-card');
                    items.forEach((item, index) => {
                        setTimeout(() => {
                            item.style.opacity = '1';
                            item.style.transform = 'translateY(0)';
                        }, index * 100);
                    });
                }
            });
        }, { threshold: 0.1 });

        const staggerContainers = document.querySelectorAll('.interests-grid, .projects-grid, .contact-info');
        staggerContainers.forEach(container => {
            const items = container.querySelectorAll('.interest-card, .project-card, .contact-card');
            items.forEach(item => {
                item.style.opacity = '0';
                item.style.transform = 'translateY(30px)';
                item.style.transition = 'all 0.6s ease-out';
            });
            staggerObserver.observe(container);
        });
    }

    // Skill Bar Animations
    setupSkillBars() {
        this.skillBarsAnimated = false;
    }

    animateSkillBars() {
        if (this.skillBarsAnimated) return;
        this.skillBarsAnimated = true;

        const skillBars = document.querySelectorAll('.skill-progress');
        skillBars.forEach((bar, index) => {
            const progress = bar.getAttribute('data-progress') || '0';
            setTimeout(() => {
                bar.style.width = `${progress}%`;
            }, index * 200);
        });
    }

    // Project Cards Animation
    animateProjectCards() {
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 150);
        });
    }

    // Parallax Effects
    setupParallax() {
        const heroBackground = document.querySelector('.hero-particles');
        
        if (heroBackground) {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const parallaxSpeed = 0.5;
                
                if (scrolled < window.innerHeight) {
                    heroBackground.style.transform = `translate3d(0, ${scrolled * parallaxSpeed}px, 0)`;
                }
            });
        }

        // Add parallax to section backgrounds
        const sections = document.querySelectorAll('.section');
        sections.forEach(section => {
            window.addEventListener('scroll', () => {
                const scrolled = window.pageYOffset;
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                
                if (scrolled + window.innerHeight > sectionTop && scrolled < sectionTop + sectionHeight) {
                    const parallaxValue = (scrolled - sectionTop) * 0.1;
                    section.style.transform = `translateY(${parallaxValue}px)`;
                }
            });
        });
    }

    // Smooth Scrolling - Enhanced to fix navigation issues
    setupSmoothScrolling() {
        // Handle smooth scrolling for all anchor links including nav and hero buttons
        const anchorLinks = document.querySelectorAll('a[href^="#"]');
        
        anchorLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');
                
                // Skip empty hash or just "#"
                if (!href || href === '#' || href.length <= 1) {
                    return;
                }
                
                e.preventDefault();
                
                const targetId = href.substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    // Calculate offset position
                    const navHeight = 80;
                    const offsetTop = targetSection.offsetTop - navHeight;
                    
                    // Smooth scroll to target
                    window.scrollTo({
                        top: Math.max(0, offsetTop),
                        behavior: 'smooth'
                    });
                    
                    // Update URL hash without jumping
                    setTimeout(() => {
                        if (history.pushState) {
                            history.pushState(null, null, href);
                        }
                    }, 100);
                    
                    // Update nav link active state
                    this.updateActiveNavLink(targetId);
                }
            });
        });

        // Also handle the scroll indicator in hero section
        const scrollIndicator = document.querySelector('.hero-scroll');
        if (scrollIndicator) {
            scrollIndicator.addEventListener('click', () => {
                const aboutSection = document.getElementById('about');
                if (aboutSection) {
                    const offsetTop = aboutSection.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            });
        }
    }

    updateActiveNavLink(targetId) {
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${targetId}`) {
                link.classList.add('active');
            }
        });
    }

    // Additional Interactive Effects
    setupInteractiveEffects() {
        // Hover effects for project cards
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-15px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // Hover effects for skill tags
        const skillTags = document.querySelectorAll('.skill-tag');
        skillTags.forEach(tag => {
            tag.addEventListener('mouseenter', () => {
                tag.style.transform = 'scale(1.1) rotate(2deg)';
                tag.style.background = 'var(--color-primary-hover)';
            });
            
            tag.addEventListener('mouseleave', () => {
                tag.style.transform = 'scale(1) rotate(0deg)';
                tag.style.background = 'var(--color-primary)';
            });
        });

        // Button hover effects
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('mouseenter', () => {
                button.style.transform = 'translateY(-2px)';
                button.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)';
            });
            
            button.addEventListener('mouseleave', () => {
                button.style.transform = 'translateY(0)';
                button.style.boxShadow = 'none';
            });
        });
    }

    // Typing Animation for Hero Subtitle
    setupTypingAnimation() {
        const typingText = document.querySelector('.typing-text');
        if (typingText) {
            const text = typingText.textContent;
            typingText.textContent = '';
            
            let index = 0;
            const typeWriter = () => {
                if (index < text.length) {
                    typingText.textContent += text.charAt(index);
                    index++;
                    setTimeout(typeWriter, 50);
                } else {
                    // Remove cursor after typing is complete
                    setTimeout(() => {
                        typingText.style.borderRight = 'none';
                    }, 1000);
                }
            };
            
            // Start typing after hero name animation
            setTimeout(typeWriter, 2200);
        }
    }

    // Performance optimizations
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Preload animations
    preloadAnimations() {
        // Preload critical CSS animations
        const style = document.createElement('style');
        style.textContent = `
            .preload-animations * {
                transition-duration: 0s !important;
                animation-duration: 0s !important;
            }
        `;
        document.head.appendChild(style);
        
        // Remove preload class after a short delay
        setTimeout(() => {
            document.body.classList.remove('preload-animations');
            document.head.removeChild(style);
        }, 100);
    }
}

// Utility functions
const Utils = {
    // Debounce function for performance
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Check if element is in viewport
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    // Animate number counter
    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.innerHTML = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
};

// Enhanced scroll performance
let ticking = false;
function updateOnScroll() {
    if (!ticking) {
        requestAnimationFrame(() => {
            // Scroll-dependent updates go here
            ticking = false;
        });
        ticking = true;
    }
}

window.addEventListener('scroll', updateOnScroll);

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Add preload class to prevent animation flash
    document.body.classList.add('preload-animations');
    
    // Initialize main app
    const app = new PortfolioApp();
    app.setupInteractiveEffects();
    app.setupTypingAnimation();
    app.preloadAnimations();
    
    // Add some additional interactive features
    setTimeout(() => {
        const letters = document.querySelectorAll('.hero-name .letter');
        letters.forEach((letter, index) => {
            letter.addEventListener('mouseenter', () => {
                letter.style.transform = 'translateY(-10px) rotateX(15deg) scale(1.1)';
                letter.style.color = 'var(--color-primary)';
                letter.style.textShadow = '0 5px 15px rgba(33, 128, 141, 0.3)';
            });
            
            letter.addEventListener('mouseleave', () => {
                letter.style.transform = 'translateY(0) rotateX(0deg) scale(1)';
                letter.style.color = '';
                letter.style.textShadow = '';
            });
        });
    }, 3000);
    
    // Console message for developers
    console.log('👋 Welcome to Ayan\'s Portfolio!\n🚀 Built with modern web technologies\n💫 Smooth animations and interactions\n📱 Fully responsive design');
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Pause heavy animations when tab is not visible
        document.body.classList.add('page-hidden');
    } else {
        // Resume animations when tab becomes visible
        document.body.classList.remove('page-hidden');
    }
});

// Handle resize events
window.addEventListener('resize', Utils.debounce(() => {
    // Recalculate positions and animations on resize
    const app = new PortfolioApp();
    // Only reinitialize necessary components
}, 250));

// Custom cursor effect (optional enhancement)
function createCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: var(--color-primary);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        opacity: 0;
        transition: all 0.3s ease;
        transform: translate(-50%, -50%);
    `;
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
        cursor.style.opacity = '0.7';
    });
    
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = '0';
    });
    
    // Enhance cursor on hover over interactive elements
    const interactiveElements = document.querySelectorAll('a, button, .project-card, .skill-tag');
    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
            cursor.style.background = 'var(--color-primary-hover)';
        });
        
        el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%, -50%) scale(1)';
            cursor.style.background = 'var(--color-primary)';
        });
    });
}

// Initialize custom cursor on desktop devices
if (window.innerWidth > 768) {
    createCustomCursor();
}