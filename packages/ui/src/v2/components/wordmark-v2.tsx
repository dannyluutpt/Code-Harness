import { createUniqueId, type ComponentProps } from "solid-js"

// Blocky "kiwii" wordmark. The dots of the three "i"s are kiwi seeds and take the brand colour.
export function WordmarkV2(props: Pick<ComponentProps<"svg">, "class">) {
  const mask = createUniqueId()
  const maskGradient = createUniqueId()

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 720 129"
      fill="none"
      classList={{ [props.class ?? ""]: !!props.class }}
    >
      <g mask={`url(#${mask})`}>
        <g opacity="0.12" fill="currentColor">
          <rect x="194.14" y="0.0" width="18.43" height="18.43" />
          <rect x="194.14" y="18.43" width="18.43" height="18.43" />
          <rect x="249.43" y="18.43" width="18.43" height="18.43" />
          <rect x="194.14" y="36.86" width="18.43" height="18.43" />
          <rect x="249.43" y="36.86" width="18.43" height="18.43" />
          <rect x="194.14" y="55.29" width="55.29" height="18.43" />
          <rect x="194.14" y="73.71" width="18.43" height="18.43" />
          <rect x="249.43" y="73.71" width="18.43" height="18.43" />
          <rect x="194.14" y="92.14" width="18.43" height="18.43" />
          <rect x="249.43" y="92.14" width="18.43" height="18.43" />
          <rect x="295.5" y="36.86" width="18.43" height="18.43" />
          <rect x="295.5" y="55.29" width="18.43" height="18.43" />
          <rect x="295.5" y="73.71" width="18.43" height="18.43" />
          <rect x="295.5" y="92.14" width="18.43" height="18.43" />
          <rect x="341.57" y="18.43" width="18.43" height="18.43" />
          <rect x="378.43" y="18.43" width="18.43" height="18.43" />
          <rect x="415.29" y="18.43" width="18.43" height="18.43" />
          <rect x="341.57" y="36.86" width="18.43" height="18.43" />
          <rect x="378.43" y="36.86" width="18.43" height="18.43" />
          <rect x="415.29" y="36.86" width="18.43" height="18.43" />
          <rect x="341.57" y="55.29" width="18.43" height="18.43" />
          <rect x="378.43" y="55.29" width="18.43" height="18.43" />
          <rect x="415.29" y="55.29" width="18.43" height="18.43" />
          <rect x="341.57" y="73.71" width="18.43" height="18.43" />
          <rect x="378.43" y="73.71" width="18.43" height="18.43" />
          <rect x="415.29" y="73.71" width="18.43" height="18.43" />
          <rect x="341.57" y="92.14" width="92.14" height="18.43" />
          <rect x="461.36" y="36.86" width="18.43" height="18.43" />
          <rect x="461.36" y="55.29" width="18.43" height="18.43" />
          <rect x="461.36" y="73.71" width="18.43" height="18.43" />
          <rect x="461.36" y="92.14" width="18.43" height="18.43" />
          <rect x="507.43" y="36.86" width="18.43" height="18.43" />
          <rect x="507.43" y="55.29" width="18.43" height="18.43" />
          <rect x="507.43" y="73.71" width="18.43" height="18.43" />
          <rect x="507.43" y="92.14" width="18.43" height="18.43" />
        </g>
        <g opacity="0.55" fill="var(--surface-brand-base)">
          <rect x="295.5" y="0.0" width="18.43" height="18.43" />
          <rect x="461.36" y="0.0" width="18.43" height="18.43" />
          <rect x="507.43" y="0.0" width="18.43" height="18.43" />
        </g>
      </g>
      <defs>
        <mask id={mask} style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="720" height="129">
          <rect width="720" height="129" fill={`url(#${maskGradient})`} />
        </mask>
        <linearGradient id={maskGradient} x1="360" y1="68" x2="360" y2="129" gradientUnits="userSpaceOnUse">
          <stop stop-color="white" stop-opacity="0.7" />
          <stop offset="1" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
    </svg>
  )
}
