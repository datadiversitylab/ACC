// Shared helpers for the ACC mock-up. Data comes from data.js (ACCDB Jun 28).
var LV = ['phylum', 'class', 'order', 'family', 'genus'];
var LN = { phylum: 'Phylum', class: 'Class', order: 'Order', family: 'Family', genus: 'Genus' };
var SP = D.S.map(function (r, i) {
  return { i: i, key: r[0], name: r[0].replace(/_/g, ' '), orig: r[1] ? r[1].replace(/_/g, ' ') : '', t: r[2], n: r[3], two: r[4], refs: r[5], n0: r[3][0], cf: r[6] || null };
});
// Confidence of each count, from how it sits among its relatives. Same words as the species pages.
var CFN = { H: 'High', M: 'Medium', L: 'Low' };
function cfLines(s) {
  var c = s.cf, link = 'learn.html#confidence';
  if (!c) return '<p class="flagline"><a class="cf cf-N" href="' + link + '">Not rated</a> Too few relatives to compare.</p>';
  var rg = function (a, b) { return 'n = ' + (a === b ? a : a + ' to ' + b); };
  var g = 'the ' + LV[c[0]] + ' ' + (c[0] === 4 ? '<i>' + esc(D.T[4][s.t[4]]) + '</i>' : esc(D.T[c[0]][s.t[c[0]]]));
  return s.n.map(function (n, i) {
    var t = c[6].charAt(i), sm;
    if (t === 'H') sm = 'Within the middle half of the ' + c[1] + ' other species in ' + g + ' (' + rg(c[2], c[3]) + ').';
    else if (t === 'M') sm = 'Outside the middle half (' + rg(c[2], c[3]) + '), but inside the usual range (' + rg(c[4], c[5]) + '), of the ' + c[1] + ' other species in ' + g + '.';
    else sm = 'Outside the usual range (' + rg(c[4], c[5]) + ') of the ' + c[1] + ' other species in ' + g + '.';
    if (c[0] <= 1) sm += ' This is a broad comparison.';
    return '<p class="flagline">' + (s.n.length > 1 ? 'n = ' + n + ' ' : '') + '<a class="cf cf-' + t + '" href="' + link + '">' + CFN[t] + ' confidence</a> ' + sm + '</p>';
  }).join('');
}
// Which counts the charts use. Each species adds every count that passes, so the bars count counts.
// Not rated counts pass unless the choice is High only or Low only.
var CSETS = { hm: 'HMN', h: 'H', all: 'HMLN', l: 'L' };
var CS = CSETS[readHash().cs] ? readHash().cs : 'hm';
function setCS(k) {
  CS = k;
  SP.forEach(function (s) {
    s.v = s.n.filter(function (c, i) { return CSETS[k].indexOf(s.cf ? s.cf[6].charAt(i) : 'N') > -1; });
  });
}
setCS(CS);
var BY = {}, IDX = LV.map(function () { return {}; });
SP.forEach(function (s) {
  BY[s.key] = s;
  s.t.forEach(function (id, l) { (IDX[l][id] = IDX[l][id] || []).push(s); });
});
// What search looks at for a species: the name, plus the former name as the second text
function spItem(s) { return { sp: s, f: fold(s.name), f2: s.orig ? fold(s.orig) : '', w: s.n0 ? 1 : 0 }; }
// Usage events for Umami. Nothing happens if the counter is blocked or not loaded.
function track(name, data) { try { if (window.umami && umami.track) umami.track(name, data); } catch (e) {} }
function later(fn, ms) { var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms); }; }
document.addEventListener('click', function (e) {
  var a = e.target.closest ? e.target.closest('a[href]') : null;
  if (!a) return;
  var h = a.getAttribute('href') || '', sp = document.body.getAttribute('data-key') || '', d = sp ? { species: sp } : undefined;
  if (/^mailto:/.test(h)) track('email', d);
  else if (/issues\/new/.test(h)) track('github-issue', d);
  else if (/^https?:/.test(h) && a.hostname !== location.hostname) track('outbound', { host: a.hostname });
  else if (/compare\.html/.test(h) && sp) track('compare-from-species', d);
}, true);
function $(id) { return document.getElementById(id); }
function slugOf(k) { return (typeof SLUGX !== 'undefined' && SLUGX[k]) || k; }
function spUrl(k) { return 'species/' + encodeURIComponent(slugOf(k)) + '.html'; }
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
function bins(members, mode, first) {
  var N = mode === '2n' ? 80 : 40, c = [], k, vals = [], sp = 0;
  for (k = 0; k <= N; k++) c.push(0);
  members.forEach(function (s) {
    var a = first ? [s.n0] : s.v;
    if (a.length) sp++;
    a.forEach(function (x) {
      var v = mode === '2n' ? x * 2 : x;
      vals.push(v);
      c[Math.min(Math.round(v), N)]++;
    });
  });
  vals.sort(function (a, b) { return a - b; });
  var mx = 0, mode1 = 0;
  for (k = 1; k <= N; k++) if (c[k] > mx) { mx = c[k]; mode1 = k; }
  return { N: N, c: c, tot: vals.length, sp: sp, n: members.length, med: vals.length ? vals[Math.floor(vals.length / 2)] : 0, mode: mode1, modeN: mx, lo: vals[0], hi: vals[vals.length - 1] };
}
// How many counts in a group sit below a value
function below(members, mode, v) {
  var p = 0;
  members.forEach(function (s) { s.v.forEach(function (x) { if ((mode === '2n' ? x * 2 : x) < v) p++; }); });
  return p;
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
    var v = val(A, k), hi = o.xs ? o.xs.some(function (x) { return Math.min(Math.round(x), N) === k; }) : o.x != null && Math.round(o.x) === k, hi2 = o.xs2 ? o.xs2.some(function (x) { return Math.min(Math.round(x), N) === k; }) : o.x2 != null && Math.round(o.x2) === k;
    var tip = 'n = ' + k + (k === N ? '+' : '') + ': ' + fmt(A.c[k]) + ' counts';
    svg += '<rect class="bar" x="' + (L + (k - 1) * bw + 1).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + Math.max(bw - 2, 1).toFixed(1) + '" height="' + (base - y(v)).toFixed(1) + '" fill="' + (hi ? COL_X : hi2 ? COL_B : COL_A) + '"><title>' + tip + '</title></rect>';
  }
  if (o.lab) {
    var labs = {};
    (o.xs ? o.xs.map(function (x) { return [x, o.lab[0]]; }) : [[o.x, o.lab[0]]]).concat(o.xs2 ? o.xs2.map(function (x) { return [x, o.lab[1]]; }) : [[o.x2, o.lab[1]]]).forEach(function (p) {
      if (p[0] == null) return;
      var kk = Math.min(Math.round(p[0]), N);
      if (kk >= 1) (labs[kk] = labs[kk] || []).push(p[1]);
    });
    Object.keys(labs).forEach(function (kk) {
      var both = labs[kk].length > 1, col = both ? '#222' : labs[kk][0] === o.lab[0] ? '#a35f0f' : COL_B;
      svg += '<text x="' + (L + (kk - 1) * bw + bw / 2).toFixed(1) + '" y="' + (y(val(A, +kk)) - 6).toFixed(1) + '" font-size="13" font-weight="700" text-anchor="middle" fill="' + col + '" font-family="Inter,sans-serif">' + labs[kk].join(' ') + '</text>';
    });
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
  var xl = (o.mode === '2n' ? 'diploid number (2n)' : 'haploid number (n)') + ', ' + (two ? 'share of each group on the vertical axis' : 'counts on the vertical axis') + (o.log ? ', log scale' : '');
  svg += '<text x="' + (W / 2) + '" y="' + (H - 2) + '" font-size="12" text-anchor="middle" fill="#5f6368" font-family="Inter,sans-serif">' + xl + '</text>';
  series.forEach(function (s, i) {
    if (!s.b.tot) return;
    var mx = L + (Math.min(s.b.med, N) - 1) * bw + bw / 2, ly = i ? top - 28 : top - 12;
    svg += '<line x1="' + mx + '" x2="' + mx + '" y1="' + (ly - 8) + '" y2="' + base + '" stroke="' + (i ? COL_B : '#222') + '" stroke-dasharray="3 3" stroke-opacity=".8"/>';
    var flip = mx > W - 110;
    svg += '<text x="' + (flip ? mx - 5 : mx + 5) + '" text-anchor="' + (flip ? 'end' : 'start') + '" y="' + ly + '" font-size="12" fill="' + (i ? COL_B : '#222') + '" font-family="Inter,sans-serif">median ' + s.b.med + '</text>';
  });
  var lab = series.map(function (s) { return s.name + ': ' + fmt(s.b.tot) + ' counts, median ' + s.b.med; }).join('. ');
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="Histogram of ' + (o.mode === '2n' ? 'diploid' : 'haploid') + ' chromosome numbers. ' + esc(lab) + '">' + svg + '</svg>';
}

