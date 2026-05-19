import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  composeFiles,
  envCatalogFile,
  envDir,
  rootDir,
  services,
  stackEnvFiles,
  stateDir,
  testExposeEnvFiles,
  testStateFile,
} from './lib/config.mjs'
import { ensureFileFromExample, extractEnvKeys, parseEnvContent } from './lib/env-files.mjs'
import { runCommand } from './lib/shell.mjs'
import { bold, cyan, dim, divider, fail, gray, green, header, info, ok, red, tag, warn, yellow } from './lib/colors.mjs'

const envReferencePattern = /\bprocess\.env\.([A-Z0-9_]+)/g
const ignoredReferencedEnvKeys = new Set(['CI'])
const testExposeStateFile = path.join(stateDir, 'test-expose-state.json')
const testOpenStackEnvFile = path.join(envDir, '.tmp.stack.test.open.env')

function printUsage() {
  console.log(`Uso:
  npm run dev:up [-- <servicio>]
  npm run dev:down [-- <servicio>]
  npm run dev:logs [-- <servicio>]
  npm run dev:restart [-- <servicio>]
  npm run dev:shell -- <servicio>
  npm run test:up [-- <servicio>]
  npm run test:down [-- <servicio>]
  npm run test:logs [-- <servicio>]
  npm run test:restart [-- <servicio>]
  npm run test:shell -- <servicio>
  npm run test:open
  npm run test:expose  # publica el stack test por túnel
  npm run test:close
  npm run env:sync
  npm run env:check
  npm run infra:status
  npm run infra:ports

  Sin <servicio>: opera el stack completo.
  Con <servicio>: opera solo ese contenedor (backend-api, frontend-public, frontend-admin, postgres, redis, media-nginx).`)
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

async function ensureStackEnvFile(stackName) {
  const stackConfig = getStackConfig(stackName)
  const syncResult = await ensureFileFromExample({
    examplePath: stackConfig.example,
    targetPath: stackConfig.actual,
  })

  if (syncResult.created) {
    console.log(`  ${ok(gray(path.relative(rootDir, stackConfig.actual)))} ${dim('creado desde example')}`)
  } else if (syncResult.updated) {
    console.log(`  ${ok(gray(path.relative(rootDir, stackConfig.actual)))} ${dim(`actualizado +${syncResult.addedKeys.length}`)}`  )
  }

  return stackConfig.actual
}

async function ensureTestExposeEnvFile() {
  try {
    await fs.access(testExposeEnvFiles.actual)
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
    HTTP2_ENABLED: values.BACKEND_RUNTIME_HTTP2_ENABLED,
    LOG_LEVEL: values.BACKEND_RUNTIME_LOG_LEVEL,
    JWT_SECRET: values.BACKEND_RUNTIME_JWT_SECRET,
    DATABASE_URL: values.BACKEND_RUNTIME_DATABASE_URL,
    DB_HOST: values.BACKEND_RUNTIME_DB_HOST,
    DB_PORT: values.BACKEND_RUNTIME_DB_PORT,
    DB_NAME: values.BACKEND_RUNTIME_DB_NAME,
    DB_USER: values.BACKEND_RUNTIME_DB_USER,
    DB_PASSWORD: values.BACKEND_RUNTIME_DB_PASSWORD,
    REDIS_URL: values.BACKEND_RUNTIME_REDIS_URL,
    MEDIA_STORAGE_DIR: values.BACKEND_RUNTIME_MEDIA_STORAGE_DIR,
    MEDIA_PUBLIC_URL: values.BACKEND_RUNTIME_MEDIA_PUBLIC_URL,
    MEDIA_MAX_IMAGE_WIDTH: values.BACKEND_RUNTIME_MEDIA_MAX_IMAGE_WIDTH,
    MEDIA_IMAGE_QUALITY: values.BACKEND_RUNTIME_MEDIA_IMAGE_QUALITY,
    ALLOWED_ORIGINS: values.BACKEND_RUNTIME_ALLOWED_ORIGINS,
  })

  const buildFrontendPublicOverrides = (values) => ({
    NEXT_PUBLIC_APP_NAME: values.FRONTEND_PUBLIC_RUNTIME_APP_NAME,
    NEXT_PUBLIC_APP_URL: values.FRONTEND_PUBLIC_RUNTIME_APP_URL,
    NEXT_PUBLIC_ADMIN_URL: values.FRONTEND_PUBLIC_RUNTIME_ADMIN_URL,
    NEXT_PUBLIC_EXTERNAL_API_URL: values.FRONTEND_PUBLIC_RUNTIME_EXTERNAL_API_URL,
    INTERNAL_API_URL: values.FRONTEND_PUBLIC_RUNTIME_INTERNAL_API_URL,
    NEXT_PUBLIC_COOKIE_DOMAIN: values.FRONTEND_PUBLIC_RUNTIME_COOKIE_DOMAIN,
    NEXTAUTH_URL: values.FRONTEND_PUBLIC_RUNTIME_NEXTAUTH_URL,
    NEXTAUTH_SECRET: values.FRONTEND_PUBLIC_RUNTIME_NEXTAUTH_SECRET,
    MEDIA_PUBLIC_URL: values.FRONTEND_PUBLIC_RUNTIME_MEDIA_PUBLIC_URL,
    PLAYWRIGHT_BASE_URL: values.FRONTEND_PUBLIC_RUNTIME_PLAYWRIGHT_BASE_URL,
  })

  const buildFrontendAdminOverrides = (values) => ({
    NEXT_PUBLIC_APP_NAME: values.FRONTEND_ADMIN_RUNTIME_APP_NAME,
    NEXT_PUBLIC_EXTERNAL_API_URL: values.FRONTEND_ADMIN_RUNTIME_EXTERNAL_API_URL,
    INTERNAL_API_URL: values.FRONTEND_ADMIN_RUNTIME_INTERNAL_API_URL,
    NEXT_PUBLIC_APP_URL: values.FRONTEND_ADMIN_RUNTIME_APP_URL,
    NEXT_PUBLIC_COOKIE_DOMAIN: values.FRONTEND_ADMIN_RUNTIME_COOKIE_DOMAIN,
    MEDIA_PUBLIC_URL: values.FRONTEND_ADMIN_RUNTIME_MEDIA_PUBLIC_URL,
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
    console.log(`\n  ${dim('catalogo')} ${gray(path.relative(rootDir, envCatalogFile))} ${green('actualizado')}`)
  } else {
    console.log(`\n  ${dim('catalogo')} ${gray(path.relative(rootDir, envCatalogFile))} ${dim('sin cambios')}`)
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

async function runDockerCompose(stackName, composeArgs, options = {}) {
  const stackEnvFile = await ensureStackEnvFile(stackName)
  const envFromFile = await readEnvFile(stackEnvFile)
  await runDockerComposeWithEnvFile(stackName, stackEnvFile, envFromFile, composeArgs, options)
}

async function runDockerComposeWithEnvFile(stackName, stackEnvFile, envFromFile, composeArgs, options = {}) {
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

function serializeEnv(values) {
  return `${Object.entries(values)
    .map(([key, value]) => `${key}=${value ?? ''}`)
    .join('\n')}\n`
}

async function writeTestState(payload) {
  await fs.mkdir(stateDir, { recursive: true })
  await fs.writeFile(testStateFile, `${JSON.stringify(payload, null, 2)}\n`, 'utf8')
}

async function handleStackAction(stackName, action, extraArgs) {
  await syncEnvFiles()

  switch (action) {
    case 'up': {
      const service = extraArgs[0]
      console.log(header(`${bold(stackName)} — levantando ${service ? tag(service) : 'stack completo'}`))
      const upArgs = service
        ? ['up', '-d', '--build', service]
        : ['up', '-d', '--build', '--remove-orphans']
      await runDockerCompose(stackName, upArgs)
      break
    }
    case 'down': {
      const service = extraArgs[0]
      if (service) {
        console.log(header(`${bold(stackName)} — deteniendo ${tag(service)}`))
        await runDockerCompose(stackName, ['stop', service])
        await runDockerCompose(stackName, ['rm', '-f', service])
        console.log(`\n  ${ok(`${service} detenido`)}`)
      } else {
        console.log(header(`${bold(stackName)} — bajando stack completo`))
        if (stackName === 'test') {
          try {
            await runTestCloseCommand({ optional: true })
          } catch (error) {
            console.warn(`  ${warn('expose')} No se pudo cerrar test antes del shutdown: ${gray(error.message)}`)
          }
        }
        await runDockerCompose(stackName, ['down', '--remove-orphans'])
        console.log(`\n  ${ok('stack detenido')}`)
      }
      break
    }
    case 'restart': {
      const service = extraArgs[0]
      if (service) {
        console.log(header(`${bold(stackName)} — reiniciando ${tag(service)}`))
        await runDockerCompose(stackName, ['stop', service])
        await runDockerCompose(stackName, ['rm', '-f', service])
        await runDockerCompose(stackName, ['up', '-d', '--build', service])
      } else {
        console.log(header(`${bold(stackName)} — reiniciando stack completo`))
        await runDockerCompose(stackName, ['down', '--remove-orphans'])
        await runDockerCompose(stackName, ['up', '-d', '--build', '--remove-orphans'])
      }
      break
    }
    case 'logs':
      console.log(header(`${bold(stackName)} — logs ${extraArgs.length ? tag(extraArgs[0]) : 'todos los servicios'}`))
      await printStackSummary(stackName)
      await runDockerCompose(stackName, ['logs', '-f', ...extraArgs])
      break
    case 'shell': {
      const service = extraArgs[0]
      if (!service) throw new Error(`Uso: npm run ${stackName}:shell <servicio>\n  Servicios disponibles: backend-api, frontend-public, frontend-admin, postgres, redis, media-nginx`)
      const cmd = extraArgs.length > 1 ? extraArgs.slice(1) : ['sh']
      console.log(header(`${bold(stackName)} — shell ${cyan(service)}`))
      await runDockerCompose(stackName, ['exec', service, ...cmd])
      break
    }
    case 'deploy-ghcr': {
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

      const mergedEnv = {
        ...stackEnv,
        BACKEND_IMAGE: `ghcr.io/${namespace}/{{PROJECT_NAME}}-backend-api:${imageTag}`,
        FRONTEND_PUBLIC_IMAGE: `ghcr.io/${namespace}/{{PROJECT_NAME}}-frontend-public:${imageTag}`,
        FRONTEND_ADMIN_IMAGE: `ghcr.io/${namespace}/{{PROJECT_NAME}}-frontend-admin:${imageTag}`,
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
    case 'open':
    case 'expose':
    case 'publish':
      await runTestOpenCommand()
      break
    case 'close':
    case 'unpublish':
      await runTestCloseCommand({ optional: true })
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

  console.log(`  ${tag('media-nginx')}     ${dim('localhost:' + stackEnv.MEDIA_PORT)}  ${gray('uploads →')} ${dim(stackEnv.MEDIA_PUBLIC_URL)}`)

  console.log('')
}

function requireExposeValue(values, key) {
  const value = values[key]

  if (typeof value === 'undefined' || value === '') {
    throw new Error(`Falta ${key} en .infra/env/test-expose.env`)
  }

  return value
}

function optionalExposeValue(values, key, fallback = '') {
  const value = values[key]
  return typeof value === 'undefined' || value === '' ? fallback : value
}

function assertHttpsUrl(value, key) {
  let url

  try {
    url = new URL(value)
  } catch {
    throw new Error(`${key} debe ser una URL valida`)
  }

  if (url.protocol !== 'https:') {
    throw new Error(`${key} debe usar https`)
  }

  return url
}

function deriveCookieDomain(publicUrl) {
  const host = new URL(publicUrl).hostname
  const labels = host.split('.')

  if (labels.length >= 4 && labels.at(-1) === 'ar' && labels.at(-2) === 'com') {
    return `.${labels.slice(-3).join('.')}`
  }

  if (labels.length >= 2) {
    return `.${labels.slice(-2).join('.')}`
  }

  return host
}

function buildPublicTestStackEnv(stackEnv, exposeEnv) {
  const publicUrl = requireExposeValue(exposeEnv, 'TEST_EXPOSE_PUBLIC_URL')
  const adminUrl = requireExposeValue(exposeEnv, 'TEST_EXPOSE_ADMIN_URL')
  const apiUrl = requireExposeValue(exposeEnv, 'TEST_EXPOSE_API_URL')
  const mediaUrl = requireExposeValue(exposeEnv, 'TEST_EXPOSE_MEDIA_URL')
  const cookieDomain = optionalExposeValue(exposeEnv, 'TEST_EXPOSE_COOKIE_DOMAIN', deriveCookieDomain(publicUrl))

  assertHttpsUrl(publicUrl, 'TEST_EXPOSE_PUBLIC_URL')
  assertHttpsUrl(adminUrl, 'TEST_EXPOSE_ADMIN_URL')
  assertHttpsUrl(apiUrl, 'TEST_EXPOSE_API_URL')
  assertHttpsUrl(mediaUrl, 'TEST_EXPOSE_MEDIA_URL')

  return {
    ...stackEnv,
    BACKEND_PUBLIC_URL: apiUrl,
    FRONTEND_PUBLIC_APP_URL: publicUrl,
    FRONTEND_ADMIN_APP_URL: adminUrl,
    MEDIA_PUBLIC_URL: `${mediaUrl}/uploads`,
    FRONTEND_PUBLIC_LOGIN_URL: publicUrl,
    COOKIE_DOMAIN: cookieDomain,
    ALLOWED_ORIGINS: `${publicUrl},${adminUrl}`,
    PLAYWRIGHT_PUBLIC_BASE_URL: publicUrl,
    PLAYWRIGHT_ADMIN_BASE_URL: adminUrl,
    BACKEND_RUNTIME_ALLOWED_ORIGINS: `${publicUrl},${adminUrl}`,
    BACKEND_RUNTIME_MEDIA_PUBLIC_URL: `${mediaUrl}/uploads`,
    FRONTEND_PUBLIC_RUNTIME_EXTERNAL_API_URL: apiUrl,
    FRONTEND_PUBLIC_RUNTIME_INTERNAL_API_URL: 'http://backend-api:3000',
    FRONTEND_PUBLIC_RUNTIME_APP_URL: publicUrl,
    FRONTEND_PUBLIC_RUNTIME_ADMIN_URL: adminUrl,
    FRONTEND_PUBLIC_RUNTIME_COOKIE_DOMAIN: cookieDomain,
    FRONTEND_PUBLIC_RUNTIME_NEXTAUTH_URL: publicUrl,
    FRONTEND_PUBLIC_RUNTIME_MEDIA_PUBLIC_URL: `${mediaUrl}/uploads`,
    FRONTEND_PUBLIC_RUNTIME_PLAYWRIGHT_BASE_URL: publicUrl,
    FRONTEND_ADMIN_RUNTIME_EXTERNAL_API_URL: apiUrl,
    FRONTEND_ADMIN_RUNTIME_INTERNAL_API_URL: 'http://backend-api:3000',
    FRONTEND_ADMIN_RUNTIME_APP_URL: adminUrl,
    FRONTEND_ADMIN_RUNTIME_COOKIE_DOMAIN: cookieDomain,
    FRONTEND_ADMIN_RUNTIME_MEDIA_PUBLIC_URL: `${mediaUrl}/uploads`,
    FRONTEND_ADMIN_RUNTIME_REALTIME_URL: apiUrl,
    FRONTEND_ADMIN_RUNTIME_PLAYWRIGHT_BASE_URL: adminUrl,
  }
}

function buildTraefikDynamicConfig(exposeEnv) {
  const publicUrl = assertHttpsUrl(requireExposeValue(exposeEnv, 'TEST_EXPOSE_PUBLIC_URL'), 'TEST_EXPOSE_PUBLIC_URL')
  const adminUrl = assertHttpsUrl(requireExposeValue(exposeEnv, 'TEST_EXPOSE_ADMIN_URL'), 'TEST_EXPOSE_ADMIN_URL')
  const apiUrl = assertHttpsUrl(requireExposeValue(exposeEnv, 'TEST_EXPOSE_API_URL'), 'TEST_EXPOSE_API_URL')
  const mediaUrl = assertHttpsUrl(requireExposeValue(exposeEnv, 'TEST_EXPOSE_MEDIA_URL'), 'TEST_EXPOSE_MEDIA_URL')
  const bindIp = requireExposeValue(exposeEnv, 'TEST_EXPOSE_BIND_IP')
  const backendPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_BACKEND_PORT')
  const publicPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_PUBLIC_PORT')
  const adminPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_ADMIN_PORT')
  const mediaPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_MEDIA_PORT')

  return `http:
  middlewares:
    {{PROJECT_NAME}}-test-noindex:
      headers:
        customResponseHeaders:
          X-Robots-Tag: "noindex, nofollow, noarchive"

  routers:
    public-test-router-web:
      rule: Host(\`${publicUrl.hostname}\`)
      service: public-test-service
      middlewares:
        - redirect-to-https
      entryPoints:
        - web

    public-test-router-websecure:
      rule: Host(\`${publicUrl.hostname}\`)
      service: public-test-service
      middlewares:
        - {{PROJECT_NAME}}-test-noindex
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

    admin-test-router-web:
      rule: Host(\`${adminUrl.hostname}\`)
      service: admin-test-service
      middlewares:
        - redirect-to-https
      entryPoints:
        - web

    admin-test-router-websecure:
      rule: Host(\`${adminUrl.hostname}\`)
      service: admin-test-service
      middlewares:
        - {{PROJECT_NAME}}-test-noindex
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

    api-test-router-web:
      rule: Host(\`${apiUrl.hostname}\`)
      service: api-test-service
      middlewares:
        - redirect-to-https
      entryPoints:
        - web

    api-test-router-websecure:
      rule: Host(\`${apiUrl.hostname}\`)
      service: api-test-service
      middlewares:
        - {{PROJECT_NAME}}-test-noindex
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

    media-test-router-web:
      rule: Host(\`${mediaUrl.hostname}\`)
      service: media-test-service
      middlewares:
        - redirect-to-https
      entryPoints:
        - web

    media-test-router-websecure:
      rule: Host(\`${mediaUrl.hostname}\`)
      service: media-test-service
      middlewares:
        - {{PROJECT_NAME}}-test-noindex
      entryPoints:
        - websecure
      tls:
        certResolver: letsencrypt

  services:
    public-test-service:
      loadBalancer:
        servers:
          - url: http://${bindIp}:${publicPort}
        passHostHeader: true

    admin-test-service:
      loadBalancer:
        servers:
          - url: http://${bindIp}:${adminPort}
        passHostHeader: true

    api-test-service:
      loadBalancer:
        servers:
          - url: http://${bindIp}:${backendPort}
        passHostHeader: true

    media-test-service:
      loadBalancer:
        servers:
          - url: http://${bindIp}:${mediaPort}
        passHostHeader: true
`
}

function quoteRemotePath(value) {
  return `'${String(value).replaceAll("'", "'\\''")}'`
}

async function writeRemoteTraefikConfig(exposeEnv, configContent) {
  const host = requireExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_HOST')
  const user = requireExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_USER')
  const port = optionalExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_PORT', '22')
  const remoteFile = requireExposeValue(exposeEnv, 'TEST_EXPOSE_TRAEFIK_DYNAMIC_FILE')
  const remoteFileArg = quoteRemotePath(remoteFile)
  const encodedConfig = Buffer.from(configContent, 'utf8').toString('base64')
  const command = `mkdir -p "$(dirname ${remoteFileArg})" && printf %s ${encodedConfig} | base64 -d > ${remoteFileArg}`

  await runCommand('ssh', ['-p', port, `${user}@${host}`, command], { cwd: rootDir })
}

async function removeRemoteTraefikConfig(exposeEnv, options = {}) {
  const optional = Boolean(options.optional)
  const host = exposeEnv.TEST_EXPOSE_SSH_HOST
  const user = exposeEnv.TEST_EXPOSE_SSH_USER
  const port = optionalExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_PORT', '22')
  const remoteFile = exposeEnv.TEST_EXPOSE_TRAEFIK_DYNAMIC_FILE

  if (!host || !user || !remoteFile) {
    if (optional) {
      console.log(`\n  ${ok('test cerrado')} ${gray('sin ruta remota de Traefik configurada')}`)
      return
    }

    throw new Error('Faltan TEST_EXPOSE_SSH_HOST, TEST_EXPOSE_SSH_USER o TEST_EXPOSE_TRAEFIK_DYNAMIC_FILE')
  }

  try {
    await runCommand('ssh', ['-p', port, `${user}@${host}`, `rm -f ${quoteRemotePath(remoteFile)}`], { cwd: rootDir })
  } catch (error) {
    if (optional) {
      console.warn(`\n  ${warn('test close')} ${gray(`no se pudo retirar Traefik remoto; se continua: ${error.message}`)}`)
      return
    }

    throw error
  }
}

async function startTestExposeTunnel(stackEnv, exposeEnv) {
  const host = requireExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_HOST')
  const user = requireExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_USER')
  const port = optionalExposeValue(exposeEnv, 'TEST_EXPOSE_SSH_PORT', '22')
  const bindIp = requireExposeValue(exposeEnv, 'TEST_EXPOSE_BIND_IP')
  const backendPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_BACKEND_PORT')
  const publicPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_PUBLIC_PORT')
  const adminPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_ADMIN_PORT')
  const mediaPort = requireExposeValue(exposeEnv, 'TEST_EXPOSE_REMOTE_MEDIA_PORT')
  const args = [
    '-NT',
    '-p',
    port,
    '-o',
    'ExitOnForwardFailure=yes',
    '-o',
    'BatchMode=yes',
    '-o',
    'ServerAliveInterval=30',
    '-o',
    'ServerAliveCountMax=3',
    '-R',
    `${bindIp}:${backendPort}:127.0.0.1:${stackEnv.BACKEND_PORT}`,
    '-R',
    `${bindIp}:${publicPort}:127.0.0.1:${stackEnv.FRONTEND_PUBLIC_PORT}`,
    '-R',
    `${bindIp}:${adminPort}:127.0.0.1:${stackEnv.FRONTEND_ADMIN_PORT}`,
    '-R',
    `${bindIp}:${mediaPort}:127.0.0.1:${stackEnv.MEDIA_PORT}`,
    `${user}@${host}`,
  ]

  const child = spawn('ssh', args, {
    cwd: rootDir,
    detached: true,
    stdio: 'ignore',
  })

  await waitForChildStartup(child, 'tunel SSH reverso')
  child.unref()
  return child.pid
}

function waitForChildStartup(child, label) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      child.off('error', onError)
      child.off('exit', onExit)
      resolve()
    }, 1500)

    const onError = (error) => {
      clearTimeout(timeout)
      child.off('exit', onExit)
      reject(error)
    }

    const onExit = (code) => {
      clearTimeout(timeout)
      child.off('error', onError)
      reject(new Error(`${label} termino antes de quedar activo con codigo ${code}`))
    }

    child.once('error', onError)
    child.once('exit', onExit)
  })
}

async function stopTestExposeTunnel(options = {}) {
  const optional = Boolean(options.optional)
  let state

  try {
    state = JSON.parse(await fs.readFile(testExposeStateFile, 'utf8'))
  } catch (error) {
    if (optional && error && error.code === 'ENOENT') {
      console.log(`\n  ${ok('test cerrado')} ${gray('sin tunel local registrado')}`)
      return
    }

    throw error
  }

  const pid = Number(state.ssh_pid)
  if (!pid) {
    if (optional) {
      console.log(`\n  ${ok('test cerrado')} ${gray('sin PID de tunel registrado')}`)
      await fs.rm(testExposeStateFile, { force: true })
      return
    }

    throw new Error('Estado de expose sin ssh_pid')
  }

  try {
    await stopProcessByPid(pid, { optional })
  } finally {
    await fs.rm(testExposeStateFile, { force: true })
  }
}

async function runTestOpenCommand() {
  const testExposeEnvFile = await ensureTestExposeEnvFile()
  const exposeEnv = await readEnvFile(testExposeEnvFile)
  const strategy = optionalExposeValue(exposeEnv, 'TEST_EXPOSE_STRATEGY', 'ssh-command')

  if (strategy !== 'ssh-command') {
    throw new Error('Solo está implementada la estrategia ssh-command')
  }

  const stackEnvFile = await ensureStackEnvFile('test')
  const stackEnv = await readEnvFile(stackEnvFile)
  const publicStackEnv = buildPublicTestStackEnv(stackEnv, exposeEnv)

  await runTestCloseCommand({ optional: true })

  await fs.writeFile(testOpenStackEnvFile, serializeEnv(publicStackEnv), 'utf8')
  try {
    await runDockerComposeWithEnvFile('test', testOpenStackEnvFile, publicStackEnv, ['up', '-d', '--build', '--remove-orphans'])
  } finally {
    await fs.rm(testOpenStackEnvFile, { force: true })
  }

  const sshPid = await startTestExposeTunnel(publicStackEnv, exposeEnv)
  try {
    await writeRemoteTraefikConfig(exposeEnv, buildTraefikDynamicConfig(exposeEnv))
  } catch (error) {
    await stopProcessByPid(sshPid, { optional: true })
    throw error
  }

  await fs.mkdir(stateDir, { recursive: true })
  await fs.writeFile(testExposeStateFile, `${JSON.stringify({
    opened_at: new Date().toISOString(),
    ssh_pid: sshPid,
    public_url: exposeEnv.TEST_EXPOSE_PUBLIC_URL,
    admin_url: exposeEnv.TEST_EXPOSE_ADMIN_URL,
    api_url: exposeEnv.TEST_EXPOSE_API_URL,
    traefik_dynamic_file: exposeEnv.TEST_EXPOSE_TRAEFIK_DYNAMIC_FILE,
  }, null, 2)}\n`, 'utf8')

  console.log(header('test abierto'))
  console.log('')
  console.log(`  ${tag('frontend-public')}  ${info(exposeEnv.TEST_EXPOSE_PUBLIC_URL)}`)
  console.log(`  ${tag('frontend-admin')}   ${info(exposeEnv.TEST_EXPOSE_ADMIN_URL)}`)
  console.log(`  ${tag('backend-api')}      ${info(exposeEnv.TEST_EXPOSE_API_URL)}`)
  console.log('')
}

async function stopProcessByPid(pid, options = {}) {
  const optional = Boolean(options.optional)

  try {
    if (process.platform === 'win32') {
      await runCommand('taskkill', ['/PID', String(pid), '/T', '/F'], { cwd: rootDir })
    } else {
      process.kill(-pid, 'SIGTERM')
    }
  } catch (error) {
    if (!optional) {
      throw error
    }
  }
}

async function runTestCloseCommand(options = {}) {
  const optional = Boolean(options.optional)
  const testExposeEnvFile = await ensureTestExposeEnvFile()
  const exposeEnv = await readEnvFile(testExposeEnvFile)
  const strategy = optionalExposeValue(exposeEnv, 'TEST_EXPOSE_STRATEGY', 'ssh-command')

  if (strategy !== 'ssh-command') {
    if (optional) {
      console.log(`\n  ${ok('test cerrado')} ${gray('sin estrategia ssh-command activa')}`)
      return
    }

    throw new Error('Solo está implementada la estrategia ssh-command')
  }

  await removeRemoteTraefikConfig(exposeEnv, { optional })
  await stopTestExposeTunnel({ optional })
  console.log(`\n  ${ok('test cerrado')}`)
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

    const port = (p) => cyan(String(p))
    const inactive = gray('inactivo')

    console.log(header(`puertos — ${bold(stackName)}`))
    console.log(`  ${tag('backend-api')}      ${port(values.BACKEND_PORT)}`)
    console.log(`  ${tag('frontend-public')}  ${port(values.FRONTEND_PUBLIC_PORT)}`)
    console.log(`  ${tag('frontend-admin')}   ${port(values.FRONTEND_ADMIN_PORT)}`)
    console.log(`  ${tag('postgres')}         ${port(values.POSTGRES_PORT)}`)
    console.log(`  ${tag('redis')}            ${hasRedis ? port(values.REDIS_PORT) : inactive}`)
    console.log(`  ${tag('media-nginx')}      ${port(values.MEDIA_PORT)}`)
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
