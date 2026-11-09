// Shared helpers for the ACC mock-up. Data comes from data.js (ACCDB Jun 28).
var LV = ['phylum', 'class', 'order', 'family', 'genus'];
var LN = { phylum: 'Phylum', class: 'Class', order: 'Order', family: 'Family', genus: 'Genus' };
var SP = D.S.map(function (r, i) {
  return { i: i, key: r[0], name: r[0].replace(/_/g, ' '), orig: r[1] ? r[1].replace(/_/g, ' ') : '', t: r[2], n: r[3], two: r[4], refs: r[5], n0: r[3][0] };
});
var BY = {}, IDX = LV.map(function () { return {}; });
SP.forEach(function (s) {
  BY[s.key] = s;
  s.t.forEach(function (id, l) { (IDX[l][id] = IDX[l][id] || []).push(s); });
});
function fmt(x) { return x.toLocaleString('en-US'); }
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

// Groups are {lv: -1} for all animals or {lv: 0..4, id: index into D.T[lv]}
function gStr(g) { return g.lv < 0 ? 'all' : LV[g.lv] + ':' + D.T[g.lv][g.id]; }
function gParse(s) {
  if (!s || s === 'all') return { lv: -1 };
  var p = s.split(':'), l = LV.indexOf(p[0]), id = l < 0 ? -1 : D.T[l].indexOf(p.slice(1).join(':'));
  return id < 0 ? { lv: -1 } : { lv: l, id: id };
}
function gName(g) { return g.lv < 0 ? 'All animals' : D.T[g.lv][g.id]; }
function gMembers(g) { return g.lv < 0 ? SP : (IDX[g.lv][g.id] || []); }
function gLink(g) { return 'index.html#g=' + encodeURIComponent(gStr(g)) + '#chart'; }

// Hash state, for permalinks
function readHash() {
  var o = {}, h = location.hash.replace(/^#/, '').split('#')[0];
  h.split('&').forEach(function (kv) {
    var i = kv.indexOf('=');
    if (i > 0) o[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1));
  });
  return o;
}
function writeHash(o) {
  var h = Object.keys(o).filter(function (k) { return o[k] != null && o[k] !== ''; })
    .map(function (k) { return k + '=' + encodeURIComponent(o[k]); }).join('&');
  history.replaceState(null, '', '#' + h);
}

// Histogram numbers for a set of species
function bins(members, mode) {
  var N = mode === '2n' ? 80 : 40, c = [], k, vals = [];
  for (k = 0; k <= N; k++) c.push(0);
  members.forEach(function (s) {
    var v = mode === '2n' ? s.n0 * 2 : s.n0;
    vals.push(v);
    c[Math.min(Math.round(v), N)]++;
  });
  vals.sort(function (a, b) { return a - b; });
  var mx = 0, mode1 = 0;
  for (k = 1; k <= N; k++) if (c[k] > mx) { mx = c[k]; mode1 = k; }
  return { N: N, c: c, tot: vals.length, med: vals.length ? vals[Math.floor(vals.length / 2)] : 0, mode: mode1, modeN: mx, lo: vals[0], hi: vals[vals.length - 1] };
}

// Chart. series: [{b: bins, name}], opts: {log, x (highlight value), mode}
var COL_A = '#9ab9a5', COL_B = '#1f4e79', COL_X = '#d58f26';
function chartSvg(series, o) {
  var A = series[0].b, Bs = series[1] && series[1].b, N = A.N, W = 720, H = 262, L = 8, base = H - 34, top = Bs ? 44 : 30;
  var bw = (W - L - 8) / N, two = !!Bs, svg = '', k;
  function val(b, k) { return two ? b.c[k] / b.tot * 1000 : b.c[k]; }
  var m = 0;
  for (k = 1; k <= N; k++) { m = Math.max(m, val(A, k), two ? val(Bs, k) : 0); }
  function y(v) { var f = o.log ? Math.log(1 + v) / Math.log(1 + m) : v / m; return base - (m ? f : 0) * (base - top); }
  svg += '<rect width="' + W + '" height="' + H + '" fill="#ffffff"/>';
  for (k = 1; k <= N; k++) {
    var v = val(A, k), hi = o.x != null && Math.round(o.x) === k;
    var tip = 'n = ' + k + (k === N ? '+' : '') + ': ' + fmt(A.c[k]) + ' species';
    svg += '<rect x="' + (L + (k - 1) * bw + 1).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + Math.max(bw - 2, 1).toFixed(1) + '" height="' + (base - y(v)).toFixed(1) + '" fill="' + (hi ? COL_X : COL_A) + '"><title>' + tip + '</title></rect>';
  }
  if (two) {
    var d = '';
    for (k = 1; k <= N; k++) {
      var x0 = L + (k - 1) * bw + 1, x1 = x0 + bw - 2, yy = y(val(Bs, k));
      d += (k === 1 ? 'M' : 'L') + x0.toFixed(1) + ' ' + yy.toFixed(1) + 'L' + x1.toFixed(1) + ' ' + yy.toFixed(1);
    }
    svg += '<path d="' + d + '" fill="none" stroke="' + COL_B + '" stroke-width="2"/>';
  }
  svg += '<line x1="' + L + '" x2="' + (W - 8) + '" y1="' + base + '" y2="' + base + '" stroke="#222" stroke-opacity=".45"/>';
  var ticks = N === 80 ? [2, 10, 20, 30, 40, 50, 60, 70, 80] : [1, 5, 10, 15, 20, 25, 30, 35, 40];
  ticks.forEach(function (t) {
    svg += '<text x="' + (L + (t - 1) * bw + bw / 2).toFixed(1) + '" y="' + (H - 16) + '" font-size="12" text-anchor="middle" fill="#5f6368" font-family="Inter,sans-serif">' + (t === N ? t + '+' : t) + '</text>';
  });
  var xl = (o.mode === '2n' ? 'diploid number (2n)' : 'haploid number (n)') + ', ' + (two ? 'share of each group on the vertical axis' : 'species on the vertical axis') + (o.log ? ', log scale' : '');
  svg += '<text x="' + (W / 2) + '" y="' + (H - 2) + '" font-size="12" text-anchor="middle" fill="#5f6368" font-family="Inter,sans-serif">' + xl + '</text>';
  series.forEach(function (s, i) {
    if (!s.b.tot) return;
    var mx = L + (Math.min(s.b.med, N) - 1) * bw + bw / 2, ly = i ? top - 28 : top - 12;
    svg += '<line x1="' + mx + '" x2="' + mx + '" y1="' + (ly - 8) + '" y2="' + base + '" stroke="' + (i ? COL_B : '#222') + '" stroke-dasharray="3 3" stroke-opacity=".8"/>';
    var flip = mx > W - 110;
    svg += '<text x="' + (flip ? mx - 5 : mx + 5) + '" text-anchor="' + (flip ? 'end' : 'start') + '" y="' + ly + '" font-size="12" fill="' + (i ? COL_B : '#222') + '" font-family="Inter,sans-serif">median ' + s.b.med + '</text>';
  });
  var lab = series.map(function (s) { return s.name + ': ' + fmt(s.b.tot) + ' species, median ' + s.b.med; }).join('. ');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram of ' + (o.mode === '2n' ? 'diploid' : 'haploid') + ' chromosome numbers. ' + esc(lab) + '">' + svg + '</svg>';
}

