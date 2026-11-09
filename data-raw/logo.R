# Draw the ACC logo: chromosomes standing as a histogram, with the name in bold sans.
# Run from the repository root: Rscript data-raw/logo.R
# The amber bar is the species you are looking at.

sage <- "#9ab9a5"
amber <- "#d58f26"
deep <- "#1f3d33"

# One unit is one inch, and lwd 1 is 1/96 inch, so a stroke of width w is w * 96
stroke <- function(x, y, w, col) lines(x, y, lwd = w * 96, lend = "round", col = col)

heights <- c(0.25, 0.5, 0.85, 1.15, 1.35, 0.95, 0.65, 0.45, 0.3, 0.22)
bars <- function(base, cx = 0, s = 1) {
  x <- cx + seq(-1.17, 1.17, length.out = length(heights)) * s
  for (i in seq_along(heights)) {
    stroke(c(x[i], x[i]), c(base, base + (heights[i] - 0.2) * s), 0.2 * s, if (i == 5) amber else sage)
  }
}

# Text fitted to a width in inches
label <- function(txt, y, width, cx = 0) {
  cex <- width / strwidth(txt, cex = 1, family = "sans", font = 2)
  text(cx, y, txt, cex = cex, col = deep, family = "sans", font = 2)
}

open_device <- function(file, w, h) {
  if (grepl("png$", file)) {
    png(file, width = w * 300, height = h * 300, res = 300, bg = "transparent")
  } else {
    svg(file, width = w, height = h, bg = "transparent")
  }
  par(mar = c(0, 0, 0, 0))
  plot.new()
  plot.window(xlim = c(-w / 2, w / 2), ylim = c(-h / 2, h / 2))
}

dir.create("assets/img", showWarnings = FALSE, recursive = TRUE)

# Full logo, with the name
open_device("assets/img/logo-acc.svg", 3, 3)
bars(0.02)
label("ACC", -0.68, 1.5)
label("ANIMAL CHROMOSOME COUNTS", -1.22, 1.9)
dev.off()

# Logo without the name, for the page that already has it as a heading
open_device("assets/img/logo-acc-short.svg", 3, 3)
bars(0.02)
label("ACC", -0.68, 1.5)
dev.off()

# The mark alone, for the header, the footer and the browser tab
for (f in c("assets/img/logo-mark.svg", "favicon.svg")) {
  open_device(f, 2, 2)
  bars(-0.55)
  dev.off()
}

# Preview image for links shared on social media, 1200 by 630 pixels
png("assets/img/social.png", width = 1200, height = 630, res = 100)
par(mar = c(0, 0, 0, 0))
plot.new()
plot.window(xlim = c(0, 12), ylim = c(0, 6.3), xaxs = "i", yaxs = "i")
rect(0, 0, 12, 6.3, col = "#f1f6f3", border = NA)
rect(0, 0, 12, 0.16, col = deep, border = NA)
bars(3.1, cx = 3.05, s = 1.57)
label("ACC", 1.9, 2.36, cx = 3.05)
text(6, 4.6, "Animal", adj = 0, cex = 4.3, col = deep, family = "serif", font = 2)
text(6, 3.7, "Chromosome", adj = 0, cex = 4.3, col = deep, family = "serif", font = 2)
text(6, 2.8, "Counts", adj = 0, cex = 4.3, col = deep, family = "serif", font = 2)
text(6, 1.85, "Chromosome counts for animal species,", adj = 0, cex = 1.75, family = "serif")
text(6, 1.45, "with the source of each count.", adj = 0, cex = 1.75, family = "serif")
text(6, 0.85, "datadiversitylab.github.io/ACC", adj = 0, cex = 1.5, col = "#2f6b57", family = "sans", font = 2)
dev.off()
