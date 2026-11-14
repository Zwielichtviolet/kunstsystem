var PROMPT = 'root@kunstsystem:~$';
var screen = document.getElementById('screen');
var winTitle = document.getElementById('win-title');
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var NICK_KEY = 'ks_nickname';
var nickname = lsGet(NICK_KEY) || '';
var SUPABASE_URL = window.KS_SUPABASE_URL || '';
var SUPABASE_ANON_KEY = window.KS_SUPABASE_ANON_KEY || '';

/* ---------- локальное хранилище ---------- */
function lsGet(key) { return KSStorage.get(key); }
function lsSet(key, value) { KSStorage.set(key, value); }


function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function dual(de, ru, cls) {
    return '<div class="term-dual ' + (cls || '') + '">' +
        '<span class="lang-de">' + esc(de) + '</span>' +
        '<span class="lang-ru">' + esc(ru) + '</span></div>';
}

function cliHtml() {
    return '<div class="command-line"><span class="prompt">' + PROMPT +
        '</span><input type="text" id="cmd-input" class="cmd-input" autocomplete="off" spellcheck="false" aria-label="Командная строка" placeholder="введите hilfe..."></div>';
}

function renderWelcome() {
    winTitle.textContent = 'kunst_system.exe [Willkommen]';
    screen.innerHTML =
        '<section class="welcome-screen">' +
        dual('IDENTITÄT INITIALISIEREN', 'ПРЕДСТАВЬТЕСЬ, ГОСТЬ', 'title-dual glitch-text') +
        '<p class="welcome-copy">Введите никнейм для локального профиля. Он будет закреплён в этом браузере.</p>' +
        '<form id="nickname-form" class="nickname-form">' +
        '<label for="nickname-input">' + PROMPT + ' set identity</label>' +
        '<input id="nickname-input" maxlength="24" minlength="2" required pattern="[A-Za-zА-Яа-яЁё0-9_ -]{2,24}" autocomplete="nickname" placeholder="ваш никнейм">' +
        '<button type="submit">ИНИЦИАЛИЗИРОВАТЬ ПРОФИЛЬ</button></form>' +
        '<p class="cmd-muted">Внимание: ник хранится локально и не является подтверждённой учётной записью.</p></section>';
    var form = document.getElementById('nickname-form');
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var field = document.getElementById('nickname-input');
        var value = field.value.trim().replace(/\s+/g, ' ');
        if (value.length < 2 || value.length > 24) { field.setCustomValidity('Введите от 2 до 24 символов'); field.reportValidity(); return; }
        if (lsGet(NICK_KEY)) { nickname = lsGet(NICK_KEY); route(); return; }
        nickname = value;
        lsSet(NICK_KEY, nickname);
        route();
    });
    document.getElementById('nickname-input').focus();
}

function getStyleCatalog() {
    return DATA.filter(function (item) { return STYLE_CATEGORIES[item.slug] === 'styles'; });
}

