(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/packages/core/dist/queryClient.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "$queryClient",
    ()=>$queryClient,
    "setQueryClient",
    ()=>setQueryClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-client] (ecmascript)");
;
// src/queryClient.ts
var $queryClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(null, {
    name: "@tanstack/query-effector.$queryClient",
    sid: "@tanstack/query-effector.$queryClient",
    // Carries a runtime-only object (`QueryClient` instance) — must not
    // round-trip through `serialize(scope)`. Per-scope injection happens
    // via `fork({ values: [[$queryClient, qc]] })` instead.
    serialize: "ignore"
});
var setQueryClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
$queryClient.on(setQueryClient, (_, qc)=>qc);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/examples/ssr/src/lib/hydration-provider.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HydrationProvider",
    ()=>HydrationProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector-react@23.3.0_effector@23.4.4_react@19.2.5/node_modules/effector-react/effector-react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$hydration$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/hydration.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/queryClient.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
// SID of $queryClient — assigned in the library so that fork({ values })
// can inject it through the object form alongside serialized stores.
const QUERY_CLIENT_SID = '@tanstack/query-effector.$queryClient';
function HydrationProvider({ children, dehydratedQueryClient, serializedScope }) {
    _s();
    const [scope] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"]({
        "HydrationProvider.useState": ()=>{
            const queryClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClient"]({
                defaultOptions: {
                    queries: {
                        retry: false,
                        staleTime: 60_000
                    }
                }
            });
            queryClient.mount();
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$hydration$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["hydrate"])(queryClient, dehydratedQueryClient);
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setQueryClient"])(queryClient);
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fork"])({
                values: {
                    ...serializedScope,
                    [QUERY_CLIENT_SID]: queryClient
                }
            });
        }
    }["HydrationProvider.useState"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Provider"], {
        value: scope,
        children: children
    }, void 0, false, {
        fileName: "[project]/examples/ssr/src/lib/hydration-provider.tsx",
        lineNumber: 55,
        columnNumber: 10
    }, this);
}
_s(HydrationProvider, "EYN7sO0oKMY26qaRTq+a+CysjVA=");
_c = HydrationProvider;
var _c;
__turbopack_context__.k.register(_c, "HydrationProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/react/dist/index.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useInfiniteQuery",
    ()=>useInfiniteQuery,
    "useMutation",
    ()=>useMutation,
    "useQuery",
    ()=>useQuery,
    "useSuspenseInfiniteQuery",
    ()=>useSuspenseInfiniteQuery,
    "useSuspenseQuery",
    ()=>useSuspenseQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector-react@23.3.0_effector@23.4.4_react@19.2.5/node_modules/effector-react/effector-react.mjs [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature(), _s2 = __turbopack_context__.k.signature(), _s3 = __turbopack_context__.k.signature(), _s4 = __turbopack_context__.k.signature(), _s5 = __turbopack_context__.k.signature(), _s6 = __turbopack_context__.k.signature();
;
;
// src/index.ts
function useQuery(query) {
    _s();
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])({
        data: query.$data,
        error: query.$error,
        status: query.$status,
        isPending: query.$isPending,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isError: query.$isError,
        isPlaceholderData: query.$isPlaceholderData,
        fetchStatus: query.$fetchStatus
    });
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.refresh);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useQuery.useEffect": ()=>{
            mount();
            return ({
                "useQuery.useEffect": ()=>unmount()
            })["useQuery.useEffect"];
        }
    }["useQuery.useEffect"], [
        mount,
        unmount
    ]);
    return {
        ...state,
        refresh
    };
}
_s(useQuery, "g4xTpUiMkduebfS/SiBI/iCPu9E=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"]
    ];
});
function useMutation(mutation) {
    _s1();
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])({
        data: mutation.$data,
        error: mutation.$error,
        status: mutation.$status,
        variables: mutation.$variables,
        isPaused: mutation.$isPaused,
        isPending: mutation.$isPending,
        isSuccess: mutation.$isSuccess,
        isError: mutation.$isError,
        isIdle: mutation.$isIdle
    });
    const start = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(mutation.start);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(mutation.unmounted);
    const mutate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(mutation.mutate);
    const mutateWith = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(mutation.mutateWith);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(mutation.reset);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useMutation.useEffect": ()=>{
            start();
            return ({
                "useMutation.useEffect": ()=>unmount()
            })["useMutation.useEffect"];
        }
    }["useMutation.useEffect"], [
        start,
        unmount
    ]);
    return {
        ...state,
        mutate,
        mutateWith,
        reset
    };
}
_s1(useMutation, "61JHKxDurFhCiBkApyj7yXXYNzg=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"]
    ];
});
function useInfiniteQuery(query) {
    _s2();
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])({
        data: query.$data,
        error: query.$error,
        status: query.$status,
        isPending: query.$isPending,
        isFetching: query.$isFetching,
        isSuccess: query.$isSuccess,
        isError: query.$isError,
        isPlaceholderData: query.$isPlaceholderData,
        fetchStatus: query.$fetchStatus,
        hasNextPage: query.$hasNextPage,
        hasPreviousPage: query.$hasPreviousPage,
        isFetchingNextPage: query.$isFetchingNextPage,
        isFetchingPreviousPage: query.$isFetchingPreviousPage,
        isFetchNextPageError: query.$isFetchNextPageError,
        isFetchPreviousPageError: query.$isFetchPreviousPageError
    });
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.refresh);
    const fetchNextPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.fetchNextPage);
    const fetchPreviousPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.fetchPreviousPage);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useInfiniteQuery.useEffect": ()=>{
            mount();
            return ({
                "useInfiniteQuery.useEffect": ()=>unmount()
            })["useInfiniteQuery.useEffect"];
        }
    }["useInfiniteQuery.useEffect"], [
        mount,
        unmount
    ]);
    return {
        ...state,
        refresh,
        fetchNextPage,
        fetchPreviousPage
    };
}
_s2(useInfiniteQuery, "i7Oh4s9tKDpicLJp1cLf3ryONEE=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"]
    ];
});
function useObserverRerender(observer) {
    _s3();
    const [, forceRender] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useReducer"]({
        "useObserverRerender.useReducer": (x)=>x + 1
    }["useObserverRerender.useReducer"], 0);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useObserverRerender.useEffect": ()=>{
            if (!observer) return;
            return observer.subscribe(forceRender);
        }
    }["useObserverRerender.useEffect"], [
        observer
    ]);
}
_s3(useObserverRerender, "UxqsAPbyOOo6jkpO1hjMpCydUI8=");
function useSuspenseQuery(query) {
    _s4();
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useSuspenseQuery.useEffect": ()=>{
            mount();
            return ({
                "useSuspenseQuery.useEffect": ()=>unmount()
            })["useSuspenseQuery.useEffect"];
        }
    }["useSuspenseQuery.useEffect"], [
        mount,
        unmount
    ]);
    const observer = useSuspenseObserver(query);
    useObserverRerender(observer);
    const result = observer.getOptimisticResult(observer.options);
    if (result.status === "error") throw result.error;
    if (result.status === "pending") {
        throw observer.fetchOptimistic(observer.options);
    }
    return result.data;
}
_s4(useSuspenseQuery, "jv/lWdeGCsFpR7GpRzaHW0ilx38=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        useSuspenseObserver,
        useObserverRerender
    ];
});
function useSuspenseInfiniteQuery(query) {
    _s5();
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useSuspenseInfiniteQuery.useEffect": ()=>{
            mount();
            return ({
                "useSuspenseInfiniteQuery.useEffect": ()=>unmount()
            })["useSuspenseInfiniteQuery.useEffect"];
        }
    }["useSuspenseInfiniteQuery.useEffect"], [
        mount,
        unmount
    ]);
    const observer = useSuspenseObserver(query);
    useObserverRerender(observer);
    const result = observer.getOptimisticResult(observer.options);
    if (result.status === "error") throw result.error;
    if (result.status === "pending") {
        throw observer.fetchOptimistic(observer.options);
    }
    return result.data;
}
_s5(useSuspenseInfiniteQuery, "jv/lWdeGCsFpR7GpRzaHW0ilx38=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        useSuspenseObserver,
        useObserverRerender
    ];
});
function useSuspenseObserver(query) {
    _s6();
    const factory = query;
    const observerInScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.$observer);
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(query.$queryClient);
    const queryKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(factory.__resolvedKey);
    const enabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])(factory.__enabled);
    const transient = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"]({
        "useSuspenseObserver.useMemo[transient]": ()=>{
            if (observerInScope || !qc) return null;
            return factory.__createObserver(qc, {
                queryKey,
                enabled
            });
        }
    }["useSuspenseObserver.useMemo[transient]"], [
        observerInScope,
        qc,
        factory
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"]({
        "useSuspenseObserver.useEffect": ()=>{
            if (!transient) return;
            transient.setOptions({
                ...transient.options,
                queryKey,
                enabled
            });
        }
    }["useSuspenseObserver.useEffect"], [
        transient,
        queryKey,
        enabled
    ]);
    const observer = observerInScope ?? transient;
    if (!observer) {
        throw new Error("[@effector-tanstack-query/react] useSuspenseQuery: no QueryClient is set. Call setQueryClient(qc) or pass it to fork({ values: [[$queryClient, qc]] }).");
    }
    return observer;
}
_s6(useSuspenseObserver, "zZFh6r3SyKZiuO01GLoD190QcTQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"]
    ];
});
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/dist/resolve.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveEnabled",
    ()=>resolveEnabled,
    "resolveKey",
    ()=>resolveKey,
    "resolveReactiveRefetchInterval",
    ()=>resolveReactiveRefetchInterval
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-client] (ecmascript)");
;
// src/resolve.ts
function resolveKey(key) {
    const storePositions = [];
    const stores = [];
    key.forEach((item, i)=>{
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["is"].store(item)) {
            storePositions.push(i);
            stores.push(item);
        }
    });
    if (stores.length === 0) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(key);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combine"])(stores).map((values)=>key.map((item, i)=>{
            const storeIdx = storePositions.indexOf(i);
            return storeIdx >= 0 ? values[storeIdx] : item;
        }));
}
function resolveEnabled(enabled) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["is"].store(enabled)) return enabled;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(enabled ?? true);
}
function resolveReactiveRefetchInterval(value) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["is"].store(value) ? value : void 0;
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/dist/createBaseQuery.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBaseQuery",
    ()=>createBaseQuery,
    "sidConfig",
    ()=>sidConfig,
    "warnMissingName",
    ()=>warnMissingName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/resolve.js [app-client] (ecmascript)");
