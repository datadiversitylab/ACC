// Home page: chart and species table
var st = { g: { lv: -1 }, c: { lv: -1, none: true }, m: 'n', log: false, q: '', ph: '', page: 1 };
var h0 = readHash();
if (h0.g) st.g = gParse(h0.g);
if (h0.c) st.c = gParse(h0.c);
if (h0.m === '2n') st.m = '2n';
if (h0.log === '1') st.log = true;
if (h0.q) st.q = h0.q;
if (h0.p) st.ph = h0.p;
if (h0.pg) st.page = +h0.pg || 1;

function persist() {
  writeHash({ g: gStr(st.g) === 'all' ? '' : gStr(st.g), c: st.c.lv < 0 ? '' : gStr(st.c), m: st.m === '2n' ? '2n' : '', log: st.log ? 1 : '', q: st.q, p: st.ph, pg: st.page > 1 ? st.page : '' });
}

// Hero numbers
document.getElementById('nsp').textContent = fmt(SP.length);
document.getElementById('f1').textContent = fmt(SP.length);
document.getElementById('f2').textContent = fmt(D.T[3].length);
document.getElementById('f3').textContent = fmt(D.T[0].length);

// Chart
var chEl = document.getElementById('ch'), capEl = document.getElementById('cap'), legEl = document.getElementById('legend'), last = [];
function line(name, b) {
  var u = st.m === '2n' ? '2n' : 'n';
  return '<b>' + esc(name) + '</b>: ' + fmt(b.tot) + ' species, median ' + b.med + ', most common ' + u + ' is ' + b.mode + '.';
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
var pa = Picker(document.getElementById('pa'), { label: 'Group', g: st.g, onchange: function (g) { st.g = g; drawChart(); } });
var pb = Picker(document.getElementById('pb'), { label: 'Compare with', none: true, g: st.c, onchange: function (g) { st.c = g; drawChart(); } });
if (st.c.lv >= 0 || st.m === '2n' || st.log) document.getElementById('opts').open = true;
document.getElementById('mode').value = st.m;
document.getElementById('mode').onchange = function () { st.m = this.value; drawChart(); };
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

// Species table
var PER = 10, tq = document.getElementById('q'), ps = document.getElementById('ph'), hq = document.getElementById('hq'), match = [];
ps.innerHTML = '<option value="">All phyla</option>' + D.T[0].map(function (n, i) { return '<option value="' + i + '">' + esc(n) + '</option>'; }).join('');
ps.value = st.ph; tq.value = st.q; hq.value = st.q;
SP.forEach(function (s) { s.q = [s.name, s.orig, D.T[1][s.t[1]], D.T[2][s.t[2]], D.T[3][s.t[3]]].join(' ').toLowerCase(); });
function filter() {
  var q = st.q.trim().toLowerCase(), p = st.ph === '' ? -1 : +st.ph;
  match = SP.filter(function (s) { return (p < 0 || s.t[0] === p) && (!q || s.q.indexOf(q) > -1); });
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
function drawTable() {
  filter();
  var n = match.length, pages = Math.max(1, Math.ceil(n / PER));
  if (st.page > pages) st.page = pages;
  var a = (st.page - 1) * PER, rows = match.slice(a, a + PER);
  document.getElementById('b').innerHTML = rows.map(function (s) {
    return '<tr><td><a href="species.html#s=' + encodeURIComponent(s.key) + '">' + esc(s.name) + '</a>' + (s.orig ? '<div class="meta">Listed as ' + esc(s.orig) + '</div>' : '') + '</td><td class="t hide">' + D.T[1][s.t[1]] + '</td><td class="t hide">' + D.T[2][s.t[2]] + '</td><td class="t hide">' + D.T[3][s.t[3]] + '</td><td class="r"><b>' + s.n.join(', ') + '</b>' + (s.n.length > 1 ? ' <span class="meta">' + s.n.length + ' counts</span>' : '') + '</td></tr>';
  }).join('') || '<tr><td colspan="5" class="meta">No species match. Try a shorter name.</td></tr>';
  document.getElementById('c').textContent = n ? 'Showing ' + fmt(a + 1) + ' to ' + fmt(a + rows.length) + ' of ' + fmt(n) + ' species' : 'No species';
  document.getElementById('pg').innerHTML = n > PER ? pager(n) : '';
  document.getElementById('dl').textContent = (st.q || st.ph !== '') ? 'Download these ' + fmt(n) + ' rows (CSV)' : 'Download all rows (CSV)';
  persist();
}
tq.oninput = function () { st.q = tq.value; hq.value = tq.value; st.page = 1; drawTable(); };
ps.onchange = function () { st.ph = ps.value; st.page = 1; drawTable(); };
document.getElementById('hform').onsubmit = function (e) {
  e.preventDefault(); st.q = hq.value; tq.value = hq.value; st.page = 1; drawTable();
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

drawChart(); drawTable();
