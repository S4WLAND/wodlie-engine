/**
 * Shared: Configuración del proyecto
 * Lee .wodlie-config/project.json
 */
import fs from 'fs-extra'
import path from 'path'

export interface ProjectConfig {
  project: string
  active?: boolean
  domain?: string
  acme_email?: string
  contract?: {
    type: 'fixed' | 'subscription'
    history: Array<{ type: string; started: string; ended: string | null }>
  }
  contract_type?: 'fixed' | 'subscription'
  project_profile: {
    type: 'webapp' | 'platform' | 'enterprise' | 'iot'
    size: 'small' | 'medium' | 'large'
  }
  hosting_type: 'vps' | 'hosting' | 'cloud'
  capabilities: string[]
  infra_details?: {
    provider?: string
    plan?: string
    region?: string
    server_os?: string
    cpu?: string
    ram?: string
    disk?: string
    ssh_host?: string
    ssh_user?: string
    notes?: string
  }
  stack: string
  apps: {
    backend: string
    frontend_public: string
    frontend_admin: string
  }
  service_modes?: {
    backend_api: 'neutral' | 'fastify'
    frontend_public: 'neutral' | 'nextjs'
    frontend_admin: 'neutral' | 'nextjs'
  }
}

export async function loadProjectConfig(): Promise<ProjectConfig> {
  const configPath = path.join(process.cwd(), '.wodlie-config', 'project.json')
  if (!await fs.pathExists(configPath)) {
    throw new Error('No se encontró .wodlie-config/project.json. ¿Estás en un proyecto Wodlie?')
  }
  return fs.readJson(configPath)
}
