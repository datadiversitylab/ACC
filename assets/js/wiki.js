// Species photos from Wikipedia and Wikimedia Commons, loaded in the browser.
// wikiPhoto(name, cb) calls cb with {img, page, file, credit} or null.
function wikiPhoto(name, cb) {
  var ck = 'acc-w2:' + name;
  try { var c = sessionStorage.getItem(ck); if (c) { cb(JSON.parse(c)); return; } } catch (e) {}
  function done(o) { try { sessionStorage.setItem(ck, JSON.stringify(o)); } catch (e) {} cb(o); }
  fetch('https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(name.replace(/ /g, '_')))
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (j) {
      var src = j && j.originalimage && j.originalimage.source;
      // Only free images on Commons, never fair-use files hosted on Wikipedia
      if (!j || !j.thumbnail || !src || src.indexOf('/wikipedia/commons/') < 0) { done(null); return; }
      var file = decodeURIComponent(src.split('/').pop());
      var o = { img: j.thumbnail.source, page: j.content_urls.desktop.page, file: 'https://commons.wikimedia.org/wiki/File:' + encodeURIComponent(file), credit: '' };
      fetch('https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=extmetadata&format=json&origin=*&titles=' + encodeURIComponent('File:' + file))
        .then(function (r) { return r.json(); })
        .then(function (m) {
          var p = m.query.pages, md = p[Object.keys(p)[0]].imageinfo[0].extmetadata, bits = [];
          var who = md.Artist ? md.Artist.value.replace(/<[^>]*>/g, '').trim() : '';
          if (who) bits.push(who);
          if (md.LicenseShortName) bits.push(md.LicenseShortName.value);
          o.credit = bits.join(', ');
          done(o);
        })
        .catch(function () { done(o); });
    })
    .catch(function () { done(null); });
}
