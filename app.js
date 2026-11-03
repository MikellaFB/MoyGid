/* ==========================================================================
   moyGid — карта достопримечательностей Чечни и планировщик маршрутов
   ========================================================================== */


/* --------------------------------------------------------------------------
   1. Режим анимации
   Адрес ?motion=full включает анимации даже при «уменьшенном движении»
   в системе, ?motion=default возвращает обычное поведение.
   -------------------------------------------------------------------------- */
(() => {
  try {
    const mode = new URLSearchParams(location.search).get('motion');

    if (mode === 'full') {
      localStorage.setItem('moygid:motion', 'full');
    }
    if (mode === 'default') {
      localStorage.removeItem('moygid:motion');
    }
    if (localStorage.getItem('moygid:motion') === 'full') {
      document.documentElement.dataset.motion = 'full';
    }
  } catch {
    // localStorage может быть недоступен (приватный режим и т. п.) — это не страшно
  }
})();

const reduceMotion = () => {
  const systemWantsLessMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const forcedFullMotion = document.documentElement.dataset.motion === 'full';
  return systemWantsLessMotion && !forcedFullMotion;
};


/* --------------------------------------------------------------------------
   2. Плавное появление элементов при прокрутке
   -------------------------------------------------------------------------- */
const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver(
      (entries) => {
        entries
          .filter((entry) => entry.isIntersecting)
          .forEach((entry, order) => {
            const node = entry.target;

            revealObserver.unobserve(node);
            node.style.setProperty('--d', `${order * 70}ms`);
            node.classList.add('is-in');

            // Когда анимация закончилась, убираем служебные классы
            setTimeout(() => {
              node.classList.remove('reveal', 'is-in');
              node.style.removeProperty('--d');
            }, 900 + order * 70);
          });
      },
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
    )
  : null;

function registerReveal(nodes) {
  if (!revealObserver || reduceMotion()) return;

  nodes.forEach((node) => {
    node.classList.add('reveal');
    revealObserver.observe(node);
  });
}


/* --------------------------------------------------------------------------
   3. Данные: список мест
   gallery — массив пар [путь к фото, подпись]
   -------------------------------------------------------------------------- */
const places = [
  {
    id: 'heart',
    name: 'Мечеть «Сердце Чечни»',
    category: 'Архитектура',
    area: 'Грозный',
    lat: 43.3178,
    lon: 45.6949,
    description: 'Мечеть имени Ахмата Кадырова — один из главных символов Грозного. Комплекс расположен в центре города, рядом с парком и набережной Сунжи.',
    gallery: [
      ['assets/images/heart-1.jpg', 'Мечеть «Сердце Чечни»'],
      ['assets/images/heart-2.jpg', 'Мечеть в Грозном']
    ],
    credit: 'Wikimedia Commons'
  },
  {
    id: 'grozny-city',
    name: 'Комплекс «Грозный-Сити»',
    category: 'Архитектура',
    area: 'Грозный',
    lat: 43.3197,
    lon: 45.6915,
    description: 'Ансамбль современных высотных зданий в центре Грозного. Со смотровых площадок открываются панорамные виды на город и окружающие горы.',
    gallery: [
      ['assets/images/grozny-city-1.jpg', 'Башни комплекса «Грозный-Сити»'],
      ['assets/images/grozny-city-2.jpg', 'Центр Грозного']
    ],
    credit: 'Wikimedia Commons'
  },
  {
    id: 'argun',
    name: 'Мечеть имени Аймани Кадыровой',
    category: 'Архитектура',
    area: 'Аргун',
    lat: 43.2038,
    lon: 46.0872,
    description: 'Мечеть «Сердце матери» в Аргуне известна необычной современной архитектурой и выразительным силуэтом.',
    gallery: [
      ['assets/images/argun-1.jpg', 'Мечеть имени Аймани Кадыровой']
    ],
    credit: 'Alexxx1979, Wikimedia Commons'
  },
  {
    id: 'kezenoy',
    name: 'Озеро Кезеной-Ам',
    category: 'Природа',
    area: 'Веденский район',
    lat: 42.7731,
    lon: 46.1527,
    description: 'Высокогорное озеро на границе Чечни и Дагестана. Бирюзовая вода, горные склоны и открытые панорамы делают его одним из самых узнаваемых природных мест региона.',
    gallery: [
      ['assets/images/kezenoy-1.jpg', 'Панорама озера Кезеной-Ам'],
      ['assets/images/kezenoy-2.jpg', 'Озеро среди гор']
    ],
    credit: 'Wikimedia Commons'
  },
  {
    id: 'ushkaloy',
    name: 'Ушкалойские башни',
    category: 'История',
    area: 'Итум-Калинский район',
    lat: 42.7382,
    lon: 45.5802,
    description: 'Две средневековые боевые башни встроены в скальную нишу над ущельем Аргуна. Это памятник традиционной архитектуры горной Чечни.',
    gallery: [
      ['assets/images/ushkaloy-1.jpg', 'Ушкалойские башни'],
      ['assets/images/ushkaloy-2.jpg', 'Башни и ущелье Аргуна']
    ],
    credit: 'Wikimedia Commons'
  },
  {
    id: 'nikhaloy',
    name: 'Нихалоевские водопады',
    category: 'Природа',
    area: 'Шатойский район',
    lat: 42.8687,
    lon: 45.7047,
    description: 'Каскад водопадов в горном ущелье. К водопадам ведёт прогулочная тропа с мостиками и лестницами.',
    gallery: [
      ['assets/images/nikhaloy-1.jpg', 'Водопад Нихалоевского каскада'],
      ['assets/images/nikhaloy-2.jpg', 'Нихалоевские водопады']
    ],
    credit: 'Wikimedia Commons'
  },
  {
    id: 'shali',
    name: 'Мечеть «Гордость мусульман»',
    category: 'Архитектура',
    area: 'Шали',
    lat: 43.156876,
    lon: 45.904312,
    description: 'Большая мечеть имени Пророка Мухаммада в центре Шали. Светлый мрамор, купола и высокие минареты формируют выразительный архитектурный ансамбль.',
    gallery: [
      ['assets/images/shali-1.jpg', 'Мечеть «Гордость мусульман»'],
      ['assets/images/shali-2.jpg', 'Фасад мечети в Шали']
    ],
    credit: 'Wikimedia Commons'
  },
  {
    id: 'khoy',
    name: 'Древнее селение Хой',
    category: 'Культура',
    area: 'Веденский район',
    lat: 42.7543,
    lon: 46.2858,
    description: 'Восстановленный историко-архитектурный комплекс с каменными жилыми и боевыми башнями на горном склоне.',
    gallery: [
      ['assets/images/khoy-1.jpg', 'Исторический аул Хой'],
      ['assets/images/khoy-2.jpg', 'Каменные постройки Хоя']
    ],
    credit: 'Wikimedia Commons'
  }
];

