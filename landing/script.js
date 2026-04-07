// ===== Navbar Scroll Effect =====
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== Mobile Menu Toggle =====
const mobileToggle = document.querySelector('.mobile-toggle');
const navLinks = document.querySelector('.nav-links');

mobileToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    mobileToggle.classList.toggle('active');
});

// Close mobile menu on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
    });
});

// ===== Number Counter Animation =====
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    counters.forEach(counter => {
        const target = +counter.getAttribute('data-target');
        const duration = 2000;
        const step = target / (duration / 16);
        let current = 0;

        const update = () => {
            current += step;
            if (current < target) {
                counter.textContent = Math.floor(current);
                requestAnimationFrame(update);
            } else {
                counter.textContent = target;
            }
        };
        update();
    });
}

// ===== Scroll Reveal =====
function setupReveal() {
    const revealElements = document.querySelectorAll(
        '.highlight-card, .section-grid, .section-header, .cta-grid, .eco-card'
    );
    revealElements.forEach(el => el.classList.add('reveal'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.15 });

    revealElements.forEach(el => observer.observe(el));
}

// ===== Trigger counter when hero is visible =====
const heroObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            animateCounters();
            heroObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

heroObserver.observe(document.querySelector('.hero-stats'));

// ===== Form Handling =====
const form = document.getElementById('contactForm');
const submitBtn = document.getElementById('submitBtn');
const formSuccess = document.getElementById('formSuccess');

if (form) {
    // Set the _next redirect to current page
    const nextInput = form.querySelector('input[name="_next"]');
    if (nextInput) {
        nextInput.value = window.location.href;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');

        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        submitBtn.disabled = true;

        try {
            const payload = {
                name: document.getElementById('name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                line: document.getElementById('line').value.trim(),
            };

            const response = await fetch('/api/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                form.style.display = 'none';
                formSuccess.style.display = 'block';
            } else {
                throw new Error('送出失敗');
            }
        } catch (error) {
            alert('表單送出時發生錯誤，請稍後再試或直接與我們聯繫。');
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

// ===== Smooth scroll for anchor links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    });
});

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
    setupReveal();
});