function renderIndex() {
    winTitle.textContent = 'kunst_system.exe [Hauptmenü]';
    var html = '<div class="command-line"><span class="prompt">' + PROMPT + '</span> <span style="color:#27c93f">whoami</span></div>';
    html += '<div class="cmd-output cmd-muted">' + esc(nickname || 'kunst-gast') + ' — гость справочника «Рупор искусства»</div>';
    html += dual('SPRACHROHR DER KUNST', 'РУПОР ИСКУССТВА', 'title-dual');
    html += dual('Interaktives Verzeichnis der Bildstile', 'Интерактивный справочник изобразительных стилей', 'desc-dual');


    /* ссылка «открыть снова» для последнего просмотренного стиля */
    var last = lsGet('ks_last_slug');
    if (last) {
        var lastStyle = null;
        DATA.forEach(function (x) { if (x.slug === last) lastStyle = x; });
        if (lastStyle) {
            html += '<a class="simple-link" data-slug="' + esc(lastStyle.slug) + '">' +
                '<span class="prompt">' + PROMPT + '</span> открыть снова: ' + esc(lastStyle.ru) + ' / ' + esc(lastStyle.de) + '</a>';
        }
    }

    html += dual(PROMPT + ' ls ./stile', PROMPT + ' показать стили', 'green-command');
    html += '<ul class="style-list">';
    getStyleCatalog().forEach(function (s, i) {
        var n = i < 9 ? '0' + (i + 1) : String(i + 1);
        html += '<li><a class="term-dual list-item" data-slug="' + s.slug + '">' +
            '<span class="lang-de">[' + n + '] ' + esc(s.de) + '</span>' +
            '<span class="lang-ru">[' + n + '] ' + esc(s.ru) + '</span></a></li>';
    });
    html += '</ul>';

    /* таймлайн: стили по годам */
    html += dual(PROMPT + ' timeline', PROMPT + ' стили по годам', 'green-command');
    html += '<details class="timeline-details"><summary>Раскрыть хронологию направлений</summary>' + renderTimeline() + '</details>';
    html += renderTaxonomy();

    html += dual('Sys: System bereit. Wählen Sie einen Stil aus.', 'Sys: Система готова. Выберите стиль.', 'status-dual');
    html += '<footer class="page-footer"><span>RADIO LINK // KUNSTSYSTEM</span><button type="button" class="share-quiet" id="share-article">↗ Поделиться сайтом</button></footer>';
    html += cliHtml();
    screen.removeAttribute('data-style');
    screen.innerHTML = html;
    reveal();
    bindScreen();
}

function renderTimeline() {
    var rows = getStyleCatalog().slice().sort(function (a, b) {
        return (YEARS[a.slug] || 9999) - (YEARS[b.slug] || 9999);
    });
    var html = '<label class="timeline-filter">Эпоха: <select id="timeline-era"><option value="all">Все периоды</option><option value="early">До 1900</option><option value="modern">1900–1945</option><option value="postwar">1946–1989</option><option value="digital">1990 и позже</option></select></label><div class="timeline">';
    rows.forEach(function (s) {
        var year = YEARS[s.slug] || '?';
        html += '<a class="timeline-row" data-slug="' + esc(s.slug) + '">' +
            '<span class="timeline-year" data-year="' + year + '">' + year + '</span>' +
            '<span class="timeline-line" aria-hidden="true"></span>' +
            '<span class="timeline-name">' + esc(s.ru) + ' <span class="timeline-de">/ ' + esc(s.de) + '</span></span>' +
            '</a>';
    });
    html += '</div>';
    return html;
}


function getSignalMotif(slug) {
    var groups = {
        geometry: ['kubismus', 'bauhaus', 'minimalismus'],
        light: ['impressionismus', 'romantik'],
        dream: ['surrealismus', 'symbolismus', 'konzeptualismus'],
        pulse: ['expressionismus', 'futurismus', 'popart', 'digitalekunst', 'abstraktionismus'],
        ornament: ['jugendstil', 'gotik', 'renessans', 'barock', 'klassizismus'],
        archive: ['realismus', 'religioese-kunst']
    };
    for (var motif in groups) {
        if (groups[motif].indexOf(slug) !== -1) return motif;
    }
    return 'archive';
}

