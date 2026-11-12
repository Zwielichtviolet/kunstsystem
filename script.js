var PROMPT = 'root@kunstsystem:~$';
var screen = document.getElementById('screen');
var winTitle = document.getElementById('win-title');
var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- localStorage-помощники ---------- */
function lsGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
}
function lsSet(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* приватный режим — просто игнорируем */ }
}

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

function renderIndex() {
    winTitle.textContent = 'kunst_system.exe [Hauptmenü]';
    var html = '<div class="command-line"><span class="prompt">' + PROMPT + '</span> <span style="color:#27c93f">whoami</span></div>';
    html += '<div class="cmd-output cmd-muted">kunst-gast — гость справочника «Рупор искусства»</div>';
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
    DATA.forEach(function (s, i) {
        var n = i < 9 ? '0' + (i + 1) : String(i + 1);
        html += '<li><a class="term-dual list-item" data-slug="' + s.slug + '">' +
            '<span class="lang-de">[' + n + '] ' + esc(s.de) + '</span>' +
            '<span class="lang-ru">[' + n + '] ' + esc(s.ru) + '</span></a></li>';
    });
    html += '</ul>';

    /* таймлайн: стили по годам */
    html += dual(PROMPT + ' timeline', PROMPT + ' стили по годам', 'green-command');
    html += renderTimeline();

    html += dual('Sys: System bereit. Wählen Sie einen Stil aus.', 'Sys: Система готова. Выберите стиль.', 'status-dual');
    html += cliHtml();
    screen.innerHTML = html;
    reveal();
    bindScreen();
}

function renderTimeline() {
    var rows = DATA.slice().sort(function (a, b) {
        return (YEARS[a.slug] || 9999) - (YEARS[b.slug] || 9999);
    });
    var html = '<div class="timeline">';
    rows.forEach(function (s) {
        var year = YEARS[s.slug] || '?';
        html += '<a class="timeline-row" data-slug="' + esc(s.slug) + '">' +
            '<span class="timeline-year">' + year + '</span>' +
            '<span class="timeline-line" aria-hidden="true"></span>' +
            '<span class="timeline-name">' + esc(s.ru) + ' <span class="timeline-de">/ ' + esc(s.de) + '</span></span>' +
            '</a>';
    });
    html += '</div>';
    return html;
}

function renderStyle(slug) {
    var s = null;
    DATA.forEach(function (x) { if (x.slug === slug) s = x; });
    if (!s) { renderIndex(); return; }

    /* запоминаем последний открытый стиль */
    lsSet('ks_last_slug', s.slug);

    winTitle.textContent = 'kunst_system.exe [' + s.de + ']';
    var html = '<a class="simple-link" data-nav="index"><span class="prompt">' + PROMPT + '</span> вернуться в главное меню</a>';
    html += dual(s.de, s.ru, 'title-dual');
    if (YEARS[s.slug]) {
        html += dual('Jahr: ' + YEARS[s.slug], 'Год: ' + YEARS[s.slug], 'status-dual');
    }
    html += dual(PROMPT + ' cat beschreibung.txt', PROMPT + ' прочитать описание', 'green-command');
    html += '<div class="text-block">' + s.tb + '</div>';
    html += dual(PROMPT + ' ls ./künstler', PROMPT + ' список художников', 'green-command');
    html += '<ul class="style-list">';
    s.artists.forEach(function (a) { html += '<li>- ' + esc(a) + '</li>'; });
    html += '</ul>';
    html += dual(PROMPT + ' display ./beispiele', PROMPT + ' показать примеры работ', 'green-command');
    html += '<div class="image-grid">';
    s.works.forEach(function (w) {
        html += '<div class="image-card">' +
            '<img class="art-image" src="img/' + esc(w.src) + '" alt="' + esc(w.alt) + '" loading="lazy" ' +
            'onerror="this.outerHTML=\'<div class=&quot;img-placeholder&quot;>[ signal fehlt ]<br>' + esc(w.src) + '</div>\'">' +
            '<span class="image-caption">' + esc(w.caption) + '</span></div>';
    });
    html += '</div><br><br>';
    html += cliHtml();
    screen.innerHTML = html;
    reveal();
    bindScreen();
}

function reveal() {
    if (reducedMotion) return;
    Array.prototype.forEach.call(screen.children, function (el, i) {
        el.classList.add('reveal');
        el.style.animationDelay = (i * 60) + 'ms';
    });

}

function bindScreen() {
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
    var slug = location.hash.replace('#', '');
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
    return DATA.filter(function (s, i) {
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
    print('  whoami (w) | date | clear (cls) | hilfe (h)');
    print('  ↑/↓                   — история команд');
}

function openRandom() {
    var s = DATA[Math.floor(Math.random() * DATA.length)];
    print('случайный стиль: ' + s.de + ' / ' + s.ru + ' ...', 'cmd-muted');
    setTimeout(function () { location.hash = s.slug; }, 350);
}

var COMMANDS = {
    hilfe: showHelp, help: showHelp, h: showHelp, '?': showHelp,
    ls: function () {
        DATA.forEach(function (s, i) {
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
        DATA.slice().sort(function (a, b) {
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
    whoami: function () { print('kunst-gast — гость справочника «Рупор искусства»', 'cmd-muted'); },
    w: function () { COMMANDS.whoami(); },
    date: function () { print(new Date().toLocaleString('ru-RU'), 'cmd-muted'); },
    clear: function () {
        Array.prototype.forEach.call(screen.querySelectorAll('.cmd-output'), function (el) { el.remove(); });
    },
    cls: function () { COMMANDS.clear(); }
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
