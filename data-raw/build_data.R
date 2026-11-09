# Build assets/js/data.js and one static page per species for the ACC site, from one release.
# Run from the repository root: Rscript data-raw/build_data.R
# Optional arguments: the release CSV and the phylum summary CSV.

args <- commandArgs(trailingOnly = TRUE)
csv <- if (length(args) >= 1) args[1] else "data/ACCDBJun28.csv"
summ <- if (length(args) >= 2) args[2] else "data/summary_Jun28.csv"
out <- "assets/js/data.js"
levels_tax <- c("phylum", "class", "order", "family", "genus")

d <- read.csv(csv, colClasses = "character", check.names = FALSE,
              fileEncoding = "UTF-8-BOM")
d[is.na(d)] <- ""

# Clean the references
# Several spellings of one reference are merged into the most frequent one.
squeeze <- function(x) trimws(gsub("\\s+", " ", x))
ref_key <- function(x) tolower(squeeze(gsub("[[:punct:]]", "", x)))

by_row <- lapply(strsplit(d$Reference, ";", fixed = TRUE), function(x) {
  x <- squeeze(x)
  x[nzchar(x)]
})
all_refs <- unlist(by_row)
spellings <- table(all_refs)
canon <- tapply(names(spellings), ref_key(names(spellings)),
                function(s) s[which.max(spellings[s])])
clean <- unname(canon[ref_key(all_refs)])
row_id <- rep(seq_along(by_row), lengths(by_row))
by_row <- split(clean, factor(row_id, levels = seq_along(by_row)))
ref_list <- unique(clean)

# Taxonomy lookup tables
tax <- lapply(levels_tax, function(l) sort(unique(d[[l]])))

# One entry per species
# A species listed in several rows is merged.
nums <- function(x) {
  v <- suppressWarnings(as.numeric(strsplit(gsub(" ", "", x), ",", fixed = TRUE)[[1]]))
  v[!is.na(v)]
}
rows_by_species <- split(seq_len(nrow(d)), factor(d$Species_corrected, levels = unique(d$Species_corrected)))

# JSON helpers (base R only)
q <- function(x) {
  x <- gsub("\\\\", "\\\\\\\\", x)
  x <- gsub("\"", "\\\\\"", x)
  x <- gsub("[\r\n\t]", " ", x)
  paste0("\"", x, "\"")
}
arr <- function(x) paste0("[", paste(x, collapse = ","), "]")
num <- function(x) format(x, trim = TRUE, scientific = FALSE)

species <- vapply(names(rows_by_species), function(k) {
  i <- rows_by_species[[k]]
  first <- i[1]
  ids <- vapply(seq_along(levels_tax), function(j) match(d[[levels_tax[j]]][first], tax[[j]]) - 1, numeric(1))
  counts <- unique(unlist(lapply(d$curated_roundup_N[i], nums)))
  two <- unique(d$ploidy_2N[i][nzchar(d$ploidy_2N[i])])
  two <- paste(gsub(",", ", ", two), collapse = ", ")
  refs <- unique(match(unlist(by_row[i]), ref_list) - 1)
  orig <- d$Species_original[first]
  paste0("[", q(k), ",", if (orig == k) "0" else q(orig), ",", arr(num(ids)), ",",
         arr(num(counts)), ",", q(two), ",", arr(num(refs)), "]")
}, character(1))

# Phylum coverage, from the release summary
s <- read.csv(summ, check.names = FALSE, stringsAsFactors = FALSE)
cover <- vapply(seq_len(nrow(s)), function(i) {
  paste0("[", q(s[i, 1]), ",", s[i, 2], ",", s[i, 3], ",", s[i, 4], ",", tolower(as.character(s[i, 5])), "]")
}, character(1))

js <- paste0(
  "var D={\"T\":", arr(vapply(tax, function(x) arr(q(x)), character(1))), ",\n",
  "\"R\":", arr(q(ref_list)), ",\n",
  "\"S\":[\n", paste(species, collapse = ",\n"), "\n],\n",
  "\"C\":", arr(cover), "};\n")
writeLines(js, out, useBytes = TRUE)
cat("Wrote", out, "with", length(species), "species and", length(ref_list), "references\n")

# Static species pages
# Every species gets its own page in species/, so search engines can find it.
# The page text is filled in here. The chart is added in the browser from data.js.
site <- "https://datadiversitylab.github.io/ACC/"
email <- "cromanpa@arizona.edu"
tpl <- paste(readLines("data-raw/species-template.html", encoding = "UTF-8"), collapse = "\n")
esc <- function(x) {
  x <- gsub("&", "&amp;", x, fixed = TRUE)
  x <- gsub("<", "&lt;", x, fixed = TRUE)
  x <- gsub(">", "&gt;", x, fixed = TRUE)
  gsub("\"", "&quot;", x, fixed = TRUE)
}
enc <- function(x) URLencode(x, reserved = TRUE)
joinor <- function(v) if (length(v) == 1) v else paste(paste(v[-length(v)], collapse = ", "), "or", v[length(v)])
keys <- names(rows_by_species)

# File names. Two names that differ only by letter case would collide on a Mac, so the later one gets a number.
seen <- new.env()
slug <- character(length(keys))
for (i in seq_along(keys)) {
  g <- gsub("[^A-Za-z0-9_.-]", "-", keys[i])
  base <- g
  n <- 1
  while (exists(tolower(g), envir = seen, inherits = FALSE)) {
    n <- n + 1
    g <- paste0(base, "-", n)
  }
  assign(tolower(g), TRUE, envir = seen)
  slug[i] <- g
}
names(slug) <- keys
odd <- slug[slug != keys]
writeLines(c("// Species whose file name differs from the name in the data",
             paste0("var SLUGX={", paste(sprintf("%s:%s", q(names(odd)), q(odd)), collapse = ","), "};")),
           "assets/js/slugs.js", useBytes = TRUE)

