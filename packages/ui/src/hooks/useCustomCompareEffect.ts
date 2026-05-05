import type { DependencyList } from "react"
import { useEffect, useRef } from "react"
import type { DependenciesComparator, EffectCallback, EffectHook } from "./util"
import { basicDepsComparator, isBrowser } from "./util"

export function useCustomCompareEffect<
  Callback extends EffectCallback = EffectCallback,
  Deps extends DependencyList = DependencyList,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  HookRestArgs extends any[] = any[],
  R extends HookRestArgs = HookRestArgs,
>(
  callback: Callback,
  deps: Deps,
  comparator: DependenciesComparator<Deps> = basicDepsComparator,
  effectHook: EffectHook<Callback, Deps, HookRestArgs> = useEffect,
  ...effectHookRestArgs: R
): void {
  const dependencies = useRef<Deps>(undefined)

  if (
    dependencies.current === undefined ||
    (isBrowser && !comparator(dependencies.current, deps))
  ) {
    dependencies.current = deps
  }

  effectHook(callback, dependencies.current, ...effectHookRestArgs)
}
