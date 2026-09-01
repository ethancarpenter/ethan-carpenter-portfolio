interface LayerProps {
  className: string
}

/**
 * Host element for particles, coffee-ground bursts, steam, and score popups.
 * Empty for now; sits above the physics layer and below the scene UI.
 */
export function EffectsLayer({ className }: LayerProps) {
  return <div className={className} data-layer="effects" aria-hidden="true" />
}
