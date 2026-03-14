/* ════════════════════════════════════════════════════════════════
   SAKHI ANIMATIONS — Heavy animations, scroll reveals,
   floating particles, and add-to-cart effects
   ════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Intersection Observer for Scroll-Reveal Animations ──────
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('sakhi-revealed');
                // Stagger children
                const children = entry.target.querySelectorAll('.sakhi-stagger');
                children.forEach((child, i) => {
                    child.style.transitionDelay = `${i * 0.1}s`;
                    child.classList.add('sakhi-revealed');
                });
            }
        });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    // ── Apply reveal observers to sections and cards ────────────
    function initScrollReveal() {
        // Sections
        document.querySelectorAll(
            '.shopify-section, .section-wrapper, section, ' +
            '.sakhi-category-card, .sakhi-product-card, ' +
            '.product-card, .card, [class*="product-card"]'
        ).forEach((el) => {
            if (!el.classList.contains('sakhi-reveal')) {
                el.classList.add('sakhi-reveal');
                revealObserver.observe(el);
            }
        });

        // Stagger items inside grids
        document.querySelectorAll(
            '.sakhi-categories-grid > *, .sakhi-products-grid > *, ' +
            '[class*="product-list"] [class*="product-card"]'
        ).forEach((el) => {
            el.classList.add('sakhi-stagger', 'sakhi-reveal');
            revealObserver.observe(el);
        });
    }

    // ── Floating Particles Background ───────────────────────────
    function createParticles() {
        const container = document.createElement('div');
        container.className = 'sakhi-particles';
        container.setAttribute('aria-hidden', 'true');
        document.body.appendChild(container);

        const shapes = ['circle', 'star', 'heart', 'diamond'];
        const colors = [
            'rgba(193,122,142,0.15)',  // blush
            'rgba(212,168,83,0.12)',   // gold
            'rgba(155,125,196,0.1)',   // lavender
            'rgba(123,174,127,0.1)',   // mint
            'rgba(240,228,220,0.2)',   // cream
        ];

        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'sakhi-particle';

            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 16 + 6;
            const startX = Math.random() * 100;
            const duration = Math.random() * 20 + 15;
            const delay = Math.random() * -25;
            const drift = (Math.random() - 0.5) * 200;

            particle.style.cssText = `
        left: ${startX}%;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        animation-duration: ${duration}s;
        animation-delay: ${delay}s;
        --drift: ${drift}px;
      `;

            if (shape === 'star') {
                particle.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
            } else if (shape === 'heart') {
                particle.style.borderRadius = '50% 50% 0 0';
                particle.style.transform = 'rotate(-45deg)';
            } else if (shape === 'diamond') {
                particle.style.clipPath = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
            } else {
                particle.style.borderRadius = '50%';
            }

            container.appendChild(particle);
        }
    }

    // ── Sparkle cursor trail ────────────────────────────────────
    function initCursorSparkle() {
        let throttle = false;
        document.addEventListener('mousemove', (e) => {
            if (throttle) return;
            throttle = true;
            setTimeout(() => { throttle = false; }, 80);

            const sparkle = document.createElement('div');
            sparkle.className = 'sakhi-sparkle';
            sparkle.style.left = e.clientX + 'px';
            sparkle.style.top = e.clientY + 'px';
            document.body.appendChild(sparkle);

            setTimeout(() => sparkle.remove(), 800);
        });
    }

    // ── Add to Cart Animation ───────────────────────────────────
    function initAddToCartAnimation() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest(
                '[class*="add-to-cart"], [name="add"], button[type="submit"][class*="button"],' +
                'form[action*="/cart/add"] button[type="submit"]'
            );
            if (!btn) return;

            // 1. Button pulse animation
            btn.classList.add('sakhi-cart-pulse');
            setTimeout(() => btn.classList.remove('sakhi-cart-pulse'), 600);

            // 2. Flying product image to cart icon
            const productCard = btn.closest('[class*="product"], .shopify-section');
            const productImg = productCard
                ? productCard.querySelector('img')
                : null;
            const cartIcon = document.querySelector(
                '[class*="cart"] .svg-wrapper, [class*="cart-icon"], ' +
                'a[href="/cart"], [data-testid*="cart"]'
            );

            if (productImg && cartIcon) {
                flyToCart(productImg, cartIcon);
            }

            // 3. Cart icon bounce
            if (cartIcon) {
                cartIcon.classList.add('sakhi-cart-bounce');
                setTimeout(() => cartIcon.classList.remove('sakhi-cart-bounce'), 800);
            }

            // 4. Success confetti burst
            createConfetti(btn);
        });
    }

    function flyToCart(imgEl, cartEl) {
        const imgRect = imgEl.getBoundingClientRect();
        const cartRect = cartEl.getBoundingClientRect();

        const flyImg = document.createElement('div');
        flyImg.className = 'sakhi-fly-to-cart';
        flyImg.style.backgroundImage = `url(${imgEl.src || imgEl.querySelector('img')?.src || ''})`;
        flyImg.style.left = imgRect.left + imgRect.width / 2 + 'px';
        flyImg.style.top = imgRect.top + imgRect.height / 2 + 'px';
        flyImg.style.setProperty('--cart-x', (cartRect.left + cartRect.width / 2) + 'px');
        flyImg.style.setProperty('--cart-y', (cartRect.top + cartRect.height / 2) + 'px');

        document.body.appendChild(flyImg);
        setTimeout(() => flyImg.remove(), 900);
    }

    function createConfetti(origin) {
        const rect = origin.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const colors = ['#C17A8E', '#D4A853', '#9B7DC4', '#7BAE7F', '#FFF0F3'];

        for (let i = 0; i < 18; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'sakhi-confetti';
            const angle = (Math.PI * 2 / 18) * i;
            const velocity = 60 + Math.random() * 50;
            const dx = Math.cos(angle) * velocity;
            const dy = Math.sin(angle) * velocity;

            confetti.style.cssText = `
        left: ${cx}px;
        top: ${cy}px;
        background: ${colors[i % colors.length]};
        --dx: ${dx}px;
        --dy: ${dy}px;
      `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 900);
        }
    }

    // ── Parallax on hero sections ───────────────────────────────
    function initParallax() {
        const heroes = document.querySelectorAll('.hero, [class*="hero"]');
        if (!heroes.length) return;

        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            heroes.forEach((hero) => {
                const media = hero.querySelector('.hero__media, img, video');
                if (media && scrollY < window.innerHeight) {
                    media.style.transform = `translateY(${scrollY * 0.3}px) scale(1.05)`;
                }
            });
        }, { passive: true });
    }

    // ── Hover tilt effect on product cards ──────────────────────
    function initCardTilt() {
        document.querySelectorAll(
            '.product-card, .card, .sakhi-product-card, .sakhi-category-card, [class*="product-card"]'
        ).forEach((card) => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                card.style.transform = `
          perspective(800px)
          rotateY(${x * 8}deg)
          rotateX(${-y * 8}deg)
          translateY(-6px)
          scale(1.02)
        `;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                card.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            });
        });
    }

    // ── Magnetic buttons ────────────────────────────────────────
    function initMagneticButtons() {
        document.querySelectorAll('.button, .btn, .btn-ai').forEach((btn) => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
            });
        });
    }

    // ── Smooth count-up for prices ──────────────────────────────
    function initPriceCountUp() {
        const priceObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !entry.target.dataset.counted) {
                    entry.target.dataset.counted = 'true';
                    const text = entry.target.textContent;
                    const match = text.match(/[\d,]+\.?\d*/);
                    if (!match) return;

                    const target = parseFloat(match[0].replace(/,/g, ''));
                    const prefix = text.substring(0, text.indexOf(match[0]));
                    const suffix = text.substring(text.indexOf(match[0]) + match[0].length);
                    const duration = 1000;
                    const start = performance.now();

                    function step(now) {
                        const elapsed = now - start;
                        const progress = Math.min(elapsed / duration, 1);
                        const ease = 1 - Math.pow(1 - progress, 3);
                        const current = Math.floor(target * ease);
                        entry.target.textContent = prefix + current.toLocaleString('en-IN') + suffix;
                        if (progress < 1) requestAnimationFrame(step);
                        else entry.target.textContent = text;
                    }
                    requestAnimationFrame(step);
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.sakhi-price-current, .price, [class*="price"] .money').forEach((el) => {
            priceObserver.observe(el);
        });
    }

    // ── Text typing effect for headings ─────────────────────────
    function initTypingEffect() {
        const headingObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !entry.target.dataset.typed) {
                    entry.target.dataset.typed = 'true';
                    const text = entry.target.textContent;
                    entry.target.textContent = '';
                    entry.target.style.borderRight = '2px solid var(--sakhi-blush, #C17A8E)';
                    let i = 0;
                    const interval = setInterval(() => {
                        entry.target.textContent += text[i];
                        i++;
                        if (i >= text.length) {
                            clearInterval(interval);
                            setTimeout(() => {
                                entry.target.style.borderRight = 'none';
                            }, 500);
                        }
                    }, 40);
                }
            });
        }, { threshold: 0.5 });

        // Only apply to specific hero headings
        document.querySelectorAll('.hero__heading, .hero h1, .hero h2').forEach((el) => {
            headingObserver.observe(el);
        });
    }

    // ── Initialize Everything ───────────────────────────────────
    function init() {
        initScrollReveal();
        createParticles();
        initAddToCartAnimation();
        initParallax();
        initCardTilt();
        initMagneticButtons();
        initPriceCountUp();

        // Delayed inits
        setTimeout(initCursorSparkle, 2000);

        // Re-initialize on Shopify section render (theme editor)
        document.addEventListener('shopify:section:load', () => {
            initScrollReveal();
            initCardTilt();
            initMagneticButtons();
            initPriceCountUp();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
