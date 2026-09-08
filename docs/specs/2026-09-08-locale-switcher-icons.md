# Locale switcher icons

Add an optional `icon: ReactNode` field to exported `LocaleSwitcherOption`.
Render it before the language label in both the trigger and each dropdown item.
Keep language labels visible and icons decorative. Set SelectItem textValue to
the label so icons cannot interfere with typeahead or selection text.

Options without icons retain their current appearance and behavior. Locale keys,
translation catalogs, controlled values, pending/disabled behavior, and callbacks
remain unchanged. Presentation metadata stays in switcher options rather than
the locale/message provider contract.

Export small reusable UnitedStatesFlagIcon and VietnamFlagIcon components from
the locale-switcher entry. Consumers may provide any SVG, image, or other React
node for additional languages. No inferred country mapping, flag service, or
external dependency is needed. Use US for English in the demo and starter.

Update the demo, multilingual starter, stories, and consumer documentation.
Verify both icon locations, programmatic and user selection changes, accessible
labels/typeahead, existing icon-free options, and a consumer-defined third flag.
