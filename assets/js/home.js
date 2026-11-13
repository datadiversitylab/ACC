// Home page: chart and species table
var st = { g: { lv: -1 }, c: { lv: -1, none: true }, m: 'n', log: false, q: '', ph: '', page: 1, o: -1, f: -1, lo: '', hi: '', cf: false, so: '', di: 'asc' };
var h0 = readHash();
if (h0.g) st.g = gParse(h0.g);
if (h0.c) st.c = gParse(h0.c);
if (h0.m === '2n') st.m = '2n';
if (h0.log === '1') st.log = true;
if (h0.q) st.q = h0.q;
if (h0.p) st.ph = h0.p;
if (h0.pg) st.page = +h0.pg || 1;
if (h0.or) st.o = D.T[2].indexOf(h0.or);
if (h0.fa) st.f = D.T[3].indexOf(h0.fa);
if (h0.lo && +h0.lo > 0) st.lo = String(+h0.lo);
if (h0.hi && +h0.hi > 0) st.hi = String(+h0.hi);
if (h0.cf === '1') st.cf = true;

if (['name', 'class', 'order', 'family', 'n'].indexOf(h0.so) > -1) { st.so = h0.so; st.di = h0.di === 'desc' ? 'desc' : 'asc'; }

function persist() {
  writeHash({ cs: CS === 'hm' ? '' : CS, g: gStr(st.g) === 'all' ? '' : gStr(st.g), c: st.c.lv < 0 ? '' : gStr(st.c), m: st.m === '2n' ? '2n' : '', log: st.log ? 1 : '', q: st.q, p: st.ph, or: st.o < 0 ? '' : D.T[2][st.o], fa: st.f < 0 ? '' : D.T[3][st.f], lo: st.lo, hi: st.hi, cf: st.cf ? 1 : '', so: st.so, di: st.so && st.di === 'desc' ? 'desc' : '', pg: st.page > 1 ? st.page : '' });
}

