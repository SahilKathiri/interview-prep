#!/usr/bin/env node
/**
 * First-time setup script.
 * Run automatically via: pnpm setup
 *
 * - Copies candidate.example.md → candidate.md  (if missing)
 * - Copies config.example.json  → config.json   (if missing)
 * - Installs root + skeleton dependencies
 */
import { intro, outro, note, spinner } from '@clack/prompts'
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

function copyIfMissing(src, dest, label) {
  if (fs.existsSync(dest)) {
    console.log(chalk.gray(`  ${chalk.bold(label)} already exists — skipping`))
    return false
  }
  fs.copyFileSync(src, dest)
  console.log(chalk.green(`  ${chalk.bold(label)} created from example`))
  return true
}

function runInstall(cwd, label) {
  return new Promise((resolve, reject) => {
    const s = spinner()
    s.start(`Installing dependencies (${label})…`)
    const proc = spawn('pnpm', ['install'], { cwd, stdio: 'ignore' })
    proc.on('close', (code) => {
      if (code === 0) {
        s.stop(`Dependencies installed (${label})`)
        resolve()
      } else {
        s.stop(`Failed (${label})`)
        reject(new Error(`pnpm install failed in ${label} with exit code ${code}`))
      }
    })
    proc.on('error', reject)
  })
}

async function main() {
  console.clear()
  intro(chalk.bold.bgMagenta(' ⚡ INTERVIEW PREP — SETUP '))

  // ── 1. Copy example files ─────────────────────────────────────────────────
  console.log('\n' + chalk.bold('Checking config files…'))
  const candidateCopied = copyIfMissing(
    path.join(ROOT, 'candidate.example.md'),
    path.join(ROOT, 'candidate.md'),
    'candidate.md',
  )
  const configCopied = copyIfMissing(
    path.join(ROOT, 'config.example.json'),
    path.join(ROOT, 'config.json'),
    'config.json',
  )

  // ── 2. Install deps ───────────────────────────────────────────────────────
  console.log()
  await runInstall(ROOT, 'root')
  await runInstall(path.join(ROOT, 'skeleton'), 'skeleton')

  // ── 3. Next steps ─────────────────────────────────────────────────────────
  const nextSteps = []

  if (candidateCopied) {
    nextSteps.push(`${chalk.yellow('!')} Edit ${chalk.bold('candidate.md')} — add your name, role, and background`)
  }

  if (configCopied) {
    nextSteps.push(`${chalk.yellow('!')} Edit ${chalk.bold('config.json')} — set ${chalk.bold('"activeCompany"')} to a folder name under ${chalk.bold('companies/')}`)
  }

  const companies = fs.existsSync(path.join(ROOT, 'companies'))
    ? fs.readdirSync(path.join(ROOT, 'companies')).filter((d) =>
        fs.statSync(path.join(ROOT, 'companies', d)).isDirectory() &&
        fs.existsSync(path.join(ROOT, 'companies', d, 'challenges.json')),
      )
    : []

  if (companies.length === 0) {
    nextSteps.push(
      `${chalk.yellow('!')} No companies found — open Claude Code and run: ${chalk.bold('/scaffold-company')}`,
    )
  } else {
    nextSteps.push(
      `${chalk.green('✓')} Companies available: ${companies.map((c) => chalk.cyan(c)).join(', ')}`,
    )
  }

  nextSteps.push(`\nThen run: ${chalk.bold('pnpm dev')} and open the app in your browser`)

  note(nextSteps.join('\n'), 'Next steps')
  outro('Setup complete.')
}

main().catch((err) => {
  console.error(chalk.red(err.message))
  process.exit(1)
})
