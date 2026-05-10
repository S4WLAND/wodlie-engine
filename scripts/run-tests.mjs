import assert from 'node:assert/strict'
import fs from 'fs-extra'
import os from 'os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const rootDir = process.cwd()
const businessModule = await import(pathToFileURL(path.join(rootDir, 'dist', 'core', 'business.js')).href)
const infraModule = await import(pathToFileURL(path.join(rootDir, 'dist', 'core', 'infra.js')).href)
const reportModule = await import(pathToFileURL(path.join(rootDir, 'dist', 'core', 'report.js')).href)

const {
  businessEpicCreateCommand,
  businessStoryCreateCommand,
  devStoryCompleteCommand,
} = businessModule
const { infraSyncArtifacts } = infraModule
const { reportDraftCommand } = reportModule

function getWeekId(date = new Date()) {
  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = utc.getUTCDay() || 7
  utc.setUTCDate(utc.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utc.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

async function seedProject(tempDir) {
  await fs.ensureDir(path.join(tempDir, '.wodlie-config'))
  await fs.ensureDir(path.join(tempDir, '.business', 'requirements', 'epics'))
  await fs.writeJson(path.join(tempDir, '.wodlie-config', 'project.json'), {
    project: 'demo',
    active: true,
    domain: 'demo.com',
    acme_email: 'ops@demo.com',
    contract: {
      type: 'fixed',
      history: [{ type: 'fixed', started: '2026-04-24', ended: null }],
    },
    project_profile: {
      type: 'webapp',
      size: 'medium',
    },
    hosting_type: 'vps',
    capabilities: [],
    infra_details: {
      provider: 'Hostinger',
      plan: 'VPS 2',
      region: 'us-east',
      server_os: 'Ubuntu 22.04',
      cpu: '2 vCPU',
      ram: '4 GB',
      disk: '80 GB',
      ssh_host: '127.0.0.1',
      ssh_user: 'deploy',
      notes: 'Servidor inicial',
    },
    stack: 'node',
    apps: {
      backend: 'backend-api',
      frontend_public: 'frontend-public',
      frontend_admin: 'frontend-admin',
    },
    service_modes: {
      backend_api: 'neutral',
      frontend_public: 'neutral',
      frontend_admin: 'neutral',
    },
  }, { spaces: 2 })
  await fs.writeJson(path.join(tempDir, '.business', 'changelog.json'), { changelog: [] }, { spaces: 2 })
  await fs.writeFile(path.join(tempDir, '.business', 'changelog.md'), '# Changelog\n\n<!-- Nuevas entradas ARRIBA de esta línea -->\n')
}

async function withTempProject(run) {
  const originalCwd = process.cwd()
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wodlie-engine-'))

  try {
    await seedProject(tempDir)
    process.chdir(tempDir)
    await run(tempDir)
  } finally {
    process.chdir(originalCwd)
    await fs.remove(tempDir)
  }
}

async function testBusinessFlow() {
  await withTempProject(async (tempDir) => {
    await businessEpicCreateCommand('Pagos', { description: 'Cobros y conciliación.' })
    await businessStoryCreateCommand('EP-001', 'Cobrar una orden', {
      as: 'operador',
      want: 'registrar un cobro',
      soThat: 'la caja quede conciliada',
      priority: 'alta',
    })
    await devStoryCompleteCommand('US-001')

    const businessModel = await fs.readJson(path.join(tempDir, '.wodlie-config', 'business.json'))
    assert.equal(businessModel.epics.length, 1)
    assert.equal(businessModel.epics[0].status, 'completed')
    assert.equal(businessModel.epics[0].stories[0].status, 'completed')

    const overview = await fs.readFile(path.join(tempDir, '.business', 'requirements', 'overview.md'), 'utf-8')
    assert.match(overview, /EP-001/)
    assert.match(overview, /US-001/)

    const events = await fs.readFile(path.join(tempDir, '.wodlie-config', 'events.jsonl'), 'utf-8')
    assert.match(events, /dev.use_case.completed/)
    assert.match(events, /business.story.completed/)
  })
}

async function testReportDraft() {
  await withTempProject(async (tempDir) => {
    await businessEpicCreateCommand('Agenda', { description: 'Gestión de turnos.' })
    await businessStoryCreateCommand('EP-001', 'Reservar un turno', {
      as: 'cliente',
      want: 'reservar un turno',
      soThat: 'pueda asistir sin llamar',
    })
    await devStoryCompleteCommand('US-001')
    await reportDraftCommand()

    const reportPath = path.join(tempDir, '.business', 'reports', 'internal', `${getWeekId()}.md`)
    const report = await fs.readFile(reportPath, 'utf-8')
    assert.match(report, /US-001/)
    assert.match(report, /Historias completadas/)
  })
}

async function testInfraSync() {
  await withTempProject(async (tempDir) => {
    const projectConfig = await fs.readJson(path.join(tempDir, '.wodlie-config', 'project.json'))
    await infraSyncArtifacts(projectConfig)

    const infraReadme = await fs.readFile(path.join(tempDir, '.infra', 'README.md'), 'utf-8')
    const vpsReadme = await fs.readFile(path.join(tempDir, '.infra', 'vps', 'README.md'), 'utf-8')
    const serviceOps = await fs.readFile(path.join(tempDir, '.infra', 'vps', 'service-ops.md'), 'utf-8')
    assert.match(infraReadme, /COMPOSE_PROFILES=redis/)
    assert.match(infraReadme, /backend-api/)
    assert.match(vpsReadme, /Hostinger/)
    assert.match(vpsReadme, /2 vCPU/)
    assert.match(vpsReadme, /demo.com/)
    assert.match(serviceOps, /Postgres, Redis o MinIO/)
  })
}

await testBusinessFlow()
await testReportDraft()
await testInfraSync()
console.log('Tests passed')
