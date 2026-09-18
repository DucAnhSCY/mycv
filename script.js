/* ========================================
   Matrix Rain Effect
   ======================================== */
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ<>{}[];:=+-*/&|^~!@#$%';
const fontSize = 14;
let columns = Math.floor(canvas.width / fontSize);
let drops = Array(columns).fill(1);

function drawMatrix() {
    ctx.fillStyle = 'rgba(10, 14, 23, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#00ff88';
    ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;
    
    for (let i = 0; i < drops.length; i++) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);
        
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
        }
        drops[i]++;
    }
}

setInterval(drawMatrix, 60);

window.addEventListener('resize', () => {
    columns = Math.floor(canvas.width / fontSize);
    drops = Array(columns).fill(1);
});

/* ========================================
   Cursor Glow Effect
   ======================================== */
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0;

document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.style.left = mouseX + 'px';
    cursorGlow.style.top = mouseY + 'px';
    cursorGlow.style.opacity = '1';
});

document.addEventListener('mouseleave', () => {
    cursorGlow.style.opacity = '0';
});

/* ========================================
   Navbar Scroll Effect
   ======================================== */
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('.section, .hero');

window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    
    // Navbar background
    if (scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    // Active nav link
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 200;
        if (scrollY >= sectionTop) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
});

/* ========================================
   Mobile Navigation
   ======================================== */
const navToggle = document.getElementById('navToggle');
const navLinksContainer = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    navLinksContainer.classList.toggle('active');
});

navLinksContainer.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinksContainer.classList.remove('active');
    });
});

/* ========================================
   Typewriter Effect
   ======================================== */
const typewriterText = document.getElementById('typewriterText');
const phrases = [
    'Cybersecurity & AIOps Specialist',
    'SOC / SecOps Engineer',
    'Malware Behavior Analyst',
    'Security Intern @ CMC CS',
    'IT Student @ CMC University',
    'Backend Developer',
    'AIOps Platform Builder',
    'Building a Safer Digital World'
];

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typingSpeed = 80;

function typeWriter() {
    const currentPhrase = phrases[phraseIndex];
    
    if (isDeleting) {
        typewriterText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 40;
    } else {
        typewriterText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 80;
    }
    
    if (!isDeleting && charIndex === currentPhrase.length) {
        typingSpeed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typingSpeed = 400;
    }
    
    setTimeout(typeWriter, typingSpeed);
}

typeWriter();

/* ========================================
   Counter Animation
   ======================================== */
function animateCounters() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    statNumbers.forEach(stat => {
        const target = parseFloat(stat.dataset.count);
        const isDecimal = target % 1 !== 0;
        const duration = 2000;
        const startTime = performance.now();
        
        function updateCounter(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const current = target * easeOutCubic;
            
            if (isDecimal) {
                stat.textContent = current.toFixed(2);
            } else {
                stat.textContent = Math.floor(current);
            }
            
            if (progress < 1) {
                requestAnimationFrame(updateCounter);
            } else {
                if (isDecimal) {
                    stat.textContent = target.toFixed(2);
                } else {
                    stat.textContent = target;
                }
            }
        }
        
        requestAnimationFrame(updateCounter);
    });
}

/* ========================================
   GPA Bar Animation
   ======================================== */
function animateGPABar() {
    const gpaFill = document.querySelector('.gpa-fill');
    if (gpaFill) {
        const targetWidth = gpaFill.dataset.gpa;
        gpaFill.style.width = targetWidth + '%';
    }
}

/* ========================================
   Scroll Reveal (Intersection Observer)
   ======================================== */
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            
            // Trigger specific animations
            if (entry.target.closest('#hero')) {
                animateCounters();
            }
            if (entry.target.closest('#education')) {
                animateGPABar();
            }
        }
    });
}, observerOptions);

// Apply reveal to major elements
document.querySelectorAll('.about-card, .about-intro, .info-card, .timeline-card, .project-card, .skill-category, .edu-card, .cert-card, .interest-item, .contact-card').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
});

// Also observe hero stats
const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
    revealObserver.observe(heroStats);
}

const eduSection = document.querySelector('#education');
if (eduSection) {
    revealObserver.observe(eduSection);
}

/* ========================================
   Smooth Scroll for Navigation
   ======================================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

/* ========================================
   Project Card Tilt Effect
   ======================================== */
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const rotateX = (y - centerY) / 20;
        const rotateY = (centerX - x) / 20;
        
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
        
        // Move glow
        const glow = card.querySelector('.project-glow');
        if (glow) {
            glow.style.left = x - rect.width + 'px';
            glow.style.top = y - rect.height + 'px';
        }
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
    });
});

/* ========================================
   Page Load Animation
   ======================================== */
window.addEventListener('load', () => {
    document.body.style.opacity = '1';
    
    // Trigger hero counter after a delay
    setTimeout(animateCounters, 1200);
});

/* ========================================
   Console Easter Egg
   ======================================== */
console.log('%c🛡️ Phung Duc Anh | Cybersecurity Portfolio', 'color: #00ff88; font-size: 20px; font-weight: bold; font-family: monospace;');
console.log('%cHey there, curious hacker! 👋', 'color: #00b4d8; font-size: 14px; font-family: monospace;');
console.log('%cIf you\'re inspecting this, we might be a great match. Let\'s connect!', 'color: #8b949e; font-size: 12px; font-family: monospace;');