function renderDirectionSignal(style) {
    var motif = getSignalMotif(style.slug);
    var labels = {
        geometry: 'GEOMETRIC ARRAY',
        light: 'LUMINOUS TRACE',
        dream: 'DREAM FREQUENCY',
        pulse: 'EXPRESSIVE WAVE',
        ornament: 'ORNAMENTAL TRACE',
        archive: 'VISUAL ARCHIVE'
    };
    return '<section class="direction-signal motif-' + motif + '" aria-label="Визуальная сигнатура направления">' +
        '<div class="signal-head"><span>ART SIGNAL / ' + esc(style.slug.toUpperCase()) +
        '</span><span class="signal-status"><i></i> SIGNAL LOCKED</span></div>' +
        '<div class="signal-visual" aria-hidden="true"><span class="signal-grid"></span>' +
        '<span class="signal-shape shape-a"></span><span class="signal-shape shape-b"></span>' +
        '<span class="signal-shape shape-c"></span><span class="signal-scan"></span>' +
        '<span class="signal-crosshair crosshair-a"></span><span class="signal-crosshair crosshair-b"></span></div>' +
        '<div class="signal-foot"><span>' + labels[motif] +
        '</span><span>VISUAL SIGNATURE // 0' + (['geometry','light','dream','pulse','ornament','archive'].indexOf(motif)+1) +
        '</span></div></section>';
}

function renderStyle(slug) {
    var s = null;
    DATA.forEach(function (x) { if (x.slug === slug) s = x; });
    if (!s) { renderIndex(); return; }

    /* запоминаем последний открытый стиль */
    lsSet('ks_last_slug', s.slug);

    winTitle.textContent = 'kunst_system.exe [' + s.de + ']';
    var html = '<a class="simple-link" data-nav="index"><span class="prompt">' + PROMPT + '</span> вернуться в главное меню</a>';
    html += dual(s.de, s.ru, 'title-dual glitch-text');

    if (YEARS[s.slug]) {
        html += dual('Jahr: ' + YEARS[s.slug], 'Год: ' + YEARS[s.slug], 'status-dual');
    }
    html += dual(PROMPT + ' cat beschreibung.txt', PROMPT + ' прочитать описание', 'green-command');
    html += renderDirectionSignal(s);
    html += '<div class="text-block">' + s.tb + '</div>';
    html += dual(PROMPT + ' ls ./künstler', PROMPT + ' список художников', 'green-command');
    html += '<ul class="style-list">';
    s.artists.forEach(function (a) { html += '<li>- ' + esc(a) + '</li>'; });
    html += '</ul>';
    html += dual(PROMPT + ' display ./beispiele', PROMPT + ' показать примеры работ', 'green-command');
    html += '<section class="gallery-section"><div class="section-kicker">SIGNAL ARCHIVE / VISUAL RECORDS</div><h2 class="section-heading">Примеры произведений</h2><div class="image-grid">';
    s.works.forEach(function (w) {
        html += '<div class="image-card">' +
            '<img class="art-image" src="img/' + esc(w.src) + '" alt="' + esc(w.alt) + '" loading="lazy" ' +
            'onerror="this.outerHTML=\'<div class=&quot;img-placeholder&quot;>[ signal fehlt ]<br>' + esc(w.src) + '</div>\'">' +
            '<span class="image-caption">' + esc(w.caption) + '</span></div>';
    });
    html += '</div></section>';
    html += renderComments(s.slug);
    html += '<footer class="page-footer"><span>END OF RECORD // ' + esc(s.slug.toUpperCase()) + '</span><button type="button" class="share-quiet" id="share-article">↗ Поделиться статьёй</button></footer>'; 
    html += cliHtml();
    screen.setAttribute('data-style', s.slug);
    screen.innerHTML = html;
    reveal();
    bindScreen();
    bindComments(s.slug);
}

function renderTaxonomy() {
    var routes = {
        arts: { slug: 'overview-arts', label: 'Открыть обзор видов искусства и медиа' },
        crafts: { slug: 'overview-crafts', label: 'Открыть обзор декоративно-прикладного искусства' },
        religion: { slug: 'religioese-kunst', label: 'Открыть обзор религиозного искусства' }
    };
    var html = '<section class="taxonomy"><div class="section-kicker">INDEX / CLASSIFICATION</div><h2 class="section-heading">Карта художественных практик</h2><div class="taxonomy-grid">';
    KUNST_TAXONOMY.forEach(function (item, index) {
        html += '<article class="taxonomy-item"><span class="taxonomy-index">0' + (index + 1) + ' / FIELD</span><strong>' + esc(item.title) + '</strong><p>' + esc(item.description) + '</p>';
        if (routes[item.id]) html += '<a class="taxonomy-link" data-slug="' + routes[item.id].slug + '">' + routes[item.id].label + ' →</a>';
        else html += '<span class="taxonomy-note">Каталог стилей представлен выше ↑</span>';
        html += '</article>';
    });
    html += '</div></section>';
    return html;
}

