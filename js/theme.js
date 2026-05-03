/* Shared UI theme: plot sizes, padding, colors, fonts */

window.SCIRESO_THEME = (function () {
  'use strict';

  var THEMES = {
    dark: {
      bg: '#0d0d0d',
      fg: '#ffffff',
      muted: 'rgba(255,255,255,0.6)',
      mutedFill: 'rgba(255,255,255,0.4)',
      grid: '#2a2a2a',
      accent: '#06b6d4',
      accentAlpha: 'rgba(6,182,212,0.9)',
      guideLine: 'rgba(180,180,180,0.85)'
    },
    light: {
      bg: '#ffffff',
      fg: '#1a1a1a',
      muted: 'rgba(0,0,0,0.55)',
      mutedFill: 'rgba(0,0,0,0.35)',
      grid: '#e0e0e0',
      accent: '#06b6d4',
      accentAlpha: 'rgba(6,182,212,0.9)',
      guideLine: 'rgba(100,100,100,0.6)'
    }
  };

  var COLORS = THEMES.dark;

  var PLOT = {
    size: {
      small: { cw: 340, ch: 280 },
      medium: { cw: 360, ch: 320 },
      large: { cw: 520, ch: 460 }
    },
    pad: {
      small: { L: 78, R: 26, T: 26, B: 52 },
      large: { L: 88, R: 32, T: 28, B: 56 }
    },
    font: {
      title: '14px system-ui, sans-serif',
      tick: '13px system-ui, sans-serif',
      label: '14px system-ui, sans-serif',
      small: '12px system-ui, sans-serif'
    },
    controls: {
      widthLargePx: 520,
      fontSizeRem: 0.7,
      inputBg: COLORS.bg
    }
  };

  var TABLE = {
    fontSize: '0.82rem',
    padding: '0.2rem 0.35rem 0.2rem 0',
    nameColMinWidth: '1%',
    valColMinWidth: '4em'
  };

  return {
    COLORS: COLORS,
    THEMES: THEMES,
    PLOT: PLOT,
    TABLE: TABLE
  };
})();

