import fs from 'node:fs/promises'
import path from 'node:path'
import {
  composeFiles,
  envCatalogFile,
  envDir,
  legacyPublishEnvFiles,
  rootDir,
  services,
  stackEnvFiles,
  stateDir,
  testExposeEnvFiles,
  testStateFile,
} from './lib/config.mjs'
import { ensureFileFromExample, extractEnvKeys, parseEnvContent } from './lib/env-files.mjs'
import { runCommand } from './lib/shell.mjs'
import { bold, cyan, dim, fail, gray, green, header, info, ok, red, tag, warn, yellow } from './lib/colors.mjs'

const envReferencePattern = /\bprocess\.env\.([A-Z0-9_]+)/g
const ignoredReferencedEnvKeys = new Set(['CI'])
const projectConfigFile = path.join(rootDir, '.wodlie-config', 'project.json')

function printUsage() {
  console.log(`Uso:
  npm run dev:up
  npm run dev:down
  npm run dev:logs -- [service]
  npm run dev:shell <service>
  npm run test:up
  npm run test:down
  npm run test:logs -- [service]
  npm run test:shell <service>
  npm run test:expose
  npm run test:close
  npm run env:sync
  npm run env:check
  npm run infra:status
  npm run infra:ports`)
}

function getStackConfig(stackName) {
  if (!stackEnvFiles[stackName]) {
    throw new Error(`Entorno desconocido: ${stackName}`)
  }

  return stackEnvFiles[stackName]
}

async function readEnvFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8')
  return parseEnvContent(content)
}

