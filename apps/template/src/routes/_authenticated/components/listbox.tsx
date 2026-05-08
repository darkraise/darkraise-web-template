import { useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import { Listbox, ListboxItem } from "darkraise-ui/components/listbox"
import { ShowcaseExample } from "./_components/-showcase-example"
import { ShowcasePage } from "./_components/-showcase-page"

export const Route = createFileRoute("/_authenticated/components/listbox")({
  component: ListboxPage,
})

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
