const ABSOLUTE_FORCE_WORD = /\b(?:MUST|NEVER|ALWAYS)\b/
const WEAKER_FORCE_WORD = /\b(?:SHOULD|MAY)\b/

export const Verdict = Object.freeze({
  CORRECT: 'correct',
  WRONG: 'wrong',
  REWORDED: 'reworded',
  UNREAD: 'unread',
  LOST: 'lost',
})

export class ForceSiteCheck {
  constructor({ anchor, word, statesForce }) {
    this.anchor = anchor
    this.word = word
    this.statesForce = statesForce
  }

  judge(tree) {
    const anchored = tree.linesWith(this.anchor)
    if (anchored.length === 0) return Verdict.LOST
    const prose = anchored.filter(line => line.linted)
    if (prose.length === 0) return Verdict.UNREAD
    const spelling = prose.map(line => this.spellingIn(line.text)).find(Boolean)
    if (spelling) return this.accepts(spelling) ? Verdict.CORRECT : Verdict.WRONG
    return this.judgeRestatement(prose)
  }

  judgeRestatement(lines) {
    if (!this.statesForce) return Verdict.REWORDED
    if (lines.some(line => ABSOLUTE_FORCE_WORD.test(line.text))) return Verdict.CORRECT
    if (lines.some(line => WEAKER_FORCE_WORD.test(line.text))) return Verdict.WRONG
    return Verdict.REWORDED
  }

  spellingIn(text) {
    const found = text.match(new RegExp(`\\b${this.word}\\b`, 'i'))
    if (!found) return null
    return found[0]
  }

  accepts(spelling) {
    const inAllCapitals = spelling === this.word.toUpperCase()
    return inAllCapitals === this.statesForce
  }
}

export class PlacementCheck {
  static readByLinter(anchor) {
    return new PlacementCheck(anchor, true)
  }

  static skippedByLinter(anchor) {
    return new PlacementCheck(anchor, false)
  }

  constructor(anchor, belongsInLintedText) {
    this.anchor = anchor
    this.belongsInLintedText = belongsInLintedText
  }

  judge(tree) {
    const lines = tree.linesWith(this.anchor)
    if (lines.length === 0) return Verdict.LOST
    return this.isPlaced(lines) ? Verdict.CORRECT : Verdict.WRONG
  }

  isPlaced(lines) {
    if (this.belongsInLintedText) return lines.every(line => line.linted)
    return lines.some(line => !line.linted)
  }
}
