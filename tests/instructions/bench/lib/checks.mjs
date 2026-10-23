const UPPERCASE_FORCE_WORD = /\b(?:MUST|NEVER|ALWAYS|SHOULD|MAY)\b/

export const Verdict = Object.freeze({
  CORRECT: 'correct',
  WRONG: 'wrong',
  REWORDED: 'reworded',
  LOST: 'lost',
})

export class ForceSiteCheck {
  constructor({ anchor, word, statesForce, allowsCapitalized = false }) {
    this.anchor = anchor
    this.word = word
    this.statesForce = statesForce
    this.allowsCapitalized = allowsCapitalized
  }

  judge(tree) {
    const prose = tree.linesWith(this.anchor).filter(line => !line.fenced)
    if (prose.length === 0) return Verdict.LOST
    const spelling = prose.map(line => this.spellingIn(line.text)).find(Boolean)
    if (spelling) return this.accepts(spelling) ? Verdict.CORRECT : Verdict.WRONG
    return this.restatedWithForce(prose) ? Verdict.CORRECT : Verdict.REWORDED
  }

  restatedWithForce(lines) {
    return this.statesForce && lines.some(line => UPPERCASE_FORCE_WORD.test(line.text))
  }

  spellingIn(text) {
    return text.match(new RegExp(`\\b${this.word}\\b`, 'i'))?.[0]
  }

  accepts(spelling) {
    if (spelling === this.word.toUpperCase()) return this.statesForce
    if (spelling === this.word) return !this.statesForce
    return !this.statesForce || this.allowsCapitalized
  }
}

export class PlacementCheck {
  static outsideFence(anchor) {
    return new PlacementCheck(anchor, false)
  }

  static insideFence(anchor) {
    return new PlacementCheck(anchor, true)
  }

  constructor(anchor, belongsInFence) {
    this.anchor = anchor
    this.belongsInFence = belongsInFence
  }

  judge(tree) {
    const lines = tree.linesWith(this.anchor)
    if (lines.length === 0) return Verdict.LOST
    return lines.some(line => line.fenced === this.belongsInFence) ? Verdict.CORRECT : Verdict.WRONG
  }
}