const PLACEHOLDER_IMAGE = 'assets/images/photo-placeholder.svg';


/* --------------------------------------------------------------------------
   4. Состояние приложения
   -------------------------------------------------------------------------- */
const state = {
  // Фильтры каталога
  category: 'Все',
  area: 'Все районы',
  search: '',

  // Выбранные для маршрута места (id)
  selected: new Set(),
  // Места, которые уже показаны в списке маршрута (чтобы не анимировать повторно)
  shown: new Set(),

  // Кэш: какие карточки сейчас отрисованы
  cardsKey: null,

  // Карта и маркеры
  markers: new Map(),
  routeLayer: null,

  // Карта маршрута
  routeMap: null,
  routeLine: null,
  routeMarkers: [],
  routeBuilt: false,
  wipeTimer: null,

  // Геолокация пользователя
  userLocation: null,

  // Окно с описанием места
  currentPlace: null,
  galleryIndex: 0,

  // Слайдер на главном экране
  heroIndex: 0,

  // true, пока идёт плавная прокрутка к разделу
  autoScroll: false
};


/* --------------------------------------------------------------------------
   5. Вспомогательные функции
   -------------------------------------------------------------------------- */

// Короткая запись для document.querySelector
const $ = (selector) => document.querySelector(selector);

// Экранирует спецсимволы, чтобы текст можно было безопасно вставить в HTML
function safe(value) {
  const replacements = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return String(value).replace(/[&<>"']/g, (char) => replacements[char]);
}

// Добавляет ведущий ноль: 3 -> "03"
const pad2 = (n) => String(n).padStart(2, '0');

// Путь к фото места (по умолчанию — первое)
function imageOf(place, index = 0) {
  return place.gallery[index % place.gallery.length][0];
}

// Места, подходящие под текущие фильтры и поиск
function visiblePlaces() {
  const query = state.search.trim().toLocaleLowerCase('ru');

  return places.filter((place) => {
    const matchesCategory = state.category === 'Все' || place.category === state.category;
    const matchesArea = state.area === 'Все районы' || place.area === state.area;
    const searchableText = `${place.name} ${place.area} ${place.category}`.toLocaleLowerCase('ru');
    const matchesSearch = !query || searchableText.includes(query);

    return matchesCategory && matchesArea && matchesSearch;
  });
}

// Подпись кнопки в окне места
function dialogSelectLabel(id) {
  return state.selected.has(id) ? 'Убрать из маршрута' : 'Добавить в маршрут';
}

// Переключает внешний вид кнопки «+ / ✓»
function setSelectButton(button, isOn) {
  button.classList.toggle('selected', isOn);
  button.textContent = isOn ? '✓' : '+';
  button.setAttribute('aria-pressed', String(isOn));
}

// Расстояние между двумя точками по прямой, км (формула гаверсинусов)
function distance(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);

  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;

  const earthRadiusKm = 6371;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}


/* --------------------------------------------------------------------------
   6. Отрисовка каталога: список рядом с картой и карточки
   -------------------------------------------------------------------------- */

// Фото-превью. Если файл не загрузился — подставляется заглушка
function photo(place, cssClass = 'card-image') {
  return [
    `<img class="${cssClass}"`,
    ` src="${safe(imageOf(place))}"`,
    ` alt="${safe(place.name)}"`,
    ` loading="lazy" decoding="async"`,
    ` onerror="this.onerror=null;this.src='${PLACEHOLDER_IMAGE}'">`
  ].join('');
}

const EMPTY_FILTERS_MESSAGE =
  '<p class="empty-state">Ничего не найдено. ' +
  '<button class="link-button" data-reset-filters>Сбросить фильтры</button></p>';

const EMPTY_CARDS_MESSAGE =
  '<p class="empty-state">Нет мест с такими фильтрами. ' +
  '<button class="link-button" data-reset-filters>Сбросить фильтры</button></p>';

// Список мест в боковой панели карты
function renderMapList() {
  const visible = visiblePlaces();

  $('#resultsCount').textContent = pad2(visible.length);

  if (!visible.length) {
    $('#mapPlaceList').innerHTML = EMPTY_FILTERS_MESSAGE;
    return;
  }

  $('#mapPlaceList').innerHTML = visible
    .map((place) => [
      `<button class="map-place-row ${state.selected.has(place.id) ? 'is-selected' : ''}" data-open="${place.id}">`,
      photo(place, 'row-thumb'),
      '<span>',
      `<span class="row-name">${safe(place.name)}</span>`,
      `<span class="row-meta">${safe(place.area)} · ${safe(place.category)}</span>`,
      '</span>',
      '<span class="row-arrow">↗</span>',
      '</button>'
    ].join(''))
    .join('');
}

// Карточки в разделе «Места»
function renderCards() {
  const visible = visiblePlaces();
  const key = visible.map((place) => place.id).join();

  // Перерисовываем только если набор карточек изменился
  if (key !== state.cardsKey) {
    state.cardsKey = key;

    if (!visible.length) {
      $('#placesGrid').innerHTML = EMPTY_CARDS_MESSAGE;
    } else {
      $('#placesGrid').innerHTML = visible
        .map((place) => {
          const isSelected = state.selected.has(place.id);

          return [
            `<article class="place-card" data-card="${place.id}">`,
            '<div class="card-image-wrap">',
            photo(place),
            `<span class="card-category">${safe(place.category)}</span>`,
            `<button class="select-place ${isSelected ? 'selected' : ''}"`,
            ` data-select="${place.id}"`,
            ` aria-pressed="${isSelected}"`,
            ' aria-label="Добавить в маршрут">',
            isSelected ? '✓' : '+',
            '</button>',
            '</div>',
            '<div class="card-content">',
            `<p class="card-location">${safe(place.area)}</p>`,
            `<h3 class="card-title">${safe(place.name)}</h3>`,
            '<div class="card-bottom">',
            `<button class="details-link" data-open="${place.id}">Смотреть фото ↗</button>`,
            `<span class="card-distance">${place.gallery.length} фото</span>`,
            '</div>',
            '</div>',
            '</article>'
          ].join('');
        })
        .join('');
    }

    registerReveal(document.querySelectorAll('#placesGrid .place-card'));
  }

  $('#selectedCount').textContent = state.selected.size;
  $('#placeCount').textContent = pad2(places.length);
}

function renderAll() {
  renderMapList();
  renderCards();
  updateMarkers();
  syncPins();
}


/* --------------------------------------------------------------------------
   7. Главная карта (Leaflet)
   -------------------------------------------------------------------------- */
let map;

function initMap() {
  // Если библиотека Leaflet не загрузилась — показываем сообщение
  if (!window.L) {
    $('#map').innerHTML =
      '<div class="map-error">Карта не загрузилась. Проверьте интернет и обновите страницу.</div>';
    return;
  }

  map = L.map('map', { scrollWheelZoom: false }).setView([43.05, 45.85], 8);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap'
  }).addTo(map);

  // По одному маркеру на каждое место, нумерация с 1
  places.forEach((place, index) => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="custom-pin"><span>${index + 1}</span></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 28]
    });

    const marker = L.marker([place.lat, place.lon], { icon, title: place.name }).addTo(map);

    marker.bindPopup(
      `<b>${safe(place.name)}</b><br>` +
      `<small>${safe(place.area)}</small><br>` +
      `<button data-open="${place.id}" class="popup-more">Фото и описание</button>`
    );

    state.markers.set(place.id, marker);
  });

  // Карта могла инициализироваться, пока контейнер ещё не получил размер
  setTimeout(() => map.invalidateSize(), 120);
}

