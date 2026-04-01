export const findBestFontSize = (
  containerWidth: number, 
  containerHeight: number,
  measureText: (size: number) => { width: number; height: number }
) => {
  let min = 1;
  let max = 1000;
  let result = 100;

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