// Hero numbers
document.getElementById('nsp').textContent = fmt(SP.length);
function countUp(id, to) {
  var el = document.getElementById(id), t0 = null;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
  function step(t) {
    if (t0 === null) t0 = t;
    var f = Math.min((t - t0) / 900, 1);
    el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - f, 3))));
    if (f < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
countUp('f1', SP.length); countUp('f2', D.T[3].length); countUp('f3', D.T[0].length);

// Chart
var chEl = document.getElementById('ch'), capEl = document.getElementById('cap'), legEl = document.getElementById('legend'), last = [];
function line(name, b) {
  var u = st.m === '2n' ? '2n' : 'n';
  return '<b>' + esc(name) + '</b>: ' + fmt(b.tot) + ' counts from ' + fmt(b.sp) + ' of ' + fmt(b.n) + ' species, median ' + b.med + ', most common ' + u + ' is ' + b.mode + '.';
}
function drawChart() {
  var A = bins(gMembers(st.g), st.m), series = [{ b: A, name: gName(st.g) }], two = st.c.lv >= 0, k, rows = '';
  if (two) series.push({ b: bins(gMembers(st.c), st.m), name: gName(st.c) });
  last = series;
  chEl.innerHTML = chartSvg(series, { log: st.log, mode: st.m });
  capEl.innerHTML = series.map(function (s) { return '<p>' + line(s.name, s.b) + '</p>'; }).join('');
  legEl.innerHTML = '<span><i class="sw"></i>' + esc(gName(st.g)) + '</span>' + (two ? '<span><i class="sw b"></i>' + esc(gName(st.c)) + '</span>' : '') + '<span>Dashed line: median</span>';
  for (k = 1; k <= A.N; k++) rows += '<span><b>' + k + (k === A.N ? '+' : '') + '</b> ' + fmt(A.c[k]) + (two ? ' / ' + fmt(series[1].b.c[k]) : '') + '</span>';
  document.getElementById('nums').innerHTML = rows;
  persist();
}
function chartEvent() { track('chart', { group: gName(st.g), compare: st.c.lv >= 0 ? gName(st.c) : '', measure: st.m }); }
var pa = Picker(document.getElementById('pa'), { label: 'Group', g: st.g, onchange: function (g) { st.g = g; drawChart(); chartEvent(); } });
var pb = Picker(document.getElementById('pb'), { label: 'Compare with', none: true, g: st.c, onchange: function (g) { st.c = g; drawChart(); chartEvent(); } });
if (st.c.lv >= 0 || st.m === '2n' || st.log) document.getElementById('opts').open = true;
document.getElementById('cs').value = CS;
document.getElementById('cs').onchange = function () { setCS(this.value); drawChart(); track('counts', { set: this.value }); };
document.getElementById('mode').value = st.m;
document.getElementById('mode').onchange = function () { st.m = this.value; drawChart(); chartEvent(); };
document.getElementById('log').checked = st.log;
document.getElementById('log').onchange = function () { st.log = this.checked; drawChart(); };
document.getElementById('png').onclick = function () { savePng(chEl, 'acc-' + gName(st.g) + '.png'); };
document.getElementById('svg').onclick = function () { save('acc-' + gName(st.g) + '.svg', 'image/svg+xml', chEl.innerHTML); };
document.getElementById('tcsv').onclick = function () {
  var A = last[0].b, two = last.length > 1, out = [['value', last[0].name].concat(two ? [last[1].name] : []).join(',')], k;
  for (k = 1; k <= A.N; k++) out.push([k + (k === A.N ? '+' : ''), A.c[k]].concat(two ? [last[1].b.c[k]] : []).join(','));
  save('acc-histogram.csv', 'text/csv', out.join('\n'));
};
document.getElementById('lnk').onclick = function () { copy(location.href, this); };

// Species table and search suggestions
var PER = 10, tq = $('q'), ps = $('ph'), hq = $('hq'), match = [], coll = new Intl.Collator('en');
ps.innerHTML = '<option value="">All phyla</option>' + D.T[0].map(function (n, i) { return '<option value="' + i + '">' + esc(n) + '</option>'; }).join('');
ps.value = st.ph; tq.value = st.q; hq.value = st.q;
$('lo').value = st.lo; $('hi').value = st.hi; $('cf').checked = st.cf;
var SPITEMS = SP.map(spItem);
SP.forEach(function (s) { s.q = [s.name, s.orig, D.T[1][s.t[1]], D.T[2][s.t[2]], D.T[3][s.t[3]]].join(' ').toLowerCase(); });
var SORTBY = {
  name: function (s) { return s.name; },
  class: function (s) { return D.T[1][s.t[1]]; },
  order: function (s) { return D.T[2][s.t[2]]; },
  family: function (s) { return D.T[3][s.t[3]]; },
  n: function (s) { return s.n0; }
};
function anyFilter() { return !!(st.q || st.ph !== '' || st.o >= 0 || st.f >= 0 || st.lo !== '' || st.hi !== '' || st.cf); }
function filter() {
  var q = st.q.trim().toLowerCase(), p = st.ph === '' ? -1 : +st.ph;
  var lo = st.lo === '' ? -Infinity : +st.lo, hi = st.hi === '' ? Infinity : +st.hi, ranged = lo > -Infinity || hi < Infinity;
  match = SP.filter(function (s) {
    if (p >= 0 && s.t[0] !== p) return false;
    if (st.o >= 0 && s.t[2] !== st.o) return false;
    if (st.f >= 0 && s.t[3] !== st.f) return false;
    if (st.cf && s.n.length < 2) return false;
    if (ranged && !s.n.some(function (v) { return v >= lo && v <= hi; })) return false;
    return !q || s.q.indexOf(q) > -1;
  });
  if (st.so) {
    var key = SORTBY[st.so], dir = st.di === 'desc' ? -1 : 1;
    match.sort(function (a, b) {
      var x = key(a), y = key(b), c = typeof x === 'number' ? x - y : coll.compare(x, y);
      return c ? c * dir : coll.compare(a.name, b.name);
    });
  }
}
function pager(n) {
  var pages = Math.max(1, Math.ceil(n / PER)), cur = st.page, set = {}, out = [];
  [1, 2, cur - 1, cur, cur + 1, pages].forEach(function (p) { if (p >= 1 && p <= pages) set[p] = 1; });
  var ks = Object.keys(set).map(Number).sort(function (a, b) { return a - b; }), prev = 0;
  if (cur > 1) out.push('<button class="lk" data-pg="' + (cur - 1) + '">Previous</button>');
  ks.forEach(function (p) {
    if (p - prev > 1) out.push('<span>...</span>');
    out.push(p === cur ? '<b aria-current="page">' + p + '</b>' : '<button class="lk" data-pg="' + p + '">' + fmt(p) + '</button>');
    prev = p;
  });
  if (cur < pages) out.push('<button class="lk" data-pg="' + (cur + 1) + '">Next</button>');
  return out.join('');
}
function didYouMean() {
  var r = st.q.trim() ? rank(SPITEMS, st.q, 3) : [];
  return r.length ? ' Did you mean ' + r.map(function (x) { return '<a href="' + spUrl(x.sp.key) + '"><i>' + esc(x.sp.name) + '</i></a>'; }).join(', ') + '?' : (anyFilter() ? ' Try fewer filters.' : '');
}
function drawTable() {
  filter();
  var n = match.length, pages = Math.max(1, Math.ceil(n / PER));
  if (st.page > pages) st.page = pages;
  var a = (st.page - 1) * PER, rows = match.slice(a, a + PER);
  $('b').innerHTML = rows.map(function (s) {
    return '<tr><td><a href="' + spUrl(s.key) + '">' + esc(s.name) + '</a>' + (s.orig ? '<div class="meta">Listed as ' + esc(s.orig) + '</div>' : '') + '</td><td class="t hide">' + D.T[1][s.t[1]] + '</td><td class="t hide">' + D.T[2][s.t[2]] + '</td><td class="t hide">' + D.T[3][s.t[3]] + '</td><td class="r"><b>' + s.n.join(', ') + '</b>' + '</td></tr>';
  }).join('') || '<tr><td colspan="5" class="meta">No species match.' + didYouMean() + '</td></tr>';
  $('c').textContent = n ? 'Showing ' + fmt(a + 1) + ' to ' + fmt(a + rows.length) + ' of ' + fmt(n) + ' species' : 'No species';
  $('pg').innerHTML = n > PER ? pager(n) : '';
  $('dl').textContent = anyFilter() ? 'Download these ' + fmt(n) + ' rows (CSV)' : 'Download all rows (CSV)';
  $('clr').style.visibility = anyFilter() ? 'visible' : 'hidden';
  Array.prototype.forEach.call(document.querySelectorAll('th[data-k]'), function (th) {
    var k = th.getAttribute('data-k'), on = st.so === k;
    th.setAttribute('aria-sort', on ? (st.di === 'desc' ? 'descending' : 'ascending') : 'none');
    th.querySelector('i').textContent = on ? (st.di === 'desc' ? ' ▼' : ' ▲') : '';
  });
  persist();
}
var searchEvent = later(function (q, from) { if (q.trim().length > 1) track('search', { q: q.trim().toLowerCase().slice(0, 60), from: from }); }, 1200);
var filterEvent = later(function () {
  track('filter', { phylum: st.ph === '' ? '' : D.T[0][+st.ph], order: st.o < 0 ? '' : D.T[2][st.o], family: st.f < 0 ? '' : D.T[3][st.f], min: st.lo, max: st.hi, conflicting: st.cf ? 'yes' : '' });
}, 1200);
tq.oninput = function () { st.q = tq.value; hq.value = tq.value; st.page = 1; drawTable(); searchEvent(tq.value, 'table'); };
ps.onchange = function () { st.ph = ps.value; st.page = 1; drawTable(); filterEvent(); };
$('lo').oninput = function () { st.lo = this.value.trim() === '' || +this.value < 1 ? '' : String(Math.floor(+this.value)); st.page = 1; drawTable(); filterEvent(); };
$('hi').oninput = function () { st.hi = this.value.trim() === '' || +this.value < 1 ? '' : String(Math.floor(+this.value)); st.page = 1; drawTable(); filterEvent(); };
$('cf').onchange = function () { st.cf = this.checked; st.page = 1; drawTable(); filterEvent(); };
$('clr').onclick = function () {
  st.q = ''; st.ph = ''; st.o = -1; st.f = -1; st.lo = ''; st.hi = ''; st.cf = false; st.page = 1;
  tq.value = ''; hq.value = ''; ps.value = ''; $('fo').value = ''; $('ff').value = ''; $('lo').value = ''; $('hi').value = ''; $('cf').checked = false;
  drawTable();
};
document.querySelector('#tbl thead').onclick = function (e) {
  var k = e.target.getAttribute && e.target.getAttribute('data-k');
  if (!k || e.target.tagName !== 'BUTTON') return;
  if (st.so !== k) { st.so = k; st.di = 'asc'; } else if (st.di === 'asc') st.di = 'desc'; else { st.so = ''; st.di = 'asc'; }
  st.page = 1; drawTable();
  if (st.so) track('sort', { column: st.so, dir: st.di });
};
// Order and family boxes, with suggestions as you type
function levelBox(id, lv, key) {
  var inp = $(id), items = D.T[lv].map(function (n, i) { return { id: i, name: n, f: fold(n), w: IDX[lv][i].length }; });
  function clear() { if (st[key] >= 0) { st[key] = -1; st.page = 1; drawTable(); } }
  inp.value = st[key] >= 0 ? D.T[lv][st[key]] : '';
  Combo(inp, {
    host: inp.parentNode, limit: 8, select: true, enterPicksFirst: true,
    items: function () { return items; },
    empty: function () { return items.slice().sort(function (a, b) { return b.w - a.w; }).slice(0, 8); },
    render: function (it, q) { return '<span>' + (q ? mark(it.name, q) : esc(it.name)) + '</span><small>' + fmt(it.w) + ' species</small>'; },
    onpick: function (it) { st[key] = it.id; inp.value = it.name; st.page = 1; drawTable(); filterEvent(); },
    onblur: function () { inp.value = st[key] >= 0 ? D.T[lv][st[key]] : ''; }
  });
  inp.addEventListener('input', function () { if (!inp.value.trim()) clear(); });
}
levelBox('fo', 2, 'o'); levelBox('ff', 3, 'f');
Combo(hq, {
  host: document.getElementById('hwrap'), limit: 8,
  items: function () { return SPITEMS; },
  render: function (it, q) {
    var s = it.sp, hit = q && !it.f.indexOf(fold(q).trim()) < 0;
    return '<span><i>' + (q ? mark(s.name, q) : esc(s.name)) + '</i>' + (s.orig ? '<em> listed as ' + esc(s.orig) + '</em>' : '') + '</span><small>' + D.T[1][s.t[1]] + ', n ' + s.n.join(', ') + '</small>';
  },
  onpick: function (it) { location.href = spUrl(it.sp.key); }
});
document.getElementById('hform').onsubmit = function (e) {
  e.preventDefault(); st.q = hq.value; tq.value = hq.value; st.page = 1; drawTable(); track('search', { q: hq.value.trim().toLowerCase().slice(0, 60), from: 'hero' });
  document.getElementById('tbl').scrollIntoView();
};
document.getElementById('pg').onclick = function (e) { var p = e.target.getAttribute && e.target.getAttribute('data-pg'); if (p) { st.page = +p; drawTable(); document.getElementById('tbl').scrollIntoView(); } };
document.getElementById('dl').onclick = function (e) { e.preventDefault(); filter(); save('acc-species.csv', 'text/csv', speciesCsv(match)); };

// Citation
var REF = 'Román-Palacios C, Medina CA, Zhan SH, Barker MS (2021). Animal chromosome counts reveal a similar range of chromosome numbers but with less polyploidy in animals compared to flowering plants. Journal of Evolutionary Biology 34(8): 1333-1339. https://doi.org/10.1111/jeb.13884';
var DAT = 'Román-Palacios C, Medina CA, Zhan SH, Barker MS (2021). The Animal Chromosome Count Database, version 1.0.1. Zenodo. https://doi.org/10.5281/zenodo.4635457';
var BIB = '@article{RomanPalacios2021,\n  author = {Román-Palacios, Cristian and Medina, Cesar A. and Zhan, Shing H. and Barker, Michael S.},\n  title = {Animal chromosome counts reveal a similar range of chromosome numbers but with less polyploidy in animals compared to flowering plants},\n  journal = {Journal of Evolutionary Biology},\n  year = {2021},\n  volume = {34},\n  number = {8},\n  pages = {1333--1339},\n  doi = {10.1111/jeb.13884}\n}';
document.getElementById('cr').onclick = function () { copy(REF, this); };
document.getElementById('cb').onclick = function () { copy(BIB, this); };
document.getElementById('cd').onclick = function () { copy(DAT, this); };

// Example charts
document.getElementById('chips').onclick = function (e) {
  var g = e.target.getAttribute && e.target.getAttribute('data-g');
  if (!g) return;
  st.g = gParse(g); st.c = e.target.getAttribute('data-c') ? gParse(e.target.getAttribute('data-c')) : { lv: -1, none: true };
  pa.set(st.g); pb.set(st.c);
  if (st.c.lv >= 0) document.getElementById('opts').open = true;
  drawChart(); chartEvent();
};

// Species with photos
var POOL = 'Panthera_leo Panthera_tigris Panthera_pardus Acinonyx_jubatus Homo_sapiens Pan_troglodytes Gorilla_gorilla Ailuropoda_melanoleuca Ursus_arctos Ursus_maritimus Canis_lupus Vulpes_vulpes Equus_caballus Equus_zebra Loxodonta_africana Elephas_maximus Giraffa_camelopardalis Mus_musculus Rattus_norvegicus Oryctolagus_cuniculus Delphinus_delphis Tursiops_truncatus Balaenoptera_musculus Gallus_gallus Anas_platyrhynchos Aquila_chrysaetos Columba_livia Danio_rerio Salmo_salar Xenopus_laevis Ambystoma_mexicanum Chelonia_mydas Crocodylus_niloticus Apis_mellifera Drosophila_melanogaster Bombyx_mori Lumbricus_terrestris Hydra_vulgaris Anopheles_gambiae Aedes_aegypti Tribolium_castaneum Macaca_mulatta Pongo_pygmaeus Panthera_onca Lynx_lynx Phoca_vitulina Rhinoceros_unicornis Hippopotamus_amphibius Camelus_dromedarius Struthio_camelus Carassius_auratus'.split(' ').filter(function (k) { return BY[k]; });
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
var queue = [], facesEl = document.getElementById('faces');
function nextKey() { if (!queue.length) queue = shuffle(POOL); return queue.pop(); }
var creditsEl = document.getElementById('credits');
function fillSlot(li, tries) {
  if (tries > 8) { li.remove(); return; }
  var k = nextKey(), s = BY[k];
  wikiPhoto(s.name, function (o) {
    if (!o) { fillSlot(li, tries + 1); return; }
    li.innerHTML = '<a href="' + spUrl(k) + '"><img src="' + esc(o.img) + '" alt="" loading="lazy"><i>' + esc(s.name) + '</i><b>n = ' + s.n.join(', ') + '</b></a>';
    li.className = 'in';
    var c = document.createElement('li');
    c.innerHTML = '<i>' + esc(s.name) + '</i>: ' + (o.credit ? esc(o.credit) + ', ' : '') + '<a href="' + esc(o.file) + '">Wikimedia Commons</a>';
    creditsEl.appendChild(c);
  });
}
function showFaces() {
  facesEl.innerHTML = ''; creditsEl.innerHTML = '';
  for (var i = 0; i < 5; i++) { var li = document.createElement('li'); facesEl.appendChild(li); fillSlot(li, 0); }
}
document.getElementById('shuffle').onclick = showFaces;
showFaces();

drawChart(); drawTable();
