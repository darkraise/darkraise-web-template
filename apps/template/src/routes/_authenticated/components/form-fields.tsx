import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { z } from "zod"
import { Check, Pencil, X } from "lucide-react"
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
} from "darkraise-ui/forms"
import { fieldProps } from "@/lib/field-props"
import {
  Editable,
  EditableArea,
  EditableCancelTrigger,
  EditableControl,
  EditableEditTrigger,
  EditableInput,
  EditableLabel,
  EditablePreview,
  EditableSubmitTrigger,
} from "darkraise-ui/components/editable"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

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
        <form.Field name="name">
          {(field) => (
            <TextField
              {...fieldProps<string>(field)}
              label="Full Name"
              placeholder="Jane Doe"
            />
          )}
        </form.Field>
        <form.Field name="bio">
          {(field) => (
            <TextareaField
              {...fieldProps<string>(field)}
              label="Bio"
              placeholder="Tell us about yourself..."
              rows={3}
            />
          )}
        </form.Field>
        <form.Field name="age">
          {(field) => (
            <NumberField
              {...fieldProps<number | undefined>(field)}
              label="Age"
              placeholder="25"
              min={0}
              max={120}
            />
          )}
        </form.Field>
        <form.Field name="role">
          {(field) => (
            <SelectField
              {...fieldProps<string>(field)}
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
        <form.Field name="notifications">
          {(field) => (
            <SwitchField
              {...fieldProps<boolean>(field)}
              label="Email notifications"
              description="Receive updates about your account activity."
            />
          )}
        </form.Field>
        <form.Field name="plan">
          {(field) => (
            <RadioGroupField
              {...fieldProps<string>(field)}
              label="Plan"
              options={[
                { label: "Free", value: "free" },
                { label: "Pro", value: "pro" },
                { label: "Enterprise", value: "enterprise" },
              ]}
            />
          )}
        </form.Field>
        <form.Field name="agree">
          {(field) => (
            <CheckboxField
              {...fieldProps<boolean>(field)}
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
  const [companyName, setCompanyName] = useState("")
  const [taxId, setTaxId] = useState("")

  return (
    <div className="space-y-4">
      <SelectField
        name="accountType"
        label="Account Type"
        value={accountType}
        onChange={(v) => setAccountType(v as "personal" | "business")}
        options={[
          { label: "Personal", value: "personal" },
          { label: "Business", value: "business" },
        ]}
      />
      {accountType === "business" && (
        <>
          <TextField
            name="companyName"
            label="Company Name"
            placeholder="Acme Corp"
            value={companyName}
            onChange={setCompanyName}
          />
          <TextField
            name="taxId"
            label="Tax ID"
            placeholder="12-3456789"
            value={taxId}
            onChange={setTaxId}
          />
        </>
      )}
    </div>
  )
}

function InlineEditExample() {
  const [value, setValue] = useState("Jane Doe")

  return (
    <Editable
      value={value}
      onValueCommit={(d) => setValue(d.value)}
      submitOnBlur={false}
    >
      <EditableLabel>Display name</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit name">
          <Pencil />
        </EditableEditTrigger>
        <EditableSubmitTrigger aria-label="Save name">
          <Check />
        </EditableSubmitTrigger>
        <EditableCancelTrigger aria-label="Cancel edit">
          <X />
        </EditableCancelTrigger>
      </EditableControl>
    </Editable>
  )
}

function DependentSelectsExample() {
  const [country, setCountry] = useState("")
  const [city, setCity] = useState("")

  function handleCountryChange(v: string) {
    setCountry(v)
    setCity("")
  }

  const countryOptions = Object.keys(CITY_OPTIONS).map((c) => ({
    label: c,
    value: c,
  }))
  const cityOptions = (CITY_OPTIONS[country] ?? []).map((c) => ({
    label: c,
    value: c,
  }))

  return (
    <div className="space-y-4">
      <SelectField
        name="country"
        label="Country"
        placeholder="Select country"
        value={country}
        onChange={handleCountryChange}
        options={countryOptions}
      />
      <SelectField
        name="city"
        label="City"
        placeholder="Select city"
        value={city}
        onChange={setCity}
        disabled={!country}
        options={cityOptions}
      />
    </div>
  )
}

function FormFieldsPage() {
  return (
    <ShowcasePage
      title="Form Fields"
      description="TanStack Form–integrated field components with built-in validation, labels, and error display."
    >
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
  const [companyName, setCompanyName] = useState("")
  const [taxId, setTaxId] = useState("")

  return (
    <div className="space-y-4">
      <SelectField
        name="accountType"
        label="Account Type"
        value={accountType}
        onChange={(v) => setAccountType(v as "personal" | "business")}
        options={[
          { label: "Personal", value: "personal" },
          { label: "Business", value: "business" },
        ]}
      />
      {accountType === "business" && (
        <>
          <TextField
            name="companyName"
            label="Company Name"
            placeholder="Acme Corp"
            value={companyName}
            onChange={setCompanyName}
          />
          <TextField
            name="taxId"
            label="Tax ID"
            placeholder="12-3456789"
            value={taxId}
            onChange={setTaxId}
          />
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
  const [value, setValue] = useState("Jane Doe")

  return (
    <Editable
      value={value}
      onValueCommit={(d) => setValue(d.value)}
      submitOnBlur={false}
    >
      <EditableLabel>Display name</EditableLabel>
      <EditableArea>
        <EditableInput />
        <EditablePreview />
      </EditableArea>
      <EditableControl>
        <EditableEditTrigger aria-label="Edit name"><Pencil /></EditableEditTrigger>
        <EditableSubmitTrigger aria-label="Save name"><Check /></EditableSubmitTrigger>
        <EditableCancelTrigger aria-label="Cancel edit"><X /></EditableCancelTrigger>
      </EditableControl>
    </Editable>
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

  const countryOptions = Object.keys(CITY_OPTIONS).map((c) => ({ label: c, value: c }))
  const cityOptions = (CITY_OPTIONS[country] ?? []).map((c) => ({ label: c, value: c }))

  return (
    <div className="space-y-4">
      <SelectField
        name="country"
        label="Country"
        placeholder="Select country"
        value={country}
        onChange={handleCountryChange}
        options={countryOptions}
      />
      <SelectField
        name="city"
        label="City"
        placeholder="Select city"
        value={city}
        onChange={setCity}
        disabled={!country}
        options={cityOptions}
      />
    </div>
  )
}`}
      >
        <DependentSelectsExample />
      </ShowcaseExample>
    </ShowcasePage>
  )
}
