import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Pencil } from "lucide-react"
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
  FieldWrapper,
} from "@/features/forms"
import { Button } from "@/core/components/ui/button"
import { Input } from "@/core/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/components/ui/select"
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

const CITY_OPTIONS: Record<string, string[]> = {
  USA: ["New York", "Los Angeles", "Chicago"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  UK: ["London", "Manchester", "Edinburgh"],
}

function ConditionalFieldsExample() {
  const [accountType, setAccountType] = useState<"personal" | "business">(
    "personal",
  )

  return (
    <div className="space-y-4">
      <FieldWrapper label="Account Type">
        <Select
          value={accountType}
          onValueChange={(v) => setAccountType(v as "personal" | "business")}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
      {accountType === "business" && (
        <>
          <FieldWrapper label="Company Name">
            <Input placeholder="Acme Corp" />
          </FieldWrapper>
          <FieldWrapper label="Tax ID">
            <Input placeholder="12-3456789" />
          </FieldWrapper>
        </>
      )}
    </div>
  )
}

function InlineEditExample() {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("Jane Doe")

  return editing ? (
    <div className="flex items-center gap-2">
      <Input defaultValue={value} id="inline-edit-input" className="h-8 w-48" />
      <Button
        size="sm"
        onClick={() => {
          const input = document.getElementById(
            "inline-edit-input",
          ) as HTMLInputElement
          setValue(input.value)
          setEditing(false)
        }}
      >
        Save
      </Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
        Cancel
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{value}</span>
      <Button
        size="icon"
        variant="ghost"
        className="h-6 w-6"
        onClick={() => setEditing(true)}
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

function DependentSelectsExample() {
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")

  function handleCountryChange(v: string) {
    setCountry(v)
    setCity("")
  }

  return (
    <div className="space-y-4">
      <FieldWrapper label="Country">
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(CITY_OPTIONS).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>
      <FieldWrapper label="City">
        <Select value={city} onValueChange={setCity} disabled={!country}>
          <SelectTrigger>
            <SelectValue placeholder="Select city" />
          </SelectTrigger>
          <SelectContent>
            {(CITY_OPTIONS[country] ?? []).map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>
    </div>
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

        <ShowcaseExample
          title="Conditional Fields"
          code={`function ConditionalFieldsExample() {
  const [accountType, setAccountType] = useState<"personal" | "business">("personal")

  return (
    <div className="space-y-4">
      <FieldWrapper label="Account Type">
        <Select value={accountType} onValueChange={(v) => setAccountType(v as "personal" | "business")}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="personal">Personal</SelectItem>
            <SelectItem value="business">Business</SelectItem>
          </SelectContent>
        </Select>
      </FieldWrapper>
      {accountType === "business" && (
        <>
          <FieldWrapper label="Company Name">
            <Input placeholder="Acme Corp" />
          </FieldWrapper>
          <FieldWrapper label="Tax ID">
            <Input placeholder="12-3456789" />
          </FieldWrapper>
        </>
      )}
    </div>
  )
}`}
        >
          <ConditionalFieldsExample />
        </ShowcaseExample>

        <ShowcaseExample
          title="Inline Edit"
          code={`function InlineEditExample() {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState("Jane Doe")

  return editing ? (
    <div className="flex items-center gap-2">
      <Input defaultValue={value} id="inline-edit-input" className="h-8 w-48" />
      <Button size="sm" onClick={() => {
        const input = document.getElementById("inline-edit-input") as HTMLInputElement
        setValue(input.value)
        setEditing(false)
      }}>Save</Button>
      <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{value}</span>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}`}
        >
          <InlineEditExample />
        </ShowcaseExample>

        <ShowcaseExample
          title="Dependent Selects"
          code={`const CITY_OPTIONS = {
  USA: ["New York", "Los Angeles", "Chicago"],
  Canada: ["Toronto", "Vancouver", "Montreal"],
  UK: ["London", "Manchester", "Edinburgh"],
}

function DependentSelectsExample() {
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")

  function handleCountryChange(v: string) {
    setCountry(v)
    setCity("")
  }

  return (
    <div className="space-y-4">
      <FieldWrapper label="Country">
        <Select value={country} onValueChange={handleCountryChange}>
          <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
          <SelectContent>
            {Object.keys(CITY_OPTIONS).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>
      <FieldWrapper label="City">
        <Select value={city} onValueChange={setCity} disabled={!country}>
          <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
          <SelectContent>
            {(CITY_OPTIONS[country] ?? []).map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FieldWrapper>
    </div>
  )
}`}
        >
          <DependentSelectsExample />
        </ShowcaseExample>
      </div>
    </div>
  )
}
