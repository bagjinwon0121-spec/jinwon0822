export const colors = {
  // Brand colors
  primary: '#10B981',        // Vibrant Emerald
  primaryDark: '#059669',
  primaryLight: '#34D399',
  primaryMuted: '#064E3B',
  primaryGlow: 'rgba(16, 185, 129, 0.2)',

  // Secondary / Accents
  accent: '#6366F1',         // Indigo
  accentLight: '#818CF8',
  accentOrange: '#F97316',   // Coral Orange for warnings/timer
  accentRose: '#F43F5E',     // Rose for high intensity
  accentAmber: '#F59E0B',    // Amber for medium

  // Dark Theme Backgrounds & Surfaces
  bgDark: '#090D16',         // Deep obsidian
  bgCard: '#131A29',         // Midnight surface
  bgCardHover: '#1B2438',
  bgInput: '#1E293B',        // Slate 800
  bgModal: '#0F172A',
  
  // Borders
  border: '#233048',
  borderLight: '#334155',
  borderGlow: 'rgba(16, 185, 129, 0.4)',

  // Text
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textDisabled: '#475569',
  textInverse: '#090D16',

  // Status
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Gradients (Colors array)
  gradientPrimary: ['#10B981', '#059669'] as const,
  gradientCard: ['#1E293B', '#0F172A'] as const,
  gradientHero: ['#10B981', '#6366F1'] as const,
  gradientOrange: ['#F97316', '#EA580C'] as const,
};

export const BODY_PARTS_INFO = [
  { id: 'chest', name: '가슴', englishName: 'Chest', icon: 'shield', color: '#EC4899', description: '대흉근, 가슴 상/하부' },
  { id: 'back', name: '등', englishName: 'Back', icon: 'layers', color: '#3B82F6', description: '광배근, 승모근, 척추기립근' },
  { id: 'shoulder', name: '어깨', englishName: 'Shoulder', icon: 'triangle', color: '#8B5CF6', description: '전면, 측면, 후면 삼각근' },
  { id: 'arms', name: '팔', englishName: 'Arms', icon: 'zap', color: '#F59E0B', description: '이두근, 삼두근, 전완근' },
  { id: 'abs', name: '복부', englishName: 'Abs', icon: 'activity', color: '#10B981', description: '복직근, 복사근, 코어' },
  { id: 'legs', name: '하체', englishName: 'Legs', icon: 'trending-up', color: '#06B6D4', description: '대퇴사두근, 둔근, 햄스트링' },
  { id: 'fullBody', name: '전신', englishName: 'Full Body', icon: 'target', color: '#F97316', description: '전신 유산소 + 근력 협응' },
] as const;
