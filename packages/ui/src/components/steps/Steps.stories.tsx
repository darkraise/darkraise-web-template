import type { Meta, StoryObj } from "@storybook/react-vite"
import * as React from "react"
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

const meta: Meta<typeof Steps> = {
  title: "UI/Steps",
  component: Steps,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Steps>

const items = [
  { title: "Account", description: "Create your account" },
  { title: "Profile", description: "Tell us about yourself" },
  { title: "Confirm", description: "Review and submit" },
]

export const Default: Story = {
  render: () => {
    const [step, setStep] = React.useState(0)
    return (
      <Steps
        count={items.length}
        step={step}
        onStepChange={(d) => setStep(d.step)}
      >
        <StepsList>
          {items.map((item, index) => (
            <StepsItem key={index} index={index}>
              <StepsTrigger>
                <StepsIndicator>{index + 1}</StepsIndicator>
                <StepsTitle>{item.title}</StepsTitle>
              </StepsTrigger>
              {index < items.length - 1 ? <StepsSeparator /> : null}
            </StepsItem>
          ))}
        </StepsList>
        {items.map((item, index) => (
          <StepsContent key={index} index={index}>
            <p className="text-sm">{item.description}</p>
          </StepsContent>
        ))}
        <StepsCompletedContent>
          <p className="text-sm">All done — thanks for filling out the form.</p>
        </StepsCompletedContent>
        <StepsControls>
          <StepsPrevTrigger>Back</StepsPrevTrigger>
          <StepsNextTrigger>Next</StepsNextTrigger>
        </StepsControls>
      </Steps>
    )
  },
}

export const Vertical: Story = {
  render: () => {
    const [step, setStep] = React.useState(0)
    return (
      <Steps
        orientation="vertical"
        count={items.length}
        step={step}
        onStepChange={(d) => setStep(d.step)}
      >
        <StepsList>
          {items.map((item, index) => (
            <StepsItem key={index} index={index}>
              <StepsTrigger>
                <StepsIndicator>{index + 1}</StepsIndicator>
                <StepsTitle>{item.title}</StepsTitle>
              </StepsTrigger>
              {index < items.length - 1 ? <StepsSeparator /> : null}
            </StepsItem>
          ))}
        </StepsList>
        <StepsControls>
          <StepsPrevTrigger>Back</StepsPrevTrigger>
          <StepsNextTrigger>Next</StepsNextTrigger>
        </StepsControls>
      </Steps>
    )
  },
}

export const ValidationGated: Story = {
  render: () => {
    const [step, setStep] = React.useState(0)
    const [canAdvance, setCanAdvance] = React.useState(false)
    return (
      <Steps
        linear
        count={items.length}
        step={step}
        onStepChange={(d) => {
          setStep(d.step)
          setCanAdvance(false)
        }}
      >
        <StepsList>
          {items.map((item, index) => (
            <StepsItem key={index} index={index}>
              <StepsTrigger>
                <StepsIndicator>{index + 1}</StepsIndicator>
                <StepsTitle>{item.title}</StepsTitle>
              </StepsTrigger>
              {index < items.length - 1 ? <StepsSeparator /> : null}
            </StepsItem>
          ))}
        </StepsList>
        {items.map((item, index) => (
          <StepsContent key={index} index={index}>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={canAdvance}
                onChange={(event) => setCanAdvance(event.target.checked)}
              />
              I have completed: {item.title}
            </label>
          </StepsContent>
        ))}
        <StepsCompletedContent>
          <p className="text-sm">All steps complete.</p>
        </StepsCompletedContent>
        <StepsControls>
          <StepsPrevTrigger>Back</StepsPrevTrigger>
          <StepsNextTrigger disabled={!canAdvance}>Next</StepsNextTrigger>
        </StepsControls>
      </Steps>
    )
  },
}
