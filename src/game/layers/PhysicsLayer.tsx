interface LayerProps {
  className: string
}

/**
 * Host element for the Matter.js renderer. Empty for now; it stays in the tree
 * so the bean canvas keeps a stable z-index between the static props and the
 * effects layer.
 */
export function PhysicsLayer({ className }: LayerProps) {
  return <div className={className} data-layer="physics" aria-hidden="true" />
}
