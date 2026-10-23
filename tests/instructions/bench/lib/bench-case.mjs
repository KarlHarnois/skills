import { cpSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ForceSiteCheck, PlacementCheck } from './checks.mjs'

export class BenchCase {
  static loadAll(casesDirectory) {
    return readdirSync(casesDirectory, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => BenchCase.load(join(casesDirectory, entry.name)))
  }

  static load(directory) {
    const definition = JSON.parse(readFileSync(join(directory, 'case.json'), 'utf8'))
    return new BenchCase(directory.split('/').pop(), join(directory, 'input'), definition)
  }

  constructor(name, inputDirectory, { entry, role, forceSites, templates, fencedControls }) {
    this.name = name
    this.inputDirectory = inputDirectory
    this.entry = entry
    this.role = role
    this.checkGroups = {
      forceStating: BenchCase.forceChecks(forceSites.filter(site => site.statesForce)),
      ordinarySense: BenchCase.forceChecks(forceSites.filter(site => !site.statesForce)),
      templates: templates.map(anchor => [anchor, PlacementCheck.outsideFence(anchor)]),
      fencedControls: fencedControls.map(anchor => [anchor, PlacementCheck.insideFence(anchor)]),
    }
  }

  static forceChecks(sites) {
    return sites.map(site => [`${site.word} @ ${site.anchor}`, new ForceSiteCheck(site)])
  }

  copyInputTo(directory) {
    cpSync(this.inputDirectory, directory, { recursive: true })
  }

  measure(tree) {
    return Object.fromEntries(Object.entries(this.checkGroups).map(([group, checks]) => [
      group,
      Object.fromEntries(checks.map(([label, check]) => [label, check.judge(tree)])),
    ]))
  }
}