function save(name, type, data) {
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function savePng(el, name) {
  var svg = el.querySelector('svg'), s = new XMLSerializer().serializeToString(svg), img = new Image();
  img.onload = function () {
    var c = document.createElement('canvas'); c.width = 1440; c.height = Math.round(1440 * img.height / img.width);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    c.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = name; a.click(); });
  };
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s);
}
function csvCell(v) { v = String(v == null ? '' : v); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
function speciesCsv(list) {
  var out = ['phylum,class,order,family,genus,species,listed_in_source_as,haploid_n,diploid_2n,references'];
  list.forEach(function (s) {
    out.push([D.T[0][s.t[0]], D.T[1][s.t[1]], D.T[2][s.t[2]], D.T[3][s.t[3]], D.T[4][s.t[4]], s.name, s.orig, s.n.join(' | '), s.two, s.refs.map(function (i) { return D.R[i]; }).join(' | ')].map(csvCell).join(','));
  });
  return out.join('\n');
}
function copy(text, btn) {
  var t = btn.textContent;
  function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = t; }, 1400); }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
}

// Group picker: a level menu plus a type-ahead box for the group name
function Picker(root, o) {
  // o: {none: bool, g: group, onchange}
  var sel = document.createElement('select'), inp = document.createElement('input'), dl = document.createElement('datalist');
  var id = 'dl' + Math.random().toString(36).slice(2, 7);
  sel.setAttribute('aria-label', o.label + ', level');
  inp.setAttribute('aria-label', o.label + ', name'); inp.setAttribute('list', id); inp.setAttribute('autocomplete', 'off'); inp.placeholder = 'Type a name';
  dl.id = id;
  var opts = [[o.none ? 'none' : 'all', o.none ? 'None' : 'All animals']].concat(LV.map(function (l) { return [l, LN[l]]; }));
  sel.innerHTML = opts.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('');
  root.appendChild(sel); root.appendChild(inp); root.appendChild(dl);
  var g = o.g || { lv: -1 };
  function fill(l) {
    var list = D.T[l].map(function (n, i) { return [n, IDX[l][i].length]; }).sort(function (a, b) { return b[1] - a[1]; });
    dl.innerHTML = list.map(function (x) { return '<option value="' + esc(x[0]) + '" label="' + x[1] + ' species"></option>'; }).join('');
  }
  function show() { inp.style.display = (sel.value === 'all' || sel.value === 'none') ? 'none' : ''; }
  function set(gg) {
    g = gg;
    if (gg.lv < 0) { sel.value = o.none ? 'none' : 'all'; inp.value = ''; }
    else { sel.value = LV[gg.lv]; fill(gg.lv); inp.value = D.T[gg.lv][gg.id]; }
    show();
  }
  sel.onchange = function () {
    show();
    if (sel.value === 'all' || sel.value === 'none') { g = { lv: -1, none: sel.value === 'none' }; o.onchange(g); return; }
    fill(LV.indexOf(sel.value)); inp.value = ''; inp.focus();
  };
  inp.oninput = function () {
    var l = LV.indexOf(sel.value), id = D.T[l].indexOf(inp.value);
    if (id > -1) { g = { lv: l, id: id }; o.onchange(g); }
  };
  set(g);
  return { set: set, get: function () { return g; } };
}
