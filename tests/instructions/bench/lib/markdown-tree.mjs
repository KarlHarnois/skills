import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const FENCE = /^\s*(`{3,}|~{3,})/

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
      fenced: fences.advance(line),
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
  }

  advance(line) {
    const marker = line.match(FENCE)?.[1]
    if (this.openMarker === null) {
      if (marker) this.openMarker = marker
      return Boolean(marker)
    }
    if (this.closes(line)) this.openMarker = null
    return true
  }

  closes(line) {
    const bare = line.trim()
    return /^(`{3,}|~{3,})$/.test(bare) && bare[0] === this.openMarker[0] && bare.length >= this.openMarker.length
  }
}
