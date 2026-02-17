// --- 1. Global State & Config ---
let currentLang = (() => {
    const saved = localStorage.getItem('lang');
    if (saved) return saved;

    const browserLang = navigator.language || navigator.userLanguage;
    return (browserLang && browserLang.toLowerCase().startsWith('th')) ? 'th' : 'en';
})();
let devicesData = [];
let filteredDevices = [];
let currentPage = 1;
let itemsPerPage = window.innerWidth < 992 ? 16 : 30;

const uiStrings = {
    th: {
        nav_menu: "หน้าหลัก",
        all: "6767",
        view_spec: "ดูข้อมูล",
        desc_label: "ข้อมูลทั่วไป",
        pinout_label: "ตำแหน่งขา",
        home_link: "หน้าหลัก",
        search_placeholder: "ค้นหา...",
        footer_text: "IOT-ARENA: สารานุกรม IoT",
        p_title: "คลังข้อมูล IOT-ARENA",
        p_intro: "แหล่งรวมข้อมูลไมโครคอนโทรลเลอร์และเซนเซอร์ พร้อมคู่มือการใช้งาน",
        p_l1: "ระบบค้นหา",
        p_l2: "คู่มือต่อวงจร",
        p_l3: "หมวดหมู่มาตรฐาน",
        p_l4: "ภาษาไทย/อังกฤษ",
        p_btn: "เข้าสู่คลังข้อมูล",
        cat_mcu: "ไมโครคอนโทรลเลอร์",
        cat_sensor: "เซนเซอร์",
        cat_display: "จอแสดงผล",
        cat_module: "โมดูล",
        cat_actuator: "แอคชูเอเตอร์",
        use_cases: "การใช้งาน",
        tips: "ข้อแนะนำ",
        specs: "คุณสมบัติ",
        about_title: "เกี่ยวกับ",
        about_desc: "IOT-ARENA คือสารานุกรมดิจิทัลสำหรับรวบรวมข้อมูลทางเทคนิคของอุปกรณ์ IoT เพื่อการศึกษาและพัฒนา",
        team_title: "ผู้พัฒนา",
        contact_title: "ติดต่อสอบถาม",
        contact_desc: "แจ้งข้อมูลผิดพลาดหรือแนะนำอุปกรณ์ได้ที่",
        apps_label: "ตัวอย่างงานจริง",
        setup_label: "ขั้นตอนการใช้งาน",
        footer_desc: "ศูนย์ข้อมูล IoT สำหรับนักพัฒนา",
        footer_links_title: "ทางลัด",
        footer_follow_title: "ติดตามได้ที่",
        footer_copyright: "© 2026 IOT-ARENA",
        deep_dive: "ข้อมูลแบบเจาะลึก",
        where_to_buy: "แหล่งจำหน่าย",
    },
    en: {
        nav_menu: "Main Menu",
        all: "All Devices",
        view_spec: "View Data",
        desc_label: "Overview",
        pinout_label: "Pinout Diagram",
        home_link: "Return Home",
        search_placeholder: "Search",
        footer_text: "IOT-ARENA: Open Source IoT Wiki",
        p_title: "IOT-ARENA Knowledge Base",
        p_intro: "A comprehensive repository for microcontrollers, sensors, and IoT modules with streamlined documentation.",
        p_l1: "Smart Search",
        p_l2: "Wiring Schematics",
        p_l3: "Standardized Categories",
        p_l4: "TH / EN",
        p_btn: "ACCESS LIBRARY",
        cat_mcu: "MICROCONTROLLERS",
        cat_sensor: "SENSORS",
        cat_display: "DISPLAYS",
        cat_module: "MODULES",
        cat_actuator: "ACTUATORS",
        use_cases: "Use Case Scenarios",
        tips: "Tips & Cautions",
        specs: "Technical Specifications",
        about_title: "About",
        about_desc: "IOT-ARENA is an open-source digital encyclopedia dedicated to documenting IoT technologies. We aim to organize technical knowledge for educational purposes and development.",
        team_title: "Development Team",
        contact_title: "Contact Us",
        contact_desc: "For suggestions or error reporting, please reach out to our working group via the channels below.",
        apps_label: "Real-world Applications",
        setup_label: "Prerequisites & Software",
        footer_desc: "The IoT Knowledge Center for Developers.",
        footer_links_title: "Quick Navigation",
        footer_follow_title: "Follow Us",
        footer_copyright: "© 2026 IOT-ARENA. All rights reserved.",
        deep_dive: "Technical Deep Dive",
        where_to_buy: "Sourcing Channels"
    }
};

