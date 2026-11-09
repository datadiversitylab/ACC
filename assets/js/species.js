// Species page. The text is already in the HTML. This adds the chart and the buttons.
var key = document.body.getAttribute('data-key'), s = BY[key], h1 = readHash();
document.getElementById('cmpband').innerHTML = '<div class="wrap"><h2 id="h-cmp">How it compares</h2>' +
  '<p class="sub">Pick a group to see where <i>' + esc(s.name) + '</i> falls. It\'s the amber bar.</p>' +
  '<div class="ctl"><div><label for="cg">Group</label><select id="cg"></select></div><div><span class="lb">&nbsp;</span><div class="row" id="cpick"></div></div>' +
  '<div><label for="mode">Measure</label><select id="mode"><option value="n">Haploid (n)</option><option value="2n">Diploid (2n)</option></select></div>' +
  '<div><span class="lb">&nbsp;</span><label class="chk"><input type="checkbox" id="log">Log scale</label></div></div>' +
  '<div id="ch"></div>' +
  '<div class="legend"><span><i class="sw x"></i>This species</span><span><i class="sw"></i>Other species in the group</span><span>Dashed line: median</span></div>' +
  '<p id="cap" class="stat"></p>' +
  '<div class="acts c"><a id="ex" href="#">Open this group in Explore</a><a href="../compare.html#a=' + encodeURIComponent(key) + '">Compare with another species</a><button class="lk" id="png">Download PNG</button><button class="lk" id="lnk">Copy link</button></div></div>';

// Comparison, with the species lineage as quick choices and a picker for any other group
var sel = document.getElementById('cg'), pk = document.getElementById('cpick'), cur = { lv: 4, id: s.t[4] };
[4, 3, 2, 1, 0].some(function (l) { cur = { lv: l, id: s.t[l] }; return IDX[l][s.t[l]].length >= 30; });
var qopts = [[4, 'Genus'], [3, 'Family'], [2, 'Order'], [1, 'Class'], [0, 'Phylum']].map(function (x) {
  return '<option value="' + gStr({ lv: x[0], id: s.t[x[0]] }) + '">' + x[1] + ': ' + esc(D.T[x[0]][s.t[x[0]]]) + ' (' + fmt(IDX[x[0]][s.t[x[0]]].length) + ' species)</option>';
}).join('');
sel.innerHTML = qopts + '<option value="all">All animals (' + fmt(SP.length) + ' species)</option><option value="other">Another group...</option>';
sel.value = gStr(cur);
function chartEvent() { track('species-chart', { species: s.name, group: gName(cur), measure: mode }); }
var picker = Picker(pk, { label: 'Another group', g: { lv: -1 }, onchange: function (g) { cur = g; draw(); chartEvent(); } });
pk.parentNode.style.display = 'none';
var chEl = document.getElementById('ch'), mode = 'n', logOn = false;
function draw() {
  var b = bins(gMembers(cur), mode), v = mode === '2n' ? s.n0 * 2 : s.n0, below = 0, same = 0, above = 0;
  gMembers(cur).forEach(function (m) {
    var x = mode === '2n' ? m.n0 * 2 : m.n0;
    if (x < v) below++; else if (x === v) same++; else above++;
  });
  var t = b.tot, pct = function (x) { return Math.round(x / t * 100); }, u = mode === '2n' ? '2n' : 'n';
  chEl.innerHTML = chartSvg([{ b: b, name: gName(cur) }], { x: v, log: logOn, mode: mode });
  document.getElementById('cap').innerHTML = 'In ' + esc(gName(cur)) + ' (' + fmt(t) + ' species) the median is ' + b.med + '. With ' + u + ' = ' + v + ', <i>' + esc(s.name) + '</i> is higher than ' + pct(below) + '% of the species, equal to ' + pct(same) + '% and lower than ' + pct(above) + '%.';
  document.getElementById('ex').href = '../' + gLink(cur);
  writeHash({ g: gStr(cur), m: mode === '2n' ? '2n' : '', log: logOn ? 1 : '' });
}
sel.onchange = function () {
  if (sel.value === 'other') { pk.parentNode.style.display = ''; return; }
  pk.parentNode.style.display = 'none'; cur = gParse(sel.value); draw(); chartEvent();
};
document.getElementById('mode').onchange = function () { mode = this.value; draw(); chartEvent(); };
document.getElementById('log').onchange = function () { logOn = this.checked; draw(); };
document.getElementById('png').onclick = function () { savePng(chEl, 'acc-' + key + '.png'); };
if (h1.g) {
  cur = gParse(h1.g);
  var o = Array.prototype.filter.call(sel.options, function (x) { return x.value === gStr(cur); });
  if (o.length) sel.value = o[0].value; else { sel.value = 'other'; pk.parentNode.style.display = ''; picker.set(cur); }
}
if (h1.m === '2n') { mode = '2n'; document.getElementById('mode').value = '2n'; }
if (h1.log === '1') { logOn = true; document.getElementById('log').checked = true; }
draw();

// Citing
var REC = s.name + '. Animal Chromosome Counts, release of Jun 28. ' + location.href.split('#')[0] + ' (accessed ' + new Date().toISOString().slice(0, 10) + '). Data: Román-Palacios C, Medina CA, Zhan SH, Barker MS (2021) https://doi.org/10.1111/jeb.13884';
document.getElementById('cite').onclick = function () { copy(REC, this); };
document.getElementById('rec').onclick = function (e) { e.preventDefault(); save('acc-' + key + '.csv', 'text/csv', speciesCsv([s])); };
document.getElementById('lnk').onclick = function () { copy(location.href, this); };
