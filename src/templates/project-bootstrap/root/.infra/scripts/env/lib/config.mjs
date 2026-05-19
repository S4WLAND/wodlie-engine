import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const rootDir = path.resolve(__dirname, '..', '..', '..', '..')
export const infraDir = path.join(rootDir, '.infra')
export const envDir = path.join(infraDir, 'env')
export const stateDir = path.join(infraDir, 'state')
export const dockerDir = path.join(infraDir, 'docker')

export const composeFiles = {
  base: path.join(dockerDir, 'compose.base.yml'),
  dev: path.join(dockerDir, 'compose.dev.yml'),
  test: path.join(dockerDir, 'compose.test.yml'),
}

export const stackEnvFiles = {
  dev: {
    actual: path.join(envDir, 'stack.dev.env'),
    example: path.join(envDir, 'stack.dev.env.example'),
  },
  test: {
    actual: path.join(envDir, 'stack.test.env'),
    example: path.join(envDir, 'stack.test.env.example'),
  },
}

export const testExposeEnvFiles = {
  actual: path.join(envDir, 'test-expose.env'),
  example: path.join(envDir, 'test-expose.env.example'),
}

export const testStateFile = path.join(stateDir, 'test-release-state.json')
export const envCatalogFile = path.join(envDir, 'catalog.json')

export const services = [
  {
    id: 'backend-api',
    label: 'Backend API',
    dir: path.join(rootDir, '.dev', 'src', 'backend-api'),
    exampleEnvFile: path.join(rootDir, '.dev', 'src', 'backend-api', '.env.example'),
    devEnvFile: path.join(rootDir, '.dev', 'src', 'backend-api', '.env.development'),
    testEnvFile: path.join(rootDir, '.dev', 'src', 'backend-api', '.env.test'),
    codeDir: path.join(rootDir, '.dev', 'src', 'backend-api'),
    ghcrImageName: '{{PROJECT_NAME}}-backend-api',
  },
  {
    id: 'frontend-public',
    label: 'Frontend Public',
    dir: path.join(rootDir, '.dev', 'src', 'frontend-public'),
    exampleEnvFile: path.join(rootDir, '.dev', 'src', 'frontend-public', '.env.example'),
    devEnvFile: path.join(rootDir, '.dev', 'src', 'frontend-public', '.env.development'),
    testEnvFile: path.join(rootDir, '.dev', 'src', 'frontend-public', '.env.test'),
    codeDir: path.join(rootDir, '.dev', 'src', 'frontend-public'),
    ghcrImageName: '{{PROJECT_NAME}}-frontend-public',
  },
  {
    id: 'frontend-admin',
    label: 'Frontend Admin',
    dir: path.join(rootDir, '.dev', 'src', 'frontend-admin'),
    exampleEnvFile: path.join(rootDir, '.dev', 'src', 'frontend-admin', '.env.example'),
    devEnvFile: path.join(rootDir, '.dev', 'src', 'frontend-admin', '.env.development'),
    testEnvFile: path.join(rootDir, '.dev', 'src', 'frontend-admin', '.env.test'),
    codeDir: path.join(rootDir, '.dev', 'src', 'frontend-admin'),
    ghcrImageName: '{{PROJECT_NAME}}-frontend-admin',
  },
]

export const managedEnvFiles = services.flatMap((service) => [service.devEnvFile, service.testEnvFile])
