# Build assets/js/data.js for the ACC site from one release.
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
