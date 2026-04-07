/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DependencyList } from "react"

export type DependenciesComparator<
  Deps extends DependencyList = DependencyList,
> = (a: Deps, b: Deps) => boolean

export type Predicate = (previous: any, next: any) => boolean

export type ConditionsList = readonly any[]

export type ConditionsPredicate<Cond extends ConditionsList = ConditionsList> =
  (conditions: Cond) => boolean

export const noop = (): void => {
  /* noop */
}

export const isBrowser =
  typeof globalThis !== "undefined" &&
  typeof navigator !== "undefined" &&
  typeof document !== "undefined"

export const isStrictEqual: Predicate = (previous: any, next: any): boolean =>
  previous === next

export const truthyAndArrayPredicate: ConditionsPredicate = (
  conditions,
): boolean => conditions.every(Boolean)

export const truthyOrArrayPredicate: ConditionsPredicate = (
  conditions,
): boolean => conditions.some(Boolean)

export function on<T extends EventTarget>(
  object: T | null,
  ...args:
    | Parameters<T["addEventListener"]>
    | [string, EventListenerOrEventListenerObject | CallableFunction, ...any]
): void {
  object?.addEventListener?.(
    ...(args as Parameters<HTMLElement["addEventListener"]>),
  )
}

export function off<T extends EventTarget>(
  object: T | null,
  ...args:
    | Parameters<T["removeEventListener"]>
    | [string, EventListenerOrEventListenerObject | CallableFunction, ...any]
): void {
  object?.removeEventListener?.(
    ...(args as Parameters<HTMLElement["removeEventListener"]>),
  )
}

export const hasOwnProperty = <
  T extends Record<string | number | symbol, any>,
  K extends string | number | symbol,
>(
  object: T,
  property: K,
): object is T & Record<K, unknown> =>
  Object.prototype.hasOwnProperty.call(object, property)

export const yieldTrue = () => true as const
export const yieldFalse = () => false as const

export const basicDepsComparator: DependenciesComparator = (d1, d2) => {
  if (d1 === d2) {
    return true
  }

  if (d1.length !== d2.length) {
    return false
  }

  for (const [i, element] of d1.entries()) {
    if (element !== d2[i]) {
      return false
    }
  }

  return true
}

export type EffectCallback = (...args: any[]) => any

export type EffectHook<
  Callback extends EffectCallback = EffectCallback,
  Deps extends DependencyList | undefined = DependencyList | undefined,
  RestArgs extends any[] = any[],
> =
  | ((...args: [Callback, Deps, ...RestArgs]) => void)
  | ((...args: [Callback, Deps]) => void)

type StateInitializerFN<State> = () => State
type StateUpdaterFN<State, PreviousState = State> = (
  previousState: PreviousState,
) => State

export type InitialState<State> = State | StateInitializerFN<State>
export type NextState<State, PreviousState = State> =
  | State
  | StateUpdaterFN<State, PreviousState>

function initState<State>(initialState: InitialState<State>): State {
  if (typeof initialState === "function") {
    initialState = (initialState as StateInitializerFN<State>)()
  }
  return initialState
}

function updateState<State, PreviousState = State>(
  nextState: NextState<State, PreviousState>,
  previousState: PreviousState,
): State {
  if (typeof nextState === "function") {
    return (nextState as StateUpdaterFN<State, PreviousState>)(previousState)
  }
  return nextState
}

export function resolveHookState<State, PreviousState = State>(
  ...args:
    | Parameters<typeof initState<State>>
    | Parameters<typeof updateState<State, PreviousState>>
) {
  if (args.length === 1) {
    return initState(args[0])
  }
  return updateState(args[0], args[1])
}
