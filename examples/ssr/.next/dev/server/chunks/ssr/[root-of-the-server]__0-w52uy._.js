module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/examples/ssr/src/model/api.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fetchPokemonByName",
    ()=>fetchPokemonByName,
    "fetchPokemonList",
    ()=>fetchPokemonList
]);
// Same PokéAPI wrappers as the CSR example — kept local so each example
// can be read in isolation.
const BASE = 'https://pokeapi.co/api/v2';
async function fetchPokemonList(limit, offset) {
    const r = await fetch(`${BASE}/pokemon?limit=${limit}&offset=${offset}`, {
        next: {
            revalidate: 60
        }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}
async function fetchPokemonByName(name) {
    const r = await fetch(`${BASE}/pokemon/${name.toLowerCase()}`, {
        next: {
            revalidate: 60
        }
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
}
}),
"[project]/examples/ssr/src/model/queries.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "$name",
    ()=>$name,
    "$page",
    ()=>$page,
    "PAGE_SIZE",
    ()=>PAGE_SIZE,
    "listQuery",
    ()=>listQuery,
    "nameChanged",
    ()=>nameChanged,
    "pageChanged",
    ()=>pageChanged,
    "pokemonQuery",
    ()=>pokemonQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@effector-tanstack-query/core'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/api.ts [app-rsc] (ecmascript)");
;
;
;
const pageChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
const $page = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(0).on(pageChanged, (_, p)=>p);
const PAGE_SIZE = 20;
const listQuery = createQuery({
    name: 'ssr.list',
    queryKey: [
        'pokemon-list',
        $page
    ],
    queryFn: ({ queryKey })=>{
        const page = queryKey[1];
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchPokemonList"])(PAGE_SIZE, page * PAGE_SIZE);
    },
    staleTime: 60_000
});
const nameChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
const $name = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])('pikachu').on(nameChanged, (_, n)=>n);
const pokemonQuery = createQuery({
    name: 'ssr.pokemon',
    queryKey: [
        'pokemon',
        $name
    ],
    queryFn: ({ queryKey })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fetchPokemonByName"])(queryKey[1]),
    staleTime: 60_000
});
}),
"[project]/examples/ssr/src/lib/server.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "makeRequestScope",
    ()=>makeRequestScope,
    "prefetch",
    ()=>prefetch
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$hydration$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/hydration.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@effector-tanstack-query/core'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
;
;
;
;
function makeRequestScope() {
    const queryClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["QueryClient"]({
        defaultOptions: {
            queries: {
                retry: false,
                staleTime: 60_000
            }
        }
    });
    // We do NOT call queryClient.mount() on the server — no window/focus
    // events to subscribe to, and we don't want background refetch tasks.
    const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["fork"])({
        values: [
            [
                $queryClient,
                queryClient
            ]
        ]
    });
    return {
        queryClient,
        scope
    };
}
async function prefetch(scope, queryClient, queries) {
    // Step 1: populate qc cache. allSettled awaits because prefetchFx returns
    // the fetch Promise.
    await Promise.all(queries.map((q)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["allSettled"])(q.prefetch, {
            scope
        })));
    // Step 2: mount the queries so the effector stores ($data, $status, …)
    // get the freshly-cached values dispatched into them. Mount is fast here
    // because the cache hit means no new network request.
    await Promise.all(queries.map((q)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["allSettled"])(q.mounted, {
            scope
        })));
    return {
        dehydratedQueryClient: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$hydration$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["dehydrate"])(queryClient),
        serializedScope: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["serialize"])(scope)
    };
}
}),
"[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HydrationProvider",
    ()=>HydrationProvider
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const HydrationProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call HydrationProvider() from the server but HydrationProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/examples/ssr/src/lib/hydration-provider.tsx <module evaluation>", "HydrationProvider");
}),
"[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HydrationProvider",
    ()=>HydrationProvider
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const HydrationProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call HydrationProvider() from the server but HydrationProvider is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/examples/ssr/src/lib/hydration-provider.tsx", "HydrationProvider");
}),
"[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/examples/ssr/app/page.client.tsx [app-rsc] (client reference proxy) <module evaluation>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageBody",
    ()=>PageBody
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const PageBody = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call PageBody() from the server but PageBody is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/examples/ssr/app/page.client.tsx <module evaluation>", "PageBody");
}),
"[project]/examples/ssr/app/page.client.tsx [app-rsc] (client reference proxy)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageBody",
    ()=>PageBody
]);
// This file is generated by next-core EcmascriptClientReferenceModule.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const PageBody = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call PageBody() from the server but PageBody is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/examples/ssr/app/page.client.tsx", "PageBody");
}),
"[project]/examples/ssr/app/page.client.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/examples/ssr/app/page.client.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/examples/ssr/app/page.client.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/examples/ssr/app/page.tsx [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/lib/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/app/page.client.tsx [app-rsc] (ecmascript)");
;
;
;
;
;
;
async function Home() {
    const { queryClient, scope } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["makeRequestScope"])();
    const { dehydratedQueryClient, serializedScope } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prefetch"])(scope, queryClient, [
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["listQuery"],
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pokemonQuery"]
    ]);
    // After mounting, observers keep a subscription open — destroy them so
    // there's no dangling work after the response is sent.
    await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["allSettled"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["listQuery"].unmounted, {
            scope
        }),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["allSettled"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["pokemonQuery"].unmounted, {
            scope
        })
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HydrationProvider"], {
        dehydratedQueryClient: dehydratedQueryClient,
        serializedScope: serializedScope,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PageBody"], {}, void 0, false, {
            fileName: "[project]/examples/ssr/app/page.tsx",
            lineNumber: 39,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/examples/ssr/app/page.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
}),
"[project]/examples/ssr/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/examples/ssr/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0-w52uy._.js.map