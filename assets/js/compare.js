// Compare two species
var hc = readHash(), A = BY[hc.a] || null, B = BY[hc.b] || null, mode = hc.m === '2n' ? '2n' : 'n', logOn = hc.log === '1';
var grp = hc.g ? gParse(hc.g) : { lv: -1 }, auto = !hc.g;
var SPITEMS = SP.map(spItem);
var LVN = ['phylum', 'class', 'order', 'family', 'genus'];

function box(id, get, set) {
  var inp = $(id);
  inp.value = get() ? get().name : '';
  Combo(inp, {
    limit: 8, select: true, enterPicksFirst: true,
    items: function () { return SPITEMS; },
    render: function (it, q) {
      var s = it.sp;
      return '<span><i>' + (q ? mark(s.name, q) : esc(s.name)) + '</i>' + (s.orig ? '<em> listed as ' + esc(s.orig) + '</em>' : '') + '</span><small>' + D.T[1][s.t[1]] + ', n ' + s.n.join(', ') + '</small>';
    },
    onpick: function (it) { set(it.sp); inp.value = it.sp.name; draw(); if (A && B) track('compare', { a: A.name, b: B.name }); },
    onblur: function () { inp.value = get() ? get().name : ''; }
  });
}
box('sa', function () { return A; }, function (s) { A = s; });
box('sb', function () { return B; }, function (s) { B = s; });

// The deepest group the two share, if it has enough species to make a useful chart
function sharedGroup() {
  var l;
  for (l = 4; l >= 0; l--) if (A.t[l] === B.t[l] && IDX[l][A.t[l]].length >= 30) return { lv: l, id: A.t[l] };
  return { lv: -1 };
}
function sharedText() {
  if (A === B) return 'These are the same species.';
  var l;
  for (l = 4; l >= 0; l--) if (A.t[l] === B.t[l]) return 'They are in the same ' + LVN[l] + ', ' + esc(D.T[l][A.t[l]]) + '.';
  return 'They are in different phyla, ' + esc(D.T[0][A.t[0]]) + ' and ' + esc(D.T[0][B.t[0]]) + '.';
}
function card(s, tag) {
  if (!s) return '<div class="cc empty"><span class="tag">' + tag + '</span><p class="meta">Pick a species above.</p></div>';
  var lin = [0, 1, 2, 3].map(function (l) { return '<a href="' + gLink({ lv: l, id: s.t[l] }) + '">' + esc(D.T[l][s.t[l]]) + '</a>'; }).join(' &rsaquo; ');
  return '<div class="cc"><span class="tag">' + tag + '</span><h3><a href="' + spUrl(s.key) + '"><i>' + esc(s.name) + '</i></a></h3>' +
    '<p class="lineage">' + lin + '</p>' +
    '<p><span class="nbig">' + s.n.join(', ') + '<small>haploid' + (s.n.length > 1 ? ' counts' : '') + '</small></span></p>' +
    '<p class="meta">' + (s.two ? 'Diploid number in the source: ' + esc(s.two) : '&nbsp;') + '</p>' +
    (s.n.length > 1 ? '<p><span class="flag">Conflicting counts</span></p>' : '') + '</div>';
}
function ratio(a, b) { var r = Math.round(a / b * 10) / 10; return String(r).replace(/\.0$/, ''); }
function sentence() {
  var u = mode === '2n' ? '2n' : 'n', k = mode === '2n' ? 2 : 1, a = A.n0 * k, b = B.n0 * k, hi, lo, hn, ln;
  if (A === B) return '';
  if (a === b) return 'Both have ' + u + ' = ' + a + '.';
  if (a > b) { hi = a; lo = b; hn = A.name; ln = B.name; } else { hi = b; lo = a; hn = B.name; ln = A.name; }
  return '<i>' + esc(hn) + '</i> has ' + u + ' = ' + hi + ' and <i>' + esc(ln) + '</i> has ' + u + ' = ' + lo + '. That is ' + (hi - lo) + ' more, or ' + ratio(hi, lo) + ' times as many.' +
    ((A.n.length > 1 || B.n.length > 1) ? ' A species with conflicting counts is compared at its first count.' : '');
}
var chEl = $('ch'), pk = null;
function drawChart() {
  var b = bins(gMembers(grp), mode), k = mode === '2n' ? 2 : 1, a = A.n0 * k, c = B.n0 * k, t = b.tot;
  var pa = 0, pb = 0;
  gMembers(grp).forEach(function (m) { var x = m.n0 * k; if (x < a) pa++; if (x < c) pb++; });
  var pct = function (x) { return Math.round(x / t * 100); };
  chEl.innerHTML = chartSvg([{ b: b, name: gName(grp) }], { x: a, x2: c, lab: ['A', 'B'], log: logOn, mode: mode });
  $('legend').innerHTML = '<span><i class="sw x"></i>A: ' + esc(A.name) + '</span><span><i class="sw bb"></i>B: ' + esc(B.name) + '</span><span>Dashed line: median</span>';
  $('cap').innerHTML = 'In ' + esc(gName(grp)) + ' (' + fmt(t) + ' species) the median is ' + b.med + '. A is higher than ' + pct(pa) + '% of the species and B is higher than ' + pct(pb) + '%.';
}
function draw() {
  $('cards').innerHTML = card(A, 'A') + card(B, 'B');
  var ok = A && B;
  $('cband').hidden = !ok;
  $('cmp').innerHTML = ok ? '<p>' + sentence() + ' ' + sharedText() + '</p>' : '';
  if (ok) {
    if (auto) { grp = sharedGroup(); if (pk) pk.set(grp); }
    drawChart();
  }
  writeHash({ a: A ? A.key : '', b: B ? B.key : '', g: auto ? '' : gStr(grp), m: mode === '2n' ? '2n' : '', log: logOn ? 1 : '' });
}
pk = Picker($('cpk'), { label: 'Group for the chart', g: grp, onchange: function (g) { grp = g; auto = false; draw(); } });
$('mode').value = mode; $('log').checked = logOn;
$('mode').onchange = function () { mode = this.value; draw(); };
$('log').onchange = function () { logOn = this.checked; draw(); };
$('png').onclick = function () { savePng(chEl, 'acc-compare.png'); };
$('lnk').onclick = function () { copy(location.href, this); };

// Quick examples
[['Panthera_leo', 'Panthera_tigris', 'Lion and tiger'], ['Homo_sapiens', 'Pan_troglodytes', 'Human and chimpanzee'], ['Apis_mellifera', 'Drosophila_melanogaster', 'Honeybee and fruit fly']].forEach(function (x) {
  if (!BY[x[0]] || !BY[x[1]]) return;
  var b = document.createElement('button');
  b.className = 'lk'; b.type = 'button'; b.textContent = x[2];
  b.onclick = function () { A = BY[x[0]]; B = BY[x[1]]; auto = true; $('sa').value = A.name; $('sb').value = B.name; draw(); track('compare', { a: A.name, b: B.name }); };
  $('cchips').appendChild(b);
});
if (A && B && auto) grp = sharedGroup();
if (A && B) pk.set(grp);
draw();
