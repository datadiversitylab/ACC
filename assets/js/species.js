// Species page
var h1 = readHash(), key = h1.s && BY[h1.s] ? h1.s : 'Panthera_leo';
var s = BY[key] || SP[0];
key = s.key;
var lin = [];
s.t.slice(0, 4).forEach(function (id, l) { lin.push('<a href="' + gLink({ lv: l, id: id }) + '">' + esc(D.T[l][id]) + '</a>'); });
document.title = s.name + ' | Animal Chromosome Counts';
document.getElementById('nm').textContent = s.name;
document.getElementById('lin').innerHTML = lin.join(' &rsaquo; ') + (s.orig ? '<br>Listed in the source as <i>' + esc(s.orig) + '</i>' : '');
document.getElementById('big').innerHTML = s.n.join(', ') + '<small>haploid' + (s.n.length > 1 ? ' counts' : '') + '</small>';
document.getElementById('two').textContent = s.two ? 'Diploid number in the source: ' + s.two : '';
document.getElementById('multi').innerHTML = s.n.length > 1 ? '<p class="note">This species has more than one count (' + s.n.join(', ') + '). The chart below uses the first one, ' + s.n0 + '. All sources are listed at the bottom of the page.</p>' : '';
document.getElementById('cname').innerHTML = esc(s.name);

// Comparison, with the species lineage as quick choices and a picker for any other group
var sel = document.getElementById('cg'), pk = document.getElementById('cpick'), cur = { lv: 4, id: s.t[4] };
[4, 3, 2, 1, 0].some(function (l) { cur = { lv: l, id: s.t[l] }; return IDX[l][s.t[l]].length >= 30; });
var qopts = [[4, 'Genus'], [3, 'Family'], [2, 'Order'], [1, 'Class'], [0, 'Phylum']].map(function (x) {
  return '<option value="' + gStr({ lv: x[0], id: s.t[x[0]] }) + '">' + x[1] + ': ' + esc(D.T[x[0]][s.t[x[0]]]) + ' (' + fmt(IDX[x[0]][s.t[x[0]]].length) + ' species)</option>';
}).join('');
var defStr = gStr(cur);
sel.innerHTML = qopts + '<option value="all">All animals (' + fmt(SP.length) + ' species)</option><option value="other">Another group...</option>';
sel.value = defStr;
var picker = Picker(pk, { label: 'Another group', g: { lv: -1 }, onchange: function (g) { cur = g; draw(); } });
pk.parentNode.style.display = 'none';
var chEl = document.getElementById('ch'), mode = 'n', logOn = false, lastB;
function draw() {
  var b = bins(gMembers(cur), mode), v = mode === '2n' ? s.n0 * 2 : s.n0, below = 0, same = 0, above = 0;
  lastB = b;
  gMembers(cur).forEach(function (m) {
    var x = mode === '2n' ? m.n0 * 2 : m.n0;
    if (x < v) below++; else if (x === v) same++; else above++;
  });
  var t = b.tot, pct = function (x) { return Math.round(x / t * 100); }, u = mode === '2n' ? '2n' : 'n';
  chEl.innerHTML = chartSvg([{ b: b, name: gName(cur) }], { x: v, log: logOn, mode: mode });
  document.getElementById('cap').innerHTML = 'In ' + esc(gName(cur)) + ' (' + fmt(t) + ' species) the median is ' + b.med + '. With ' + u + ' = ' + v + ', <i>' + esc(s.name) + '</i> is higher than ' + pct(below) + '% of the species, equal to ' + pct(same) + '% and lower than ' + pct(above) + '%.';
  document.getElementById('ex').href = gLink(cur);
  writeHash({ s: key, g: gStr(cur) === 'all' ? 'all' : gStr(cur), m: mode === '2n' ? '2n' : '', log: logOn ? 1 : '' });
}
sel.onchange = function () {
  if (sel.value === 'other') { pk.parentNode.style.display = ''; return; }
  pk.parentNode.style.display = 'none'; cur = gParse(sel.value); draw();
};
document.getElementById('mode').onchange = function () { mode = this.value; draw(); };
document.getElementById('log').onchange = function () { logOn = this.checked; draw(); };
document.getElementById('png').onclick = function () { savePng(chEl, 'acc-' + key + '.png'); };
if (h1.g) { cur = gParse(h1.g); var o = Array.prototype.filter.call(sel.options, function (x) { return x.value === gStr(cur); }); if (o.length) sel.value = o[0].value; else { sel.value = 'other'; pk.parentNode.style.display = ''; picker.set(cur); } }
if (h1.m === '2n') { mode = '2n'; document.getElementById('mode').value = '2n'; }
if (h1.log === '1') { logOn = true; document.getElementById('log').checked = true; }
draw();

// Closest relatives
var rel = IDX[4][s.t[4]].filter(function (m) { return m !== s; }), relNote = 'Other species in <i>' + esc(D.T[4][s.t[4]]) + '</i>.';
if (!rel.length) { rel = IDX[3][s.t[3]].filter(function (m) { return m !== s; }); relNote = 'No other species in <i>' + esc(D.T[4][s.t[4]]) + '</i>. Species in the same family, ' + esc(D.T[3][s.t[3]]) + ':'; }
rel = rel.slice(0, 8);
document.getElementById('relnote').innerHTML = rel.length ? relNote : 'No relatives with counts in this release.';
document.getElementById('rel').innerHTML = rel.map(function (m) { return '<li><a href="species.html#s=' + encodeURIComponent(m.key) + '"><i>' + esc(m.name) + '</i></a> <span class="meta">n ' + m.n.join(', ') + '</span></li>'; }).join('');

// Sources and citing
document.getElementById('src').innerHTML = s.refs.map(function (i) { return '<li>' + esc(D.R[i]) + '</li>'; }).join('');
var REC = s.name + '. Animal Chromosome Counts, release of Jun 28. ' + location.href.split('#')[0] + '#s=' + key + ' (accessed ' + new Date().toISOString().slice(0, 10) + '). Data: Román-Palacios C, Medina CA, Zhan SH, Barker MS (2021) https://doi.org/10.1111/jeb.13884';
document.getElementById('cite').onclick = function () { copy(REC, this); };
document.getElementById('rec').onclick = function (e) { e.preventDefault(); save('acc-' + key + '.csv', 'text/csv', speciesCsv([s])); };
document.getElementById('lnk').onclick = function () { copy(location.href, this); };
