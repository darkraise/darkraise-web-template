import type { Meta, StoryObj } from "@storybook/react-vite"
import { Input } from "../input"

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    type: "text",
  },
}

export const WithPlaceholder: Story = {
  args: {
    type: "text",
    placeholder: "Enter text...",
  },
}

export const Disabled: Story = {
  args: {
    type: "text",
    placeholder: "Disabled input",
    disabled: true,
  },
}

export const Email: Story = {
  args: {
    type: "email",
    placeholder: "name@example.com",
  },
}

export const Password: Story = {
  args: {
    type: "password",
    placeholder: "Enter password",
  },
}

export const Search: Story = {
  args: {
    type: "search",
    placeholder: "Search...",
  },
}

export const AllTypes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input type="text" placeholder="Text" />
      <Input type="email" placeholder="Email" />
      <Input type="password" placeholder="Password" />
      <Input type="search" placeholder="Search" />
      <Input type="text" placeholder="Disabled" disabled />
    </div>
  ),
}
