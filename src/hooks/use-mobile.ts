// src/hooks/useIsMobile.ts
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
/** true below Tailwind's `lg` breakpoint (1024px), where the sidebar becomes a slide-in drawer */
export function useIsDrawerNav() {
  const [below, setBelow] = React.useState(false)

  React.useEffect(() => {
    const mql = window.matchMedia("(max-width: 1023px)")
    const onChange = () => setBelow(mql.matches)
    mql.addEventListener("change", onChange)
    onChange()
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return below
}
