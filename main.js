const burger = document.getElementById('burger');
const nav = document.getElementById('mainNav');
burger.addEventListener('click', () => nav.classList.toggle('open'));
document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
});

// Form
const form = document.getElementById('contactForm');
const successMessage = document.getElementById('successMessage');
form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Проверка: при локальном открытии файла (file://) FormSubmit AJAX не работает из-за CORS
    if (window.location.protocol === 'file:') {
        const name = form.name.value || 'Клиент';
        const contactVal = form.contact.value || '';
        const service = form.service.value || 'Не указана';
        const message = form.message.value || '';
        const body = encodeURIComponent(
            'Имя: ' + name + '\nКонтакт: ' + contactVal + '\nУслуга: ' + service + '\nСообщение: ' + message
        );
        window.location.href = 'mailto:alexrus9999@gmail.com?subject=' + encodeURIComponent('Новая заявка с сайта') + '&body=' + body;
        return;
    }

    const button = form.querySelector('.btn-submit');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.textContent = 'Отправка...';

    fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
    }).then(response => {
        if (!response.ok) {
            throw new Error('HTTP ' + response.status);
        }
        return response.json();
    }).then(data => {
        if (data.success) {
            form.reset();
            form.style.display = 'none';
            successMessage.classList.add('show');
            setTimeout(() => { form.style.display = ''; successMessage.classList.remove('show'); }, 5000);
        } else if (data.message && data.message.toLowerCase().includes('confirm')) {
            // Email не активирован — перенаправляем на обычную отправку для получения письма активации
            alert('Необходимо активировать email в FormSubmit. Сейчас откроется страница активации.');
            form.removeEventListener('submit', arguments.callee);
            form.submit();
        } else {
            alert(data.message || 'Не удалось отправить заявку. Попробуйте позже.');
        }
    }).catch(err => {
        if (err.message && err.message.includes('Failed to fetch')) {
            alert('Не удалось отправить. Убедитесь, что сайт открыт через http(s):// (не file://) и интернет подключён.');
        } else {
            alert('Ошибка соединения. Проверьте интернет и попробуйте снова.');
        }
    }).finally(() => {
        button.disabled = false;
        button.innerHTML = originalText;
    });
});
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.service-card, .advantage-card, .step').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// Quiz
(function() {
    const QUESTIONS = [
        {
            short: 'Бизнес',
            title: 'Какой у вас тип бизнеса?',
            options: [
                { icon: '\u{1F6D2}', label: 'Интернет-магазин' },
                { icon: '\u{1F6E0}\u{FE0F}', label: 'Сфера услуг' },
                { icon: '\u{1F3EC}', label: 'Офлайн-магазин или точка' },
                { icon: '\u{1F464}', label: 'Личный бренд или эксперт' }
            ]
        },
        {
            short: 'Реклама',
            title: 'Запускали ли вы раньше рекламу?',
            options: [
                { icon: '\u{1F680}', label: 'Нет, буду запускать впервые' },
                { icon: '\u{1F50D}', label: 'Только Яндекс Директ' },
                { icon: '\u{1F4F1}', label: 'Только реклама ВКонтакте' },
                { icon: '\u{26A1}', label: 'Использую оба канала' }
            ]
        },
        {
            short: 'Бюджет',
            title: 'Какой бюджет на рекламу в месяц?',
            options: [
                { icon: '\u{1F4B0}', label: 'До 50 000 \u20BD' },
                { icon: '\u{1F4B5}', label: '50 000 \u2013 150 000 \u20BD' },
                { icon: '\u{1F4B8}', label: '150 000 \u2013 500 000 \u20BD' },
                { icon: '\u{1F48E}', label: 'Более 500 000 \u20BD' }
            ]
        },
        {
            short: 'Цель',
            title: 'Какая главная цель продвижения?',
            options: [
                { icon: '\u{1F4C8}', label: 'Увеличить поток заявок' },
                { icon: '\u{1F3AF}', label: 'Снизить стоимость заявки' },
                { icon: '\u{1F9ED}', label: 'Протестировать новый товар или услугу' },
                { icon: '\u{1F50E}', label: 'Понять, почему реклама не окупается' }
            ]
        },
        {
            short: 'Старт',
            title: 'Когда планируете запускать рекламу?',
            options: [
                { icon: '\u{26A1}', label: 'Как можно быстрее' },
                { icon: '\u{1F4C5}', label: 'В течение недели' },
                { icon: '\u{23F3}', label: 'В течение месяца' },
                { icon: '\u{1F4AC}', label: 'Пока присматриваюсь' }
            ]
        }
    ];
    const TOTAL = QUESTIONS.length;
    const stepsWrap = document.getElementById('quizSteps');
    const progressFill = document.getElementById('quizProgressFill');
    const progressText = document.getElementById('quizProgressText');
    const answers = new Array(TOTAL).fill(null);
    let current = 0;

    // Build question steps
    QUESTIONS.forEach(function(q, qi) {
        const step = document.createElement('div');
        step.className = 'quiz-step';
        const title = document.createElement('div');
        title.className = 'quiz-question';
        title.textContent = (qi + 1) + '. ' + q.title;
        const grid = document.createElement('div');
        grid.className = 'quiz-options';
        q.options.forEach(function(opt) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'quiz-option';
            btn.innerHTML = '<span class="quiz-option-icon">' + opt.icon + '</span><span>' + opt.label + '</span>';
            btn.addEventListener('click', function() {
                answers[qi] = opt.label;
                grid.querySelectorAll('.quiz-option').forEach(function(b) { b.classList.remove('selected'); });
                btn.classList.add('selected');
                setTimeout(function() { showStep(qi + 1); }, 250);
            });
            grid.appendChild(btn);
        });
        const nav = document.createElement('div');
        nav.className = 'quiz-nav';
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'quiz-back';
        back.innerHTML = '&#x2039; Назад';
        back.addEventListener('click', function() { showStep(current - 1); });
        const hint = document.createElement('span');
        hint.className = 'quiz-hint';
        hint.textContent = 'Выберите один вариант';
        nav.appendChild(back);
        nav.appendChild(hint);
        step.appendChild(title);
        step.appendChild(grid);
        step.appendChild(nav);
        stepsWrap.appendChild(step);
    });

    // Final step with lead form
    const finalStep = document.createElement('div');
    finalStep.className = 'quiz-step';
    finalStep.innerHTML =
        '<div id="quizFinalBody">' +
            '<div class="quiz-final-title">\u2705 Все ответы собраны!</div>' +
            '<p class="quiz-final-sub">Оставьте контакты \u2014 и я подготовлю бесплатную стратегию продвижения с прогнозом бюджета и результата.</p>' +
            '<div class="quiz-answers" id="quizAnswers"></div>' +
            '<form id="quizForm" action="https://formsubmit.co/ajax/alexrus9999@gmail.com" method="POST">' +
                '<input type="hidden" name="_captcha" value="false">' +
                '<input type="hidden" name="_template" value="table">' +
                '<div class="form-group">' +
                    '<label for="quizName">Ваше имя</label>' +
                    '<input type="text" id="quizName" name="name" placeholder="Как к вам обращаться?" required>' +
                '</div>' +
                '<div class="form-group">' +
                    '<label for="quizContact">Телефон или Telegram</label>' +
                    '<input type="text" id="quizContact" name="contact" placeholder="Куда отправить стратегию?" required>' +
                '</div>' +
                '<button type="submit" class="btn btn-primary btn-submit quiz-submit">Получить стратегию</button>' +
                '<p class="quiz-hint" style="margin-top:12px;text-align:center;">Нажимая кнопку, вы соглашаетесь на обработку персональных данных</p>' +
            '</form>' +
        '</div>' +
        '<div class="quiz-success" id="quizSuccess">' +
            '<div class="checkmark">\u2705</div>' +
            '<h3>Спасибо за ответы!</h3>' +
            '<p>Я подготовлю вашу персональную стратегию и свяжусь с вами в ближайшее время.</p>' +
        '</div>';
    stepsWrap.appendChild(finalStep);

    const steps = [...stepsWrap.querySelectorAll('.quiz-step')];
    const quizForm = finalStep.querySelector('#quizForm');
    const quizFinalBody = finalStep.querySelector('#quizFinalBody');
    const quizSuccess = finalStep.querySelector('#quizSuccess');
    const quizAnswersBox = finalStep.querySelector('#quizAnswers');

    function showStep(idx) {
        current = Math.max(0, Math.min(TOTAL, idx));
        steps.forEach(function(s, i) { s.classList.toggle('active', i === current); });
        progressFill.style.width = Math.round(((current + 1) / (TOTAL + 1)) * 100) + '%';
        progressText.textContent = current < TOTAL ? 'Вопрос ' + (current + 1) + ' из ' + TOTAL : 'Почти готово';
        if (current === TOTAL) {
            quizAnswersBox.innerHTML = QUESTIONS.map(function(q, qi) {
                return '<div class="quiz-answer-row"><span class="q">' + q.short + '</span><span class="a">' + (answers[qi] || '\u2014') + '</span></div>';
            }).join('');
        }
    }

    function answersText() {
        return QUESTIONS.map(function(q, qi) {
            return q.short + ': ' + (answers[qi] || '\u2014');
        }).join('\n');
    }

    quizForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('quizName').value.trim();
        const contact = document.getElementById('quizContact').value.trim();
        if (!name || !contact) { quizForm.reportValidity(); return; }
        const answersStr = answersText();

        // Локальный запуск (file://): FormSubmit не работает из-за CORS, отправляем через mailto
        if (window.location.protocol === 'file:') {
            const body = encodeURIComponent('Имя: ' + name + '\nКонтакт: ' + contact + '\nОтветы квиза:\n' + answersStr);
            window.location.href = 'mailto:alexrus9999@gmail.com?subject=' + encodeURIComponent('Заявка с квиза') + '&body=' + body;
            return;
        }

        const button = quizForm.querySelector('.quiz-submit');
        const originalText = button.innerHTML;
        button.disabled = true;
        button.textContent = 'Отправка...';

        const fd = new FormData(quizForm);
        fd.append('_subject', 'Заявка с квиза \u2014 AlexMarketing');
        fd.append('Ответы квиза', answersStr);

        fetch(quizForm.action, {
            method: 'POST',
            body: fd,
            headers: { 'Accept': 'application/json' }
        }).then(function(response) {
            if (!response.ok) throw new Error('HTTP ' + response.status);
            return response.json();
        }).then(function(data) {
            if (data.success) {
                quizFinalBody.style.display = 'none';
                quizSuccess.classList.add('show');
                progressFill.style.width = '100%';
                progressText.textContent = 'Готово';
            } else {
                alert(data.message || 'Не удалось отправить заявку. Попробуйте позже.');
            }
        }).catch(function(err) {
            if (err.message && err.message.includes('Failed to fetch')) {
                alert('Не удалось отправить. Убедитесь, что сайт открыт через http(s):// (не file://) и интернет подключён.');
            } else {
                alert('Ошибка соединения. Проверьте интернет и попробуйте снова.');
            }
        }).finally(function() {
            button.disabled = false;
            button.innerHTML = originalText;
        });
    });

    showStep(0);
})();