function save(name, type, data) {
  track('download', { file: name.replace(/^acc-.*\./, 'acc.') });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data], { type: type }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function savePng(el, name) {
  track('download', { file: 'acc.png' });
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
  track('copy', { what: btn.id || 'text' });
  var t = btn.textContent;
  function done() { btn.textContent = 'Copied'; setTimeout(function () { btn.textContent = t; }, 1400); }
  if (navigator.clipboard) navigator.clipboard.writeText(text).then(done, done); else done();
}

// Typing help: matching that ignores case and accents, finds any word, and forgives small typos
function fold(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
function lev(a, b) {
  var p = [], i, j, c;
  for (j = 0; j <= b.length; j++) p[j] = j;
  for (i = 1; i <= a.length; i++) {
    var prev = p[0]; p[0] = i;
    for (j = 1; j <= b.length; j++) {
      c = p[j];
      p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = c;
    }
  }
  return p[b.length];
}
// items: [{f: folded name, f2: folded second name (optional), w: weight}]
function rank(items, q, limit) {
  q = fold(q).trim();
  if (!q) return [];
  var out = [], seen = {};
  items.forEach(function (it, k) {
    var best = 9;
    [it.f, it.f2].forEach(function (f, j) {
      if (!f) return;
      var s = f.indexOf(q) === 0 ? 0 : f.indexOf(' ' + q) > -1 ? 1 : f.indexOf(q) > -1 ? 2 : 9;
      if (s < 9) best = Math.min(best, s + j * 0.5);
    });
    if (best < 9) { out.push({ it: it, s: best }); seen[k] = 1; }
  });
  if (out.length < 4 && q.length >= 3) {
    var tol = q.length > 5 ? 2 : 1;
    items.forEach(function (it, k) {
      if (seen[k]) return;
      var d = 9;
      [it.f, it.f2].forEach(function (f) {
        if (!f) return;
        f.split(' ').concat([f.slice(0, q.length)]).forEach(function (w) {
          if (Math.abs(w.length - q.length) <= tol) d = Math.min(d, lev(q, w));
        });
      });
      if (d <= tol) out.push({ it: it, s: 5 + d });
    });
  }
  out.sort(function (a, b) { return a.s - b.s || (b.it.w || 0) - (a.it.w || 0) || (a.it.f < b.it.f ? -1 : 1); });
  return out.slice(0, limit).map(function (x) { return x.it; });
}
function mark(name, q) {
  var i = fold(name).indexOf(fold(q).trim());
  q = fold(q).trim();
  return i > -1 && q ? esc(name.slice(0, i)) + '<b>' + esc(name.slice(i, i + q.length)) + '</b>' + esc(name.slice(i + q.length)) : esc(name);
}

// A suggestion list under a text box, with keyboard and screen reader support
var comboId = 0;
function Combo(input, o) {
  var list = document.createElement('ul'), cur = [], act = -1, typed = false;
  list.className = 'sug'; list.id = 'sug' + (++comboId); list.setAttribute('role', 'listbox'); list.hidden = true;
  (o.host || input.parentNode).appendChild(list);
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-expanded', 'false'); input.setAttribute('aria-controls', list.id); input.setAttribute('autocomplete', 'off');
  function close() { list.hidden = true; act = -1; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); }
  function draw() {
    var q = input.value;
    list.innerHTML = cur.map(function (it, i) {
      return '<li role="option" id="' + list.id + 'o' + i + '" data-i="' + i + '"' + (i === act ? ' class="act" aria-selected="true"' : '') + '>' + o.render(it, typed ? q : '') + '</li>';
    }).join('') || (typed && q.trim() ? '<li class="none">No match. Try fewer letters.</li>' : '');
    list.hidden = !list.innerHTML;
    input.setAttribute('aria-expanded', String(!list.hidden));
    if (act > -1) input.setAttribute('aria-activedescendant', list.id + 'o' + act); else input.removeAttribute('aria-activedescendant');
  }
  function show() {
    cur = typed && input.value.trim() ? rank(o.items(), input.value, o.limit || 8) : (o.empty ? o.empty() : []);
    act = -1; draw();
  }
  function pick(it) { close(); o.onpick(it); }
  input.addEventListener('input', function () { typed = true; show(); });
  input.addEventListener('focus', function () { typed = false; if (o.select) input.select(); show(); });
  input.addEventListener('blur', function () { close(); if (o.onblur) o.onblur(); });
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (list.hidden) show();
      if (!cur.length) return;
      e.preventDefault();
      act = e.key === 'ArrowDown' ? (act + 1) % cur.length : (act < 1 ? cur.length - 1 : act - 1);
      draw();
      var el = document.getElementById(list.id + 'o' + act); if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (act > -1 && !list.hidden) { e.preventDefault(); pick(cur[act]); }
      else if (o.enterPicksFirst && typed && cur.length) { e.preventDefault(); pick(cur[0]); }
    } else if (e.key === 'Escape') { close(); }
  });
  list.addEventListener('mousedown', function (e) { e.preventDefault(); });
  list.addEventListener('click', function (e) {
    var li = e.target.closest ? e.target.closest('li[data-i]') : null;
    if (li) pick(cur[+li.getAttribute('data-i')]);
  });
  return { close: close };
}

