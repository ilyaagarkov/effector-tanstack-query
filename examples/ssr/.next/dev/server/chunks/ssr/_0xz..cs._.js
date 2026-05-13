module.exports = [
"[project]/examples/ssr/src/lib/hydration-provider.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HydrationProvider",
    ()=>HydrationProvider
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector-react@23.3.0_effector@23.4.4_react@19.2.5/node_modules/effector-react/effector-react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$hydration$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/hydration.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@effector-tanstack-query/core'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
'use client';
;
;
;
;
;
;
// SID of $queryClient — assigned in the library so that fork({ values })
// can inject it through the object form alongside serialized stores.
const QUERY_CLIENT_SID = '@tanstack/query-effector.$queryClient';
function HydrationProvider({ children, dehydratedQueryClient, serializedScope }) {
    const [scope] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](()=>{
        const queryClient = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClient"]({
            defaultOptions: {
                queries: {
                    retry: false,
                    staleTime: 60_000
                }
            }
        });
        queryClient.mount();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$hydration$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["hydrate"])(queryClient, dehydratedQueryClient);
        setQueryClient(queryClient);
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fork"])({
            values: {
                ...serializedScope,
                [QUERY_CLIENT_SID]: queryClient
            }
        });
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"], {
        value: scope,
        children: children
    }, void 0, false, {
        fileName: "[project]/examples/ssr/src/lib/hydration-provider.tsx",
        lineNumber: 55,
        columnNumber: 10
    }, this);
}
}),
"[project]/packages/react/dist/index.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector-react@23.3.0_effector@23.4.4_react@19.2.5/node_modules/effector-react/effector-react.mjs [app-ssr] (ecmascript)");
;
;
// src/index.ts
function useQuery(query) {
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])({
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
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.refresh);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        mount();
        return ()=>unmount();
    }, [
        mount,
        unmount
    ]);
    return {
        ...state,
        refresh
    };
}
function useMutation(mutation) {
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])({
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
    const start = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(mutation.start);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(mutation.unmounted);
    const mutate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(mutation.mutate);
    const mutateWith = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(mutation.mutateWith);
    const reset = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(mutation.reset);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        start();
        return ()=>unmount();
    }, [
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
function useInfiniteQuery(query) {
    const state = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])({
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
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.refresh);
    const fetchNextPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.fetchNextPage);
    const fetchPreviousPage = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.fetchPreviousPage);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        mount();
        return ()=>unmount();
    }, [
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
function useObserverRerender(observer) {
    const [, forceRender] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useReducer"]((x)=>x + 1, 0);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!observer) return;
        return observer.subscribe(forceRender);
    }, [
        observer
    ]);
}
function useSuspenseQuery(query) {
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        mount();
        return ()=>unmount();
    }, [
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
function useSuspenseInfiniteQuery(query) {
    const mount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.mounted);
    const unmount = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.unmounted);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        mount();
        return ()=>unmount();
    }, [
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
function useSuspenseObserver(query) {
    const factory = query;
    const observerInScope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.$observer);
    const qc = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(query.$queryClient);
    const queryKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(factory.__resolvedKey);
    const enabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])(factory.__enabled);
    const transient = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"](()=>{
        if (observerInScope || !qc) return null;
        return factory.__createObserver(qc, {
            queryKey,
            enabled
        });
    }, [
        observerInScope,
        qc,
        factory
    ]);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        if (!transient) return;
        transient.setOptions({
            ...transient.options,
            queryKey,
            enabled
        });
    }, [
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
;
}),
"[project]/examples/ssr/src/model/api.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
"[project]/examples/ssr/src/model/queries.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-ssr] (ecmascript)");
(()=>{
    const e = new Error("Cannot find module '@effector-tanstack-query/core'");
    e.code = 'MODULE_NOT_FOUND';
    throw e;
})();
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/api.ts [app-ssr] (ecmascript)");
;
;
;
const pageChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createEvent"])();
const $page = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createStore"])(0).on(pageChanged, (_, p)=>p);
const PAGE_SIZE = 20;
const listQuery = createQuery({
    name: 'ssr.list',
    queryKey: [
        'pokemon-list',
        $page
    ],
    queryFn: ({ queryKey })=>{
        const page = queryKey[1];
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchPokemonList"])(PAGE_SIZE, page * PAGE_SIZE);
    },
    staleTime: 60_000
});
const nameChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createEvent"])();
const $name = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createStore"])('pikachu').on(nameChanged, (_, n)=>n);
const pokemonQuery = createQuery({
    name: 'ssr.pokemon',
    queryKey: [
        'pokemon',
        $name
    ],
    queryFn: ({ queryKey })=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["fetchPokemonByName"])(queryKey[1]),
    staleTime: 60_000
});
}),
"[project]/examples/ssr/app/page.client.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageBody",
    ()=>PageBody
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/next@16.2.6_@babel+core@7.29.0_react-dom@19.2.5_react@19.2.5__react@19.2.5/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector-react@23.3.0_effector@23.4.4_react@19.2.5/node_modules/effector-react/effector-react.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/react/dist/index.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/queries.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
function PageBody() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
        className: "main",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                children: "SSR example — effector-tanstack-query"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 18,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "muted",
                children: [
                    "Both queries are ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "muted",
                children: "Once hydrated, the queries are reactive: change the dropdown / page and the model re-fetches via the client's QueryClient."
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(SinglePokemon, {}, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(PokemonList, {}, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                children: "How it's wired"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("pre", {
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
function SinglePokemon() {
    const { data, isPending, isFetching, error } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pokemonQuery"]);
    const [name, setName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])([
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["$name"],
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["nameChanged"]
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Single pokemon (reactive name)"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                        children: "name:"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 59,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                        value: name,
                        onChange: (e)=>setName(e.target.value),
                        children: [
                            'pikachu',
                            'bulbasaur',
                            'charmander',
                            'squirtle',
                            'mewtwo'
                        ].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
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
                    isFetching && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            isPending && !data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Loading…"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 71,
                columnNumber: 30
            }, this),
            error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: error.message
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 72,
                columnNumber: 17
            }, this),
            data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "row",
                style: {
                    marginTop: 12
                },
                children: [
                    data.sprites.front_default && // eslint-disable-next-line @next/next/no-img-element
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                        src: data.sprites.front_default,
                        alt: data.name,
                        width: 96
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 77,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                children: data.name
                            }, void 0, false, {
                                fileName: "[project]/examples/ssr/app/page.client.tsx",
                                lineNumber: 80,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
function PokemonList() {
    const { data, isFetching } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$react$2f$dist$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useQuery"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["listQuery"]);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$2d$react$40$23$2e$3$2e$0_effector$40$23$2e$4$2e$4_react$40$19$2e$2$2e$5$2f$node_modules$2f$effector$2d$react$2f$effector$2d$react$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useUnit"])([
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["$page"],
        __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["pageChanged"]
    ]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "card",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                children: "Paginated list (reactive page)"
            }, void 0, false, {
                fileName: "[project]/examples/ssr/app/page.client.tsx",
                lineNumber: 100,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "row",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setPage(Math.max(0, page - 1)),
                        disabled: page === 0 || isFetching,
                        children: "← prev"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 102,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        children: [
                            "page ",
                            page + 1,
                            " (offset ",
                            page * __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["PAGE_SIZE"],
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 108,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setPage(page + 1),
                        disabled: isFetching,
                        children: "next →"
                    }, void 0, false, {
                        fileName: "[project]/examples/ssr/app/page.client.tsx",
                        lineNumber: 111,
                        columnNumber: 9
                    }, this),
                    isFetching && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
            data && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "list",
                style: {
                    marginTop: 12
                },
                children: data.results.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
}),
];

//# sourceMappingURL=_0xz..cs._.js.map