export const getFlagEmoji = (countryName: string): string => {
  if (!countryName) return "🏳️";
  const clean = countryName.toLowerCase().trim();
  
  const flags: Record<string, string> = {
    'argentina': '🇦🇷',
    'españa': '🇪🇸',
    'espana': '🇪🇸',
    'spain': '🇪🇸',
    'brasil': '🇧🇷',
    'brazil': '🇧🇷',
    'uruguay': '🇺🇾',
    'francia': '🇫🇷',
    'france': '🇫🇷',
    'italia': '🇮🇹',
    'italy': '🇮🇹',
    'portugal': '🇵🇹',
    'colombia': '🇨🇴',
    'alemania': '🇩🇪',
    'germany': '🇩🇪',
    'inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    'turquía': '🇹🇷',
    'turquia': '🇹🇷',
    'turkey': '🇹🇷',
    'bélgica': '🇧🇪',
    'belgica': '🇧🇪',
    'belgium': '🇧🇪',
    'chile': '🇨🇱',
    'paraguay': '🇵🇾',
    'méxico': '🇲🇽',
    'mexico': '🇲🇽',
    'eeuu': '🇺🇸',
    'usa': '🇺🇸',
    'estados unidos': '🇺🇸',
    'suecia': '🇸🇪',
    'sweden': '🇸🇪',
    'senegal': '🇸🇳',
    'polonia': '🇵🇱',
    'poland': '🇵🇱',
    'holanda': '🇳🇱',
    'países bajos': '🇳🇱',
    'netherlands': '🇳🇱',
    'croacia': '🇭🇷',
    'croatia': '🇭🇷',
    'marruecos': '🇲🇦',
    'morocco': '🇲🇦',
    'ecuador': '🇪🇨',
    'venezuela': '🇻🇪',
    'perú': '🇵🇪',
    'peru': '🇵🇪',
    'bolivia': '🇧🇴',
    'suiza': '🇨🇭',
    'switzerland': '🇨🇭',
    'austria': '🇦🇹',
    'ucrania': '🇺🇦',
    'ukraine': '🇺🇦',
    'noruega': '🇳🇴',
    'norway': '🇳🇴',
    'dinamarca': '🇩🇰',
    'denmark': '🇩🇰',
    'grecia': '🇬🇷',
    'greece': '🇬🇷',
    'japón': '🇯🇵',
    'japon': '🇯🇵',
    'japan': '🇯🇵',
    'corea': '🇰🇷',
    'korea': '🇰🇷',
  };

  for (const [key, value] of Object.entries(flags)) {
    if (clean.includes(key)) {
      return value;
    }
  }
  
  return "🏳️";
};

// Check if player nationality contains Turkish first or second nationality
export const isTurkishPlayer = (nationality: string): boolean => {
  if (!nationality) return false;
  const clean = nationality.toLowerCase();
  return clean.includes('turq') || clean.includes('turk');
};

// Extract flags for multiple nationalities (e.g. split by /, ,, etc.)
export const getPlayerFlags = (nationality: string): string[] => {
  if (!nationality) return ["🏳️"];
  const parts = nationality.split(/[\/,;\-\\]+/).map(p => p.trim()).filter(Boolean);
  if (parts.length === 0) return ["🏳️"];
  return parts.map(part => getFlagEmoji(part));
};

// Helper to format ratings with star + percentage in parentheses
export const formatRatingWithPercentage = (starsCount: number, customRating?: string): string => {
  let pct = `${(starsCount * 20).toFixed(1)}%`;
  
  if (customRating) {
    if (customRating.includes('%')) {
      pct = customRating;
    } else {
      const parsed = parseFloat(customRating);
      if (!isNaN(parsed)) {
        pct = parsed <= 100 ? `${parsed.toFixed(1)}%` : `${((parsed / 200) * 100).toFixed(1)}%`;
      }
    }
  }
  
  return `${"★".repeat(starsCount)}${"☆".repeat(5 - starsCount)} (${pct})`;
};
