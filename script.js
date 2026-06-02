const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwoKZBZTNIrDTbN5xC1W1nmIMXp0cmFCmyhOrQIDVaAI2rbtspgjVzfU5NPzbvYMSSD/exec';

const form = document.getElementById('guestForm');
const statusDiv = document.getElementById('formStatus');
const submitBtn = document.getElementById('submitBtn');
const scrollLine = document.querySelector('.scroll-line span');
const navLinks = [...document.querySelectorAll('.quick-nav a')];
const sections = [...document.querySelectorAll('section[id]')];

function getSelectedDrinks() {
    const checkboxes = document.querySelectorAll('.drink-options input[type="checkbox"]');
    const selected = [];

    checkboxes.forEach((checkbox) => {
        if (checkbox.checked) selected.push(checkbox.value);
    });

    return selected.length ? selected.join(', ') : 'Не указано';
}

function getVenchanieAnswer() {
    const selectedRadio = document.querySelector('input[name="venchanie"]:checked');
    return selectedRadio ? selectedRadio.value : 'Не указано';
}

function saveToLocalStorage(data) {
    try {
        const saved = localStorage.getItem('wedding_guests');
        const guests = saved ? JSON.parse(saved) : [];
        guests.push(data);
        localStorage.setItem('wedding_guests', JSON.stringify(guests));
    } catch (error) {
        console.warn('Не удалось сохранить резервную копию:', error);
    }
}

if (form) {
    form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const fullname = document.getElementById('fullname').value.trim();
        if (!fullname) {
            statusDiv.innerHTML = '<div class="error-msg">Пожалуйста, укажите ваше ФИО 💌</div>';
            return;
        }

        const checkedAttendance = document.querySelector('input[name="attendance"]:checked');
        if (!checkedAttendance) {
            statusDiv.innerHTML = '<div class="error-msg">Подтвердите, пожалуйста, сможете ли вы быть ❤️</div>';
            return;
        }

        const attendanceValue = checkedAttendance.value;
        const venchanieValue = getVenchanieAnswer(); 
        const drinks = getSelectedDrinks();

        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем...';
        statusDiv.innerHTML = '';

        const formData = {
            fullname: fullname,
            attendance: attendanceValue,
            venchanie: venchanieValue,   // <- НОВОЕ ПОЛЕ
            drinks: drinks,
            timestamp: new Date().toLocaleString('ru-RU')
        };

        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            saveToLocalStorage(formData);

            let successMessage = attendanceValue === 'Приду с радостью!'
                ? `Спасибо, ${fullname}! Ждём вас на празднике ❤️ Напитки: ${drinks}.`
                : `Очень жаль, ${fullname}, что не сможете быть. Спасибо за ответ ❤️`;
            
            if (venchanieValue !== 'Не указано') {
                successMessage += ` Ответ про венчание: ${venchanieValue}.`;
            }

            statusDiv.innerHTML = `<div class="success-msg">${successMessage}<br><span>Ответ сохранён в таблице организаторов.</span></div>`;
            form.reset();
        } catch (error) {
            console.error('Ошибка отправки:', error);
            statusDiv.innerHTML = '<div class="error-msg">Ошибка отправки. Попробуйте ещё раз или напишите в Telegram-чат.</div>';
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Отправить ответ';
        }
    });
}

function updateScrollProgress() {
    if (!scrollLine) return;

    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const progress = max > 0 ? (window.scrollY / max) * 100 : 0;
    scrollLine.style.width = `${Math.min(100, Math.max(0, progress))}%`;
}

window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.16 });

document.querySelectorAll('.reveal').forEach((item, index) => {
    item.style.transitionDelay = `${Math.min(index % 5, 4) * 70}ms`;
    revealObserver.observe(item);
});

const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const activeId = entry.target.id;
        navLinks.forEach((link) => {
            const href = link.getAttribute('href')?.replace('#', '');
            link.classList.toggle('is-active', href === activeId);
        });
    });
}, { threshold: 0.46 });

sections.forEach((section) => navObserver.observe(section));

document.querySelectorAll('[data-tilt]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(900px) rotateX(${-y * 4}deg) rotateY(${x * 4}deg)`;
    });

    card.addEventListener('pointerleave', () => {
        card.style.transform = '';
    });
});

const lightbox = document.getElementById('lightbox');
const lightboxImg = lightbox?.querySelector('img');
const lightboxClose = lightbox?.querySelector('.lightbox-close');

function openLightbox(src) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
}

document.querySelectorAll('.mood-card').forEach((button) => {
    button.addEventListener('click', () => openLightbox(button.dataset.image));
});

lightboxClose?.addEventListener('click', closeLightbox);
lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeLightbox();
});

const heroHotspots = [...document.querySelectorAll('.person-hotspot')];
const heroBubbles = [...document.querySelectorAll('.quote-bubble')];
let bubbleTimer = null;

function closeHeroBubbles() {
    heroBubbles.forEach((bubble) => {
        bubble.classList.remove('is-open');
        bubble.setAttribute('aria-hidden', 'true');
    });
    heroHotspots.forEach((spot) => spot.classList.remove('is-active'));
}

function openHeroBubble(targetId) {
    if (!targetId) return;
    closeHeroBubbles();

    const bubble = document.getElementById(targetId);
    const hotspot = heroHotspots.find((spot) => spot.dataset.bubbleTarget === targetId);
    if (!bubble) return;

    bubble.classList.add('is-open');
    bubble.setAttribute('aria-hidden', 'false');
    hotspot?.classList.add('is-active');
}

heroHotspots.forEach((spot) => {
    const targetId = spot.dataset.bubbleTarget;

    spot.addEventListener('click', (event) => {
        event.stopPropagation();
        const bubble = document.getElementById(targetId);
        const isOpen = bubble?.classList.contains('is-open');

        if (isOpen) {
            closeHeroBubbles();
            return;
        }

        openHeroBubble(targetId);

        if (bubbleTimer) clearTimeout(bubbleTimer);
        bubbleTimer = setTimeout(closeHeroBubbles, 4500);
    });

    spot.addEventListener('mouseenter', () => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        if (bubbleTimer) clearTimeout(bubbleTimer);
        openHeroBubble(targetId);
    });

    spot.addEventListener('mouseleave', () => {
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        bubbleTimer = setTimeout(closeHeroBubbles, 220);
    });

    spot.addEventListener('focus', () => openHeroBubble(targetId));
    spot.addEventListener('blur', () => closeHeroBubbles());
});

document.addEventListener('click', (event) => {
    if (!event.target.closest('.hero-photo')) closeHeroBubbles();
});