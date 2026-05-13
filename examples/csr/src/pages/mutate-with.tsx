import * as React from 'react'
import { createMutation } from '@effector-tanstack-query/core'
import { useMutation } from '@effector-tanstack-query/react'
import { addFavorite, type Favorite } from '../model/api'

// Module-level callbacks (sample-driven) work for cross-cutting reactions
// like cache invalidation. But sometimes a component needs a one-shot
// callback ("navigate to the newly-created item"). That's mutateWith.
const addFavoriteMutation = createMutation<Favorite, Error, string>({
  name: 'mutateWith.addFavorite',
  mutationFn: addFavorite,
})

const CHOICES = ['eevee', 'snorlax', 'gengar', 'mewtwo', 'lucario']

export function MutateWithPage() {
  const m = useMutation(addFavoriteMutation)
  const [name, setName] = React.useState(CHOICES[0]!)
  const [log, setLog] = React.useState<Array<string>>([])

  return (
    <>
      <h2>mutateWith — per-call callbacks</h2>
      <p className="muted">
        <code>mutate(variables)</code> only takes variables — module-level
        reactions go through <code>finished.success</code> /{' '}
        <code>finished.failure</code>. For one-shot component-local
        callbacks (e.g. navigate, toast), use <code>mutateWith</code>.
      </p>

      <div className="card">
        <div className="row">
          <select value={name} onChange={(e) => setName(e.target.value)}>
            {CHOICES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            onClick={() =>
              m.mutateWith({
                variables: name,
                onSuccess: (data) =>
                  setLog((l) => [
                    `✓ added ${data.name} (id=${data.id})`,
                    ...l,
                  ]),
                onError: (err) =>
                  setLog((l) => [`✗ ${err.message}`, ...l]),
              })
            }
          >
            add (with per-call cb)
          </button>
          {m.isPending && <span className="badge pending">posting…</span>}
        </div>

        <h4>Component log</h4>
        {log.length === 0 ? (
          <p className="muted">…click "add" to populate</p>
        ) : (
          <ul>
            {log.map((line, i) => (
              <li key={i} style={{ fontFamily: 'monospace' }}>
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>

      <pre>{`m.mutateWith({
  variables: name,
  onSuccess: (data) => navigate(\`/favorites/\${data.id}\`),
  onError: (err)   => toast.error(err.message),
})

// Per-call callbacks layer ON TOP of observer-level ones — never replace.`}</pre>
    </>
  )
}
