import type { DependencyList } from "react"
import { useEffect } from "react"
import { useCustomCompareEffect } from "./use-custom-compare-effect"
import type { EffectCallback, EffectHook } from "./util"

function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (a === null || b === null) return false
  if (typeof a !== "object" || typeof b !== "object") return false

  if (a instanceof Date && b instanceof Date) return a.getTime() === b.getTime()
  if (a instanceof RegExp && b instanceof RegExp)
    return a.source === b.source && a.flags === b.flags

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false

  for (const key of aKeys) {
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false
    if (!deepEqual(aObj[key], bObj[key])) return false
  }

  return true
}

const depsDeepEqual = (a: DependencyList, b: DependencyList): boolean =>
  deepEqual(a, b)

export function useDeepCompareEffect<
  Callback extends EffectCallback = EffectCallback,
  Deps extends DependencyList = DependencyList,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HookRestArgs extends any[] = any[],
  R extends HookRestArgs = HookRestArgs,
>(
  callback: Callback,
  deps: Deps,
  effectHook: EffectHook<Callback, Deps, HookRestArgs> = useEffect,
  ...effectHookRestArgs: R
): void {
  useCustomCompareEffect(
    callback,
    deps,
    depsDeepEqual,
    effectHook,
    ...effectHookRestArgs,
  )
}
