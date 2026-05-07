import type { Meta, StoryObj } from "@storybook/react-vite"

import { Avatar, AvatarFallback, AvatarImage } from "@components/avatar"

const meta: Meta<typeof Avatar> = {
  title: "UI/Avatar",
  component: Avatar,
  tags: ["autodocs"],
}

export default meta
type Story = StoryObj<typeof Avatar>

export const WithImage: Story = {
  render: () => (
    <Avatar className="size-12">
      <AvatarImage src="https://github.com/shadcn.png" alt="profile picture" />
      <AvatarFallback>SH</AvatarFallback>
    </Avatar>
  ),
}

export const FallbackOnly: Story = {
  render: () => (
    <Avatar className="size-12">
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const FallbackOnError: Story = {
  render: () => (
    <Avatar className="size-12">
      <AvatarImage src="/does-not-exist.png" alt="missing" />
      <AvatarFallback>NA</AvatarFallback>
    </Avatar>
  ),
}
