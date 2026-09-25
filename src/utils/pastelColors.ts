// Bright Pastel Minimalist Palette and Dominant Color Utilities

export const PASTELS = {
  cream: '#FFF8EE',
  pastelPink: '#F8DDE6',
  softLavender: '#E7DDF7',
  powderBlue: '#DCEEFF',
  mint: '#DDF3E8',
  softPeach: '#FFE1D2',
  paleYellow: '#FFF1C9',
  softCoral: '#F6C9C5',
  darkText: '#242424',
  mutedText: '#5A5550',
  border: 'rgba(36, 36, 36, 0.1)',
  borderSoft: 'rgba(36, 36, 36, 0.06)',
};

export const PASTEL_ARRAY = [
  { name: 'Cream', hex: PASTELS.cream },
  { name: 'Soft Lavender', hex: PASTELS.softLavender },
  { name: 'Powder Blue', hex: PASTELS.powderBlue },
  { name: 'Pastel Pink', hex: PASTELS.pastelPink },
  { name: 'Mint Green', hex: PASTELS.mint },
  { name: 'Soft Peach', hex: PASTELS.softPeach },
  { name: 'Pale Yellow', hex: PASTELS.paleYellow },
  { name: 'Soft Coral', hex: PASTELS.softCoral },
];

/**
 * Returns a deterministic, curated soft pastel background color for a design item.
 */
export function getPastelForDesign(id: string, index = 0): string {
  const curatedSelection = [
    PASTELS.softLavender, // #E7DDF7
    PASTELS.powderBlue,   // #DCEEFF
    PASTELS.softPeach,    // #FFE1D2
    PASTELS.pastelPink,   // #F8DDE6
    PASTELS.mint,         // #DDF3E8
    PASTELS.paleYellow,   // #FFF1C9
    PASTELS.softCoral,    // #F6C9C5
    PASTELS.cream,        // #FFF8EE
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const selectedIdx = Math.abs(hash + index) % curatedSelection.length;
  return curatedSelection[selectedIdx];
}

/**
 * Extracts a soft pastel version of an image's dominant color using an off-screen canvas.
 * If CORS or parsing fails, seamlessly returns fallback pastel.
 */
export function extractPastelFromImage(
  imgElement: HTMLImageElement | null,
  fallback: string
): Promise<string> {
  return new Promise((resolve) => {
    if (!imgElement || !imgElement.complete || imgElement.naturalWidth === 0) {
      resolve(fallback);
      return;
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(fallback);
        return;
      }

      // Sample a small 32x32 thumbnail to get average chromatic value fast
      canvas.width = 32;
      canvas.height = 32;
      ctx.drawImage(imgElement, 0, 0, 32, 32);

      const imageData = ctx.getImageData(0, 0, 32, 32).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;

      for (let i = 0; i < imageData.length; i += 4) {
        // Skip purely dark, blown-out white, or transparent pixels
        const pr = imageData[i];
        const pg = imageData[i + 1];
        const pb = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue;
        const brightness = (pr + pg + pb) / 3;
        if (brightness < 20 || brightness > 245) continue;

        r += pr;
        g += pg;
        b += pb;
        count++;
      }

      if (count === 0) {
        resolve(fallback);
        return;
      }

      r = Math.round(r / count);
      g = Math.round(g / count);
      b = Math.round(b / count);

      // Convert RGB to HSL
      const rNorm = r / 255;
      const gNorm = g / 255;
      const bNorm = b / 255;
      const max = Math.max(rNorm, gNorm, bNorm);
      const min = Math.min(rNorm, gNorm, bNorm);
      let h = 0;
      let s = 0;
      const l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case rNorm:
            h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
            break;
          case gNorm:
            h = (bNorm - rNorm) / d + 2;
            break;
          case bNorm:
            h = (rNorm - gNorm) / d + 4;
            break;
        }
        h /= 6;
      }

      // Mathematically shift to a soft bright pastel:
      // High lightness (90% - 94%) and gentle saturation (30% - 40%)
      const pastelH = Math.round(h * 360);
      const pastelS = Math.min(Math.max(Math.round(s * 100), 28), 45); // Soft saturation
      const pastelL = 92; // Airy, luminous pastel lightness

      resolve(`hsl(${pastelH}, ${pastelS}%, ${pastelL}%)`);
    } catch {
      resolve(fallback);
    }
  });
}
