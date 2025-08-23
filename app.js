// State & elements
const trigger = document.getElementById('trigger');
const triggerText = document.getElementById('triggerText');
const panel = document.getElementById('panel');
const searchInput = document.getElementById('searchInput');
const list = document.getElementById('list');
const emptyEl = document.getElementById('empty');

const hint = document.getElementById('selectionHint');
const commissionBox = document.getElementById('commissionBox');
const fboVal = document.getElementById('fboVal');
const fbsVal = document.getElementById('fbsVal');

const state = {
  data: {},        // {category: [{type,fbo,fbs}]}
  selection: null, // {category,type,fbo,fbs}
  open: false,
  activeIndex: -1, // index in visible options
  collapsed: {},   // {category: boolean}
  visible: []      // flat of visible options
};

// Load data
fetch('categories.json')
  .then(r => r.json())
  .then(data => {
    state.data = data;
    // default: categories expanded
    Object.keys(data).forEach(cat => state.collapsed[cat] = false);
    render();
  });

// Utils
const norm = s => (s ?? '').toString().toLowerCase();
function highlight(text, query){
  if(!query) return text;
  const q = norm(query);
  const idx = norm(text).indexOf(q);
  if(idx === -1) return text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + query.length);
  const after = text.slice(idx + query.length);
  return `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}
function escapeHtml(str){
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Open/close
function openPanel(){
  panel.classList.add('open');
  trigger.setAttribute('aria-expanded','true');
  state.open = true;
  requestAnimationFrame(() => searchInput.focus());
  rebuildVisible();
}
function closePanel(){
  panel.classList.remove('open');
  trigger.setAttribute('aria-expanded','false');
  state.open = false;
  state.activeIndex = -1;
}
trigger.addEventListener('click', () => state.open ? closePanel() : openPanel());
document.addEventListener('click', (e) => {
  if(!panel.contains(e.target) && !trigger.contains(e.target)){
    closePanel();
  }
});

// Search with debounce
let tId = 0;
searchInput.addEventListener('input', () => {
  clearTimeout(tId);
  tId = setTimeout(() => {
    rebuildVisible();
  }, 120);
});

function rebuildVisible(){
  const q = norm(searchInput.value);
  list.innerHTML = '';
  emptyEl.hidden = true;
  state.visible = [];

  const cats = Object.keys(state.data);
  let matches = 0;

  cats.forEach(cat => {
    // group container
    const group = document.createElement('div');
    group.className = 'group' + (state.collapsed[cat] ? ' collapsed' : '');

    // title
    const title = document.createElement('div');
    title.className = 'group-title';
    const chev = document.createElement('span');
    chev.className = 'chev';
    chev.textContent = '▾';
    const titleText = document.createElement('span');
    titleText.textContent = cat;
    title.appendChild(chev);
    title.appendChild(titleText);
    title.addEventListener('click', () => {
      state.collapsed[cat] = !state.collapsed[cat];
      rebuildVisible();
    });
    group.appendChild(title);

    // items
    const itemsWrap = document.createElement('div');
    itemsWrap.className = 'items';
    const items = state.data[cat];
    items.forEach(it => {
      const matchesQuery = !q || norm(it.type).includes(q) || norm(cat).includes(q);
      if(!matchesQuery) return;
      matches++;

      const el = document.createElement('div');
      el.className = 'type-item';
      el.setAttribute('role','option');

      // name with highlight
      const label = document.createElement('div');
      label.innerHTML = highlight(it.type, q);
      el.appendChild(label);

      // right side: badge & check
      const badge = document.createElement('span');
      badge.className = 'badge';
      const fboTxt = (it.fbo ?? '—');
      const fbsTxt = (it.fbs ?? '—');
      badge.textContent = `FBO ${fboTxt}% • FBS ${fbsTxt}%`;
      el.appendChild(badge);

      const check = document.createElement('span');
      check.className = 'check';
      check.textContent = '✓';
      el.appendChild(check);

      // selection state
      if(state.selection && state.selection.type === it.type && state.selection.category === cat){
        el.classList.add('selected');
      }

      el.addEventListener('click', () => selectItem({category:cat, ...it}));

      itemsWrap.appendChild(el);
      state.visible.push(el);
    });

    // hide items if collapsed and not searching
    if(state.collapsed[cat] && !q){
      itemsWrap.style.display = 'none';
    }
    group.appendChild(itemsWrap);
    // Only append group if it has any visible items or if not searching (to show titles)
    if(itemsWrap.children.length || !q){
      list.appendChild(group);
    }
  });

  if(matches === 0){
    emptyEl.hidden = false;
  }
  state.activeIndex = -1;
}

// Keyboard navigation inside panel
panel.addEventListener('keydown', (e) => {
  const options = state.visible;
  if(e.key === 'ArrowDown'){
    e.preventDefault();
    state.activeIndex = Math.min(options.length-1, state.activeIndex+1);
    setActive(options);
  } else if(e.key === 'ArrowUp'){
    e.preventDefault();
    state.activeIndex = Math.max(0, state.activeIndex-1);
    setActive(options);
  } else if(e.key === 'Enter'){
    e.preventDefault();
    if(state.activeIndex >= 0 && options[state.activeIndex]){
      options[state.activeIndex].click();
    }
  } else if(e.key === 'Escape'){
    closePanel();
    trigger.focus();
  }
});

function setActive(options){
  options.forEach((el, i) => {
    el.setAttribute('aria-selected', i === state.activeIndex ? 'true' : 'false');
    if(i === state.activeIndex){
      el.scrollIntoView({block:'nearest'});
    }
  });
}

function selectItem(sel){
  state.selection = sel;
  triggerText.textContent = sel.type;
  hint.textContent = `Категория: ${sel.category} • Тип: ${sel.type}`;
  fboVal.textContent = (sel.fbo ?? '—');
  fbsVal.textContent = (sel.fbs ?? '—');
  commissionBox.hidden = false;
  closePanel();
}

// Accessibility: open panel with keyboard on trigger
trigger.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' || e.key === ' '){
    e.preventDefault();
    openPanel();
  }
});
