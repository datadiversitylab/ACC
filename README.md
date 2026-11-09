# Animal Chromosome Counts (ACC)

Chromosome counts for animal species, with the source of each count.
Site: https://datadiversitylab.github.io/ACC/

Data are released under Creative Commons Attribution 1.0 Generic, the same as the Zenodo record (https://doi.org/10.5281/zenodo.4635457).
Please cite Román-Palacios C, Medina CA, Zhan SH, Barker MS (2021) J Evol Biol 34(8): 1333-1339, https://doi.org/10.1111/jeb.13884.

## Layout

- `index.html`, `species.html`, `releases.html`, `about.html`, `contribute.html`: plain static pages
- `assets/js/data.js`: the table the pages read (built by the R script below)
- `data/`: release CSVs and the phylum summary
- `data-raw/build_data.R`: builds `assets/js/data.js`

## Update the data

1. Put the new release CSV and its phylum summary in `data/`.
2. From the repository root, run `Rscript data-raw/build_data.R data/NEWFILE.csv data/NEWSUMMARY.csv`.
3. Add the release to `releases.html` and update the date in the page footers.
4. Commit and push. GitHub Pages serves the files as they are (`.nojekyll` turns Jekyll off).

## Preview locally

Run `python3 -m http.server 8000` in this folder and open http://localhost:8000.
