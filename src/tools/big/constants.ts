export const MIN_FONT_SIZE = 16;
export const MAX_FONT_SIZE = 1000;

export const calculateResponsivePadding = (width: number, height: number) => {
  const padX = Math.round(Math.max(16, Math.min(32, width * 0.04)) * 2);
  const padY = Math.round(Math.max(16, Math.min(32, height * 0.04)) * 2);
  return {
    paddingX: padX,
    paddingY: padY,
    availableWidth: Math.max(0, width - padX),
    availableHeight: Math.max(0, height - padY),
  };
};

export const findBestFontSize = (
  containerWidth: number, 
  containerHeight: number,
  measureText: (size: number) => { width: number; height: number },
  minSize: number = 1,
  maxSize: number = MAX_FONT_SIZE
) => {
  let min = minSize;
  let max = maxSize;
  let result = minSize;

  while (min <= max) {
    const mid = Math.floor((min + max) / 2);
    const { width, height } = measureText(mid);
    
    if (width <= containerWidth && height <= containerHeight) {
      result = mid;
      min = mid + 1;
    } else {
      max = mid - 1;
    }
  }
  return result;
};

export const PRESETS = ['Yes', 'No', '🍺 1 more please', '👋 Hi!', 'Help!', 'Bill please 💳'];

export const THEMES = [
  { id: 'theme-dark', label: 'Dark', className: 'theme-btn-dark' },
  { id: 'theme-light', label: 'Light', className: 'theme-btn-light' },
  { id: 'theme-matrix', label: 'Matrix', className: 'theme-btn-matrix' },
  { id: 'theme-bumblebee', label: 'Bumblebee', className: 'theme-btn-bumblebee' },
];