// Показывает на карте только места, подходящие под фильтры
function updateMarkers() {
  if (!map) return;

  const visibleIds = new Set(visiblePlaces().map((place) => place.id));

  places.forEach((place) => {
    const marker = state.markers.get(place.id);
    if (!marker) return;

    const shouldShow = visibleIds.has(place.id);
    const isOnMap = map.hasLayer(marker);

    if (shouldShow && !isOnMap) marker.addTo(map);
    if (!shouldShow && isOnMap) map.removeLayer(marker);
  });
}

// Подсвечивает маркеры выбранных мест
function syncPins() {
  state.markers.forEach((marker, id) => {
    const pin = marker.getElement()?.querySelector('.custom-pin');
    pin?.classList.toggle('is-selected', state.selected.has(id));
  });
}

// Приближает карту к месту и открывает его всплывающее окно
function focusPlaceOnMap(place) {
  if (!place || !map) return;

  closePlace();
  map.setView([place.lat, place.lon], 13);
  state.markers.get(place.id)?.openPopup();
  scrollToTarget($('#map-section'));
}


/* --------------------------------------------------------------------------
   8. Окно места (диалог) и галерея
   -------------------------------------------------------------------------- */
function renderGallery() {
  const place = state.currentPlace;
  if (!place) return;

  const [imageSrc, imageCaption] = place.gallery[state.galleryIndex];
  const hasMultiplePhotos = place.gallery.length > 1;
  const galleryImage = $('#galleryImage');

  // Если фото не загрузилось — показываем заглушку
  galleryImage.onerror = () => {
    galleryImage.onerror = null;
    galleryImage.src = PLACEHOLDER_IMAGE;
  };

  // Стрелки и точки нужны только если фото больше одного
  $('#galleryPrev').hidden = !hasMultiplePhotos;
  $('#galleryNext').hidden = !hasMultiplePhotos;
  $('#galleryDots').hidden = !hasMultiplePhotos;

  swapGalleryImage(imageSrc);
  galleryImage.alt = imageCaption;
  $('#galleryCaption').textContent = imageCaption;
  $('#galleryCounter').textContent = `${state.galleryIndex + 1} / ${place.gallery.length}`;

  $('#galleryDots').innerHTML = place.gallery
    .map((_, index) => {
      const activeClass = index === state.galleryIndex ? 'active' : '';
      return `<button class="gallery-dot ${activeClass}" data-gallery="${index}" aria-label="Фото ${index + 1}"></button>`;
    })
    .join('');
}

