BEGIN {
  HTML_TAGS = "|a|abbr|b|br|code|details|div|em|hr|i|img|kbd|li|ol|p|pre|span|strong|sub|summary|sup|table|td|th|tr|u|ul|"
  copy = work_dir "/" id ".md"
  print copy "\t" source "\t0\t0" > map
  blocks = 0
  in_fence = 0
}

{
  print neutralize_placeholders($0) > copy
  if (in_fence) continue_fence($0)
  else open_fence($0)
}

function open_fence(line,    marker, info) {
  if (!match(line, /^ *(`{3,}|~{3,})/)) return
  marker = substr(line, RSTART, RLENGTH)
  info = tolower(substr(line, RLENGTH + 1))
  fence_indent = match(marker, /[`~]/) - 1
  fence_marker = substr(marker, fence_indent + 1)
  sub(/^[ \t]+/, "", info)
  sub(/[ \t].*$/, "", info)
  in_fence = 1
  in_markdown_block = (kind == "model" && (info == "markdown" || info == "md"))
  if (in_markdown_block) start_block(NR)
}

function continue_fence(line) {
  if (closes_fence(line)) {
    in_fence = 0
    if (in_markdown_block) close(block)
    return
  }
  if (in_markdown_block) print neutralize_placeholders(strip_indent(line)) > block
}

function closes_fence(line,    bare) {
  bare = line
  gsub(/^[ \t]+|[ \t]+$/, "", bare)
  if (bare !~ /^(`{3,}|~{3,})$/) return 0
  return substr(bare, 1, 1) == substr(fence_marker, 1, 1) && length(bare) >= length(fence_marker)
}

function start_block(fence_line) {
  blocks++
  block = work_dir "/" id "-" blocks ".md"
  printf "" > block
  print block "\t" source "\t" fence_line "\t" fence_indent > map
}

function strip_indent(line,    removable) {
  removable = fence_indent
  while (removable > 0 && substr(line, 1, 1) == " ") {
    line = substr(line, 2)
    removable--
  }
  return line
}

function neutralize_placeholders(line,    parts, count, index_, result) {
  count = split(line, parts, "`")
  result = ""
  for (index_ = 1; index_ <= count; index_++) {
    if (index_ > 1) result = result "`"
    result = result (index_ % 2 ? neutralize_segment(parts[index_]) : parts[index_])
  }
  return result
}

function neutralize_segment(text,    result, inner, tag) {
  result = ""
  while (match(text, /<[A-Za-z{][^<>]*>/)) {
    inner = substr(text, RSTART + 1, RLENGTH - 2)
    tag = tolower(inner)
    sub(/[ \/].*$/, "", tag)
    result = result substr(text, 1, RSTART - 1)
    result = result (index(HTML_TAGS, "|" tag "|") ? "<" inner ">" : "(" inner ")")
    text = substr(text, RSTART + RLENGTH)
  }
  return result text
}