async function readProjectConfig() {
  try {
    const content = await fs.readFile(projectConfigFile, 'utf8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function ensureStackEnvFile(stackName) {
  const stackConfig = getStackConfig(stackName)
  const syncResult = await ensureFileFromExample({
    examplePath: stackConfig.example,
    targetPath: stackConfig.actual,
  })

  if (syncResult.created) {
    console.log(`  ${ok(gray(path.relative(rootDir, stackConfig.actual)))} ${dim('creado desde example')}`)
  } else if (syncResult.updated) {
    console.log(`  ${ok(gray(path.relative(rootDir, stackConfig.actual)))} ${dim(`actualizado +${syncResult.addedKeys.length}`)}`)
  }

  return stackConfig.actual
}

async function ensureTestExposeEnvFile() {
  try {
    await fs.access(testExposeEnvFiles.actual)
    return testExposeEnvFiles.actual
  } catch {}

  try {
    await fs.access(legacyPublishEnvFiles.actual)
    const legacyContent = await fs.readFile(legacyPublishEnvFiles.actual, 'utf8')
    await fs.mkdir(path.dirname(testExposeEnvFiles.actual), { recursive: true })
    await fs.writeFile(testExposeEnvFiles.actual, legacyContent, 'utf8')
    console.log(`  ${ok(dim('migrado'))} ${gray(path.relative(rootDir, legacyPublishEnvFiles.actual))} ${dim('→')} ${gray(path.relative(rootDir, testExposeEnvFiles.actual))}`)
    return testExposeEnvFiles.actual
  } catch {}

  const syncResult = await ensureFileFromExample({
    examplePath: testExposeEnvFiles.example,
    targetPath: testExposeEnvFiles.actual,
  })

  if (syncResult.created) {
    console.log(`  ${ok(gray(path.relative(rootDir, testExposeEnvFiles.actual)))} ${dim('creado desde example')}`)
  } else if (syncResult.updated) {
    console.log(`  ${ok(gray(path.relative(rootDir, testExposeEnvFiles.actual)))} ${dim(`actualizado +${syncResult.addedKeys.length}`)}`)
  }

  return testExposeEnvFiles.actual
}

function buildManagedEnvOverrides(stackValuesByEnvironment) {
  const buildBackendOverrides = (values) => ({
    NODE_ENV: values.BACKEND_RUNTIME_NODE_ENV,
    PORT: values.BACKEND_CONTAINER_PORT,
    HOST: values.BACKEND_RUNTIME_HOST,
    LOG_LEVEL: values.BACKEND_RUNTIME_LOG_LEVEL,
    JWT_SECRET: values.BACKEND_RUNTIME_JWT_SECRET,
    DATABASE_URL: values.BACKEND_RUNTIME_DATABASE_URL,
    DB_HOST: values.BACKEND_RUNTIME_DB_HOST,
    DB_PORT: values.BACKEND_RUNTIME_DB_PORT,
    DB_NAME: values.BACKEND_RUNTIME_DB_NAME,
    DB_USER: values.BACKEND_RUNTIME_DB_USER,
    DB_PASSWORD: values.BACKEND_RUNTIME_DB_PASSWORD,
    REDIS_URL: values.BACKEND_RUNTIME_REDIS_URL,
    MINIO_ENDPOINT: values.BACKEND_RUNTIME_MINIO_ENDPOINT,
    MINIO_ROOT_USER: values.MINIO_ROOT_USER,
    MINIO_ROOT_PASSWORD: values.MINIO_ROOT_PASSWORD,
    MINIO_BUCKET: values.BACKEND_RUNTIME_MINIO_BUCKET,
    MINIO_PUBLIC_URL: values.BACKEND_RUNTIME_MINIO_PUBLIC_URL,
    ALLOWED_ORIGINS: values.BACKEND_RUNTIME_ALLOWED_ORIGINS,
  })

  const buildFrontendPublicOverrides = (values) => ({
    NEXT_PUBLIC_APP_NAME: values.FRONTEND_PUBLIC_RUNTIME_APP_NAME,
    NEXT_PUBLIC_APP_URL: values.FRONTEND_PUBLIC_RUNTIME_APP_URL,
    NEXT_PUBLIC_API_URL: values.FRONTEND_PUBLIC_RUNTIME_API_URL,
    NEXT_PUBLIC_COOKIE_DOMAIN: values.FRONTEND_PUBLIC_RUNTIME_COOKIE_DOMAIN,
    NEXTAUTH_URL: values.FRONTEND_PUBLIC_RUNTIME_NEXTAUTH_URL,
    NEXTAUTH_SECRET: values.FRONTEND_PUBLIC_RUNTIME_NEXTAUTH_SECRET,
    MINIO_PUBLIC_URL: values.FRONTEND_PUBLIC_RUNTIME_MINIO_PUBLIC_URL,
    PLAYWRIGHT_BASE_URL: values.FRONTEND_PUBLIC_RUNTIME_PLAYWRIGHT_BASE_URL,
  })

  const buildFrontendAdminOverrides = (values) => ({
    NEXT_PUBLIC_APP_NAME: values.FRONTEND_ADMIN_RUNTIME_APP_NAME,
    NEXT_PUBLIC_API_URL: values.FRONTEND_ADMIN_RUNTIME_API_URL,
    NEXT_PUBLIC_APP_URL: values.FRONTEND_ADMIN_RUNTIME_APP_URL,
    NEXT_PUBLIC_COOKIE_DOMAIN: values.FRONTEND_ADMIN_RUNTIME_COOKIE_DOMAIN,
    MINIO_PUBLIC_URL: values.FRONTEND_ADMIN_RUNTIME_MINIO_PUBLIC_URL,
    NEXT_PUBLIC_REALTIME_ADAPTER: values.FRONTEND_ADMIN_RUNTIME_REALTIME_ADAPTER,
    NEXT_PUBLIC_REALTIME_URL: values.FRONTEND_ADMIN_RUNTIME_REALTIME_URL,
    NEXT_PUBLIC_POLLING_INTERVAL: values.FRONTEND_ADMIN_RUNTIME_POLLING_INTERVAL,
    PLAYWRIGHT_BASE_URL: values.FRONTEND_ADMIN_RUNTIME_PLAYWRIGHT_BASE_URL,
  })

  return {
    'backend-api': {
      development: buildBackendOverrides(stackValuesByEnvironment.development),
      test: buildBackendOverrides(stackValuesByEnvironment.test),
    },
    'frontend-public': {
      development: buildFrontendPublicOverrides(stackValuesByEnvironment.development),
      test: buildFrontendPublicOverrides(stackValuesByEnvironment.test),
    },
    'frontend-admin': {
      development: buildFrontendAdminOverrides(stackValuesByEnvironment.development),
      test: buildFrontendAdminOverrides(stackValuesByEnvironment.test),
    },
  }
}

async function syncEnvFiles() {
  console.log(header('env sync'))
  console.log('')

  const catalog = {
    generated_at: new Date().toISOString(),
    services: {},
  }

  for (const stackName of ['dev', 'test']) {
    await ensureStackEnvFile(stackName)
  }

  await ensureTestExposeEnvFile()

  const stackValuesByEnvironment = {
    development: await readEnvFile(stackEnvFiles.dev.actual),
    test: await readEnvFile(stackEnvFiles.test.actual),
  }
  const managedEnvOverrides = buildManagedEnvOverrides(stackValuesByEnvironment)

  const statusLabel = (result) => {
    if (result.created) return green('created')
    if (result.updated) return yellow(`updated +${result.addedKeys.length}`)
    return dim('ok')
  }

  for (const service of services) {
    const exampleContent = await fs.readFile(service.exampleEnvFile, 'utf8')
    const exampleKeys = extractEnvKeys(exampleContent)

    const devResult = await ensureFileFromExample({
      examplePath: service.exampleEnvFile,
      targetPath: service.devEnvFile,
      overrides: managedEnvOverrides[service.id]?.development,
    })

    const testResult = await ensureFileFromExample({
      examplePath: service.exampleEnvFile,
      targetPath: service.testEnvFile,
      overrides: managedEnvOverrides[service.id]?.test,
    })

    catalog.services[service.id] = {
      example_file: path.relative(rootDir, service.exampleEnvFile),
      development_file: path.relative(rootDir, service.devEnvFile),
      test_file: path.relative(rootDir, service.testEnvFile),
      keys: exampleKeys,
    }

    const label = service.label.padEnd(18)
    console.log(`  ${tag(service.id)} ${gray(label)}  dev ${statusLabel(devResult)}  ·  test ${statusLabel(testResult)}`)
  }

  await fs.mkdir(path.dirname(envCatalogFile), { recursive: true })

  let catalogChanged = true
  try {
    const existing = JSON.parse(await fs.readFile(envCatalogFile, 'utf8'))
    catalogChanged = JSON.stringify(existing.services) !== JSON.stringify(catalog.services)
  } catch {}

  if (catalogChanged) {
    await fs.writeFile(envCatalogFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
    console.log(`\n  ${dim('catálogo')} ${gray(path.relative(rootDir, envCatalogFile))} ${green('actualizado')}`)
  } else {
    console.log(`\n  ${dim('catálogo')} ${gray(path.relative(rootDir, envCatalogFile))} ${dim('sin cambios')}`)
  }
}

async function collectFilesRecursively(targetDir, acceptedExtensions) {
  const files = []
  const entries = await fs.readdir(targetDir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(targetDir, entry.name)

    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'coverage', 'playwright-report', 'test-results'].includes(entry.name)) {
        continue
      }

      files.push(...await collectFilesRecursively(fullPath, acceptedExtensions))
      continue
    }

    if (acceptedExtensions.includes(path.extname(entry.name))) {
      files.push(fullPath)
    }
  }

  return files
}

