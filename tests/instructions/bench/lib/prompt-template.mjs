import { readFileSync } from 'node:fs'

const PLACEHOLDER = /\{\{([A-Z_]+)\}\}/g

export class PromptTemplate {
  static read(path) {
    return new PromptTemplate(readFileSync(path, 'utf8'))
  }

  constructor(text) {
    this.text = text
  }

  fill(values) {
    return this.text.replace(PLACEHOLDER, (placeholder, key) => {
      if (!(key in values)) throw new Error(`no value for ${placeholder}`)
      return values[key]
    })
  }
}