;
;
;
// src/createBaseQuery.ts
var SID_PREFIX = "@tanstack/query-effector";
var warnedNames = /* @__PURE__ */ new Set();
function warnMissingName(role) {
    if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"] === "undefined" || ("TURBOPACK compile-time value", "development") === "production") {
        return;
    }
    if (warnedNames.has(role)) return;
    warnedNames.add(role);
    console.warn(`[@tanstack/query-effector] ${role} created without a "name" \u2014 internal stores will be excluded from serialize(scope). Pass a unique "name" to enable SSR via fork({ values: serialize(scope) }).`);
}
function sidConfig(name, role) {
    if (!name) return {};
    return {
        sid: `${SID_PREFIX}.${name}.${role}`,
        name: `${name}.${role}`
    };
}
function createBaseQuery(explicitClient, options, config) {
    const { name, reactiveRefetchInterval: $reactiveRefetchInterval } = options;
    const $resolvedKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveKey"])(options.queryKey);
    const $enabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveEnabled"])(options.enabled);
    const $effectiveClient = explicitClient ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(explicitClient, {
        serialize: "ignore"
    }) : __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["$queryClient"];
    const dataUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const errorUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const statusUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const isFetchingUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const fetchStatusUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const isPlaceholderDataUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const $data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(void 0, {
        skipVoid: false,
        ...sidConfig(name, "$data")
    }).on(dataUpdated, (_, v)=>v);
    const $error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(null, {
        skipVoid: false,
        ...sidConfig(name, "$error")
    }).on(errorUpdated, (_, v)=>v);
    const $status = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])("pending", {
        ...sidConfig(name, "$status")
    }).on(statusUpdated, (_, v)=>v);
    const $isFetching = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(false, {
        ...sidConfig(name, "$isFetching")
    }).on(isFetchingUpdated, (_, v)=>v);
    const $fetchStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])("idle", {
        ...sidConfig(name, "$fetchStatus")
    }).on(fetchStatusUpdated, (_, v)=>v);
    const $isPlaceholderData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(false, {
        ...sidConfig(name, "$isPlaceholderData")
    }).on(isPlaceholderDataUpdated, (_, v)=>v);
    const $isPending = $status.map((s)=>s === "pending");
    const $isSuccess = $status.map((s)=>s === "success");
    const $isError = $status.map((s)=>s === "error");
    const $observer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(null, {
        serialize: "ignore"
    });
    const observerCreated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    $observer.on(observerCreated, (_, obs)=>obs);
    const observerSubscriptions = /* @__PURE__ */ new WeakMap();
    const extras = config.setupExtras?.();
    extras?.setupEffects?.({
        $observer
    });
    const mountFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attach"])({
        source: {
            qc: $effectiveClient,
            observer: $observer
        },
        effect: ({ qc, observer: existingObserver }, { key, enabled, refetchInterval })=>{
            if (!qc) {
                throw new Error("[@tanstack/query-effector] No QueryClient is set. Call setQueryClient(qc) before mounting, pass it to fork({ values: [[$queryClient, qc]] }), or pass it explicitly to the factory.");
            }
            const observer = existingObserver ?? config.createObserver(qc, {
                queryKey: key,
                enabled
            });
            const dispatchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopeBind"])(dataUpdated, {
                safe: true
            });
            const dispatchError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopeBind"])(errorUpdated, {
                safe: true
            });
            const dispatchStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopeBind"])(statusUpdated, {
                safe: true
            });
            const dispatchIsFetching = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopeBind"])(isFetchingUpdated, {
                safe: true
            });
            const dispatchFetchStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopeBind"])(fetchStatusUpdated, {
                safe: true
            });
            const dispatchIsPlaceholderData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scopeBind"])(isPlaceholderDataUpdated, {
                safe: true
            });
            const dispatchExtras = extras?.bindDispatcher();
            observerSubscriptions.get(observer)?.();
            observer.setOptions({
                ...observer.options,
                queryKey: key,
                enabled,
                // Only override refetchInterval when the user provided a reactive
                // Store — otherwise the static value (or function) from the observer
                // constructor wins.
                ...$reactiveRefetchInterval ? {
                    refetchInterval
                } : {}
            });
            const dispatch = (result)=>{
                dispatchData(result.data);
                dispatchError(result.error);
                dispatchStatus(result.status);
                dispatchIsFetching(result.isFetching);
                dispatchFetchStatus(result.fetchStatus);
                dispatchIsPlaceholderData(result.isPlaceholderData);
                dispatchExtras?.(result);
            };
            const unsubscribe = observer.subscribe(dispatch);
            observerSubscriptions.set(observer, unsubscribe);
            dispatch(observer.getCurrentResult());
            return observer;
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: mountFx.doneData,
        target: observerCreated
    });
    const updateObserverFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attach"])({
        source: $observer,
        effect: (observer, { key, enabled, refetchInterval })=>{
            if (!observer) return;
            const { _defaulted: _d, queryHash: _h, ...baseOptions } = observer.options;
            observer.setOptions({
                ...baseOptions,
                queryKey: key,
                enabled,
                ...$reactiveRefetchInterval ? {
                    refetchInterval
                } : {}
            });
        }
    });
    const mounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const unmounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const $isMounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(false, {
        ...sidConfig(name, "$isMounted")
    }).on(mounted, ()=>true).on(unmounted, ()=>false);
    const $observerOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["combine"])({
        key: $resolvedKey,
        enabled: $enabled,
        refetchInterval: $reactiveRefetchInterval ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(false)
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: mounted,
        source: $observerOptions,
        target: mountFx
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: $observerOptions,
        source: $observerOptions,
        filter: $isMounted,
        target: updateObserverFx
    });
    const observerDestroyed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    $observer.on(observerDestroyed, ()=>null);
    const unmountFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attach"])({
        source: $observer,
        effect: (observer)=>{
            if (!observer) return;
            observerSubscriptions.get(observer)?.();
            observerSubscriptions.delete(observer);
            observer.destroy();
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: unmounted,
        target: unmountFx
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: unmountFx.finally,
        target: observerDestroyed
    });
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const refreshFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attach"])({
        source: {
            qc: $effectiveClient,
            key: $resolvedKey
        },
        effect: ({ qc, key })=>{
            if (!qc) return;
            return qc.invalidateQueries({
                queryKey: key
            });
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: refresh,
        target: refreshFx
    });
    return {
        $data,
        $error,
        $status,
        $isPending,
        $isFetching,
        $isSuccess,
        $isError,
        $isPlaceholderData,
        $fetchStatus,
        $observer,
        $queryClient: $effectiveClient,
        $resolvedKey,
        $enabled,
        refresh,
        mounted,
        unmounted,
        ...extras?.stores ?? {}
    };
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/packages/core/dist/createQuery.js [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createQuery",
    ()=>createQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryObserver$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/queryObserver.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createBaseQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/createBaseQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/resolve.js [app-client] (ecmascript)");
;
;
;
;
// src/createQuery.ts
function createQuery(arg1, arg2) {
    const [explicitClient, options] = parseQueryArgs(arg1, arg2);
    const { queryKey, enabled, name, ...restOptions } = options;
    if (!name) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createBaseQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["warnMissingName"])("createQuery");
    const reactiveRefetchInterval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["resolveReactiveRefetchInterval"])(restOptions.refetchInterval);
    if (reactiveRefetchInterval) {
        delete restOptions.refetchInterval;
    }
    const base = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createBaseQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createBaseQuery"])(explicitClient, {
        queryKey,
        enabled,
        name,
        reactiveRefetchInterval
    }, {
        createObserver: (qc, { queryKey: key, enabled: isEnabled })=>// Cast: restOptions's `refetchInterval` may still type as
            // `Store | number | false | fn`; the Store form is deleted at runtime
            // above, but TS can't narrow that here.
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryObserver$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryObserver"](qc, {
                ...restOptions,
                queryKey: key,
                enabled: isEnabled
            })
    });
    const prefetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
    const prefetchFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["attach"])({
        source: {
            qc: base.$queryClient,
            key: base.$resolvedKey,
            enabled: base.$enabled
        },
        effect: ({ qc, key, enabled: enabled2 })=>{
            if (!qc || !enabled2) return;
            return qc.fetchQuery({
                ...restOptions,
                queryKey: key
            });
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sample"])({
        clock: prefetch,
        target: prefetchFx
    });
    const result = {
        $data: base.$data,
        $error: base.$error,
        $status: base.$status,
        $isPending: base.$isPending,
        $isFetching: base.$isFetching,
        $isSuccess: base.$isSuccess,
        $isError: base.$isError,
        $isPlaceholderData: base.$isPlaceholderData,
        $fetchStatus: base.$fetchStatus,
        $observer: base.$observer,
        $queryClient: base.$queryClient,
        refresh: base.refresh,
        prefetch,
        mounted: base.mounted,
        unmounted: base.unmounted
    };
    Object.defineProperty(result, "__createObserver", {
        enumerable: false,
        value: (qc, init)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryObserver$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryObserver"](qc, {
                ...restOptions,
                queryKey: init.queryKey,
                enabled: init.enabled
            })
    });
    Object.defineProperty(result, "__resolvedKey", {
        enumerable: false,
        value: base.$resolvedKey
    });
    Object.defineProperty(result, "__enabled", {
        enumerable: false,
        value: base.$enabled
    });
    return result;
}
function parseQueryArgs(arg1, arg2) {
    if (arg2 !== void 0) {
        return [
            arg1,
            arg2
        ];
    }
    return [
        null,
        arg1
    ];
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/examples/ssr/src/model/api.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/examples/ssr/src/model/queries.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/createQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/api.ts [app-client] (ecmascript)");
;
;
;
const pageChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
const $page = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])(0).on(pageChanged, (_, p)=>p);
const PAGE_SIZE = 20;
const listQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createQuery"])({
    name: 'ssr.list',
    queryKey: [
        'pokemon-list',
        $page
    ],
    queryFn: ({ queryKey })=>{
        const page = queryKey[1];
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchPokemonList"])(PAGE_SIZE, page * PAGE_SIZE);
    },
    staleTime: 60_000
});
const nameChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createEvent"])();
const $name = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createStore"])('pikachu').on(nameChanged, (_, n)=>n);
const pokemonQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createQuery"])({
    name: 'ssr.pokemon',
    queryKey: [
        'pokemon',
        $name
    ],
    queryFn: ({ queryKey })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["fetchPokemonByName"])(queryKey[1]),
    staleTime: 60_000
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/examples/ssr/app/page.client.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageBody",
    ()=>PageBody
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector-react@23.3.0_effector@23.4.4_react@19.2.5/node_modules/effector-react/effector-react.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/react/dist/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/queries.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
;
function PageBody() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "main",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "SSR example — effector-tanstack-query"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "muted",
                children: [
                    "Both queries are ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                        children: "prefetched on the server"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 20,
                        columnNumber: 26
                    }, this),
                    ' via the per-request scope, then hydrated on the client. There\'s no loading flash on initial paint — open DevTools "Network", reload, and watch the first paint already have data.'
                ]
            }, void 0, true, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 19,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "muted",
                children: "Once hydrated, the queries are reactive: change the dropdown / page and the model re-fetches via the client's QueryClient."
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SinglePokemon, {}, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PokemonList, {}, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "How it's wired"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
                children: `// server (app/page.tsx)
const { queryClient, scope } = makeRequestScope()
await prefetch(scope, queryClient, [listQuery.mounted, pokemonQuery.mounted])
const { dehydratedQueryClient, serializedScope } = serializeBoth(...)

// client (hydration-provider.tsx)
const scope = fork({
  values: {
    ...serializedScope,
    '@tanstack/query-effector.$queryClient': queryClient,
  }
})
<Provider value={scope}>{children}</Provider>`
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/examples/ssr/app/page.client.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
_c = PageBody;
function SinglePokemon() {
    _s();
    const { data, isPending, isFetching, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pokemonQuery"]);
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])([
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["$name"],
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["nameChanged"]
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Single pokemon (reactive name)"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: "name:"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: name,
                        onChange: (e)=>setName(e.target.value),
                        children: [
                            'pikachu',
                            'bulbasaur',
                            'charmander',
                            'squirtle',
                            'mewtwo'
                        ].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                value: n,
                                children: n
                            }, n, false, {
                                fileName: "[project]/examples/ssr/app/page.client.tsx",
                                lineNumber: 63,
                                columnNumber: 15
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 60,
                        columnNumber: 9
                    }, this),
                    isFetching && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "badge pending",
                        children: "fetching…"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 69,
                        columnNumber: 24
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 58,
                columnNumber: 7
            }, this),
            isPending && !data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Loading…"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 71,
                columnNumber: 30
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: error.message
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 72,
                columnNumber: 17
            }, this),
            data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "row",
                style: {
                    marginTop: 12
                },
                children: [
                    data.sprites.front_default && // eslint-disable-next-line @next/next/no-img-element
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: data.sprites.front_default,
                        alt: data.name,
                        width: 96
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 77,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: data.name
                            }, void 0, false, {
                                fileName: "[project]/examples/ssr/app/page.client.tsx",
                                lineNumber: 80,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "muted",
                                children: [
                                    "height ",
                                    data.height,
                                    " · weight ",
                                    data.weight
                                ]
                            }, void 0, true, {
                                fileName: "[project]/examples/ssr/app/page.client.tsx",
                                lineNumber: 81,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "muted",
                                children: [
                                    "types: ",
                                    data.types.map((t)=>t.type.name).join(', ')
                                ]
                            }, void 0, true, {
                                fileName: "[project]/examples/ssr/app/page.client.tsx",
                                lineNumber: 84,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 79,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 74,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/examples/ssr/app/page.client.tsx",
        lineNumber: 56,
        columnNumber: 5
    }, this);
}
_s(SinglePokemon, "3vIn4hfoY7tMytIjQ0CruARrBgI=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"]
    ];
});
_c1 = SinglePokemon;
function PokemonList() {
    _s1();
    const { data, isFetching } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["listQuery"]);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"])([
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["$page"],
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["pageChanged"]
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Paginated list (reactive page)"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setPage(Math.max(0, page - 1)),
                        disabled: page === 0 || isFetching,
                        children: "← prev"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "page ",
                            page + 1,
                            " (offset ",
                            page * __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PAGE_SIZE"],
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setPage(page + 1),
                        disabled: isFetching,
                        children: "next →"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    isFetching && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "badge pending",
                        children: "fetching…"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 114,
                        columnNumber: 24
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "list",
                style: {
                    marginTop: 12
                },
                children: data.results.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "list-item",
                        children: p.name
                    }, p.name, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 119,
                        columnNumber: 13
                    }, this))
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 117,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/examples/ssr/app/page.client.tsx",
        lineNumber: 99,
        columnNumber: 5
    }, this);
}
_s1(PokemonList, "wKCK5jzucW48c9JkaS4xxXT6fyU=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useUnit"]
    ];
});
_c2 = PokemonList;
var _c, _c1, _c2;
__turbopack_context__.k.register(_c, "PageBody");
__turbopack_context__.k.register(_c1, "SinglePokemon");
__turbopack_context__.k.register(_c2, "PokemonList");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0id9jk7._.js.map