// Смена фото с короткой анимацией затухания
function swapGalleryImage(src) {
  const image = $('#galleryImage');

  // Пока окно закрыто — меняем фото сразу, без анимации
  if (!$('#placeDialog').open) {
    image.src = src;
    return;
  }

  image.classList.add('is-swapping');

  setTimeout(() => {
    image.onload = () => image.classList.remove('is-swapping');
    image.src = src;
  }, 160);

  // Страховка: если onload не сработает, всё равно убираем класс
  setTimeout(() => image.classList.remove('is-swapping'), 900);
}

// Листает галерею на шаг вперёд (+1) или назад (-1) по кругу
function changeGallery(step) {
  if (!state.currentPlace) return;

  const total = state.currentPlace.gallery.length;
  state.galleryIndex = (state.galleryIndex + step + total) % total;
  renderGallery();
}

function openPlace(id) {
  const place = places.find((item) => item.id === id);
  if (!place) return;

  state.currentPlace = place;
  state.galleryIndex = 0;

  $('#dialogKicker').textContent = `${place.category} · ${place.area}`;
  $('#dialogTitle').textContent = place.name;
  $('#dialogDescription').textContent = place.description;
  $('#dialogCredit').textContent = `Фото: ${place.credit}`;
  $('#dialogSelect').textContent = dialogSelectLabel(id);

  renderGallery();

  if (!$('#placeDialog').open) {
    $('#placeDialog').showModal();
  }
  document.documentElement.classList.add('dialog-open');
}

function closePlace() {
  const dialog = $('#placeDialog');
  if (!dialog.open || dialog.classList.contains('is-closing')) return;

  // Даём отыграть анимации закрытия, затем закрываем окно
  dialog.classList.add('is-closing');
  setTimeout(() => {
    dialog.classList.remove('is-closing');
    dialog.close();
  }, reduceMotion() ? 0 : 240);
}

// Esc: закрываем с анимацией вместо мгновенного закрытия
$('#placeDialog').addEventListener('cancel', (event) => {
  event.preventDefault();
  closePlace();
});

$('#placeDialog').addEventListener('close', () => {
  document.documentElement.classList.remove('dialog-open');
});


/* --------------------------------------------------------------------------
   9. Выбор мест для маршрута
   -------------------------------------------------------------------------- */
function toggleSelected(id) {
  if (state.selected.has(id)) {
    state.selected.delete(id);
  } else {
    state.selected.add(id);
  }

  const isOn = state.selected.has(id);
  document.querySelectorAll(`[data-select="${id}"]`).forEach((button) => {
    setSelectButton(button, isOn);
  });

  syncSelection();

  if (state.currentPlace?.id === id) {
    $('#dialogSelect').textContent = dialogSelectLabel(id);
  }
}

// Приводит весь интерфейс в соответствие с набором выбранных мест
function syncSelection() {
  const count = state.selected.size;
  const hadSelection = document.body.classList.contains('has-selection');

  document.body.classList.toggle('has-selection', count > 0);
  $('#selectedCount').textContent = count;
  $('#buildRoute').disabled = !count;

  document.querySelectorAll('.map-place-row').forEach((row) => {
    row.classList.toggle('is-selected', state.selected.has(row.dataset.open));
  });

  syncPins();

  document.querySelectorAll('[data-select]').forEach((button) => {
    setSelectButton(button, state.selected.has(button.dataset.select));
  });

  // Запоминаем выбор между визитами
  try {
    localStorage.setItem('moygid:selected', JSON.stringify([...state.selected]));
  } catch {
    // без localStorage просто не сохраняем
  }

  renderRouteEmpty();

  // Блок с картой маршрута впервые появился — пересчитываем её размер
  if (count && !hadSelection && state.routeMap) {
    setTimeout(() => state.routeMap.invalidateSize(), 520);
  }
}