const categoryIcons = {
    mcu: "bi-cpu",
    sensor: "bi-broadcast-pin",
    display: "bi-tv",
    module: "bi-box-seam",
    actuator: "bi-gear-wide-connected",
    all: "bi-collection-fill"
};

// --- 2. Utility Functions ---
const getPath = (file) => window.location.pathname.includes('/page/') ? `../${file}` : file;

function handleImageError(img) {
    img.onerror = null;

    if (img.id === 'pinoutImg') {
        img.style.display = 'none';
        const parent = img.parentElement;
        if (parent && !parent.querySelector('.pinout-placeholder')) {
            const p = document.createElement('div');
            p.className = 'pinout-placeholder p-4 bg-light text-muted border rounded';
            p.innerHTML = '<i class="bi bi-diagram-3" style="font-size: 2rem;"></i><br><span>Schema not available / ยังไม่มีข้อมูลผังขา</span>';
            parent.appendChild(p);
        }
        return;
    }

    const src = img.src;
    const currentExt = src.substring(src.lastIndexOf('.'));
    const extensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];

    if (!img.dataset.triedExts) {
        img.dataset.triedExts = JSON.stringify([currentExt]); // Start tracking
    }

    let tried = JSON.parse(img.dataset.triedExts);
    let nextExt = extensions.find(ext => !tried.includes(ext));

    if (nextExt) {
        tried.push(nextExt);
        img.dataset.triedExts = JSON.stringify(tried);

        const basePath = src.substring(0, src.lastIndexOf('.'));
        img.src = basePath + nextExt;
    } else {
        img.style.display = 'none';
        delete img.dataset.triedExts;

        const parent = img.parentElement;
        if (parent && !parent.querySelector('.img-placeholder')) {
            const placeholder = document.createElement('div');
            placeholder.className = 'img-placeholder';
            placeholder.innerHTML = '<i class="bi bi-image"></i><span>No Image</span>';
            parent.appendChild(placeholder);
        }
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// --- 3. Data Handling ---
async function loadData() {
    try {
        const listRes = await fetch(getPath('data/list.json'));
        const ids = await listRes.json();

        const batchSize = 5;
        devicesData = [];
        for (let i = 0; i < ids.length; i += batchSize) {
            const batch = ids.slice(i, i + batchSize);
            const batchPromises = batch.map(id => fetch(getPath(`data/${id}.json`)).then(res => res.json()));
            const batchResults = await Promise.all(batchPromises);
            devicesData.push(...batchResults);
        }

        filteredDevices = [...devicesData];

        updateUI();
        return true;
    } catch (e) {
        console.error("Data Load Error:", e);
        return false;
    }
}

// --- 4. UI Rendering ---
function updateUI() {
    const searchInputs = [document.getElementById('deviceSearchDesktop'), document.getElementById('deviceSearchMobile'), document.getElementById('deviceSearch')];
    searchInputs.forEach(input => {
        if (input) input.placeholder = uiStrings[currentLang].search_placeholder;
    });
    if (document.getElementById('footerText')) document.getElementById('footerText').innerText = uiStrings[currentLang].footer_text;
    if (document.getElementById('menuLabel')) document.getElementById('menuLabel').innerText = uiStrings[currentLang].nav_menu;
    if (document.getElementById('backBtnText')) document.getElementById('backBtnText').innerText = uiStrings[currentLang].home_link;
    if (document.getElementById('descLabel')) document.getElementById('descLabel').innerText = uiStrings[currentLang].desc_label;

    if (document.getElementById('footerDesc')) document.getElementById('footerDesc').innerText = uiStrings[currentLang].footer_desc;
    if (document.getElementById('footerLinksTitle')) document.getElementById('footerLinksTitle').innerText = uiStrings[currentLang].footer_links_title;
    if (document.getElementById('footerFollowTitle')) document.getElementById('footerFollowTitle').innerText = uiStrings[currentLang].footer_follow_title;
    if (document.getElementById('footerCopyright')) document.getElementById('footerCopyright').innerText = uiStrings[currentLang].footer_copyright;

    if (document.getElementById('aboutTitle')) document.getElementById('aboutTitle').innerText = uiStrings[currentLang].about_title;
    if (document.getElementById('aboutDesc')) document.getElementById('aboutDesc').innerText = uiStrings[currentLang].about_desc;
    if (document.getElementById('teamTitle')) document.getElementById('teamTitle').innerText = uiStrings[currentLang].team_title;
    if (document.getElementById('contactTitle')) document.getElementById('contactTitle').innerText = uiStrings[currentLang].contact_title;
    if (document.getElementById('contactDesc')) document.getElementById('contactDesc').innerText = uiStrings[currentLang].contact_desc;

    // Desktop nav links localization
    if (document.getElementById('desktopNavHome')) document.getElementById('desktopNavHome').innerHTML = `<i class="bi bi-house-door-fill"></i> ${uiStrings[currentLang].home_link}`;
    if (document.getElementById('desktopNavAbout')) document.getElementById('desktopNavAbout').innerHTML = `<i class="bi bi-info-circle-fill"></i> ${uiStrings[currentLang].about_title}`;
    if (document.getElementById('desktopNavContact')) document.getElementById('desktopNavContact').innerHTML = `<i class="bi bi-envelope-fill"></i> ${uiStrings[currentLang].contact_title}`;

    const allBtnsTH = document.querySelectorAll('#btnLangTH');
    const allBtnsEN = document.querySelectorAll('#btnLangEN');
    allBtnsTH.forEach(btn => currentLang === 'th' ? btn.classList.add('active') : btn.classList.remove('active'));
    allBtnsEN.forEach(btn => currentLang === 'en' ? btn.classList.add('active') : btn.classList.remove('active'));


    const heroMap = {
        'heroTitle': 'p_title', 'heroIntro': 'p_intro',
        'heroL1': 'p_l1', 'heroL2': 'p_l2', 'heroL3': 'p_l3', 'heroL4': 'p_l4',
        'heroBtn': 'p_btn'
    };
    for (let id in heroMap) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = uiStrings[currentLang][heroMap[id]];
    }

    if (document.getElementById('dynamicSidebar')) renderSidebar();
    if (document.getElementById('deviceGrid')) renderHome();
    if (document.getElementById('deviceTitle')) renderDetails();
}

