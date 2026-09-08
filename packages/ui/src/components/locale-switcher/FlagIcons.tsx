import type { SVGProps } from "react"

const star =
  "M0-1 .2245-.309 .9511-.309 .3633.118 .5878.809 0 .382-.5878.809-.3633.118-.9511-.309-.2245-.309Z"

export function UnitedStatesFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 19 10"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="#b22234" d="M0 0h19v10H0z" />
      {Array.from({ length: 6 }, (_, index) => (
        <rect
          key={index}
          y={((index * 2 + 1) * 10) / 13}
          width="19"
          height={10 / 13}
          fill="#fff"
        />
      ))}
      <path fill="#3c3b6e" d="M0 0h7.6v5.3846H0z" />
      {Array.from({ length: 9 }, (_, row) =>
        Array.from({ length: row % 2 === 0 ? 6 : 5 }, (_, column) => (
          <path
            key={`${row}-${column}`}
            d={star}
            fill="#fff"
            transform={`translate(${((column * 2 + 1 + (row % 2)) * 7.6) / 12} ${((row + 1) * 5.3846) / 10}) scale(.308)`}
          />
        )),
      )}
    </svg>
  )
}

export function VietnamFlagIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="24"
      height="16"
      viewBox="0 0 30 20"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path fill="#da251d" d="M0 0h30v20H0z" />
      <path fill="#ff0" d={star} transform="translate(15 10) scale(6)" />
    </svg>
  )
}
