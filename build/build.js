// Static site generator: data/*.json -> docs/*.html
// Usage: node build/build.js   (run build/images.js first when photos change)
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs');
const C = require('../data/company.json');
const projects = require('../data/projects.json');
const images = require('../data/images.json');
const YEAR = new Date().getFullYear();

const CATEGORIES = {
  private: { label: 'Жилые интерьеры', short: 'Интерьер' },
  public: { label: 'Общественные', short: 'Общественное' },
  arch: { label: 'Архитектура', short: 'Архитектура' },
  landscape: { label: 'Ландшафт', short: 'Ландшафт' }
};

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = n => String(n).padStart(2, '0');
const img = (slug, file, size) => `img/p/${slug}/${file}-${size}.webp`;
const creditHref = `https://sitomika.ru/?utm_source=${C.creditSlug}&amp;utm_medium=footer&amp;utm_campaign=client-sites`;
const telHref = `tel:${C.phone}`;
const waHref = `https://wa.me/${C.whatsapp}`;
const tgHref = C.telegram;
const maxHref = C.max;
// Заявки уходят на почту студии через FormSubmit (у статического сайта нет своего сервера)
const formEndpoint = `https://formsubmit.co/ajax/${C.email}`;
const igHref = `https://instagram.com/${C.instagram}`;
// Яндекс Метрика: код выдан клиентом, оставлен дословно. Вебвизор включён,
// поэтому политика конфиденциальности и cookie-баннер о нём предупреждают.
const METRIKA_ID = '113174686';
const metrika = `<!-- Yandex.Metrika counter -->
<script type="text/javascript">
    (function(m,e,t,r,i,k,a){
        m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
    })(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=METRIKA_ID',
 'ym');

    ym(METRIKA_ID, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
</script>
<!-- /Yandex.Metrika counter -->`.replace(/METRIKA_ID/g, METRIKA_ID);
const metrikaNoscript = `<noscript><div><img src="https://mc.yandex.ru/watch/${METRIKA_ID}" style="position:absolute; left:-9999px;" alt="" /></div></noscript>`;

const featured = projects.filter(p => p.featured).sort((a, b) => a.featured - b.featured);
const HERO = { slug: 'kvartira-maslennikova-58', file: '01' };