async function checkEnvFiles(strictMode) {
  const failures = []

  for (const service of services) {
    const exampleContent = await fs.readFile(service.exampleEnvFile, 'utf8')
    const exampleKeys = new Set(extractEnvKeys(exampleContent))

    for (const targetFile of [service.devEnvFile, service.testEnvFile]) {
      try {
        const targetContent = await fs.readFile(targetFile, 'utf8')
        const targetKeys = new Set(extractEnvKeys(targetContent))
        const missingKeys = [...exampleKeys].filter((key) => !targetKeys.has(key))

        if (missingKeys.length > 0) {
          failures.push({
            scope: path.relative(rootDir, targetFile),
            message: `faltan claves: ${missingKeys.join(', ')}`,
          })
        }
      } catch {
        failures.push({
          scope: path.relative(rootDir, targetFile),
          message: 'archivo ausente; ejecuta npm run env:sync',
        })
      }
    }

    const files = await collectFilesRecursively(service.codeDir, ['.ts', '.tsx', '.js', '.mjs'])
    const referencedKeys = new Set()

    for (const file of files) {
      const content = await fs.readFile(file, 'utf8')

      for (const match of content.matchAll(envReferencePattern)) {
        referencedKeys.add(match[1])
      }
    }

    const undocumentedKeys = [...referencedKeys].filter(
      (key) => !exampleKeys.has(key) && !ignoredReferencedEnvKeys.has(key),
    )
    if (undocumentedKeys.length > 0) {
      failures.push({
        scope: service.id,
        message: `variables usadas en código pero no documentadas en .env.example: ${undocumentedKeys.join(', ')}`,
      })
    }
  }

  if (failures.length === 0) {
    console.log(ok(bold('env sincronizado') + gray(' — examples, .env.development y .env.test OK')))
    return
  }

  console.error(fail(bold('Inconsistencias detectadas:')))
  for (const failure of failures) {
    console.error(`  ${red('✗')} ${cyan(failure.scope)}  ${gray(failure.message)}`)
  }

  if (strictMode) {
    process.exit(1)
  }
}

