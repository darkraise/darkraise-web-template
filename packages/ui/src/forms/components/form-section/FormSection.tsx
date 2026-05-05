import { FieldSet, FieldLegend, FieldGroup } from "../../../components/field"
import type { FormSectionProps } from "../../types"

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <FieldSet>
      <FieldLegend>{title}</FieldLegend>
      {description && (
        <p className="text-muted-foreground -mt-1.5 text-sm">{description}</p>
      )}
      <FieldGroup>{children}</FieldGroup>
    </FieldSet>
  )
}
