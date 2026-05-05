import type {
  UseStorageValueOptions,
  UseStorageValueResult,
} from "./useStorageValue"
import { useStorageValue } from "./useStorageValue"
import { isBrowser, noop } from "./util"

let IS_LOCAL_STORAGE_AVAILABLE: boolean

try {
  IS_LOCAL_STORAGE_AVAILABLE = isBrowser && Boolean(globalThis.localStorage)
} catch {
  IS_LOCAL_STORAGE_AVAILABLE = false
}

type UseLocalStorageValue = <
  Type,
  Default extends Type = Type,
  Initialize extends boolean | undefined = boolean | undefined,
>(
  key: string,
  options?: UseStorageValueOptions<Type, Initialize>,
) => UseStorageValueResult<Type, Default, Initialize>

export const useLocalStorageValue: UseLocalStorageValue =
  IS_LOCAL_STORAGE_AVAILABLE
    ? (key, options) => useStorageValue(localStorage, key, options)
    : <
        Type,
        Default extends Type = Type,
        Initialize extends boolean | undefined = boolean | undefined,
      >(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _key: string,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        _options?: UseStorageValueOptions<Type, Initialize>,
      ): UseStorageValueResult<Type, Default, Initialize> => {
        return {
          value: undefined as Type,
          set: noop,
          remove: noop,
          fetch: noop,
        }
      }
