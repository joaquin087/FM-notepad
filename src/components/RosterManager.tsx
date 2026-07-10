import React, { useState } from 'react';
import { Player } from '../types';
import { getFlagEmoji, isTurkishPlayer, formatRatingWithPercentage, getPlayerFlags, calculateAgeFromDOB, calculateContractYearsRemaining, calculateAgeFromDOBPrecise, calculateContractYearsRemainingPrecise } from '../utils/flags';
import { Search, Filter, Plus, Trash2, Edit3, Check, X, Star, AlertCircle, RefreshCw, Trash, FileText, Calendar } from 'lucide-react';
import { fifaNations } from '../utils/fifaNations';

interface RosterManagerProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  onAddPlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onResetToDefaults: () => void;
  onDeleteAllPlayers: () => void;
  gameYear: number;
  gameDate: string;
}

const getFMStarsAndColor = (pct: number) => {
  if (pct < 50) {
    const stars = Math.min(5.0, Math.max(0.5, Math.floor(pct / 5) * 0.5 + 0.5));
    return { stars, color: 'silver' as const };
  } else {
    const stars = Math.min(5.0, Math.max(0.5, Math.floor((pct - 50) / 5) * 0.5 + 0.5));
    return { stars, color: 'gold' as const };
  }
};

export function RosterManager({ players, onUpdatePlayer, onAddPlayer, onDeletePlayer, onResetToDefaults, onDeleteAllPlayers, gameYear, gameDate }: RosterManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [contractYearsFilter, setContractYearsFilter] = useState('ALL');
  const [minAgeFilter, setMinAgeFilter] = useState<string>('');
  const [maxAgeFilter, setMaxAgeFilter] = useState<string>('');

  // Separate first and last name for manual add player
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');

  // Manual annual salary input
  const [newAnnualWageInput, setNewAnnualWageInput] = useState('416000');

  // Contract renewal states
  const [renewingPlayer, setRenewingPlayer] = useState<Player | null>(null);
  const [renewContractEnd, setRenewContractEnd] = useState('');
  const [renewAnnualWage, setRenewAnnualWage] = useState('');

  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editNacionalidad1, setEditNacionalidad1] = useState('');
  const [editNacionalidad2, setEditNacionalidad2] = useState('');
  const [showEditNationsDropdown1, setShowEditNationsDropdown1] = useState(false);
  const [showEditNationsDropdown2, setShowEditNationsDropdown2] = useState(false);
  const [editBirthDay, setEditBirthDay] = useState('');
  const [editBirthMonth, setEditBirthMonth] = useState('');
  const [editBirthYear, setEditBirthYear] = useState('');
  const [editContractDay, setEditContractDay] = useState('');
  const [editContractMonth, setEditContractMonth] = useState('');
  const [editContractYear, setEditContractYear] = useState('');
  const [editMarketValueInput, setEditMarketValueInput] = useState('');
  const [editAnnualWageInput, setEditAnnualWageInput] = useState('');

  const [editBajaDay, setEditBajaDay] = useState('');
  const [editBajaMonth, setEditBajaMonth] = useState('');
  const [editBajaYear, setEditBajaYear] = useState('');
  const [editPrestamoDay, setEditPrestamoDay] = useState('');
  const [editPrestamoMonth, setEditPrestamoMonth] = useState('');
  const [editPrestamoYear, setEditPrestamoYear] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Inline confirmations and form errors
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmResetBase, setConfirmResetBase] = useState(false);
  const [confirmBajaId, setConfirmBajaId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Helper to parse wage to numeric weekly wage
  const parseWageToNumeric = (wageStr: string): number => {
    if (!wageStr) return 0;
    const clean = wageStr.replace(/\s/g, '').toLowerCase();
    const parsedNum = clean.replace(/[^0-9.]/g, '');
    let numberPart = parseFloat(parsedNum);
    if (isNaN(numberPart)) return 0;
    if (clean.includes('k')) {
      numberPart *= 1000;
    } else if (clean.includes('m')) {
      numberPart *= 1000000;
    }
    return numberPart;
  };

  // Helper to parse entered annual wage to weekly wage
  const parseAnnualWageInputToWeekly = (inputStr: string): number => {
    if (!inputStr) return 0;
    const clean = inputStr.replace(/\s/g, '').toLowerCase();
    const parsedNum = clean.replace(/[^0-9.]/g, '');
    let numberPart = parseFloat(parsedNum);
    if (isNaN(numberPart)) return 0;
    
    if (clean.includes('k')) {
      numberPart *= 1000;
    } else if (clean.includes('m')) {
      numberPart *= 1000000;
    }
    
    return numberPart / 52;
  };

  // Helper to format weekly wage string
  const formatWeeklyWage = (weekly: number): string => {
    if (weekly >= 1000000) return `€${(weekly / 1000000).toFixed(1)}M/sem`;
    if (weekly >= 1000) return `€${(weekly / 1000).toFixed(0)}K/sem`;
    return `€${Math.round(weekly).toLocaleString()}/sem`;
  };

  // Helper to parse market value to numeric
  const parseMarketValueToNumeric = (valStr: string): number => {
    if (!valStr) return 0;
    const clean = valStr.replace(/\s/g, '').toLowerCase();
    const parsedNum = clean.replace(/[^0-9.]/g, '');
    let numberPart = parseFloat(parsedNum);
    if (isNaN(numberPart)) return 0;
    if (clean.includes('k')) {
      numberPart *= 1000;
    } else if (clean.includes('m')) {
      numberPart *= 1000000;
    }
    return numberPart;
  };

  // Helper to parse ability input (stars, percentage or 1-200 score)
  const parseAbilityInput = (valStr: string): { stars: number; rawRating: string } => {
    const clean = valStr.trim();
    if (!clean) return { stars: 2, rawRating: '' };
    
    // Replace % for parsing if present
    const cleanNumStr = clean.replace('%', '').replace(',', '.');
    const num = parseFloat(cleanNumStr);
    if (isNaN(num)) {
      return { stars: 2, rawRating: '' };
    }

    if (num <= 5) {
      // Direct star rating input, e.g. 4.5
      const pct = num * 20;
      return { stars: num, rawRating: `${pct.toFixed(0)}%` };
    } else if (num <= 100) {
      // convert to 0-5 stars with 0.5 increments
      const stars = Math.max(0, Math.min(5, Math.round((num / 100) * 10) / 2));
      const formattedPct = clean.includes('%') ? clean : `${num}%`;
      return { stars, rawRating: formattedPct };
    } else {
      // scale 1-200
      const stars = Math.max(0, Math.min(5, Math.round((num / 200) * 10) / 2));
      const pct = (num / 200) * 100;
      return { stars, rawRating: `${pct.toFixed(0)}%` };
    }
  };

  // Helper to get uniform percentage value for any rating format (stars, 1-200, or percentage)
  const getPercentageValue = (stars: number, customRating?: string): number => {
    if (!customRating) return stars * 20;
    const clean = customRating.trim();
    
    // 1. Try to find any percentage format anywhere in the string, e.g. "91,3%" or "(87.9%)"
    const pctMatch = clean.match(/(\d+[,.]?\d*)\s*%/);
    if (pctMatch) {
      const parsed = parseFloat(pctMatch[1].replace(',', '.'));
      if (!isNaN(parsed)) return parsed;
    }
    
    // 2. Fallback to extracting the first numeric value
    const numMatch = clean.match(/(\d+[,.]?\d*)/);
    if (numMatch) {
      const num = parseFloat(numMatch[1].replace(',', '.'));
      if (!isNaN(num)) {
        if (num <= 5) return num * 20; // 1-5 star scale
        if (num <= 100) return num; // Already 0-100 scale
        return (num / 200) * 100; // 1-200 scale
      }
    }
    
    return stars * 20;
  };

  // New player temporary state
  const [newPlayer, setNewPlayer] = useState<Omit<Player, 'id'>>({
    name: '',
    age: 18,
    position: 'M (C)',
    nationality: 'Argentina',
    currentAbility: 2,
    potentialAbility: 4,
    marketValue: '€1.5M',
    wage: '€8K/sem',
    squadStatus: 'no_asignado',
    notes: '',
    contractEnd: '30/6/2028',
    dateOfBirth: '18/12/2001',
    club: '',
    bestRating: '',
    bestPotRating: ''
  });

  const [newCaInput, setNewCaInput] = useState('3.0');
  const [newPaInput, setNewPaInput] = useState('4.0');
  const [customId, setCustomId] = useState('');
  
  const [nacionalidad1, setNacionalidad1] = useState('Argentina');
  const [nacionalidad2, setNacionalidad2] = useState('');
  const [showNationsDropdown1, setShowNationsDropdown1] = useState(false);
  const [showNationsDropdown2, setShowNationsDropdown2] = useState(false);
  
  const [contractEndDay, setContractEndDay] = useState('30');
  const [contractEndMonth, setContractEndMonth] = useState('6');
  const [contractEndYear, setContractEndYear] = useState('2028');

  const [birthDay, setBirthDay] = useState('18');
  const [birthMonth, setBirthMonth] = useState('12');
  const [birthYear, setBirthYear] = useState('2001');

  const [newMarketValueInput, setNewMarketValueInput] = useState('1500000');

  const [editCaInput, setEditCaInput] = useState('');
  const [editPaInput, setEditPaInput] = useState('');

  // Unique list of positions for filter
  const positionsList = ['ALL', 'GK', 'D (C)', 'D (L)', 'D (R)', 'DM', 'M (C)', 'AM (L)', 'AM (R)', 'AM (C)', 'ST (C)'];
  const statusLabels: Record<string, string> = {
    'titular': '🟢 Titular',
    'suplente': '🟡 Suplente',
    'juvenil': '🔵 Juvenil',
    'recambio': '🔄 Recambio',
    'cedidos': '✈️ Cedido',
    'aceder': '📋 Cedibles',
    'venta': '💰 Transferibles',
    'desarrollo': '🌱 Desarrollo',
    'descartes': '❌ Descarte',
    'no_asignado': '⚪ Sin Asignar',
    'baja': '📉 Baja del Club'
  };

  // Filter players
  const activeRosterPlayers = players.filter(p => p.squadStatus !== 'baja' && p.squadStatus !== 'cedidos' && p.squadStatus !== 'desarrollo');
  const bajasPlayers = players.filter(p => p.squadStatus === 'baja');
  const cedidosPlayers = players.filter(p => p.squadStatus === 'cedidos');
  const desarrolloPlayers = players.filter(p => p.squadStatus === 'desarrollo');

  const filteredPlayers = activeRosterPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          player.id.includes(searchTerm) ||
                          player.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Position filters. Support simple inclusion check
    const matchesPosition = positionFilter === 'ALL' || 
                            player.position.toLowerCase() === positionFilter.toLowerCase() ||
                            player.position.toLowerCase().includes(positionFilter.toLowerCase());
                            
    const matchesStatus = statusFilter === 'ALL' || player.squadStatus === statusFilter;

    // Helper to calculate years remaining on a contract relative to precise game date
    const getContractYearsValue = (contractEnd: string | undefined): number => {
      if (!contractEnd || contractEnd === 'N/A' || contractEnd === 'N/D') return -1;
      
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
          return new Date(parseInt(clean), 5, 30);
        }
        return null;
      };

      const dateCurrent = parseDate(gameDate);
      const dateEnd = parseDate(contractEnd);

      if (dateCurrent && dateEnd) {
        const diffTime = dateEnd.getTime() - dateCurrent.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        if (diffDays <= 0) return 0;
        return diffDays / 365.25;
      }
      
      return -1;
    };

    let matchesContractYears = true;
    if (contractYearsFilter !== 'ALL') {
      const yearsVal = getContractYearsValue(player.contractEnd);
      if (yearsVal < 0) {
        matchesContractYears = false;
      } else {
        const displayYears = Math.round(yearsVal * 10) / 10;
        if (contractYearsFilter === '1_or_less') {
          matchesContractYears = displayYears <= 1.0;
        } else if (contractYearsFilter === '2') {
          matchesContractYears = displayYears > 1.0 && displayYears <= 2.0;
        } else if (contractYearsFilter === '3') {
          matchesContractYears = displayYears > 2.0 && displayYears <= 3.0;
        } else if (contractYearsFilter === '4_or_more') {
          matchesContractYears = displayYears > 3.0;
        }
      }
    }

    const calculatedAge = calculateAgeFromDOBPrecise(player.dateOfBirth, player.age, gameDate);
    const matchesMinAge = minAgeFilter === '' || calculatedAge >= parseInt(minAgeFilter);
    const matchesMaxAge = maxAgeFilter === '' || calculatedAge <= parseInt(maxAgeFilter);

    return matchesSearch && matchesPosition && matchesStatus && matchesContractYears && matchesMinAge && matchesMaxAge;
  });

  // Calculate sortedPlayers
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (!sortField) return 0;

    let valA: any = '';
    let valB: any = '';

    switch (sortField) {
      case 'id':
        const numA = parseInt(a.id);
        const numB = parseInt(b.id);
        if (!isNaN(numA) && !isNaN(numB)) {
          valA = numA;
          valB = numB;
        } else {
          valA = a.id;
          valB = b.id;
        }
        break;
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'nationality':
        valA = a.nationality.toLowerCase();
        valB = b.nationality.toLowerCase();
        break;
      case 'position':
        valA = a.position.toLowerCase();
        valB = b.position.toLowerCase();
        break;
      case 'age':
        valA = a.age;
        valB = b.age;
        break;
      case 'wage':
        valA = parseWageToNumeric(a.wage);
        valB = parseWageToNumeric(b.wage);
        break;
      case 'marketValue':
        valA = parseMarketValueToNumeric(a.marketValue);
        valB = parseMarketValueToNumeric(b.marketValue);
        break;
      case 'ca':
        valA = getPercentageValue(a.currentAbility, a.bestRating);
        valB = getPercentageValue(b.currentAbility, b.bestRating);
        break;
      case 'pa':
        valA = getPercentageValue(a.potentialAbility, a.bestPotRating);
        valB = getPercentageValue(b.potentialAbility, b.bestPotRating);
        break;
      case 'contractEnd':
        valA = (a.contractEnd || '').toLowerCase();
        valB = (b.contractEnd || '').toLowerCase();
        break;
      case 'dateOfBirth':
        valA = (a.dateOfBirth || '').toLowerCase();
        valB = (b.dateOfBirth || '').toLowerCase();
        break;
      case 'squadStatus':
        valA = (a.squadStatus || '').toLowerCase();
        valB = (b.squadStatus || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEditClick = (player: Player) => {
    setEditingPlayer({ ...player });
    setFormError('');

    // Set CA and PA clean floats (e.g. "3.5" or "4")
    setEditCaInput(player.currentAbility.toString());
    setEditPaInput(player.potentialAbility.toString());

    // Parse Name
    let firstName = '';
    let lastName = '';
    if (player.name.includes(',')) {
      const nameParts = player.name.split(',');
      lastName = nameParts[0].trim();
      firstName = nameParts[1].trim();
    } else {
      const nameParts = player.name.trim().split(/\s+/);
      if (nameParts.length > 1) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else {
        lastName = player.name;
        firstName = '';
      }
    }
    setEditFirstName(firstName);
    setEditLastName(lastName);

    // Parse Nationalities
    let nac1 = '';
    let nac2 = '';
    if (player.nationality) {
      const natParts = player.nationality.split('/');
      nac1 = natParts[0].trim();
      if (natParts.length > 1) {
        nac2 = natParts[1].trim();
      }
    }
    setEditNacionalidad1(nac1);
    setEditNacionalidad2(nac2);

    // Parse DOB
    let bD = '18';
    let bM = '12';
    let bY = '2001';
    if (player.dateOfBirth) {
      const parts = player.dateOfBirth.split(/[\.\-\/]+/);
      if (parts.length === 3) {
        bD = parts[0];
        bM = parts[1];
        bY = parts[2];
      }
    }
    setEditBirthDay(bD);
    setEditBirthMonth(bM);
    setEditBirthYear(bY);

    // Parse Contract End
    let cD = '30';
    let cM = '6';
    let cY = '2028';
    if (player.contractEnd && player.contractEnd !== 'N/A' && player.contractEnd !== 'N/D') {
      const parts = player.contractEnd.split(/[\.\-\/]+/);
      if (parts.length === 3) {
        cD = parts[0];
        cM = parts[1];
        cY = parts[2];
      }
    }
    setEditContractDay(cD);
    setEditContractMonth(cM);
    setEditContractYear(cY);

    // Market Value numeric input
    const mvVal = parseMarketValueToNumeric(player.marketValue);
    setEditMarketValueInput(mvVal > 0 ? String(mvVal) : '');

    // Annual wage numeric input
    const weeklyWage = parseWageToNumeric(player.wage);
    const annualWage = Math.round(weeklyWage * 52);
    setEditAnnualWageInput(annualWage > 0 ? String(annualWage) : '');

    // Parse fechaBaja
    if (player.fechaBaja) {
      const parts = player.fechaBaja.split(/[\.\-\/]+/);
      if (parts.length === 3) {
        setEditBajaDay(parts[0]);
        setEditBajaMonth(parts[1]);
        setEditBajaYear(parts[2]);
      } else {
        setEditBajaDay('');
        setEditBajaMonth('');
        setEditBajaYear(player.fechaBaja);
      }
    } else {
      setEditBajaDay('');
      setEditBajaMonth('');
      setEditBajaYear('');
    }

    // Parse finPrestamo
    if (player.finPrestamo) {
      const parts = player.finPrestamo.split(/[\.\-\/]+/);
      if (parts.length === 3) {
        setEditPrestamoDay(parts[0]);
        setEditPrestamoMonth(parts[1]);
        setEditPrestamoYear(parts[2]);
      } else {
        setEditPrestamoDay('');
        setEditPrestamoMonth('');
        setEditPrestamoYear(player.finPrestamo);
      }
    } else {
      setEditPrestamoDay('');
      setEditPrestamoMonth('');
      setEditPrestamoYear('');
    }
  };

  const handleSaveEdit = () => {
    if (editingPlayer) {
      // Name split validation
      const trimmedFirst = editFirstName.trim();
      const trimmedLast = editLastName.trim();
      if (!trimmedFirst) {
        setFormError("El primer nombre del jugador es obligatorio.");
        return;
      }
      const finalName = trimmedFirst && trimmedLast ? `${trimmedLast}, ${trimmedFirst}` : trimmedFirst;

      // Nationality validation
      const mainNac = editNacionalidad1.trim();
      if (!mainNac) {
        setFormError("La primera nacionalidad es obligatoria.");
        return;
      }
      const finalNationality = editNacionalidad2.trim()
        ? `${mainNac} / ${editNacionalidad2.trim()}`
        : mainNac;

      // Date of Birth validation and age calculation
      const bD = parseInt(editBirthDay, 10);
      const bM = parseInt(editBirthMonth, 10);
      const bY = parseInt(editBirthYear, 10);
      if (!editBirthDay || !editBirthMonth || !editBirthYear) {
        setFormError("La fecha de nacimiento es obligatoria (Completa Día, Mes, Año).");
        return;
      }
      if (isNaN(bD) || bD < 1 || bD > 31 || isNaN(bM) || bM < 1 || bM > 12 || isNaN(bY) || bY < 1900 || bY > 2100) {
        setFormError("Fecha de nacimiento inválida.");
        return;
      }
      const finalDob = `${editBirthDay}/${editBirthMonth}/${editBirthYear}`;
      const calculatedAge = calculateAgeFromDOBPrecise(finalDob, editingPlayer.age, gameDate);

      // Contract End Date validation
      const ceD = parseInt(editContractDay, 10);
      const ceM = parseInt(editContractMonth, 10);
      const ceY = parseInt(editContractYear, 10);
      if (!editContractDay || !editContractMonth || !editContractYear) {
        setFormError("La fecha de fin de contrato es obligatoria (Completa Día, Mes, Año).");
        return;
      }
      if (isNaN(ceD) || ceD < 1 || ceD > 31 || isNaN(ceM) || ceM < 1 || ceM > 12 || isNaN(ceY) || ceY < 1900 || ceY > 2100) {
        setFormError("Fecha de fin de contrato inválida.");
        return;
      }
      const finalContractEnd = `${editContractDay}/${editContractMonth}/${editContractYear}`;

      // CA (Quality Actual) validation
      const caClean = editCaInput.trim().replace(',', '.');
      if (!caClean) {
        setFormError("La calidad actual (CA) es obligatoria.");
        return;
      }
      if (!/^[0-9]+([.][0-9]{1,2})?$/.test(caClean)) {
        setFormError("La calidad actual debe ser un número float o entero válido (admite hasta 2 decimales, ej. 3.5 o 3,5).");
        return;
      }
      const caVal = parseFloat(caClean);
      if (isNaN(caVal) || caVal < 0 || caVal > 200) {
        setFormError("La calidad actual debe estar entre 0 y 200.");
        return;
      }

      // PA (Quality Potencial) validation
      const paClean = editPaInput.trim().replace(',', '.');
      if (!paClean) {
        setFormError("La calidad potencial (PA) es obligatoria.");
        return;
      }
      if (!/^[0-9]+([.][0-9]{1,2})?$/.test(paClean)) {
        setFormError("La calidad potencial debe ser un número float o entero válido (admite hasta 2 decimales, ej. 4.5 o 4,5).");
        return;
      }
      const paVal = parseFloat(paClean);
      if (isNaN(paVal) || paVal < 0 || paVal > 200) {
        setFormError("La calidad potencial debe estar entre 0 y 200.");
        return;
      }

      // Market Value validation
      const mvClean = editMarketValueInput.trim();
      if (!mvClean) {
        setFormError("El valor de mercado es obligatorio.");
        return;
      }
      const mvInt = parseInt(mvClean, 10);
      if (isNaN(mvInt) || mvInt < 0) {
        setFormError("El valor de mercado debe ser un número entero válido.");
        return;
      }
      const formattedMarketValue = formatMarketValue(mvInt);

      // Annual Wage validation
      const wageClean = editAnnualWageInput.trim();
      if (!wageClean) {
        setFormError("El sueldo anual es obligatorio.");
        return;
      }
      const wageInt = parseInt(wageClean, 10);
      if (isNaN(wageInt) || wageInt < 0) {
        setFormError("El sueldo anual debe ser un número entero válido.");
        return;
      }
      const weeklyWageNum = parseAnnualWageInputToWeekly(editAnnualWageInput);
      const formattedWageStr = formatWeeklyWage(weeklyWageNum);

      const parsedCa = parseAbilityInput(caClean);
      const parsedPa = parseAbilityInput(paClean);

      let finalFechaBaja = undefined;
      if (editingPlayer.squadStatus === 'baja') {
        if (editBajaDay || editBajaMonth || editBajaYear) {
          finalFechaBaja = `${editBajaDay || '30'}/${editBajaMonth || '06'}/${editBajaYear || '2026'}`;
        }
      }

      let finalFinPrestamo = undefined;
      if (editingPlayer.squadStatus === 'cedidos') {
        if (editPrestamoDay || editPrestamoMonth || editPrestamoYear) {
          finalFinPrestamo = `${editPrestamoDay || '30'}/${editPrestamoMonth || '06'}/${editPrestamoYear || '2026'}`;
        }
      }

      const updatedPlayer: Player = {
        ...editingPlayer,
        name: finalName,
        nationality: finalNationality,
        dateOfBirth: finalDob,
        age: calculatedAge,
        contractEnd: finalContractEnd,
        marketValue: formattedMarketValue,
        wage: formattedWageStr,
        currentAbility: parsedCa.stars,
        potentialAbility: parsedPa.stars,
        bestRating: parsedCa.rawRating,
        bestPotRating: parsedPa.rawRating,
        fechaBaja: finalFechaBaja,
        finPrestamo: finalFinPrestamo,
      };

      onUpdatePlayer(updatedPlayer);
      setEditingPlayer(null);
      setFormError('');
    }
  };

  const handleRenewClick = (player: Player) => {
    setRenewingPlayer(player);
    setRenewContractEnd(player.contractEnd && player.contractEnd !== 'N/A' && player.contractEnd !== 'N/D' ? player.contractEnd : '30/6/2030');
    
    // Get numeric weekly wage and calculate annual
    const weekly = parseWageToNumeric(player.wage);
    const annual = Math.round(weekly * 52);
    setRenewAnnualWage(String(annual));
    setFormError('');
  };

  const handleSaveRenewal = () => {
    if (renewingPlayer) {
      if (!renewContractEnd.trim()) {
        setFormError("La fecha de fin de contrato es requerida.");
        return;
      }
      
      const weekly = parseAnnualWageInputToWeekly(renewAnnualWage);
      const formattedWage = formatWeeklyWage(weekly);
      
      const updatedPlayer: Player = {
        ...renewingPlayer,
        contractEnd: renewContractEnd.trim(),
        wage: formattedWage
      };
      
      onUpdatePlayer(updatedPlayer);
      setRenewingPlayer(null);
      setFormError('');
    }
  };

  // Helper to format market value to currency string (e.g. 1500000 -> €1.5M)
  const formatMarketValue = (num: number): string => {
    if (num >= 1000000) {
      const val = num / 1000000;
      return `€${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
    }
    if (num >= 1000) {
      const val = num / 1000;
      return `€${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
    }
    return `€${num.toLocaleString()}`;
  };

  // Real-time validation errors helper
  const getFormErrors = (): Record<string, string> => {
    const errors: Record<string, string> = {};

    // ID validation
    const idTrimmed = customId.trim();
    if (!idTrimmed) {
      errors.customId = "El ID Único es obligatorio.";
    } else if (!/^\d+$/.test(idTrimmed)) {
      errors.customId = "El ID Único debe ser solo números enteros (sin comas, puntos o decimales).";
    } else if (players.some(p => p.id === idTrimmed)) {
      errors.customId = "Este ID ya está registrado en el plantel.";
    }

    // Nombre & Apellido validation
    if (!newFirstName.trim()) {
      errors.newFirstName = "El primer nombre es obligatorio.";
    }

    // Nacionalidad validation
    const nac1 = nacionalidad1.trim();
    const nac2 = nacionalidad2.trim();
    if (!nac1) {
      errors.nacionalidad1 = "La primera nacionalidad es obligatoria.";
    }
    if (nac1 && nac2 && nac1.toLowerCase() === nac2.toLowerCase()) {
      errors.nacionalidad2 = "La primera y segunda nacionalidad no pueden ser el mismo país.";
    }

    // Valor de mercado validation
    const vmTrimmed = newMarketValueInput.trim();
    if (!vmTrimmed) {
      errors.marketValue = "El valor de mercado es obligatorio.";
    } else if (!/^\d+$/.test(vmTrimmed)) {
      errors.marketValue = "Solo números enteros (sin comas, puntos, letras, símbolos ni €).";
    }

    // Sueldo anual validation
    const saTrimmed = newAnnualWageInput.trim();
    if (!saTrimmed) {
      errors.annualWage = "El sueldo anual es obligatorio.";
    } else if (!/^\d+$/.test(saTrimmed)) {
      errors.annualWage = "Solo números enteros (sin comas, puntos, letras, símbolos ni €).";
    }

    // Contract End Date validation
    const ceD = parseInt(contractEndDay);
    const ceM = parseInt(contractEndMonth);
    const ceY = parseInt(contractEndYear);
    if (!contractEndDay || !contractEndMonth || !contractEndYear) {
      errors.contractEnd = "Completa todos los campos (Día, Mes, Año).";
    } else if (isNaN(ceD) || ceD < 1 || ceD > 31) {
      errors.contractEnd = "Día inválido (1-31).";
    } else if (isNaN(ceM) || ceM < 1 || ceM > 12) {
      errors.contractEnd = "Mes inválido (1-12).";
    } else if (isNaN(ceY) || ceY < 1900 || ceY > 2100) {
      errors.contractEnd = "Año inválido (1900-2100).";
    }

    // Date of Birth validation
    const bD = parseInt(birthDay);
    const bM = parseInt(birthMonth);
    const bY = parseInt(birthYear);
    if (!birthDay || !birthMonth || !birthYear) {
      errors.dateOfBirth = "Completa todos los campos (Día, Mes, Año).";
    } else if (isNaN(bD) || bD < 1 || bD > 31) {
      errors.dateOfBirth = "Día inválido (1-31).";
    } else if (isNaN(bM) || bM < 1 || bM > 12) {
      errors.dateOfBirth = "Mes inválido (1-12).";
    } else if (isNaN(bY) || bY < 1900 || bY > 2100) {
      errors.dateOfBirth = "Año inválido (1900-2100).";
    }

    // Calidad Actual validation
    const caClean = newCaInput.trim().replace(',', '.');
    if (!caClean) {
      errors.currentAbility = "La calidad actual es obligatoria.";
    } else if (!/^[0-9]+([.][0-9]{1,2})?$/.test(caClean)) {
      errors.currentAbility = "Número float inválido (admite hasta 2 decimales, ej. 3.5 o 3,5).";
    } else {
      const val = parseFloat(caClean);
      if (isNaN(val) || val < 0 || val > 200) {
        errors.currentAbility = "La calidad debe estar entre 0 y 200.";
      }
    }

    // Calidad Potencial validation
    const paClean = newPaInput.trim().replace(',', '.');
    if (!paClean) {
      errors.potentialAbility = "La calidad potencial es obligatoria.";
    } else if (!/^[0-9]+([.][0-9]{1,2})?$/.test(paClean)) {
      errors.potentialAbility = "Número float inválido (admite hasta 2 decimales, ej. 4.5 o 4,5).";
    } else {
      const val = parseFloat(paClean);
      if (isNaN(val) || val < 0 || val > 200) {
        errors.potentialAbility = "La calidad potencial debe estar entre 0 y 200.";
      }
    }

    return errors;
  };

  const handleCreatePlayer = () => {
    const errors = getFormErrors();
    if (Object.keys(errors).length > 0) {
      setFormError("Por favor, corrige los errores en el formulario antes de confirmar.");
      return;
    }

    const trimmedFirst = newFirstName.trim();
    const trimmedLast = newLastName.trim();
    
    // Format name as "Apellido, Nombre"
    const fullName = trimmedLast && trimmedFirst 
      ? `${trimmedLast}, ${trimmedFirst}` 
      : (trimmedLast || trimmedFirst);

    const generatedId = customId.trim();
    const parsedCa = parseAbilityInput(newCaInput);
    const parsedPa = parseAbilityInput(newPaInput);

    const weeklyWageNum = parseAnnualWageInputToWeekly(newAnnualWageInput);
    const formattedWageStr = formatWeeklyWage(weeklyWageNum);
    const formattedMarketValue = formatMarketValue(parseInt(newMarketValueInput));

    const contractEndDateStr = `${contractEndDay}/${contractEndMonth}/${contractEndYear}`;
    const dateOfBirthStr = `${birthDay}/${birthMonth}/${birthYear}`;
    const calculatedAge = calculateAgeFromDOBPrecise(dateOfBirthStr, 18, gameDate);

    const combinedNationality = nacionalidad2.trim()
      ? `${nacionalidad1.trim()} / ${nacionalidad2.trim()}`
      : nacionalidad1.trim();

    onAddPlayer({
      ...newPlayer,
      name: fullName,
      id: generatedId,
      currentAbility: parsedCa.stars,
      potentialAbility: parsedPa.stars,
      bestRating: parsedCa.rawRating,
      bestPotRating: parsedPa.rawRating,
      contractEnd: contractEndDateStr,
      dateOfBirth: dateOfBirthStr,
      age: calculatedAge,
      nationality: combinedNationality,
      marketValue: formattedMarketValue,
      wage: formattedWageStr,
      club: 'N/A'
    });
    
    setIsAdding(false);
    setFormError('');
    
    // Reset form states
    setNewFirstName('');
    setNewLastName('');
    setNewAnnualWageInput('416000');
    setNewPlayer({
      name: '',
      age: 18,
      position: 'M (C)',
      nationality: 'Argentina',
      currentAbility: 2,
      potentialAbility: 4,
      marketValue: '€1.5M',
      wage: '€8K/sem',
      squadStatus: 'no_asignado',
      notes: '',
      contractEnd: '30/6/2028',
      dateOfBirth: '18/12/2001',
      club: '',
      bestRating: '',
      bestPotRating: ''
    });
    setNewCaInput('3.0');
    setNewPaInput('4.0');
    setCustomId('');
    setNacionalidad1('Argentina');
    setNacionalidad2('');
    setContractEndDay('30');
    setContractEndMonth('6');
    setContractEndYear('2028');
    setBirthDay('18');
    setBirthMonth('12');
    setBirthYear('2001');
    setNewMarketValueInput('1500000');
  };

  // Helper to render beautiful yellow or silver stars with percentage
  const renderStarsWithPercentage = (starsCount: number, customRating?: string) => {
    const pctVal = getPercentageValue(starsCount, customRating);
    const pct = `${pctVal.toFixed(1)}%`;

    const { stars, color } = getFMStarsAndColor(pctVal);

    const textClass = color === 'silver' ? 'text-slate-400' : 'text-amber-400';
    const fillClass = color === 'silver' ? 'fill-slate-400' : 'fill-amber-400';

    return (
      <div className="flex items-center gap-1.5 font-sans">
        <div className={`flex gap-0.5 ${textClass}`}>
          {Array.from({ length: 5 }).map((_, i) => {
            const isFilled = i < Math.floor(stars);
            const isHalf = !isFilled && (stars - i >= 0.5);
            return (
              <div key={i} className="relative w-3.5 h-3.5 flex items-center justify-center">
                <Star 
                  className="w-3.5 h-3.5 text-slate-700 absolute" 
                />
                {isFilled && (
                  <Star 
                    className={`w-3.5 h-3.5 ${fillClass} ${textClass} absolute`} 
                  />
                )}
                {isHalf && (
                  <div className="absolute top-0 left-0 w-1/2 overflow-hidden h-3.5">
                    <Star 
                      className={`w-3.5 h-3.5 ${fillClass} ${textClass} absolute top-0 left-0`} 
                      style={{ minWidth: '14px', width: '14px' }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-slate-400 text-[10px] font-sans font-medium">({pct})</span>
      </div>
    );
  };

  const renderSortHeader = (field: string, label: string, extraClass: string = '') => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`px-3 py-3 font-semibold text-slate-400 hover:text-white cursor-pointer select-none transition group/hdr ${extraClass}`}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[8px] text-slate-600 group-hover/hdr:text-slate-300">
            {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Recalculate weekly wage to annual wage (weekly * 52)
  const parseWageToAnnual = (wageStr: string): string => {
    if (!wageStr) return "€0 p/a";
    const clean = wageStr.replace(/\s/g, '').toLowerCase();
    const parsedNum = clean.replace(/[^0-9.]/g, '');
    let numberPart = parseFloat(parsedNum);
    if (isNaN(numberPart)) return wageStr; // fallback
    
    if (clean.includes('k')) {
      numberPart *= 1000;
    } else if (clean.includes('m')) {
      numberPart *= 1000000;
    }
    
    const annual = numberPart * 52;
    
    return `€${Math.round(annual).toLocaleString()} p/a`;
  };

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🏃‍♂️ Plantilla General ({activeRosterPlayers.length} jugadores)
          </h2>
          <p className="text-xs text-slate-400">Filtra, busca y gestiona el estado contractual o deportivo de tus jugadores.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Jugador
          </button>

          {confirmDeleteAll ? (
            <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/30 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-rose-300 px-1 font-sans">¿Borrar todo?</span>
              <button
                onClick={() => {
                  onDeleteAllPlayers();
                  setConfirmDeleteAll(false);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded font-bold transition"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setConfirmDeleteAll(true);
                setConfirmResetBase(false);
              }}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-900/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
            >
              <Trash className="w-3.5 h-3.5" /> Eliminar todos
            </button>
          )}
          
          {confirmResetBase ? (
            <div className="flex items-center gap-1 bg-slate-900 border border-emerald-500/30 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-300 px-1 font-sans">¿Restablecer?</span>
              <button
                onClick={() => {
                  onResetToDefaults();
                  setConfirmResetBase(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold transition"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmResetBase(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setConfirmResetBase(true);
                setConfirmDeleteAll(false);
              }}
              className="border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-sans transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restablecer Base
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID, nacionalidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 font-sans"
          />
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans">Pos:</span>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            {positionsList.map(pos => (
              <option key={pos} value={pos} className="bg-slate-900">{pos === 'ALL' ? 'Todas' : pos}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            <option value="ALL" className="bg-slate-900">Todos</option>
            {Object.entries(statusLabels)
              .filter(([key]) => key !== 'baja' && key !== 'cedidos' && key !== 'desarrollo')
              .map(([key, val]) => (
                <option key={key} value={key} className="bg-slate-900">{val}</option>
              ))}
          </select>
        </div>

        {/* Years of contract filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans whitespace-nowrap">Contrato:</span>
          <select
            value={contractYearsFilter}
            onChange={(e) => setContractYearsFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            <option value="ALL" className="bg-slate-900">Todos</option>
            <option value="1_or_less" className="bg-slate-900">1 año o menos</option>
            <option value="2" className="bg-slate-900">2 años</option>
            <option value="3" className="bg-slate-900">3 años</option>
            <option value="4_or_more" className="bg-slate-900 font-sans">4 o más años</option>
          </select>
        </div>

        {/* Min Age Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans whitespace-nowrap">Edad Mín:</span>
          <select
            value={minAgeFilter}
            onChange={(e) => setMinAgeFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            <option value="" className="bg-slate-900">Todos</option>
            {Array.from({ length: 32 }, (_, i) => i + 14).map(age => (
              <option key={age} value={age.toString()} className="bg-slate-900">{age} años</option>
            ))}
          </select>
        </div>

        {/* Max Age Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans whitespace-nowrap">Edad Máx:</span>
          <select
            value={maxAgeFilter}
            onChange={(e) => setMaxAgeFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            <option value="" className="bg-slate-900">Todos</option>
            {Array.from({ length: 32 }, (_, i) => i + 14).map(age => (
              <option key={age} value={age.toString()} className="bg-slate-900">{age} años</option>
            ))}
          </select>
        </div>
      </div>

      {/* Adding form */}
      {isAdding && (
        <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-xl space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-emerald-400 font-sans uppercase tracking-wider">
              🆕 Registrar Nuevo Jugador en el Plantel
            </h3>
            <span className="text-[9px] text-slate-500 font-mono">Todos los campos con (*) son obligatorios</span>
          </div>

          {/* Form Errors summary banner (if any) */}
          {formError && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* Real-time calculated errors */}
          {(() => {
            const errors = getFormErrors();
            const hasErrors = Object.keys(errors).length > 0;
            return (
              <div className="space-y-4">
                {/* ROW 1: ID Único, Nombre, Apellido, Posición, Edad */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">ID Único (FMRD) *</label>
                    <input
                      type="text"
                      placeholder="Ej. 1201509"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value.replace(/\D/g, ''))}
                      className={`w-full bg-slate-950 border rounded p-1.5 text-slate-100 font-mono focus:outline-none transition ${
                        errors.customId ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-600'
                      }`}
                    />
                    {errors.customId ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.customId}</span>
                    ) : (
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Solo números enteros</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Primer Nombre *</label>
                    <input
                      type="text"
                      placeholder="Ej. Lionel"
                      value={newFirstName}
                      onChange={(e) => setNewFirstName(e.target.value)}
                      className={`w-full bg-slate-950 border rounded p-1.5 text-slate-100 focus:outline-none transition ${
                        errors.newFirstName ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-600'
                      }`}
                    />
                    {errors.newFirstName && (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.newFirstName}</span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Apellido (Opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Messi"
                      value={newLastName}
                      onChange={(e) => setNewLastName(e.target.value)}
                      className="w-full bg-slate-950 border rounded p-1.5 text-slate-100 font-semibold focus:outline-none transition border-slate-800 focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Posición Principal *</label>
                    <select
                      value={newPlayer.position}
                      onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 cursor-pointer font-bold text-emerald-400 focus:outline-none focus:border-emerald-600"
                    >
                      {positionsList.filter(p => p !== 'ALL').map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Edad (Autocalculada)</label>
                    <div className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-300 font-bold font-mono">
                      {(() => {
                        const dobString = `${birthDay}/${birthMonth}/${birthYear}`;
                        const ageVal = calculateAgeFromDOBPrecise(dobString, 18, gameDate);
                        return `${ageVal} años`;
                      })()}
                    </div>
                    <span className="text-[9px] text-slate-500 mt-0.5 block">Calculada de F. Nac.</span>
                  </div>
                </div>

                {/* ROW 2: Primera Nacionalidad, Segunda Nacionalidad */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Primera Nacionalidad */}
                  <div className="relative">
                    <label className="text-[10px] text-slate-400 block mb-1">Primera Nacionalidad *</label>
                    <div className="flex items-center gap-1.5 bg-slate-950 border rounded p-1 text-slate-100 focus-within:border-emerald-600 transition">
                      <span className="pl-1 text-base">
                        {fifaNations.find(n => n.name.toLowerCase() === nacionalidad1.trim().toLowerCase())?.flag || '🏳️'}
                      </span>
                      <input
                        type="text"
                        placeholder="Ej. Argentina"
                        value={nacionalidad1}
                        onFocus={() => setShowNationsDropdown1(true)}
                        onBlur={() => setTimeout(() => setShowNationsDropdown1(false), 200)}
                        onChange={(e) => {
                          setNacionalidad1(e.target.value);
                          setShowNationsDropdown1(true);
                        }}
                        className="w-full bg-transparent border-0 text-slate-100 focus:outline-none p-0.5 text-xs"
                      />
                    </div>
                    {errors.nacionalidad1 && (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.nacionalidad1}</span>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showNationsDropdown1 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded shadow-2xl divide-y divide-slate-900">
                        {fifaNations
                          .filter(n => n.name.toLowerCase().includes(nacionalidad1.toLowerCase()))
                          .map(n => (
                            <button
                              key={n.name}
                              type="button"
                              onMouseDown={() => {
                                setNacionalidad1(n.name);
                                setShowNationsDropdown1(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-900 flex items-center gap-2 text-xs text-slate-200 transition"
                            >
                              <span className="text-sm">{n.flag}</span>
                              <span>{n.name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Segunda Nacionalidad */}
                  <div className="relative">
                    <label className="text-[10px] text-slate-400 block mb-1">Segunda Nacionalidad (Opcional)</label>
                    <div className="flex items-center gap-1.5 bg-slate-950 border rounded p-1 text-slate-100 focus-within:border-emerald-600 transition">
                      <span className="pl-1 text-base">
                        {fifaNations.find(n => n.name.toLowerCase() === nacionalidad2.trim().toLowerCase())?.flag || '🏳️'}
                      </span>
                      <input
                        type="text"
                        placeholder="Ej. España (Opcional)"
                        value={nacionalidad2}
                        onFocus={() => setShowNationsDropdown2(true)}
                        onBlur={() => setTimeout(() => setShowNationsDropdown2(false), 200)}
                        onChange={(e) => {
                          setNacionalidad2(e.target.value);
                          setShowNationsDropdown2(true);
                        }}
                        className="w-full bg-transparent border-0 text-slate-100 focus:outline-none p-0.5 text-xs"
                      />
                    </div>
                    {errors.nacionalidad2 && (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.nacionalidad2}</span>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showNationsDropdown2 && (
                      <div className="absolute z-50 left-0 right-0 mt-1 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded shadow-2xl divide-y divide-slate-900">
                        {fifaNations
                          .filter(n => n.name.toLowerCase().includes(nacionalidad2.toLowerCase()))
                          .map(n => (
                            <button
                              key={n.name}
                              type="button"
                              onMouseDown={() => {
                                setNacionalidad2(n.name);
                                setShowNationsDropdown2(false);
                              }}
                              className="w-full text-left px-2.5 py-1.5 hover:bg-slate-900 flex items-center gap-2 text-xs text-slate-200 transition"
                            >
                              <span className="text-sm">{n.flag}</span>
                              <span>{n.name}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* ROW 3: Valor de mercado, Sueldo anual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Valor de Mercado (solo números) *</label>
                    <input
                      type="text"
                      placeholder="Ej. 1500000"
                      value={newMarketValueInput}
                      onChange={(e) => setNewMarketValueInput(e.target.value.replace(/\D/g, ''))}
                      className={`w-full bg-slate-950 border rounded p-1.5 text-slate-100 font-mono focus:outline-none transition ${
                        errors.marketValue ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-600'
                      }`}
                    />
                    {errors.marketValue ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.marketValue}</span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                        Vista previa: {formatMarketValue(parseInt(newMarketValueInput) || 0)}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Sueldo Anual (€, solo números) *</label>
                    <input
                      type="text"
                      placeholder="Ej. 416000"
                      value={newAnnualWageInput}
                      onChange={(e) => setNewAnnualWageInput(e.target.value.replace(/\D/g, ''))}
                      className={`w-full bg-slate-950 border rounded p-1.5 text-slate-100 font-mono focus:outline-none transition ${
                        errors.annualWage ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-600'
                      }`}
                    />
                    {errors.annualWage ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.annualWage}</span>
                    ) : (
                      <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                        Equivale a: {formatWeeklyWage(parseAnnualWageInputToWeekly(newAnnualWageInput))}
                      </span>
                    )}
                  </div>
                </div>

                {/* ROW 4: Fecha Fin Contrato, Fecha Nacimiento, CA, PA */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  {/* Fecha Fin Contrato */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Fecha Fin Contrato *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="DD"
                        value={contractEndDay}
                        onChange={(e) => setContractEndDay(e.target.value.replace(/\D/g, ''))}
                        className={`w-12 bg-slate-950 border rounded p-1 text-center font-mono text-slate-100 ${
                          errors.contractEnd ? 'border-rose-500' : 'border-slate-800'
                        }`}
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={contractEndMonth}
                        onChange={(e) => setContractEndMonth(e.target.value.replace(/\D/g, ''))}
                        className={`w-12 bg-slate-950 border rounded p-1 text-center font-mono text-slate-100 ${
                          errors.contractEnd ? 'border-rose-500' : 'border-slate-800'
                        }`}
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="AAAA"
                        value={contractEndYear}
                        onChange={(e) => setContractEndYear(e.target.value.replace(/\D/g, ''))}
                        className={`w-20 bg-slate-950 border rounded p-1 text-center font-mono text-slate-100 ${
                          errors.contractEnd ? 'border-rose-500' : 'border-slate-800'
                        }`}
                      />
                    </div>
                    {errors.contractEnd ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.contractEnd}</span>
                    ) : (
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Día / Mes / Año</span>
                    )}
                  </div>

                  {/* Fecha Nacimiento */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Fecha Nacimiento *</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="DD"
                        value={birthDay}
                        onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, ''))}
                        className={`w-12 bg-slate-950 border rounded p-1 text-center font-mono text-slate-100 ${
                          errors.dateOfBirth ? 'border-rose-500' : 'border-slate-800'
                        }`}
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={birthMonth}
                        onChange={(e) => setBirthMonth(e.target.value.replace(/\D/g, ''))}
                        className={`w-12 bg-slate-950 border rounded p-1 text-center font-mono text-slate-100 ${
                          errors.dateOfBirth ? 'border-rose-500' : 'border-slate-800'
                        }`}
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="AAAA"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, ''))}
                        className={`w-20 bg-slate-950 border rounded p-1 text-center font-mono text-slate-100 ${
                          errors.dateOfBirth ? 'border-rose-500' : 'border-slate-800'
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.dateOfBirth}</span>
                    ) : (
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Día / Mes / Año</span>
                    )}
                  </div>

                  {/* Calidad Actual */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Calidad Actual (CA) *</label>
                    <input
                      type="text"
                      placeholder="Ej. 3.5 o 3,5"
                      value={newCaInput}
                      onChange={(e) => setNewCaInput(e.target.value)}
                      className={`w-full bg-slate-950 border rounded p-1.5 text-slate-100 font-mono focus:outline-none transition ${
                        errors.currentAbility ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-600'
                      }`}
                    />
                    {errors.currentAbility ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.currentAbility}</span>
                    ) : (
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Nivel en estrellas (0-5) o 0-200</span>
                    )}
                  </div>

                  {/* Potencial */}
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Calidad Potencial (PA) *</label>
                    <input
                      type="text"
                      placeholder="Ej. 4.5 o 4,5"
                      value={newPaInput}
                      onChange={(e) => setNewPaInput(e.target.value)}
                      className={`w-full bg-slate-950 border rounded p-1.5 text-slate-100 font-mono focus:outline-none transition ${
                        errors.potentialAbility ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-slate-800 focus:border-emerald-600'
                      }`}
                    />
                    {errors.potentialAbility ? (
                      <span className="text-[9px] text-rose-400 mt-0.5 block">{errors.potentialAbility}</span>
                    ) : (
                      <span className="text-[9px] text-slate-500 mt-0.5 block">Nivel en estrellas (0-5) o 0-200</span>
                    )}
                  </div>
                </div>

                {/* Confirm buttons */}
                <div className="flex justify-end gap-2 text-xs pt-2 border-t border-slate-800/60">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={hasErrors}
                    onClick={handleCreatePlayer}
                    className={`px-4 py-1.5 rounded font-semibold transition ${
                      hasErrors
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-50 border border-slate-700/50'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    Confirmar Registro
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Editing Player Inline Modal overlay */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  ✍️ Editar Ficha del Jugador
                </h3>
                <span className="text-[10px] font-mono text-slate-500">ID Único: {editingPlayer.id}</span>
              </div>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Primer Nombre</label>
                <input
                  type="text"
                  placeholder="Ej. Lionel"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Apellido (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. Messi"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Posición Principal</label>
                <select
                  value={editingPlayer.position}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 cursor-pointer focus:outline-none focus:border-emerald-600"
                >
                  {positionsList.filter(p => p !== 'ALL').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">Edad (Autocalculada)</label>
                <div className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300 font-bold font-mono mt-1">
                  {(() => {
                    const dobString = `${editBirthDay}/${editBirthMonth}/${editBirthYear}`;
                    const ageVal = calculateAgeFromDOBPrecise(dobString, editingPlayer.age, gameDate);
                    return `${ageVal} años`;
                  })()}
                </div>
              </div>

              {/* Primera Nacionalidad Autocomplete */}
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Primera Nacionalidad *</label>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus-within:border-emerald-600 transition">
                  <span className="text-base leading-none">
                    {fifaNations.find(n => n.name.toLowerCase() === editNacionalidad1.trim().toLowerCase())?.flag || '🏳️'}
                  </span>
                  <input
                    type="text"
                    placeholder="Ej. Argentina"
                    value={editNacionalidad1}
                    onFocus={() => setShowEditNationsDropdown1(true)}
                    onBlur={() => setTimeout(() => setShowEditNationsDropdown1(false), 200)}
                    onChange={(e) => {
                      setEditNacionalidad1(e.target.value);
                      setShowEditNationsDropdown1(true);
                    }}
                    className="w-full bg-transparent border-0 text-slate-100 focus:outline-none p-0.5"
                  />
                </div>
                {showEditNationsDropdown1 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-xl font-mono text-[11px]">
                    {fifaNations
                      .filter(n => n.name.toLowerCase().includes(editNacionalidad1.toLowerCase()))
                      .map(n => (
                        <button
                          key={n.name}
                          type="button"
                          onMouseDown={() => {
                            setEditNacionalidad1(n.name);
                            setShowEditNationsDropdown1(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-800/80 text-slate-300 flex items-center gap-2"
                        >
                          <span>{n.flag}</span>
                          <span>{n.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              {/* Segunda Nacionalidad Autocomplete */}
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Segunda Nacionalidad (Opcional)</label>
                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus-within:border-emerald-600 transition">
                  <span className="text-base leading-none">
                    {fifaNations.find(n => n.name.toLowerCase() === editNacionalidad2.trim().toLowerCase())?.flag || '🏳️'}
                  </span>
                  <input
                    type="text"
                    placeholder="Ej. España"
                    value={editNacionalidad2}
                    onFocus={() => setShowEditNationsDropdown2(true)}
                    onBlur={() => setTimeout(() => setShowEditNationsDropdown2(false), 200)}
                    onChange={(e) => {
                      setEditNacionalidad2(e.target.value);
                      setShowEditNationsDropdown2(true);
                    }}
                    className="w-full bg-transparent border-0 text-slate-100 focus:outline-none p-0.5"
                  />
                </div>
                {showEditNationsDropdown2 && (
                  <div className="absolute left-0 right-0 z-50 mt-1 max-h-40 overflow-y-auto bg-slate-950 border border-slate-800 rounded-lg shadow-xl font-mono text-[11px]">
                    {fifaNations
                      .filter(n => n.name.toLowerCase().includes(editNacionalidad2.toLowerCase()))
                      .map(n => (
                        <button
                          key={n.name}
                          type="button"
                          onMouseDown={() => {
                            setEditNacionalidad2(n.name);
                            setShowEditNationsDropdown2(false);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-slate-800/80 text-slate-300 flex items-center gap-2"
                        >
                          <span>{n.flag}</span>
                          <span>{n.name}</span>
                        </button>
                      ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Club Actual</label>
                <input
                  type="text"
                  value={editingPlayer.club || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, club: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Sueldo Anual Numeric-Only input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Sueldo Anual (€) *</label>
                <input
                  type="text"
                  placeholder="Ej. 416000"
                  value={editAnnualWageInput}
                  onChange={(e) => setEditAnnualWageInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 font-mono mt-1 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                  Equivale a: {formatWeeklyWage(parseAnnualWageInputToWeekly(editAnnualWageInput))}
                </span>
              </div>

              {/* Valor de Mercado Numeric-Only input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Valor de Mercado *</label>
                <input
                  type="text"
                  placeholder="Ej. 1500000"
                  value={editMarketValueInput}
                  onChange={(e) => setEditMarketValueInput(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 font-mono mt-1 focus:outline-none focus:border-emerald-600"
                />
                <span className="text-[9px] text-emerald-400 font-mono mt-0.5 block">
                  Vista previa: {formatMarketValue(parseInt(editMarketValueInput) || 0)}
                </span>
              </div>

              {/* Fecha Fin Contrato precise inputs */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">Fecha Fin Contrato *</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="DD"
                    value={editContractDay}
                    onChange={(e) => setEditContractDay(e.target.value.replace(/\D/g, ''))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-slate-600">/</span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="MM"
                    value={editContractMonth}
                    onChange={(e) => setEditContractMonth(e.target.value.replace(/\D/g, ''))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:outline-none focus:border-emerald-600"
                  />
                  <span className="text-slate-600">/</span>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="AAAA"
                    value={editContractYear}
                    onChange={(e) => setEditContractYear(e.target.value.replace(/\D/g, ''))}
                    className="w-20 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:outline-none focus:border-emerald-600"
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 block">Día / Mes / Año</span>
              </div>

              {/* Fecha de Nacimiento precise inputs */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">Fecha de Nacimiento *</label>
                <div className="flex items-center gap-1 mt-1">
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="DD"
                    value={editBirthDay}
                    onChange={(e) => setEditBirthDay(e.target.value.replace(/\D/g, ''))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:outline-none"
                  />
                  <span className="text-slate-600">/</span>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="MM"
                    value={editBirthMonth}
                    onChange={(e) => setEditBirthMonth(e.target.value.replace(/\D/g, ''))}
                    className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:outline-none"
                  />
                  <span className="text-slate-600">/</span>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="AAAA"
                    value={editBirthYear}
                    onChange={(e) => setEditBirthYear(e.target.value.replace(/\D/g, ''))}
                    className="w-20 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:outline-none"
                  />
                </div>
                <span className="text-[9px] text-slate-500 mt-0.5 block">Día / Mes / Año</span>
              </div>

              {/* CA Float-only input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans flex justify-between">
                  <span>Calidad Actual (CA) *</span>
                  <span className="text-slate-500 font-mono">0.0 - 5.0 (o 0-200)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 3.5 o 3,5"
                  value={editCaInput}
                  onChange={(e) => setEditCaInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 font-mono mt-1 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* PA Float-only input */}
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans flex justify-between">
                  <span>Calidad Potencial (PA) *</span>
                  <span className="text-slate-500 font-mono">0.0 - 5.0 (o 0-200)</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. 4.5 o 4,5"
                  value={editPaInput}
                  onChange={(e) => setEditPaInput(e.target.value.replace(/[^0-9.,]/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 font-mono mt-1 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Estado en Plantilla</label>
                <select
                  value={editingPlayer.squadStatus}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, squadStatus: e.target.value as Player['squadStatus'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 cursor-pointer focus:outline-none focus:border-emerald-600"
                >
                  <option value="no_asignado">⚪ Sin Asignar / Reserva</option>
                  <option value="titular">🟢 Planificado Titular</option>
                  <option value="suplente">🟡 Planificado Suplente</option>
                  <option value="juvenil">🔵 Planificado Juvenil</option>
                  <option value="recambio">🔄 Planificado Recambio</option>
                  <option value="cedidos">✈️ Cedido (Préstamo)</option>
                  <option value="aceder">📋 Cedibles</option>
                  <option value="venta">💰 Transferibles</option>
                  <option value="desarrollo">🌱 Desarrollo</option>
                  <option value="descartes">❌ Descarte</option>
                  <option value="baja">📉 Baja del Club</option>
                </select>
              </div>

              {editingPlayer.squadStatus === 'baja' && (
                <div className="md:col-span-2 grid grid-cols-2 gap-2 bg-rose-950/10 p-3 rounded-xl border border-rose-900/20">
                  <div className="col-span-2 text-rose-400 font-sans text-[10px] font-bold uppercase tracking-wider">
                    📋 Información de la Baja / Venta
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Fecha de Baja (DD/MM/AAAA)</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="DD"
                        value={editBajaDay}
                        onChange={(e) => setEditBajaDay(e.target.value.replace(/\D/g, ''))}
                        className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={editBajaMonth}
                        onChange={(e) => setEditBajaMonth(e.target.value.replace(/\D/g, ''))}
                        className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="AAAA"
                        value={editBajaYear}
                        onChange={(e) => setEditBajaYear(e.target.value.replace(/\D/g, ''))}
                        className="w-20 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:border-rose-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Monto (€)</label>
                    <input
                      type="text"
                      placeholder="Ej. €15M"
                      value={editingPlayer.montoBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, montoBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400">Club Destino</label>
                    <input
                      type="text"
                      placeholder="Ej. Galatasaray"
                      value={editingPlayer.clubBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, clubBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400">Comentarios de Salida</label>
                    <input
                      type="text"
                      placeholder="Cláusulas, motivos de la baja..."
                      value={editingPlayer.comentarioBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, comentarioBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {editingPlayer.squadStatus === 'cedidos' && (
                <div className="md:col-span-2 grid grid-cols-2 gap-2 bg-blue-950/20 p-3 rounded-xl border border-blue-900/30">
                  <div className="col-span-2 text-blue-400 font-sans text-[10px] font-bold uppercase tracking-wider">
                    ✈️ Información de la Cesión / Préstamo
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400">Club Destino de Préstamo</label>
                    <input
                      type="text"
                      placeholder="Ej. Galatasaray"
                      value={editingPlayer.clubPrestamo || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, clubPrestamo: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Fin de Préstamo (DD/MM/AAAA)</label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="DD"
                        value={editPrestamoDay}
                        onChange={(e) => setEditPrestamoDay(e.target.value.replace(/\D/g, ''))}
                        className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={2}
                        placeholder="MM"
                        value={editPrestamoMonth}
                        onChange={(e) => setEditPrestamoMonth(e.target.value.replace(/\D/g, ''))}
                        className="w-12 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                      />
                      <span className="text-slate-600">/</span>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="AAAA"
                        value={editPrestamoYear}
                        onChange={(e) => setEditPrestamoYear(e.target.value.replace(/\D/g, ''))}
                        className="w-20 bg-slate-950 border border-slate-800 rounded p-1.5 text-center font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Opción de Compra</label>
                    <input
                      type="text"
                      placeholder="Ej. €5M (No obligatoria)"
                      value={editingPlayer.opcionCompra || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, opcionCompra: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Notas del Mánager</label>
                <textarea
                  value={editingPlayer.notes || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                  placeholder="Ej. Excelente cabezazo, entrenar velocidad..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Descartar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Renewal Modal Overlay */}
      {renewingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  🤝 Renovar Contrato de Jugador
                </h3>
                <span className="text-[11px] font-sans text-emerald-400 font-bold">{renewingPlayer.name} ({renewingPlayer.position})</span>
              </div>
              <button onClick={() => setRenewingPlayer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Nueva Fecha Fin de Contrato</label>
                <input
                  type="text"
                  placeholder="Ej. 30/6/2031"
                  value={renewContractEnd}
                  onChange={(e) => setRenewContractEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus:border-emerald-600 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Formato sugerido: DD/M/AAAA (ej. 30/6/2031)</p>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Nuevo Sueldo Anual (€)</label>
                <input
                  type="text"
                  placeholder="Ej. 500K o 500000"
                  value={renewAnnualWage}
                  onChange={(e) => setRenewAnnualWage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 focus:border-emerald-600 focus:outline-none font-bold"
                />
                <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Monto anual. El sistema lo convertirá a sueldo semanal.</p>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-sans">
                💡 <span className="font-semibold text-slate-200">Resumen de Conversión:</span> Al ingresar <span className="font-bold text-emerald-400">€{(parseFloat(renewAnnualWage.replace(/[^0-9.]/g, '')) || 0).toLocaleString()}</span> anuales, el jugador recibirá aproximadamente <span className="font-bold text-emerald-400">{formatWeeklyWage(parseAnnualWageInputToWeekly(renewAnnualWage))}</span> de sueldo semanal.
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2 border-t border-slate-800/60">
              <button
                onClick={() => setRenewingPlayer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRenewal}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition"
              >
                Confirmar Renovación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-sans font-semibold text-[10px] whitespace-nowrap">
            <tr>
              {renderSortHeader('name', 'Nombre', 'w-[160px]')}
              {renderSortHeader('nationality', 'Nac', 'w-[50px]')}
              {renderSortHeader('position', 'Pos', 'w-[70px]')}
              {renderSortHeader('age', 'Edad (F. Nacimiento)', 'w-[150px]')}
              {renderSortHeader('wage', 'Sueldo Anual', 'w-[105px]')}
              {renderSortHeader('marketValue', 'Valor Mercado', 'w-[105px]')}
              {renderSortHeader('ca', 'Calidad (CA)', 'w-[110px]')}
              {renderSortHeader('pa', 'Potencial (PA)', 'w-[110px]')}
              {renderSortHeader('contractEnd', 'Fin Contrato', 'w-[130px]')}
              {renderSortHeader('squadStatus', 'Estado', 'w-[110px]')}
              <th className="px-3 py-3 font-semibold text-slate-400 text-right w-[110px]">Acciones</th>
              {renderSortHeader('id', 'ID Único', 'w-[75px] text-right')}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedPlayers.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-slate-500 italic">
                  Ningún jugador coincide con los filtros de búsqueda.
                </td>
              </tr>
            ) : (
              sortedPlayers.map((player) => {
                const isTurkish = isTurkishPlayer(player.nationality);
                
                const preciseAge = calculateAgeFromDOBPrecise(player.dateOfBirth, player.age, gameDate);
                const dobStr = player.dateOfBirth ? `(${player.dateOfBirth})` : '';

                return (
                  <tr 
                    key={player.id} 
                    className={`hover:bg-slate-900/40 transition-colors border-b border-slate-800/40 ${
                      isTurkish 
                        ? 'bg-red-950/10 border-l-2 border-l-red-500/80 hover:bg-red-950/15' 
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-medium text-slate-100 max-w-[150px] truncate" title={player.name}>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{player.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-base font-sans" title={player.nationality}>
                      <div className="flex items-center gap-1">
                        {getPlayerFlags(player.nationality).map((f, idx) => (
                          <span key={idx} className="select-none">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-slate-800 text-slate-300 font-semibold px-1.5 py-0.5 rounded text-[10px] font-sans whitespace-nowrap">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-sans whitespace-nowrap">
                      {preciseAge} <span className="text-[10px] text-slate-500 font-normal ml-1">{dobStr}</span>
                    </td>
                    <td className="px-3 py-2 text-slate-100 font-sans font-bold whitespace-nowrap text-[11px]" title={`Original: ${player.wage}`}>
                      {parseWageToAnnual(player.wage)}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-sans font-medium whitespace-nowrap">{player.marketValue}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(player.currentAbility, player.bestRating)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(player.potentialAbility, player.bestPotRating)}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-sans text-[11px] whitespace-nowrap">
                      {calculateContractYearsRemainingPrecise(player.contractEnd, gameDate)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium font-sans
                        ${player.squadStatus === 'titular' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                        ${player.squadStatus === 'suplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                        ${player.squadStatus === 'juvenil' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : ''}
                        ${player.squadStatus === 'recambio' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : ''}
                        ${player.squadStatus === 'cedidos' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : ''}
                        ${player.squadStatus === 'aceder' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                        ${player.squadStatus === 'venta' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : ''}
                        ${player.squadStatus === 'desarrollo' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : ''}
                        ${player.squadStatus === 'descartes' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                        ${player.squadStatus === 'no_asignado' ? 'bg-slate-800/50 text-slate-400 border border-slate-700/30' : ''}
                      `}>
                        {statusLabels[player.squadStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        {confirmBajaId === player.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/30 p-1 rounded">
                            <span className="text-[10px] font-bold text-rose-300 px-1 font-sans">¿Baja?</span>
                            <button
                              onClick={() => {
                                onUpdatePlayer({
                                  ...player,
                                  squadStatus: 'baja',
                                  fechaBaja: String(new Date().getFullYear()),
                                  montoBaja: player.saleValue || 'N/A',
                                  clubBaja: 'N/A',
                                  comentarioBaja: 'Dado de baja'
                                });
                                setConfirmBajaId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition font-sans"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmBajaId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium transition font-sans"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Drop list tags status */}
                            <select
                              value={player.squadStatus}
                              onChange={(e) => {
                                const val = e.target.value as Player['squadStatus'];
                                if (val === 'baja') {
                                  setConfirmBajaId(player.id);
                                } else {
                                  onUpdatePlayer({
                                    ...player,
                                    squadStatus: val
                                  });
                                }
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-300 font-sans focus:outline-none focus:border-slate-700 cursor-pointer"
                            >
                              <option value="no_asignado">⚪ Sin Asignar</option>
                              <option value="titular">🟢 Titular</option>
                              <option value="suplente">🟡 Suplente</option>
                              <option value="juvenil">🔵 Juvenil</option>
                              <option value="recambio">🔄 Recambio</option>
                              <option value="cedidos">✈️ Cedido</option>
                              <option value="aceder">📋 Cedibles</option>
                              <option value="venta">💰 Transferibles</option>
                              <option value="desarrollo">🌱 Desarrollo</option>
                              <option value="descartes">❌ Descarte</option>
                              <option value="baja">📉 Dar de Baja</option>
                            </select>

                            <button
                              onClick={() => {
                                handleEditClick(player);
                                setConfirmBajaId(null);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Editar ficha"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                handleRenewClick(player);
                                setConfirmBajaId(null);
                              }}
                              className="p-1 rounded bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/30 transition"
                              title="Renovar Contrato"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setConfirmBajaId(player.id);
                              }}
                              className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 transition"
                              title="Mandar a Bajas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-slate-500 font-sans font-medium text-[10px] text-right">{player.id}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN DE JUGADORES EN DESARROLLO */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-teal-950/40 space-y-4 mt-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider font-sans flex items-center gap-2">
              🌱 SECCIÓN DE JUGADORES EN DESARROLLO ({desarrolloPlayers.length} jugadores)
            </h3>
            <p className="text-xs text-slate-400">
              Jugadores que forman parte del club pero no requieren de una supervisión constante ni asignación en la matriz de planificación.
            </p>
          </div>
        </div>

        {desarrolloPlayers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-900/10 rounded-xl border border-dashed border-slate-800/60">
            No tienes jugadores en desarrollo registrados actualmente. Puedes cambiar el estado de un jugador a "Desarrollo" en la tabla principal para moverlo aquí.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
              <thead className="bg-slate-900/50 text-slate-400 uppercase font-sans font-semibold text-[10px] whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">ID</th>
                  <th className="px-3 py-2.5 font-semibold">Jugador</th>
                  <th className="px-3 py-2.5 font-semibold">Nacionalidad</th>
                  <th className="px-3 py-2.5 font-semibold">Calidad (CA)</th>
                  <th className="px-3 py-2.5 font-semibold">Potencial (PA)</th>
                  <th className="px-3 py-2.5 font-semibold">Sueldo Anual</th>
                  <th className="px-3 py-2.5 font-semibold">Valor Mercado</th>
                  <th className="px-3 py-2.5 font-semibold">Fin Contrato</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {desarrolloPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-teal-950/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 font-sans font-medium text-[10px]">{p.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{p.position} • {p.age} años</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getFlagEmoji(p.nationality)}</span>
                        <span>{p.nationality}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(p.currentAbility, p.bestRating)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(p.potentialAbility, p.bestPotRating)}
                    </td>
                    <td className="px-3 py-2 text-slate-100 font-sans font-bold whitespace-nowrap text-[11px]" title={`Original: ${p.wage}`}>
                      {parseWageToAnnual(p.wage)}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-sans font-medium whitespace-nowrap">
                      {p.marketValue}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-sans text-[11px] whitespace-nowrap">
                      {calculateContractYearsRemainingPrecise(p.contractEnd, gameDate)}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onUpdatePlayer({
                              ...p,
                              squadStatus: 'no_asignado'
                            });
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-[10px] transition"
                        >
                          Reincorporar al Plantel
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="flex items-center gap-1 bg-rose-950 border border-rose-500/30 p-1 rounded">
                            <span className="text-[9px] font-bold text-rose-300 font-sans">¿Eliminar?</span>
                            <button
                              onClick={() => {
                                onDeletePlayer(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition font-sans"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium transition font-sans"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmDeleteId(p.id);
                            }}
                            className="p-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-900/20 rounded transition"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN DE JUGADORES CEDIDOS (PRÉSTAMOS) */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-blue-950/40 space-y-4 mt-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider font-sans flex items-center gap-2">
              ✈️ SECCIÓN DE JUGADORES CEDIDOS ({cedidosPlayers.length} jugadores)
            </h3>
            <p className="text-xs text-slate-400">
              Jugadores prestados a otros equipos que no forman parte del plantel actual, con club de destino, vencimiento y opción de compra.
            </p>
          </div>
        </div>

        {cedidosPlayers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-900/10 rounded-xl border border-dashed border-slate-800/60">
            No tienes jugadores cedidos registrados actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
              <thead className="bg-slate-900/50 text-slate-400 uppercase font-sans font-semibold text-[10px] whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">ID</th>
                  <th className="px-3 py-2.5 font-semibold">Jugador</th>
                  <th className="px-3 py-2.5 font-semibold">Nacionalidad</th>
                  <th className="px-3 py-2.5 font-semibold">Calidad (CA)</th>
                  <th className="px-3 py-2.5 font-semibold">Potencial (PA)</th>
                  <th className="px-3 py-2.5 font-semibold">Fin Contrato</th>
                  <th className="px-3 py-2.5 font-semibold">Club Destino de Préstamo</th>
                  <th className="px-3 py-2.5 font-semibold">Fin de Préstamo (DD/MM/AAAA)</th>
                  <th className="px-3 py-2.5 font-semibold">Opción de Compra</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {cedidosPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-950/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 font-sans font-medium text-[10px]">{p.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{p.position} • {p.age} años</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getFlagEmoji(p.nationality)}</span>
                        <span>{p.nationality}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(p.currentAbility, p.bestRating)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(p.potentialAbility, p.bestPotRating)}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-sans text-[11px] whitespace-nowrap">
                      {calculateContractYearsRemainingPrecise(p.contractEnd, gameDate)}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. Galatasaray"
                        value={p.clubPrestamo || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, clubPrestamo: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-36 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. 30/06/2027"
                        value={p.finPrestamo || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, finPrestamo: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-28 text-center focus:border-blue-500 focus:outline-none font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. €5M"
                        value={p.opcionCompra || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, opcionCompra: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-36 focus:border-blue-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onUpdatePlayer({
                              ...p,
                              squadStatus: 'no_asignado',
                              clubPrestamo: undefined,
                              finPrestamo: undefined,
                              opcionCompra: undefined
                            });
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-[10px] transition"
                        >
                          Reincorporar
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="flex items-center gap-1 bg-rose-950 border border-rose-500/30 p-1 rounded">
                            <span className="text-[9px] font-bold text-rose-300 font-sans">¿Eliminar?</span>
                            <button
                              onClick={() => {
                                onDeletePlayer(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition font-sans"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium transition font-sans"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmDeleteId(p.id);
                            }}
                            className="p-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-900/20 rounded transition"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECCIÓN DE BAJAS Y SALIDAS */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-rose-950/40 space-y-4 mt-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-sans flex items-center gap-2">
              📉 SECCIÓN DE BAJAS DEL CLUB ({bajasPlayers.length} jugadores)
            </h3>
            <p className="text-xs text-slate-400">
              Jugadores retirados, transferidos o cedidos que ya no pertenecen al plantel y dejeron de formar parte de la tabla principal.
            </p>
          </div>
        </div>

        {bajasPlayers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-900/10 rounded-xl border border-dashed border-slate-800/60">
            No tienes bajas registradas en el club actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
              <thead className="bg-slate-900/50 text-slate-400 uppercase font-sans font-semibold text-[10px] whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">ID</th>
                  <th className="px-3 py-2.5 font-semibold">Jugador</th>
                  <th className="px-3 py-2.5 font-semibold">Nacionalidad</th>
                  <th className="px-3 py-2.5 font-semibold">Fecha de Baja (DD/MM/AAAA)</th>
                  <th className="px-3 py-2.5 font-semibold">Monto de Salida</th>
                  <th className="px-3 py-2.5 font-semibold">Club Destino</th>
                  <th className="px-3 py-2.5 font-semibold">Comentarios / Notas de Baja</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {bajasPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-rose-950/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 font-sans font-medium text-[10px]">{p.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{p.position} • {p.age} años</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getFlagEmoji(p.nationality)}</span>
                        <span>{p.nationality}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. 30/06/2026"
                        value={p.fechaBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, fechaBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-28 text-center focus:border-rose-500 focus:outline-none font-mono"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. €12M"
                        value={p.montoBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, montoBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-28 focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. Galatasaray"
                        value={p.clubBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, clubBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-36 focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Cláusulas o motivos..."
                        value={p.comentarioBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, comentarioBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-full min-w-[150px] focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onUpdatePlayer({
                              ...p,
                              squadStatus: 'no_asignado',
                              fechaBaja: undefined,
                              montoBaja: undefined,
                              clubBaja: undefined,
                              comentarioBaja: undefined
                            });
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-[10px] transition"
                        >
                          Reincorporar
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="flex items-center gap-1 bg-rose-950 border border-rose-500/30 p-1 rounded">
                            <span className="text-[9px] font-bold text-rose-300 font-sans">¿Eliminar permanentemente?</span>
                            <button
                              onClick={() => {
                                onDeletePlayer(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition font-sans"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium transition font-sans"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmDeleteId(p.id);
                            }}
                            className="p-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-900/20 rounded transition"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
