import { createFileRoute } from "@tanstack/react-router"
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
} from "darkraise-ui/components/steps"
import { useState } from "react"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/steps")({
  component: StepsPage,
})

const signupItems = [
  { title: "Account", description: "Create your sign-in credentials." },
  { title: "Profile", description: "Tell us about yourself." },
  { title: "Confirm", description: "Review and submit." },
]

function HorizontalSignupExample() {
  const [step, setStep] = useState(0)
  return (
    <Steps
      count={signupItems.length}
      step={step}
      onStepChange={(d) => setStep(d.step)}
    >
      <StepsList>
        {signupItems.map((item, index) => (
          <StepsItem key={index} index={index}>
            <StepsTrigger>
              <StepsIndicator>{index + 1}</StepsIndicator>
              <StepsTitle>{item.title}</StepsTitle>
            </StepsTrigger>
            {index < signupItems.length - 1 ? <StepsSeparator /> : null}
          </StepsItem>
        ))}
      </StepsList>
      {signupItems.map((item, index) => (
        <StepsContent key={index} index={index}>
          <p className="text-muted-foreground text-sm">{item.description}</p>
        </StepsContent>
      ))}
      <StepsCompletedContent>
        <p className="text-sm">All done — your account is ready.</p>
      </StepsCompletedContent>
      <StepsControls>
        <StepsPrevTrigger>Back</StepsPrevTrigger>
        <StepsNextTrigger>Next</StepsNextTrigger>
      </StepsControls>
    </Steps>
  )
}

function ValidationGatedExample() {
  const [step, setStep] = useState(0)
  const [canAdvance, setCanAdvance] = useState(false)
  return (
    <Steps
      linear
      count={signupItems.length}
      step={step}
      onStepChange={(d) => {
        setStep(d.step)
        setCanAdvance(false)
      }}
    >
      <StepsList>
        {signupItems.map((item, index) => (
          <StepsItem key={index} index={index}>
            <StepsTrigger>
              <StepsIndicator>{index + 1}</StepsIndicator>
              <StepsTitle>{item.title}</StepsTitle>
            </StepsTrigger>
            {index < signupItems.length - 1 ? <StepsSeparator /> : null}
          </StepsItem>
        ))}
      </StepsList>
      {signupItems.map((item, index) => (
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
}

function VerticalExample() {
  const [step, setStep] = useState(0)
  return (
    <Steps
      orientation="vertical"
      count={signupItems.length}
      step={step}
      onStepChange={(d) => setStep(d.step)}
    >
      <StepsList>
        {signupItems.map((item, index) => (
          <StepsItem key={index} index={index}>
            <StepsTrigger>
              <StepsIndicator>{index + 1}</StepsIndicator>
              <StepsTitle>{item.title}</StepsTitle>
            </StepsTrigger>
            {index < signupItems.length - 1 ? <StepsSeparator /> : null}
          </StepsItem>
        ))}
      </StepsList>
      {signupItems.map((item, index) => (
        <StepsContent key={index} index={index}>
          <p className="text-muted-foreground text-sm">{item.description}</p>
        </StepsContent>
      ))}
      <StepsCompletedContent>
        <p className="text-sm">All done.</p>
      </StepsCompletedContent>
      <StepsControls>
        <StepsPrevTrigger>Back</StepsPrevTrigger>
        <StepsNextTrigger>Next</StepsNextTrigger>
      </StepsControls>
    </Steps>
  )
}

function StepsPage() {
  return (
    <ShowcasePage
      title="Steps"
      description="Wizard / stepper with content slots, linear gating, vertical orientation, and roving keyboard focus."
    >
      <ShowcaseExample
        title="3-step signup wizard"
        code={`<Steps count={3} step={step} onStepChange={(d) => setStep(d.step)}>
  <StepsList>
    <StepsItem index={0}>
      <StepsTrigger>
        <StepsIndicator>1</StepsIndicator>
        <StepsTitle>Account</StepsTitle>
      </StepsTrigger>
      <StepsSeparator />
    </StepsItem>
    {/* ... */}
  </StepsList>
  <StepsContent index={0}>Account form</StepsContent>
  {/* ... */}
  <StepsCompletedContent>All done!</StepsCompletedContent>
  <StepsControls>
    <StepsPrevTrigger>Back</StepsPrevTrigger>
    <StepsNextTrigger>Next</StepsNextTrigger>
  </StepsControls>
</Steps>`}
      >
        <HorizontalSignupExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Linear with validation gating"
        code={`<Steps linear count={3} step={step} onStepChange={(d) => {
  setStep(d.step)
  setCanAdvance(false)
}}>
  {/* ... */}
  <StepsControls>
    <StepsPrevTrigger>Back</StepsPrevTrigger>
    <StepsNextTrigger disabled={!canAdvance}>Next</StepsNextTrigger>
  </StepsControls>
</Steps>`}
      >
        <ValidationGatedExample />
      </ShowcaseExample>

      <ShowcaseExample
        title="Vertical orientation"
        code={`<Steps orientation="vertical" count={3} step={step} onStepChange={(d) => setStep(d.step)}>
  {/* ... */}
</Steps>`}
      >
        <VerticalExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
