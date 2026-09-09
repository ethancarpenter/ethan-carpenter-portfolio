import { useCallback, useState } from 'react'

export interface ElementSize {
  width: number
  height: number
}

/**
 * Track an element's content-box size with a ResizeObserver.
 *
 * Returns a ref callback to attach and the latest size (`{ width: 0, height: 0 }`
 * until first measured). Used so the cafe scene's art can be positioned from the
 * same live pixel size the Matter.js world measures, keeping the drawn grinder
 * funnel exactly on its colliders at every breakpoint.
 *
 * @example
 *   const [ref, size] = useElementSize<HTMLDivElement>()
 *   return <div ref={ref}>{size.width}</div>
 */
export function useElementSize<T extends HTMLElement>(): [
  (node: T | null) => void,
  ElementSize,
] {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  const ref = useCallback((node: T | null) => {
    if (!node) return
    const measure = () => {
      const rect = node.getBoundingClientRect()
      setSize((prev) =>
        prev.width === rect.width && prev.height === rect.height
          ? prev
          : { width: rect.width, height: rect.height },
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    // The cleanup runs when React swaps the node or unmounts (ref callback
    // contract): disconnect the old observer.
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}
