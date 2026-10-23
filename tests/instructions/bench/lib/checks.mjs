const ABSOLUTE_FORCE_WORD = /\b(?:MUST|NEVER|ALWAYS)\b/
const WEAKER_FORCE_WORD = /\b(?:SHOULD|MAY)\b/

export const Verdict = Object.freeze({
  CORRECT: 'correct',
  WRONG: 'wrong',
  REWORDED: 'reworded',
  LOST: 'lost',
})

export class ForceSiteCheck {
  constructor({ anchor, word, statesForce }) {
    this.anchor = anchor
    this.word = word
    this.statesForce = statesForce
  }

  judge(tree) {
    const prose = tree.linesWith(this.anchor).filter(line => !line.fenced)
    if (prose.length === 0) return Verdict.LOST
    const match = prose.map(line => this.matchIn(line.text)).find(Boolean)
    if (match) return this.accepts(match) ? Verdict.CORRECT : Verdict.WRONG
    return this.judgeRestatement(prose)
  }

  judgeRestatement(lines) {
    if (!this.statesForce) return Verdict.REWORDED
    if (lines.some(line => ABSOLUTE_FORCE_WORD.test(line.text))) return Verdict.CORRECT
    if (lines.some(line => WEAKER_FORCE_WORD.test(line.text))) return Verdict.WRONG
    return Verdict.REWORDED
  }

  matchIn(text) {
    const found = text.match(new RegExp(`\\b${this.word}\\b`, 'i'))
    if (!found) return null
    return { spelling: found[0], opensSentence: ForceSiteCheck.opensSentence(text.slice(0, found.index)) }
  }

  static opensSentence(textBefore) {
    const lead = textBefore.replace(/^\s*(?:[-*+]|\d+\.)?\s*/, '').replace(/[*_\s]+$/, '')
    return lead === '' || /[.!?]$/.test(lead)
  }

  accepts({ spelling, opensSentence }) {
    if (spelling === this.word.toUpperCase()) return this.statesForce
    if (spelling === this.word) return !this.statesForce
    return !this.statesForce || this.opensProhibition(opensSentence)
  }

  opensProhibition(opensSentence) {
    return this.word === 'never' && opensSentence
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
    return this.isPlaced(lines) ? Verdict.CORRECT : Verdict.WRONG
  }

  isPlaced(lines) {
    if (this.belongsInFence) return lines.some(line => line.fenced)
    return lines.every(line => !line.fenced)
  }
}
