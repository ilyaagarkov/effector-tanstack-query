import { http, HttpResponse, delay } from 'msw'

// In-memory store for "favorite pokemon" — demonstrates mutations + optimistic
// updates without needing a real backend.
let favorites: Array<{ id: number; name: string }> = [
  { id: 25, name: 'pikachu' },
]
let nextId = 100

export const handlers = [
  http.get('/api/favorites', async () => {
    await delay(300)
    return HttpResponse.json(favorites)
  }),

  http.post('/api/favorites', async ({ request }) => {
    const body = (await request.json()) as { name: string }
    await delay(600)
    // Simulate transient server error ~20% of the time so optimistic-update
    // rollback is observable.
    if (Math.random() < 0.2) {
      return HttpResponse.json({ error: 'flaky server' }, { status: 500 })
    }
    const created = { id: nextId++, name: body.name }
    favorites = [...favorites, created]
    return HttpResponse.json(created, { status: 201 })
  }),

  http.delete('/api/favorites/:id', async ({ params }) => {
    const id = Number(params.id)
    await delay(400)
    favorites = favorites.filter((f) => f.id !== id)
    return HttpResponse.json({ ok: true })
  }),
]