function renderOverview(kind) {
    var pages = {
        'overview-arts': {
            title: 'ВИДЫ ИСКУССТВА И МЕДИА', de: 'KUNSTFORMEN / MEDIEN',
            description: 'Формы и носители художественного высказывания. Живопись, скульптура, архитектура, кино и видеоигры не являются стилями сами по себе: внутри каждой формы могут сосуществовать разные визуальные языки.',
            entries: ['Живопись — работа с цветом, линией, фактурой и плоскостью', 'Скульптура — создание объёмной формы и пространства', 'Архитектура — организация пространства, конструкции и среды', 'Кино — движущееся изображение, монтаж, свет и звук', 'Видеоигры — интерактивная форма, объединяющая изображение, звук и действие']
        },
        'overview-crafts': {
            title: 'ДЕКОРАТИВНО-ПРИКЛАДНОЕ ИСКУССТВО И РЕМЁСЛА', de: 'ANGEWANDTE KUNST / HANDWERK',
            description: 'Практики создания предметов, в которых соединяются функция, материал и художественная форма. Ремесло не является отдельным стилем: изделия могут включать признаки готики, барокко, модерна и других направлений.',
            entries: ['Ювелирное дело — металл, камни, эмаль и орнамент', 'Кузнечное дело — художественная обработка металла', 'Керамика — форма, глазурь, обжиг и декор', 'Текстиль — ткань, вышивка, узор и структура материала', 'Мебель и предметный дизайн — функциональные объекты и их эстетика']
        }
    };
    var page = pages[kind];
    if (!page) { renderIndex(); return; }
    winTitle.textContent = 'kunst_system.exe [' + page.de + ']';
    var html = '<a class="simple-link" data-nav="index"><span class="prompt">' + PROMPT + '</span> вернуться в главное меню</a>';
    html += '<div class="overview-panel"><div class="section-kicker">REFERENCE DATABASE / FIELD GUIDE</div>';
    html += dual(page.de, page.title, 'title-dual glitch-text');
    html += '<p class="overview-description">' + esc(page.description) + '</p><div class="overview-list">';
    page.entries.forEach(function (entry, i) { html += '<div class="overview-entry"><span>0' + (i + 1) + '</span><p>' + esc(entry) + '</p></div>'; });
    html += '</div><div class="overview-foot">FIELD NOTES // KUNSTSYSTEM ARCHIVE</div></div>';
    html += '<footer class="page-footer"><span>END OF RECORD // ' + kind.toUpperCase() + '</span><button type="button" class="share-quiet" id="share-article">↗ Поделиться обзором</button></footer>';
    html += cliHtml();
    screen.removeAttribute('data-style');
    screen.innerHTML = html;
    reveal();
    bindScreen();
}

function renderComments(slug) {
    return '<section class="comments" data-comment-slug="' + esc(slug) + '">' +
        '<h3>Комментарии сообщества</h3><p class="cmd-muted">Обсуждение статьи — общая лента для всех посетителей.</p>' +
        '<div class="comments-status" id="comments-status" role="status">Подключение хранилища комментариев…</div>' +
        '<div id="comments-list" class="comments-list"></div>' +
        '<form id="comment-form" class="comment-form">' +
        '<label for="comment-text">' + esc(nickname) + ', ваш комментарий</label>' +
        '<textarea id="comment-text" maxlength="1500" required placeholder="Поделитесь мыслями…"></textarea>' +
        '<button type="submit">ОТПРАВИТЬ КОММЕНТАРИЙ</button></form>' +
        '<p class="cmd-muted">Публикация станет доступна после настройки Supabase владельцем сайта.</p></section>';
}