function modeKeyFromServiceId(serviceId) {
  switch (serviceId) {
    case 'backend-api':
      return 'backend_api'
    case 'frontend-public':
      return 'frontend_public'
    case 'frontend-admin':
      return 'frontend_admin'
    default:
      return null
  }
}

function requiredRuntimeFilesForStack(stackName) {
  if (stackName === 'dev') {
    return ['.env.example', 'package.json']
  }

  return ['.env.example', 'package.json', 'Dockerfile']
}

async function collectRuntimeGaps(stackName) {
  const projectConfig = await readProjectConfig()
  const requiredFiles = requiredRuntimeFilesForStack(stackName)
  const gaps = []

  for (const service of services) {
    const missing = []

    for (const relativeFile of requiredFiles) {
      try {
        await fs.access(path.join(service.dir, relativeFile))
      } catch {
        missing.push(relativeFile)
      }
    }

    if (missing.length > 0) {
      const modeKey = modeKeyFromServiceId(service.id)
      gaps.push({
        serviceId: service.id,
        label: service.label,
        mode: modeKey ? projectConfig?.service_modes?.[modeKey] ?? 'desconocido' : 'desconocido',
        missing,
      })
    }
  }

  return gaps
}

function renderRuntimeGapMessage(stackName, gaps) {
  const lines = [
    `El stack ${stackName} no está listo para levantarse con el compose preconfigurado.`,
    '',
    'Faltan artefactos runnable por servicio:',
  ]

  for (const gap of gaps) {
    const modeLabel = gap.mode === 'neutral' ? 'modo neutral' : `modo ${gap.mode}`
    lines.push(`- ${gap.serviceId} (${modeLabel}) → ${gap.missing.join(', ')}`)
  }

  lines.push('')
  lines.push('Opciones:')
  lines.push('- usar presets runnable (`backend-api=fastify`, `frontend-public=nextjs`, `frontend-admin=nextjs`) si querés el stack Docker tal como viene')
  lines.push('- o completar manualmente `.dev/src/<service>` y adaptar `.infra/docker/*` + `.infra/env/*` a tu stack real')
  lines.push('- si ya personalizaste el stack conscientemente, podés saltear este guard con `WODLIE_STACK_ALLOW_CUSTOM=1`')

  return lines.join('\n')
}

async function assertStackRuntimeReady(stackName) {
  if (process.env.WODLIE_STACK_ALLOW_CUSTOM === '1') {
    return
  }

  const gaps = await collectRuntimeGaps(stackName)
  if (gaps.length > 0) {
    throw new Error(renderRuntimeGapMessage(stackName, gaps))
  }
}

function imageSlug(name) {
  return String(name ?? 'project')
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'project'
}

async function runDockerCompose(stackName, composeArgs, options = {}) {
  const stackEnvFile = await ensureStackEnvFile(stackName)
  const envFromFile = await readEnvFile(stackEnvFile)
  const composeProject = `${envFromFile.PROJECT_NAME ?? 'project'}-${envFromFile.COMPOSE_STACK_NAME ?? stackName}`

  const args = [
    'compose',
    '--project-name',
    composeProject,
    '--env-file',
    stackEnvFile,
    '-f',
    composeFiles.base,
    '-f',
    composeFiles[stackName],
    ...composeArgs,
  ]

  await runCommand('docker', args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...options.env,
    },
  })
}

