import { createStore } from "zustand/vanilla"

export type ToastKind =
  | "default"
  | "success"
  | "error"
  | "warning"
  | "info"
  | "loading"

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface Toast {
  id: string
  kind: ToastKind
  message: React.ReactNode
  description?: React.ReactNode
  duration?: number
  action?: ToastAction
  cancel?: ToastAction
  /** for toast.custom — render arbitrary JSX */
  custom?: React.ReactNode
}

export interface ToastOptions {
  id?: string
  description?: React.ReactNode
  duration?: number
  action?: ToastAction
  cancel?: ToastAction
}

interface ToastStoreState {
  toasts: Toast[]
}

interface ToastStoreApi {
  add: (toast: Toast) => string
  dismiss: (id?: string) => void
  update: (id: string, patch: Partial<Toast>) => void
}

import * as React from "react"

let nextId = 0
function generateId(): string {
  nextId += 1
  return `t${Date.now().toString(36)}-${nextId}`
}

export const toastStore = createStore<ToastStoreState>(() => ({
  toasts: [],
}))

const api: ToastStoreApi = {
  add(toast: Toast) {
    toastStore.setState((state) => ({
      toasts: [...state.toasts, toast],
    }))
    return toast.id
  },
  dismiss(id?: string) {
    toastStore.setState((state) => ({
      toasts: id === undefined ? [] : state.toasts.filter((t) => t.id !== id),
    }))
  },
  update(id: string, patch: Partial<Toast>) {
    toastStore.setState((state) => ({
      toasts: state.toasts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }))
  },
}

function emit(
  kind: ToastKind,
  message: React.ReactNode,
  options: ToastOptions = {},
): string {
  const id = options.id ?? generateId()
  api.add({
    id,
    kind,
    message,
    description: options.description,
    duration: options.duration,
    action: options.action,
    cancel: options.cancel,
  })
  return id
}

interface PromiseMessages<T> {
  loading: React.ReactNode
  success: React.ReactNode | ((data: T) => React.ReactNode)
  error: React.ReactNode | ((error: unknown) => React.ReactNode)
  description?: React.ReactNode
  duration?: number
}

interface ToastFn {
  (message: React.ReactNode, options?: ToastOptions): string
  success: (message: React.ReactNode, options?: ToastOptions) => string
  error: (message: React.ReactNode, options?: ToastOptions) => string
  warning: (message: React.ReactNode, options?: ToastOptions) => string
  info: (message: React.ReactNode, options?: ToastOptions) => string
  loading: (message: React.ReactNode, options?: ToastOptions) => string
  dismiss: (id?: string) => void
  custom: (jsx: React.ReactNode, options?: ToastOptions) => string
  promise: <T>(promise: Promise<T>, messages: PromiseMessages<T>) => Promise<T>
}

const baseToast = ((message: React.ReactNode, options?: ToastOptions) =>
  emit("default", message, options)) as ToastFn

baseToast.success = (message, options) => emit("success", message, options)
baseToast.error = (message, options) => emit("error", message, options)
baseToast.warning = (message, options) => emit("warning", message, options)
baseToast.info = (message, options) => emit("info", message, options)
baseToast.loading = (message, options) => emit("loading", message, options)
baseToast.dismiss = (id) => api.dismiss(id)
baseToast.custom = (jsx, options) => {
  const id = options?.id ?? generateId()
  api.add({
    id,
    kind: "default",
    message: null,
    custom: jsx,
    duration: options?.duration,
    description: options?.description,
    action: options?.action,
    cancel: options?.cancel,
  })
  return id
}

baseToast.promise = function promise<T>(
  promise: Promise<T>,
  messages: PromiseMessages<T>,
): Promise<T> {
  const id = generateId()
  api.add({
    id,
    kind: "loading",
    message: messages.loading,
    description: messages.description,
    duration: messages.duration,
  })
  return promise
    .then((value) => {
      const next =
        typeof messages.success === "function"
          ? (messages.success as (data: T) => React.ReactNode)(value)
          : messages.success
      api.update(id, { kind: "success", message: next })
      return value
    })
    .catch((err) => {
      const next =
        typeof messages.error === "function"
          ? (messages.error as (error: unknown) => React.ReactNode)(err)
          : messages.error
      api.update(id, { kind: "error", message: next })
      throw err
    })
}

export const toast = baseToast