function supabaseReady() {
    return /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
        SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

function supabaseRequest(path, options) {
    options = options || {};
    options.headers = Object.assign({
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
    }, options.headers || {});
    return fetch(SUPABASE_URL + '/rest/v1/' + path, options).then(function (response) {
        if (!response.ok) throw new Error('Supabase HTTP ' + response.status);
        if (response.status === 204 || (response.status === 201 && options.method === 'POST')) return [];
        return response.json();
    });
}

function bindComments(slug) {
    var status = document.getElementById('comments-status');
    var form = document.getElementById('comment-form');
    if (!status || !form) return;
    if (!supabaseReady()) {
        status.textContent = 'Комментарии пока не подключены: не настроены параметры Supabase.';
        form.querySelector('button').disabled = true;
        form.querySelector('textarea').disabled = true;
        return;
    }
    function load() {
        status.textContent = 'Загружаем обсуждение…';
        supabaseRequest('comments?select=id,nickname,body,created_at&article_slug=eq.' +
            encodeURIComponent(slug) + '&order=created_at.desc&limit=100')
            .then(function (rows) {
                var list = document.getElementById('comments-list');
                list.innerHTML = '';
                if (!rows.length) { status.textContent = 'Пока нет комментариев. Будьте первым.'; return; }
                status.textContent = 'Последние комментарии сообщества';
                rows.forEach(function (row) {
                    var item = document.createElement('article');
                    item.className = 'comment-item';
                    var author = document.createElement('strong');
                    author.textContent = row.nickname;
                    var body = document.createElement('p');
                    body.textContent = row.body;
                    var time = document.createElement('time');
                    time.dateTime = row.created_at;
                    time.textContent = new Date(row.created_at).toLocaleString('ru-RU');
                    item.appendChild(author); item.appendChild(body); item.appendChild(time);
                    list.appendChild(item);
                });
            }).catch(function () { status.textContent = 'Не удалось загрузить комментарии. Попробуйте позже.'; });
    }
    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var textarea = document.getElementById('comment-text');
        var body = textarea.value.trim();
        if (!body || body.length > 1500 || !nickname) return;
        var button = form.querySelector('button');
        button.disabled = true;
        supabaseRequest('comments', {
            method: 'POST',
            headers: { 'Prefer': 'return=minimal' },
            body: JSON.stringify({ article_slug: slug, nickname: nickname, body: body })
        }).then(function () {
            textarea.value = '';
            load();
        }).catch(function () {
            status.textContent = 'Комментарий не отправлен. Проверьте подключение или повторите позже.';
        }).finally(function () { button.disabled = false; });
    });
    load();
}


function reveal() {
    if (reducedMotion) return;
    Array.prototype.forEach.call(screen.children, function (el, i) {
        el.classList.add('reveal');
        el.style.animationDelay = (i * 60) + 'ms';
    });

}

function bindScreen() {
    var shareButton = document.getElementById('share-article');
    if (shareButton) shareButton.addEventListener('click', shareCurrentPage);
    var eraSelect = document.getElementById('timeline-era');
    if (eraSelect) eraSelect.addEventListener('change', function () {
        var rows = screen.querySelectorAll('.timeline-row');
        Array.prototype.forEach.call(rows, function (row) {
            var year = parseInt(row.querySelector('.timeline-year').getAttribute('data-year'), 10);
            var show = eraSelect.value === 'all' ||
                (eraSelect.value === 'early' && year < 1900) ||
                (eraSelect.value === 'modern' && year >= 1900 && year <= 1945) ||
                (eraSelect.value === 'postwar' && year >= 1946 && year <= 1989) ||
                (eraSelect.value === 'digital' && year >= 1990);
            row.hidden = !show;
        });
    });
    Array.prototype.forEach.call(screen.querySelectorAll('[data-slug]'), function (a) {
        a.addEventListener('click', function () { location.hash = a.getAttribute('data-slug'); });
    });
    Array.prototype.forEach.call(screen.querySelectorAll('[data-nav="index"]'), function (a) {
        a.addEventListener('click', function () { location.hash = ''; });
    });
    /* клик по картине — полноэкранный просмотр */
    Array.prototype.forEach.call(screen.querySelectorAll('.image-card'), function (card) {
        card.addEventListener('click', function () {
            var img = card.querySelector('.art-image');
            var cap = card.querySelector('.image-caption');
            if (!img) return;
            openLightbox(img.getAttribute('src'), cap ? cap.textContent : '');
        });
    });
    bindCli();
}