// Восстанавливает выбранные места из прошлого визита
function restoreSelection() {
  try {
    const savedIds = JSON.parse(localStorage.getItem('moygid:selected') || '[]');

    savedIds.forEach((id) => {
      if (places.some((place) => place.id === id)) {
        state.selected.add(id);
      }
    });
  } catch {
    // повреждённые данные игнорируем
  }
}

function clearSelection() {
  state.selected.clear();

  document.querySelectorAll('[data-select]').forEach((button) => {
    setSelectButton(button, false);
  });

  if (state.currentPlace) {
    $('#dialogSelect').textContent = 'Добавить в маршрут';
  }

  syncSelection();
}

function resetFilters() {
  Object.assign(state, { category: 'Все', area: 'Все районы', search: '' });

  $('#placeSearch').value = '';
  $('#areaFilter').value = 'Все районы';

  document.querySelectorAll('.filter-chip').forEach((chip) => {
    chip.classList.toggle('selected', chip.dataset.category === 'Все');
  });

  renderAll();
}


/* --------------------------------------------------------------------------
   10. Маршрут: отрисовка списка остановок
   -------------------------------------------------------------------------- */

// Удаляет линию и маркеры маршрута с обеих карт
function clearRouteLayers() {
  if (state.routeLayer && map) {
    map.removeLayer(state.routeLayer);
    state.routeLayer = null;
  }

  if (state.routeLine && state.routeMap) {
    state.routeMap.removeLayer(state.routeLine);
    state.routeLine = null;
  }

  (state.routeMarkers || []).forEach((layer) => state.routeMap?.removeLayer(layer));
  state.routeMarkers = [];
}

// Одна строка в списке остановок
function stepRow(place, index, note, animate = true) {
  return [
    `<div class="route-step${animate ? '' : ' is-static'}" style="--i:${index}">`,
    `<span class="step-number">${pad2(index + 1)}</span>`,
    '<span>',
    `<p class="step-name">${safe(place.name)}</p>`,
    `<p class="step-area">${safe(place.area)}</p>`,
    '</span>',
    `<span class="step-distance">${note}</span>`,
    `<button class="step-remove" data-remove="${place.id}" aria-label="Убрать из маршрута: ${safe(place.name)}">`,
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    '</button>',
    '</div>'
  ].join('');
}

// Состояние «маршрут ещё не построен»: показываем выбранные места списком
function renderRouteEmpty() {
  state.routeBuilt = false;
  $('.route-preview').classList.remove('is-built');
  clearTimeout(state.wipeTimer);

  if (state.routeLayer && map) {
    map.removeLayer(state.routeLayer);
    state.routeLayer = null;
  }

  // Ничего не выбрано — через паузу (пока играет анимация) очищаем блок
  if (!state.selected.size) {
    state.wipeTimer = setTimeout(() => {
      clearRouteLayers();
      $('#routeOutput').innerHTML = '';
      state.shown.clear();
      $('#routeStatus').textContent = 'ПОКА ПУСТО';
      $('#routeDistance').textContent = '— км';
    }, 520);
    return;
  }

  clearRouteLayers();
  $('#routeStatus').textContent = 'ГОТОВ К РАСЧЁТУ';

  const items = places.filter((place) => state.selected.has(place.id));

  $('#routeOutput').innerHTML =
    items
      .map((place, index) => stepRow(place, index, '', !state.shown.has(place.id)))
      .join('') +
    '<p class="route-link-hint">Нажмите «Построить маршрут», чтобы расставить остановки в порядке посещения.</p>';

  state.shown = new Set(items.map((place) => place.id));
  $('#routeDistance').textContent = '— км';
}


/* --------------------------------------------------------------------------
   11. Маршрут: построение
   -------------------------------------------------------------------------- */