async function writeTestState(payload) {
  await fs.mkdir(stateDir, { recursive: true })
  await fs.writeFile(testStateFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function handleStackAction(stackName, action, extraArgs) {
  await syncEnvFiles()

  switch (action) {
    case 'up':
      await assertStackRuntimeReady(stackName)
      console.log(header(`${bold(stackName)} — levantando stack`))
      await runDockerCompose(stackName, ['up', '-d', '--build', '--remove-orphans'])
      break
    case 'down':
      console.log(header(`${bold(stackName)} — bajando stack`))
      if (stackName === 'test') {
        try {
          await runTestExposeCommand('down')
        } catch (error) {
          console.warn(`  ${warn('expose')} No se pudo cerrar test antes del shutdown: ${gray(error.message)}`)
        }
      }

      await runDockerCompose(stackName, ['down', '--remove-orphans'])
      console.log(`\n  ${ok('stack detenido')}`)
      break
    case 'restart':
      await assertStackRuntimeReady(stackName)
      console.log(header(`${bold(stackName)} — reiniciando stack`))
      await runDockerCompose(stackName, ['down', '--remove-orphans'])
      await runDockerCompose(stackName, ['up', '-d', '--build', '--remove-orphans'])
      break
    case 'logs':
      console.log(header(`${bold(stackName)} — logs ${extraArgs.length ? cyan(extraArgs.join(' ')) : 'todos los servicios'}`))
      await printStackSummary(stackName)
      await runDockerCompose(stackName, ['logs', '-f', ...extraArgs])
      break
    case 'shell': {
      const service = extraArgs[0]
      if (!service) throw new Error(`Uso: npm run ${stackName}:shell <servicio>\n  Servicios disponibles: backend-api, frontend-public, frontend-admin, postgres, redis, minio`)
      const cmd = extraArgs.length > 1 ? extraArgs.slice(1) : ['sh']
      console.log(header(`${bold(stackName)} — shell ${cyan(service)}`))
      await runDockerCompose(stackName, ['exec', service, ...cmd])
      break
    }
    case 'deploy-ghcr': {
      await assertStackRuntimeReady('test')
      const imageTag = readOption(extraArgs, '--image-tag')
      const gitSha = readOption(extraArgs, '--git-sha') ?? process.env.GITHUB_SHA ?? ''
      const namespace = (readOption(extraArgs, '--namespace') ?? process.env.GHCR_NAMESPACE ?? '').toLowerCase()

      if (!imageTag) {
        throw new Error('Falta --image-tag para test deploy-ghcr')
      }

      if (!namespace) {
        throw new Error('Falta --namespace o GHCR_NAMESPACE para test deploy-ghcr')
      }

      const stackEnvFile = await ensureStackEnvFile('test')
      const stackEnv = await readEnvFile(stackEnvFile)
      const tempEnvFile = path.join(envDir, '.tmp.stack.test.env')
      const projectName = imageSlug(stackEnv.PROJECT_NAME)

      const mergedEnv = {
        ...stackEnv,
        BACKEND_IMAGE: `ghcr.io/${namespace}/${projectName}-backend-api:${imageTag}`,
        FRONTEND_PUBLIC_IMAGE: `ghcr.io/${namespace}/${projectName}-frontend-public:${imageTag}`,
        FRONTEND_ADMIN_IMAGE: `ghcr.io/${namespace}/${projectName}-frontend-admin:${imageTag}`,
      }

      await fs.writeFile(
        tempEnvFile,
        `${Object.entries(mergedEnv)
          .map(([key, value]) => `${key}=${value}`)
          .join('\n')}\n`,
        'utf8',
      )

      try {
        const composeProject = `${mergedEnv.PROJECT_NAME}-${mergedEnv.COMPOSE_STACK_NAME}`
        const baseArgs = [
          'compose',
          '--project-name',
          composeProject,
          '--env-file',
          tempEnvFile,
          '-f',
          composeFiles.base,
          '-f',
          composeFiles.test,
        ]

        await runCommand('docker', [...baseArgs, 'pull'], { cwd: rootDir })
        await runCommand('docker', [...baseArgs, 'up', '-d', '--remove-orphans'], { cwd: rootDir })
      } finally {
        await fs.rm(tempEnvFile, { force: true })
      }

      await writeTestState({
        updated_at: new Date().toISOString(),
        last_successful_commit: gitSha || null,
        last_image_tag: imageTag,
        ghcr_namespace: namespace,
      })

      console.log(`[test] Stack actualizado desde GHCR con tag ${imageTag}`)
      break
    }
    case 'expose':
    case 'publish':
      await runTestExposeCommand('up')
      break
    case 'close':
    case 'unpublish':
      await runTestExposeCommand('down')
      break
    case 'mark-success': {
      const gitSha = readOption(extraArgs, '--git-sha') ?? process.env.GITHUB_SHA ?? ''
      const imageTag = readOption(extraArgs, '--image-tag') ?? 'local-build'

      if (!gitSha) {
        throw new Error('Falta --git-sha para registrar un test exitoso')
      }

      await writeTestState({
        updated_at: new Date().toISOString(),
        last_successful_commit: gitSha,
        last_image_tag: imageTag,
        source: 'local-test',
      })

      console.log(`[test] Estado exitoso registrado para ${gitSha}`)
      break
    }
    default:
      throw new Error(`Acción no soportada para ${stackName}: ${action}`)
  }

  if (['up', 'restart', 'deploy-ghcr'].includes(action)) {
    await printStackSummary(stackName)
  }
}

async function printStackSummary(stackName) {
  const stackEnv = await readEnvFile(await ensureStackEnvFile(stackName))
  const profiles = (stackEnv.COMPOSE_PROFILES ?? '').split(',').map((p) => p.trim()).filter(Boolean)
  const hasRedis = profiles.includes('redis')
  const hasMinio = profiles.includes('minio')

  console.log(header(`stack ${bold(stackName)} listo`))
  console.log('')
  console.log(`  ${tag('backend-api')}      ${info(stackEnv.BACKEND_PUBLIC_URL)}`)
  console.log(`  ${tag('frontend-public')}  ${info(stackEnv.FRONTEND_PUBLIC_APP_URL)}`)
  console.log(`  ${tag('frontend-admin')}   ${info(stackEnv.FRONTEND_ADMIN_APP_URL)}`)
  console.log('')
  console.log(`  ${tag('postgres')}         ${dim('localhost:' + stackEnv.POSTGRES_PORT)}`)

  if (hasRedis) {
    console.log(`  ${tag('redis')}           ${dim('localhost:' + stackEnv.REDIS_PORT)}`)
  } else {
    console.log(`  ${tag('redis')}           ${gray('inactivo')}  ${dim('→ COMPOSE_PROFILES=redis para activar')}`)
  }

  if (hasMinio) {
    console.log(`  ${tag('minio')}           ${dim('localhost:' + stackEnv.MINIO_API_PORT)}  ${gray('ui →')} ${dim('localhost:' + stackEnv.MINIO_CONSOLE_PORT)}`)
  } else {
    console.log(`  ${tag('minio')}           ${gray('inactivo')}  ${dim('→ COMPOSE_PROFILES=minio para activar')}`)
  }

  console.log('')
}

function readFallbackEnvValue(values, primaryKey, legacyKey) {
  const primaryValue = values[primaryKey]
  const legacyValue = legacyKey ? values[legacyKey] : undefined

  if (typeof primaryValue !== 'undefined' && primaryValue !== '') {
    return primaryValue
  }

  if (typeof legacyValue !== 'undefined' && legacyValue !== '') {
    return legacyValue
  }

  return primaryValue ?? legacyValue
}

async function runTestExposeCommand(mode) {
  const testExposeEnvFile = await ensureTestExposeEnvFile()
  const testExposeEnv = await readEnvFile(testExposeEnvFile)

  if ((readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_STRATEGY', 'TEST_PUBLISH_STRATEGY') ?? 'ssh-command') !== 'ssh-command') {
    throw new Error('Solo está implementada la estrategia ssh-command')
  }

  const host = readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_SSH_HOST', 'TEST_PUBLISH_SSH_HOST')
  const user = readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_SSH_USER', 'TEST_PUBLISH_SSH_USER')
  const port = readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_SSH_PORT', 'TEST_PUBLISH_SSH_PORT') ?? '22'
  const command = mode === 'up'
    ? readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_REMOTE_UP_COMMAND', 'TEST_PUBLISH_REMOTE_UP_COMMAND')
    : readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_REMOTE_DOWN_COMMAND', 'TEST_PUBLISH_REMOTE_DOWN_COMMAND')

  if (!host || !user || !command) {
    throw new Error(
      'Completa TEST_EXPOSE_SSH_HOST, TEST_EXPOSE_SSH_USER y los comandos remotos en .infra/env/test-expose.env',
    )
  }

  await runCommand('ssh', ['-p', port, `${user}@${host}`, command], { cwd: rootDir })

  if (mode === 'up') {
    console.log(header('test expuesto'))
    console.log('')
    console.log(`  ${tag('frontend-public')}  ${info(readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_PUBLIC_URL', 'TEST_PUBLIC_URL'))}`)
    console.log(`  ${tag('frontend-admin')}   ${info(readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_ADMIN_URL', 'TEST_ADMIN_URL'))}`)
    console.log(`  ${tag('backend-api')}      ${info(readFallbackEnvValue(testExposeEnv, 'TEST_EXPOSE_API_URL', 'TEST_API_URL'))}`)
    console.log('')
  } else {
    console.log(`\n  ${ok('test cerrado — rutas desactivadas')}`)
  }
}

function readOption(args, flagName) {
  const index = args.indexOf(flagName)

  if (index === -1) {
    return null
  }

  return args[index + 1] ?? null
}

async function runInfraStatus() {
  for (const stackName of ['dev', 'test']) {
    console.log(header(`estado — ${bold(stackName)}`))

    try {
      await runDockerCompose(stackName, ['ps'])
    } catch (error) {
      console.warn(`  ${warn('No disponible:')} ${gray(error.message)}`)
    }
  }
}

async function runInfraPorts() {
  for (const stackName of ['dev', 'test']) {
    const envFile = await ensureStackEnvFile(stackName)
    const values = await readEnvFile(envFile)
    const profiles = (values.COMPOSE_PROFILES ?? '').split(',').map((p) => p.trim()).filter(Boolean)
    const hasRedis = profiles.includes('redis')
    const hasMinio = profiles.includes('minio')

    const port = (p) => cyan(String(p))
    const inactive = gray('inactivo')

    console.log(header(`puertos — ${bold(stackName)}`))
    console.log(`  ${tag('backend-api')}      ${port(values.BACKEND_PORT)}`)
    console.log(`  ${tag('frontend-public')}  ${port(values.FRONTEND_PUBLIC_PORT)}`)
    console.log(`  ${tag('frontend-admin')}   ${port(values.FRONTEND_ADMIN_PORT)}`)
    console.log(`  ${tag('postgres')}         ${port(values.POSTGRES_PORT)}`)
    console.log(`  ${tag('redis')}            ${hasRedis ? port(values.REDIS_PORT) : inactive}`)
    console.log(`  ${tag('minio')}            ${hasMinio ? `api ${port(values.MINIO_API_PORT)}  ui ${port(values.MINIO_CONSOLE_PORT)}` : inactive}`)
    console.log('')
  }
}

async function main() {
  const [, , scope, action, ...rest] = process.argv

  if (!scope || !action) {
    printUsage()
    process.exit(1)
  }

  switch (scope) {
    case 'dev':
    case 'test':
      await handleStackAction(scope, action, rest)
      break
    case 'env':
      if (action === 'sync') {
        await syncEnvFiles()
        break
      }

      if (action === 'check') {
        await checkEnvFiles(rest.includes('--strict'))
        break
      }

      throw new Error(`Acción de env no soportada: ${action}`)
    case 'infra':
      if (action === 'status') {
        await runInfraStatus()
        break
      }

      if (action === 'ports') {
        await runInfraPorts()
        break
      }

      throw new Error(`Acción de infra no soportada: ${action}`)
    default:
      throw new Error(`Scope no soportado: ${scope}`)
  }
}

main().catch((error) => {
  console.error(`\n  ${fail(bold(error.message))}`)
  process.exit(1)
})