function renderSidebar() {
    const sidebar = document.getElementById('dynamicSidebar');
    if (!sidebar) return;

    const categories = [...new Set(devicesData.map(dev => dev.category))];

    let html = `<div class="sidebar-label">${uiStrings[currentLang].nav_menu}</div>`;
    html += `<div class="sidebar-links-container">`;

    const searchInput = document.getElementById('deviceSearchDesktop');
    const isAllActive = filteredDevices.length === devicesData.length && (!searchInput || searchInput.value === "");
    html += `
        <button class="sidebar-link ${isAllActive ? 'active' : ''}" onclick="filterDevices('all', event)">
            <span class="cat-icon-wrapper"><i class="bi ${categoryIcons.all}"></i></span>
            <span class="cat-text">${uiStrings[currentLang].all}</span>
        </button>`;

    categories.forEach(cat => {
        const displayName = uiStrings[currentLang][`cat_${cat}`] || cat.toUpperCase().replace('_', ' ');
        const icon = categoryIcons[cat] || "bi-tag-fill";
        const isActive = filteredDevices.length > 0 && filteredDevices.every(d => d.category === cat) && filteredDevices.length < devicesData.length;
        html += `
            <button class="sidebar-link ${isActive ? 'active' : ''}" onclick="filterDevices('${cat}', event)">
                <span class="cat-icon-wrapper"><i class="bi ${icon}"></i></span>
                <span class="cat-text">${displayName}</span>
            </button>`;
    });

    html += `</div>`;
    sidebar.innerHTML = html;
}


function renderCategoriesMobile() {
    const container = document.getElementById('dynamicCategoriesMobile');
    if (!container) return;

    const categories = [...new Set(devicesData.map(dev => dev.category))];

    let html = `<div class="category-vertical-list">`;

    const searchVal = document.getElementById('deviceSearchMobile') ? document.getElementById('deviceSearchMobile').value : "";
    const isAllActive = filteredDevices.length === devicesData.length && searchVal === "";

    html += `
        <button class="cat-list-item ${isAllActive ? 'active' : ''}" onclick="filterDevices('all', event)">
            <div class="d-flex align-items-center">
                <div class="cat-icon-box"><i class="bi ${categoryIcons.all}"></i></div>
                <span class="cat-name">${uiStrings[currentLang].all}</span>
            </div>
            <i class="bi bi-chevron-right ms-auto opacity-50"></i>
        </button>`;

    categories.forEach(cat => {
        const displayName = uiStrings[currentLang][`cat_${cat}`] || cat.toUpperCase();
        const icon = categoryIcons[cat] || "bi-tag-fill";
        const isActive = !isAllActive && filteredDevices.every(dev => dev.category === cat) && filteredDevices.length > 0;

        html += `
            <button class="cat-list-item ${isActive ? 'active' : ''}" onclick="filterDevices('${cat}', event)">
                <div class="d-flex align-items-center">
                    <div class="cat-icon-box"><i class="bi ${icon}"></i></div>
                    <span class="cat-name">${displayName}</span>
                </div>
                <i class="bi bi-chevron-right ms-auto opacity-50"></i>
            </button>`;
    });

    html += `</div>`;
    container.innerHTML = html;
}

