# Guía de Tests — frontend-public

## Unit tests (Vitest + Testing Library)

```typescript
// tests/unit/features/auth/login-form.spec.tsx
// US-002 — Login de usuario

import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from '@/features/auth/components/LoginForm'

describe('LoginForm', () => {
  it('dado el formulario vacío, cuando se envía, entonces muestra errores de validación', async () => {
    render(<LoginForm />)
    fireEvent.submit(screen.getByRole('form'))
    expect(await screen.findByText(/email requerido/i)).toBeInTheDocument()
  })
})
```

## E2E tests (Playwright)

```typescript
// tests/e2e/features/auth/login.spec.ts
// US-002 — Login de usuario

import { test, expect } from '@playwright/test'

test('dado credenciales válidas, cuando el usuario hace login, entonces ve el dashboard', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[name="email"]', 'test@test.com')
  await page.fill('[name="password"]', 'password')
  await page.click('[type="submit"]')
  await expect(page).toHaveURL('/app/dashboard')
})
```