// Pricing slider
(function() {
    const track = document.getElementById('pricingTrack');
    const viewport = document.getElementById('pricingViewport');
    const prevBtn = document.getElementById('pricingPrev');
    const nextBtn = document.getElementById('pricingNext');
    const dotsContainer = document.getElementById('pricingDots');
    const realCards = [...track.querySelectorAll('.pricing-card')];
    const realCount = realCards.length;
    const GAP = 24;
    let activeIdx = 1;

    // Clone edge cards
    const lastClone = realCards[realCount - 1].cloneNode(true);
    const firstClone = realCards[0].cloneNode(true);
    track.insertBefore(lastClone, track.firstChild);
    track.appendChild(firstClone);
    const allItems = [...track.querySelectorAll('.pricing-card')];
    lastClone.classList.add('clone');
    firstClone.classList.add('clone');

    // Create dots
    for (let i = 0; i < realCount; i++) {
        const dot = document.createElement('button');
        dot.className = 'slider-dot' + (i === activeIdx ? ' active' : '');
        dot.addEventListener('click', () => setActive(i));
        dotsContainer.appendChild(dot);
    }

    function getCardWidth() {
        return (viewport.clientWidth - 80 - GAP * 2) / 3;
    }

    function layout() {
        const w = getCardWidth();
        allItems.forEach(card => { card.style.width = w + 'px'; });
    }

    function centerItem(pos) {
        const cardWidth = getCardWidth();
        const offset = 40 + pos * (cardWidth + GAP) + cardWidth / 2 - viewport.clientWidth / 2;
        track.style.transform = 'translateX(-' + offset + 'px)';
    }

    function setActive(idx) {
        activeIdx = idx;
        const pos = idx + 1;
        realCards.forEach((c, i) => {
            c.classList.toggle('active', i === idx);
        });
        // Highlight matching clone
        allItems.forEach(card => {
            if (card.classList.contains('clone')) {
                card.classList.remove('active');
            }
        });
        if (pos < allItems.length) allItems[pos].classList.add('active');

        dotsContainer.querySelectorAll('.slider-dot').forEach((d, i) => {
            d.classList.toggle('active', i === idx);
        });
        prevBtn.disabled = idx === 0;
        nextBtn.disabled = idx === realCount - 1;
        centerItem(pos);
    }

    prevBtn.addEventListener('click', () => { if (activeIdx > 0) setActive(activeIdx - 1); });
    nextBtn.addEventListener('click', () => { if (activeIdx < realCount - 1) setActive(activeIdx + 1); });

    // Swipe
    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            if (diff > 0 && activeIdx < realCount - 1) setActive(activeIdx + 1);
            else if (diff < 0 && activeIdx > 0) setActive(activeIdx - 1);
        }
    }, { passive: true });

    window.addEventListener('resize', () => { layout(); centerItem(activeIdx + 1); });

    layout();
    setActive(activeIdx);
})();
