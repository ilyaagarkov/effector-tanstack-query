"use client";

import Link from "next/link";
import { useUnit } from "effector-react";
import { useQuery } from "@effector-tanstack-query/react";
import {
  $name,
  $page,
  PAGE_SIZE,
  listQuery,
  nameChanged,
  pageChanged,
  pokemonQuery,
} from "@/model/queries";

export function PageBody() {
  return (
    <main className="main">
      <h1>SSR example — effector-tanstack-query</h1>
      <p className="muted">
        Both queries are <strong>prefetched on the server</strong> via the
        per-request scope, then hydrated on the client. There's no loading flash
        on initial paint — open DevTools "Network", reload, and watch the first
        paint already have data.
      </p>
      <p className="muted">
        Once hydrated, the queries are reactive: change the dropdown / page and
        the model re-fetches via the client's QueryClient.
      </p>

      <SinglePokemon />
      <PokemonList />

      <h3>How it's wired</h3>
      <pre>{`// app/layout.tsx — singleton QueryClient + scope (via @effector/next)
<Providers>{children}</Providers>

// src/lib/providers.tsx (client, module top-level)
if (typeof window !== 'undefined') {
  await allSettled($queryClient, {
    params: getQueryClient(),
    scope: getClientScope()!,
  })
}
<EffectorNext>{children}</EffectorNext>

// app/page.tsx (server)
const { queryClient, scope } = makeRequestScope()
await prefetchQueries([listQuery, pokemonQuery], { scope })

<PageHydration
  dehydratedQueryClient={dehydrate(queryClient)}
  serializedScope={serialize(scope)}
>
  <PageBody />
</PageHydration>

// src/lib/hydration-provider.tsx (client)
<HydrationBoundary state={dehydratedQueryClient}>
  <EffectorNext values={serializedScope}>{children}</EffectorNext>
</HydrationBoundary>`}</pre>
    </main>
  );
}

function SinglePokemon() {
  const { data, isPending, isFetching, error } = useQuery(pokemonQuery);
  const [name, setName] = useUnit([$name, nameChanged]);

  return (
    <section className="card">
      <h2>Single pokemon (reactive name)</h2>
      <div className="row">
        <label>name:</label>
        <select value={name} onChange={(e) => setName(e.target.value)}>
          {["pikachu", "bulbasaur", "charmander", "squirtle", "mewtwo"].map(
            (n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ),
          )}
        </select>
        {isFetching && <span className="badge pending">fetching…</span>}
      </div>
      {isPending && !data && <p>Loading…</p>}
      {error && <p>{error.message}</p>}
      {data && (
        <div className="row" style={{ marginTop: 12 }}>
          {data.sprites.front_default && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.sprites.front_default} alt={data.name} width={96} />
          )}
          <div>
            <strong>{data.name}</strong>
            <div className="muted">
              height {data.height} · weight {data.weight}
            </div>
            <div className="muted">
              types: {data.types.map((t) => t.type.name).join(", ")}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function PokemonList() {
  const { data, isFetching } = useQuery(listQuery);
  const [page, setPage] = useUnit([$page, pageChanged]);

  return (
    <section className="card">
      <h2>Paginated list (reactive page)</h2>
      <div className="row">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0 || isFetching}
        >
          ← prev
        </button>
        <span>
          page {page + 1} (offset {page * PAGE_SIZE})
        </span>
        <button onClick={() => setPage(page + 1)} disabled={isFetching}>
          next →
        </button>
        {isFetching && <span className="badge pending">fetching…</span>}
      </div>
      {data && (
        <div className="list" style={{ marginTop: 12 }}>
          {data.results.map((p) => (
            <div key={p.name} className="list-item">
              <Link href={`/pokemon/${p.name}`}>{p.name}</Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
