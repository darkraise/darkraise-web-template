import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Listbox, ListboxItem } from "darkraise-ui/components/listbox"
import type { ListboxVariant } from "darkraise-ui/components/listbox"
import { allOf } from "./_components/-variant-axes"
import { VariantMatrix } from "./_components/-variant-matrix"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/listbox")({
  component: ListboxPage,
})

const LISTBOX_VARIANTS = allOf<ListboxVariant>()("filled", "outline")

const FRUITS = ["Apple", "Banana", "Cherry", "Durian", "Elderberry"]
const TOPPINGS = ["Cheese", "Pepperoni", "Mushrooms", "Olives", "Onions"]
const MEAL_PLAN = [
  "Spaghetti carbonara",
  "Chicken tikka masala",
  "Beef bourguignon",
  "Pad thai",
  "Margherita pizza",
  "Falafel wrap",
  "Sushi platter",
  "Ramen bowl",
  "Caesar salad",
  "Tom yum soup",
  "Pho ga",
  "Tacos al pastor",
]

function ListboxPage() {
  const [fruit, setFruit] = useState<string | string[]>("Cherry")
  const [toppings, setToppings] = useState<string | string[]>([
    "Cheese",
    "Mushrooms",
  ])
  const selectedToppings = Array.isArray(toppings) ? toppings : []
  const [planChoice, setPlanChoice] = useState<string | string[]>(
    "Spaghetti carbonara",
  )
  const [withDisabled, setWithDisabled] = useState<string | string[]>("Apple")
  const [outlineFruit, setOutlineFruit] = useState<string | string[]>("Cherry")
  const [outlineToppings, setOutlineToppings] = useState<string | string[]>([
    "Cheese",
    "Olives",
  ])

  return (
    <ShowcasePage
      title="Listbox"
      description="Keyboard-navigable list of options. Supports single and multi-selection with arrow keys, Home, End, and typeahead."
    >
      <ShowcaseExample
        title="Single selection"
        code={`const [fruit, setFruit] = useState<string | string[]>("Cherry")

<Listbox value={fruit} onValueChange={setFruit} aria-label="Fruit">
  {FRUITS.map((f) => (
    <ListboxItem key={f} value={f}>{f}</ListboxItem>
  ))}
</Listbox>`}
      >
        <div className="space-y-2">
          <Listbox value={fruit} onValueChange={setFruit} aria-label="Fruit">
            {FRUITS.map((f) => (
              <ListboxItem key={f} value={f}>
                {f}
              </ListboxItem>
            ))}
          </Listbox>
          <p className="text-muted-foreground text-xs">
            Selected: <span className="font-medium">{String(fruit)}</span>
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Variant"
        code={`// One representative cell: every variant renders above.
<Listbox variant="outline" defaultValue="Cherry" aria-label="Fruit">
  <ListboxItem value="Apple">Apple</ListboxItem>
  <ListboxItem value="Banana">Banana</ListboxItem>
  <ListboxItem value="Cherry">Cherry</ListboxItem>
</Listbox>`}
      >
        <VariantMatrix
          rows={{ label: "variant", values: LISTBOX_VARIANTS }}
          render={(variant) => (
            <Listbox
              variant={variant}
              defaultValue="Cherry"
              aria-label={`Fruit (${variant})`}
            >
              {FRUITS.map((f) => (
                <ListboxItem key={f} value={f}>
                  {f}
                </ListboxItem>
              ))}
            </Listbox>
          )}
        />
      </ShowcaseExample>

      <ShowcaseExample
        title="Outline variant"
        code={`<Listbox
  variant="outline"
  value={fruit}
  onValueChange={setFruit}
  aria-label="Fruit"
>
  {FRUITS.map((f) => (
    <ListboxItem key={f} value={f}>{f}</ListboxItem>
  ))}
</Listbox>`}
      >
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">
            Marks selection with a 1px primary ring instead of a solid fill. The
            ring is drawn inside the item&apos;s box, so switching variants
            shifts no layout — useful for dense lists where a run of filled rows
            reads heavy.
          </p>
          <div className="flex flex-wrap gap-6">
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                Single selection
              </p>
              <Listbox
                variant="outline"
                value={outlineFruit}
                onValueChange={setOutlineFruit}
                aria-label="Fruit (outline)"
              >
                {FRUITS.map((f) => (
                  <ListboxItem key={f} value={f}>
                    {f}
                  </ListboxItem>
                ))}
              </Listbox>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-xs font-medium">
                Multi selection
              </p>
              <Listbox
                variant="outline"
                mode="multi"
                value={outlineToppings}
                onValueChange={setOutlineToppings}
                aria-label="Toppings (outline)"
              >
                {TOPPINGS.map((t) => (
                  <ListboxItem key={t} value={t}>
                    {t}
                  </ListboxItem>
                ))}
              </Listbox>
            </div>
          </div>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="Multi selection"
        code={`const [toppings, setToppings] = useState<string | string[]>([
  "Cheese",
  "Mushrooms",
])

<Listbox
  mode="multi"
  value={toppings}
  onValueChange={setToppings}
  aria-label="Toppings"
>
  {TOPPINGS.map((t) => (
    <ListboxItem key={t} value={t}>{t}</ListboxItem>
  ))}
</Listbox>`}
      >
        <div className="space-y-2">
          <Listbox
            mode="multi"
            value={toppings}
            onValueChange={setToppings}
            aria-label="Toppings"
          >
            {TOPPINGS.map((t) => (
              <ListboxItem key={t} value={t}>
                {t}
              </ListboxItem>
            ))}
          </Listbox>
          <p className="text-muted-foreground text-xs">
            {selectedToppings.length} selected
            {selectedToppings.length > 0
              ? `: ${selectedToppings.join(", ")}`
              : ""}
          </p>
        </div>
      </ShowcaseExample>

      <ShowcaseExample
        title="With disabled options"
        code={`<Listbox
  value={fruit}
  onValueChange={setFruit}
  aria-label="Fruit with one disabled"
>
  <ListboxItem value="Apple">Apple</ListboxItem>
  <ListboxItem value="Banana" disabled>Banana (out of stock)</ListboxItem>
  <ListboxItem value="Cherry">Cherry</ListboxItem>
</Listbox>`}
      >
        <Listbox
          value={withDisabled}
          onValueChange={setWithDisabled}
          aria-label="Fruit with one disabled"
        >
          <ListboxItem value="Apple">Apple</ListboxItem>
          <ListboxItem value="Banana" disabled>
            Banana (out of stock)
          </ListboxItem>
          <ListboxItem value="Cherry">Cherry</ListboxItem>
          <ListboxItem value="Durian">Durian</ListboxItem>
          <ListboxItem value="Elderberry">Elderberry</ListboxItem>
        </Listbox>
      </ShowcaseExample>

      <ShowcaseExample
        title="Long list with scroll"
        code={`<Listbox value={meal} onValueChange={setMeal} aria-label="Meal plan">
  {MEAL_PLAN.map((m) => (
    <ListboxItem key={m} value={m}>{m}</ListboxItem>
  ))}
</Listbox>`}
      >
        <Listbox
          value={planChoice}
          onValueChange={setPlanChoice}
          aria-label="Meal plan"
        >
          {MEAL_PLAN.map((m) => (
            <ListboxItem key={m} value={m}>
              {m}
            </ListboxItem>
          ))}
        </Listbox>
      </ShowcaseExample>
    </ShowcasePage>
  )
}
