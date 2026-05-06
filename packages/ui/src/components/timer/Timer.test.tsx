import { render, screen, act } from "@testing-library/react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  Timer,
  TimerActionTrigger,
  TimerArea,
  TimerControl,
  TimerItem,
  TimerSeparator,
} from "./Timer"

function renderTimer(
  props: Omit<React.ComponentProps<typeof Timer>, "children"> = {},
) {
  return render(
    <Timer {...props}>
      <TimerArea>
        <TimerItem type="minutes" data-testid="minutes" />
        <TimerSeparator>:</TimerSeparator>
        <TimerItem type="seconds" data-testid="seconds" />
      </TimerArea>
      <TimerControl>
        <TimerActionTrigger action="start">Start</TimerActionTrigger>
        <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
        <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
        <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
      </TimerControl>
    </Timer>,
  )
}

function getButton(name: "Start" | "Pause" | "Resume" | "Reset") {
  return screen.getByRole("button", { name }) as HTMLButtonElement
}

describe("Timer", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-05-06T00:00:00.000Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("stopwatch starts at 0 and advances after start", () => {
    renderTimer({ interval: 100 })
    expect(screen.getByTestId("minutes").textContent).toBe("00")
    expect(screen.getByTestId("seconds").textContent).toBe("00")

    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(2_500)
    })

    expect(screen.getByTestId("seconds").textContent).toBe("02")
    expect(screen.getByTestId("minutes").textContent).toBe("00")
  })

  it("countdown starts at targetMs and decreases", () => {
    renderTimer({ countdown: true, targetMs: 60_000, interval: 100 })
    expect(screen.getByTestId("minutes").textContent).toBe("01")
    expect(screen.getByTestId("seconds").textContent).toBe("00")

    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(3_000)
    })

    expect(screen.getByTestId("minutes").textContent).toBe("00")
    expect(screen.getByTestId("seconds").textContent).toBe("57")
  })

  it("pause freezes the display", () => {
    renderTimer({ interval: 100 })
    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(screen.getByTestId("seconds").textContent).toBe("02")

    act(() => {
      getButton("Pause").click()
    })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByTestId("seconds").textContent).toBe("02")
  })

  it("resume continues from frozen value", () => {
    renderTimer({ interval: 100 })
    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    act(() => {
      getButton("Pause").click()
    })
    act(() => {
      vi.advanceTimersByTime(5_000)
    })
    expect(screen.getByTestId("seconds").textContent).toBe("02")

    act(() => {
      getButton("Resume").click()
    })
    act(() => {
      vi.advanceTimersByTime(3_000)
    })
    // 2s before pause + 3s after resume = 5s
    expect(screen.getByTestId("seconds").textContent).toBe("05")
  })

  it("reset returns to idle and zeroes the display", () => {
    renderTimer({ interval: 100 })
    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(4_500)
    })
    expect(screen.getByTestId("seconds").textContent).toBe("04")

    act(() => {
      getButton("Reset").click()
    })
    expect(screen.getByTestId("seconds").textContent).toBe("00")
    expect(screen.getByTestId("minutes").textContent).toBe("00")

    // After reset, start should be enabled again
    expect(getButton("Start")).not.toBeDisabled()
  })

  it("fires onComplete exactly once when countdown reaches zero", () => {
    const onComplete = vi.fn()
    renderTimer({
      countdown: true,
      targetMs: 1_000,
      interval: 100,
      onComplete,
    })

    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(1_500)
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId("seconds").textContent).toBe("00")
    expect(screen.getByTestId("minutes").textContent).toBe("00")

    // Further ticks should not fire onComplete again.
    act(() => {
      vi.advanceTimersByTime(2_000)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it("disables triggers based on state", () => {
    renderTimer({ interval: 100 })
    // idle: only start + reset enabled
    expect(getButton("Start")).not.toBeDisabled()
    expect(getButton("Pause")).toBeDisabled()
    expect(getButton("Resume")).toBeDisabled()
    expect(getButton("Reset")).not.toBeDisabled()

    act(() => {
      getButton("Start").click()
    })
    // running: only pause + reset enabled
    expect(getButton("Start")).toBeDisabled()
    expect(getButton("Pause")).not.toBeDisabled()
    expect(getButton("Resume")).toBeDisabled()

    act(() => {
      getButton("Pause").click()
    })
    // paused: only resume + reset enabled
    expect(getButton("Pause")).toBeDisabled()
    expect(getButton("Resume")).not.toBeDisabled()
  })

  it("calls onTick with the displayed value on each interval", () => {
    const onTick = vi.fn()
    renderTimer({ interval: 100, onTick })
    // initial tick on mount fires once with 0
    expect(onTick).toHaveBeenLastCalledWith(0)

    act(() => {
      getButton("Start").click()
    })
    act(() => {
      vi.advanceTimersByTime(500)
    })
    // last call should be ~500ms
    const lastCall = onTick.mock.calls[onTick.mock.calls.length - 1][0]
    expect(lastCall).toBeGreaterThanOrEqual(400)
    expect(lastCall).toBeLessThanOrEqual(600)
  })
})