function route() {
    if (!nickname) { renderWelcome(); return; }
    var slug = location.hash.replace('#', '');
    if (slug === 'overview-arts' || slug === 'overview-crafts') { renderOverview(slug); return; }
    if (slug) renderStyle(slug); else renderIndex();
}
window.addEventListener('hashchange', route);

function findStyle(query) {
    var norm = function (s) {
        return s.toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
            .replace(/ß/g, 'ss').replace(/[\s\-_]/g, '');
    };
    var q = norm(query);
    var idx = parseInt(q, 10);
    return getStyleCatalog().filter(function (s, i) {
        var n = i < 9 ? '0' + (i + 1) : String(i + 1);
        return n === q || norm(s.slug) === q || norm(s.de) === q || norm(s.ru) === q ||
            (!isNaN(idx) && idx === i + 1);
    })[0];
}

function print(text, cls) {
    var line = document.getElementById('cmd-input').closest('.command-line');
    var div = document.createElement('div');
    div.className = 'cmd-output' + (cls ? ' ' + cls : '');
    div.textContent = text;
    screen.insertBefore(div, line);
    div.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
}

function showHelp() {
    print('доступные команды:', 'cmd-muted');
    print('  ls (l)                — список стилей');
    print('  open <номер/имя> (op) — открыть стиль (напр. op 13)');
    print('  timeline (tl)         — стили по годам');
    print('  random (zufall, rnd)  — случайный стиль');
    print('  cat beschreibung.txt  — описание (в начало страницы)');
    print('  index | menu (m)      — главное меню');
    print('  whoami (w) | date | clear (cls) | . (очистить консоль) | hilfe (h)');
    print('  ↑/↓                   — история команд');
}

function openRandom() {
    var catalog = getStyleCatalog();
    var s = catalog[Math.floor(Math.random() * catalog.length)];
    print('случайный стиль: ' + s.de + ' / ' + s.ru + ' ...', 'cmd-muted');
    setTimeout(function () { location.hash = s.slug; }, 350);
}

