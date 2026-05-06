import { createFileRoute } from "@tanstack/react-router"
import {
  Timer,
  TimerActionTrigger,
  TimerArea,
  TimerControl,
  TimerItem,
  TimerSeparator,
} from "darkraise-ui/components/timer"
import { toast } from "sonner"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/timer")({
  component: TimerPage,
})

function TimerPage() {
  return (
    <ShowcasePage
      title="Timer"
      description="Display elapsed or remaining time with start, pause, resume, and reset controls."
    >
      <ShowcaseExample
        title="Countdown with days, hours, minutes, seconds"
        code={`<Timer countdown targetMs={2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000}>
  <TimerArea>
    <TimerItem type="days" />
    <TimerSeparator>d</TimerSeparator>
    <TimerItem type="hours" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="minutes" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
    <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
    <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
  </TimerControl>
</Timer>`}
      >
        <Timer
          countdown
          targetMs={2 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000}
        >
          <TimerArea>
            <TimerItem type="days" />
            <TimerSeparator>d</TimerSeparator>
            <TimerItem type="hours" />
            <TimerSeparator>:</TimerSeparator>
            <TimerItem type="minutes" />
            <TimerSeparator>:</TimerSeparator>
            <TimerItem type="seconds" />
          </TimerArea>
          <TimerControl>
            <TimerActionTrigger action="start">Start</TimerActionTrigger>
            <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
            <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
            <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
          </TimerControl>
        </Timer>
      </ShowcaseExample>

      <ShowcaseExample
        title="Stopwatch counting up from zero"
        code={`<Timer interval={100}>
  <TimerArea>
    <TimerItem type="minutes" />
    <TimerSeparator>:</TimerSeparator>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="start">Start</TimerActionTrigger>
    <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
    <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
    <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
  </TimerControl>
</Timer>`}
      >
        <Timer interval={100}>
          <TimerArea>
            <TimerItem type="minutes" />
            <TimerSeparator>:</TimerSeparator>
            <TimerItem type="seconds" />
          </TimerArea>
          <TimerControl>
            <TimerActionTrigger action="start">Start</TimerActionTrigger>
            <TimerActionTrigger action="pause">Pause</TimerActionTrigger>
            <TimerActionTrigger action="resume">Resume</TimerActionTrigger>
            <TimerActionTrigger action="reset">Reset</TimerActionTrigger>
          </TimerControl>
        </Timer>
      </ShowcaseExample>

      <ShowcaseExample
        title="Auto-start countdown with onComplete handler"
        code={`<Timer
  countdown
  autoStart
  targetMs={10_000}
  onComplete={() => toast.success("Time's up!")}
>
  <TimerArea>
    <TimerItem type="seconds" />
  </TimerArea>
  <TimerControl>
    <TimerActionTrigger action="reset">Restart</TimerActionTrigger>
  </TimerControl>
</Timer>`}
      >
        <Timer
          countdown
          autoStart
          targetMs={10_000}
          onComplete={() => toast.success("Time's up!")}
        >
          <TimerArea>
            <TimerItem type="seconds" />
          </TimerArea>
          <TimerControl>
            <TimerActionTrigger action="reset">Restart</TimerActionTrigger>
          </TimerControl>
        </Timer>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
