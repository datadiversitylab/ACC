// Learn page: numbers from the current release
var b = bins(SP, 'n'), many = SP.filter(function (s) { return s.n.length > 1; }).length;
$('lstat').innerHTML = 'In this release, haploid numbers go from n = ' + b.lo + ' to n = ' + b.hi + '. The median is ' + b.med + '. The most common number is ' + b.mode + ', found in ' + fmt(b.modeN) + ' species. ' + fmt(many) + ' species have conflicting counts.';
Array.prototype.forEach.call(document.querySelectorAll('#try a'), function (a) {
  var m = /#a=([^&]+)&(?:amp;)?b=([^&]+)/.exec(a.getAttribute('href'));
  if (m && (!BY[m[1]] || !BY[m[2]])) a.parentNode.remove();
});
