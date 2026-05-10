const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
}

export const SERVICE_COLOR = {
  'backend-api': C.yellow,
  'frontend-public': C.magenta,
  'frontend-admin': C.cyan,
  postgres: C.blue,
  redis: C.red,
  minio: C.green,
}

const wrap = (color) => (s) => `${color}${s}${C.reset}`

export const bold = wrap(C.bold)
export const dim = wrap(C.dim)
export const red = wrap(C.red)
export const green = wrap(C.green)
export const yellow = wrap(C.yellow)
export const cyan = wrap(C.cyan)
export const magenta = wrap(C.magenta)
export const gray = wrap(C.gray)

export const ok = (s) => `${C.green}✓${C.reset} ${s}`
export const fail = (s) => `${C.red}✗${C.reset} ${s}`
export const warn = (s) => `${C.yellow}!${C.reset} ${s}`
export const info = (s) => `${C.cyan}→${C.reset} ${s}`

export const tag = (name) => {
  const color = SERVICE_COLOR[name] ?? C.gray
  return `${color}${C.bold}[${name}]${C.reset}`
}

export const header = (title) => {
  const line = `${C.cyan}${'─'.repeat(52)}${C.reset}`
  return `\n${line}\n  ${C.bold}${title}${C.reset}\n${line}`
}
