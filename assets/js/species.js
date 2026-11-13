// Species page. The text is already in the HTML. This adds the chart and the buttons.
var key = document.body.getAttribute('data-key'), s = BY[key], h1 = readHash();
document.getElementById('cmpband').innerHTML = '<div class="wrap"><h2 id="h-cmp">How it compares</h2>' +
  '<p class="sub">Pick a group to see where <i>' + esc(s.name) + '</i> falls. ' + 'It\'s in amber.' + '</p>' +
  '<div class="ctl"><div><label for="cg">Group</label><select id="cg"></select></div><div><span class="lb">&nbsp;</span><div class="row" id="cpick"></div></div>' +
  '<div><label for="cs">Counts to include</label><select id="cs"><option value="hm">High and Medium confidence</option><option value="h">High confidence only</option><option value="all">All counts</option><option value="l">Low confidence only</option></select></div><div><label for="mode">Measure</label><select id="mode"><option value="n">Haploid (n)</option><option value="2n">Diploid (2n)</option></select></div>' +
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
  var mem = gMembers(cur), b = bins(mem, mode), u = mode === '2n' ? '2n' : 'n', vs = s.v.map(function (c) { return mode === '2n' ? c * 2 : c; });
  var t = b.tot, pct = function (x) { return Math.round(x / t * 100); };
  chEl.innerHTML = chartSvg([{ b: b, name: gName(cur) }], { xs: vs, log: logOn, mode: mode });
  var cap;
  if (!t) cap = 'No counts in ' + esc(gName(cur)) + ' at these confidence levels.';
  else {
    var parts = vs.map(function (v) {
      var lo = below(mem, mode, v), eq = 0;
      mem.forEach(function (m) { m.v.forEach(function (x) { if ((mode === '2n' ? x * 2 : x) === v) eq++; }); });
      return (vs.length > 1 ? u + ' = ' + v + ' is' : 'With ' + u + ' = ' + v + ', <i>' + esc(s.name) + '</i> is') + ' higher than ' + pct(lo) + '% of the counts, equal to ' + pct(eq) + '% and lower than ' + pct(t - lo - eq) + '%';
    });
    cap = 'In ' + esc(gName(cur)) + ' (' + fmt(t) + ' counts from ' + fmt(b.sp) + ' species) the median is ' + b.med + '. ' + (vs.length ? (vs.length > 1 ? 'For <i>' + esc(s.name) + '</i>, ' : '') + parts.join('. ') : '<i>' + esc(s.name) + '</i> has no counts at these confidence levels') + '.';
  }
  document.getElementById('cap').innerHTML = cap;
  document.getElementById('ex').href = '../' + gLink(cur);
  writeHash({ cs: CS === 'hm' ? '' : CS, g: gStr(cur), m: mode === '2n' ? '2n' : '', log: logOn ? 1 : '' });
}
sel.onchange = function () {
  if (sel.value === 'other') { pk.parentNode.style.display = ''; return; }
  pk.parentNode.style.display = 'none'; cur = gParse(sel.value); draw(); chartEvent();
};
document.getElementById('cs').value = CS;
document.getElementById('cs').onchange = function () { setCS(this.value); draw(); track('counts', { set: this.value }); };
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
