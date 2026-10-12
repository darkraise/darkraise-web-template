import type { ThemeRegistry } from "@theme/config/registry"

/**
 * The values the Preset control lists: `base`, then the presets of `style`
 * that `allowed` names (every one of them when it is left out) in registry
 * order, then `active` when it is not among them, so the control always
 * shows the preset that is applied.
 */
export function presetOptions(
  registry: ThemeRegistry,
  style: string,
  active: string,
  allowed?: readonly string[],
): string[] {
  const options = ["base"]
  for (const preset of Object.values(registry.presets)) {
    if (preset.style !== style) continue
    if (Array.isArray(allowed) && !allowed.includes(preset.name)) continue
    options.push(preset.name)
  }
  if (!options.includes(active)) options.push(active)
  return options
}
