# Guía de Tests — backend-api

## Filosofía

- Tests verifican comportamiento, no implementación
- Un test = un comportamiento verificable
- Nomenclatura Given/When/Then en el `it()`

## Unit tests

```typescript
// tests/unit/modules/users/create-user.spec.ts
// US-001 — Registro de usuario

import { describe, it, expect, vi } from 'vitest'

describe('CreateUserUseCase', () => {
  it('dado un email válido, cuando se crea el usuario, entonces retorna el usuario creado', async () => {
    // Arrange
    const mockRepo = { create: vi.fn().mockResolvedValue({ id: '1', email: 'test@test.com' }) }
    const useCase = new CreateUserUseCase(mockRepo)

    // Act
    const result = await useCase.execute({ email: 'test@test.com', password: 'secret' })

    // Assert
    expect(result.email).toBe('test@test.com')
    expect(mockRepo.create).toHaveBeenCalledOnce()
  })

  it('dado un email ya registrado, cuando se intenta crear el usuario, entonces lanza ConflictError', async () => {
    // ...
  })
})
```

## Integration tests

Los tests de integración usan la base de datos real de test.
Configurar `DATABASE_URL` apuntando a una DB de test separada.

```typescript
// tests/integration/modules/users/user-flow.spec.ts
// US-001, US-002 — Flujo completo de usuario

import { buildApp } from '../../src/app'

describe('User flow integration', () => {
  it('dado el sistema vacío, cuando se crea y luego lista usuarios, entonces aparece en la lista', async () => {
    const app = await buildApp()
    // ...
    await app.close()
  })
})
```

## Performance (k6)

```javascript
// tests/non-functional/performance/load.k6.js
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: { http_req_duration: ['p(95)<500'] },
}

export default function () {
  const res = http.get(`${__ENV.BASE_URL}/health`)
  check(res, { 'status 200': (r) => r.status === 200 })
}
```
