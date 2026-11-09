// Coverage page
var rows = D.C.slice().sort(function (a, b) { return b[2] - a[2] || b[1] - a[1]; }), mx = 13, h = '';
function cv(n) { return D.C.filter(function (r) { return r[0] === n; })[0]; }
rows.forEach(function (r) {
  var link = D.T[0].indexOf(r[0]) > -1 ? '<a href="' + gLink({ lv: 0, id: D.T[0].indexOf(r[0]) }) + '">' + esc(r[0]) + '</a>' : esc(r[0]);
  h += '<tr' + (r[2] === 0 ? ' class="zero"' : '') + '><td>' + link + '</td><td class="r">' + fmt(r[2]) + '</td><td class="r hide">' + fmt(r[1]) + '</td><td class="r">' + (r[2] ? r[3] + '%' : '0%') + '</td><td class="hide" style="width:22%"><i class="bar2" style="width:' + (r[3] / mx * 100) + '%"></i></td><td class="hide">' + (r[4] ? 'Yes' : 'No') + '</td></tr>';
});
document.getElementById('cov').innerHTML = h;
var z = D.C.filter(function (r) { return r[2] === 0; }).length;
document.getElementById('covsum').textContent = z + ' of the ' + D.C.length + ' animal phyla have no counts. Chordata is the best covered at ' + cv('Chordata')[3] + '% of its described species. Arthropoda, the largest phylum, is at ' + cv('Arthropoda')[3] + '%.';
