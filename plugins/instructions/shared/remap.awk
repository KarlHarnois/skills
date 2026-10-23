BEGIN { FS = "\t" }

NR == FNR {
  source[$1] = $2
  line_offset[$1] = $3
  column_offset[$1] = $4
  next
}

{
  copy = alert_path($0)
  if (!(copy in source)) {
    print name_sources($0)
    next
  }
  rest = substr($0, length(copy) + 2)
  split(rest, fields, ":")
  line = fields[1] + line_offset[copy]
  column = fields[2] + column_offset[copy]
  print source[copy] ":" line ":" column ":" substr(rest, length(fields[1]) + length(fields[2]) + 3)
}

function name_sources(text,    copy, at) {
  for (copy in source) {
    while ((at = index(text, copy)) > 0) {
      text = substr(text, 1, at - 1) source[copy] substr(text, at + length(copy))
    }
  }
  return text
}

function alert_path(alert,    path) {
  path = alert
  sub(/\.md:[0-9]+:[0-9]+:.*$/, ".md", path)
  return path
}
