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
    const pctMatch = customRating.match(/(\d+[,.]?\d*)\s*%/);
    if (pctMatch) {
      pct = customRating;
    } else {
      const numMatch = customRating.match(/(\d+[,.]?\d*)/);
      if (numMatch) {
        const num = parseFloat(numMatch[1].replace(',', '.'));
        if (!isNaN(num)) {
          pct = num <= 5 ? `${(num * 20).toFixed(1)}%` : num <= 100 ? `${num.toFixed(1)}%` : `${((num / 200) * 100).toFixed(1)}%`;
        }
      }
    }
  }
  
  const filledCount = Math.floor(starsCount);
  const hasHalf = starsCount % 1 >= 0.5;
  const emptyCount = Math.max(0, 5 - filledCount - (hasHalf ? 1 : 0));
  
  const starsStr = "★".repeat(filledCount) + (hasHalf ? "½" : "") + "☆".repeat(emptyCount);
  return `${starsStr} (${pct})`;
};

// Helper to calculate age based on Date of Birth and the exact current game date (fallback to year subtraction if date format mismatch)
export const calculateAgeFromDOBPrecise = (dob: string | undefined, fallbackAge: number, gameDate: string): number => {
  if (!dob || dob === 'N/A' || dob === 'N/D') return fallbackAge;
  
  const parseDate = (dStr: string): Date | null => {
    const clean = dStr.trim();
    const parts = clean.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      let d = parseInt(parts[0]);
      let m = parseInt(parts[1]) - 1; // 0-indexed
      let y = parseInt(parts[2]);
      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
      if (y < 100) y += 2000;
      return new Date(y, m, d);
    } else if (/^\d{4}$/.test(clean)) {
      return new Date(parseInt(clean), 0, 1);
    }
    return null;
  };

  const dobDate = parseDate(dob);
  const currentDate = parseDate(gameDate);

  if (dobDate && currentDate) {
    let ageDiff = currentDate.getFullYear() - dobDate.getFullYear();
    const monthDiff = currentDate.getMonth() - dobDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < dobDate.getDate())) {
      ageDiff--;
    }
    return ageDiff;
  }
  
  // Year fallback if precise parse failed
  const partsGame = gameDate.split(/[\.\-\/]+/);
  const yearGame = partsGame.length === 3 ? parseInt(partsGame[2]) : parseInt(gameDate) || 2036;
  return calculateAgeFromDOB(dob, fallbackAge, yearGame);
};

// Helper to calculate age based on Date of Birth and the current game year (as fallback)
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

// Helper to calculate years or months remaining on a contract relative to the exact game date
export const calculateContractYearsRemainingPrecise = (contractEnd: string | undefined, gameDate: string): string => {
  if (!contractEnd || contractEnd === 'N/A' || contractEnd === 'N/D') return "N/D";
  
  const parseDate = (dStr: string): Date | null => {
    const clean = dStr.trim();
    const parts = clean.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      let d = parseInt(parts[0]);
      let m = parseInt(parts[1]) - 1; // 0-indexed
      let y = parseInt(parts[2]);
      if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
      if (y < 100) y += 2000;
      return new Date(y, m, d);
    } else if (/^\d{4}$/.test(clean)) {
      return new Date(parseInt(clean), 5, 30); // Default to June 30th of that year
    }
    return null;
  };

  const dateCurrent = parseDate(gameDate);
  const dateEnd = parseDate(contractEnd);

  if (dateCurrent && dateEnd) {
    const diffTime = dateEnd.getTime() - dateCurrent.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    if (diffDays <= 0) {
      return `Terminado / Vencido (${contractEnd})`;
    }
    
    const years = diffDays / 365.25;
    if (years < 1) {
      const months = Math.round(diffDays / 30.4375);
      if (months <= 1) {
        return `1 mes (${contractEnd})`;
      }
      return `${months} meses (${contractEnd})`;
    } else {
      return `${years.toFixed(1)} ${years.toFixed(1) === '1.0' ? 'año' : 'años'} (${contractEnd})`;
    }
  }

  // Fallback to simple year math
  const partsGame = gameDate.split(/[\.\-\/]+/);
  const yearGame = partsGame.length === 3 ? parseInt(partsGame[2]) : parseInt(gameDate) || 2036;
  return calculateContractYearsRemaining(contractEnd, yearGame);
};

// Helper to calculate years remaining on a contract relative to the current game year (as fallback)
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
