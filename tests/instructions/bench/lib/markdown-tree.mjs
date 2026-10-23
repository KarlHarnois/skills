import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const FENCE = /^\s*(`{3,}|~{3,})\s*([^\s`]*)/
const LINTED_LABELS = new Set(['markdown', 'md'])

export class MarkdownTree {
  static read(root) {
    return new MarkdownTree(MarkdownTree.markdownPaths(root).map(path => ({
      file: relative(root, path),
      text: readFileSync(path, 'utf8'),
    })))
  }

  static markdownPaths(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) return MarkdownTree.markdownPaths(path)
      return entry.name.endsWith('.md') ? [path] : []
    })
  }

  constructor(files) {
    this.files = files
    this.lines = files.flatMap(({ file, text }) => MarkdownTree.scanLines(file, text))
  }

  static scanLines(file, text) {
    const fences = new FenceTracker()
    return text.split('\n').map((line, index) => ({
      file,
      number: index + 1,
      text: line,
      ...fences.advance(line),
    }))
  }

  linesWith(anchor) {
    const needle = anchor.toLowerCase()
    return this.lines.filter(line => line.text.toLowerCase().includes(needle))
  }

  wordCount() {
    return this.files.reduce((total, { text }) => total + text.split(/\s+/).filter(Boolean).length, 0)
  }

  paths() {
    return this.files.map(({ file }) => file)
  }
}

class FenceTracker {
  constructor() {
    this.openMarker = null
    this.innerFences = null
  }

  advance(line) {
    if (this.openMarker === null) return this.open(line)
    if (this.closes(line)) {
      this.openMarker = null
      return { fenced: true, linted: false }
    }
    return { fenced: true, linted: this.innerFences !== null && !this.innerFences.advance(line).fenced }
  }

  open(line) {
    const [, marker, label] = line.match(FENCE) ?? []
    if (!marker) return { fenced: false, linted: true }
    this.openMarker = marker
    this.innerFences = LINTED_LABELS.has(label.toLowerCase()) ? new FenceTracker() : null
    return { fenced: true, linted: false }
  }

  closes(line) {
    const bare = line.trim()
    return /^(`{3,}|~{3,})$/.test(bare) && bare[0] === this.openMarker[0] && bare.length >= this.openMarker.length
  }
}