function renderHome() {
    const grid = document.getElementById('deviceGrid');
    if (!grid) return;

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filteredDevices.slice(startIndex, endIndex);

    const catLabel = (cat) => uiStrings[currentLang][`cat_${cat}`] || cat.toUpperCase();
    grid.innerHTML = paginatedItems.map(dev => {
        const catPrefix = dev.category.charAt(0).toUpperCase();
        const displayId = `${catPrefix}-${dev.id.substring(0, 3).toUpperCase()}`;

        return `
        <div class="col device-item"> 
            <div class="device-card">
                <div class="manga-id-tag">${displayId}</div>
                <div class="device-card-img">
                    <img src="${getPath(dev.image)}" class="img-fluid" loading="lazy" decoding="async" onerror="handleImageError(this)">
                </div>
                <div class="device-card-body">
                    <div class="mb-2">
                        <div class="device-card-title">${dev.title[currentLang]}</div>
                        <div class="device-card-subtitle">${dev.sub_title[currentLang]}</div>
                        <div class="device-card-meta">
                            <span class="manga-badge cat-${dev.category}"><i class="bi ${categoryIcons[dev.category] || 'bi-tag'}"></i> ${catLabel(dev.category)}</span>
                        </div>
                    </div>
                    <a href="page/template.html?id=${dev.id}" class="manga-btn w-100 text-center">${uiStrings[currentLang].view_spec} <i class="bi bi-arrow-right"></i></a>
                </div>
            </div>
        </div>`;
    }).join('');

    grid.classList.remove('page-animate');
    requestAnimationFrame(() => {
        grid.classList.add('page-animate');
    });

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('paginationContainer');
    if (!container) return;

    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    if (totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = `<ul class="pagination pagination-sm">`;

    html += `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage - 1})"><i class="bi bi-chevron-left"></i></button>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }

    html += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <button class="page-link" onclick="changePage(${currentPage + 1})"><i class="bi bi-chevron-right"></i></button>
        </li>
    `;

    html += `</ul>`;
    container.innerHTML = html;
}

function renderDetails() {
    const id = new URLSearchParams(window.location.search).get('id');
    const dev = devicesData.find(d => d.id === id);
    if (!dev) return;

    const mainEl = document.querySelector('main');
    if (mainEl) {
        mainEl.classList.remove('page-animate');
        requestAnimationFrame(() => {
            mainEl.classList.add('page-animate');
        });
    }

    document.getElementById('deviceTitle').innerText = dev.title[currentLang];
    document.getElementById('deviceSubTitle').innerText = dev.sub_title[currentLang];
    document.getElementById('deviceImg').src = getPath(dev.image);
    document.getElementById('deviceImg').setAttribute('loading', 'lazy');
    document.getElementById('deviceImg').setAttribute('decoding', 'async');
    document.getElementById('deviceImg').setAttribute('onerror', 'handleImageError(this)');

    const badgeEl = document.getElementById('deviceCategoryBadge');
    if (badgeEl) {
        const catLabel = uiStrings[currentLang][`cat_${dev.category}`] || dev.category.toUpperCase();
        badgeEl.className = `category-badge cat-${dev.category}`;
        badgeEl.innerHTML = `<i class="bi bi-tag-fill"></i> ${catLabel}`;
    }

    const hlContainer = document.getElementById('highlightCards');
    if (hlContainer && dev.specs.length > 0) {
        const highlights = dev.specs.slice(0, 3);

        // Helper to pick icon and color based on label text
        const getSpecStyle = (label) => {
            const l = label.toLowerCase();
            if (l.includes('volt') || l.includes('supply') || l.includes('power')) return { icon: 'bi-plug-fill', color: 'hl-amber' };
            if (l.includes('gas') || l.includes('detect') || l.includes('range')) return { icon: 'bi-speedometer2', color: 'hl-green' };
            if (l.includes('output') || l.includes('interface')) return { icon: 'bi-hdd-network-fill', color: 'hl-cyan' };
            if (l.includes('process') || l.includes('cpu') || l.includes('chip')) return { icon: 'bi-cpu-fill', color: 'hl-red' };
            if (l.includes('memory') || l.includes('ram') || l.includes('flash') || l.includes('sram')) return { icon: 'bi-memory', color: 'hl-purple' };
            if (l.includes('wifi') || l.includes('wireless') || l.includes('bluetooth')) return { icon: 'bi-wifi', color: '' };
            if (l.includes('temp') || l.includes('humi')) return { icon: 'bi-thermometer-half', color: 'hl-amber' };
            if (l.includes('dimension') || l.includes('size')) return { icon: 'bi-arrows-fullscreen', color: 'hl-cyan' };
            return { icon: 'bi-lightning-charge-fill', color: '' }; // Fallback
        };

        hlContainer.innerHTML = highlights.map(s => {
            const style = getSpecStyle(s.label);
            return `
            <div class="highlight-card ${style.color}">
                <i class="bi ${style.icon}"></i>
                <div class="hl-info">
                    <div class="hl-label">${s.label}</div>
                    <div class="hl-value">${s.value}</div>
                </div>
            </div>
        `}).join('');
    }

    // --- Description Section ---
    document.getElementById('descLabel').innerText = uiStrings[currentLang].desc_label;
    document.getElementById('deviceDesc').innerText = dev.description[currentLang];

    // --- Use Cases Section ---
    const ucSection = document.getElementById('useCasesSection');
    if (dev.use_cases && dev.use_cases[currentLang]) {
        ucSection.style.display = 'block';
        document.getElementById('useCasesLabel').innerText = uiStrings[currentLang].use_cases;
        document.getElementById('useCasesContainer').innerHTML = dev.use_cases[currentLang].map(uc => `
            <span class="use-case-pill"><i class="bi bi-check-circle-fill"></i> ${uc}</span>
        `).join('');
    }

    // --- Applications Section ---
    const appsSection = document.getElementById('appsSection');
    if (appsSection && dev.applications && dev.applications[currentLang]) {
        appsSection.style.display = 'block';
        document.getElementById('appsLabel').innerText = uiStrings[currentLang].apps_label;
        document.getElementById('appsContainer').innerHTML = dev.applications[currentLang].map(app => `
            <div class="app-card mb-3 p-3 border rounded">
                <div class="fw-bold m-0 mb-1"><i class="bi bi-rocket-takeoff-fill me-2"></i>${app.title}</div>
                <div class="small text-muted">${app.desc}</div>
            </div>
        `).join('');
    }

    // --- Tips Section ---
    const tipsSection = document.getElementById('tipsSection');
    if (dev.tips && dev.tips[currentLang]) {
        tipsSection.style.display = 'block';
        document.getElementById('tipsLabel').innerText = uiStrings[currentLang].tips;
        document.getElementById('tipsContainer').innerHTML = dev.tips[currentLang].map(tip => `
            <div class="tip-alert"><i class="bi bi-exclamation-circle-fill"></i> <div>${tip}</div></div>
        `).join('');
    }

    // --- Deep Dive Section ---
    const deepDiveSection = document.getElementById('deepDiveSection');
    if (deepDiveSection && dev.deep_dive && dev.deep_dive[currentLang]) {
        deepDiveSection.style.display = 'block';
        document.getElementById('deepDiveLabel').innerText = uiStrings[currentLang].deep_dive || (currentLang === 'th' ? 'เจาะลึกข้อมูลทางเทคนิค' : 'Technical Deep Dive');
        document.getElementById('deepDiveContent').innerHTML = `<div class="deep-dive-text">${dev.deep_dive[currentLang]}</div>`;
    }

    // --- Technical Specs Section ---
    document.getElementById('specsLabel').innerText = uiStrings[currentLang].specs;

    let allSpecs = [...dev.specs];
    if (dev.technical_specs) {
        allSpecs = [...allSpecs, ...dev.technical_specs];
    }

    document.getElementById('specsTable').innerHTML = allSpecs.map(s => `<tr><th>${s.label}</th><td>${s.value}</td></tr>`).join('');

    // --- Pinout Section ---
    const pinoutSection = document.getElementById('pinoutSection');
    if (pinoutSection) {
        // Always show the section container initial state
        pinoutSection.style.display = 'block';
        document.getElementById('pinoutLabel').innerText = uiStrings[currentLang].pinout_label;
        const pinoutImg = document.getElementById('pinoutImg');

        pinoutImg.style.display = 'inline-block';
        const existingPlaceholder = pinoutSection.querySelector('.pinout-placeholder');
        if (existingPlaceholder) existingPlaceholder.remove();

        pinoutImg.src = getPath(`asset/${dev.id}-d.png`);
        pinoutImg.setAttribute('loading', 'lazy');

        const pinoutBody = pinoutSection.querySelector('.detail-section-body');
        const existingDesc = pinoutBody.querySelector('.pinout-desc-text');
        if (existingDesc) existingDesc.remove();

        if (dev.pinout_desc && dev.pinout_desc[currentLang]) {
            const descC = document.createElement('div');
            descC.className = 'pinout-desc-text mt-3 p-3 bg-body-tertiary border-start border-4 border-primary rounded-end small shadow-sm';
            descC.innerHTML = `<i class="bi bi-info-circle-fill text-primary me-2"></i>${dev.pinout_desc[currentLang]}`;
            pinoutBody.appendChild(descC);
        }
    }

    // --- Purchase Info ---
    const buySection = document.getElementById('buySection');
    if (buySection && dev.purchase_info) {
        buySection.style.display = 'block';
        document.getElementById('buyLabel').innerText = uiStrings[currentLang].where_to_buy || (currentLang === 'th' ? 'ซื้อที่ไหน' : 'Where to Buy');

        let buyHtml = '';
        if (dev.purchase_info.price_range) {
            buyHtml += `
                <div class="manga-price-tag">
                    <span class="price-label">EST. PRICE</span>
                    <span class="price-value">${dev.purchase_info.price_range}</span>
                </div>`;
        }


        if (dev.purchase_info.links && dev.purchase_info.links.length > 0) {
            buyHtml += `<div class="manga-buy-grid">`;

            const getShopStyle = (url, title) => {
                const s = (url + ' ' + title).toLowerCase();
                if (s.includes('shopee')) return { cls: 'btn-shopee', icon: 'bi-bag-fill' };
                if (s.includes('lazada')) return { cls: 'btn-lazada', icon: 'bi-basket2-fill' };
                if (s.includes('amazon')) return { cls: 'btn-amazon', icon: 'bi-box-seam-fill' };
                if (s.includes('aliex') || s.includes('ali')) return { cls: 'btn-aliexpress', icon: 'bi-airplane-fill' };
                if (s.includes('digikey')) return { cls: 'btn-digikey', icon: 'bi-cpu-fill' };
                if (s.includes('mouser')) return { cls: 'btn-mouser', icon: 'bi-motherboard-fill' };
                if (s.includes('adafruit')) return { cls: 'btn-adafruit', icon: 'bi-star-fill' };
                if (s.includes('sparkfun')) return { cls: 'btn-sparkfun', icon: 'bi-fire' };
                if (s.includes('arduino')) return { cls: 'btn-arduino', icon: 'bi-infinity' };
                return { cls: '', icon: 'bi-cart-fill' };
            };

            dev.purchase_info.links.forEach((link) => {
                const style = getShopStyle(link.url, link.title);
                buyHtml += `
                    <a href="${link.url}" target="_blank" class="manga-buy-btn ${style.cls}">
                        <span class="btn-icon"><i class="bi ${style.icon}"></i></span>
                        <span class="btn-text">${link.title}</span>
                    </a>`;
            });
            buyHtml += `</div>`;
        }
        document.getElementById('buyContent').innerHTML = buyHtml;
    }

    // --- Guides Section ---
    document.getElementById('guidesContainer').innerHTML = dev.guides.map(g => `
        <div class="wiring-card">
            <div class="wiring-header"><h4><i class="bi bi-diagram-3-fill"></i> ${g.title[currentLang]}</h4></div>
            <div class="wiring-body">
                ${g.image ? `
                <div class="img-container text-center mb-3">
                    <img src="${getPath(g.image)}" class="wiring-img">
                    ${g.image_label ? `<span class="small text-muted d-block mt-2">${g.image_label}</span>` : ''}
                </div>` : ''}
                <ol class="mb-0">${g.steps[currentLang].map(step => `<li class="mb-2">${step}</li>`).join('')}</ol>
            </div>
        </div>`).join('');
}

function initTheme() {
    const theme = localStorage.getItem('theme') || 'auto';
    let visualTheme = theme;
    if (theme === 'auto') {
        visualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    // Set at least once to ensure consistency, though head script handles first paint
    document.documentElement.setAttribute('data-bs-theme', visualTheme);

    // Update all theme buttons (mobile and desktop)
    const btns = document.querySelectorAll('.theme-toggle-btn');
    if (btns.length > 0) {
        let icon = '<i class="bi bi-circle-half"></i>'; // Auto
        if (theme === 'light') icon = '<i class="bi bi-sun-fill"></i>';
        else if (theme === 'dark') icon = '<i class="bi bi-moon-stars-fill"></i>';

        btns.forEach(btn => {
            btn.innerHTML = icon;
        });
    }
}

// --- 5. Event Handlers ---

function changeLang(l) {
    currentLang = l;
    localStorage.setItem('lang', l);
    document.documentElement.setAttribute('data-lang', l);
    updateUI();
}



const debouncedSearch = debounce((inputId) => {
    actualSearch(inputId);
}, 300);

function handleSearch(inputId) {
    if (window.innerWidth < 992) {
        debouncedSearch(inputId);
    } else {
        actualSearch(inputId);
    }
}

function actualSearch(inputId) {
    const input = document.getElementById(inputId || 'deviceSearchDesktop');
    if (!input) return;
    const query = input.value.toLowerCase();

    const otherId = inputId === 'deviceSearchDesktop' ? 'deviceSearchMobile' : 'deviceSearchDesktop';
    const otherInput = document.getElementById(otherId);
    if (otherInput) otherInput.value = input.value;

    const ghostId = inputId === 'deviceSearchDesktop' ? 'searchGhostDesktop' : 'searchGhostMobile';
    const suggestionBoxId = inputId === 'deviceSearchDesktop' ? 'searchSuggestionsDesktop' : 'searchSuggestionsMobile';

    const ghostEl = document.getElementById(ghostId);
    const suggestionBox = document.getElementById(suggestionBoxId);

    filteredDevices = devicesData.filter(dev => {
        const title = (dev.title[currentLang] || "").toLowerCase();
        const subTitle = (dev.sub_title && dev.sub_title[currentLang] ? dev.sub_title[currentLang] : "").toLowerCase();
        const id = (dev.id || "").toLowerCase();
        const catID = dev.category;
        const catTH = (uiStrings.th[`cat_${catID}`] || "").toLowerCase();
        const catEN = (uiStrings.en[`cat_${catID}`] || "").toLowerCase();

        return title.includes(query) ||
            subTitle.includes(query) ||
            id.includes(query) ||
            catTH.includes(query) ||
            catEN.includes(query);
    });

    if (ghostEl) {
        if (query && filteredDevices.length > 0) {
            const bestMatch = filteredDevices[0].title[currentLang];
            if (bestMatch.toLowerCase().startsWith(query)) {
                const typed = input.value;
                const completion = bestMatch.substring(typed.length);
                ghostEl.innerHTML = `<span class="ghost-typed">${typed}</span><span class="ghost-completion">${completion}</span>`;
            } else {
                ghostEl.innerHTML = '';
            }
        } else {
            ghostEl.innerHTML = '';
        }
    }

    if (query && suggestionBox) {
        suggestionBox.classList.remove('d-none');
        if (filteredDevices.length > 0) {
            suggestionBox.innerHTML = filteredDevices.slice(0, 8).map(dev => `
                <a href="${getPath('page/template.html')}?id=${dev.id}" class="suggestion-item">
                    <div class="suggestion-info">
                        <span class="suggestion-title">${dev.title[currentLang]}</span>
                        <span class="suggestion-cat">${uiStrings[currentLang][`cat_${dev.category}`] || dev.category.toUpperCase()}</span>
                    </div>
                </a>`).join('');
        } else {
            suggestionBox.innerHTML = `<div class="p-3 text-muted small text-center">No results found</div>`;
        }
    } else if (suggestionBox) {
        suggestionBox.classList.add('d-none');
    }

    currentPage = 1;
    renderHome();
}

function handleSearchKeydown(e, inputId) {
    const input = document.getElementById(inputId || 'deviceSearchDesktop');

    if (e.key === 'Enter' && input.value === '67') {
        e.preventDefault();
        document.body.classList.add('swing-meme');
        setTimeout(() => {
            document.body.classList.remove('swing-meme');
        }, 1200);
        return;
    }

    if ((e.key === 'Enter' || e.key === 'Tab') && filteredDevices.length > 0) {
        const ghostId = inputId === 'deviceSearchDesktop' ? 'searchGhostDesktop' : 'searchGhostMobile';
        const ghostEl = document.getElementById(ghostId);
        const bestMatch = filteredDevices[0];
        const bestTitle = bestMatch.title[currentLang];

        if (bestTitle.toLowerCase().startsWith(input.value.toLowerCase()) && input.value.length > 0) {
            e.preventDefault();
            window.location.href = `${getPath('page/template.html')}?id=${bestMatch.id}`;
        } else if (e.key === 'Enter' && input.value.length > 0) {
            e.preventDefault();
            window.location.href = `${getPath('page/template.html')}?id=${bestMatch.id}`;
        }
    }
}

function filterDevices(cat, e) {
    localStorage.setItem('activeCategory', cat);
    document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
    if (e) e.currentTarget.classList.add('active');

    if (cat === 'all') {
        filteredDevices = [...devicesData];
    } else {
        filteredDevices = devicesData.filter(dev => dev.category === cat);
    }

    const searchInput = document.getElementById('deviceSearch');
    if (searchInput) searchInput.value = "";

    currentPage = 1;
    renderHome();
}

function changePage(page) {
    currentPage = page;
    renderHome();
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
        mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// --- 6. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    loadData().then(success => {
        if (success) {
            const savedCat = localStorage.getItem('activeCategory') || 'all';
            if (savedCat !== 'all') {
                filteredDevices = devicesData.filter(dev => dev.category === savedCat);

            }

            const isHomePage = document.getElementById('heroTitle');
            if (isHomePage) {
                if (sessionStorage.getItem('heroSeen')) {
                    setTimeout(() => {
                        scrollToContent();
                    }, 100);
                }
                sessionStorage.setItem('heroSeen', 'true');
            }
        }
    });

    document.querySelectorAll('.theme-toggle-btn').forEach(btn => {
        btn.onclick = () => {
            const current = localStorage.getItem('theme') || 'auto';
            let next = 'light';
            if (current === 'light') next = 'dark';
            else if (current === 'dark') next = 'auto';
            else next = 'light';

            localStorage.setItem('theme', next);
            initTheme();
        };
    });

    // Auto Mode Listener
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if ((localStorage.getItem('theme') || 'auto') === 'auto') initTheme();
    });

    // Close search suggestions on click outside
    document.addEventListener('click', (e) => {
        const containers = document.querySelectorAll('.search-container');
        const boxD = document.getElementById('searchSuggestionsDesktop');
        const boxM = document.getElementById('searchSuggestionsMobile');

        // Hide if click is outside all search containers
        let isInside = false;
        containers.forEach(c => { if (c.contains(e.target)) isInside = true; });

        if (!isInside) {
            if (boxD) boxD.classList.add('d-none');
            if (boxM) boxM.classList.add('d-none');
        }
    });

    // Mobile Menu: Auto-hide after clicking a link
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', () => {
            const navCollapse = document.getElementById('navbarControls');
            if (navCollapse && navCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getOrCreateInstance(navCollapse);
                bsCollapse.hide();
            }
        });
    });

    // Handle Resize for Responsive Pagination
    window.addEventListener('resize', debounce(() => {
        const newLimit = window.innerWidth < 992 ? 14 : 21;
        if (newLimit !== itemsPerPage) {
            itemsPerPage = newLimit;
            // Only re-render if we are on a page where pagination matters
            if (document.getElementById('deviceGrid')) {
                currentPage = 1;
                renderHome();
            }
        }
    }, 250));
});

function scrollToContent() {
    const mainArea = document.querySelector('.container.mt-4');
    if (mainArea) {
        window.scrollTo({
            top: mainArea.offsetTop - 100,
            behavior: 'smooth'
        });
    }
}

// --- Pagination Handler ---
function changePage(page) {
    const totalPages = Math.ceil(filteredDevices.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderHome();

    // Smooth scroll to top of grid
    const grid = document.getElementById('deviceGrid');
    if (grid) {
        const y = grid.getBoundingClientRect().top + window.pageYOffset - 100;
        window.scrollTo({ top: y, behavior: 'smooth' });
    }
}



