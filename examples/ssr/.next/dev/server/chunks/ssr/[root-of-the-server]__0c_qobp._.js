module.exports = [
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/packages/core/dist/queryClient.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "$queryClient",
    ()=>$queryClient,
    "setQueryClient",
    ()=>setQueryClient
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
;
// src/queryClient.ts
var $queryClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(null, {
    name: "@tanstack/query-effector.$queryClient",
    sid: "@tanstack/query-effector.$queryClient",
    // Carries a runtime-only object (`QueryClient` instance) — must not
    // round-trip through `serialize(scope)`. Per-scope injection happens
    // via `fork({ values: [[$queryClient, qc]] })` instead.
    serialize: "ignore"
});
var setQueryClient = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
$queryClient.on(setQueryClient, (_, qc)=>qc);
;
}),
"[project]/packages/core/dist/resolve.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "resolveEnabled",
    ()=>resolveEnabled,
    "resolveKey",
    ()=>resolveKey,
    "resolveReactiveRefetchInterval",
    ()=>resolveReactiveRefetchInterval
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
;
// src/resolve.ts
function resolveKey(key) {
    const storePositions = [];
    const stores = [];
    key.forEach((item, i)=>{
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["is"].store(item)) {
            storePositions.push(i);
            stores.push(item);
        }
    });
    if (stores.length === 0) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(key);
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["combine"])(stores).map((values)=>key.map((item, i)=>{
            const storeIdx = storePositions.indexOf(i);
            return storeIdx >= 0 ? values[storeIdx] : item;
        }));
}
function resolveEnabled(enabled) {
    if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["is"].store(enabled)) return enabled;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(enabled ?? true);
}
function resolveReactiveRefetchInterval(value) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["is"].store(value) ? value : void 0;
}
;
}),
"[project]/packages/core/dist/createBaseQuery.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createBaseQuery",
    ()=>createBaseQuery,
    "sidConfig",
    ()=>sidConfig,
    "warnMissingName",
    ()=>warnMissingName
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/queryClient.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/resolve.js [app-rsc] (ecmascript)");
;
;
;
// src/createBaseQuery.ts
var SID_PREFIX = "@tanstack/query-effector";
var warnedNames = /* @__PURE__ */ new Set();
function warnMissingName(role) {
    if (typeof process === "undefined" || ("TURBOPACK compile-time value", "development") === "production") {
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
    const $resolvedKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveKey"])(options.queryKey);
    const $enabled = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveEnabled"])(options.enabled);
    const $effectiveClient = explicitClient ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(explicitClient, {
        serialize: "ignore"
    }) : __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$queryClient"];
    const dataUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const errorUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const statusUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const isFetchingUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const fetchStatusUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const isPlaceholderDataUpdated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const $data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(void 0, {
        skipVoid: false,
        ...sidConfig(name, "$data")
    }).on(dataUpdated, (_, v)=>v);
    const $error = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(null, {
        skipVoid: false,
        ...sidConfig(name, "$error")
    }).on(errorUpdated, (_, v)=>v);
    const $status = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])("pending", {
        ...sidConfig(name, "$status")
    }).on(statusUpdated, (_, v)=>v);
    const $isFetching = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(false, {
        ...sidConfig(name, "$isFetching")
    }).on(isFetchingUpdated, (_, v)=>v);
    const $fetchStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])("idle", {
        ...sidConfig(name, "$fetchStatus")
    }).on(fetchStatusUpdated, (_, v)=>v);
    const $isPlaceholderData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(false, {
        ...sidConfig(name, "$isPlaceholderData")
    }).on(isPlaceholderDataUpdated, (_, v)=>v);
    const $isPending = $status.map((s)=>s === "pending");
    const $isSuccess = $status.map((s)=>s === "success");
    const $isError = $status.map((s)=>s === "error");
    const $observer = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(null, {
        serialize: "ignore"
    });
    const observerCreated = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    $observer.on(observerCreated, (_, obs)=>obs);
    const observerSubscriptions = /* @__PURE__ */ new WeakMap();
    const extras = config.setupExtras?.();
    extras?.setupEffects?.({
        $observer
    });
    const mountFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attach"])({
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
            const dispatchData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scopeBind"])(dataUpdated, {
                safe: true
            });
            const dispatchError = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scopeBind"])(errorUpdated, {
                safe: true
            });
            const dispatchStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scopeBind"])(statusUpdated, {
                safe: true
            });
            const dispatchIsFetching = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scopeBind"])(isFetchingUpdated, {
                safe: true
            });
            const dispatchFetchStatus = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scopeBind"])(fetchStatusUpdated, {
                safe: true
            });
            const dispatchIsPlaceholderData = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["scopeBind"])(isPlaceholderDataUpdated, {
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
        clock: mountFx.doneData,
        target: observerCreated
    });
    const updateObserverFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attach"])({
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
    const mounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const unmounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const $isMounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(false, {
        ...sidConfig(name, "$isMounted")
    }).on(mounted, ()=>true).on(unmounted, ()=>false);
    const $observerOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["combine"])({
        key: $resolvedKey,
        enabled: $enabled,
        refetchInterval: $reactiveRefetchInterval ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(false)
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
        clock: mounted,
        source: $observerOptions,
        target: mountFx
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
        clock: $observerOptions,
        source: $observerOptions,
        filter: $isMounted,
        target: updateObserverFx
    });
    const observerDestroyed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    $observer.on(observerDestroyed, ()=>null);
    const unmountFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attach"])({
        source: $observer,
        effect: (observer)=>{
            if (!observer) return;
            observerSubscriptions.get(observer)?.();
            observerSubscriptions.delete(observer);
            observer.destroy();
        }
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
        clock: unmounted,
        target: unmountFx
    });
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
        clock: unmountFx.finally,
        target: observerDestroyed
    });
    const refresh = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const refreshFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attach"])({
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
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
}),
"[project]/packages/core/dist/createQuery.js [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createQuery",
    ()=>createQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/effector@23.4.4/node_modules/effector/effector.mjs [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryObserver$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/.pnpm/@tanstack+query-core@5.100.6/node_modules/@tanstack/query-core/build/modern/queryObserver.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createBaseQuery$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/createBaseQuery.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/resolve.js [app-rsc] (ecmascript)");
;
;
;
;
// src/createQuery.ts
function createQuery(arg1, arg2) {
    const [explicitClient, options] = parseQueryArgs(arg1, arg2);
    const { queryKey, enabled, name, ...restOptions } = options;
    if (!name) (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createBaseQuery$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["warnMissingName"])("createQuery");
    const reactiveRefetchInterval = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$resolve$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["resolveReactiveRefetchInterval"])(restOptions.refetchInterval);
    if (reactiveRefetchInterval) {
        delete restOptions.refetchInterval;
    }
    const base = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createBaseQuery$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createBaseQuery"])(explicitClient, {
        queryKey,
        enabled,
        name,
        reactiveRefetchInterval
    }, {
        createObserver: (qc, { queryKey: key, enabled: isEnabled })=>// Cast: restOptions's `refetchInterval` may still type as
            // `Store | number | false | fn`; the Store form is deleted at runtime
            // above, but TS can't narrow that here.
            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryObserver$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["QueryObserver"](qc, {
                ...restOptions,
                queryKey: key,
                enabled: isEnabled
            })
    });
    const prefetch = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
    const prefetchFx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["attach"])({
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
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["sample"])({
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
        value: (qc, init)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$tanstack$2b$query$2d$core$40$5$2e$100$2e$6$2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryObserver$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["QueryObserver"](qc, {
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
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createQuery$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/createQuery.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/api.ts [app-rsc] (ecmascript)");
;
;
;
const pageChanged = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createEvent"])();
const $page = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$effector$40$23$2e$4$2e$4$2f$node_modules$2f$effector$2f$effector$2e$mjs__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createStore"])(0).on(pageChanged, (_, p)=>p);
const PAGE_SIZE = 20;
const listQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createQuery$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createQuery"])({
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
const pokemonQuery = (0, __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$createQuery$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createQuery"])({
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
var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/packages/core/dist/queryClient.js [app-rsc] (ecmascript)");
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
                __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$core$2f$dist$2f$queryClient$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["$queryClient"],
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
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$model$2f$queries$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/model/queries.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$server$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/lib/server.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/src/lib/hydration-provider.tsx [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/examples/ssr/app/page.client.tsx [app-rsc] (ecmascript)");
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$src$2f$lib$2f$hydration$2d$provider$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["HydrationProvider"], {
        dehydratedQueryClient: dehydratedQueryClient,
        serializedScope: serializedScope,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$2$2e$6_$40$babel$2b$core$40$7$2e$29$2e$0_react$2d$dom$40$19$2e$2$2e$5_react$40$19$2e$2$2e$5_$5f$react$40$19$2e$2$2e$5$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$examples$2f$ssr$2f$app$2f$page$2e$client$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["PageBody"], {}, void 0, false, {
            fileName: "[project]/examples/ssr/app/page.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/examples/ssr/app/page.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
}),
"[project]/examples/ssr/app/page.tsx [app-rsc] (ecmascript, Next.js Server Component)", ((__turbopack_context__) => {

__turbopack_context__.n(__turbopack_context__.i("[project]/examples/ssr/app/page.tsx [app-rsc] (ecmascript)"));
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0c_qobp._.js.map