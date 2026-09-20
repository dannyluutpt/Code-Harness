import { type ComponentProps } from "solid-js"

export const Mark = (props: { class?: string }) => {
  return (
    <svg
      data-component="logo-mark"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="12" y="0" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="0" y="4" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="12" y="4" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="0" y="8" width="12" height="4" fill="var(--icon-strong-base)" />
      <rect x="0" y="12" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="12" y="12" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="0" y="16" width="4" height="4" fill="var(--icon-strong-base)" />
      <rect x="12" y="16" width="4" height="4" fill="var(--icon-strong-base)" />
    </svg>
  )
}

export const Splash = (props: Pick<ComponentProps<"svg">, "ref" | "class">) => {
  return (
    <svg
      ref={props.ref}
      data-component="logo-splash"
      classList={{ [props.class ?? ""]: !!props.class }}
      viewBox="0 0 80 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="60" y="0" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="0" y="20" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="60" y="20" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="0" y="40" width="60" height="20" fill="var(--icon-strong-base)" />
      <rect x="0" y="60" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="60" y="60" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="0" y="80" width="20" height="20" fill="var(--icon-strong-base)" />
      <rect x="60" y="80" width="20" height="20" fill="var(--icon-strong-base)" />
    </svg>
  )
}

// Blocky "kiwii" wordmark. The dots of the three "i"s are kiwi seeds and take the brand colour.
// `tight` drops the padding that keeps the legacy 234x42 footprint.
export const Logo = (props: { class?: string; tight?: boolean }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={props.tight ? "0 0 108 36" : "-63 -3 234 42"}
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <rect x="0" y="0" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="0" y="6" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="18" y="6" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="0" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="18" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="0" y="18" width="18" height="6" fill="var(--icon-strong-base)" />
      <rect x="0" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="18" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="0" y="30" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="18" y="30" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="33" y="0" width="6" height="6" fill="var(--surface-brand-base)" />
      <rect x="33" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="33" y="18" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="33" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="33" y="30" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="48" y="6" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="60" y="6" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="72" y="6" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="48" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="60" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="72" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="48" y="18" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="60" y="18" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="72" y="18" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="48" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="60" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="72" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="48" y="30" width="30" height="6" fill="var(--icon-strong-base)" />
      <rect x="87" y="0" width="6" height="6" fill="var(--surface-brand-base)" />
      <rect x="87" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="87" y="18" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="87" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="87" y="30" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="102" y="0" width="6" height="6" fill="var(--surface-brand-base)" />
      <rect x="102" y="12" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="102" y="18" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="102" y="24" width="6" height="6" fill="var(--icon-strong-base)" />
      <rect x="102" y="30" width="6" height="6" fill="var(--icon-strong-base)" />
    </svg>
  )
}