# What each species needs for its page
firsts <- vapply(rows_by_species, function(i) i[1], numeric(1))
sp_counts <- lapply(rows_by_species, function(i) unique(unlist(lapply(d$curated_roundup_N[i], nums))))
by_genus <- split(keys, d$genus[firsts])
by_family <- split(keys, d$family[firsts])
rel_item <- function(m) sprintf("<li><a href=\"%s.html\"><i>%s</i></a> <span class=\"meta\">n %s</span></li>",
                                enc(slug[m]), esc(gsub("_", " ", m)), paste(num(sp_counts[[m]]), collapse = ", "))

dir.create("species", showWarnings = FALSE)
for (k in keys) {
  i <- rows_by_species[[k]]
  first <- i[1]
  name <- gsub("_", " ", k)
  lv <- unlist(d[first, levels_tax])
  counts <- sp_counts[[k]]
  cs <- paste(num(counts), collapse = ", ")
  many <- length(counts) > 1
  lineage <- paste(sprintf("<a href=\"../index.html#g=%s#chart\">%s</a>", enc(paste0(levels_tax[1:4], ":", lv[1:4])), esc(lv[1:4])), collapse = " &rsaquo; ")
  orig <- d$Species_original[first]
  orig <- if (nzchar(orig) && orig != k) paste0("<br>Listed in the source as <i>", esc(gsub("_", " ", orig)), "</i>") else ""
  two <- unique(d$ploidy_2N[i][nzchar(d$ploidy_2N[i])])
  two <- paste(gsub(",", ", ", two), collapse = ", ")
  flag <- if (many) paste0("<p class=\"flagline\"><span class=\"flag\">Conflicting counts</span> This record lists more than one count.</p>",
                           "<p class=\"note\">The chart below uses the first one, ", num(counts[1]), ". The sources are listed together under Sources.</p>") else ""

  # Closest relatives: the genus, or the family when the genus has no other species
  rel <- setdiff(by_genus[[lv["genus"]]], k)
  note <- paste0("Other species in <i>", esc(lv["genus"]), "</i>.")
  if (!length(rel)) {
    rel <- setdiff(by_family[[lv["family"]]], k)
    note <- paste0("No other species in <i>", esc(lv["genus"]), "</i>. Species in the same family, ", esc(lv["family"]), ":")
  }
  if (!length(rel)) note <- "No relatives with counts in this release."
  rel <- head(rel, 8)

  src <- paste0("<ol>", paste(sprintf("<li>%s</li>", esc(unique(unlist(by_row[i])))), collapse = ""), "</ol>")
  if (many) src <- paste0(src, "<p class=\"meta\">The sources are listed together. The data does not say which source reports which count.</p>")

  url <- paste0(site, "species/", slug[k], ".html")
  body <- paste0("Species: ", name, "\nPage: ", url, "\nRelease: Jun 28, 2021\nCount in the table: n = ", cs,
                 "\n\nWhat should change:\n\n\nReference (DOI or full citation):\n\n\nYour name:\n")
  fields <- list(
    title = esc(paste(name, "chromosome count | Animal Chromosome Counts")),
    description = esc(sprintf("%s (family %s, order %s) has a haploid chromosome number of n = %s in the Animal Chromosome Counts, release of Jun 28, 2021, with the source of each count.",
                              name, lv["family"], lv["order"], joinor(num(counts)))),
    slug = slug[k], key = esc(k), name = esc(name), lineage = lineage, orig = orig, counts = esc(cs),
    countlabel = if (many) "haploid counts" else "haploid",
    two = if (nzchar(two)) paste0("<p class=\"meta\">Diploid number in the source: ", esc(two), "</p>") else "",
    flag = flag, compare = paste0("../compare.html#a=", enc(k)), relnote = note,
    related = paste(vapply(rel, rel_item, character(1)), collapse = ""),
    srctitle = "Sources", sources = src,
    mailto = esc(sprintf("mailto:%s?subject=%s&body=%s", email, enc(paste("ACC correction:", name)), enc(body))),
    issue = esc(sprintf("https://github.com/datadiversitylab/ACC/issues/new?title=%s&body=%s", enc(paste("Correction:", name)), enc(body)))
  )
  out <- tpl
  for (f in names(fields)) out <- gsub(paste0("{{", f, "}}"), fields[[f]], out, fixed = TRUE)
  writeLines(out, file.path("species", paste0(slug[k], ".html")), useBytes = TRUE)
}

# Sitemap and robots.txt
pages <- c("", "compare.html", "learn.html", "coverage.html", "releases.html", "about.html", "contribute.html",
           paste0("species/", vapply(slug, enc, character(1)), ".html"))
writeLines(c("<?xml version=\"1.0\" encoding=\"UTF-8\"?>", "<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">",
             sprintf("<url><loc>%s%s</loc></url>", site, pages), "</urlset>"), "sitemap.xml", useBytes = TRUE)
writeLines(c("User-agent: *", "Allow: /", "", paste0("Sitemap: ", site, "sitemap.xml")), "robots.txt")
cat("Wrote", length(keys), "species pages\n")