// Ссылка на маршрут в Google Картах: последняя точка — пункт назначения,
// остальные — промежуточные остановки
function createGoogleMapsUrl(origin, ordered) {
  const destination = ordered[ordered.length - 1];

  const params = new URLSearchParams({
    api: '1',
    origin: `${origin.lat},${origin.lon}`,
    destination: `${destination.lat},${destination.lon}`,
    travelmode: 'driving'
  });

  const waypoints = ordered.slice(0, -1).map((place) => `${place.lat},${place.lon}`);
  if (waypoints.length) {
    params.set('waypoints', waypoints.join('|'));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

// Рисует схему маршрута на маленькой карте в блоке «Ваш план»
function renderRouteMap(origin, ordered) {
  if (!state.routeMap) return;

  $('.route-preview').classList.add('is-built');
  state.routeMap.invalidateSize();

  // Убираем прошлый маршрут
  if (state.routeLine) {
    state.routeMap.removeLayer(state.routeLine);
  }
  (state.routeMarkers || []).forEach((layer) => state.routeMap.removeLayer(layer));
  state.routeMarkers = [];

  // Старт + все остановки по порядку
  const coords = [
    [origin.lat, origin.lon],
    ...ordered.map((place) => [place.lat, place.lon])
  ];

  state.routeLine = L.polyline(coords, {
    color: '#809a54',
    weight: 4,
    opacity: 0.95,
    dashArray: '8 7'
  }).addTo(state.routeMap);

  // Маркер начальной точки
  const startMarker = L.circleMarker(coords[0], {
    radius: 8,
    color: '#203e30',
    weight: 2,
    fillColor: '#d6e8a1',
    fillOpacity: 1
  })
    .addTo(state.routeMap)
    .bindPopup('Начальная точка');
  state.routeMarkers.push(startMarker);

  // Маркеры остановок
  ordered.forEach((place, index) => {
    const stopMarker = L.circleMarker([place.lat, place.lon], {
      radius: 7,
      color: '#203e30',
      weight: 2,
      fillColor: '#809a54',
      fillOpacity: 1
    })
      .addTo(state.routeMap)
      .bindPopup(`${index + 1}. ${safe(place.name)}`);
    state.routeMarkers.push(stopMarker);
  });

  state.routeMap.fitBounds(state.routeLine.getBounds().pad(0.18));
  setTimeout(() => state.routeMap.invalidateSize(), 150);
}

// Расставляет места по принципу «ближайший сосед» и показывает результат
function finishBuildRoute(origin) {
  const { lat, lon } = origin;

  let current = { lat, lon };
  const remaining = places.filter((place) => state.selected.has(place.id));
  const ordered = [];
  let totalKm = 0;

  // Каждый раз едем в ближайшее из ещё не посещённых мест
  while (remaining.length) {
    let nearestIndex = 0;
    let nearestDistance = Infinity;

    remaining.forEach((place, index) => {
      const d = distance(current, place);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearestIndex = index;
      }
    });

    const next = remaining.splice(nearestIndex, 1)[0];
    totalKm += nearestDistance;
    ordered.push({ ...next, leg: nearestDistance });
    current = next;
  }

  // Линия маршрута на главной карте
  if (state.routeLayer && map) {
    map.removeLayer(state.routeLayer);
  }
  if (map) {
    const linePoints = [[lat, lon], ...ordered.map((place) => [place.lat, place.lon])];

    state.routeLayer = L.polyline(linePoints, {
      color: '#809a54',
      weight: 4,
      opacity: 0.9,
      dashArray: '7 6'
    }).addTo(map);

    map.fitBounds(state.routeLayer.getBounds().pad(0.12));
  }

  $('#routeStatus').textContent = 'МАРШРУТ ГОТОВ';
  $('#routeDistance').textContent = `≈ ${Math.round(totalKm)} км по прямой`;

  const googleUrl = createGoogleMapsUrl(origin, ordered);

  $('#routeOutput').innerHTML =
    ordered
      .map((place, index) => {
        const note = index ? `+${Math.round(place.leg)} км` : 'первая точка';
        return stepRow(place, index, note);
      })
      .join('') +
    `<a class="button button-dark google-route-link" href="${googleUrl}" target="_blank" rel="noopener noreferrer">Открыть маршрут в Google Картах ↗</a>` +
    '<p class="route-link-hint">Google Карты откроются отдельно и рассчитают путь по дорогам.</p>';

  renderRouteMap(origin, ordered);
}

// Кнопка «Построить маршрут»
function buildRoute() {
  if (!state.selected.size) {
    $('#routeStatus').textContent = 'ДОБАВЬТЕ МЕСТА';
    $('#routeOutput').innerHTML = '<p class="empty-state">Сначала выберите места в каталоге.</p>';
    return;
  }

  const startValue = $('#routeStart').value;

  // Старт — «Моё местоположение»
  if (startValue === 'my-location') {
    if (state.userLocation) {
      finishBuildRoute(state.userLocation);
      return;
    }

    if (!navigator.geolocation) {
      $('#routeStatus').textContent = 'ГЕОЛОКАЦИЯ НЕДОСТУПНА';
      $('#routeOutput').innerHTML =
        '<p class="empty-state">Браузер не поддерживает геолокацию. Выберите город вручную.</p>';
      return;
    }

    $('#routeStatus').textContent = 'ОПРЕДЕЛЯЕМ МЕСТОПОЛОЖЕНИЕ';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        state.userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude
        };
        finishBuildRoute(state.userLocation);
      },
      () => {
        $('#routeStatus').textContent = 'НЕТ ДОСТУПА К ГЕОЛОКАЦИИ';
        $('#routeOutput').innerHTML =
          '<p class="empty-state">Разрешите доступ к местоположению или выберите начальный город вручную.</p>';
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 120000 }
    );
    return;
  }

  // Старт — город из списка, значение вида "широта,долгота"
  const [lat, lon] = startValue.split(',').map(Number);
  finishBuildRoute({ lat, lon });
}

// Кнопка «Выбрать случайный маршрут»: 3–4 случайных места
function buildRandomRoute() {
  const shuffled = [...places].sort(() => Math.random() - 0.5);
  const count = Math.min(4, Math.max(3, places.length));

  state.selected = new Set(shuffled.slice(0, count).map((place) => place.id));

  renderAll();
  syncSelection();
  scrollToTarget($('#route-section'));
  buildRoute();
}

// Маленькая карта в блоке «Ваш план»
function initRouteMap() {
  if (!window.L || !$('#routeMap')) return;

  state.routeMap = L.map('routeMap', { scrollWheelZoom: false }).setView([43.05, 45.85], 7);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(state.routeMap);

  setTimeout(() => state.routeMap.invalidateSize(), 250);
}