var COMMANDS = {
    hilfe: showHelp, help: showHelp, h: showHelp, '?': showHelp,
    ls: function () {
        getStyleCatalog().forEach(function (s, i) {
            var n = i < 9 ? '0' + (i + 1) : String(i + 1);
            print('[' + n + '] ' + s.de + ' / ' + s.ru);
        });
    },
    l: function () { COMMANDS.ls(); },
    open: function (args) {
        if (!args.length) { print('использование: open <номер или название>', 'cmd-muted'); return; }
        var s = findStyle(args.join(' '));
        if (s) { print('открываю ' + s.de + ' / ' + s.ru + ' ...', 'cmd-muted'); setTimeout(function () { location.hash = s.slug; }, 350); }
        else print('стиль не найден: ' + args.join(' ') + '. введите ls', 'cmd-error');
    },
    op: function (args) { COMMANDS.open(args); },
    cd: function (args) { COMMANDS.open(args); },
    timeline: function () {
        getStyleCatalog().slice().sort(function (a, b) {
            return (YEARS[a.slug] || 9999) - (YEARS[b.slug] || 9999);
        }).forEach(function (s) {
            print((YEARS[s.slug] || '????') + '  ' + s.de + ' / ' + s.ru);
        });
        if (location.hash) print('таймлайн целиком — в главном меню (команда m)', 'cmd-muted');
    },
    tl: function () { COMMANDS.timeline(); },
    random: function () { openRandom(); },
    zufall: function () { openRandom(); },
    rnd: function () { openRandom(); },
    cat: function (args) {
        var t = args.join(' ');
        if (t === 'beschreibung.txt' || t === 'beschreibung') {
            window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
            print('beschreibung.txt — описание в начале страницы', 'cmd-muted');
        } else print('cat: ' + (t || '?') + ': файл не найден', 'cmd-error');
    },
    index: function () { location.hash = ''; },
    menu: function () { location.hash = ''; },
    m: function () { location.hash = ''; },
    whoami: function () { print((nickname || 'kunst-gast') + ' — гость справочника «Рупор искусства»', 'cmd-muted'); },
    w: function () { COMMANDS.whoami(); },
    date: function () { print(new Date().toLocaleString('ru-RU'), 'cmd-muted'); },
    clear: function () {
        Array.prototype.forEach.call(screen.querySelectorAll('.cmd-output'), function (el) { el.remove(); });
    },
    cls: function () { COMMANDS.clear(); },
    '.': function () {
        COMMANDS.clear();
        print('консоль очищена', 'cmd-muted');
    }
};

/* ---------- история команд (localStorage) ---------- */
var CLI_HISTORY_KEY = 'ks_cmd_history';
var cliHistory = [];
try { cliHistory = JSON.parse(lsGet(CLI_HISTORY_KEY) || '[]') || []; } catch (e) { cliHistory = []; }
if (!Array.isArray(cliHistory)) cliHistory = [];
var cliHistoryPos = -1; /* -1 = «свежий» ввод; иначе индекс в cliHistory */

function cliHistoryPush(raw) {
    if (cliHistory[cliHistory.length - 1] !== raw) cliHistory.push(raw);
    if (cliHistory.length > 50) cliHistory = cliHistory.slice(-50);
    lsSet(CLI_HISTORY_KEY, JSON.stringify(cliHistory));
    cliHistoryPos = -1;
}

function bindCli() {
    var input = document.getElementById('cmd-input');
    input.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            if (!cliHistory.length) return;
            e.preventDefault();
            if (e.key === 'ArrowUp') {
                if (cliHistoryPos === -1) cliHistoryPos = cliHistory.length - 1;
                else cliHistoryPos = Math.max(0, cliHistoryPos - 1);
            } else {
                if (cliHistoryPos === -1) return;
                cliHistoryPos++;
                if (cliHistoryPos >= cliHistory.length) { cliHistoryPos = -1; input.value = ''; return; }
            }
            input.value = cliHistory[cliHistoryPos];
            return;
        }
        if (e.key !== 'Enter') return;
        var raw = input.value.trim();
        input.value = '';
        if (!raw) return;
        print(PROMPT + ' ' + raw, 'cmd-echo');
        cliHistoryPush(raw);
        var parts = raw.split(/\s+/);
        var cmd = parts[0].toLowerCase();
        if (COMMANDS[cmd]) COMMANDS[cmd](parts.slice(1));
        else print('bash: ' + cmd + ': команда не найдена. введите hilfe', 'cmd-error');
    });
    /* Фокус — только по клику на саму командную строку:
       клики и ПКМ по остальной странице ничего не перехватываются */
    input.closest('.command-line').addEventListener('click', function () {
        input.focus();
    });
}

/* ---------- лайтбокс: полноэкранный просмотр картин ---------- */
function openLightbox(src, caption) {
    var box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML = '<img src="' + src + '" alt="">' +
        '<div class="lightbox-caption">' + caption + ' — клик или Esc, чтобы закрыть</div>';
    function close() { box.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    box.addEventListener('click', close);
    document.addEventListener('keydown', onKey);
    document.body.appendChild(box);
}

route();
