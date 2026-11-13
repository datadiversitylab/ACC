# Animal Chromosome Counts (ACC)

Chromosome counts for animal species, with the source of each count.
Site: https://datadiversitylab.github.io/ACC/

Data are released under Creative Commons Attribution 1.0 Generic, the same as the Zenodo record (https://doi.org/10.5281/zenodo.4635457).
Please cite Román-Palacios C, Medina CA, Zhan SH, Barker MS (2021) J Evol Biol 34(8): 1333-1339, https://doi.org/10.1111/jeb.13884.

## Layout

- `index.html`, `compare.html`, `learn.html`, `coverage.html`, `releases.html`, `about.html`, `contribute.html`: plain static pages
- `species/`: one static page per species, built by the R script below
- `assets/js/data.js`: the table the pages read (built by the R script below)
- `assets/js/slugs.js`: the few species whose file name differs from their name in the data
- `data/`: release CSVs and the phylum summary
- `data-raw/build_data.R`: builds `assets/js/data.js`, `assets/js/slugs.js`, `species/`, `sitemap.xml` and `robots.txt`
- `data-raw/species-template.html`: the template every species page is filled into
- `data-raw/confidence.py`: the confidence rule in Python, as a reference. The R script does the same
- `data-raw/logo.R`: draws the logo files in `assets/img/`, `favicon.svg` and the social preview image `assets/img/social.png`
- `assets/js/wiki.js`: loads species photos and credits from Wikipedia and Wikimedia Commons in the visitor's browser

## Update the data

1. Put the new release CSV and its phylum summary in `data/`.
2. From the repository root, run `Rscript data-raw/build_data.R data/NEWFILE.csv data/NEWSUMMARY.csv`.
3. Add the release to `releases.html` and update the date in the page footers.
4. Commit and push. GitHub Pages serves the files as they are (`.nojekyll` turns Jekyll off).

The species pages, the sitemap and the social image use the address https://datadiversitylab.github.io/ACC/. If the site moves, change it in `data-raw/build_data.R`, in the `<head>` of each page, and in `robots.txt`.

Corrections arrive by email (cromanpa@arizona.edu) or as GitHub issues. Both links are on every species page.

## Confidence

Each count gets a label from how it sits among the counts of its relatives. Relatives are the other species in the genus, or the family, the order, the class or the phylum. The first level with at least five others is used, and each relative contributes its first count.

- High: the count is inside the middle half (first to third quartile)
- Medium: outside the middle half, but inside the usual range (1.5 times the width of the middle half on each side, at least 3)
- Low: outside the usual range
- Not rated: fewer than five relatives at every level

`build_data.R` writes the result as the seventh field of each species in `assets/js/data.js` and as the confidence lines on each species page. The Compare page and the "Counts to include" menu read the field from `data.js`. The thresholds are `min_rel` and the `1.5` and `2` in `build_data.R`. Change them in `data-raw/confidence.py` too if you keep it.

## Scripts and styles

Every page loads its scripts and styles with a `?v=` number. When you change a file in `assets/`, change that number in the pages and in `data-raw/species-template.html`, so browsers do not keep an old copy.

## Preview locally

Run `python3 -m http.server 8000` in this folder and open http://localhost:8000.
