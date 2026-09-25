import React, { createContext, useContext, useEffect, useState } from 'react';

export type PastelTone = 'cream' | 'lavender' | 'powderBlue' | 'peach';

interface ThemeContextType {
  pastelTone: PastelTone;
  setPastelTone: (tone: PastelTone) => void;
  cyclePastelTone: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  pastelTone: 'cream',
  setPastelTone: () => {},
  cyclePastelTone: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pastelTone, setPastelTone] = useState<PastelTone>(() => {
    const saved = localStorage.getItem('nimra_pastel_tone') as PastelTone;
    if (['cream', 'lavender', 'powderBlue', 'peach'].includes(saved)) {
      return saved;
    }
    return 'cream';
  });

  const tones: PastelTone[] = ['cream', 'lavender', 'powderBlue', 'peach'];

  const cyclePastelTone = () => {
    setPastelTone((prev) => {
      const idx = tones.indexOf(prev);
      return tones[(idx + 1) % tones.length];
    });
  };

  useEffect(() => {
    localStorage.setItem('nimra_pastel_tone', pastelTone);
    const root = document.documentElement;
    root.setAttribute('data-pastel-tone', pastelTone);

    // Apply bright pastel background and readable dark charcoal text
    let bgHex = '#FFF8EE';
    if (pastelTone === 'lavender') bgHex = '#E7DDF7';
    if (pastelTone === 'powderBlue') bgHex = '#DCEEFF';
    if (pastelTone === 'peach') bgHex = '#FFE1D2';

    document.body.style.backgroundColor = bgHex;
    document.body.className =
      'antialiased text-[#242424] selection:bg-[#242424] selection:text-[#FFF8EE] transition-colors duration-500';
  }, [pastelTone]);

  return (
    <ThemeContext.Provider value={{ pastelTone, setPastelTone, cyclePastelTone }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

