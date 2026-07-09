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

// Helper to calculate age based on Date of Birth and the current game year
export const calculateAgeFromDOB = (dob: string | undefined, fallbackAge: number, gameYear: number): number => {
  if (!dob || dob === 'N/A' || dob === 'N/D') return fallbackAge;
  const clean = dob.trim();
  if (/^\d{4}$/.test(clean)) {
    const year = parseInt(clean);
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      return gameYear - year;
    }
  }
  const parts = clean.split(/[\.\-\/]+/);
  if (parts.length === 3) {
    // Check if the 3rd part or the 1st part is the 4-digit year
    let year = parseInt(parts[2]);
    if (isNaN(year) || year < 100) {
      year = parseInt(parts[0]);
    }
    if (!isNaN(year) && year >= 1900 && year <= 2100) {
      return gameYear - year;
    }
  }
  return fallbackAge;
};

// Helper to calculate years remaining on a contract relative to the current game year
export const calculateContractYearsRemaining = (contractEnd: string | undefined, gameYear: number): string => {
  if (!contractEnd || contractEnd === 'N/A' || contractEnd === 'N/D') return "N/D";
  const clean = contractEnd.trim();
  let year = 0;
  
  if (/^\d{4}$/.test(clean)) {
    year = parseInt(clean);
  } else {
    const parts = clean.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      let y = parseInt(parts[2]);
      if (isNaN(y) || y < 100) {
        y = parseInt(parts[0]);
      }
      if (!isNaN(y) && y >= 1900) {
        year = y;
      }
    }
  }
  
  if (year > 0) {
    const diff = year - gameYear;
    if (diff <= 0) return `Termina (${contractEnd})`;
    return `${diff} ${diff === 1 ? 'año' : 'años'} (${contractEnd})`;
  }
  return contractEnd;
};