// Group picker: one box that searches every level at once
var GROUPS = null;
function groupItems() {
  if (GROUPS) return GROUPS;
  GROUPS = [];
  LV.forEach(function (l, lv) {
    D.T[lv].forEach(function (name, id) {
      var n = IDX[lv][id].length;
      GROUPS.push({ lv: lv, id: id, name: name, f: fold(name), w: n, n: n });
    });
  });
  return GROUPS;
}
function Picker(root, o) {
  var wrap = document.createElement('div'), inp = document.createElement('input'), g = o.g || { lv: -1 };
  wrap.className = 'pk';
  inp.type = 'text'; inp.setAttribute('aria-label', o.label);
  inp.placeholder = o.none ? 'Optional. Type a group to compare' : 'Type a group, such as Carnivora';
  wrap.appendChild(inp); root.appendChild(wrap);
  function text(gg) { return gg.lv < 0 ? (o.none ? '' : 'All animals') : D.T[gg.lv][gg.id]; }
  function set(gg) { g = gg; inp.value = text(gg); }
  var popular = ['class:Mammalia', 'class:Aves', 'class:Insecta', 'class:Actinopterygii', 'class:Reptilia', 'class:Amphibia'];
  Combo(inp, {
    limit: 9, select: true, enterPicksFirst: true,
    items: groupItems,
    empty: function () {
      var l = popular.map(function (s) { var x = gParse(s); return { lv: x.lv, id: x.id, name: gName(x), n: gMembers(x).length }; });
      return (o.none ? [{ lv: -1, none: true, name: 'None', n: 0 }] : [{ lv: -1, name: 'All animals', n: SP.length }]).concat(l);
    },
    render: function (it, q) {
      var tag = it.lv < 0 ? '' : LN[LV[it.lv]] + ', ' + fmt(it.n) + ' species';
      return '<span>' + (q ? mark(it.name, q) : esc(it.name)) + '</span><small>' + tag + '</small>';
    },
    onpick: function (it) {
      g = it.lv < 0 ? { lv: -1, none: !!it.none } : { lv: it.lv, id: it.id };
      inp.value = text(g); o.onchange(g);
    },
    onblur: function () {
      if (o.none && !inp.value.trim() && !g.none) { g = { lv: -1, none: true }; o.onchange(g); }
      inp.value = text(g);
    }
  });
  set(g);
  return { set: set, get: function () { return g; } };
}