// Пробуем заранее узнать местоположение пользователя
function locateUser() {
  const option = $('#routeStart').querySelector('option[value="my-location"]');

  if (!navigator.geolocation) {
    option.textContent = 'Моё местоположение (недоступно)';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lon: position.coords.longitude
      };
      option.textContent = 'Моё местоположение';
    },
    () => {
      option.textContent = 'Моё местоположение (запросить при построении)';
    },
    { enableHighAccuracy: true, timeout: 7000, maximumAge: 300000 }
  );
}


/* --------------------------------------------------------------------------
   12. Слайдер на главном экране
   -------------------------------------------------------------------------- */
function setHero(index) {
  // Индекс замыкается по кругу
  state.heroIndex = (index + places.length) % places.length;

  const place = places[state.heroIndex];
  const image = $('#heroPhoto');

  // Сначала затухание, затем смена фото
  image.classList.add('is-changing');

  setTimeout(() => {
    image.onerror = () => {
      image.onerror = null;
      image.src = PLACEHOLDER_IMAGE;
      image.classList.remove('is-changing');
    };
    image.onload = () => image.classList.remove('is-changing');
    image.src = imageOf(place);
    image.alt = place.name;
  }, 180);

  $('#heroName').textContent = place.name;
  $('#heroArea').textContent = place.area;
  $('#heroCount').textContent = `${pad2(state.heroIndex + 1)} / ${pad2(places.length)}`;
  $('#heroOpen').dataset.open = place.id;
}


/* --------------------------------------------------------------------------
   13. Навигация: подсветка раздела при прокрутке и плавный скролл
   -------------------------------------------------------------------------- */
const spyLinks = [...document.querySelectorAll('.nav-link')];

// Подсвечивает в меню раздел, который сейчас на экране
function updateSpy() {
  if (state.autoScroll) return;

  const y = window.scrollY + 120;
  let current = spyLinks[0];

  spyLinks.forEach((link) => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section && section.offsetTop <= y) {
      current = link;
    }
  });

  // В самом низу страницы всегда активен последний пункт
  const isAtBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;
  if (isAtBottom) {
    current = spyLinks[spyLinks.length - 1];
  }

  spyLinks.forEach((link) => link.classList.toggle('active', link === current));
}

window.addEventListener('scroll', updateSpy, { passive: true });
updateSpy();

let scrollFrame = 0;

// Плавно прокручивает страницу к элементу (с учётом высоты шапки)
function scrollToTarget(element) {
  cancelAnimationFrame(scrollFrame);

  const from = window.scrollY;
  const top = element
    ? Math.max(0, element.getBoundingClientRect().top + from - $('.topbar').offsetHeight + 1)
    : 0;

  // Анимация не нужна: движение отключено или цель совсем рядом
  if (reduceMotion() || Math.abs(top - from) < 2) {
    window.scrollTo(0, top);
    return;
  }

  const duration = Math.min(1300, Math.max(700, Math.abs(top - from) * 0.6));
  const startTime = performance.now();
  const interruptEvents = ['wheel', 'touchstart', 'keydown'];

  state.autoScroll = true;

  const finish = () => {
    state.autoScroll = false;
    interruptEvents.forEach((name) => removeEventListener(name, cancel));
    updateSpy();
  };

  // Если пользователь сам начал прокручивать — останавливаем анимацию
  const cancel = () => {
    cancelAnimationFrame(scrollFrame);
    finish();
  };

  interruptEvents.forEach((name) => addEventListener(name, cancel, { passive: true }));

  const step = (now) => {
    const progress = Math.min(1, (now - startTime) / duration);

    // easeInOutCubic
    const eased =
      progress < 0.5
        ? 4 * progress ** 3
        : 1 - (-2 * progress + 2) ** 3 / 2;

    window.scrollTo(0, from + (top - from) * eased);

    if (progress < 1) {
      scrollFrame = requestAnimationFrame(step);
    } else {
      finish();
    }
  };

  scrollFrame = requestAnimationFrame(step);
}

// Клики по якорным ссылкам (#раздел) — плавная прокрутка вместо прыжка
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link) return;

  const hash = link.getAttribute('href');
  const target = hash === '#' ? null : document.querySelector(hash);

  // Ссылка ведёт на несуществующий раздел — не вмешиваемся
  if (hash !== '#' && !target) return;

  event.preventDefault();
  scrollToTarget(target);

  try {
    history.replaceState(null, '', hash === '#' ? location.pathname : hash);
  } catch {
    // history может быть недоступен — не критично
  }

  if (link.classList.contains('nav-link')) {
    spyLinks.forEach((item) => item.classList.toggle('active', item === link));
  }
});


/* --------------------------------------------------------------------------
   14. Мобильное меню
   -------------------------------------------------------------------------- */
function closeMenu() {
  $('.main-nav').classList.remove('open');
  $('#mobileMenu').setAttribute('aria-expanded', 'false');
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});

// Клик мимо шапки закрывает меню
document.addEventListener('click', (event) => {
  if (!event.target.closest('.topbar')) closeMenu();
});


/* --------------------------------------------------------------------------
   15. Общие обработчики кликов
   -------------------------------------------------------------------------- */

