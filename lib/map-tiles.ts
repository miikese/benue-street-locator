export const MAP_MAX_ZOOM = 22;
export const SATELLITE_NATIVE_ZOOM = 20;
export const IMAGERY_URL = "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer";

// Crop the matching part of a parent tile, rather than stretching the whole
// parent into each child. This keeps roads and GPS pins correctly aligned.
export function parentTile(tile: {x: number; y: number; z: number}, level: number) {
  const scale = 2 ** (tile.z - level);
  return {x: Math.floor(tile.x / scale), y: Math.floor(tile.y / scale), z: level,
    size: 256 * scale, left: -(tile.x % scale) * 256, top: -(tile.y % scale) * 256};
}

export function locationError(code: number) {
  if (code === 1) return "Location access is blocked. Allow location for this site in your browser settings, then try again.";
  if (code === 3) return "Finding your position took too long. Move near a window or outdoors and try again.";
  return "Your device cannot find a position right now. Check that location services are on and try again.";
}
