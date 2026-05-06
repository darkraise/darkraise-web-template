import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi } from "vitest"
import {
  Steps,
  StepsCompletedContent,
  StepsContent,
  StepsControls,
  StepsIndicator,
  StepsItem,
  StepsList,
  StepsNextTrigger,
  StepsPrevTrigger,
  StepsSeparator,
  StepsTitle,
  StepsTrigger,
} from "./Steps"

interface BasicProps {
  step?: number
  defaultStep?: number
  count?: number
  linear?: boolean
  onStepChange?: (details: { step: number }) => void
}

function Basic(props: BasicProps = {}) {
  const { count = 3, ...rest } = props
  return (
    <Steps count={count} {...rest}>
      <StepsList>
        <StepsItem index={0}>
          <StepsTrigger>
            <StepsIndicator>1</StepsIndicator>
            <StepsTitle>Account</StepsTitle>
          </StepsTrigger>
          <StepsSeparator />
        </StepsItem>
        <StepsItem index={1}>
          <StepsTrigger>
            <StepsIndicator>2</StepsIndicator>
            <StepsTitle>Profile</StepsTitle>
          </StepsTrigger>
          <StepsSeparator />
        </StepsItem>
        <StepsItem index={2}>
          <StepsTrigger>
            <StepsIndicator>3</StepsIndicator>
            <StepsTitle>Done</StepsTitle>
          </StepsTrigger>
        </StepsItem>
      </StepsList>
      <StepsContent index={0}>Account form</StepsContent>
      <StepsContent index={1}>Profile form</StepsContent>
      <StepsContent index={2}>Confirmation</StepsContent>
      <StepsCompletedContent>All done!</StepsCompletedContent>
      <StepsControls>
        <StepsPrevTrigger>Previous</StepsPrevTrigger>
        <StepsNextTrigger>Next</StepsNextTrigger>
      </StepsControls>
    </Steps>
  )
}

describe("Steps", () => {
  it("renders all items with correct initial status", () => {
    render(<Basic defaultStep={0} />)
    const triggers = screen.getAllByRole("tab")
    expect(triggers).toHaveLength(3)
    expect(triggers[0]).toHaveAttribute("data-status", "current")
    expect(triggers[1]).toHaveAttribute("data-status", "upcoming")
    expect(triggers[2]).toHaveAttribute("data-status", "upcoming")
  })

  it("Next advances step", async () => {
    const user = userEvent.setup()
    render(<Basic defaultStep={0} />)
    await user.click(screen.getByRole("button", { name: "Next" }))
    const triggers = screen.getAllByRole("tab")
    expect(triggers[0]).toHaveAttribute("data-status", "complete")
    expect(triggers[1]).toHaveAttribute("data-status", "current")
  })

  it("Prev decrements step", async () => {
    const user = userEvent.setup()
    render(<Basic defaultStep={2} />)
    await user.click(screen.getByRole("button", { name: "Previous" }))
    const triggers = screen.getAllByRole("tab")
    expect(triggers[1]).toHaveAttribute("data-status", "current")
    expect(triggers[2]).toHaveAttribute("data-status", "upcoming")
  })

  it("Next disabled when count reached", async () => {
    const user = userEvent.setup()
    render(<Basic defaultStep={3} count={3} />)
    const nextBtn = screen.getByRole("button", { name: "Next" })
    expect(nextBtn).toBeDisabled()
    await user.click(nextBtn)
    // No state change — completed remains rendered.
    expect(screen.getByText("All done!")).toBeInTheDocument()
  })

  it("Prev disabled at step 0", async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    render(<Basic defaultStep={0} onStepChange={onStepChange} />)
    const prevBtn = screen.getByRole("button", { name: "Previous" })
    expect(prevBtn).toBeDisabled()
    await user.click(prevBtn)
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it("clicking a completed step jumps back", async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    render(<Basic defaultStep={2} onStepChange={onStepChange} />)
    const triggers = screen.getAllByRole("tab")
    const first = triggers[0] as HTMLElement
    expect(first).toHaveAttribute("data-status", "complete")
    await user.click(first)
    expect(onStepChange).toHaveBeenCalledWith({ step: 0 })
    const after = screen.getAllByRole("tab")
    expect(after[0]).toHaveAttribute("data-status", "current")
  })

  it("linear mode prevents jumping ahead to upcoming step", async () => {
    const user = userEvent.setup()
    const onStepChange = vi.fn()
    render(<Basic defaultStep={0} linear onStepChange={onStepChange} />)
    const triggers = screen.getAllByRole("tab")
    const third = triggers[2] as HTMLElement
    expect(third).toHaveAttribute("data-status", "upcoming")
    expect(third).toHaveAttribute("data-locked", "true")
    await user.click(third)
    expect(onStepChange).not.toHaveBeenCalled()
  })

  it("CompletedContent only renders when step === count", () => {
    const { rerender } = render(<Basic defaultStep={0} />)
    expect(screen.queryByText("All done!")).toBeNull()
    rerender(<Basic step={3} count={3} />)
    expect(screen.getByText("All done!")).toBeInTheDocument()
  })

  it("ArrowRight moves focus across triggers in StepsList", async () => {
    const user = userEvent.setup()
    render(<Basic defaultStep={0} />)
    const triggers = screen.getAllByRole("tab")
    const first = triggers[0] as HTMLElement
    first.focus()
    expect(first).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(triggers[1]).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(triggers[2]).toHaveFocus()
    await user.keyboard("{End}")
    expect(triggers[2]).toHaveFocus()
    await user.keyboard("{Home}")
    expect(triggers[0]).toHaveFocus()
  })

  it("only the current step's content is visible", () => {
    const { rerender } = render(<Basic defaultStep={1} />)
    const accountPanel = screen
      .getByText("Account form")
      .closest(".dr-steps-content") as HTMLElement
    const profilePanel = screen
      .getByText("Profile form")
      .closest(".dr-steps-content") as HTMLElement
    expect(profilePanel).toHaveAttribute("data-status", "active")
    expect(accountPanel).toHaveAttribute("data-status", "inactive")

    rerender(<Basic step={0} />)
    const accountPanel2 = screen
      .getByText("Account form")
      .closest(".dr-steps-content") as HTMLElement
    expect(accountPanel2).toHaveAttribute("data-status", "active")
  })

  it("supports controlled step prop", async () => {
    const user = userEvent.setup()
    function Controlled() {
      const [s, setS] = React.useState(0)
      return <Basic step={s} onStepChange={(d) => setS(d.step)} />
    }
    render(<Controlled />)
    await user.click(screen.getByRole("button", { name: "Next" }))
    const triggers = screen.getAllByRole("tab")
    expect(triggers[1]).toHaveAttribute("data-status", "current")
  })
})