// Удаление остановки, очистка списка, сброс фильтров
document.addEventListener('click', (event) => {
  const removeButton = event.target.closest('[data-remove]');
  if (removeButton) {
    toggleSelected(removeButton.dataset.remove);
  }

  if (event.target.closest('[data-clear-route]')) {
    clearSelection();
  }

  if (event.target.closest('[data-reset-filters]')) {
    resetFilters();
  }
});

// Клик по пустому месту карточки открывает окно места
document.addEventListener('click', (event) => {
  const card = event.target.closest('[data-card]');
  if (!card || event.target.closest('button, a')) return;

  openPlace(card.dataset.card);
});

// Основной обработчик: открыть место, выбрать место, показать на карте,
// сменить категорию, переключить фото в галерее
document.addEventListener('click', (event) => {
  // Открыть окно с описанием места
  const openTrigger = event.target.closest('[data-open]');
  if (openTrigger) {
    openPlace(openTrigger.dataset.open);
    return;
  }

  // Добавить место в маршрут / убрать из него
  const selectTrigger = event.target.closest('[data-select]');
  if (selectTrigger) {
    event.preventDefault();
    toggleSelected(selectTrigger.dataset.select);
    return;
  }

  // Показать место на карте
  const focusTrigger = event.target.closest('[data-focus]');
  if (focusTrigger) {
    const place = places.find((item) => item.id === focusTrigger.dataset.focus);
    focusPlaceOnMap(place);
    return;
  }

  // Фильтр по категории
  const categoryTrigger = event.target.closest('[data-category]');
  if (categoryTrigger) {
    state.category = categoryTrigger.dataset.category;

    document.querySelectorAll('.filter-chip').forEach((chip) => {
      chip.classList.toggle('selected', chip === categoryTrigger);
    });

    renderAll();
  }

  // Точка-индикатор галереи
  const galleryDot = event.target.closest('[data-gallery]');
  if (galleryDot) {
    state.galleryIndex = Number(galleryDot.dataset.gallery);
    renderGallery();
  }
});


/* --------------------------------------------------------------------------
   16. Обработчики отдельных элементов
   -------------------------------------------------------------------------- */

// Поиск (с небольшой задержкой, чтобы не перерисовывать на каждую букву)
let searchTimer;
$('#placeSearch').addEventListener('input', (event) => {
  const value = event.target.value;

  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = value;
    renderAll();
  }, 140);
});

// Фильтр по району
$('#areaFilter').addEventListener('change', (event) => {
  state.area = event.target.value;
  renderAll();
});

// Галерея в окне места
$('#galleryPrev').addEventListener('click', () => changeGallery(-1));
$('#galleryNext').addEventListener('click', () => changeGallery(1));

$('#dialogSelect').addEventListener('click', () => {
  if (state.currentPlace) {
    toggleSelected(state.currentPlace.id);
  }
});

$('#dialogFocus').addEventListener('click', () => {
  focusPlaceOnMap(state.currentPlace);
});

$('#closeDialog').addEventListener('click', () => closePlace());

// Клик по затемнению вокруг окна закрывает его
$('#placeDialog').addEventListener('click', (event) => {
  if (event.target === $('#placeDialog')) closePlace();
});

// Стрелки клавиатуры листают фото
$('#placeDialog').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') changeGallery(-1);
  if (event.key === 'ArrowRight') changeGallery(1);
});

// Слайдер на главном экране
$('#heroPrev').addEventListener('click', () => setHero(state.heroIndex - 1));
$('#heroNext').addEventListener('click', () => setHero(state.heroIndex + 1));

// Маршрут
$('#buildRoute').addEventListener('click', buildRoute);
$('#randomRoute').addEventListener('click', buildRandomRoute);

// Кнопка «Показать всю республику»
$('#resetMap').addEventListener('click', () => {
  if (!map) return;

  if (state.routeLayer) {
    map.removeLayer(state.routeLayer);
  }

  const bounds = L.latLngBounds(places.map((place) => [place.lat, place.lon]));
  map.fitBounds(bounds.pad(0.08));
});

// Кнопка мобильного меню
$('#mobileMenu').addEventListener('click', () => {
  const nav = $('.main-nav');
  const isOpen = nav.classList.toggle('open');
  $('#mobileMenu').setAttribute('aria-expanded', String(isOpen));
});

// Выбор пункта меню закрывает мобильное меню
document.querySelectorAll('.nav-link').forEach((link) => {
  link.addEventListener('click', () => {
    $('.main-nav').classList.remove('open');
    $('#mobileMenu').setAttribute('aria-expanded', 'false');
  });
});


/* --------------------------------------------------------------------------
   17. Запуск
   -------------------------------------------------------------------------- */
restoreSelection();
renderAll();
initMap();
syncSelection();
initRouteMap();
setHero(0);

// Автопрокрутка слайдера каждые 8 секунд (если вкладка активна и окно места закрыто)
if (!reduceMotion()) {
  setInterval(() => {
    if (!document.hidden && !$('#placeDialog').open) {
      setHero(state.heroIndex + 1);
    }
  }, 8000);
}

// Счётчики в блоке статистики
$('#areaCount').textContent = pad2(new Set(places.map((place) => place.area)).size);
$('#categoryCount').textContent = pad2(new Set(places.map((place) => place.category)).size);

registerReveal(document.querySelectorAll('.about-steps li, .quick-stats > div'));
