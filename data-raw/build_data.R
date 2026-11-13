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

# The counts and the first row of each species
firsts <- vapply(rows_by_species, function(i) i[1], numeric(1))
sp_counts <- lapply(rows_by_species, function(i) unique(unlist(lapply(d$curated_roundup_N[i], nums))))

# Confidence of each count, from its relatives only
# Relatives are the other species in the genus, or the family, the order, the class or the phylum.
# The first level with at least min_rel others is used. Each relative contributes its first count.
# High: inside the middle half (Q1 to Q3). Medium: outside it, but inside the usual range,
# which is Q1 - w to Q3 + w with w = 1.5 x IQR and at least 3. Low: outside the usual range.
# A species with too few relatives at every level is not rated.
min_rel <- 5
keys <- names(rows_by_species)
first_n <- vapply(sp_counts, function(x) x[1], numeric(1))
span <- function(a, b) {
  p <- ceiling(a)
  q <- floor(b)
  if (p <= q) c(p, q) else rep(round((a + b) / 2), 2)
}
members <- lapply(seq_along(levels_tax), function(j) {
  split(seq_along(keys), match(d[[levels_tax[j]]][firsts], tax[[j]]))
})
confidence <- lapply(seq_along(keys), function(i) {
  for (j in rev(seq_along(levels_tax))) {
    id <- as.character(match(d[[levels_tax[j]]][firsts[i]], tax[[j]]))
    others <- first_n[setdiff(members[[j]][[id]], i)]
    if (length(others) >= min_rel) {
      qs <- unname(quantile(others, c(0.25, 0.75), type = 7))
      w <- 1.5 * max(qs[2] - qs[1], 2)
      lo <- qs[1] - w
      hi <- qs[2] + w
      x <- sp_counts[[i]]
      use <- span(lo, hi)
      return(list(level = j - 1, k = length(others), mid = span(qs[1], qs[2]), use = c(max(1, use[1]), use[2]),
                  tiers = ifelse(x >= qs[1] & x <= qs[2], "H", ifelse(x >= lo & x <= hi, "M", "L"))))
    }
  }
  NULL
})
names(confidence) <- keys

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
  cf <- confidence[[k]]
  cfj <- if (is.null(cf)) "null" else paste0("[", paste(num(c(cf$level, cf$k, cf$mid, cf$use)), collapse = ","), ",", q(paste(cf$tiers, collapse = "")), "]")
  paste0("[", q(k), ",", if (orig == k) "0" else q(orig), ",", arr(num(ids)), ",",
         arr(num(counts)), ",", q(two), ",", arr(num(refs)), ",", cfj, "]")
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
by_genus <- split(keys, d$genus[firsts])
by_family <- split(keys, d$family[firsts])
tier_name <- c(H = "High", M = "Medium", L = "Low")
span_text <- function(a, b) if (a == b) paste0("n = ", num(a)) else paste0("n = ", num(a), " to ", num(b))
confidence_html <- function(cf, counts, lv, many) {
  if (is.null(cf)) return("<p class=\"flagline\"><a class=\"cf cf-N\" href=\"../learn.html#confidence\">Not rated</a> Too few relatives to compare.</p>")
  gname <- lv[[levels_tax[cf$level + 1]]]
  group <- paste0("the ", levels_tax[cf$level + 1], " ", if (cf$level == 4) paste0("<i>", esc(gname), "</i>") else esc(gname))
  mid <- span_text(cf$mid[1], cf$mid[2])
  use <- span_text(cf$use[1], cf$use[2])
  lines <- vapply(seq_along(counts), function(t) {
    tr <- cf$tiers[t]
    sm <- if (tr == "H") {
      sprintf("Within the middle half of the %d other species in %s (%s).", cf$k, group, mid)
    } else if (tr == "M") {
      sprintf("Outside the middle half (%s), but inside the usual range (%s), of the %d other species in %s.", mid, use, cf$k, group)
    } else {
      sprintf("Outside the usual range (%s) of the %d other species in %s.", use, cf$k, group)
    }
    if (cf$level <= 1) sm <- paste0(sm, " This is a broad comparison.")
    pre <- if (many) paste0("n = ", num(counts[t]), " ") else ""
    sprintf("<p class=\"flagline\">%s<a class=\"cf cf-%s\" href=\"../learn.html#confidence\">%s confidence</a> %s</p>", pre, tr, tier_name[[tr]], sm)
  }, character(1))
  paste(lines, collapse = "")
}
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
  conf <- confidence_html(confidence[[k]], counts, lv, many)

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
    flag = "", conf = conf, compare = paste0("../compare.html#a=", enc(k)), relnote = note,
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