// ---------- Layout ----------
function layout({ rel, title, description, canonical, body, ogImage, jsonLd, current, light }) {
  const og = ogImage || 'img/og.jpg';
  const nav = [
    ['projects/', 'Проекты', 'projects'],
    ['#services', 'Направления', 'services'],
    ['#process', 'Как работаем', 'process'],
    ['#contacts', 'Контакты', 'contacts']
  ].map(([href, label, key]) => {
    const h = rel + href;
    return `<a href="${h}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${C.siteUrl}${canonical}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ru_RU">
<meta property="og:site_name" content="${esc(C.fullName)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${C.siteUrl}${canonical}">
<meta property="og:image" content="${C.siteUrl}${og}">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0b0b">
<link rel="icon" href="${rel}favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${rel}img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${rel}css/style.css">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
${metrika}
</head>
<body${light ? ' class="page-light"' : ''}>
${metrikaNoscript}
<a class="visually-hidden skip-link" href="#main">Перейти к содержимому</a>
<header class="site-header">
  <a class="brand" href="${rel || './'}" aria-label="${esc(C.name)} — на главную"><img src="${rel}img/mark-white.png" alt="" width="28" height="30"><span>${esc(C.name)}</span></a>
  <nav class="site-nav" aria-label="Основная навигация">${nav}<a class="nav-phone" href="${telHref}">${esc(C.phoneDisplay)}</a></nav>
  <div class="header-side">
    <span class="header-city">OMSK · RU</span>
    <a class="header-phone" href="${telHref}">${esc(C.phoneDisplay)}</a>
    <button class="menu-toggle" type="button" aria-label="Меню" aria-expanded="false"><span></span><span></span></button>
  </div>
</header>
<main id="main">
${body}
</main>
${footer(rel)}
<div class="cookie" role="region" aria-label="Уведомление о cookie">
  <p>Сайт использует cookie, чтобы корректно работать, показывать встроенную карту и собирать обезличенную статистику посещений через Яндекс Метрику. Подробнее — в <a href="${rel}politika-konfidentsialnosti/">политике конфиденциальности</a>.</p>
  <button class="btn btn--solid" type="button">Понятно</button>
</div>
<script>window.COMPANY=${JSON.stringify({ formEndpoint, phone: C.phoneDisplay })};</script>
<script src="${rel}js/main.js" defer></script>
</body>
</html>
`;
}

function footer(rel) {
  return `<footer class="site-footer">
  <div class="footer-top">
    <div class="footer-logo"><img src="${rel}img/logo-white.png" alt="${esc(C.name)} — студия дизайна" width="180" height="162" loading="lazy"></div>
    <div class="footer-col"><p class="eyebrow">Разделы</p><a href="${rel}projects/">Проекты</a><a href="${rel}#services">Направления</a><a href="${rel}#process">Как работаем</a><a href="${rel}#contacts">Контакты</a></div>
    <div class="footer-col"><p class="eyebrow">Проекты</p>${Object.entries(CATEGORIES).map(([k, v]) => `<a href="${rel}projects/#${k}">${v.label}</a>`).join('')}</div>
    <div class="footer-col"><p class="eyebrow">Связаться</p><a href="${telHref}">${esc(C.phoneDisplay)}</a><a href="mailto:${C.email}">${esc(C.email)}</a><a href="${waHref}" target="_blank" rel="noopener">WhatsApp</a><a href="${tgHref}" target="_blank" rel="noopener">Telegram</a><a href="${maxHref}" target="_blank" rel="noopener">MAX</a><a href="${igHref}" target="_blank" rel="noopener">Instagram*</a></div>
    <div class="footer-col"><p class="eyebrow">Адрес</p><span>${esc(C.city)},<br>${esc(C.address)}</span></div>
  </div>
  <div class="footer-bottom">
    <span>© ${YEAR} ${esc(C.fullName)}, ${esc(C.city)}</span>
    <div class="footer-bottom-links">
      <a href="${rel}politika-konfidentsialnosti/">Политика конфиденциальности</a>
      <a href="${rel}soglasie-na-obrabotku/">Согласие на обработку данных</a>
      <a class="footer-credit" href="${creditHref}" target="_blank" rel="noopener">Разработано в sitomika.ru</a>
    </div>
    <span style="flex-basis:100%;font-size:11px;opacity:.7">* Instagram принадлежит компании Meta, признанной экстремистской организацией и запрещённой в РФ.</span>
  </div>
</footer>`;
}

function card(p, i, rel, { sizes = '(max-width: 860px) 100vw, 33vw', large = false, lazy = true } = {}) {
  const im = images[p.slug].images[0];
  const cat = CATEGORIES[p.category];
  const srcset = `${rel}${img(p.slug, im.file, 'sm')} 720w, ${rel}${img(p.slug, im.file, 'lg')} 1600w`;
  return `<article class="card reveal" data-category="${p.category}">
  <a class="card-link" href="${rel}projects/${p.slug}/">
    <div class="card-media">
      <span class="card-index">${pad(i + 1)}</span>
      <img src="${rel}${img(p.slug, im.file, large ? 'lg' : 'sm')}" srcset="${srcset}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(p.title)} — ${esc(p.type.toLowerCase())}"${lazy ? ' loading="lazy"' : ''} decoding="async">
      <span class="round-arrow card-open" aria-hidden="true">↗</span>
    </div>
    <div class="card-body">
      <h3 class="card-title">${esc(p.title)}</h3>
      <p class="card-meta">${esc(p.type)} · ${esc(p.place)} · ${esc(cat.label)}</p>
    </div>
  </a>
</article>`;
}

function contactSection(rel) {
  const pt = `${C.geo.lon},${C.geo.lat}`;
  const mapSrc = `https://yandex.ru/map-widget/v1/?ll=${pt}&amp;z=16&amp;pt=${pt},pm2blkl`;
  return `<section class="section dark" id="contacts">
  <div class="section-head"><p class="eyebrow">Контакты</p><p class="eyebrow">${esc(C.city)} · ${esc(C.addressShort)}</p></div>
  <div class="contact">
    <div class="contact-intro reveal">
      <p class="eyebrow">Обсудить проект</p>
      <h2>Расскажите о&nbsp;вашем пространстве</h2>
      <p>Оставьте заявку или позвоните — обсудим задачу, площадь и сроки, подскажем, с чего начать.</p>
      <dl class="contact-details">
        <div><dt class="eyebrow">Телефон</dt><dd><a class="contact-phone" href="${telHref}">${esc(C.phoneDisplay)}</a></dd></div>
        <div><dt class="eyebrow">Почта</dt><dd><a href="mailto:${C.email}">${esc(C.email)}</a></dd></div>
        <div><dt class="eyebrow">Адрес</dt><dd>${esc(C.city)}, ${esc(C.address)}</dd></div>
        <div><dt class="eyebrow">Мессенджеры и соцсети</dt><dd class="socials"><a href="${waHref}" target="_blank" rel="noopener">WhatsApp</a><a href="${tgHref}" target="_blank" rel="noopener">Telegram</a><a href="${maxHref}" target="_blank" rel="noopener">MAX</a><a href="${igHref}" target="_blank" rel="noopener">Instagram* @${esc(C.instagram)}</a></dd></div>
      </dl>
    </div>
    <form class="form lead-form reveal" novalidate>
      <div class="field"><label for="f-name">Имя</label><input id="f-name" name="name" type="text" autocomplete="name" placeholder="Как к вам обращаться" required></div>
      <div class="field"><label for="f-phone">Телефон</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" placeholder="+7" required></div>
      <div class="field"><label for="f-object">Объект</label>
        <select id="f-object" name="object">
          <option value="">Выберите вариант</option>
          <option>Квартира</option><option>Дом или коттедж</option><option>Офис или коммерческое помещение</option>
          <option>Архитектурный проект дома</option><option>Ландшафтный дизайн участка</option><option>Перепланировка и согласование</option><option>Другое</option>
        </select>
      </div>
      <div class="field"><label for="f-msg">Комментарий</label><textarea id="f-msg" name="message" rows="3" placeholder="Площадь, адрес, пожелания"></textarea></div>
      <div class="hp" aria-hidden="true"><label for="f-website">Сайт</label><input id="f-website" name="website" type="text" tabindex="-1" autocomplete="off"></div>
      <label class="consent"><input type="checkbox" name="consent" required><span>Даю <a href="${rel}soglasie-na-obrabotku/">согласие на обработку персональных данных</a> и принимаю <a href="${rel}politika-konfidentsialnosti/">политику конфиденциальности</a></span></label>
      <div class="form-actions">
        <button class="btn btn--solid" type="submit">Отправить заявку <span aria-hidden="true">→</span></button>
      </div>
      <p class="form-error" role="status" aria-live="polite"></p>
    </form>
    <div class="map reveal">
      <iframe src="${mapSrc}" title="Карта: ${esc(C.city)}, ${esc(C.address)}" loading="lazy" allowfullscreen></iframe>
      <span class="map-caption">${esc(C.addressShort)}</span>
    </div>
  </div>
</section>`;
}

// ---------- Pages ----------
function home() {
  const rel = '';
  const hero = images[HERO.slug].images.find(x => x.file === HERO.file);
  const counts = {};
  projects.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  const services = [
    ['Дизайн интерьера квартир и домов', 'Планировочное решение, 3D-визуализация каждого помещения, подбор материалов и мебели, рабочие чертежи для строителей. Любой стиль — от минимализма до неоклассики.'],
    ['Общественные интерьеры', 'Офисы, банные комплексы, мастерские и коммерческие помещения: продуманные сценарии, зонирование и узнаваемый характер пространства.'],
    ['Архитектурное проектирование', 'Эскизные проекты коттеджей, гаражей и навесов: объём, фасады и материалы — с визуализацией дома на участке.'],
    ['Ландшафтный дизайн', 'Генплан участка, дорожки, зоны отдыха, освещение и озеленение — с визуализацией днём и вечером.'],
    ['Перепланировка и согласование', 'Проект перепланировки и сопровождение согласования, чтобы изменения были законными и безопасными.']
  ];
  const steps = [
    ['Знакомство', 'Обсуждаем задачу, образ жизни и бюджет, выезжаем на объект и делаем обмеры.'],
    ['Планировка', 'Предлагаем варианты расстановки и зонирования — выбираем лучший вместе с вами.'],
    ['Визуализация', 'Показываем каждое помещение в 3D: материалы, свет, мебель, декор — до начала ремонта.'],
    ['Документация', 'Готовим чертежи и спецификации, по которым строители реализуют проект без догадок.']
  ];
  const ld = {
    '@context': 'https://schema.org', '@type': 'HomeAndConstructionBusiness',
    name: C.fullName, url: C.siteUrl, telephone: C.phone, email: C.email,
    image: C.siteUrl + 'img/og.jpg', logo: C.siteUrl + 'img/logo-black.png',
    address: { '@type': 'PostalAddress', addressCountry: 'RU', addressLocality: C.city, streetAddress: C.address },
    geo: { '@type': 'GeoCoordinates', latitude: C.geo.lat, longitude: C.geo.lon },
    areaServed: C.city, sameAs: [igHref],
    description: 'Студия дизайна интерьера в Омске: дизайн квартир, домов и общественных помещений, архитектурное проектирование, ландшафтный дизайн, перепланировка и согласование.'
  };
  const body = `
<section class="hero">
  <img class="hero-image" src="${img(HERO.slug, HERO.file, 'lg')}" srcset="${img(HERO.slug, HERO.file, 'sm')} 720w, ${img(HERO.slug, HERO.file, 'lg')} 1600w" sizes="100vw" width="${hero.w}" height="${hero.h}" alt="Интерьер гостиной в квартире на Масленникова — проект студии ${esc(C.name)}" fetchpriority="high">
  <div class="hero-shade"></div>
  <div class="hero-meta"><span>Студия дизайна интерьера · ${esc(C.city)}</span><span>Интерьеры · Архитектура · Ландшафт</span></div>
  <div class="hero-body">
    <p class="hero-lead">Создаём интерьеры квартир, домов и общественных пространств, в которых каждая деталь на своём месте.</p>
    <h1 class="hero-title">${esc(C.name)}</h1>
  </div>
  <div class="hero-actions">
    <a class="btn" href="#contacts">Обсудить проект</a>
    <a class="hero-link" href="#projects">Смотреть проекты <span class="round-arrow" aria-hidden="true">↓</span></a>
  </div>
</section>

<section class="section">
  <div class="intro">
    <p class="eyebrow">${esc(C.name)} / студия дизайна</p>
    <div class="intro-copy">
      <h2 class="reveal">Проектируем пространство под вашу жизнь — от планировки до последней детали.</h2>
      <div class="intro-text reveal">
        <p>Работаем с квартирами, частными домами и общественными помещениями в любых стилях и направлениях. Каждый проект начинается с того, как вы живёте, и только потом — с того, как это выглядит.</p>
        <p>Кроме дизайна интерьера, берём на себя архитектурное проектирование, ландшафтный дизайн, перепланировку и её согласование — всё, чтобы объект был продуман целиком.</p>
      </div>
      <div class="facts reveal">
        <div class="fact"><b>${projects.length}</b><span>проектов в портфолио</span></div>
        <div class="fact"><b>${counts.private + counts.public}</b><span>интерьеров — жилых и общественных</span></div>
        <div class="fact"><b>3D</b><span>визуализация каждого помещения до начала ремонта</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="projects" style="padding-top:0">
  <div class="section-head"><p class="eyebrow">Избранные проекты</p><p class="eyebrow">${pad(featured.length)} / ${projects.length}</p></div>
  <div class="projects-grid projects-grid--featured">
    ${featured.map((p, i) => card(p, i, rel, { sizes: '(max-width: 860px) 100vw, 75vw', large: true })).join('\n    ')}
  </div>
  <div class="more-row"><a class="btn btn--solid" href="projects/">Все проекты — ${projects.length} <span aria-hidden="true">→</span></a></div>
</section>

<section class="section dark" id="services">
  <div class="section-head"><p class="eyebrow">Направления</p><p class="eyebrow">${pad(services.length)} услуг</p></div>
  <ol class="services-list">
    ${services.map(([t, d], i) => `<li class="service reveal"><span class="service-num">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n    ')}
  </ol>
</section>

<section class="statement">
  <p class="eyebrow">Подход</p>
  <p class="statement-text reveal">Сначала — как вы живёте. <em>Потом — как это выглядит.</em></p>
</section>

<section class="section" id="process">
  <div class="section-head"><p class="eyebrow">Как мы работаем</p><p class="eyebrow">${pad(steps.length)} этапа</p></div>
  <ol class="process-list">
    ${steps.map(([t, d], i) => `<li class="step reveal"><span class="step-num">${pad(i + 1)}</span><h3>${t}</h3><p>${d}</p></li>`).join('\n    ')}
  </ol>
</section>

${contactSection(rel)}`;
  return layout({
    rel, canonical: '', body, jsonLd: ld,
    title: `${C.name} — студия дизайна интерьера в Омске`,
    description: 'Дизайн интерьера квартир, домов и общественных помещений в Омске. Архитектурное проектирование, ландшафтный дизайн, перепланировка и согласование. Портфолио: ' + projects.length + ' проектов.'
  });
}

function projectsIndex() {
  const rel = '../';
  const counts = {};
  projects.forEach(p => { counts[p.category] = (counts[p.category] || 0) + 1; });
  const body = `
<section class="page-head">
  <p class="eyebrow">${esc(C.name)} / портфолио</p>
  <h1>Проекты</h1>
  <p class="lead">Интерьеры квартир, домов и общественных пространств, архитектурные и ландшафтные проекты студии.</p>
</section>
<div class="filters" role="group" aria-label="Фильтр проектов">
  <button class="filter" type="button" data-filter="all" aria-pressed="true">Все <sup>${projects.length}</sup></button>
  ${Object.entries(CATEGORIES).map(([k, v]) => `<button class="filter" type="button" data-filter="${k}" aria-pressed="false">${v.label} <sup>${counts[k] || 0}</sup></button>`).join('\n  ')}
</div>
<div class="projects-grid projects-grid--all">
  ${projects.map((p, i) => card(p, i, rel, { lazy: i > 5 })).join('\n  ')}
</div>
<section class="cta-band dark">
  <h2>Хотите такой же продуманный интерьер?</h2>
  <a class="btn btn--solid" href="../#contacts">Обсудить проект <span aria-hidden="true">→</span></a>
</section>`;
  return layout({
    rel, canonical: 'projects/', body, current: 'projects', light: true,
    title: `Проекты — ${C.name}, студия дизайна интерьера в Омске`,
    description: `Портфолио студии «${C.name}»: ${projects.length} проектов — интерьеры квартир и коттеджей, офисы, банные комплексы, архитектура и ландшафтный дизайн.`
  });
}

function galleryRows(list) {
  // Cover wide; then alternate wide landscape / pair of landscapes / pair of portraits
  const [cover, ...rest] = list;
  const L = rest.filter(x => x.w >= x.h), P = rest.filter(x => x.w < x.h);
  const out = [{ im: cover, cls: 'shot--wide', ratio: `${cover.w} / ${cover.h}` }];
  const half = (im, portrait) => ({ im, cls: '', ratio: portrait ? '3 / 4' : '4 / 3' });
  while (L.length || P.length) {
    if (L.length === 1 || L.length >= 3) { const im = L.shift(); out.push({ im, cls: 'shot--wide', ratio: `${im.w} / ${im.h}` }); }
    if (L.length >= 2) out.push(half(L.shift()), half(L.shift()));
    if (P.length >= 2) out.push(half(P.shift(), true), half(P.shift(), true));
    else if (P.length === 1) {
      if (L.length) out.push(half(P.shift(), true), half(L.shift(), true));
      else { const im = P.shift(); out.push({ im, cls: 'shot--wide', ratio: 'auto', portraitSolo: true }); }
    }
  }
  return out;
}

function projectPage(p, i) {
  const rel = '../../';
  const data = images[p.slug];
  const cat = CATEGORIES[p.category];
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];
  const rows = galleryRows(data.images);
  const shots = rows.map((r, k) => {
    const alt = `${p.title} — визуализация ${k + 1}`;
    const style = r.portraitSolo ? 'max-width:720px;justify-self:center' : `aspect-ratio:${r.ratio}`;
    return `<figure class="shot ${r.cls} reveal" style="${style}"><button type="button" data-full="${rel}${img(p.slug, r.im.file, 'lg')}" aria-label="Открыть изображение ${k + 1}"><img src="${rel}${img(p.slug, r.im.file, r.cls ? 'lg' : 'sm')}" srcset="${rel}${img(p.slug, r.im.file, 'sm')} 720w, ${rel}${img(p.slug, r.im.file, 'lg')} 1600w" sizes="${r.cls ? '100vw' : '(max-width: 860px) 100vw, 50vw'}" width="${r.im.w}" height="${r.im.h}" alt="${esc(alt)}"${k > 0 ? ' loading="lazy"' : ''} decoding="async"></button></figure>`;
  }).join('\n  ');
  const body = `
<section class="project-head">
  <nav class="crumbs eyebrow" aria-label="Навигация"><a href="${rel}">Главная</a><span>/</span><a href="${rel}projects/">Проекты</a><span>/</span><a href="${rel}projects/#${p.category}">${cat.label}</a></nav>
  <h1>${esc(p.title)}</h1>
  <dl class="project-facts">
    <div><dt class="eyebrow">Направление</dt><dd>${esc(cat.label)}</dd></div>
    <div><dt class="eyebrow">Тип проекта</dt><dd>${esc(p.type)}</dd></div>
    <div><dt class="eyebrow">Место</dt><dd>${esc(p.place)}</dd></div>
    <div><dt class="eyebrow">Визуализации</dt><dd>${data.images.length} из ${data.total}</dd></div>
  </dl>
</section>
<div class="gallery">
  ${shots}
</div>
<nav class="project-nav" aria-label="Другие проекты">
  <a href="${rel}projects/${prev.slug}/"><span class="eyebrow">← Предыдущий</span><b>${esc(prev.title)}</b></a>
  <a href="${rel}projects/${next.slug}/"><span class="eyebrow">Следующий →</span><b>${esc(next.title)}</b></a>
</nav>
<section class="cta-band">
  <h2>Нравится этот проект? Сделаем ваш.</h2>
  <a class="btn btn--solid" href="${rel}#contacts">Обсудить проект <span aria-hidden="true">→</span></a>
</section>
<div class="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображений" aria-hidden="true">
  <div class="lightbox-bar"><span class="lb-counter"></span><button class="lb-btn lb-close" type="button" aria-label="Закрыть">✕</button></div>
  <div class="lightbox-stage"><button class="lb-btn lb-prev" type="button" aria-label="Предыдущее">←</button><img alt=""><button class="lb-btn lb-next" type="button" aria-label="Следующее">→</button></div>
</div>`;
  return layout({
    rel, canonical: `projects/${p.slug}/`, body, current: 'projects',
    ogImage: img(p.slug, data.images[0].file, 'lg'),
    title: `${p.title} — ${p.type.toLowerCase()} | ${C.name}`,
    description: `${p.type}: ${p.title}, ${p.place}. Проект студии дизайна интерьера «${C.name}», ${C.city}. ${data.images.length} визуализаций.`,
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: C.siteUrl },
        { '@type': 'ListItem', position: 2, name: 'Проекты', item: C.siteUrl + 'projects/' },
        { '@type': 'ListItem', position: 3, name: p.title, item: `${C.siteUrl}projects/${p.slug}/` }
      ]
    }
  });
}

function privacy() {
  const rel = '../';
  const operator = C.legalName ? `${esc(C.legalName)} (${esc(C.fullName)})` : esc(C.fullName);
  const body = `
<article class="legal">
  <p class="eyebrow">Документ</p>
  <h1>Политика конфиденциальности</h1>
  <p>Настоящая политика описывает, как ${operator} (далее — «Студия», «Оператор») обрабатывает персональные данные посетителей сайта в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ «О персональных данных».</p>

  <h2>1. Какие данные мы получаем</h2>
  <p>Через форму на сайте вы можете передать: имя, номер телефона, тип объекта и текст комментария. Других персональных данных сайт не собирает.</p>

  <h2>2. Как передаются данные</h2>
  <p>Сайт не хранит данные формы на собственном сервере. После нажатия кнопки «Отправить заявку» данные формы передаются на электронную почту Студии через сервис доставки писем FormSubmit (formsubmit.co), который используется только для пересылки заявки. Вы также можете связаться с нами напрямую по телефону или электронной почте.</p>

  <h2>3. Цели обработки</h2>
  <ul>
    <li>ответ на обращение и консультация по услугам;</li>
    <li>подготовка коммерческого предложения и заключение договора;</li>
    <li>связь с вами по вопросам выполняемого проекта.</li>
  </ul>

  <h2>4. Правовое основание и сроки</h2>
  <p>Данные обрабатываются на основании вашего <a href="${rel}soglasie-na-obrabotku/">согласия на обработку персональных данных</a>, которое вы даёте отдельно, отмечая соответствующий пункт в форме. Данные хранятся не дольше, чем этого требуют цели обработки, либо до отзыва согласия.</p>

  <h2>5. Передача третьим лицам</h2>
  <p>Студия не продаёт ваши данные и не передаёт их третьим лицам, за исключением: сервиса FormSubmit, через который заявка доставляется на почту Студии; сервиса «Яндекс Метрика», который обрабатывает обезличенные данные о посещении сайта; и случаев, предусмотренных законодательством РФ.</p>

  <h2>6. Cookie и сторонние сервисы</h2>
  <p>Сайт использует cookie и локальное хранилище браузера, чтобы корректно работать (например, запомнить, что вы закрыли уведомление о cookie). На странице контактов встроена карта «Яндекс Карты», которая может устанавливать собственные cookie согласно политике Яндекса.</p>
  <p>На сайте установлен счётчик «Яндекс Метрика» (номер ${METRIKA_ID}). Он собирает обезличенные сведения о посещении: страницы, которые вы открывали, источник перехода, дату и время визита, тип устройства, операционную систему, браузер, разрешение экрана, примерный регион по IP-адресу, а также действия на странице — клики, прокрутку и перемещение курсора. В счётчике включена функция «Вебвизор», которая записывает эти действия для последующего просмотра; содержимое полей формы при записи скрывается. Данные обрабатываются на серверах ООО «Яндекс» на условиях <a href="https://yandex.ru/legal/confidential/" target="_blank" rel="noopener">политики конфиденциальности Яндекса</a>. Отказаться от сбора статистики можно, отключив cookie в настройках браузера или установив <a href="https://yandex.ru/support/metrica/general/opt-out.html" target="_blank" rel="noopener">блокировщик Яндекс Метрики</a>. Иных сервисов веб-аналитики и рекламного отслеживания на сайте не установлено.</p>

  <h2>7. Ваши права</h2>
  <p>Вы вправе запросить сведения об обработке ваших данных, потребовать их уточнения или удаления, а также отозвать согласие. Для этого напишите на <a href="mailto:${C.email}">${esc(C.email)}</a> или позвоните по телефону <a href="${telHref}">${esc(C.phoneDisplay)}</a>.</p>

  <h2>8. Контакты оператора</h2>
  <p>${esc(C.fullName)}<br>${esc(C.city)}, ${esc(C.address)}<br>Телефон: ${esc(C.phoneDisplay)}<br>E-mail: ${esc(C.email)}</p>
  <p>Редакция от 30.09.2026.</p>
</article>`;
  return layout({ rel, canonical: 'politika-konfidentsialnosti/', body, light: true, title: `Политика конфиденциальности — ${C.name}`, description: `Политика обработки персональных данных студии дизайна интерьера «${C.name}», ${C.city}.` });
}

function consent() {
  const rel = '../';
  const operator = C.legalName ? `${esc(C.legalName)} (${esc(C.fullName)})` : esc(C.fullName);
  const body = `
<article class="legal">
  <p class="eyebrow">Документ</p>
  <h1>Согласие на обработку персональных данных</h1>
  <p>Отправляя заявку на сайте ${C.siteUrl}, я свободно, своей волей и в своём интересе даю согласие оператору — ${operator}, адрес: ${esc(C.city)}, ${esc(C.address)} (далее — «Оператор») — на обработку моих персональных данных на следующих условиях.</p>

  <h2>1. Какие данные</h2>
  <p>Имя, номер телефона, а также сведения об объекте и комментарий, которые я указываю в форме.</p>

  <h2>2. Цели обработки</h2>
  <p>Ответ на мою заявку, консультация по услугам студии, подготовка предложения и заключение договора.</p>

  <h2>3. Действия с данными</h2>
  <p>Сбор, запись, систематизация, хранение, уточнение, использование, удаление и уничтожение — с использованием средств автоматизации и без них. Для доставки заявки на почту Оператора данные передаются через сервис FormSubmit (formsubmit.co); иным третьим лицам данные не передаются, кроме случаев, предусмотренных законодательством РФ.</p>

  <h2>4. Срок действия и отзыв</h2>
  <p>Согласие действует до достижения целей обработки либо до его отзыва. Отозвать согласие можно в любой момент, направив письмо на <a href="mailto:${C.email}">${esc(C.email)}</a> или сообщив по телефону <a href="${telHref}">${esc(C.phoneDisplay)}</a>. После отзыва Оператор прекращает обработку и удаляет данные в срок, установленный Федеральным законом № 152-ФЗ «О персональных данных».</p>

  <p>Порядок обработки данных подробно описан в <a href="${rel}politika-konfidentsialnosti/">политике конфиденциальности</a>.</p>
  <p>Редакция от 28.09.2026.</p>
</article>`;
  return layout({ rel, canonical: 'soglasie-na-obrabotku/', body, light: true, title: `Согласие на обработку персональных данных — ${C.name}`, description: `Согласие на обработку персональных данных для студии дизайна интерьера «${C.name}», ${C.city}.` });
}

function notFound() {
  // 404 is served at arbitrary depths on GitHub Pages, so it links by absolute path
  const base = new URL(C.siteUrl).pathname;
  const body = `<section class="page-head" style="min-height:70svh"><p class="eyebrow">Ошибка 404</p><h1>Страница не найдена</h1><p class="lead">Возможно, она переехала. Посмотрите наши проекты или вернитесь на главную.</p><p style="margin-top:32px;display:flex;gap:12px;flex-wrap:wrap"><a class="btn btn--solid" href="${base}">На главную</a><a class="btn" href="${base}projects/">Проекты</a></p></section>`;
  return layout({ rel: base, canonical: '404.html', body, light: true, title: `Страница не найдена — ${C.name}`, description: 'Страница не найдена.' });
}

// ---------- Write ----------
function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}

async function ogImage() {
  const dest = path.join(OUT, 'img', 'og.jpg');
  if (fs.existsSync(dest)) return;
  const sharp = require('sharp');
  const src = path.join(OUT, img(HERO.slug, HERO.file, 'lg'));
  const logo = await sharp(path.join(OUT, 'img', 'logo-white.png')).resize({ height: 260 }).toBuffer();
  await sharp(src).resize(1200, 630, { fit: 'cover' }).modulate({ brightness: .55, saturation: .5 })
    .composite([{ input: logo, gravity: 'center' }]).jpeg({ quality: 82 }).toFile(dest);
}

async function main() {
  write('index.html', home());
  write('projects/index.html', projectsIndex());
  projects.forEach((p, i) => write(`projects/${p.slug}/index.html`, projectPage(p, i)));
  write('politika-konfidentsialnosti/index.html', privacy());
  write('soglasie-na-obrabotku/index.html', consent());
  write('404.html', notFound());
  write('favicon.svg', `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#0b0b0b"/><path d="M13 11.5 L52 12.5 L51 53 L14 52 Z" fill="none" stroke="#fff" stroke-width="3.2"/><path d="M25 20v25M25 33l12-13M29 29l9 16" fill="none" stroke="#fff" stroke-width="3.6"/></svg>`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${C.siteUrl}sitemap.xml\n`);
  const urls = ['', 'projects/', 'politika-konfidentsialnosti/', 'soglasie-na-obrabotku/', ...projects.map(p => `projects/${p.slug}/`)];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${C.siteUrl}${u}</loc></url>`).join('\n')}\n</urlset>\n`);
  write('.nojekyll', '');
  // Apache на обычном хостинге: своя 404-я и сжатие.
  // Редирект на https пишется только при "httpsReady": true в company.json:
  // без выпущенного сертификата он кладёт сайт, поэтому флаг включается
  // вручную после Let's Encrypt.
  const host = new URL(C.siteUrl).host;
  // Хостинг держит Apache за nginx, поэтому %{HTTPS} на https-запросе может
  // быть off. Проверяем и заголовок от прокси — иначе получится петля.
  const redirect = C.httpsReady ? `RewriteEngine On

RewriteCond %{HTTPS} !=on
RewriteCond %{HTTP:X-Forwarded-Proto} !=https
RewriteRule ^ https://${host}%{REQUEST_URI} [R=301,L]

RewriteCond %{HTTP_HOST} ^www[.] [NC]
RewriteRule ^ https://${host}%{REQUEST_URI} [R=301,L]

` : '';
  write('.htaccess', `${redirect}ErrorDocument 404 /404.html

<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript image/svg+xml application/xml
</IfModule>

<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
`);
  await ogImage();
  console.log('built', urls.length, 'pages');
}

main().catch(e => { console.error(e); process.exit(1); });
