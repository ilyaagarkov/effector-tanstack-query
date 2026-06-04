// @vitest-environment node
//
// Node env (no jsdom): `typeof window === 'undefined'` is genuinely true, so
// `react-dom/server`'s `renderToString` drives the real server path. This is
// the environment a production SSR render actually runs in.
//
// THE THREAT MODEL
// ----------------
// Every factory in this library (`createQuery`, `createQueries`, …) and its
// internal stores ($data, $status, $items, the reactive query-key stores …)
// are MODULE-LEVEL SINGLETONS — created once, shared by every request. The
// only thing keeping request A's data out of request B's HTML is effector's
// `Scope`: each `fork()` holds its own copy of every store's state, and
// `allSettled` / `scopeBind` route every mutation into the right scope.
//
// If that isolation ever broke — a stray non-scoped `getState`, a queryClient
// shared across forks, a dispatcher bound to the wrong scope — the symptom is
// the worst bug in all of SSR: "user X sees user Y's data". These tests fan
// out 1000 concurrent renders with deliberately overlapping async timing and
// assert that NOTHING crosses between responses.
//
// Real timers (NOT vi.useFakeTimers) on purpose: the random per-request delay
// must actually elapse so the 1000 prefetch/render pipelines interleave in time
// — that temporal overlap is what would expose a scope leak.
import { describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { Provider } from "effector-react";
import { createStore, fork, serialize } from "effector";
import type { Scope } from "effector";
import { QueryClient, dehydrate } from "@tanstack/query-core";
import {
  $queryClient,
  createQueries,
  createQuery,
  prefetchQueries,
} from "@effector-tanstack-query/core";
import { useQueries, useQuery } from "..";

// Fixed-width id so no name is a substring of another. With `user-0`..`user-99`
// the naive sketch's `not.toContain('USER-1')` would FALSE-POSITIVE on the
// `user-10` render ("USER-10" contains "USER-1") — a test bug, not a leak.
// Equal-length distinct strings can never be substrings of one another, so
// 3-digit padding ("user-000".."user-099") makes the cross-leak check sound.
const userId = (i: number) => `user-${String(i).padStart(3, "0")}`;

interface User {
  name: string;
  displayName: string;
}

// One module-level reactive query shared by ALL renders. `$name` is the
// per-request discriminator; each fork supplies its own value, and the
// reactive query key (`['user', $name]`) resolves per-scope.
const $name = createStore("");
const userQuery = createQuery<User>({
  name: "concurrency.user",
  queryKey: ["user", $name],
  queryFn: ({ queryKey }) => fetchUser(queryKey[1] as string),
  // Infinite staleTime: after `prefetch` seeds the cache, the observer created
  // on `mounted` reads it as fresh and does NOT kick off a background refetch.
  // Without this each mount would re-call the queryFn, inflating the call count.
  staleTime: Infinity,
});

// Re-assigned per test so `restoreMocks: true` + a fresh spy keeps call counts
// independent across tests. Declared module-level because the query factory
// (also module-level) closes over `fetchUser`.
let fetchUser: (name: string) => Promise<User> = async (name) => ({
  name,
  displayName: name.toUpperCase(),
});

function UserBadge() {
  const { data } = useQuery(userQuery);
  // Sole child of the span → React emits the bare text with no comment markers
  // splitting it, so `toContain`/`not.toContain` on the displayName is exact.
  return <span>{data?.displayName ?? "loading"}</span>;
}

// A self-contained per-request scope: its OWN QueryClient (so `dehydrate` is
// per-request) and its OWN `$name` value injected via fork — the realistic
// shape of a per-request SSR context.
function makeRequestScope(name: string): {
  queryClient: QueryClient;
  scope: Scope;
} {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Deliberately NOT mounted. SSR never calls `queryClient.mount()` — mounting
  // only wires window focus/online refetch listeners onto the global managers,
  // which (a) are useless on the server and (b) are themselves a leak if the
  // client is never unmounted. `fetchQuery`/`dehydrate`/observers all work fine
  // on an unmounted client.
  const scope = fork({
    values: [
      [$queryClient, queryClient],
      [$name, name],
    ],
  });
  return { queryClient, scope };
}

describe("SSR concurrency — per-request scope isolation", () => {
  it("1000 parallel renders with distinct names stay isolated", async () => {
    const names = Array.from({ length: 1000 }, (_, i) => userId(i));

    const fetchSpy = vi.fn(async (name: string): Promise<User> => {
      // Random delay so the 1000 pipelines overlap in wall-clock time — the
      // interleaving that would surface a cross-scope leak.
      await new Promise((r) => setTimeout(r, Math.random() * 10));
      return { name, displayName: name.toUpperCase() };
    });
    fetchUser = fetchSpy;

    const renders = names.map(async (name) => {
      const { queryClient, scope } = makeRequestScope(name);
      // Fills both SSR layers: prefetch seeds the queryClient cache, mounted
      // pushes the result into the scope's effector stores.
      await prefetchQueries([userQuery], { scope });

      const html = renderToString(
        <Provider value={scope}>
          <UserBadge />
        </Provider>,
      );
      const dehydrated = dehydrate(queryClient);
      const serialized = serialize(scope);
      return { name, html, dehydrated, serialized };
    });

    const results = await Promise.all(renders);

    for (const r of results) {
      const own = r.name.toUpperCase();

      // 1. HTML carries only its own prefetched value.
      expect(r.html).toContain(own);

      // 2. Dehydrated cache holds exactly one entry — this request's.
      const cached = r.dehydrated.queries;
      expect(cached).toHaveLength(1);
      expect(cached[0]?.queryKey).toEqual(["user", r.name]);
      expect((cached[0]?.state.data as User | undefined)?.displayName).toBe(
        own,
      );

      // 3. The serialized effector scope holds only this request's store value.
      const serializedJson = JSON.stringify(r.serialized);
      const dataSid = "@tanstack/query-effector.concurrency.user.$data";
      expect((r.serialized as Record<string, User>)[dataSid]?.displayName).toBe(
        own,
      );

      // 4. NOTHING from another request appears — in the HTML, the dehydrated
      //    cache, OR the serialized scope. Checked in O(1) per render (not
      //    O(n)): scan each payload for the user-id pattern and assert every
      //    single match is this request's own id. One foreign token anywhere is
      //    a leak. This stays linear in total work, so it scales to any N.
      const cacheJson = JSON.stringify(r.dehydrated);
      const ID_PATTERN = /user-\d{3}/gi;
      for (const payload of [r.html, cacheJson, serializedJson]) {
        for (const match of payload.match(ID_PATTERN) ?? []) {
          expect(match.toLowerCase()).toBe(r.name);
        }
      }
    }

    // Exactly one fetch per request — no duplicate work, no missing work.
    expect(fetchSpy).toHaveBeenCalledTimes(names.length);
  });

  it("race on a single queryKey: two parallel renders with the same name both resolve", async () => {
    const name = userId(42);
    const fetchSpy = vi.fn(async (n: string): Promise<User> => {
      await new Promise((r) => setTimeout(r, Math.random() * 10));
      return { name: n, displayName: n.toUpperCase() };
    });
    fetchUser = fetchSpy;

    const renderOnce = async () => {
      const { queryClient, scope } = makeRequestScope(name);
      await prefetchQueries([userQuery], { scope });
      const html = renderToString(
        <Provider value={scope}>
          <UserBadge />
        </Provider>,
      );
      return { html, dehydrated: dehydrate(queryClient) };
    };

    // Two independent requests for the same user, racing concurrently. Each has
    // its own scope + queryClient, so neither should crash or starve the other.
    const [a, b] = await Promise.all([renderOnce(), renderOnce()]);

    for (const r of [a, b]) {
      expect(r.html).toContain(name.toUpperCase());
      expect(r.dehydrated.queries).toHaveLength(1);
      expect(r.dehydrated.queries[0]?.queryKey).toEqual(["user", name]);
    }
    // Separate per-request QueryClients ⇒ each fetches independently (no shared
    // cache to dedupe against). Same key, no contention.
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("a failed request in one scope does not break the other 999 renders", async () => {
    const names = Array.from({ length: 1000 }, (_, i) => userId(i));
    const poisonedName = userId(7);

    const fetchSpy = vi.fn(async (name: string): Promise<User> => {
      await new Promise((r) => setTimeout(r, Math.random() * 10));
      if (name === poisonedName) throw new Error(`boom for ${name}`);
      return { name, displayName: name.toUpperCase() };
    });
    fetchUser = fetchSpy;

    const renders = names.map(async (name) => {
      const { queryClient, scope } = makeRequestScope(name);
      // `prefetchQueries` runs through `allSettled`, which never rejects — a
      // queryFn that throws lands as an error state in that one scope without
      // taking down the surrounding `Promise.all`.
      await prefetchQueries([userQuery], { scope });
      const html = renderToString(
        <Provider value={scope}>
          <UserBadge />
        </Provider>,
      );
      const status = scope.getState(userQuery.$status);
      const data = scope.getState(userQuery.$data);
      return { name, html, status, data, dehydrated: dehydrate(queryClient) };
    });

    // The whole batch must settle — one failure cannot reject the join.
    const results = await Promise.all(renders);

    for (const r of results) {
      if (r.name === poisonedName) {
        // The poisoned render degrades gracefully: it never resolves to data,
        // falls back in the HTML, and crucially NO other user's data leaks in.
        // (An errored query refetches on mount regardless of staleTime, so the
        // status is the in-flight 'pending' rather than 'error' at render time
        // — what matters is that it never shows success/data.)
        expect(r.status).not.toBe("success");
        expect(r.data).toBeUndefined();
        expect(r.html).toContain("loading");
        for (const other of names) {
          if (other === r.name) continue;
          expect(r.html).not.toContain(other.toUpperCase());
        }
      } else {
        // Every healthy render is unaffected by its poisoned sibling.
        expect(r.status).toBe("success");
        expect(r.html).toContain(r.name.toUpperCase());
        expect(r.dehydrated.queries[0]?.queryKey).toEqual(["user", r.name]);
      }
    }
  });
});

// =============================================================================
// createQueries family — same isolation guarantee for the parallel-list flavor.
// Each render drives the family from a DIFFERENT per-request `source`, and must
// see only its own items.
// =============================================================================

// Fixed-width tokens (e.g. "grp-03-i1") so no item value is a substring of
// another — same soundness argument as `userId` above.
const itemToken = (group: number, idx: number) =>
  `grp-${String(group).padStart(2, "0")}-i${idx}`;

const $ids = createStore<string[]>([]);
const itemFamily = createQueries<string, string>({
  name: "concurrency.items",
  source: $ids,
  query: (id) => ({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id),
  }),
  staleTime: Infinity,
});

let fetchItem: (id: string) => Promise<string> = async (id) => id;

function ItemList() {
  const items = useQueries(itemFamily);
  return (
    <ul>
      {items.map((it, i) => (
        <li key={i}>{it.data ?? "pending"}</li>
      ))}
    </ul>
  );
}

describe("SSR concurrency — createQueries family isolation", () => {
  it("50 parallel renders each see only their own per-request source items", async () => {
    const GROUPS = 50;
    const ITEMS_PER_GROUP = 3;

    const fetchSpy = vi.fn(async (id: string): Promise<string> => {
      await new Promise((r) => setTimeout(r, Math.random() * 10));
      // Echo the token back uppercased so HTML output is easy to match.
      return id.toUpperCase();
    });
    fetchItem = fetchSpy;

    const groupIds = (g: number) =>
      Array.from({ length: ITEMS_PER_GROUP }, (_, i) => itemToken(g, i));

    const renders = Array.from({ length: GROUPS }, (_, g) => g).map(
      async (g) => {
        const ids = groupIds(g);
        const queryClient = new QueryClient({
          defaultOptions: { queries: { retry: false } },
        });
        queryClient.mount();
        // Per-request source injected via fork — the family's module-level
        // `$ids` resolves to THIS render's list inside this scope only.
        const scope = fork({
          values: [
            [$queryClient, queryClient],
            [$ids, ids],
          ],
        });

        await prefetchQueries([itemFamily], { scope });

        const html = renderToString(
          <Provider value={scope}>
            <ItemList />
          </Provider>,
        );
        return { g, ids, html };
      },
    );

    const results = await Promise.all(renders);

    // Flat set of every token across every group — used for the cross-check.
    const allTokens = Array.from({ length: GROUPS }, (_, g) =>
      groupIds(g),
    ).flat();

    for (const r of results) {
      // Each of its own items is present...
      for (const id of r.ids) {
        expect(r.html).toContain(id.toUpperCase());
      }
      // ...and no token from any other group is.
      const ownSet = new Set(r.ids);
      for (const token of allTokens) {
        if (ownSet.has(token)) continue;
        expect(r.html).not.toContain(token.toUpperCase());
      }
    }

    expect(fetchSpy).toHaveBeenCalledTimes(GROUPS * ITEMS_PER_GROUP);
  });
});
