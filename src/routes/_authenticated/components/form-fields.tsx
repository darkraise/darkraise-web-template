import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { PageHeader } from "@/core/layout"
import {
  TextField,
  TextareaField,
  NumberField,
  SelectField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  FormSection,
  FormActions,
} from "@/features/forms"
import { ShowcaseExample } from "./_components/-showcase-example"

export const Route = createFileRoute("/_authenticated/components/form-fields")({
  component: FormFieldsPage,
})

const showcaseSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  bio: z.string(),
  age: z.number().min(18, "Must be 18 or older").max(120),
  role: z.string().min(1, "Role is required"),
  agree: z.boolean().refine((v) => v === true, "You must agree"),
  notifications: z.boolean(),
  plan: z.enum(["free", "pro", "enterprise"]),
})

function FullShowcaseForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      bio: "",
      age: 25,
      role: "",
      agree: false,
      notifications: true,
      plan: "free",
    },
    validators: {
      onChange: showcaseSchema,
    },
    onSubmit: ({ value }) => {
      alert(JSON.stringify(value, null, 2))
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void form.handleSubmit()
      }}
      className="space-y-6"
    >
      <FormSection
        title="Basic Info"
        description="Personal details with inline validation."
      >
        <form.Field
          name="name"
          validators={{ onBlur: showcaseSchema.shape.name }}
        >
          {(field) => (
            <TextField field={field} label="Full Name" placeholder="Jane Doe" />
          )}
        </form.Field>
        <form.Field
          name="bio"
          validators={{ onBlur: showcaseSchema.shape.bio }}
        >
          {(field) => (
            <TextareaField
              field={field}
              label="Bio"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          )}
        </form.Field>
        <form.Field
          name="age"
          validators={{ onBlur: showcaseSchema.shape.age }}
        >
          {(field) => (
            <NumberField
              field={field}
              label="Age"
              placeholder="25"
              min={0}
              max={120}
            />
          )}
        </form.Field>
        <form.Field
          name="role"
          validators={{ onBlur: showcaseSchema.shape.role }}
        >
          {(field) => (
            <SelectField
              field={field}
              label="Role"
              placeholder="Select a role"
              options={[
                { label: "Admin", value: "admin" },
                { label: "Editor", value: "editor" },
                { label: "Viewer", value: "viewer" },
              ]}
            />
          )}
        </form.Field>
      </FormSection>
      <FormSection
        title="Preferences"
        description="Toggle and choice controls."
      >
        <form.Field
          name="notifications"
          validators={{ onBlur: showcaseSchema.shape.notifications }}
        >
          {(field) => (
            <SwitchField
              field={field}
              label="Email notifications"
              description="Receive updates about your account activity."
            />
          )}
        </form.Field>
        <form.Field
          name="plan"
          validators={{ onBlur: showcaseSchema.shape.plan }}
        >
          {(field) => (
            <RadioGroupField
              field={field}
              label="Plan"
              options={[
                { label: "Free", value: "free" },
                { label: "Pro", value: "pro" },
                { label: "Enterprise", value: "enterprise" },
              ]}
            />
          )}
        </form.Field>
        <form.Field
          name="agree"
          validators={{ onBlur: showcaseSchema.shape.agree }}
        >
          {(field) => (
            <CheckboxField
              field={field}
              label="I agree to the terms and conditions"
            />
          )}
        </form.Field>
      </FormSection>
      <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <FormActions
            canSubmit={canSubmit as boolean}
            isSubmitting={isSubmitting as boolean}
            submitLabel="Submit Demo Form"
            onCancel={() => form.reset()}
            cancelLabel="Reset"
          />
        )}
      </form.Subscribe>
    </form>
  )
}

function FormFieldsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        breadcrumbs={[
          { label: "Components", href: "/components" },
          { label: "Form Fields" },
        ]}
        title="Form Fields"
        description="TanStack Form–integrated field components with built-in validation, labels, and error display."
      />

      <div className="space-y-6">
        <ShowcaseExample
          title="TextField, TextareaField, NumberField, SelectField, SwitchField, RadioGroupField, CheckboxField"
          code={`// Each field component wraps a TanStack Form field instance
const form = useForm({
  defaultValues: { name: "", role: "", agree: false },
  validators: { onChange: schema },
  onSubmit: ({ value }) => console.log(value),
})

<form onSubmit={(e) => { e.preventDefault(); void form.handleSubmit() }}>
  <FormSection title="Basic Info" description="Personal details">
    <form.Field name="name" validators={{ onBlur: schema.shape.name }}>
      {(field) => <TextField field={field} label="Full Name" placeholder="Jane Doe" />}
    </form.Field>
    <form.Field name="role">
      {(field) => (
        <SelectField
          field={field}
          label="Role"
          placeholder="Select a role"
          options={[
            { label: "Admin", value: "admin" },
            { label: "Editor", value: "editor" },
          ]}
        />
      )}
    </form.Field>
  </FormSection>
  <form.Subscribe selector={(s) => [s.canSubmit, s.isSubmitting]}>
    {([canSubmit, isSubmitting]) => (
      <FormActions
        canSubmit={canSubmit as boolean}
        isSubmitting={isSubmitting as boolean}
        submitLabel="Submit"
        onCancel={() => form.reset()}
      />
    )}
  </form.Subscribe>
</form>`}
        >
          <FullShowcaseForm />
        </ShowcaseExample>
      </div>
    </div>
  )
}
