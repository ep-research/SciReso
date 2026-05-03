(function () {
  'use strict';

  var CONV = window.SCIRESULTS_CONVERSION;
  var TEMP = window.SCIRESULTS_TEMP;
  var S = window.SCIRESO_SYMBOLS || { symbol: function (id) { return id; }, symbolHtml: function (id) { return id; }, meaning: function (id) { return id; } };

  function sqrtHtml(inner) {
    return '<span class="sqrt">√<span class="sqrt-inner">' + inner + '</span></span>';
  }

  function resultRow(desc, symHtml, val, unit) {
    var v = (val != null && val !== '' && !isNaN(Number(val))) ? formatNumber(val) : '—';
    return '<tr><td class="abs-desc">' + desc + '</td><td class="abs-sym sym-quantity">' + (symHtml || '—') + '</td><td class="abs-val">' + v + '</td><td class="abs-unit">' + (unit != null && unit !== '' ? unit : '') + '</td></tr>';
  }
  function resultRowValUnit(desc, symHtml, val, ok, unit) {
    var v = ok ? formatNumber(val) : '—';
    return '<tr><td class="abs-desc">' + desc + '</td><td class="abs-sym sym-quantity">' + (symHtml || '—') + '</td><td class="abs-val">' + v + '</td><td class="abs-unit">' + (unit != null && unit !== '' ? unit : '') + '</td></tr>';
  }

  function inputRow(desc, symHtml, valueHtml, unitHtml, rowId) {
    var trOpen = rowId ? '<tr id="' + rowId + '">' : '<tr>';
    return trOpen + '<td class="input-desc">' + desc + '</td><td class="input-sym sym-quantity">' + (symHtml || '') + '</td><td class="input-val">' + valueHtml + '</td><td class="input-unit">' + (unitHtml || '') + '</td></tr>';
  }

  /** Label on its own line, then choice buttons across the full width of the table (colspan 4). */
  function inputChoiceSectionRow(desc, choiceHtml, rowId, labelId, trAttrs) {
    var trCls = 'tool-input-choice-section';
    var idAttr = rowId ? ' id="' + escapeAttr(rowId) + '"' : '';
    var extra = trAttrs ? ' ' + trAttrs : '';
    var labelIdAttr = labelId ? ' id="' + escapeAttr(labelId) + '"' : '';
    return '<tr' + idAttr + ' class="' + trCls + '"' + extra + '>' +
      '<td colspan="4" class="tool-input-choice-section-cell">' +
      '<div class="tool-input-choice-section-label"' + labelIdAttr + '>' + desc + '</div>' +
      choiceHtml +
      '</td></tr>';
  }

  /** Colgroup fixes column widths when the first row uses colspan (e.g. choice sections). */
  function toolInputTableOpen() {
    return '<table class="tool-input-table"><colgroup><col class="tic-desc"><col class="tic-sym"><col class="tic-val"><col class="tic-unit"></colgroup><tbody>';
  }

  function escapeAttr(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  /** Segmented control for calculation choices (same styling as Results / Equations tabs). */
  function inputChoiceButtonsHtml(inputId, choices, defaultValue, ariaLabel) {
    var dv = defaultValue != null && defaultValue !== '' ? defaultValue : (choices[0] && choices[0].value);
    var btns = choices.map(function (c) {
      var active = c.value === dv ? ' is-active' : '';
      return '<button type="button" class="tool-view-btn' + active + '" data-value="' + escapeAttr(c.value) + '">' + c.label + '</button>';
    }).join('');
    return '<div class="tool-input-choice-wrap">' +
      '<div class="tool-view-buttons tool-input-choice-btns" data-choice-for="' + escapeAttr(inputId) + '"' +
      (ariaLabel ? ' role="radiogroup" aria-label="' + escapeAttr(ariaLabel) + '"' : '') + '>' + btns + '</div>' +
      '<input type="hidden" id="' + escapeAttr(inputId) + '" value="' + escapeAttr(dv) + '"></div>';
  }

  function choiceButtonsRoot() {
    return document.getElementById('tool-inputs') || document;
  }

  function syncInputChoiceButtons(inputId) {
    var hidden = document.getElementById(inputId);
    var wrap = choiceButtonsRoot().querySelector('.tool-input-choice-btns[data-choice-for="' + inputId + '"]');
    if (!hidden || !wrap) return;
    var v = hidden.value;
    wrap.querySelectorAll('.tool-view-btn[data-value]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-value') === v);
    });
  }

  function bindChoiceButtons(inputId, onChange) {
    var hidden = document.getElementById(inputId);
    var wrap = choiceButtonsRoot().querySelector('.tool-input-choice-btns[data-choice-for="' + inputId + '"]');
    if (!hidden || !wrap) return;
    function setVal(v) {
      hidden.value = v;
      syncInputChoiceButtons(inputId);
      hidden.dispatchEvent(new Event('input', { bubbles: true }));
      hidden.dispatchEvent(new Event('change', { bubbles: true }));
      if (typeof onChange === 'function') onChange(v);
    }
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.tool-view-btn[data-value]');
      if (!b || !wrap.contains(b)) return;
      setVal(b.getAttribute('data-value'));
    });
    syncInputChoiceButtons(inputId);
  }

  function resultTable(rows, extraClass) {
    var cls = 'conversion-table absorption-table' + (extraClass ? ' ' + extraClass : '');
    return '<table class="' + cls + '"><tbody>' + (Array.isArray(rows) ? rows.join('') : rows) + '</tbody></table>';
  }

  function plotControlsHtml(prefix, placeholder, idStyle, scaleButtons, includeZControls) {
    placeholder = placeholder || 'auto';
    var xmin = idStyle === 'hyphen' ? prefix + '-x-min' : prefix + '-xmin';
    var xmax = idStyle === 'hyphen' ? prefix + '-x-max' : prefix + '-xmax';
    var ymin = idStyle === 'hyphen' ? prefix + '-y-min' : prefix + '-ymin';
    var ymax = idStyle === 'hyphen' ? prefix + '-y-max' : prefix + '-ymax';
    var xRow = '<span class="plot-control"><label>X</label><input type="text" id="' + xmin + '" inputmode="decimal" placeholder="' + placeholder + '"><input type="text" id="' + xmax + '" inputmode="decimal" placeholder="' + placeholder + '">';
    var yRow = '<span class="plot-control"><label>Y</label><input type="text" id="' + ymin + '" inputmode="decimal" placeholder="' + placeholder + '"><input type="text" id="' + ymax + '" inputmode="decimal" placeholder="' + placeholder + '">';
    if (scaleButtons) {
      xRow += '<span class="plot-scale-btns" data-axis="x"><button type="button" class="plot-scale-btn is-active" data-scale="linear">Linear</button><button type="button" class="plot-scale-btn" data-scale="log">Log</button></span>';
      yRow += '<span class="plot-scale-btns" data-axis="y"><button type="button" class="plot-scale-btn is-active" data-scale="linear">Linear</button><button type="button" class="plot-scale-btn" data-scale="log">Log</button></span>';
    }
    var html = xRow + '</span>' + yRow + '</span>';
    if (includeZControls && scaleButtons) {
      var zmin = prefix + '-zmin';
      var zmax = prefix + '-zmax';
      html += '<span class="plot-control data-plot-z-controls" style="display:none;"><label>Z</label><input type="text" id="' + zmin + '" inputmode="decimal" placeholder="' + placeholder + '"><input type="text" id="' + zmax + '" inputmode="decimal" placeholder="' + placeholder + '">';
      html += '<span class="plot-scale-btns" data-axis="z"><button type="button" class="plot-scale-btn is-active" data-scale="linear">Linear</button><button type="button" class="plot-scale-btn" data-scale="log">Log</button></span></span>';
    }
    return html;
  }

  function toolInputsHeaderHtml(resetButtonId) {
    return '<div class="tool-inputs-wrap"><div class="tool-inputs-header"><button type="button" class="tool-reset-defaults-btn" id="' + resetButtonId + '">Reset</button></div>';
  }

  function savePlotAsPng(btn) {
    var pane = btn && btn.closest && btn.closest('.tool-plot-pane');
    if (!pane && btn && btn.closest && btn.closest('.tool-plot-content')) {
      pane = (btn.closest('.tool-plot-content') && btn.closest('.tool-plot-content').querySelector('.tool-plot-pane.is-active')) || null;
    }
    if (!pane) return;
    var container = pane.querySelector('.unified-plot-wrap') || pane.firstElementChild;
    if (!container) return;
    var canvas = container.querySelector && container.querySelector('canvas');
    if (!canvas || !canvas.toDataURL) return;
    var name = (pane.getAttribute('data-plot') || 'plot').replace(/\s+/g, '-') + '.png';
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = name;
    a.click();
  }

  function buildToolResultsPanel(opts) {
    var html = '';
    if (opts.viewButtons && opts.viewButtons.length) {
      html += '<div class="tool-view-buttons">';
      opts.viewButtons.forEach(function (b) {
        var active = (b.view === 'results') ? ' is-active' : '';
        html += '<button type="button" class="tool-view-btn' + active + '" data-view="' + b.view + '">' + b.label + '</button>';
      });
      html += '</div>';
    }
    html += '<div id="' + (opts.resultsId || 'tool-results-content') + '" class="tool-results-content">' + (opts.resultsContent || '') + '</div>';
    if (opts.equationsHtml != null) {
      html += '<div class="tool-equations-content" hidden>' + opts.equationsHtml + '</div>';
    }
    if (opts.plotPanes && opts.plotPanes.length) {
      html += '<div class="tool-plot-content">';
      opts.plotPanes.forEach(function (pane) {
        html += '<div class="tool-plot-pane" data-plot="' + pane.dataPlot + '">';
        html += '<div id="' + pane.plotId + '" class="unified-plot-wrap"></div>';
        if (!pane.noControls) {
          html += '<div class="plot-controls">' + plotControlsHtml(pane.controlsPrefix, pane.placeholder, pane.idStyle, pane.scaleButtons, pane.includeZControls) +
            (pane.extraControlsHtml || '') + '</div>';
        }
        html += '</div>';
      });
      html += '<div class="plot-extra-controls">';
      html += '<label class="plot-aspect-label">Axes aspect ratio</label><select id="plot-aspect-ratio">' +
        '<option value="1:1" selected>1:1</option><option value="4:3">4:3</option><option value="3:2">3:2</option><option value="16:9">16:9</option><option value="2:1">2:1</option></select>';
      html += '<button type="button" class="plot-grid-btn" id="plot-grid-btn">Show grid</button>';
      html += '<button type="button" class="plot-save-png-btn">Save PNG</button>';
      html += '</div>';
      html += '</div>';
    }
    return html;
  }

  function bindInputsToRun(ids, runFn) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runFn); el.addEventListener('change', runFn); }
    });
  }

  function bindPlotGridButton(runFn) {
    var btn = document.getElementById('plot-grid-btn');
    if (!btn || !runFn) return;
    btn.textContent = plotGridVisible ? 'Hide grid' : 'Show grid';
    btn.onclick = function () {
      plotGridVisible = !plotGridVisible;
      btn.textContent = plotGridVisible ? 'Hide grid' : 'Show grid';
      runFn();
    };
  }

  function bindInputsChange(ids, runFn) {
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', runFn);
    });
  }

  var quantityLabels = {
    energy: 'Energy',
    mass: 'Mass',
    speed: 'Speed',
    temperature: 'Temperature',
    bfield: 'B-field',
    efield: 'E-field',
    pressure: 'Pressure',
    frequency: 'Frequency',
    angle: 'Angle',
    irradiance: 'Irradiance',
    radioactivity: 'Radioactivity'
  };
  var quantitySymbolIds = {
    energy: 'E',
    mass: 'm',
    speed: 'v',
    temperature: 'T',
    bfield: 'B',
    efield: 'E_f',
    pressure: 'P',
    frequency: 'nu',
    angle: 'theta',
    irradiance: 'I',
    radioactivity: 'A'
  };

  var tools = {
    about: {
      inputs: '<div class="about-description">' +
        '<p>SCIRESO — Science resources.</p>' +
        '<p>Online tools and calculators for scientists.</p>' +
        '</div>',
      results: '<div class="about-content about-columns">' +
        '<div class="about-col about-col-data">' +
        '<h3 class="about-main-category">Data analysis</h3>' +
        '<h3 class="about-category">Conversions</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#peak-convolution" class="nav-link" data-tool="peak-convolution">Peak Convolution</a></li>' +
        '<li><a href="#unit-conversion" class="nav-link" data-tool="unit-conversion">Unit conversion</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Data visualization</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#data-plot" class="nav-link" data-tool="data-plot">Data plot</a></li>' +
        '</ul>' +
        '</div>' +
        '<div class="about-col about-col-physics">' +
        '<h3 class="about-main-category">Physics &amp; Chemistry</h3>' +
        '<h3 class="about-category">Chemistry</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#chemical-solution" class="nav-link" data-tool="chemical-solution">Chemical Solution</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Interactions, spectroscopy and scattering</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#absorption" class="nav-link" data-tool="absorption">Absorption</a></li>' +
        '<li><a href="#bragg" class="nav-link" data-tool="bragg">Bragg diffraction</a></li>' +
        '<li><a href="#compton" class="nav-link" data-tool="compton">Compton</a></li>' +
        '<li><a href="#diffraction" class="nav-link" data-tool="diffraction">Diffraction</a></li>' +
        '<li><a href="#photoionization" class="nav-link" data-tool="photoionization">Photoionization</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Laser physics &amp; Optics</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#laser-pulse" class="nav-link" data-tool="laser-pulse">Laser Pulse</a></li>' +
        '<li><a href="#refraction" class="nav-link" data-tool="refraction">Refraction (Snell)</a></li>' +
        '<li><a href="#thin-lens" class="nav-link" data-tool="thin-lens">Thin lens / mirrors</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Particles &amp; Quantum</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#heisenberg" class="nav-link" data-tool="heisenberg">Heisenberg</a></li>' +
        '<li><a href="#particle" class="nav-link" data-tool="particle">Particle</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Radioactivity</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#decay" class="nav-link" data-tool="decay">Decay / half-life</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Synchrotron radiation</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#brilliance" class="nav-link" data-tool="brilliance">Spectral brilliance</a></li>' +
        '<li><a href="#synchrotron" class="nav-link" data-tool="synchrotron">Synchrotron radiation</a></li>' +
        '</ul>' +
        '<h3 class="about-category">Thermodynamics &amp; statistical physics</h3>' +
        '<ul class="about-calc-list">' +
        '<li><a href="#blackbody" class="nav-link" data-tool="blackbody">Blackbody</a></li>' +
        '<li><a href="#boltzmann" class="nav-link" data-tool="boltzmann">Boltzmann</a></li>' +
        '<li><a href="#ideal-gas" class="nav-link" data-tool="ideal-gas">Ideal gas</a></li>' +
        '</ul>' +
        '</div>' +
        '</div>'
    },
    'unit-conversion': { dynamic: true },
    'chemical-solution': { dynamic: true },
    absorption: { dynamic: true },
    'laser-pulse': { dynamic: true },
    particle: { dynamic: true },
    boltzmann: { dynamic: true },
    photoionization: { dynamic: true },
    compton: { dynamic: true },
    blackbody: { dynamic: true },
    'peak-convolution': { dynamic: true },
    'data-plot': { dynamic: true },
    decay: { dynamic: true },
    diffraction: { dynamic: true },
    synchrotron: { dynamic: true },
    'ideal-gas': { dynamic: true },
    heisenberg: { dynamic: true },
    refraction: { dynamic: true },
    'thin-lens': { dynamic: true },
    brilliance: { dynamic: true },
    bragg: { dynamic: true }
  };

  var toolInputsEl = document.getElementById('tool-inputs');
  var toolResultsEl = document.getElementById('tool-results');
  var navEl = document.getElementById('nav');
  function ensureToolResultsEl() {
    toolResultsEl = document.getElementById('tool-results') || toolResultsEl;
    return toolResultsEl;
  }
  var menuToggle = document.querySelector('.menu-toggle');
  var currentToolId = null;

  var THEME = window.SCIRESO_THEME || {};
  var PLOT = THEME.PLOT || {};
  var TABLE = THEME.TABLE || {};
  var PLOT_SIZE = PLOT.size || {};
  var PLOT_PAD = PLOT.pad || {};
  var PLOT_FONT = PLOT.font || {};
  var COLORS = THEME.COLORS || {};
  var THEMES = THEME.THEMES || { dark: COLORS, light: COLORS };

  var ACCENT_PRESETS = [
    { id: 'red', label: 'Red', accent: '#ef5350', accentAlpha: 'rgba(239,83,80,0.9)' },
    { id: 'orange', label: 'Orange', accent: '#ff8c00', accentAlpha: 'rgba(255,140,0,0.9)' },
    { id: 'yellow', label: 'Yellow', accent: '#ffeb3b', accentAlpha: 'rgba(255,235,59,0.9)' },
    { id: 'neon-green', label: 'Green', accent: '#39ff14', accentAlpha: 'rgba(57,255,20,0.9)' },
    { id: 'cyan', label: 'Cyan', accent: '#06b6d4', accentAlpha: 'rgba(6,182,212,0.9)' },
    { id: 'pink', label: 'Pink', accent: '#ec4899', accentAlpha: 'rgba(236,72,153,0.9)' },
    { id: 'black', label: 'Black', accent: '#424242', accentAlpha: 'rgba(66,66,66,0.9)' },
    { id: 'white', label: 'White', accent: '#ffffff', accentAlpha: 'rgba(255,255,255,0.9)' }
  ];

  var PLOT_BG = COLORS.bg || '#0d0d0d';
  var PLOT_FG = COLORS.fg || '#ffffff';
  var PLOT_MUTED = COLORS.muted || 'rgba(255,255,255,0.6)';
  var PLOT_MUTED_FILL = COLORS.mutedFill || PLOT_MUTED;
  var PLOT_GRID = COLORS.grid || '#2a2a2a';
  var PLOT_ACCENT = COLORS.accent || '#06b6d4';
  var PLOT_ACCENT_ALPHA = COLORS.accentAlpha || PLOT_ACCENT;
  var PLOT_GUIDE_LINE = COLORS.guideLine || PLOT_GRID;
  var DATA_PLOT_SERIES_COLORS = ['#06b6d4', '#ff8c00', '#39ff14', '#ec4899', '#a855f7', '#eab308', '#ffd54f'];
  var DATA_PLOT_COLOR_THEMES = {
    orange: ['#ffffff', '#ffebb8', '#ffb74d', '#ff9800', '#e65100', '#b33d00', '#661f00', '#000000'],
    cyan: ['#ffffff', '#b2ebf2', '#4dd0e1', '#00bcd4', '#00838f', '#005662', '#002a2f', '#000000'],
    green: ['#ffffff', '#c8e6c9', '#81c784', '#4caf50', '#2e7d32', '#1b5e20', '#0f3d14', '#000000'],
    pink: ['#ffffff', '#f8bbd9', '#f06292', '#e91e63', '#ad1457', '#6b0d35', '#330618', '#000000'],
    yellow: ['#ffffff', '#fff9c4', '#ffee58', '#fdd835', '#f9a825', '#e65100', '#803300', '#000000'],
    red: ['#ffffff', '#ffcdd2', '#e57373', '#f44336', '#c62828', '#8b0000', '#4a0000', '#000000'],
    black: ['#ffffff', '#e8e8e8', '#bdbdbd', '#9e9e9e', '#757575', '#616161', '#424242', '#000000'],
    multicolor: ['#06b6d4', '#ff8c00', '#39ff14', '#ec4899', '#a855f7', '#eab308', '#ffd54f']
  };
  var DATA_PLOT_LINE_DASHES = [[], [6, 4], [2, 3], [8, 3, 2, 3], [12, 5]];
  var DATA_PLOT_MARKER_RADIUS = 4;

  /** Copy theme/accent from pre-rename localStorage keys (SCIREPO → SCIRESO). */
  function migrateScirepoLocalStorageToScireso() {
    try {
      if (!localStorage.getItem('scireso-theme')) {
        var oldT = localStorage.getItem('scirepo-theme');
        if (oldT) localStorage.setItem('scireso-theme', oldT);
      }
      if (!localStorage.getItem('scireso-accent')) {
        var oldA = localStorage.getItem('scirepo-accent');
        if (oldA) localStorage.setItem('scireso-accent', oldA);
      }
    } catch (e) { /* ignore */ }
  }
  migrateScirepoLocalStorageToScireso();

  function applyStoredAccent() {
    try {
      var stored = localStorage.getItem('scireso-accent');
      if (stored) {
        for (var i = 0; i < ACCENT_PRESETS.length; i++) {
          if (ACCENT_PRESETS[i].id === stored) {
            PLOT_ACCENT = ACCENT_PRESETS[i].accent;
            PLOT_ACCENT_ALPHA = ACCENT_PRESETS[i].accentAlpha;
            break;
          }
        }
      }
    } catch (e) { /* ignore */ }
  }
  applyStoredAccent();

  function applyTheme(theme) {
    theme = (theme === 'light') ? 'light' : 'dark';
    document.body.setAttribute('data-theme', theme);
    var c = THEMES[theme] || THEMES.dark;
    PLOT_BG = c.bg || PLOT_BG;
    PLOT_FG = c.fg || PLOT_FG;
    PLOT_MUTED = c.muted || PLOT_MUTED;
    PLOT_MUTED_FILL = c.mutedFill != null ? c.mutedFill : PLOT_MUTED;
    PLOT_GRID = c.grid || PLOT_GRID;
    PLOT_GUIDE_LINE = c.guideLine || PLOT_GRID;
    if (c.accent) { PLOT_ACCENT = c.accent; PLOT_ACCENT_ALPHA = c.accentAlpha || c.accent; }
    var rootStyle = document.documentElement && document.documentElement.style;
    if (rootStyle) rootStyle.setProperty('--range-input-bg', c.bg || '#0d0d0d');
    applyStoredAccent();
    try { localStorage.setItem('scireso-theme', theme); } catch (e) { /* ignore */ }
    refreshCurrentTool();
  }

  function applyStoredTheme() {
    var theme = 'dark';
    try { theme = localStorage.getItem('scireso-theme') || 'dark'; } catch (e) { /* ignore */ }
    if (theme !== 'light') theme = 'dark';
    document.body.setAttribute('data-theme', theme);
    var c = THEMES[theme] || THEMES.dark;
    PLOT_BG = c.bg || PLOT_BG;
    PLOT_FG = c.fg || PLOT_FG;
    PLOT_MUTED = c.muted || PLOT_MUTED;
    PLOT_MUTED_FILL = c.mutedFill != null ? c.mutedFill : PLOT_MUTED;
    PLOT_GRID = c.grid || PLOT_GRID;
    PLOT_GUIDE_LINE = c.guideLine || PLOT_GRID;
    if (c.accent) { PLOT_ACCENT = c.accent; PLOT_ACCENT_ALPHA = c.accentAlpha || c.accent; }
    var rootStyle = document.documentElement && document.documentElement.style;
    if (rootStyle && c.bg) rootStyle.setProperty('--range-input-bg', c.bg);
    applyStoredAccent();
  }
  applyStoredTheme();

  function setAccentPreset(presetId) {
    for (var i = 0; i < ACCENT_PRESETS.length; i++) {
      if (ACCENT_PRESETS[i].id === presetId) {
        PLOT_ACCENT = ACCENT_PRESETS[i].accent;
        PLOT_ACCENT_ALPHA = ACCENT_PRESETS[i].accentAlpha;
        try { localStorage.setItem('scireso-accent', presetId); } catch (e) { /* ignore */ }
        refreshCurrentTool();
        return;
      }
    }
  }

  function refreshCurrentTool() {
    var id = currentToolId;
    if (!id) return;
    if (id === 'unit-conversion') runConversion();
    else if (id === 'chemical-solution') runChemicalSolution();
    else if (id === 'absorption') runAbsorption();
    else if (id === 'laser-pulse') runLaserPulse();
    else if (id === 'particle') runParticle();
    else if (id === 'boltzmann') runBoltzmann();
    else if (id === 'photoionization') runPhotoionization();
    else if (id === 'compton') runCompton();
    else if (id === 'blackbody') runBlackbody();
    else if (id === 'peak-convolution') runPeakConvolution();
    else if (id === 'decay') runDecay();
    else if (id === 'ideal-gas') runIdealGas();
    else if (id === 'data-plot') runDataPlot();
  }

  function bindMobileResultsSwitcher(selectId, wrapperClass) {
    var sel = document.getElementById(selectId);
    if (!sel) return;
    var wrapper = wrapperClass ? document.querySelector('.' + wrapperClass) : sel.parentElement;
    if (!wrapper) return;
    var sections = wrapper.querySelectorAll('.mobile-results-section');
    function showSection(value) {
      sections.forEach(function (s) {
        s.classList.toggle('is-active', s.getAttribute('data-section') === value);
      });
      setTimeout(refreshCurrentTool, 50);
    }
    showSection(sel.value);
    sel.addEventListener('change', function () { showSection(sel.value); });
  }

  var PAD_SMALL = PLOT_PAD.small || { L: 78, R: 26, T: 26, B: 52 };
  var PAD_LARGE = PLOT_PAD.large || { L: 88, R: 32, T: 28, B: 56 };

  var SIZE_SMALL = PLOT_SIZE.small || { cw: 340, ch: 280 };
  var SIZE_MED = PLOT_SIZE.medium || { cw: 360, ch: 320 };
  var SIZE_LARGE = PLOT_SIZE.large || { cw: 520, ch: 460 };
  var PLOT_SLOT = { cw: 520, ch: 460 };
  var plotGridVisible = false;

  var FONT_TITLE = PLOT_FONT.title || '14px system-ui, sans-serif';
  var FONT_TICK = PLOT_FONT.tick || '13px system-ui, sans-serif';
  var FONT_LABEL = PLOT_FONT.label || '14px system-ui, sans-serif';
  var FONT_SMALL = PLOT_FONT.small || '12px system-ui, sans-serif';

  var PLOT_CONTROLS = PLOT.controls || {};

  (function applyThemeCSSVars() {
    try {
      var rootStyle = document.documentElement && document.documentElement.style;
      if (!rootStyle) return;
      var controlsWidth = (PLOT_CONTROLS.widthLargePx != null ? PLOT_CONTROLS.widthLargePx : SIZE_LARGE.cw);
      rootStyle.setProperty('--plot-controls-width', String(controlsWidth) + 'px');
      rootStyle.setProperty('--plot-controls-font-size', (PLOT_CONTROLS.fontSizeRem != null ? String(PLOT_CONTROLS.fontSizeRem) : '0.7') + 'rem');
      var theme = (document.body.getAttribute('data-theme') === 'light') ? 'light' : 'dark';
      var rangeBg = (THEMES[theme] && THEMES[theme].bg) ? THEMES[theme].bg : (COLORS.bg || '#0d0d0d');
      rootStyle.setProperty('--range-input-bg', rangeBg);
      rootStyle.setProperty('--table-font-size', TABLE.fontSize || '0.82rem');
      rootStyle.setProperty('--table-cell-padding', TABLE.padding || '0.2rem 0.35rem 0.2rem 0');
      rootStyle.setProperty('--table-name-col-width', TABLE.nameColMinWidth || '1%');
      rootStyle.setProperty('--table-val-col-min-width', TABLE.valColMinWidth || '4em');
    } catch (e) { /* ignore */ }
  })();

  function hexToRgb(hex) {
    var m = (hex || '').replace(/^#/, '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return { r: 6, g: 182, b: 212 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }

  function getPlotSize(container, defaultW, defaultH) {
    var w = defaultW || SIZE_SMALL.cw;
    var h = defaultH || SIZE_SMALL.ch;
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
    if (isMobile && container && container.clientWidth > 0) {
      w = container.clientWidth;
      h = container.clientHeight > 0 ? container.clientHeight : Math.round(h * (w / (defaultW || SIZE_SMALL.cw)));
    }
    return { cw: w, ch: h };
  }

  function setupHiDPICanvas(canvas, cssW, cssH) {
    var dpr = (window.devicePixelRatio || 1);
    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    var ctx = canvas.getContext('2d');
    if (ctx && ctx.setTransform) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (ctx) ctx.__dpr = dpr;
    return ctx;
  }

  function withPlotClip(ctx, pad, w, h, drawFn) {
    if (!ctx || !pad || !drawFn) { if (drawFn) drawFn(); return; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.L, pad.T, w, h);
    ctx.clip();
    drawFn();
    ctx.restore();
  }

  function drawUnifiedCartesianPlot(container, opts) {
    if (!container || !opts) return;
    var plotXMin = opts.plotXMin;
    var plotXMax = opts.plotXMax;
    var plotYMin = opts.plotYMin;
    var plotYMax = opts.plotYMax;
    var xScale = (opts.xScale === 'log') ? 'log' : 'linear';
    var yScale = (opts.yScale === 'log') ? 'log' : 'linear';
    var xLabel = opts.xLabel != null ? String(opts.xLabel) : '';
    var yLabel = opts.yLabel != null ? String(opts.yLabel) : '';
    var title = opts.title != null ? String(opts.title) : '';
    var canvasClass = opts.canvasClass || 'data-plot';
    var formatXTick = typeof opts.formatXTick === 'function' ? opts.formatXTick : formatPlotNum;
    var formatYTick = typeof opts.formatYTick === 'function' ? opts.formatYTick : formatPlotNum;
    var drawData = typeof opts.drawData === 'function' ? opts.drawData : function () {};
    var afterClip = typeof opts.afterClip === 'function' ? opts.afterClip : null;
    var suppressMajorGrid = opts.suppressMajorGrid === true;
    var pad = { L: PAD_LARGE.L, R: PAD_LARGE.R + (opts.extraPadR || 0), T: PAD_LARGE.T, B: PAD_LARGE.B };
    var size = getPlotSize(container, PLOT_SLOT.cw, PLOT_SLOT.ch);
    var cw = size.cw;
    var ch = size.ch;
    var aspectEl = document.getElementById('plot-aspect-ratio');
    if (aspectEl && aspectEl.value) {
      var axisAspect = 1;
      var parts = String(aspectEl.value).split(':');
      if (parts.length === 2) {
        var a = parseFloat(parts[0]), b = parseFloat(parts[1]);
        if (isFinite(a) && isFinite(b) && b > 0) axisAspect = a / b;
      }
      var maxInnerW = cw - pad.L - pad.R;
      var maxInnerH = ch - pad.T - pad.B;
      var w = maxInnerW, h = maxInnerH;
      h = maxInnerW / axisAspect;
      if (h > maxInnerH) { h = maxInnerH; w = maxInnerH * axisAspect; } else { w = maxInnerW; }
      cw = w + pad.L + pad.R;
      ch = h + pad.T + pad.B;
    }
    var plotXSpan = plotXMax - plotXMin || 1;
    var plotYSpan = plotYMax - plotYMin || 1;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xLogSpan = (xScale === 'log') ? (Math.log10(plotXMax) - Math.log10(plotXMin)) || 1 : 0;
    var yLogSpan = (yScale === 'log') ? (Math.log10(plotYMax) - Math.log10(plotYMin)) || 1 : 0;
    function toGX(v) {
      if (xScale === 'log') {
        if (v <= 0 || !isFinite(v)) return null;
        return pad.L + ((Math.log10(v) - Math.log10(plotXMin)) / xLogSpan) * w;
      }
      return pad.L + ((v - plotXMin) / plotXSpan) * w;
    }
    function toGY(v) {
      if (yScale === 'log') {
        if (v <= 0 || !isFinite(v)) return null;
        return ch - pad.B - ((Math.log10(v) - Math.log10(plotYMin)) / yLogSpan) * h;
      }
      return ch - pad.B - ((v - plotYMin) / plotYSpan) * h;
    }
    container.innerHTML = '';
    var canvas = document.createElement('canvas');
    canvas.className = canvasClass;
    var ctx = setupHiDPICanvas(canvas, cw, ch);
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    if (title) {
      ctx.font = FONT_TITLE;
      ctx.textAlign = 'center';
      ctx.fillText(title, cw / 2, 16);
    }
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText(xLabel, pad.L + w / 2, ch - 10);
    ctx.save();
    ctx.translate(18, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    var xt = (xScale === 'log') ? axisTicksLog(plotXMin, plotXMax) : axisTicks(plotXMin, plotXMax, 5);
    var yt = (yScale === 'log') ? axisTicksLog(plotYMin, plotYMax) : axisTicks(plotYMin, plotYMax, 5);
    ctx.textAlign = 'right';
    ctx.font = FONT_SMALL;
    xt.minors.forEach(function (v) {
      var gx = toGX(v);
      if (gx == null) return;
      ctx.beginPath();
      ctx.moveTo(gx, ch - pad.B);
      ctx.lineTo(gx, ch - pad.B + 2);
      ctx.stroke();
    });
    xt.majors.forEach(function (v) {
      var gx = toGX(v);
      if (gx == null) return;
      ctx.beginPath();
      ctx.moveTo(gx, ch - pad.B);
      ctx.lineTo(gx, ch - pad.B + 4);
      ctx.stroke();
      ctx.fillText(formatXTick(v), gx - 4, ch - pad.B + 18);
    });
    yt.minors.forEach(function (v) {
      var gy = toGY(v);
      if (gy == null) return;
      ctx.beginPath();
      ctx.moveTo(pad.L - 2, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
    });
    yt.majors.forEach(function (v) {
      var gy = toGY(v);
      if (gy == null) return;
      ctx.beginPath();
      ctx.moveTo(pad.L - 4, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
      ctx.fillText(formatYTick(v), pad.L - 8, gy + 4);
    });
    if (plotGridVisible && !suppressMajorGrid) {
      ctx.strokeStyle = 'rgba(128,128,128,0.12)';
      ctx.lineWidth = 1;
      xt.majors.forEach(function (v) {
        var gx = toGX(v);
        if (gx == null) return;
        ctx.beginPath();
        ctx.moveTo(gx, pad.T);
        ctx.lineTo(gx, ch - pad.B);
        ctx.stroke();
      });
      yt.majors.forEach(function (v) {
        var gy = toGY(v);
        if (gy == null) return;
        ctx.beginPath();
        ctx.moveTo(pad.L, gy);
        ctx.lineTo(cw - pad.R, gy);
        ctx.stroke();
      });
      ctx.strokeStyle = PLOT_FG;
    }
    var helpers = { toGX: toGX, toGY: toGY, pad: pad, w: w, h: h, ch: ch, cw: cw };
    withPlotClip(ctx, pad, w, h, function () { drawData(ctx, helpers); });
    if (afterClip) afterClip(ctx, helpers);
    container.appendChild(canvas);
  }

  function formatNumber(x) {
    var n = Number(x);
    if (x == null || x === '' || !isFinite(n)) return '—';
    if (n === 0) return '0';
    var a = Math.abs(n);
    if (a >= 1000 || (a < 0.001 && a > 0)) return n.toExponential(4);
    if (a >= 100) return n.toFixed(2);
    if (a >= 1) return n.toFixed(4);
    if (a >= 0.01) return n.toFixed(6);
    return n.toExponential(4);
  }

  function renderUnitConversionInputs() {
    var ucQtyChoices = Object.keys(CONV).map(function (key) {
      return { value: key, label: quantityLabels[key] || key };
    });
    var ucDefaultQty = ucQtyChoices[0] ? ucQtyChoices[0].value : 'energy';
    return toolInputTableOpen() +
      inputChoiceSectionRow('Quantity', inputChoiceButtonsHtml('uc-quantity', ucQtyChoices, ucDefaultQty, 'Quantity')) +
      inputRow('Value', '<span id="uc-symbol-cell"></span>', '<input type="text" id="uc-value" inputmode="decimal" placeholder="Number" value="1">', '<select id="uc-unit"></select>') +
      '</tbody></table>';
  }

  function fillUnitSelect(quantityId) {
    var sel = document.getElementById('uc-unit');
    if (!sel) return;
    sel.innerHTML = '';
    var q = CONV[quantityId];
    if (q.special && quantityId === 'temperature') {
      ['K', 'C', 'F'].forEach(function (u) {
        var opt = document.createElement('option');
        opt.value = u;
        opt.textContent = '°' + u + (u === 'K' ? '' : '');
        if (u === 'K') opt.textContent = 'K';
        sel.appendChild(opt);
      });
      var symEl = document.getElementById('uc-symbol-cell');
      if (symEl && quantityId) symEl.innerHTML = S.symbolHtml(quantitySymbolIds[quantityId] || '');
      return;
    }
    if (!q || !q.units) return;
    q.units.forEach(function (u) {
      var opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.label;
      sel.appendChild(opt);
    });
    var symEl = document.getElementById('uc-symbol-cell');
    if (symEl && quantityId) symEl.innerHTML = S.symbolHtml(quantitySymbolIds[quantityId] || '');
  }

  function runConversion() {
    if (currentToolId !== 'unit-conversion' || !toolResultsEl) return;
    var quantityEl = document.getElementById('uc-quantity');
    var unitEl = document.getElementById('uc-unit');
    var valueEl = document.getElementById('uc-value');
    var quantityId = quantityEl ? quantityEl.value : '';
    var unitId = unitEl ? (unitEl.value || unitEl.options[0] && unitEl.options[0].value) : '';
    var valueStr = valueEl && valueEl.value != null ? String(valueEl.value).trim() : '';
    var tableHtml;
    if (!quantityId || !CONV || !CONV[quantityId]) {
      tableHtml = resultTable(['<tr><td class="abs-desc">Select quantity and enter a value</td><td class="abs-sym"></td><td class="abs-val">—</td><td class="abs-unit"></td></tr>']);
      toolResultsEl.innerHTML = buildToolResultsPanel({
        viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
        resultsId: 'uc-results-table',
        resultsContent: tableHtml,
        equationsHtml: ucEquationsHtml
      });
      return;
    }

    var num = parseFloat(valueStr);
    var q = CONV[quantityId];
    var rows = [];
    var valueInBase;
    var invalid = isNaN(num);

    if (!invalid && q.special && quantityId === 'temperature') {
      valueInBase = TEMP[unitId].toBase(num);
      ['K', 'C', 'F'].forEach(function (key) {
        var t = TEMP[key];
        rows.push([quantityLabels[quantityId] || quantityId, S.symbolHtml(quantitySymbolIds[quantityId] || 'T'), t.fromBase(valueInBase), t.label]);
      });
    } else if (!invalid) {
      var fromUnit = q.units.find(function (u) { return u.id === unitId; });
      if (fromUnit) {
        valueInBase = fromUnit.toBase ? fromUnit.toBase(num) : num * fromUnit.factor;
        q.units.forEach(function (u) {
          var v = u.fromBase ? u.fromBase(valueInBase) : valueInBase / u.factor;
          rows.push([quantityLabels[quantityId] || quantityId, S.symbolHtml(quantitySymbolIds[quantityId] || ''), v, u.label || u.id]);
        });
      }
    }
    if (invalid || rows.length === 0) {
      if (q.special && quantityId === 'temperature') {
        ['K', 'C', 'F'].forEach(function (key) {
          var t = TEMP[key];
          rows.push([quantityLabels[quantityId] || quantityId, S.symbolHtml(quantitySymbolIds[quantityId] || 'T'), '—', t.label]);
        });
      } else if (q && q.units) {
        q.units.forEach(function (u) {
          rows.push([quantityLabels[quantityId] || quantityId, S.symbolHtml(quantitySymbolIds[quantityId] || ''), '—', u.label || u.id]);
        });
      }
    }

    tableHtml = (invalid ? '<p class="placeholder">Enter a valid number.</p>' : '') + resultTable(rows.map(function (r) { return resultRow(r[0], r[1], r[2], r[3]); }));
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'uc-results-table',
      resultsContent: tableHtml,
      equationsHtml: ucEquationsHtml
    });
  }

  var ucEquationsHtml = '<p class="tool-formula">value in unit = value in base × factor</p>' +
    '<p class="tool-formula">value in base = value in unit × factor</p>' +
    '<p class="tool-formula">(Reciprocal units use toBase/fromBase, e.g. ' + S.symbolHtml('lambda') + ' = hc/' + S.symbolHtml('E') + ' for energy ↔ wavelength)</p>';

  function initUnitConversion() {
    if (!toolResultsEl) return;
    toolInputsEl.innerHTML = toolInputsHeaderHtml('uc-reset-defaults') + renderUnitConversionInputs() + '</div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'uc-results-table',
      equationsHtml: ucEquationsHtml
    });
    var qEl = document.getElementById('uc-quantity');
    if (qEl) fillUnitSelect(qEl.value || (Object.keys(CONV)[0] || 'energy'));
    runConversion();
    setTimeout(function () { runConversion(); }, 0);
    bindChoiceButtons('uc-quantity', function () {
      fillUnitSelect(document.getElementById('uc-quantity').value);
      runConversion();
    });
    bindInputsToRun(['uc-unit', 'uc-value'], runConversion);
    var ucReset = document.getElementById('uc-reset-defaults');
    if (ucReset) ucReset.addEventListener('click', initUnitConversion);
  }

  function getCsVal(id) {
    var el = document.getElementById(id);
    return el ? window.SCIRESULTS_CS.parseNum(el.value) : NaN;
  }

  function updateCsKnowns() {
    var cType = (document.getElementById('cs-conc-type') && document.getElementById('cs-conc-type').value) || 'molarity';
    var source = (document.getElementById('cs-source') && document.getElementById('cs-source').value) || 'solid';
    var CS = window.SCIRESULTS_CS;
    var types = CS.concTypes;
    var t = types[cType];
    if (!t) return;
    var molarRow = document.getElementById('cs-molar-mass-row');
    var rhoSoluteRow = document.getElementById('cs-rho-solute-row');
    var rhoSolutionRow = document.getElementById('cs-rho-solution-row');
    if (molarRow) molarRow.style.display = t.needs.indexOf('M') !== -1 ? '' : 'none';
    if (rhoSoluteRow) rhoSoluteRow.style.display = t.needs.indexOf('rho_solute') !== -1 ? '' : 'none';
    if (rhoSolutionRow) rhoSolutionRow.style.display = t.needs.indexOf('rho_solution') !== -1 ? '' : 'none';
    var concUnitEl = document.getElementById('cs-conc-unit');
    if (concUnitEl) {
      concUnitEl.innerHTML = t.units.map(function (u) { return '<option value="' + u.id + '">' + u.label + '</option>'; }).join('');
    }
    var targetUnitEl = document.getElementById('cs-target-unit');
    if (targetUnitEl) {
      if (t.targetIsMass) targetUnitEl.innerHTML = '<option value="g">g</option><option value="kg">kg</option>';
      else targetUnitEl.innerHTML = '<option value="L">L</option><option value="mL" selected>mL</option><option value="uL">μL</option>';
    }
    var stockRow = document.getElementById('cs-stock-row');
    if (stockRow) stockRow.style.display = source === 'stock' ? '' : 'none';
    var stockUnitEl = document.getElementById('cs-stock-unit');
    if (stockUnitEl && source === 'stock') stockUnitEl.innerHTML = t.units.map(function (u) { return '<option value="' + u.id + '">' + u.label + '</option>'; }).join('');
    ['cs-molar-mass', 'cs-rho-solute', 'cs-rho-solution'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.removeEventListener('input', runChemicalSolution); el.removeEventListener('change', runChemicalSolution); el.addEventListener('input', runChemicalSolution); el.addEventListener('change', runChemicalSolution); }
    });
    runChemicalSolution();
  }

  function runChemicalSolution() {
    var container = document.getElementById('cs-results');
    if (!container) return;
    var CS = window.SCIRESULTS_CS;
    var params = {
      source: (document.getElementById('cs-source') && document.getElementById('cs-source').value) || 'solid',
      concType: (document.getElementById('cs-conc-type') && document.getElementById('cs-conc-type').value) || 'molarity',
      concValue: getCsVal('cs-conc'),
      concUnit: (document.getElementById('cs-conc-unit') && document.getElementById('cs-conc-unit').value) || 'mM',
      targetValue: getCsVal('cs-target'),
      targetUnit: (document.getElementById('cs-target-unit') && document.getElementById('cs-target-unit').value) || 'mL',
      molarMass: getCsVal('cs-molar-mass'),
      rhoSolute: getCsVal('cs-rho-solute'),
      rhoSolution: getCsVal('cs-rho-solution'),
      stockValue: getCsVal('cs-stock-value'),
      stockUnit: (document.getElementById('cs-stock-unit') && document.getElementById('cs-stock-unit').value) || 'M'
    };
    var r = CS.compute(params);
    var formulaHtml = '';
    var source = params.source;
    var rows = [];
    if (r.error) {
      rows.push(resultRow('Result', '—', null, ''));
    } else if (source !== 'stock' && !isNaN(r.mass_g) && r.mass_g >= 0) {
      rows.push(resultRow('Mass to add', S.symbolHtml('m'), r.mass_g, 'g'));
      rows.push(resultRow('', '', r.mass_g * 1000, 'mg'));
    }
    if (!isNaN(r.volume_mL) && r.volume_mL >= 0) {
      rows.push(resultRow('Volume to add (liquid solute)', S.symbolHtml('V'), r.volume_mL, 'mL'));
      if (r.volume_mL < 1) rows.push(resultRow('', '', r.volume_mL * 1000, 'μL'));
    }
    if (!isNaN(r.V_stock_mL) && r.V_stock_mL >= 0) {
      rows.push(resultRow('Take stock', S.symbolHtml('V'), r.V_stock_mL, 'mL'));
      var Vfinal = (r.V_final_L || 0) * 1000;
      if (Vfinal > 0) rows.push(resultRow('Add solvent to', '', Vfinal, 'mL'));
    }
    if (!r.error && !isNaN(r.moles) && r.moles >= 0) rows.push(resultRow('Amount in final solution', S.symbolHtml('n'), r.moles * 1000, 'mmol'));
    if (!r.error && rows.length === 0) rows.push(resultRow('Result', '—', null, ''));
    var eqHtml = formulaHtml || '<p class="tool-formula">c = n / V</p>' +
      '<p class="tool-formula">m = n · M</p>' +
      '<p class="tool-formula">(mass to add for solid; for stock: V<sub>stock</sub> = c<sub>final</sub> · V<sub>final</sub> / c<sub>stock</sub>)</p>';
    container.innerHTML = (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + resultTable(rows);
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (equationsContent) equationsContent.innerHTML = eqHtml;
  }

  function initChemicalSolution() {
    var CS = window.SCIRESULTS_CS;
    var csConcChoices = Object.keys(CS.concTypes).map(function (k) { return { value: k, label: CS.concTypes[k].label }; });
    var molarRow = '<tr id="cs-molar-mass-row"><td class="input-desc">Molar mass</td><td class="input-sym sym-quantity">M</td><td class="input-val"><input type="text" id="cs-molar-mass" inputmode="decimal" placeholder="g/mol" value="58.44"></td><td class="input-unit">g/mol</td></tr>';
    var rhoSoluteRow = '<tr id="cs-rho-solute-row"><td class="input-desc">Solute density</td><td class="input-sym sym-quantity">' + S.symbolHtml('rho') + '</td><td class="input-val"><input type="text" id="cs-rho-solute" inputmode="decimal" placeholder="g/mL" value="1"></td><td class="input-unit">g/mL</td></tr>';
    var rhoSolutionRow = '<tr id="cs-rho-solution-row"><td class="input-desc">Solution density</td><td class="input-sym sym-quantity">' + S.symbolHtml('rho') + '</td><td class="input-val"><input type="text" id="cs-rho-solution" inputmode="decimal" placeholder="g/mL" value="1"></td><td class="input-unit">g/mL</td></tr>';
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('cs-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Source', inputChoiceButtonsHtml('cs-source', [
        { value: 'solid', label: 'Solid solute' },
        { value: 'liquid', label: 'Pure liquid solute' },
        { value: 'stock', label: 'From stock solution' }
      ], 'solid', 'Source')) +
      '<tr id="cs-stock-row" style="display:none"><td class="input-desc">Stock concentration</td><td class="input-sym"></td><td class="input-val"><input type="text" id="cs-stock-value" inputmode="decimal" placeholder="e.g. 1" value="1"></td><td class="input-unit"><select id="cs-stock-unit"></select></td></tr>' +
      molarRow + rhoSoluteRow + rhoSolutionRow +
      inputChoiceSectionRow('Concentration type', inputChoiceButtonsHtml('cs-conc-type', csConcChoices, csConcChoices[0] && csConcChoices[0].value, 'Concentration type')) +
      inputRow('Target concentration', '', '<input type="text" id="cs-conc" inputmode="decimal" placeholder="e.g. 1" value="1">', '<select id="cs-conc-unit"></select>') +
      inputRow('Target volume or mass', '', '<input type="text" id="cs-target" inputmode="decimal" placeholder="e.g. 100" value="100">', '<select id="cs-target-unit"></select>') +
      '</tbody></table></div>';
    var csDefaultEq = '<p class="tool-formula">c = n / V</p><p class="tool-formula">m = n · M</p><p class="tool-formula">(mass to add for solid; for stock: V<sub>stock</sub> = c<sub>final</sub> · V<sub>final</sub> / c<sub>stock</sub>)</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'cs-results',
      equationsHtml: csDefaultEq
    });
    updateCsKnowns();
    bindChoiceButtons('cs-source', updateCsKnowns);
    bindChoiceButtons('cs-conc-type', updateCsKnowns);
    bindInputsToRun(['cs-conc', 'cs-target', 'cs-stock-value'], runChemicalSolution);
    bindInputsChange(['cs-conc-unit', 'cs-target-unit', 'cs-stock-unit'], runChemicalSolution);
    var csReset = document.getElementById('cs-reset-defaults');
    if (csReset) csReset.addEventListener('click', initChemicalSolution);
  }

  function getAbsVal(id) {
    var el = document.getElementById(id);
    return el ? window.SCIRESULTS_ABSORPTION.parseNum(el.value) : NaN;
  }

  function cmToThicknessUnit(L_cm, unit) {
    if (unit === 'cm') return L_cm;
    if (unit === 'mm') return L_cm * 10;
    if (unit === 'um' || unit === 'μm') return L_cm * 1e4;
    if (unit === 'nm') return L_cm * 1e7;
    return L_cm;
  }

  function thicknessUnitLabel(unit) {
    if (unit === 'um' || unit === 'μm') return 'μm';
    if (unit === 'cm') return 'cm';
    if (unit === 'mm') return 'mm';
    if (unit === 'nm') return 'nm';
    return 'cm';
  }

  function displayToCm(xDisplay, unit) {
    if (unit === 'cm') return xDisplay;
    if (unit === 'mm') return xDisplay * 0.1;
    if (unit === 'um' || unit === 'μm') return xDisplay * 1e-4;
    if (unit === 'nm') return xDisplay * 1e-7;
    return xDisplay;
  }

  function drawAbsorptionPlot(container, L_cm, alpha, plotY, thicknessUnit, range) {
    var ABS = window.SCIRESULTS_ABSORPTION;
    var thicknessUnit_ = thicknessUnit || 'cm';
    var toDisplay = function (x_cm) { return cmToThicknessUnit(x_cm, thicknessUnit_); };
    var hasXRange = range && (typeof range.xMin === 'number' && !isNaN(range.xMin)) && (typeof range.xMax === 'number' && !isNaN(range.xMax)) && range.xMax > range.xMin;
    var xMin_cm = 0, xMax_cm = L_cm > 0 ? L_cm * 2 : 1;
    if (hasXRange) {
      xMin_cm = displayToCm(range.xMin, thicknessUnit_);
      xMax_cm = displayToCm(range.xMax, thicknessUnit_);
    }
    var points = (alpha > 0 && isFinite(alpha))
      ? (hasXRange ? ABS.thicknessRangeFromTo(xMin_cm, xMax_cm, alpha, 80) : ABS.thicknessRange(L_cm, alpha, 80))
      : [];
    if (!hasXRange && points.length) {
      xMax_cm = points[points.length - 1].L_cm;
    }
    var yKey = plotY === 'I_I0' ? 'I_I0' : plotY === 'A_nap' ? 'A_nap' : 'A_dec';
    var yMin = 0;
    var yMax = 1;
    var hasYRange = range && (typeof range.yMin === 'number' && !isNaN(range.yMin)) && (typeof range.yMax === 'number' && !isNaN(range.yMax)) && range.yMax > range.yMin;
    if (hasYRange) {
      yMin = range.yMin;
      yMax = range.yMax;
    } else if (points.length) {
      var yMinData = Infinity, yMaxData = -Infinity;
      points.forEach(function (p) {
        var v = p[yKey];
        if (v < yMinData) yMinData = v;
        if (v > yMaxData) yMaxData = v;
      });
      if (isFinite(yMinData) && isFinite(yMaxData)) {
        var ySpanData = yMaxData - yMinData;
        var margin = (ySpanData > 0 ? ySpanData * 0.05 : 0.1) || 0.01;
        yMin = yMinData - margin;
        yMax = yMaxData + margin;
        if (yKey === 'I_I0' && yMax > 1) yMax = 1;
        if (yKey === 'I_I0' && yMin < 0) yMin = 0;
      }
    } else {
      if (yKey === 'I_I0') { yMin = 0; yMax = 1; }
    }
    var xMaxDisplay = toDisplay(xMax_cm);
    var xMinDisplay = toDisplay(xMin_cm);
    var xScale = (range && range.xScale === 'log') ? 'log' : 'linear';
    var yScale = (range && range.yScale === 'log') ? 'log' : 'linear';
    if (xScale === 'log' && xMinDisplay <= 0) xMinDisplay = Math.min(0.1, xMaxDisplay / 1000) || 0.1;
    if (xScale === 'log' && xMaxDisplay <= 0) xMaxDisplay = Math.max(10, xMinDisplay * 1000) || 10;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.1, yMax / 1000) || 0.1;
    if (yScale === 'log' && yMax <= 0) yMax = Math.max(10, yMin * 1000) || 10;
    var xLabel = 'Thickness (' + thicknessUnitLabel(thicknessUnit_) + ')';
    var iI0 = S.symbolHtml('I') + '/' + S.symbolHtml('I0');
    var yLabel = plotY === 'I_I0' ? iI0 : plotY === 'A_nap' ? '−ln(' + iI0 + ')' : '−log(' + iI0 + ')';
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMinDisplay, plotXMax: xMaxDisplay, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale, xLabel: xLabel, yLabel: yLabel, title: '',
      canvasClass: 'absorption-plot',
      drawData: function (ctx, h) {
        if (!points.length) return;
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 2;
        ctx.beginPath();
        var needMove = true;
        for (var i = 0; i < points.length; i++) {
          var xDisplay = toDisplay(points[i].L_cm);
          var yVal = points[i][yKey];
          var gx = toGX(xDisplay);
          var gy = toGY(yVal);
          if (gx != null && gy != null) {
            if (needMove) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
            needMove = false;
          } else {
            needMove = true;
          }
        }
        ctx.stroke();
      }
    });
  }

  function formatPlotNum(x) {
    if (x === 0) return '0';
    if (Math.abs(x) >= 1000 || (Math.abs(x) < 0.001 && x !== 0)) return x.toExponential(1);
    if (Math.abs(x) >= 1) return x.toFixed(1);
    return x.toFixed(3);
  }

  function niceTicks(minVal, maxVal, nApprox) {
    var span = maxVal - minVal;
    if (span <= 0 || !isFinite(span)) return [minVal, maxVal];
    var step = span / (nApprox || 5);
    var mag = Math.pow(10, Math.floor(Math.log10(step)));
    var norm = step / mag;
    if (norm <= 1) step = mag;
    else if (norm <= 2) step = 2 * mag;
    else if (norm <= 5) step = 5 * mag;
    else step = 10 * mag;
    var start = Math.ceil(minVal / step) * step;
    var ticks = [];
    var t = start;
    while (t <= maxVal) {
      ticks.push(t);
      t += step;
    }
    if (ticks.length < 2) ticks = [minVal, maxVal];
    return ticks;
  }

  function minorTicks(minVal, maxVal, majorTicks, nMinor) {
    var out = [];
    var n = nMinor || 4;
    for (var i = 0; i < majorTicks.length - 1; i++) {
      var a = majorTicks[i];
      var b = majorTicks[i + 1];
      for (var j = 1; j <= n; j++) {
        var v = a + (b - a) * j / (n + 1);
        if (v > minVal && v < maxVal) out.push(v);
      }
    }
    return out;
  }

  function uniqSorted(arr) {
    return (arr || []).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; });
  }

  function addEndTicks(minorArr, minVal, maxVal) {
    var a = (minorArr || []).slice();
    if (minVal != null && isFinite(minVal)) a.push(minVal);
    if (maxVal != null && isFinite(maxVal)) a.push(maxVal);
    return uniqSorted(a);
  }

  function isEndTick(val, minVal, maxVal) {
    var span = maxVal - minVal;
    var eps = (isFinite(span) && span !== 0) ? Math.abs(span) * 1e-12 : 1e-12;
    return Math.abs(val - minVal) <= eps || Math.abs(val - maxVal) <= eps;
  }

  // Majors: nice round numbers plus axis endpoints so the scale always has a tick at min and max.
  // Only add min/max when not already within 1% of step of an existing major (avoids dense doubles).
  function axisTicks(minVal, maxVal, nApprox) {
    var majors = niceTicks(minVal, maxVal, nApprox || 4);
    majors = uniqSorted(majors);
    var span = (maxVal - minVal) || 1;
    var step = majors.length >= 2 ? (majors[1] - majors[0]) : span;
    var tol = Math.max(Math.abs(step) * 0.01, 1e-12 * Math.abs(span));
    if (isFinite(minVal) && (majors.length === 0 || (majors[0] - minVal) > tol))
      majors = uniqSorted([minVal].concat(majors));
    if (isFinite(maxVal) && (majors.length === 0 || (maxVal - majors[majors.length - 1]) > tol))
      majors = uniqSorted(majors.concat([maxVal]));
    var minors = minorTicks(minVal, maxVal, majors, 4);
    return { majors: majors, minors: minors };
  }

  function axisTicksLog(minVal, maxVal) {
    if (minVal <= 0 || maxVal <= 0 || !isFinite(minVal) || !isFinite(maxVal)) return { majors: [], minors: [] };
    var majors = [];
    var pMin = Math.floor(Math.log10(minVal));
    var pMax = Math.ceil(Math.log10(maxVal));
    var mults = [1, 2, 5];
    for (var p = pMin; p <= pMax; p++) {
      for (var mi = 0; mi < mults.length; mi++) {
        var v = mults[mi] * Math.pow(10, p);
        if (v >= minVal && v <= maxVal) majors.push(v);
      }
    }
    majors = uniqSorted(majors);
    return { majors: majors, minors: [] };
  }

  function readAxisRange(prefix) {
    var xMinEl = document.getElementById(prefix + '-xmin');
    var xMaxEl = document.getElementById(prefix + '-xmax');
    var yMinEl = document.getElementById(prefix + '-ymin');
    var yMaxEl = document.getElementById(prefix + '-ymax');
    var xMin = (xMinEl && xMinEl.value.trim() !== '') ? parseFloat(xMinEl.value.replace(/,/g, '')) : null;
    var xMax = (xMaxEl && xMaxEl.value.trim() !== '') ? parseFloat(xMaxEl.value.replace(/,/g, '')) : null;
    var yMin = (yMinEl && yMinEl.value.trim() !== '') ? parseFloat(yMinEl.value.replace(/,/g, '')) : null;
    var yMax = (yMaxEl && yMaxEl.value.trim() !== '') ? parseFloat(yMaxEl.value.replace(/,/g, '')) : null;
    var out = { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax };
    var zMinEl = document.getElementById(prefix + '-zmin');
    var zMaxEl = document.getElementById(prefix + '-zmax');
    if (zMinEl && zMaxEl) {
      out.zMin = (zMinEl.value.trim() !== '') ? parseFloat(zMinEl.value.replace(/,/g, '')) : null;
      out.zMax = (zMaxEl.value.trim() !== '') ? parseFloat(zMaxEl.value.replace(/,/g, '')) : null;
    }
    return out;
  }

  function syncAbsorptionDeriveInputRows() {
    var derive = (document.getElementById('abs-derive') && document.getElementById('abs-derive').value) || 'concentration';
    var rd = document.getElementById('abs-row-density');
    var rm = document.getElementById('abs-row-molar-mass');
    var rc = document.getElementById('abs-row-concentration');
    if (rd) rd.style.display = derive === 'density' ? 'none' : '';
    if (rm) rm.style.display = derive === 'molarMass' ? 'none' : '';
    if (rc) rc.style.display = derive === 'concentration' ? 'none' : '';
  }

  function runAbsorption() {
    var resultsContent = document.getElementById('abs-results');
    var plotContainerI = document.getElementById('abs-plot-I');
    var plotContainerNap = document.getElementById('abs-plot-nap');
    var plotContainerDec = document.getElementById('abs-plot-dec');
    if (!resultsContent) return;
    var ABS = window.SCIRESULTS_ABSORPTION;
    var coefType = (document.getElementById('abs-coef-type') && document.getElementById('abs-coef-type').value) || 'linear';
    var thicknessUnit = (document.getElementById('abs-thickness-unit') && document.getElementById('abs-thickness-unit').value) || 'um';
    var derive = (document.getElementById('abs-derive') && document.getElementById('abs-derive').value) || 'concentration';
    syncAbsorptionDeriveInputRows();
    ['abs-density', 'abs-molar-mass', 'abs-concentration'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.disabled = (id === 'abs-density' && derive === 'density') || (id === 'abs-molar-mass' && derive === 'molarMass') || (id === 'abs-concentration' && derive === 'concentration');
    });
    var density = getAbsVal('abs-density');
    var molarMass = getAbsVal('abs-molar-mass');
    var concentration = getAbsVal('abs-concentration');
    if (derive === 'concentration' && density > 0 && molarMass > 0) concentration = density / molarMass;
    else if (derive === 'molarMass' && density > 0 && concentration > 0) molarMass = density / concentration;
    else if (derive === 'density' && molarMass > 0 && concentration > 0) density = concentration * molarMass;
    var params = {
      coefType: coefType,
      coefValue: getAbsVal('abs-coef-value'),
      coefUnit: (document.getElementById('abs-coef-unit') && document.getElementById('abs-coef-unit').value) || 'per_cm',
      thickness: getAbsVal('abs-thickness'),
      thicknessUnit: thicknessUnit,
      density: density,
      molarMass: molarMass,
      concentration: concentration
    };
    var r = ABS.compute(params);
    if (!r.error) {
      var derivedId = derive === 'concentration' ? 'abs-concentration' : derive === 'molarMass' ? 'abs-molar-mass' : 'abs-density';
      var derivedInput = document.getElementById(derivedId);
      if (derivedInput) {
        var val = derive === 'concentration' ? r.c : derive === 'molarMass' ? r.M : r.rho;
        if (val != null && !isNaN(val)) derivedInput.value = formatNumber(val);
      }
    }
    var getAbsRange = function (prefix) {
      prefix = prefix || 'abs';
      var xMin = getAbsVal(prefix + '-x-min'), xMax = getAbsVal(prefix + '-x-max'), yMin = getAbsVal(prefix + '-y-min'), yMax = getAbsVal(prefix + '-y-max');
      var out = {};
      if (!isNaN(xMin) && !isNaN(xMax) && xMax > xMin) { out.xMin = xMin; out.xMax = xMax; }
      if (!isNaN(yMin) && !isNaN(yMax) && yMax > yMin) { out.yMin = yMin; out.yMax = yMax; }
      return Object.keys(out).length ? out : null;
    };
    var lambdaCm = (r.alpha_per_cm != null && !isNaN(r.alpha_per_cm) && r.alpha_per_cm > 0) ? 1 / r.alpha_per_cm : NaN;
    var lambdaDisp = (!isNaN(lambdaCm) && isFinite(lambdaCm)) ? cmToThicknessUnit(lambdaCm, thicknessUnit) : NaN;
    var lambdaUnitLabel = thicknessUnitLabel(thicknessUnit);
    var rows = [
      resultRowValUnit('Intensity ratio (transmitted / incident)', S.symbolHtml('I') + '/' + S.symbolHtml('I0'), r.I_I0, r.I_I0 != null && !isNaN(r.I_I0), ''),
      resultRowValUnit('Napierian absorbance', '−ln(' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ')', r.A_nap, r.A_nap != null && !isNaN(r.A_nap), ''),
      resultRowValUnit('Decadic absorbance', '−log₁₀(' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ')', r.A_dec, r.A_dec != null && !isNaN(r.A_dec), ''),
      resultRowValUnit(S.meaning('alpha'), S.symbolHtml('alpha'), r.alpha_per_cm, r.alpha_per_cm != null && !isNaN(r.alpha_per_cm) && r.alpha_per_cm >= 0, 'cm⁻¹'),
      resultRowValUnit(S.meaning('lambda_mfp'), S.symbolHtml('lambda_mfp'), lambdaDisp, !isNaN(lambdaDisp) && isFinite(lambdaDisp), lambdaUnitLabel),
      resultRowValUnit(S.meaning('a'), S.symbolHtml('a'), r.a_mass, r.a_mass != null && !isNaN(r.a_mass) && r.a_mass >= 0, 'cm²/g'),
      resultRowValUnit(S.meaning('epsilon'), S.symbolHtml('epsilon'), r.epsilon, r.epsilon != null && !isNaN(r.epsilon) && r.epsilon >= 0, 'L/(mol·cm)'),
      resultRowValUnit(S.meaning('sigma'), S.symbolHtml('sigma'), r.sigma_cm2, r.sigma_cm2 != null && !isNaN(r.sigma_cm2) && r.sigma_cm2 >= 0, 'cm²')
    ];
    var formulaHtml = '<p class="tool-formula">' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ' = e<sup>−' + S.symbolHtml('alpha') + S.symbolHtml('L') + '</sup> = e<sup>−' + S.symbolHtml('L') + '/' + S.symbolHtml('lambda_mfp') + '</sup> (Beer–Lambert)</p>' +
      '<p class="tool-formula">' + S.symbolHtml('alpha') + ' = 1/' + S.symbolHtml('lambda_mfp') + ' (mean free path)</p>' +
      '<p class="tool-formula">A<sub>nap</sub> = −ln(' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ') = ' + S.symbolHtml('alpha') + S.symbolHtml('L') + '</p>' +
      '<p class="tool-formula">A<sub>dec</sub> = −log₁₀(' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ')</p>' +
      '<p class="tool-formula">' + S.symbolHtml('alpha') + ' (linear), ' + S.symbolHtml('lambda_mfp') + ' (mean free path), ' + S.symbolHtml('a') + ' (mass), ' + S.symbolHtml('epsilon') + ' (molar); ' + S.symbolHtml('sigma') + ' = ' + S.symbolHtml('alpha') + '/c (cross section)</p>';
    var tableHtml = resultTable(rows);
    var resultsContent = document.getElementById('abs-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
    var L_val = ABS.parseNum(document.getElementById('abs-thickness') && document.getElementById('abs-thickness').value);
    var L_cm_conv = (thicknessUnit === 'cm' ? 1 : thicknessUnit === 'mm' ? 0.1 : thicknessUnit === 'um' || thicknessUnit === 'μm' ? 1e-4 : 1e-7);
    var L_cm = (!isNaN(L_val) && L_val > 0) ? L_val * L_cm_conv : 0.01;
    var alpha = (r && !r.error && r.alpha_per_cm > 0) ? r.alpha_per_cm : 0;
    if (plotContainerI) {
      var rI = getAbsRange('abs') || {};
      rI.xScale = getAxisScaleFromPlotContainer(plotContainerI, 'x');
      rI.yScale = getAxisScaleFromPlotContainer(plotContainerI, 'y');
      drawAbsorptionPlot(plotContainerI, L_cm, alpha, 'I_I0', thicknessUnit, rI);
    }
    if (plotContainerNap) {
      var rNap = getAbsRange('abs-nap') || {};
      rNap.xScale = getAxisScaleFromPlotContainer(plotContainerNap, 'x');
      rNap.yScale = getAxisScaleFromPlotContainer(plotContainerNap, 'y');
      drawAbsorptionPlot(plotContainerNap, L_cm, alpha, 'A_nap', thicknessUnit, rNap);
    }
    if (plotContainerDec) {
      var rDec = getAbsRange('abs-dec') || {};
      rDec.xScale = getAxisScaleFromPlotContainer(plotContainerDec, 'x');
      rDec.yScale = getAxisScaleFromPlotContainer(plotContainerDec, 'y');
      drawAbsorptionPlot(plotContainerDec, L_cm, alpha, 'A_dec', thicknessUnit, rDec);
    }
  }

  function updateAbsorptionUnits() {
    var t = (document.getElementById('abs-coef-type') && document.getElementById('abs-coef-type').value) || 'linear';
    var sel = document.getElementById('abs-coef-unit');
    if (sel) {
      if (t === 'linear') sel.innerHTML = '<option value="per_cm">cm⁻¹</option><option value="per_mm">mm⁻¹</option><option value="per_m">m⁻¹</option>';
      else if (t === 'mfp') sel.innerHTML = '<option value="cm">cm</option><option value="mm">mm</option><option value="um">μm</option><option value="nm" selected>nm</option>';
      else if (t === 'mass') sel.innerHTML = '<option value="cm2/g">cm²/g</option><option value="m2/kg">m²/kg</option>';
      else sel.innerHTML = '<option value="L/(mol·cm)">L/(mol·cm)</option>';
      if (t === 'mfp') sel.value = 'nm';
    }
    var symId = t === 'linear' ? 'alpha' : t === 'mfp' ? 'lambda_mfp' : t === 'mass' ? 'a' : 'epsilon';
    var symEl = document.getElementById('abs-coef-symbol');
    if (symEl) symEl.innerHTML = S.symbolHtml(symId);
    runAbsorption();
  }

  function initAbsorption() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('abs-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Coefficient type', inputChoiceButtonsHtml('abs-coef-type', [
        { value: 'linear', label: 'Linear (' + S.symbolHtml('alpha') + ')' },
        { value: 'mass', label: 'Mass (' + S.symbolHtml('a') + ')' },
        { value: 'molar', label: 'Molar (' + S.symbolHtml('epsilon') + ')' },
        { value: 'mfp', label: 'Mean free path (' + S.symbolHtml('lambda_mfp') + ')' }
      ], 'linear', 'Coefficient type')) +
      inputRow('Coefficient value', '<span id="abs-coef-symbol">' + S.symbolHtml('alpha') + '</span>', '<input type="text" id="abs-coef-value" inputmode="decimal" placeholder="e.g. 10000" value="10000">', '<select id="abs-coef-unit"></select>') +
      inputRow(S.meaning('L'), S.symbolHtml('L'), '<input type="text" id="abs-thickness" inputmode="decimal" placeholder="e.g. 1" value="1">', '<select id="abs-thickness-unit"><option value="cm">cm</option><option value="mm">mm</option><option value="um" selected>μm</option><option value="nm">nm</option></select>') +
      inputChoiceSectionRow('Derive', inputChoiceButtonsHtml('abs-derive', [
        { value: 'concentration', label: 'Concentration (from ρ, M)' },
        { value: 'molarMass', label: 'Molar mass (from ρ, c)' },
        { value: 'density', label: 'Density (from M, c)' }
      ], 'concentration', 'Derive')) +
      inputRow('Density', '', '<input type="text" id="abs-density" inputmode="decimal" placeholder="optional" value="1">', 'g/cm³', 'abs-row-density') +
      inputRow('Molar mass', '', '<input type="text" id="abs-molar-mass" inputmode="decimal" placeholder="optional" value="58.44">', 'g/mol', 'abs-row-molar-mass') +
      inputRow('Concentration', '', '<input type="text" id="abs-concentration" inputmode="decimal" placeholder="optional" value="0.1">', 'mol/L', 'abs-row-concentration') +
      '</tbody></table></div>';
    var absFormulaHtml = '<p class="tool-formula">' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ' = e<sup>−' + S.symbolHtml('alpha') + S.symbolHtml('L') + '</sup> = e<sup>−' + S.symbolHtml('L') + '/' + S.symbolHtml('lambda_mfp') + '</sup> (Beer–Lambert)</p>' +
      '<p class="tool-formula">' + S.symbolHtml('alpha') + ' = 1/' + S.symbolHtml('lambda_mfp') + ' (mean free path)</p>' +
      '<p class="tool-formula">A<sub>nap</sub> = −ln(' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ') = ' + S.symbolHtml('alpha') + S.symbolHtml('L') + '</p>' +
      '<p class="tool-formula">A<sub>dec</sub> = −log₁₀(' + S.symbolHtml('I') + '/' + S.symbolHtml('I0') + ')</p>' +
      '<p class="tool-formula">' + S.symbolHtml('alpha') + ' (linear), ' + S.symbolHtml('lambda_mfp') + ' (mean free path), ' + S.symbolHtml('a') + ' (mass), ' + S.symbolHtml('epsilon') + ' (molar); ' + S.symbolHtml('sigma') + ' = ' + S.symbolHtml('alpha') + '/c (cross section)</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' },
        { view: 'plot-I', label: 'Plot (I/I₀)' },
        { view: 'plot-nap', label: 'Plot (−ln)' },
        { view: 'plot-dec', label: 'Plot (−log)' }
      ],
      resultsId: 'abs-results',
      equationsHtml: absFormulaHtml,
      plotPanes: [
        { dataPlot: 'plot-I', plotId: 'abs-plot-I', controlsPrefix: 'abs', idStyle: 'hyphen', scaleButtons: true },
        { dataPlot: 'plot-nap', plotId: 'abs-plot-nap', controlsPrefix: 'abs-nap', idStyle: 'hyphen', scaleButtons: true },
        { dataPlot: 'plot-dec', plotId: 'abs-plot-dec', controlsPrefix: 'abs-dec', idStyle: 'hyphen', scaleButtons: true }
      ]
    });
    updateAbsorptionUnits();
    bindChoiceButtons('abs-coef-type', updateAbsorptionUnits);
    bindChoiceButtons('abs-derive');
    bindInputsToRun(['abs-coef-value', 'abs-thickness', 'abs-density', 'abs-molar-mass', 'abs-concentration', 'abs-derive', 'abs-x-min', 'abs-x-max', 'abs-y-min', 'abs-y-max', 'abs-nap-x-min', 'abs-nap-x-max', 'abs-nap-y-min', 'abs-nap-y-max', 'abs-dec-x-min', 'abs-dec-x-max', 'abs-dec-y-min', 'abs-dec-y-max', 'plot-aspect-ratio'], runAbsorption);
    bindInputsChange(['abs-coef-unit', 'abs-thickness-unit'], runAbsorption);
    bindScaleButtonsInPanel(runAbsorption);
    bindPlotGridButton(runAbsorption);
    var absReset = document.getElementById('abs-reset-defaults');
    if (absReset) absReset.addEventListener('click', initAbsorption);
  }

  var LP_PLOT_W = SIZE_MED.cw;
  var LP_PLOT_H = SIZE_MED.ch;
  var PART_PLOT_W = SIZE_LARGE.cw;
  var PART_PLOT_H = SIZE_LARGE.ch;

  function getLpVal(id) {
    var el = document.getElementById(id);
    return el ? window.SCIRESULTS_LASER_PULSE.parseNum(el.value) : NaN;
  }

  function runLaserPulse() {
    var LP = window.SCIRESULTS_LASER_PULSE;
    var resultsContent = document.getElementById('lp-results');
    if (!resultsContent) return;
    var spotType = (document.getElementById('lp-spot-type') && document.getElementById('lp-spot-type').value) || 'FWHM';
    var spotX = getLpVal('lp-spot-x');
    var spotY = getLpVal('lp-spot-y');
    var wavelength = getLpVal('lp-wavelength');
    var wavelengthUnit = (document.getElementById('lp-wavelength-unit') && document.getElementById('lp-wavelength-unit').value) || 'nm';
    var duration = getLpVal('lp-duration');
    var durationUnit = (document.getElementById('lp-duration-unit') && document.getElementById('lp-duration-unit').value) || 'fs';
    var energy = getLpVal('lp-energy');
    var energyUnit = (document.getElementById('lp-energy-unit') && document.getElementById('lp-energy-unit').value) || 'uJ';
    var repRate = getLpVal('lp-rep-rate');
    var repRateUnit = (document.getElementById('lp-rep-rate-unit') && document.getElementById('lp-rep-rate-unit').value) || 'kHz';
    var r = LP.compute({
      spotType: spotType,
      spotX_um: spotX,
      spotY_um: spotY,
      wavelength: wavelength,
      wavelengthUnit: wavelengthUnit,
      duration: duration,
      durationUnit: durationUnit,
      energy: energy,
      energyUnit: energyUnit,
      repRate: repRate,
      repRateUnit: repRateUnit
    });
    var bwVal = r.bandwidthMin_Hz != null && !isNaN(r.bandwidthMin_Hz) ? (r.bandwidthMin_Hz >= 1e12 ? r.bandwidthMin_Hz / 1e12 : r.bandwidthMin_Hz) : null;
    var bwOk = bwVal != null && isFinite(bwVal);
    var bwUnit = r.bandwidthMin_Hz >= 1e12 ? 'THz' : 'Hz';
    var durVal = r.duration_FWHM_s != null && !isNaN(r.duration_FWHM_s) ? r.duration_FWHM_s * 1e15 : null;
    var rows = [
      resultRowValUnit('Spot 1/e² diameter, X', S.symbolHtml('x'), r.spotX_1e2_um * 2, r.spotX_1e2_um != null && isFinite(r.spotX_1e2_um), 'μm'),
      resultRowValUnit('Spot 1/e² diameter, Y', S.symbolHtml('y'), r.spotY_1e2_um * 2, r.spotY_1e2_um != null && isFinite(r.spotY_1e2_um), 'μm'),
      resultRowValUnit('Spot FWHM, X', S.symbolHtml('FWHM'), r.spotX_FWHM_um, r.spotX_FWHM_um != null && isFinite(r.spotX_FWHM_um), 'μm'),
      resultRowValUnit('Spot FWHM, Y', S.symbolHtml('FWHM'), r.spotY_FWHM_um, r.spotY_FWHM_um != null && isFinite(r.spotY_FWHM_um), 'μm'),
      resultRowValUnit(S.meaning('lambda'), S.symbolHtml('lambda'), r.wavelength_nm, r.wavelength_nm != null && isFinite(r.wavelength_nm), 'nm'),
      resultRowValUnit('Photon energy', S.symbolHtml('E'), r.wavelength_eV, r.wavelength_eV != null && isFinite(r.wavelength_eV), 'eV'),
      resultRowValUnit('Duration (FWHM)', S.symbolHtml('tau'), durVal, durVal != null && isFinite(durVal), 'fs'),
      resultRowValUnit('Peak intensity', S.symbolHtml('I'), r.peakIntensity_Wm2, r.peakIntensity_Wm2 != null && isFinite(r.peakIntensity_Wm2), 'W/m²'),
      resultRowValUnit('', '', r.peakIntensity_Wcm2, r.peakIntensity_Wcm2 != null && isFinite(r.peakIntensity_Wcm2), 'W/cm²'),
      resultRowValUnit('Peak electric field', S.symbolHtml('E_f'), r.peakEfield_Vm, r.peakEfield_Vm != null && isFinite(r.peakEfield_Vm), 'V/m'),
      resultRowValUnit('Peak magnetic field', S.symbolHtml('B'), r.peakBfield_T, r.peakBfield_T != null && isFinite(r.peakBfield_T), 'T'),
      resultRowValUnit('Area (1/e²)', '', r.area_1e2_um2, r.area_1e2_um2 != null && isFinite(r.area_1e2_um2), 'μm²'),
      resultRowValUnit('Area (FWHM)', S.symbolHtml('FWHM'), r.area_FWHM_um2, r.area_FWHM_um2 != null && isFinite(r.area_FWHM_um2), 'μm²'),
      resultRowValUnit('Min. bandwidth', '', bwVal, bwOk, bwUnit),
      resultRowValUnit('', S.symbolHtml('lambda'), r.bandwidthMin_nm, r.bandwidthMin_nm != null && isFinite(r.bandwidthMin_nm), 'nm'),
      resultRowValUnit('', S.symbolHtml('E'), r.bandwidthMin_eV, r.bandwidthMin_eV != null && isFinite(r.bandwidthMin_eV), 'eV'),
      resultRowValUnit(S.meaning('F'), S.symbolHtml('F'), r.fluence_Jm2, r.fluence_Jm2 != null && isFinite(r.fluence_Jm2), 'J/m²'),
      resultRowValUnit('Photons per pulse', S.symbolHtml('N'), r.photonsPerPulse, r.photonsPerPulse != null && isFinite(r.photonsPerPulse), ''),
      resultRowValUnit('Photons per second', '', r.photonsPerSec, r.photonsPerSec != null && isFinite(r.photonsPerSec), ''),
      resultRowValUnit(S.meaning('P_w'), S.symbolHtml('P_w'), r.power_W, r.power_W != null && isFinite(r.power_W), 'W')
    ];
    var formulaHtml =
      '<p class="tool-formula">I = P / A (peak intensity)</p>' +
      '<p class="tool-formula">F = E / A (fluence)</p>' +
      '<p class="tool-formula">N<sub>photons</sub> = E / (hν) = E' + S.symbolHtml('lambda') + ' / (hc)</p>' +
      '<p class="tool-formula">Gaussian beam: inputs are spot diameters; internal calculations use the 1/e² radius w, with FWHM diameter D related by D = w' + sqrtHtml('2 ln 2') + '.</p>' +
      '<p class="tool-formula">Δν · ' + S.symbolHtml('tau') + ' ≥ 0.44 (transform limit, Gaussian)</p>';
    var tableHtml = resultTable(rows);
    var resultsContent = document.getElementById('lp-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml;
    var plotSliceX = document.getElementById('lp-plot-slice-x');
    var plotSliceY = document.getElementById('lp-plot-slice-y');
    var plotTime = document.getElementById('lp-plot-time');
    var plot2D = document.getElementById('lp-plot-2d');
    if (plot2D) drawLaserPulse2D(plot2D, r, 'lp2d');
    if (plotTime) drawLaserPulseTime(plotTime, r, 'lptime');
    if (plotSliceX) drawLaserPulse1D(plotSliceX, r, 'sliceX', 'lpsliceX');
    if (plotSliceY) drawLaserPulse1D(plotSliceY, r, 'sliceY', 'lpsliceY');
  }

  function drawLaserPulse1D(container, r, type, rangePrefix) {
    var LP = window.SCIRESULTS_LASER_PULSE;
    var wx = r.spotX_1e2_um;
    var wy = r.spotY_1e2_um;
    var I0_Wcm2 = (r.peakIntensity_Wcm2 != null && isFinite(r.peakIntensity_Wcm2)) ? r.peakIntensity_Wcm2 : (r.peakIntensity_Wm2 != null && isFinite(r.peakIntensity_Wm2) ? r.peakIntensity_Wm2 / 1e4 : 0);
    var w = type === 'sliceX' ? wx : wy;
    var hasData = w > 0 && isFinite(w);
    var n = 100;
    var naturalExtent = hasData ? w * 2.5 : 10;
    var title = type === 'sliceX' ? '1D slice X' : '1D slice Y';
    var rr = readAxisRange(rangePrefix || 'lp-plot');
    var xMin = -naturalExtent, xMax = naturalExtent;
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) { xMin = rr.xMin; xMax = rr.xMax; }
    var points = [];
    if (hasData) {
      for (var i = 0; i <= n; i++) {
        var u = xMin + (xMax - xMin) * i / n;
        var val = type === 'sliceX' ? LP.intensityProfile(Math.abs(u), wx, I0_Wcm2) : LP.intensityProfile(Math.abs(u), wy, I0_Wcm2);
        points.push({ x: u, I: val });
      }
    }
    var IMax = hasData && points.length ? Math.max.apply(null, points.map(function (p) { return p.I; })) : 1;
    if (IMax <= 0) IMax = 1;
    var yMin = 0, yMax = IMax;
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) { yMin = rr.yMin; yMax = rr.yMax; }
    else if (rr.yMin != null && isFinite(rr.yMin)) yMin = rr.yMin;
    else if (rr.yMax != null && isFinite(rr.yMax)) yMax = rr.yMax;
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(0.1, xMax / 1000) || 0.1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    var fwhmRadius = hasData ? w * Math.sqrt(Math.LN2 / 2) : 0;
    var I_1e2 = hasData ? I0_Wcm2 * Math.exp(-2) : 0;
    var I_hm = IMax / 2;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('x') + ' (μm)', yLabel: S.symbol('I') + ' (W/cm²)', title: title,
      canvasClass: 'laser-plot',
      formatXTick: function (v) { return String(Math.round(v * 10) / 10); },
      drawData: function (ctx, h) {
        var toGX = h.toGX, toGY = h.toGY, pad = h.pad, ww = h.w, h_ = h.h, ch = h.ch;
        if (hasData && points.length) {
          ctx.strokeStyle = PLOT_ACCENT;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          var first = true;
          for (var i = 0; i < points.length; i++) {
            var gx = toGX(points[i].x);
            var gy = toGY(points[i].I);
            if (gx != null && gy != null) {
              if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
            } else { first = true; }
          }
          ctx.stroke();
          var gy_1e2 = toGY(I_1e2);
          var gy_hm = toGY(I_hm);
          var plotBottom = ch - pad.B;
          var clipY = function (gy) { return Math.max(pad.T, Math.min(gy != null ? gy : plotBottom, plotBottom)); };
          ctx.lineWidth = 1;
          [w, -w].forEach(function (xVal) {
            var gx = toGX(xVal);
            if (gx != null && gx >= pad.L && gx <= pad.L + ww) {
              ctx.strokeStyle = PLOT_FG;
              ctx.setLineDash([]);
              ctx.beginPath();
              ctx.moveTo(gx, plotBottom);
              ctx.lineTo(gx, clipY(gy_1e2));
              ctx.stroke();
            }
          });
          [fwhmRadius, -fwhmRadius].forEach(function (xVal) {
            var gx = toGX(xVal);
            if (gx != null && gx >= pad.L && gx <= pad.L + ww) {
              ctx.strokeStyle = PLOT_GUIDE_LINE;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.moveTo(gx, plotBottom);
              ctx.lineTo(gx, clipY(gy_hm));
              ctx.stroke();
            }
          });
          ctx.setLineDash([]);
        }
      },
      afterClip: function (ctx, h) {
        if (!hasData) {
          ctx.fillStyle = PLOT_MUTED_FILL;
          ctx.font = FONT_TICK;
          ctx.textAlign = 'center';
          ctx.fillText('No data', h.pad.L + h.w / 2, h.pad.T + h.h / 2);
          return;
        }
        var legX = h.pad.L + h.w - 72;
        var legY = h.pad.T + 10;
        ctx.font = FONT_SMALL;
        ctx.textAlign = 'left';
        ctx.strokeStyle = PLOT_FG;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(legX, legY);
        ctx.lineTo(legX + 18, legY);
        ctx.stroke();
        ctx.fillStyle = PLOT_FG;
        ctx.fillText('1/e²', legX + 22, legY + 4);
        legY += 14;
        ctx.strokeStyle = PLOT_GUIDE_LINE;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(legX, legY);
        ctx.lineTo(legX + 18, legY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(S.symbol('FWHM'), legX + 22, legY + 4);
      }
    });
  }

  function drawLaserPulse2D(container, r, rangePrefix) {
    var wx = r.spotX_1e2_um;
    var wy = r.spotY_1e2_um;
    var I0_Wm2 = r.peakIntensity_Wm2;
    var I0_Wcm2 = (r.peakIntensity_Wcm2 != null && isFinite(r.peakIntensity_Wcm2)) ? r.peakIntensity_Wcm2 : (I0_Wm2 != null && isFinite(I0_Wm2) ? I0_Wm2 / 1e4 : 0);
    var hasData = wx > 0 && wy > 0 && isFinite(I0_Wm2) && I0_Wm2 > 0;
    var naturalExtent = hasData ? Math.max(wx, wy) * 2.5 : 10;
    var rr = readAxisRange(rangePrefix || 'lp-plot');
    var xMin = -naturalExtent, xMax = naturalExtent;
    var yMin = -naturalExtent, yMax = naturalExtent;
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) {
      xMin = rr.xMin;
      xMax = rr.xMax;
    }
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) {
      yMin = rr.yMin;
      yMax = rr.yMax;
    }
    var barW = 18;
    var barLabelW = 48;
    var pad = { L: PAD_SMALL.L, R: barW + barLabelW + 10, T: 36, B: 48 };
    var size = getPlotSize(container, PLOT_SLOT.cw, PLOT_SLOT.ch);
    var cw = size.cw;
    var ch = size.ch;
    var d = Math.min(cw - pad.L - pad.R, ch - pad.T - pad.B);
    d = Math.max(d, 200);
    var canvas = document.createElement('canvas');
    canvas.className = 'laser-plot';
    var ctx = setupHiDPICanvas(canvas, cw, ch);
    var dpr = ctx.__dpr || 1;
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    if (hasData) {
      var rgb = hexToRgb(PLOT_ACCENT);
      var dd = Math.max(1, Math.round(d * dpr));
      var imgData = ctx.createImageData(dd, dd);
      var data = imgData.data;
      for (var py = 0; py < dd; py++) {
        for (var px = 0; px < dd; px++) {
          var x_um = xMin + (xMax - xMin) * (px / (dd - 1 || 1));
          var y_um = yMin + (yMax - yMin) * (py / (dd - 1 || 1));
          var r2 = (x_um * x_um) / (wx * wx) + (y_um * y_um) / (wy * wy);
          var I = I0_Wm2 * Math.exp(-2 * r2);
          var frac = I0_Wm2 > 0 ? Math.sqrt(I / I0_Wm2) : 0;
          frac = Math.min(1, frac);
          var i = (py * dd + px) * 4;
          data[i] = Math.round(rgb.r * frac);
          data[i + 1] = Math.round(rgb.g * frac);
          data[i + 2] = Math.round(rgb.b * frac);
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imgData, Math.round(pad.L * dpr), Math.round(pad.T * dpr));
    }
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad.L, pad.T, d, d);
    var barX = pad.L + d + 8;
    var barH = d;
    var grad = ctx.createLinearGradient(barX, pad.T + barH, barX, pad.T);
    grad.addColorStop(0, PLOT_BG);
    grad.addColorStop(1, PLOT_ACCENT);
    ctx.fillStyle = grad;
    ctx.fillRect(barX, pad.T, barW, barH);
    ctx.strokeStyle = PLOT_FG;
    ctx.strokeRect(barX, pad.T, barW, barH);
    var cbarMax = hasData ? I0_Wcm2 : 1;
    var cbarTicks = niceTicks(0, cbarMax, 4);
    if (cbarTicks.indexOf(0) === -1) cbarTicks.unshift(0);
    if (cbarTicks.indexOf(cbarMax) === -1) cbarTicks.push(cbarMax);
    cbarTicks.sort(function (a, b) { return a - b; });
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'left';
    ctx.fillText('W/cm²', barX + barW + 4, pad.T - 14);
    ctx.font = FONT_SMALL;
    cbarTicks.forEach(function (val) {
      var frac = cbarMax > 0 ? val / cbarMax : 0;
      var by = pad.T + barH * (1 - frac);
      ctx.beginPath();
      ctx.moveTo(barX, by);
      ctx.lineTo(barX + barW, by);
      ctx.stroke();
      ctx.fillText(formatPlotNum(val), barX + barW + 4, by + 4);
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('2D beam profile (intensity)', pad.L + d / 2, pad.T - 16);
    var xt = axisTicks(xMin, xMax, 4);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    if (plotGridVisible) {
      ctx.strokeStyle = 'rgba(128,128,128,0.12)';
      ctx.lineWidth = 1;
      xTicks.forEach(function (xVal) {
        var t = (xVal - xMin) / (xMax - xMin || 1);
        if (t >= -1e-6 && t <= 1 + 1e-6) {
          var gx = pad.L + t * d;
          ctx.beginPath();
          ctx.moveTo(gx, pad.T);
          ctx.lineTo(gx, pad.T + d);
          ctx.stroke();
        }
      });
      yTicks.forEach(function (yVal) {
        var t = (yVal - yMin) / (yMax - yMin || 1);
        if (t >= -1e-6 && t <= 1 + 1e-6) {
          var gy = pad.T + d - t * d;
          ctx.beginPath();
          ctx.moveTo(pad.L, gy);
          ctx.lineTo(pad.L + d, gy);
          ctx.stroke();
        }
      });
    }
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    var xAxisY = pad.T + d;
    var xTickLabelY = xAxisY + 18;
    var xLabelY = xAxisY + 32;
    var tTol = 1e-6;
    if (!hasData) {
      ctx.fillStyle = PLOT_MUTED_FILL;
      ctx.font = FONT_TICK;
      ctx.textAlign = 'center';
      ctx.fillText('No data', pad.L + d / 2, pad.T + d / 2);
      ctx.fillStyle = PLOT_FG;
    }
    xMinors.forEach(function (xVal) {
      var t = (xVal - xMin) / (xMax - xMin || 1);
      if (t >= -tTol && t <= 1 + tTol) {
        var gx = pad.L + t * d;
        ctx.beginPath();
        ctx.moveTo(gx, xAxisY);
        ctx.lineTo(gx, xAxisY + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var t = (yVal - yMin) / (yMax - yMin || 1);
      if (t >= -tTol && t <= 1 + tTol) {
        var gy = pad.T + (1 - t) * d;
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_SMALL;
    ctx.fillStyle = PLOT_FG;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var t = (xVal - xMin) / (xMax - xMin || 1);
      if (t >= -tTol && t <= 1 + tTol) {
        var gx = pad.L + t * d;
        ctx.beginPath();
        ctx.moveTo(gx, xAxisY);
        ctx.lineTo(gx, xAxisY + 6);
        ctx.stroke();
        ctx.fillText(String(Math.round(xVal * 10) / 10), gx, xTickLabelY);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var t = (yVal - yMin) / (yMax - yMin || 1);
      if (t >= -tTol && t <= 1 + tTol) {
        var gy = pad.T + (1 - t) * d;
        ctx.beginPath();
        ctx.moveTo(pad.L - 8, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(String(Math.round(yVal * 10) / 10), pad.L - 10, gy + 4);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText(S.symbol('x') + ' (μm)', pad.L + d / 2, xLabelY);
    ctx.save();
    ctx.translate(52, pad.T + d / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(S.symbol('y') + ' (μm)', 0, 0);
    ctx.restore();
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function drawLaserPulseTime(container, r, rangePrefix) {
    var I0_Wcm2 = (r.peakIntensity_Wcm2 != null && isFinite(r.peakIntensity_Wcm2)) ? r.peakIntensity_Wcm2 : (r.peakIntensity_Wm2 != null && isFinite(r.peakIntensity_Wm2) ? r.peakIntensity_Wm2 / 1e4 : 0);
    var tau_FWHM_s = r.duration_FWHM_s;
    var hasData = tau_FWHM_s && tau_FWHM_s > 0 && isFinite(I0_Wcm2) && I0_Wcm2 > 0;
    var tau_1e2_s = hasData ? tau_FWHM_s / Math.sqrt(2 * Math.LN2) : 1e-15;
    var tau_fs = tau_1e2_s * 1e15;
    var naturalExtent = hasData ? tau_fs * 2.5 : 50;
    var n = 100;
    var rr = readAxisRange(rangePrefix || 'lp-plot');
    var xMin = -naturalExtent, xMax = naturalExtent;
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) { xMin = rr.xMin; xMax = rr.xMax; }
    var points = [];
    if (hasData) {
      for (var i = 0; i <= n; i++) {
        var t_fs = xMin + (xMax - xMin) * i / n;
        var t_s = t_fs * 1e-15;
        var val = I0_Wcm2 * Math.exp(-2 * (t_s * t_s) / (tau_1e2_s * tau_1e2_s));
        points.push({ t: t_fs, I: val });
      }
    }
    var IMax = hasData && points.length ? Math.max.apply(null, points.map(function (p) { return p.I; })) : 1;
    if (IMax <= 0) IMax = 1;
    var yMin = 0, yMax = IMax;
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) { yMin = rr.yMin; yMax = rr.yMax; }
    else if (rr.yMin != null && isFinite(rr.yMin)) yMin = rr.yMin;
    else if (rr.yMax != null && isFinite(rr.yMax)) yMax = rr.yMax;
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(0.1, xMax / 1000) || 0.1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    var fwhmHalf_fs = hasData ? (tau_FWHM_s * 1e15) / 2 : 0;
    var I_1e2 = hasData ? I0_Wcm2 * Math.exp(-2) : 0;
    var I_hm = IMax / 2;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('t') + ' (fs)', yLabel: S.symbol('I') + ' (W/cm²)', title: 'Pulse (time)',
      canvasClass: 'laser-plot',
      formatXTick: function (v) { return String(Math.round(v * 10) / 10); },
      drawData: function (ctx, h) {
        var toGX = h.toGX, toGY = h.toGY, pad = h.pad, ww = h.w, ch = h.ch;
        if (hasData && points.length) {
          ctx.strokeStyle = PLOT_ACCENT;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          var first = true;
          for (var i = 0; i < points.length; i++) {
            var gx = toGX(points[i].t);
            var gy = toGY(points[i].I);
            if (gx != null && gy != null) {
              if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
            } else { first = true; }
          }
          ctx.stroke();
          var gy_1e2 = toGY(I_1e2);
          var gy_hm = toGY(I_hm);
          var plotBottom = ch - pad.B;
          var clipYT = function (gy) { return Math.max(pad.T, Math.min(gy != null ? gy : plotBottom, plotBottom)); };
          ctx.lineWidth = 1;
          [tau_fs, -tau_fs].forEach(function (tVal) {
            var gx = toGX(tVal);
            if (gx != null && gx >= pad.L && gx <= pad.L + ww) {
              ctx.strokeStyle = PLOT_FG;
              ctx.setLineDash([]);
              ctx.beginPath();
              ctx.moveTo(gx, plotBottom);
              ctx.lineTo(gx, clipYT(gy_1e2));
              ctx.stroke();
            }
          });
          [fwhmHalf_fs, -fwhmHalf_fs].forEach(function (tVal) {
            var gx = toGX(tVal);
            if (gx != null && gx >= pad.L && gx <= pad.L + ww) {
              ctx.strokeStyle = PLOT_GUIDE_LINE;
              ctx.setLineDash([4, 3]);
              ctx.beginPath();
              ctx.moveTo(gx, plotBottom);
              ctx.lineTo(gx, clipYT(gy_hm));
              ctx.stroke();
            }
          });
          ctx.setLineDash([]);
        }
      },
      afterClip: function (ctx, h) {
        if (!hasData) {
          ctx.fillStyle = PLOT_MUTED_FILL;
          ctx.font = FONT_TICK;
          ctx.textAlign = 'center';
          ctx.fillText('No data', h.pad.L + h.w / 2, h.pad.T + h.h / 2);
          return;
        }
        var legX = h.pad.L + h.w - 72;
        var legY = h.pad.T + 10;
        ctx.font = FONT_SMALL;
        ctx.textAlign = 'left';
        ctx.strokeStyle = PLOT_FG;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(legX, legY);
        ctx.lineTo(legX + 18, legY);
        ctx.stroke();
        ctx.fillStyle = PLOT_FG;
        ctx.fillText('1/e²', legX + 22, legY + 4);
        legY += 14;
        ctx.strokeStyle = PLOT_GUIDE_LINE;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(legX, legY);
        ctx.lineTo(legX + 18, legY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillText(S.symbol('FWHM'), legX + 22, legY + 4);
      }
    });
  }

  function runParticle() {
    var PART = window.SCIRESO_PARTICLE;
    if (!PART) return;
    var resultsContent = document.getElementById('part-results');
    var plotContainer = document.getElementById('part-plot');
    if (!resultsContent) return;
    var particleId = document.getElementById('part-type') && document.getElementById('part-type').value;
    var massInput = document.getElementById('part-mass');
    var chargeInput = document.getElementById('part-charge');
    var keInput = document.getElementById('part-ke');
    var fieldTypeEl = document.getElementById('part-field-type');
    var fieldValEl = document.getElementById('part-field-val');
    var mass_u = NaN;
    var charge_e = NaN;
    if (particleId === 'custom') {
      mass_u = PART.parseNum(massInput && massInput.value);
      charge_e = PART.parseNum(chargeInput && chargeInput.value);
    } else {
      var sel = PART.COMMON_PARTICLES.filter(function (p) { return p.id === particleId; })[0];
      if (sel) {
        mass_u = sel.mass_u;
        charge_e = sel.charge_e;
      }
    }
    var Ek_eV = PART.parseNum(keInput && keInput.value);
    var fieldType = fieldTypeEl && fieldTypeEl.value;
    var fieldVal = PART.parseNum(fieldValEl && fieldValEl.value);
    var r = PART.compute({ mass_u: mass_u, charge_e: charge_e, kineticEnergy_eV: Ek_eV });
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var radiusB = (fieldType === 'B' && isFinite(fieldVal) && fieldVal !== 0 && r.charge_C && r.mass_kg && r.velocityRelativistic_ms) ? (r.mass_kg * r.velocityRelativistic_ms) / (Math.abs(r.charge_C) * fieldVal) : NaN;
    var accelE = (fieldType === 'E' && isFinite(fieldVal) && fieldVal !== 0 && r.charge_C != null && r.mass_kg) ? (Math.abs(r.charge_C) * fieldVal) / r.mass_kg : NaN;
    var dBval = r.deBroglieWavelength_m != null && isFinite(r.deBroglieWavelength_m) ? (r.deBroglieWavelength_m < 1e-6 ? r.deBroglieWavelength_m * 1e9 : r.deBroglieWavelength_m) : null;
    var dBunit = (r.deBroglieWavelength_m != null && r.deBroglieWavelength_m < 1e-6) ? 'nm' : 'm';
    var vClassC = r.velocityClassical_ms != null && isFinite(r.velocityClassical_ms) ? r.velocityClassical_ms / 2.99792458e8 : null;
    var vRelC = r.velocityRelativistic_ms != null && isFinite(r.velocityRelativistic_ms) ? r.velocityRelativistic_ms / 2.99792458e8 : null;
    var rows = [
      resultRowValUnit(S.meaning('m'), S.symbolHtml('m'), r.mass_u, r.mass_u != null && isFinite(r.mass_u), 'u'),
      resultRowValUnit(S.meaning('q'), S.symbolHtml('q'), r.charge_e, r.charge_e != null && isFinite(r.charge_e), 'e'),
      resultRowValUnit(S.meaning('E_k'), S.symbolHtml('E_k'), r.kineticEnergy_eV, r.kineticEnergy_eV != null && isFinite(r.kineticEnergy_eV), 'eV'),
      resultRowValUnit('Total energy', S.symbolHtml('E'), r.totalEnergy_eV, r.totalEnergy_eV != null && isFinite(r.totalEnergy_eV), 'eV'),
      resultRowValUnit('Rest energy', S.symbolHtml('E'), r.restEnergy_eV, r.restEnergy_eV != null && isFinite(r.restEnergy_eV), 'eV'),
      resultRowValUnit('Relativistic mass', S.symbolHtml('m'), r.relativisticMass_kg, r.relativisticMass_kg != null && isFinite(r.relativisticMass_kg), 'kg'),
      resultRowValUnit('Velocity (classical)', S.symbolHtml('v'), r.velocityClassical_ms, r.velocityClassical_ms != null && isFinite(r.velocityClassical_ms), 'm/s'),
      resultRowValUnit('', '', vClassC, vClassC != null, 'c'),
      resultRowValUnit('Velocity (relativistic)', S.symbolHtml('v'), r.velocityRelativistic_ms, r.velocityRelativistic_ms != null && isFinite(r.velocityRelativistic_ms), 'm/s'),
      resultRowValUnit('', '', vRelC, vRelC != null, 'c'),
      resultRowValUnit(S.meaning('p') + ' (classical)', S.symbolHtml('p'), r.momentumClassical_kgms, r.momentumClassical_kgms != null && isFinite(r.momentumClassical_kgms), 'kg·m/s'),
      resultRowValUnit(S.meaning('p') + ' (relativistic)', S.symbolHtml('p'), r.momentumRelativistic_kgms, r.momentumRelativistic_kgms != null && isFinite(r.momentumRelativistic_kgms), 'kg·m/s'),
      resultRowValUnit(S.meaning('lambda_dB'), S.symbolHtml('lambda_dB'), dBval, dBval != null, dBunit),
      resultRowValUnit(S.meaning('gamma'), S.symbolHtml('gamma'), r.lorentzFactor, r.lorentzFactor != null && isFinite(r.lorentzFactor), '')
    ];
    if (isFinite(radiusB)) rows.push(resultRowValUnit('Trajectory radius (in B-field)', S.symbolHtml('x'), radiusB, true, 'm'));
    if (isFinite(accelE)) rows.push(resultRowValUnit('Acceleration (in E-field)', '', accelE, true, 'm/s²'));
    var formulaHtml = '<p class="tool-formula">' + S.symbolHtml('E') + ' = ' + S.symbolHtml('gamma') + 'm' + S.symbolHtml('m') + 'c², ' + S.symbolHtml('gamma') + ' = 1/√(1 − ' + S.symbolHtml('v') + '²/c²)</p><p class="tool-formula">' + S.symbolHtml('p') + ' = ' + S.symbolHtml('gamma') + 'm' + S.symbolHtml('v') + '</p><p class="tool-formula">' + S.symbolHtml('lambda_dB') + ' = h / ' + S.symbolHtml('p') + ' (De Broglie)</p><p class="tool-formula">In ' + S.symbolHtml('B') + '-field: r = ' + S.symbolHtml('p') + '/(' + S.symbolHtml('q') + S.symbolHtml('B') + '); in ' + S.symbolHtml('E_f') + '-field: parabolic trajectory</p>';
    var tableHtml = resultTable(rows);
    var resultsContent = document.getElementById('part-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml;
    if (plotContainer) {
      if (!r.error && fieldType === 'B' && isFinite(fieldVal) && fieldVal !== 0) {
        drawParticleTrajectory(plotContainer, PART, { mass_u: mass_u, charge_e: charge_e, kineticEnergy_eV: Ek_eV, fieldType: 'B', B_T: fieldVal });
      } else if (!r.error && fieldType === 'E' && isFinite(fieldVal) && fieldVal !== 0) {
        drawParticleTrajectory(plotContainer, PART, { mass_u: mass_u, charge_e: charge_e, kineticEnergy_eV: Ek_eV, fieldType: 'E', E_Vm: fieldVal });
      } else {
        drawParticleTrajectory(plotContainer, PART, null);
      }
    }
  }

  function drawParticleTrajectory(container, PART, params) {
    var size = getPlotSize(container, PLOT_SLOT.cw, PLOT_SLOT.ch);
    var pts = (params && PART && PART.trajectory) ? PART.trajectory(params) : null;
    var hasData = pts && pts.length >= 2;
    var xLo, xHi, yLo, yHi;
    if (hasData) {
      var xMin = pts[0].x, xMax = pts[0].x, yMin = pts[0].y, yMax = pts[0].y;
      pts.forEach(function (p) {
        if (p.x < xMin) xMin = p.x;
        if (p.x > xMax) xMax = p.x;
        if (p.y < yMin) yMin = p.y;
        if (p.y > yMax) yMax = p.y;
      });
      var rangeX = xMax - xMin;
      var rangeY = yMax - yMin;
      var margin = 0.06;
      xLo = xMin - margin * (rangeX || Math.abs(xMin) || 1e-20);
      xHi = xMax + margin * (rangeX || Math.abs(xMax) || 1e-20);
      yLo = yMin - margin * (rangeY || Math.abs(yMin) || 1e-20);
      yHi = yMax + margin * (rangeY || Math.abs(yMax) || 1e-20);
      if (xHi <= xLo) { xLo = xMin - 1e-20; xHi = xMax + 1e-20; }
      if (yHi <= yLo) { yLo = yMin - 1e-20; yHi = yMax + 1e-20; }
    } else {
      xLo = 0; xHi = 1; yLo = 0; yHi = 1;
    }
    var rr = readAxisRange('part-plot');
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) { xLo = rr.xMin; xHi = rr.xMax; }
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) { yLo = rr.yMin; yHi = rr.yMax; }
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xLo <= 0) xLo = Math.min(1e-20, xHi / 1000) || 1e-20;
    if (yScale === 'log' && yLo <= 0) yLo = Math.min(1e-20, yHi / 1000) || 1e-20;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xLo, plotXMax: xHi, plotYMin: yLo, plotYMax: yHi,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('x') + ' (m)', yLabel: S.symbol('y') + ' (m)', title: hasData ? 'Trajectory' : 'Trajectory (enter field value)',
      canvasClass: 'laser-plot',
      drawData: function (ctx, h) {
        if (!hasData || !pts || pts.length < 2) return;
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var first = true;
        for (var i = 0; i < pts.length; i++) {
          var gx = toGX(pts[i].x);
          var gy = toGY(pts[i].y);
          if (gx != null && gy != null) {
            if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
          } else { first = true; }
        }
        ctx.stroke();
      },
      afterClip: function (ctx, h) {
        if (hasData) return;
        ctx.fillStyle = PLOT_MUTED;
        ctx.font = FONT_TITLE;
        ctx.textAlign = 'center';
        ctx.fillText('Trajectory (enter field value)', h.pad.L + h.w / 2, h.pad.T + h.h / 2);
      }
    });
  }

  function initParticle() {
    var PART = window.SCIRESO_PARTICLE;
    if (!PART) return;
    var partChoices = PART.COMMON_PARTICLES.map(function (p) {
      return { value: p.id, label: p.label };
    });
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('part-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Particle', inputChoiceButtonsHtml('part-type', partChoices, partChoices[0] && partChoices[0].value, 'Particle')) +
      '<tr id="part-custom-wrap" style="display:none"><td class="input-desc">' + S.meaning('m') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('m') + '</td><td class="input-val"><input type="text" id="part-mass" inputmode="decimal" placeholder="e.g. 1" value="1"></td><td class="input-unit">u</td></tr>' +
      '<tr id="part-charge-row" style="display:none"><td class="input-desc">' + S.meaning('q') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('q') + '</td><td class="input-val"><input type="text" id="part-charge" inputmode="decimal" placeholder="e.g. 1" value="1"></td><td class="input-unit">e</td></tr>' +
      inputRow(S.meaning('E_k'), S.symbolHtml('E_k'), '<input type="text" id="part-ke" inputmode="decimal" placeholder="e.g. 1000" value="1000">', 'eV') +
      inputChoiceSectionRow('Field', inputChoiceButtonsHtml('part-field-type', [
        { value: 'B', label: 'B (magnetic)' },
        { value: 'E', label: 'E (electric)' }
      ], 'B', 'Field')) +
      inputRow('Field value', '<span id="part-field-symbol">' + S.symbolHtml('B') + '</span>', '<input type="text" id="part-field-val" inputmode="decimal" placeholder="B in T or E in V/m" value="1">', 'T / V/m') +
      '</tbody></table></div>';
    var partFormulaHtml = '<p class="tool-formula">' + S.symbolHtml('E') + ' = ' + S.symbolHtml('gamma') + 'm' + S.symbolHtml('m') + 'c²</p><p class="tool-formula">' + S.symbolHtml('p') + ' = ' + S.symbolHtml('gamma') + 'm' + S.symbolHtml('v') + '</p><p class="tool-formula">' + S.symbolHtml('lambda_dB') + ' = h / ' + S.symbolHtml('p') + ' (De Broglie)</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }, { view: 'plot', label: 'Plot (traj)' }],
      resultsId: 'part-results',
      equationsHtml: partFormulaHtml,
      plotPanes: [{ dataPlot: 'plot', plotId: 'part-plot', controlsPrefix: 'part-plot', scaleButtons: true }]
    });
    runParticle();
    bindChoiceButtons('part-type', function (v) {
      var isCustom = v === 'custom';
      var wrap = document.getElementById('part-custom-wrap');
      var chargeRow = document.getElementById('part-charge-row');
      if (wrap) wrap.style.display = isCustom ? '' : 'none';
      if (chargeRow) chargeRow.style.display = isCustom ? '' : 'none';
      runParticle();
    });
    bindChoiceButtons('part-field-type', function (v) {
      var symEl = document.getElementById('part-field-symbol');
      if (symEl) symEl.innerHTML = v === 'E' ? S.symbolHtml('E_f') : S.symbolHtml('B');
    });
    bindInputsToRun(['part-mass', 'part-charge', 'part-ke', 'part-field-type', 'part-field-val', 'part-plot-xmin', 'part-plot-xmax', 'part-plot-ymin', 'part-plot-ymax', 'plot-aspect-ratio'], runParticle);
    bindScaleButtonsInPanel(runParticle);
    bindPlotGridButton(runParticle);
    var partReset = document.getElementById('part-reset-defaults');
    if (partReset) partReset.addEventListener('click', initParticle);
  }

  function runBoltzmann() {
    var BOLT = window.SCIRESO_BOLTZMANN;
    if (!BOLT) return;
    var resultsContent = document.getElementById('boltzmann-results');
    var plotContainer = document.getElementById('boltzmann-plot');
    if (!resultsContent) return;
    var modeEl = document.getElementById('boltzmann-mode');
    var mode = (modeEl && modeEl.value) || 'rotational';
    var T = BOLT.parseNum(document.getElementById('boltzmann-T') && document.getElementById('boltzmann-T').value);
    var params = { mode: mode, temperature_K: T };
    if (mode === 'rotational') {
      params.B_cm = BOLT.parseNum(document.getElementById('boltzmann-B') && document.getElementById('boltzmann-B').value);
      params.maxJ = BOLT.parseNum(document.getElementById('boltzmann-maxJ') && document.getElementById('boltzmann-maxJ').value);
      if (isNaN(params.maxJ) || params.maxJ < 0) params.maxJ = 20;
    } else if (mode === 'vibrational') {
      params.omega_cm = BOLT.parseNum(document.getElementById('boltzmann-omega') && document.getElementById('boltzmann-omega').value);
      params.maxV = BOLT.parseNum(document.getElementById('boltzmann-maxV') && document.getElementById('boltzmann-maxV').value);
      if (isNaN(params.maxV) || params.maxV < 0) params.maxV = 20;
    } else {
      params.levelsText = document.getElementById('boltzmann-levels') && document.getElementById('boltzmann-levels').value;
    }
    var r = BOLT.compute(params);
    var valCell = function (v) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td>' : '<td class="abs-val">—</td>'; };
    var formulaHtml = '<p class="tool-formula">p<sub>i</sub> = ' + S.symbolHtml('g') + '<sub>i</sub> e<sup>−' + S.symbolHtml('E') + '<sub>i</sub>/(k' + S.symbolHtml('T') + ')</sup> / ' + S.symbolHtml('Q') + '</p>';
    var rows = [];
    if (r.error) {
      rows.push('<tr><td class="abs-desc">Temperature</td><td class="abs-sym sym-quantity">' + S.symbolHtml('T') + '</td><td class="abs-val">—</td><td class="abs-unit">K</td><td></td></tr>');
      rows.push('<tr><td class="abs-desc">Partition function</td><td class="abs-sym sym-quantity">' + S.symbolHtml('Q') + '</td><td class="abs-val">—</td><td class="abs-unit"></td><td></td></tr>');
      rows.push('<tr><td class="abs-desc">State</td><td class="abs-sym">' + S.symbolHtml('E') + ' (cm⁻¹)</td><td class="abs-name">' + S.symbolHtml('g') + '</td><td class="abs-name">' + S.symbolHtml('N') + '/' + S.symbolHtml('N0') + '</td><td class="abs-name">Fraction</td></tr>');
      rows.push('<tr><td class="abs-desc">—</td><td class="abs-val">—</td><td class="abs-val">—</td><td class="abs-val">—</td><td class="abs-val">—</td></tr>');
      var tableHtml = resultTable(rows);
      var resultsContent = document.getElementById('boltzmann-results');
      var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
      if (resultsContent) resultsContent.innerHTML = '<p class="placeholder">' + r.error + '</p>' + tableHtml;
      if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
      if (plotContainer) drawBoltzmannPlot(plotContainer, r);
      return;
    }
    rows.push('<tr><td class="abs-desc">Temperature</td><td class="abs-sym sym-quantity">' + S.symbolHtml('T') + '</td>' + valCell(r.temperature_K) + '<td class="abs-unit">K</td><td></td></tr>');
    rows.push('<tr><td class="abs-desc">Partition function</td><td class="abs-sym sym-quantity">' + S.symbolHtml('Q') + '</td>' + valCell(r.partitionFunction) + '<td class="abs-unit"></td><td></td></tr>');
    rows.push('<tr><td class="abs-desc">State</td><td class="abs-sym">' + S.symbolHtml('E') + ' (cm⁻¹)</td><td class="abs-name">' + S.symbolHtml('g') + '</td><td class="abs-name">' + S.symbolHtml('N') + '/' + S.symbolHtml('N0') + '</td><td class="abs-name">Fraction</td></tr>');
    r.levels.forEach(function (lev) {
      rows.push('<tr><td class="abs-desc">' + (lev.label || '') + '</td>' + valCell(lev.E_cm) + valCell(lev.g) + valCell(lev.relPop) + valCell(lev.fraction) + '</tr>');
    });
    var tableHtml = resultTable(rows);
    var resultsContent = document.getElementById('boltzmann-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
    if (plotContainer) drawBoltzmannPlot(plotContainer, r);
  }

  function initBoltzmann() {
    var BOLT = window.SCIRESO_BOLTZMANN;
    if (!BOLT) return;
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('boltzmann-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Mode', inputChoiceButtonsHtml('boltzmann-mode', [
        { value: 'rotational', label: 'Rotational' },
        { value: 'vibrational', label: 'Vibrational' },
        { value: 'generic', label: 'Generic' }
      ], 'rotational', 'Mode')) +
      inputRow(S.meaning('T'), S.symbolHtml('T'), '<input type="text" id="boltzmann-T" inputmode="decimal" placeholder="e.g. 300" value="300">', 'K') +
      '<tr id="boltzmann-rot"><td class="input-desc">' + S.meaning('B_rot') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('B_rot') + '</td><td class="input-val"><input type="text" id="boltzmann-B" inputmode="decimal" placeholder="e.g. 2" value="2"></td><td class="input-unit">cm⁻¹</td></tr>' +
      '<tr id="boltzmann-maxj-row"><td class="input-desc">Max J</td><td class="input-sym"></td><td class="input-val"><input type="text" id="boltzmann-maxJ" inputmode="decimal" placeholder="20" value="20"></td><td class="input-unit"></td></tr>' +
      '<tr id="boltzmann-vib" style="display:none"><td class="input-desc">' + S.meaning('omega_e') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('omega_e') + '</td><td class="input-val"><input type="text" id="boltzmann-omega" inputmode="decimal" placeholder="e.g. 2000" value="2000"></td><td class="input-unit">cm⁻¹</td></tr>' +
      '<tr id="boltzmann-maxv-row" style="display:none"><td class="input-desc">Max v</td><td class="input-sym"></td><td class="input-val"><input type="text" id="boltzmann-maxV" inputmode="decimal" placeholder="10" value="10"></td><td class="input-unit"></td></tr>' +
      '<tr id="boltzmann-gen" style="display:none"><td class="input-desc">Levels (E, g per line)</td><td class="input-sym"></td><td class="input-val" colspan="2"><textarea id="boltzmann-levels" rows="5" placeholder="0 1&#10;10 2&#10;25 1" style="width:100%;max-width:14rem;box-sizing:border-box;"></textarea></td></tr>' +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }, { view: 'plot', label: 'Plot (pop)' }],
      resultsId: 'boltzmann-results',
      equationsHtml: '',
      plotPanes: [{ dataPlot: 'plot', plotId: 'boltzmann-plot', controlsPrefix: 'boltzmann-plot', scaleButtons: true }]
    });
    var modeEl = document.getElementById('boltzmann-mode');
    var rotDiv = document.getElementById('boltzmann-rot');
    var vibDiv = document.getElementById('boltzmann-vib');
    var genDiv = document.getElementById('boltzmann-gen');
    function toggleMode() {
      var m = modeEl.value;
      var rotRow = document.getElementById('boltzmann-rot');
      var maxjRow = document.getElementById('boltzmann-maxj-row');
      if (rotDiv) rotDiv.style.display = m === 'rotational' ? '' : 'none';
      if (maxjRow) maxjRow.style.display = m === 'rotational' ? '' : 'none';
      if (vibDiv) vibDiv.style.display = m === 'vibrational' ? '' : 'none';
      var maxvRow = document.getElementById('boltzmann-maxv-row');
      if (maxvRow) maxvRow.style.display = m === 'vibrational' ? '' : 'none';
      if (genDiv) genDiv.style.display = m === 'generic' ? '' : 'none';
      runBoltzmann();
    }
    bindChoiceButtons('boltzmann-mode', toggleMode);
    bindInputsToRun(['boltzmann-T', 'boltzmann-B', 'boltzmann-maxJ', 'boltzmann-omega', 'boltzmann-maxV', 'boltzmann-levels', 'boltzmann-plot-xmin', 'boltzmann-plot-xmax', 'boltzmann-plot-ymin', 'boltzmann-plot-ymax', 'plot-aspect-ratio'], runBoltzmann);
    bindScaleButtonsInPanel(runBoltzmann);
    bindPlotGridButton(runBoltzmann);
    runBoltzmann();
    var boltReset = document.getElementById('boltzmann-reset-defaults');
    if (boltReset) boltReset.addEventListener('click', initBoltzmann);
  }

  function drawBoltzmannPlot(container, r) {
    var levels = r && r.levels ? r.levels : [];
    var plotMax = null;
    var yMaxManual = null;
    var size = getPlotSize(container, PLOT_SLOT.cw, PLOT_SLOT.ch);
    var cw = size.cw;
    var ch = size.ch;
    if (!levels.length) {
      var pad = PAD_LARGE;
      var w = cw - pad.L - pad.R;
      var h = ch - pad.T - pad.B;
      var canvas = document.createElement('canvas');
      canvas.className = 'laser-plot';
      var ctx = setupHiDPICanvas(canvas, cw, ch);
      ctx.fillStyle = PLOT_BG;
      ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = PLOT_FG;
      ctx.fillStyle = PLOT_MUTED;
      ctx.font = FONT_TITLE;
      ctx.textAlign = 'center';
      ctx.fillText('No data', pad.L + w / 2, pad.T + h / 2);
      container.innerHTML = '';
      container.appendChild(canvas);
      return;
    }
    var n = (plotMax != null && !isNaN(plotMax) && plotMax >= 0) ? Math.min(plotMax + 1, levels.length) : levels.length;
    var useLevels = levels.slice(0, n);
    var yMaxData = useLevels.length ? Math.max.apply(null, useLevels.map(function (l) { return l.fraction || 0; })) : 1;
    var yMax = (yMaxManual != null && !isNaN(yMaxManual) && yMaxManual > 0) ? yMaxManual : yMaxData * 1.08;
    if (yMax <= 0) yMax = 1;
    var xMin = -0.5;
    var xMax = useLevels.length - 0.5;
    var yMin = 0;
    var rr = readAxisRange('boltzmann-plot');
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) { xMin = rr.xMin; xMax = rr.xMax; }
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) { yMin = rr.yMin; yMax = rr.yMax; }
    else if (rr.yMin != null && isFinite(rr.yMin)) yMin = rr.yMin;
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale, xLabel: 'State index', yLabel: 'Fraction', title: 'Population fraction',
      canvasClass: 'laser-plot',
      drawData: function (ctx, h) {
        var toGX = h.toGX, toGY = h.toGY, pad = h.pad, w = h.w, h_ = h.h, ch = h.ch;
        var barW = (xMax > xMin ? w / (xMax - xMin) : w) * 0.7;
        var gyBottom = (yScale === 'log') ? (ch - pad.B) : toGY(0);
        ctx.fillStyle = PLOT_ACCENT;
        useLevels.forEach(function (lev, i) {
          var frac = lev.fraction != null ? lev.fraction : 0;
          if (yScale === 'log' && frac <= 0) return;
          var gx = toGX(i) - barW / 2;
          var gy = toGY(frac);
          if (gx == null || gy == null) return;
          var barH = gyBottom - gy;
          if (barH > 0) ctx.fillRect(gx, gy, barW, barH);
        });
      }
    });
  }

  function runPhotoionization() {
    var PI = window.SCIRESO_PHOTOIONIZATION;
    if (!PI) return;
    var resultsContent = document.getElementById('pi-results');
    var plotContainer = document.getElementById('pi-plot');
    if (!resultsContent) return;
    var E_photon = PI.parseNum(document.getElementById('pi-Ephoton') && document.getElementById('pi-Ephoton').value);
    var E_binding = PI.parseNum(document.getElementById('pi-Ebinding') && document.getElementById('pi-Ebinding').value);
    var mass_u = PI.parseNum(document.getElementById('pi-mass') && document.getElementById('pi-mass').value);
    var Gamma = PI.parseNum(document.getElementById('pi-Gamma') && document.getElementById('pi-Gamma').value);
    var E_Auger = PI.parseNum(document.getElementById('pi-EAuger') && document.getElementById('pi-EAuger').value);
    var params = { E_photon_eV: E_photon, E_binding_eV: E_binding, mass_u: mass_u, Gamma_eV: Gamma, E_Auger_eV: E_Auger };
    var r = PI.compute(params);
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var rows = [];
    var formulaHtml = '<p class="tool-formula">' + S.symbolHtml('E_k') + ' = hν − ' + S.symbolHtml('E_bind') + '</p>';
    if (r.error) {
      var emptyRows = [
        resultRow('Kinetic energy (electron)', S.symbolHtml('E_k'), null, 'eV'),
        resultRow('Recoil KE (ion)', '', null, 'eV'),
        resultRow('Post-collision interaction shift', '', null, 'eV'),
        resultRow('KE after PCI and recoil (e⁻)', '', null, 'eV')
      ];
      var emptyTable = '<table class="conversion-table absorption-table pi-results-table"><tbody>' + emptyRows.join('') + '</tbody></table>';
      var resultsContent = document.getElementById('pi-results');
      var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
      if (resultsContent) resultsContent.innerHTML = '<p class="placeholder">' + r.error + '</p>' + emptyTable;
      if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
      if (plotContainer) drawPhotoionizationAngular(plotContainer);
      var lineshapeContainer = document.getElementById('pi-plot-lineshape');
      if (lineshapeContainer) drawPhotoionizationLineshape(lineshapeContainer, r);
      return;
    }
    rows.push(resultRowValUnit('Kinetic energy (electron)', S.symbolHtml('E_k'), r.KE_eV, r.KE_eV != null && isFinite(r.KE_eV), 'eV'));
    rows.push(resultRowValUnit('Recoil KE (ion)', '', r.recoil_eV, r.recoil_eV != null && isFinite(r.recoil_eV), 'eV'));
    rows.push(resultRowValUnit('Post-collision interaction shift', '', r.PCI_shift_eV, r.PCI_shift_eV != null && isFinite(r.PCI_shift_eV), 'eV'));
    rows.push(resultRowValUnit('KE after PCI and recoil (e⁻)', '', r.KE_after_PCI_and_recoil_eV, r.KE_after_PCI_and_recoil_eV != null && isFinite(r.KE_after_PCI_and_recoil_eV), 'eV'));
    var tableHtml = resultTable(rows, 'pi-results-table');
    var resultsContent = document.getElementById('pi-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
    if (plotContainer) drawPhotoionizationAngular(plotContainer);
    var lineshapeContainer = document.getElementById('pi-plot-lineshape');
    if (lineshapeContainer) drawPhotoionizationLineshape(lineshapeContainer, r);
  }

  function drawPhotoionizationAngular(container) {
    var PI = window.SCIRESO_PHOTOIONIZATION;
    if (!PI || !container) return;
    var betaEl = document.getElementById('pi-beta');
    var beta = (betaEl && betaEl.value.trim() !== '') ? PI.parseNum(betaEl.value) : 0;
    if (isNaN(beta)) beta = 0;
    var xMinEl = document.getElementById('pi-plot-xmin');
    var xMaxEl = document.getElementById('pi-plot-xmax');
    var yMinEl = document.getElementById('pi-plot-ymin');
    var yMaxEl = document.getElementById('pi-plot-ymax');
    var xMin = (xMinEl && xMinEl.value.trim() !== '') ? parseFloat(xMinEl.value.replace(/,/g, '')) : 0;
    var xMax = (xMaxEl && xMaxEl.value.trim() !== '') ? parseFloat(xMaxEl.value.replace(/,/g, '')) : 180;
    var yMinManual = (yMinEl && yMinEl.value.trim() !== '') ? parseFloat(yMinEl.value.replace(/,/g, '')) : null;
    var yMaxManual = (yMaxEl && yMaxEl.value.trim() !== '') ? parseFloat(yMaxEl.value.replace(/,/g, '')) : null;
    var points = PI.angularDistribution(beta, 200);
    var inRange = points.filter(function (p) { return p.theta_deg >= xMin && p.theta_deg <= xMax; });
    var yMaxData = inRange.length ? Math.max.apply(null, inRange.map(function (p) { return p.intensity; })) : 1;
    var yMinData = inRange.length ? Math.min.apply(null, inRange.map(function (p) { return p.intensity; })) : 0;
    var yMax = (yMaxManual != null && !isNaN(yMaxManual) && yMaxManual > 0) ? yMaxManual : yMaxData * 1.08;
    if (yMax <= 0) yMax = 1;
    var yMin = (yMinManual != null && !isNaN(yMinManual)) ? yMinManual : 0;
    if (yMin >= yMax) yMin = yMax - 1;
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(0.1, xMax / 1000) || 0.1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('theta') + ' (deg)', yLabel: 'Relative intensity',
      title: 'Angular distribution (' + S.symbol('beta') + ' = ' + formatNumber(beta) + ')',
      canvasClass: 'laser-plot',
      drawData: function (ctx, h) {
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var first = true;
        points.forEach(function (p) {
          if (p.theta_deg < xMin || p.theta_deg > xMax) return;
          var gx = toGX(p.theta_deg);
          var gy = toGY(p.intensity);
          if (gx != null && gy != null) {
            if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
          }
        });
        ctx.stroke();
      }
    });
  }

  function drawPhotoionizationLineshape(container, r) {
    var PI = window.SCIRESO_PHOTOIONIZATION;
    if (!PI || !container) return;
    r = r || {};
    var KE_center = (r.KE_after_PCI_and_recoil_eV != null && isFinite(r.KE_after_PCI_and_recoil_eV)) ? r.KE_after_PCI_and_recoil_eV : (r.KE_after_PCI_eV != null && isFinite(r.KE_after_PCI_eV)) ? r.KE_after_PCI_eV : (r.KE_eV != null && isFinite(r.KE_eV)) ? r.KE_eV : 500;
    var Gamma = PI.parseNum(document.getElementById('pi-Gamma') && document.getElementById('pi-Gamma').value);
    var resFWHM = PI.parseNum(document.getElementById('pi-resolution') && document.getElementById('pi-resolution').value);
    if (isNaN(resFWHM) || resFWHM < 0) resFWHM = 0;
    var points = PI.photoelectronLineshape(KE_center, Gamma, resFWHM, 300);
    var xMinManualEl = document.getElementById('pi-lineshape-xmin');
    var xMaxManualEl = document.getElementById('pi-lineshape-xmax');
    var xMinManual = (xMinManualEl && xMinManualEl.value.trim() !== '') ? parseFloat(xMinManualEl.value.replace(/,/g, '')) : null;
    var xMaxManual = (xMaxManualEl && xMaxManualEl.value.trim() !== '') ? parseFloat(xMaxManualEl.value.replace(/,/g, '')) : null;
    var xMin, xMax;
    if (points.length) {
      xMin = points[0].E_eV;
      xMax = points[0].E_eV;
      points.forEach(function (p) {
        if (p.E_eV < xMin) xMin = p.E_eV;
        if (p.E_eV > xMax) xMax = p.E_eV;
      });
      var margin = (xMax - xMin) * 0.05 || 0.5;
      xMin -= margin;
      xMax += margin;
      if (xMinManual != null && !isNaN(xMinManual) && xMaxManual != null && !isNaN(xMaxManual) && xMaxManual > xMinManual) {
        xMin = xMinManual;
        xMax = xMaxManual;
      }
    } else {
      xMin = (xMinManual != null && !isNaN(xMinManual)) ? xMinManual : KE_center - 2;
      xMax = (xMaxManual != null && !isNaN(xMaxManual)) ? xMaxManual : KE_center + 2;
      if (xMax <= xMin) xMax = xMin + 4;
    }
    var rr = readAxisRange('pi-lineshape');
    var yMax = 1.08;
    var yMin = 0;
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) {
      yMin = rr.yMin;
      yMax = rr.yMax;
    } else if (rr.yMin != null && isFinite(rr.yMin)) {
      yMin = rr.yMin;
    } else if (rr.yMax != null && isFinite(rr.yMax)) {
      yMax = rr.yMax;
    }
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(0.1, xMax / 1000) || 0.1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('E') + ' (eV)', yLabel: 'Relative intensity', title: 'Photoelectron lineshape',
      canvasClass: 'laser-plot',
      drawData: function (ctx, h) {
        if (!points.length) return;
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var first = true;
        points.forEach(function (p) {
          var gx = toGX(p.E_eV);
          var gy = toGY(p.intensity);
          if (gx != null && gy != null) {
            if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
          }
        });
        ctx.stroke();
      },
      afterClip: function (ctx, h) {
        if (points.length) return;
        ctx.fillStyle = PLOT_MUTED;
        ctx.font = FONT_TITLE;
        ctx.textAlign = 'center';
        ctx.fillText('No lineshape data', h.pad.L + h.w / 2, h.pad.T + h.h / 2);
      }
    });
  }

  function initPhotoionization() {
    var PI = window.SCIRESO_PHOTOIONIZATION;
    if (!PI) return;
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('pi-reset-defaults') +
      toolInputTableOpen() +
      inputRow('Photon energy', S.symbolHtml('E'), '<input type="text" id="pi-Ephoton" inputmode="decimal" placeholder="e.g. 1000" value="1000">', 'eV') +
      inputRow('Binding energy', S.symbolHtml('E_bind'), '<input type="text" id="pi-Ebinding" inputmode="decimal" placeholder="e.g. 500" value="500">', 'eV') +
      inputRow('Mass (optional)', S.symbolHtml('m'), '<input type="text" id="pi-mass" inputmode="decimal" placeholder="e.g. 16" value="16">', 'u') +
      inputRow('Core hole (optional)', S.symbolHtml('Gamma'), '<input type="text" id="pi-Gamma" inputmode="decimal" placeholder="e.g. 0.1" value="0.1">', 'eV') +
      inputRow('Auger energy (optional)', '', '<input type="text" id="pi-EAuger" inputmode="decimal" placeholder="e.g. 200" value="200">', 'eV') +
      inputRow(S.meaning('beta'), S.symbolHtml('beta'), '<input type="text" id="pi-beta" inputmode="decimal" placeholder="e.g. 1" value="1">', '') +
      inputRow('Resolution', S.symbolHtml('FWHM'), '<input type="text" id="pi-resolution" inputmode="decimal" placeholder="e.g. 0.05" value="0.05">', 'eV') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' },
        { view: 'plot-angular', label: 'Plot (θ)' },
        { view: 'plot-lineshape', label: 'Plot (shape)' }
      ],
      resultsId: 'pi-results',
      equationsHtml: '',
      plotPanes: [
        { dataPlot: 'plot-angular', plotId: 'pi-plot', controlsPrefix: 'pi-plot', scaleButtons: true },
        { dataPlot: 'plot-lineshape', plotId: 'pi-plot-lineshape', controlsPrefix: 'pi-lineshape', scaleButtons: true }
      ]
    });
    bindInputsToRun(['pi-Ephoton', 'pi-Ebinding', 'pi-mass', 'pi-Gamma', 'pi-EAuger', 'pi-resolution', 'pi-beta', 'pi-plot-xmin', 'pi-plot-xmax', 'pi-plot-ymin', 'pi-plot-ymax', 'pi-lineshape-xmin', 'pi-lineshape-xmax', 'pi-lineshape-ymin', 'pi-lineshape-ymax'], runPhotoionization);
    bindScaleButtonsInPanel(runPhotoionization);
    bindPlotGridButton(runPhotoionization);
    runPhotoionization();
    var piReset = document.getElementById('pi-reset-defaults');
    if (piReset) piReset.addEventListener('click', initPhotoionization);
  }

  function runCompton() {
    var COM = window.SCIRESO_COMPTON;
    if (!COM) return;
    var resultsContent = document.getElementById('compton-results');
    var plotContainer = document.getElementById('compton-plot');
    if (!resultsContent) return;
    var E_incident = COM.parseNum(document.getElementById('compton-E') && document.getElementById('compton-E').value);
    var theta = COM.parseNum(document.getElementById('compton-theta') && document.getElementById('compton-theta').value);
    if (isNaN(theta)) theta = 0;
    var r = COM.compute({ E_incident_eV: E_incident, theta_deg: theta });
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var formulaHtml = '<p class="tool-formula">' + S.symbolHtml('E_prime') + ' = ' + S.symbolHtml('E') + ' / (1 + (' + S.symbolHtml('E') + ' / ' + S.symbolHtml('m_e') + 'c²)(1 − cos ' + S.symbolHtml('theta') + '))</p><p class="tool-formula">' + S.symbolHtml('delta_lambda') + ' = ' + S.symbolHtml('lambda_C') + '(1 − cos ' + S.symbolHtml('theta') + ')</p>';
    if (r.error) {
      var emptyRows = [
        resultRow('Energy of scattered photon', S.symbolHtml('E_prime'), null, 'eV'),
        resultRow('Energy of electron', S.symbolHtml('E_k'), null, 'eV'),
        resultRow(S.meaning('delta_lambda'), S.symbolHtml('delta_lambda'), null, 'pm')
      ];
      var emptyTable = resultTable(emptyRows);
      var resultsContent = document.getElementById('compton-results');
      var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
      if (resultsContent) resultsContent.innerHTML = '<p class="placeholder">' + r.error + '</p>' + emptyTable;
      if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
      if (plotContainer) drawComptonPlot(plotContainer);
      return;
    }
    var rows = [
      resultRowValUnit('Energy of scattered photon', S.symbolHtml('E_prime'), r.E_scattered_eV, r.E_scattered_eV != null && isFinite(r.E_scattered_eV), 'eV'),
      resultRowValUnit('Energy of electron', S.symbolHtml('E_k'), r.recoil_KE_eV, r.recoil_KE_eV != null && isFinite(r.recoil_KE_eV), 'eV'),
      resultRowValUnit(S.meaning('delta_lambda'), S.symbolHtml('delta_lambda'), r.deltaLambda_pm, r.deltaLambda_pm != null && isFinite(r.deltaLambda_pm), 'pm')
    ];
    var tableHtml = resultTable(rows);
    var resultsContent = document.getElementById('compton-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml || '';
    if (plotContainer) drawComptonPlot(plotContainer);
  }

  function drawComptonPlot(container) {
    var COM = window.SCIRESO_COMPTON;
    if (!COM || !container) return;
    var E_incident = COM.parseNum(document.getElementById('compton-E') && document.getElementById('compton-E').value);
    var xMinEl = document.getElementById('compton-plot-xmin');
    var xMaxEl = document.getElementById('compton-plot-xmax');
    var yMinEl = document.getElementById('compton-plot-ymin');
    var yMaxEl = document.getElementById('compton-plot-ymax');
    var xMin = (xMinEl && xMinEl.value.trim() !== '') ? parseFloat(xMinEl.value.replace(/,/g, '')) : 0;
    var xMax = (xMaxEl && xMaxEl.value.trim() !== '') ? parseFloat(xMaxEl.value.replace(/,/g, '')) : 180;
    var yMinManual = (yMinEl && yMinEl.value.trim() !== '') ? parseFloat(yMinEl.value.replace(/,/g, '')) : null;
    var yMaxManual = (yMaxEl && yMaxEl.value.trim() !== '') ? parseFloat(yMaxEl.value.replace(/,/g, '')) : null;
    var points = COM.angleVsEnergy(E_incident, xMin, xMax, 200);
    var inRange = points.filter(function (p) { return p.theta_deg >= xMin && p.theta_deg <= xMax; });
    var yMaxData = inRange.length ? Math.max.apply(null, inRange.map(function (p) { return p.E_scattered_eV; })) : 1;
    var yMinData = inRange.length ? Math.min.apply(null, inRange.map(function (p) { return p.E_scattered_eV; })) : 0;
    var ySpan = yMaxData - yMinData;
    if (ySpan <= 0 || !isFinite(ySpan)) ySpan = Math.abs(yMaxData) || 1;
    var yMax = (yMaxManual != null && !isNaN(yMaxManual) && yMaxManual > 0) ? yMaxManual : yMaxData + 0.04 * ySpan;
    if (yMax <= yMinData) yMax = yMinData + ySpan;
    var yMin = (yMinManual != null && !isNaN(yMinManual)) ? yMinManual : (inRange.length ? yMinData - 0.04 * ySpan : 0);
    if (yMin >= yMax) yMin = yMax - 1;
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(0.1, xMax / 1000) || 0.1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('theta') + ' (deg)', yLabel: S.symbol('E') + ' (eV)', title: 'Scattered energy vs angle',
      canvasClass: 'laser-plot',
      drawData: function (ctx, h) {
        if (!points.length) return;
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var first = true;
        points.forEach(function (p) {
          if (p.theta_deg < xMin || p.theta_deg > xMax) return;
          var gx = toGX(p.theta_deg);
          var gy = toGY(p.E_scattered_eV);
          if (gx != null && gy != null) {
            if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
          }
        });
        ctx.stroke();
      },
      afterClip: function (ctx, h) {
        if (points.length) return;
        ctx.fillStyle = PLOT_MUTED;
        ctx.font = FONT_TITLE;
        ctx.textAlign = 'center';
        ctx.fillText('Enter incident ' + S.symbol('E') + ' (eV)', h.pad.L + h.w / 2, h.pad.T + h.h / 2);
      }
    });
  }

  function initCompton() {
    var COM = window.SCIRESO_COMPTON;
    if (!COM) return;
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('compton-reset-defaults') +
      toolInputTableOpen() +
      inputRow('Incident photon energy', S.symbolHtml('E'), '<input type="text" id="compton-E" inputmode="decimal" placeholder="e.g. 100000" value="100000">', 'eV') +
      inputRow('Scattering angle', S.symbolHtml('theta'), '<input type="text" id="compton-theta" inputmode="decimal" placeholder="e.g. 90" value="90">', 'deg') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }, { view: 'plot', label: 'Plot (E′)' }],
      resultsId: 'compton-results',
      equationsHtml: '',
      plotPanes: [{ dataPlot: 'plot', plotId: 'compton-plot', controlsPrefix: 'compton-plot', scaleButtons: true }]
    });
    bindInputsToRun(['compton-E', 'compton-theta', 'compton-plot-xmin', 'compton-plot-xmax', 'compton-plot-ymin', 'compton-plot-ymax', 'plot-aspect-ratio'], runCompton);
    bindScaleButtonsInPanel(runCompton);
    bindPlotGridButton(runCompton);
    runCompton();
    var comptonReset = document.getElementById('compton-reset-defaults');
    if (comptonReset) comptonReset.addEventListener('click', initCompton);
  }

  function runBlackbody() {
    var BB = window.SCIRESO_BLACKBODY;
    if (!BB) return;
    var resultsContent = document.getElementById('bb-results');
    var plotContainer = document.getElementById('bb-plot');
    if (!resultsContent) return;
    var T_K = BB.parseNum(document.getElementById('bb-T') && document.getElementById('bb-T').value);
    var r = BB.compute({ T_K: T_K });
    var rows = [
      resultRowValUnit(S.meaning('T'), S.symbolHtml('T'), r.T_K, r.T_K != null && isFinite(r.T_K), 'K'),
      resultRowValUnit('Peak wavelength (Wien)', S.symbolHtml('lambda'), r.peakWavelength_nm, r.peakWavelength_nm != null && isFinite(r.peakWavelength_nm), 'nm'),
      resultRowValUnit('Peak wavelength', S.symbolHtml('lambda'), r.peakWavelength_m, r.peakWavelength_m != null && isFinite(r.peakWavelength_m), 'm'),
      resultRowValUnit('Total radiance (Stefan–Boltzmann)', '', r.totalRadiance_Wm2, r.totalRadiance_Wm2 != null && isFinite(r.totalRadiance_Wm2), 'W/m²')
    ];
    var tableHtml = resultTable(rows);
    var formulaHtml = '<p class="tool-formula">B(' + S.symbolHtml('lambda') + ',' + S.symbolHtml('T') + ') = (2hc²/' + S.symbolHtml('lambda') + '⁵) / (e<sup>hc/(' + S.symbolHtml('lambda') + 'k' + S.symbolHtml('T') + ')</sup> − 1) (Planck)</p><p class="tool-formula">' + S.symbolHtml('lambda') + '<sub>max</sub>' + S.symbolHtml('T') + ' = b (Wien)</p><p class="tool-formula">R = ' + S.symbolHtml('sigma') + S.symbolHtml('T') + '⁴ (Stefan–Boltzmann)</p>';
    var resultsContent = document.getElementById('bb-results');
    var equationsContent = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (resultsContent) resultsContent.innerHTML = (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
    if (equationsContent) equationsContent.innerHTML = formulaHtml;
    if (plotContainer) drawBlackbodySpectrum(plotContainer, r.error ? NaN : r.T_K);
  }

  function drawBlackbodySpectrum(container, T_K) {
    var BB = window.SCIRESO_BLACKBODY;
    if (!BB || !container) return;
    var hasData = T_K > 0 && isFinite(T_K);
    var xMin = 100;
    var xMax = 5000;
    var points = [];
    if (hasData) {
      var lambdaPeak_nm = (BB.WIEN_B / T_K) * 1e9;
      var searchMin = Math.max(1, Math.floor(lambdaPeak_nm / 20));
      var searchMax = Math.min(200000, Math.ceil(lambdaPeak_nm * 20));
      if (searchMax <= searchMin) { searchMin = 100; searchMax = 5000; }
      var searchPts = BB.spectrumPoints(T_K, searchMin, searchMax, 420);
      var thr = 0.01;
      var iLo = -1, iHi = -1;
      for (var si = 0; si < searchPts.length; si++) {
        if (searchPts[si].B_rel >= thr) { iLo = si; break; }
      }
      for (var sj = searchPts.length - 1; sj >= 0; sj--) {
        if (searchPts[sj].B_rel >= thr) { iHi = sj; break; }
      }
      if (iLo >= 0 && iHi >= 0 && iHi > iLo) {
        xMin = searchPts[iLo].lambda_nm;
        xMax = searchPts[iHi].lambda_nm;
        var span = xMax - xMin;
        var margin = 0.08 * (span || (xMax || 1));
        xMin = Math.max(1, xMin - margin);
        xMax = Math.min(200000, xMax + margin);
      } else {
        xMin = searchMin;
        xMax = searchMax;
      }
      points = BB.spectrumPoints(T_K, xMin, xMax, 280);
    }
    var rr = readAxisRange('bb-plot');
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) { xMin = rr.xMin; xMax = rr.xMax; points = hasData ? BB.spectrumPoints(T_K, xMin, xMax, 280) : []; }
    var yMin = 0;
    var yMax = 1.08;
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) { yMin = rr.yMin; yMax = rr.yMax; }
    else if (rr.yMin != null && isFinite(rr.yMin)) { yMin = rr.yMin; }
    else if (rr.yMax != null && isFinite(rr.yMax)) { yMax = rr.yMax; }
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(1, xMax / 1000) || 1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    drawUnifiedCartesianPlot(container, {
      plotXMin: xMin, plotXMax: xMax, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: 'Wavelength (nm)', yLabel: 'Relative B(' + S.symbol('lambda') + ')', title: hasData ? 'Spectral radiance (relative)' : 'Enter temperature (K)',
      canvasClass: 'laser-plot',
      drawData: function (ctx, h) {
        if (!hasData || points.length < 2) return;
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var first = true;
        for (var i = 0; i < points.length; i++) {
          var gx = toGX(points[i].lambda_nm);
          var gy = toGY(points[i].B_rel);
          if (gx != null && gy != null) {
            if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
          } else { first = true; }
        }
        ctx.stroke();
      },
      afterClip: function (ctx, h) {
        if (hasData) return;
        ctx.fillStyle = PLOT_MUTED;
        ctx.font = FONT_TITLE;
        ctx.textAlign = 'center';
        ctx.fillText('Enter temperature (K)', h.pad.L + h.w / 2, h.pad.T + h.h / 2);
      }
    });
  }

  function initBlackbody() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('bb-reset-defaults') +
      toolInputTableOpen() +
      inputRow(S.meaning('T'), S.symbolHtml('T'), '<input type="text" id="bb-T" inputmode="decimal" placeholder="e.g. 5778" value="5778">', 'K') +
      '</tbody></table></div>';
    var bbFormulaHtml = '<p class="tool-formula">B(' + S.symbolHtml('lambda') + ',' + S.symbolHtml('T') + ') = (2hc²/' + S.symbolHtml('lambda') + '⁵) / (e<sup>hc/(' + S.symbolHtml('lambda') + 'k' + S.symbolHtml('T') + ')</sup> − 1) (Planck)</p><p class="tool-formula">' + S.symbolHtml('lambda') + '<sub>max</sub>' + S.symbolHtml('T') + ' = b (Wien)</p><p class="tool-formula">R = ' + S.symbolHtml('sigma') + S.symbolHtml('T') + '⁴ (Stefan–Boltzmann)</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }, { view: 'plot', label: 'Plot' }],
      resultsId: 'bb-results',
      equationsHtml: bbFormulaHtml,
      plotPanes: [{ dataPlot: 'plot', plotId: 'bb-plot', controlsPrefix: 'bb-plot', scaleButtons: true }]
    });
    bindInputsToRun(['bb-T', 'bb-plot-xmin', 'bb-plot-xmax', 'bb-plot-ymin', 'bb-plot-ymax', 'plot-aspect-ratio'], runBlackbody);
    bindScaleButtonsInPanel(runBlackbody);
    bindPlotGridButton(runBlackbody);
    runBlackbody();
    var bbReset = document.getElementById('bb-reset-defaults');
    if (bbReset) bbReset.addEventListener('click', initBlackbody);
  }

  function runPeakConvolution() {
    var PC = window.SCIRESO_PEAK_CONVOLUTION;
    if (!PC) return;
    var container = document.getElementById('pc-results');
    if (!container) return;
    var modeEl = document.getElementById('pc-mode');
    var mode = (modeEl && modeEl.value) || 'convolve';
    var type1 = (document.getElementById('pc-type1') && document.getElementById('pc-type1').value) || 'gaussian';
    var type2 = (document.getElementById('pc-type2') && document.getElementById('pc-type2').value) || 'gaussian';
    var convTypeEl = document.getElementById('pc-conv-type');
    var convType = (convTypeEl && convTypeEl.value) || 'gaussian';
    var fwhm1 = PC.parseNum(document.getElementById('pc-fwhm1') && document.getElementById('pc-fwhm1').value);
    var fwhm1G = PC.parseNum(document.getElementById('pc-fwhm1g') && document.getElementById('pc-fwhm1g').value);
    var fwhm1L = PC.parseNum(document.getElementById('pc-fwhm1l') && document.getElementById('pc-fwhm1l').value);
    var fwhm2 = PC.parseNum(document.getElementById('pc-fwhm2') && document.getElementById('pc-fwhm2').value);
    var fwhm2G = PC.parseNum(document.getElementById('pc-fwhm2g') && document.getElementById('pc-fwhm2g').value);
    var fwhm2L = PC.parseNum(document.getElementById('pc-fwhm2l') && document.getElementById('pc-fwhm2l').value);
    var convFwhm = PC.parseNum(document.getElementById('pc-conv-fwhm') && document.getElementById('pc-conv-fwhm').value);
    var convG = PC.parseNum(document.getElementById('pc-conv-g') && document.getElementById('pc-conv-g').value);
    var convL = PC.parseNum(document.getElementById('pc-conv-l') && document.getElementById('pc-conv-l').value);
    var params = {
      mode: mode,
      type1: type1,
      type2: type2,
      convType: convType,
      fwhm1: fwhm1, fwhm1G: fwhm1G, fwhm1L: fwhm1L,
      fwhm2: fwhm2, fwhm2G: fwhm2G, fwhm2L: fwhm2L,
      convFwhm: convFwhm, convG: convG, convL: convL
    };
    var r = PC.compute(params);
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="4" class="placeholder">' + r.error + '</td></tr>');
    } else {
      if (mode === 'convolve') {
        rows.push(resultRowValUnit('Convoluted ' + S.meaning('FWHM'), S.symbolHtml('FWHM'), r.fwhmResult, r.fwhmResult != null && isFinite(r.fwhmResult), ''));
        if (r.fwhmResultG > 0 || r.fwhmResultL > 0) {
          rows.push(resultRowValUnit(S.meaning('FWHM_G'), S.symbolHtml('FWHM_G'), r.fwhmResultG, true, ''));
          rows.push(resultRowValUnit(S.meaning('FWHM_L'), S.symbolHtml('FWHM_L'), r.fwhmResultL, true, ''));
          if (r.fwhmResultG > 0 && r.fwhmResultL > 0) rows.push(resultRowValUnit('Voigt ' + S.meaning('FWHM'), S.symbolHtml('FWHM'), r.fwhmVoigt, r.fwhmVoigt != null && isFinite(r.fwhmVoigt), ''));
        }
      } else {
        rows.push(resultRowValUnit('Peak 2 ' + S.meaning('FWHM'), S.symbolHtml('FWHM'), r.fwhmResult, r.fwhmResult != null && isFinite(r.fwhmResult), ''));
        if (r.fwhmResultG > 0 || r.fwhmResultL > 0) {
          rows.push(resultRowValUnit(S.meaning('FWHM_G'), S.symbolHtml('FWHM_G'), r.fwhmResultG, true, ''));
          rows.push(resultRowValUnit(S.meaning('FWHM_L'), S.symbolHtml('FWHM_L'), r.fwhmResultL, true, ''));
          if (r.fwhmResultG > 0 && r.fwhmResultL > 0) rows.push(resultRowValUnit('Voigt ' + S.meaning('FWHM'), S.symbolHtml('FWHM'), r.fwhmVoigt, r.fwhmVoigt != null && isFinite(r.fwhmVoigt), ''));
        }
      }
    }
    var tableHtml = resultTable(rows);
    container.innerHTML = '<div class="tool-view-buttons"><button type="button" class="tool-view-btn is-active" data-view="results">Results</button><button type="button" class="tool-view-btn" data-view="equations">Equations</button></div>' +
      '<div class="tool-results-content">' + tableHtml + '</div>' +
      '<div class="tool-equations-content" hidden>' +
      '<p class="tool-formula">Gaussian: ' + S.symbolHtml('FWHM') + '<sub>conv</sub> = ' + sqrtHtml('FWHM₁² + FWHM₂²') + '</p>' +
      '<p class="tool-formula">Lorentzian: ' + S.symbolHtml('FWHM') + '<sub>conv</sub> = FWHM₁ + FWHM₂</p>' +
      '<p class="tool-formula">Voigt: approximation (e.g. Olivero) or numerical</p>' +
      '<p class="tool-formula">Deconvolve: FWHM₂ = ' + sqrtHtml(S.symbolHtml('FWHM') + '<sub>conv</sub>² − FWHM₁²') + ' (Gaussian)</p>' +
      '</div>';
  }

  function initPeakConvolution() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('pc-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Mode', inputChoiceButtonsHtml('pc-mode', [
        { value: 'convolve', label: 'Convolve two peaks' },
        { value: 'deconvolve', label: 'Deconvolve (find peak 2)' }
      ], 'convolve', 'Mode')) +
      inputChoiceSectionRow('Peak 1 type', inputChoiceButtonsHtml('pc-type1', [
        { value: 'gaussian', label: 'Gaussian' },
        { value: 'lorentzian', label: 'Lorentzian' },
        { value: 'voigt', label: 'Voigt' }
      ], 'gaussian', 'Peak 1 type'), 'pc-peak1-wrap', 'pc-type1-desc') +
      '<tr id="pc-fwhm1-wrap"><td id="pc-fwhm1-desc" class="input-desc">Peak 1 ' + S.symbolHtml('FWHM') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM') + '</td><td class="input-val"><input type="text" id="pc-fwhm1" inputmode="decimal" placeholder="e.g. 1" value="1"></td><td class="input-unit"></td></tr>' +
      '<tr id="pc-voigt1-wrap" style="display:none"><td class="input-desc">Peak 1 ' + S.symbolHtml('FWHM_G') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM_G') + '</td><td class="input-val"><input type="text" id="pc-fwhm1g" inputmode="decimal" placeholder="Gaussian part" value="0.5"></td><td class="input-unit"></td></tr>' +
      '<tr id="pc-voigt1l-row" style="display:none"><td class="input-desc">Peak 1 ' + S.symbolHtml('FWHM_L') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM_L') + '</td><td class="input-val"><input type="text" id="pc-fwhm1l" inputmode="decimal" placeholder="Lorentzian part" value="0.5"></td><td class="input-unit"></td></tr>' +
      inputChoiceSectionRow('Peak 2 type', inputChoiceButtonsHtml('pc-type2', [
        { value: 'gaussian', label: 'Gaussian' },
        { value: 'lorentzian', label: 'Lorentzian' },
        { value: 'voigt', label: 'Voigt' }
      ], 'gaussian', 'Peak 2 type'), 'pc-peak2-wrap') +
      '<tr id="pc-fwhm2-wrap"><td class="input-desc">Peak 2 ' + S.symbolHtml('FWHM') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM') + '</td><td class="input-val"><input type="text" id="pc-fwhm2" inputmode="decimal" placeholder="e.g. 1" value="1"></td><td class="input-unit"></td></tr>' +
      '<tr id="pc-voigt2-wrap" style="display:none"><td class="input-desc">Peak 2 ' + S.symbolHtml('FWHM_G') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM_G') + '</td><td class="input-val"><input type="text" id="pc-fwhm2g" inputmode="decimal" placeholder="Gaussian part" value="0.5"></td><td class="input-unit"></td></tr>' +
      '<tr id="pc-voigt2l-row" style="display:none"><td class="input-desc">Peak 2 ' + S.symbolHtml('FWHM_L') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM_L') + '</td><td class="input-val"><input type="text" id="pc-fwhm2l" inputmode="decimal" placeholder="Lorentzian part" value="0.5"></td><td class="input-unit"></td></tr>' +
      inputChoiceSectionRow('Convoluted type', inputChoiceButtonsHtml('pc-conv-type', [
        { value: 'gaussian', label: 'Gaussian' },
        { value: 'lorentzian', label: 'Lorentzian' },
        { value: 'voigt', label: 'Voigt' }
      ], 'gaussian', 'Convoluted type'), 'pc-conv-wrap', '', 'style="display:none"') +
      '<tr id="pc-conv-fwhm-wrap" style="display:none"><td class="input-desc">Convoluted ' + S.symbolHtml('FWHM') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM') + '</td><td class="input-val"><input type="text" id="pc-conv-fwhm" inputmode="decimal" placeholder="measured total" value="2"></td><td class="input-unit"></td></tr>' +
      '<tr id="pc-conv-voigt-wrap" style="display:none"><td class="input-desc">Convoluted ' + S.symbolHtml('FWHM_G') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM_G') + '</td><td class="input-val"><input type="text" id="pc-conv-g" inputmode="decimal" placeholder="Gaussian part" value="0.5"></td><td class="input-unit"></td></tr>' +
      '<tr id="pc-conv-voigtl-row" style="display:none"><td class="input-desc">Convoluted ' + S.symbolHtml('FWHM_L') + '</td><td class="input-sym sym-quantity">' + S.symbolHtml('FWHM_L') + '</td><td class="input-val"><input type="text" id="pc-conv-l" inputmode="decimal" placeholder="Lorentzian part" value="0.5"></td><td class="input-unit"></td></tr>' +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = '<div id="pc-results" class="pc-results-wrap"></div>';
    function toggleDeconv() {
      var mode = document.getElementById('pc-mode') && document.getElementById('pc-mode').value;
      var peak2Wrap = document.getElementById('pc-peak2-wrap');
      var convWrap = document.getElementById('pc-conv-wrap');
      if (peak2Wrap) peak2Wrap.style.display = mode === 'convolve' ? '' : 'none';
      if (convWrap) convWrap.style.display = mode === 'deconvolve' ? '' : 'none';
    }
    function toggleVoigt1() {
      var t = document.getElementById('pc-type1') && document.getElementById('pc-type1').value;
      var voigtW = document.getElementById('pc-voigt1-wrap');
      var voigtL = document.getElementById('pc-voigt1l-row');
      var fwhmW = document.getElementById('pc-fwhm1-wrap');
      var on = t === 'voigt';
      if (voigtW) voigtW.style.display = on ? '' : 'none';
      if (voigtL) voigtL.style.display = on ? '' : 'none';
      if (fwhmW) fwhmW.style.display = on ? 'none' : '';
    }
    function toggleVoigt2() {
      var t = document.getElementById('pc-type2') && document.getElementById('pc-type2').value;
      var voigtW = document.getElementById('pc-voigt2-wrap');
      var voigtL = document.getElementById('pc-voigt2l-row');
      var fwhmW = document.getElementById('pc-fwhm2-wrap');
      var on = t === 'voigt';
      if (voigtW) voigtW.style.display = on ? '' : 'none';
      if (voigtL) voigtL.style.display = on ? '' : 'none';
      if (fwhmW) fwhmW.style.display = on ? 'none' : '';
    }
    function toggleConvVoigt() {
      var t = document.getElementById('pc-conv-type') && document.getElementById('pc-conv-type').value;
      var voigtW = document.getElementById('pc-conv-voigt-wrap');
      var voigtL = document.getElementById('pc-conv-voigtl-row');
      var fwhmW = document.getElementById('pc-conv-fwhm-wrap');
      var on = t === 'voigt';
      if (voigtW) voigtW.style.display = on ? '' : 'none';
      if (voigtL) voigtL.style.display = on ? '' : 'none';
      if (fwhmW) fwhmW.style.display = on ? 'none' : '';
    }
    function updateLabels() {
      var mode = document.getElementById('pc-mode') && document.getElementById('pc-mode').value;
      var typeDesc = document.getElementById('pc-type1-desc');
      if (typeDesc) typeDesc.textContent = mode === 'deconvolve' ? 'Known peak type' : 'Peak 1 type';
      var fwhmDesc = document.getElementById('pc-fwhm1-desc');
      if (fwhmDesc) fwhmDesc.innerHTML = mode === 'deconvolve' ? 'Known peak ' + S.symbolHtml('FWHM') : 'Peak 1 ' + S.symbolHtml('FWHM');
    }
    bindChoiceButtons('pc-mode', function () { toggleDeconv(); updateLabels(); runPeakConvolution(); });
    bindChoiceButtons('pc-type1', function () { toggleVoigt1(); runPeakConvolution(); });
    bindChoiceButtons('pc-type2', function () { toggleVoigt2(); runPeakConvolution(); });
    bindChoiceButtons('pc-conv-type', function () { toggleConvVoigt(); runPeakConvolution(); });
    toggleDeconv();
    toggleVoigt1();
    toggleVoigt2();
    toggleConvVoigt();
    updateLabels();
    bindInputsToRun(['pc-fwhm1', 'pc-fwhm1g', 'pc-fwhm1l', 'pc-fwhm2', 'pc-fwhm2g', 'pc-fwhm2l', 'pc-conv-fwhm', 'pc-conv-g', 'pc-conv-l'], runPeakConvolution);
    runPeakConvolution();
    var pcReset = document.getElementById('pc-reset-defaults');
    if (pcReset) pcReset.addEventListener('click', initPeakConvolution);
  }

  function runDecay() {
    if (currentToolId !== 'decay' || !toolResultsEl) return;
    var DECAY = window.SCIRESO_DECAY;
    var decayFormulaHtml = '<p class="tool-formula">' + S.symbolHtml('N_t') + ' = ' + S.symbolHtml('N0') + ' · 2<sup>−' + S.symbolHtml('t') + '/' + S.symbolHtml('t_half') + '</sup></p><p class="tool-formula">' + S.symbolHtml('A') + ' = ' + S.symbolHtml('lambda_dec') + 'N</p>';
    var decayPanelOpts = {
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }, { view: 'plot', label: 'Plot (N)' }],
      resultsId: 'decay-results',
      equationsHtml: decayFormulaHtml,
      plotPanes: [{ dataPlot: 'plot', plotId: 'decay-plot', controlsPrefix: 'decay-plot', scaleButtons: true }]
    };
    if (!DECAY) {
      decayPanelOpts.resultsContent = resultTable(['<tr><td class="abs-desc">Decay module not loaded</td><td class="abs-sym"></td><td class="abs-val">—</td><td class="abs-unit"></td></tr>']);
      toolResultsEl.innerHTML = buildToolResultsPanel(decayPanelOpts);
      return;
    }
    var N0El = document.getElementById('decay-N0');
    var tHalfEl = document.getElementById('decay-t-half');
    var tHalfUnitEl = document.getElementById('decay-t-half-unit');
    var tEl = document.getElementById('decay-t');
    var tUnitEl = document.getElementById('decay-t-unit');
    var N0 = DECAY.parseNum(N0El ? N0El.value : null);
    var tHalf = DECAY.parseNum(tHalfEl ? tHalfEl.value : null);
    var t = DECAY.parseNum(tEl ? tEl.value : null);
    var tHalfUnit = (tHalfUnitEl && tHalfUnitEl.value != null) ? tHalfUnitEl.value : 's';
    var tUnit = (tUnitEl && tUnitEl.value != null) ? tUnitEl.value : 's';
    var r = DECAY.compute({ N0: N0, t_half: tHalf, t_half_unit: tHalfUnit, t: t, t_unit: tUnit });
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="4" class="placeholder">' + r.error + '</td></tr>');
    } else {
      rows.push(resultRowValUnit(S.meaning('N_t'), S.symbolHtml('N_t'), r.N, r.N != null && isFinite(r.N), ''));
      rows.push(resultRowValUnit(S.meaning('A'), S.symbolHtml('A'), r.A_Bq, r.A_Bq != null && isFinite(r.A_Bq), 'Bq'));
      rows.push(resultRowValUnit(S.meaning('lambda_dec'), S.symbolHtml('lambda_dec'), r.lambda_s != null ? r.lambda_s.toExponential(4) : null, r.lambda_s != null, 's⁻¹'));
      rows.push(resultRow('Half-lives elapsed', '', r.halfLivesElapsed, ''));
    }
    var tableHtml = resultTable(rows);
    var resultsContent = document.getElementById('decay-results');
    if (resultsContent) {
      resultsContent.innerHTML = tableHtml;
      var equationsContent = toolResultsEl.querySelector('.tool-equations-content');
      if (equationsContent) equationsContent.innerHTML = decayFormulaHtml;
      var plotContainer = document.getElementById('decay-plot');
      if (plotContainer) drawDecayPlot(plotContainer, N0, r.error ? null : r.tHalf_s, r, tUnit);
    } else {
      decayPanelOpts.resultsContent = tableHtml;
      toolResultsEl.innerHTML = buildToolResultsPanel(decayPanelOpts);
      var plotContainer = document.getElementById('decay-plot');
      if (plotContainer) drawDecayPlot(plotContainer, N0, r.error ? null : r.tHalf_s, r, tUnit);
    }
  }

  function getSynchVal(id) {
    var el = document.getElementById(id);
    return el ? window.SCIRESO_SYNCHROTRON.parseNum(el.value) : NaN;
  }

  function runSynchrotron() {
    var Ssyn = window.SCIRESO_SYNCHROTRON;
    var modeEl = document.getElementById('synch-mode');
    var mode = modeEl ? modeEl.value : 'bend';
    var E_GeV = getSynchVal('synch-E');
    var I_A = getSynchVal('synch-I');
    var B_T = getSynchVal('synch-B');
    var rho_m = getSynchVal('synch-rho');
    var lambda_u_nm = getSynchVal('synch-lu');
    var N_periods = getSynchVal('synch-N');
    var K = getSynchVal('synch-K');
    var harmonic = getSynchVal('synch-harm');
    var r = Ssyn.compute({
      mode: mode,
      E_GeV: E_GeV,
      current_A: I_A,
      B_T: B_T,
      rho_m: rho_m,
      lambda_u_m: isFinite(lambda_u_nm) ? lambda_u_nm * 1e-9 : NaN,
      N_periods: N_periods,
      K: K,
      harmonic: harmonic
    });
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="4" class="placeholder">' + r.error + '</td></tr>');
    } else {
      rows.push(resultRowValUnit('Beam energy', S.symbolHtml('E'), r.E_GeV, isFinite(r.E_GeV), 'GeV'));
      rows.push(resultRowValUnit('Current', 'I', r.current_A, isFinite(r.current_A), 'A'));
      rows.push(resultRowValUnit('Gamma', S.symbolHtml('gamma'), r.gamma, isFinite(r.gamma), ''));
      rows.push(resultRowValUnit('Bending radius', 'ρ', r.rho_m, isFinite(r.rho_m), 'm'));
      rows.push(resultRowValUnit('Critical energy', 'E_c', r.criticalEnergy_eV, isFinite(r.criticalEnergy_eV), 'eV'));
      rows.push(resultRowValUnit('Total SR power', 'P', r.totalPower_kW, isFinite(r.totalPower_kW), 'kW'));
      if (mode === 'undulator') {
        rows.push(resultRowValUnit('Undulator harmonic energy', 'E_n', r.undulator_Eharm_eV, isFinite(r.undulator_Eharm_eV), 'eV'));
        rows.push(resultRowValUnit('Undulator harmonic wavelength', 'λ_n', r.undulator_lambda_nm, isFinite(r.undulator_lambda_nm), 'nm'));
      }
    }
    var container = document.getElementById('synch-results');
    if (container) container.innerHTML = resultTable(rows);
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (eqEl) {
      eqEl.innerHTML =
        '<p class="tool-formula">Bend: E_c = (3/2) ħ c γ³ / ρ</p>' +
        '<p class="tool-formula">Energy loss/turn: U₀ [MeV] ≈ 0.0885 E⁴ [GeV] / ρ [m]</p>' +
        '<p class="tool-formula">Undulator: λₙ = λᵤ (1 + K²/2) / (2γ² n)</p>';
    }
  }

  function drawDecayPlot(container, N0, tHalf_s, r, tUnit) {
    var DECAY = window.SCIRESO_DECAY;
    if (!DECAY || !container) return;
    var timeLabel = DECAY.timeUnitLabel ? DECAY.timeUnitLabel(tUnit || 's') : 's';
    var pad = PAD_LARGE;
    var size = getPlotSize(container, PLOT_SLOT.cw, PLOT_SLOT.ch);
    var cw = size.cw;
    var ch = size.ch;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    if (!r || r.error || N0 <= 0 || !tHalf_s || tHalf_s <= 0) {
      var canvas = document.createElement('canvas');
      canvas.className = 'laser-plot';
      var ctx = setupHiDPICanvas(canvas, cw, ch);
      ctx.fillStyle = PLOT_BG;
      ctx.fillRect(0, 0, cw, ch);
      ctx.strokeStyle = PLOT_FG;
      ctx.fillStyle = PLOT_MUTED;
      ctx.font = FONT_TITLE;
      ctx.textAlign = 'center';
      ctx.fillText('No data', pad.L + w / 2, pad.T + h / 2);
      container.innerHTML = '';
      container.appendChild(canvas);
      return;
    }
    var rr = readAxisRange('decay-plot');
    var tMin_s = 0;
    var tMax_s = Math.max(tHalf_s * 3, 1);
    if (rr.xMin != null && isFinite(rr.xMin)) tMin_s = rr.xMin;
    if (rr.xMax != null && isFinite(rr.xMax) && rr.xMax > tMin_s) tMax_s = rr.xMax;
    var yMin = 0;
    var yMax = N0 * 1.05;
    if (rr.yMin != null && isFinite(rr.yMin)) yMin = rr.yMin;
    if (rr.yMax != null && isFinite(rr.yMax) && rr.yMax > yMin) yMax = rr.yMax;
    var points = DECAY.spectrumPointsWithHalfLife(N0, tHalf_s, tMin_s, tMax_s, 200);
    var xScale = getAxisScaleFromPlotContainer(container, 'x');
    var yScale = getAxisScaleFromPlotContainer(container, 'y');
    if (xScale === 'log' && tMin_s <= 0) tMin_s = Math.min(0.1, tMax_s / 1000) || 0.1;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.01, yMax / 1000) || 0.01;
    var timeFromSec = DECAY.timeFromSeconds ? function (t_s) { return DECAY.timeFromSeconds(t_s, tUnit); } : function (t_s) { return t_s; };
    drawUnifiedCartesianPlot(container, {
      plotXMin: tMin_s, plotXMax: tMax_s, plotYMin: yMin, plotYMax: yMax,
      xScale: xScale, yScale: yScale,
      xLabel: S.symbol('t') + ' (' + timeLabel + ')', yLabel: S.symbol('N_t'), title: S.symbol('N_t') + ' vs time',
      canvasClass: 'laser-plot',
      formatXTick: function (v) { return formatPlotNum(timeFromSec(v)); },
      drawData: function (ctx, h) {
        if (points.length < 2) return;
        var toGX = h.toGX, toGY = h.toGY;
        ctx.strokeStyle = PLOT_ACCENT;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var first = true;
        for (var i = 0; i < points.length; i++) {
          var gx = toGX(points[i].t_s);
          var gy = toGY(points[i].N);
          if (gx != null && gy != null) {
            if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
          } else { first = true; }
        }
        ctx.stroke();
      }
    });
  }

  function initDecay() {
    if (!toolResultsEl) return;
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('decay-reset-defaults') +
      toolInputTableOpen() +
      inputRow(S.meaning('N0'), S.symbolHtml('N0'), '<input type="text" id="decay-N0" inputmode="decimal" placeholder="e.g. 1e6" value="1e6">', '') +
      inputRow(S.meaning('t_half'), S.symbolHtml('t_half'), '<input type="text" id="decay-t-half" inputmode="decimal" placeholder="e.g. 10" value="10">', '<select id="decay-t-half-unit"><option value="s">s</option><option value="min">min</option><option value="h">h</option><option value="d">d</option><option value="y" selected>yr</option></select>') +
      inputRow(S.meaning('t'), S.symbolHtml('t'), '<input type="text" id="decay-t" inputmode="decimal" placeholder="e.g. 5" value="5">', '<select id="decay-t-unit"><option value="s">s</option><option value="min">min</option><option value="h">h</option><option value="d">d</option><option value="y" selected>yr</option></select>') +
      '</tbody></table></div>';
    var decayFormulaHtml = '<p class="tool-formula">' + S.symbolHtml('N_t') + ' = ' + S.symbolHtml('N0') + ' · 2<sup>−' + S.symbolHtml('t') + '/' + S.symbolHtml('t_half') + '</sup></p><p class="tool-formula">' + S.symbolHtml('A') + ' = ' + S.symbolHtml('lambda_dec') + 'N</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }, { view: 'plot', label: 'Plot (N)' }],
      resultsId: 'decay-results',
      equationsHtml: decayFormulaHtml,
      plotPanes: [{ dataPlot: 'plot', plotId: 'decay-plot', controlsPrefix: 'decay-plot', scaleButtons: true }]
    });
    bindInputsToRun(['decay-N0', 'decay-t-half', 'decay-t', 'decay-t-half-unit', 'decay-t-unit', 'decay-plot-xmin', 'decay-plot-xmax', 'decay-plot-ymin', 'decay-plot-ymax', 'plot-aspect-ratio'], runDecay);
    bindScaleButtonsInPanel(runDecay);
    bindPlotGridButton(runDecay);
    runDecay();
    setTimeout(function () { runDecay(); }, 0);
    var decayReset = document.getElementById('decay-reset-defaults');
    if (decayReset) decayReset.addEventListener('click', initDecay);
  }

  function runIdealGas() {
    var IG = window.SCIRESO_IDEAL_GAS;
    if (!IG) return;
    var container = document.getElementById('ideal-gas-results');
    var solveEl = document.getElementById('ideal-gas-solve');
    var solveFor = (solveEl && solveEl.value) || 'P';
    var PEl = document.getElementById('ideal-gas-P');
    var VEl = document.getElementById('ideal-gas-V');
    var nEl = document.getElementById('ideal-gas-n');
    var TEl = document.getElementById('ideal-gas-T');
    var PUnitEl = document.getElementById('ideal-gas-P-unit');
    var VUnitEl = document.getElementById('ideal-gas-V-unit');
    var TUnitEl = document.getElementById('ideal-gas-T-unit');
    var P = IG.parseNum(PEl && PEl.value);
    var V = IG.parseNum(VEl && VEl.value);
    var n = IG.parseNum(nEl && nEl.value);
    var T = IG.parseNum(TEl && TEl.value);
    var PUnit = (PUnitEl && PUnitEl.value) || 'Pa';
    var VUnit = (VUnitEl && VUnitEl.value) || 'L';
    var TUnit = (TUnitEl && TUnitEl.value) || 'K';
    var P_Pa = solveFor !== 'P' ? IG.toPa(P, PUnit) : NaN;
    var V_m3 = solveFor !== 'V' ? IG.toM3(V, VUnit) : NaN;
    var T_K = solveFor !== 'T' ? IG.toKelvin(T, TUnit) : NaN;
    var r = IG.compute({ solveFor: solveFor, P_Pa: P_Pa, V_m3: V_m3, n_mol: n, T_K: T_K });
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="4" class="placeholder">' + r.error + '</td></tr>');
    } else {
      rows.push(resultRowValUnit(S.meaning('P'), S.symbolHtml('P'), r.P_Pa, r.P_Pa != null && isFinite(r.P_Pa), 'Pa'));
      rows.push(resultRowValUnit(S.meaning('V'), S.symbolHtml('V'), r.V_m3, r.V_m3 != null && isFinite(r.V_m3), 'm³'));
      rows.push(resultRowValUnit(S.meaning('n'), S.symbolHtml('n'), r.n_mol, r.n_mol != null && isFinite(r.n_mol), 'mol'));
      rows.push(resultRowValUnit(S.meaning('T'), S.symbolHtml('T'), r.T_K, r.T_K != null && isFinite(r.T_K), 'K'));
    }
    var tableHtml = resultTable(rows);
    if (container) container.innerHTML = tableHtml;
  }

  function initIdealGas() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('ideal-gas-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Solve for', inputChoiceButtonsHtml('ideal-gas-solve', [
        { value: 'P', label: S.symbolHtml('P') + ' (pressure)' },
        { value: 'V', label: S.symbolHtml('V') + ' (volume)' },
        { value: 'n', label: S.symbolHtml('n') + ' (amount)' },
        { value: 'T', label: S.symbolHtml('T') + ' (temperature)' }
      ], 'P', 'Solve for')) +
      inputRow(S.meaning('P'), S.symbolHtml('P'), '<input type="text" id="ideal-gas-P" inputmode="decimal" placeholder="e.g. 101325" value="101325">', '<select id="ideal-gas-P-unit"><option value="Pa">Pa</option><option value="bar">bar</option><option value="atm" selected>atm</option><option value="mmHg">mmHg</option></select>', 'ideal-gas-row-P') +
      inputRow(S.meaning('V'), S.symbolHtml('V'), '<input type="text" id="ideal-gas-V" inputmode="decimal" placeholder="e.g. 22.4" value="22.4">', '<select id="ideal-gas-V-unit"><option value="m3">m³</option><option value="L" selected>L</option><option value="mL">mL</option></select>', 'ideal-gas-row-V') +
      inputRow(S.meaning('n'), S.symbolHtml('n'), '<input type="text" id="ideal-gas-n" inputmode="decimal" placeholder="e.g. 1" value="1">', 'mol', 'ideal-gas-row-n') +
      inputRow(S.meaning('T'), S.symbolHtml('T'), '<input type="text" id="ideal-gas-T" inputmode="decimal" placeholder="e.g. 273.15" value="273.15">', '<select id="ideal-gas-T-unit"><option value="K" selected>K</option><option value="c">°C</option></select>', 'ideal-gas-row-T') +
      '</tbody></table></div>';
    var igFormulaHtml = '<p class="tool-formula">' + S.symbolHtml('P') + S.symbolHtml('V') + ' = ' + S.symbolHtml('n') + 'R' + S.symbolHtml('T') + '</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'ideal-gas-results',
      equationsHtml: igFormulaHtml
    });
    function syncIdealGasInputRows() {
      var solveEl = document.getElementById('ideal-gas-solve');
      var s = (solveEl && solveEl.value) || 'P';
      var rP = document.getElementById('ideal-gas-row-P');
      var rV = document.getElementById('ideal-gas-row-V');
      var rn = document.getElementById('ideal-gas-row-n');
      var rT = document.getElementById('ideal-gas-row-T');
      if (rP) rP.style.display = s === 'P' ? 'none' : '';
      if (rV) rV.style.display = s === 'V' ? 'none' : '';
      if (rn) rn.style.display = s === 'n' ? 'none' : '';
      if (rT) rT.style.display = s === 'T' ? 'none' : '';
    }
    bindChoiceButtons('ideal-gas-solve', syncIdealGasInputRows);
    bindInputsToRun(['ideal-gas-solve', 'ideal-gas-P', 'ideal-gas-V', 'ideal-gas-n', 'ideal-gas-T', 'ideal-gas-P-unit', 'ideal-gas-V-unit', 'ideal-gas-T-unit'], runIdealGas);
    syncIdealGasInputRows();
    runIdealGas();
    var igReset = document.getElementById('ideal-gas-reset-defaults');
    if (igReset) igReset.addEventListener('click', initIdealGas);
  }

  function runDiffraction() {
    var typeEl = document.getElementById('diffract-type');
    var type = (typeEl && typeEl.value) || 'single';
    var rowA = document.getElementById('diffract-row-a');
    var rowD = document.getElementById('diffract-row-d');
    var rowN = document.getElementById('diffract-row-N');
    if (rowA) rowA.style.display = type === 'grating' ? 'none' : '';
    if (rowD) rowD.style.display = type === 'double' ? '' : 'none';
    if (rowN) rowN.style.display = type === 'grating' ? '' : 'none';
    var lambdaNm = parseFloat(String(document.getElementById('diffract-lambda') && document.getElementById('diffract-lambda').value).replace(/,/g, ''));
    var aUm = parseFloat(String(document.getElementById('diffract-a') && document.getElementById('diffract-a').value).replace(/,/g, ''));
    var dUm = parseFloat(String(document.getElementById('diffract-d') && document.getElementById('diffract-d').value).replace(/,/g, ''));
    var linesPerMm = parseFloat(String(document.getElementById('diffract-N') && document.getElementById('diffract-N').value).replace(/,/g, ''));
    var lambda = isFinite(lambdaNm) ? lambdaNm * 1e-9 : NaN;
    var a = isFinite(aUm) ? aUm * 1e-6 : NaN;
    var d = isFinite(dUm) ? dUm * 1e-6 : NaN;
    var N = isFinite(linesPerMm) ? linesPerMm * 1e3 : NaN;
    var container = document.getElementById('diffract-results');
    var plotContainer = document.getElementById('diffract-plot');
    var rows = [];
    if (type === 'single' && isFinite(lambda) && isFinite(a) && a > 0 && lambda > 0) {
      var theta1Min = Math.asin(lambda / a) * (180 / Math.PI);
      rows.push(resultRowValUnit('First minimum angle', S.symbolHtml('theta'), theta1Min, true, 'deg'));
      rows.push(resultRowValUnit('First minimum (small angle)', S.symbolHtml('theta') + ' ≈ ' + S.symbol('lambda') + '/' + S.symbol('length'), lambda / a * (180 / Math.PI), true, 'rad (deg)'));
    } else if (type === 'double' && isFinite(lambda) && isFinite(a) && isFinite(d) && a > 0 && d > 0 && lambda > 0) {
      var beta = lambda / d;
      var fringeSepDeg = beta * (180 / Math.PI);
      rows.push(resultRowValUnit('Angular fringe separation', S.symbolHtml('delta_theta'), fringeSepDeg, true, 'deg'));
      rows.push(resultRowValUnit('First minimum (single-slit)', S.symbolHtml('theta'), Math.asin(lambda / a) * (180 / Math.PI), true, 'deg'));
    } else if (type === 'grating' && isFinite(lambda) && isFinite(N) && N > 0 && lambda > 0) {
      var dG = 1 / N;
      var m1 = lambda / dG;
      var theta1Deg = Math.asin(m1) * (180 / Math.PI);
      rows.push(resultRowValUnit('Slit spacing', S.symbolHtml('distance'), dG * 1e6, true, 'μm'));
      rows.push(resultRowValUnit('First-order angle (m=1)', S.symbolHtml('theta'), theta1Deg, m1 <= 1, 'deg'));
    }
    if (rows.length === 0) rows.push('<tr><td colspan="4" class="placeholder">Enter valid values.</td></tr>');
    if (container) container.innerHTML = resultTable(rows);
    var th = S.symbol('theta'), la = S.symbol('lambda'), ell = S.symbol('length'), dS = S.symbol('distance'), IS = S.symbol('I'), NS = S.symbol('N');
    var eqHtml = '<p class="tool-formula">Single: ' + IS + '(' + th + ') ∝ sinc²(π' + ell + ' sin ' + th + '/' + la + '), first min sin ' + th + ' = ' + la + '/' + ell + '</p><p class="tool-formula">Double: maxima ' + dS + ' sin ' + th + ' = m' + la + '</p><p class="tool-formula">Grating: ' + dS + ' sin ' + th + ' = m' + la + ', ' + dS + ' = 1/' + NS + '</p>';
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (eqEl) eqEl.innerHTML = eqHtml;
    if (plotContainer && type !== 'grating' && isFinite(lambda) && lambda > 0 && ((type === 'single' && isFinite(a) && a > 0) || (type === 'double' && isFinite(a) && isFinite(d) && a > 0 && d > 0))) {
      var xMin = -90, xMax = 90;
      var nPts = 300;
      var pts = [];
      for (var i = 0; i <= nPts; i++) {
        var thDeg = xMin + (xMax - xMin) * i / nPts;
        var thRad = thDeg * (Math.PI / 180);
        var u = Math.PI * a / lambda * Math.sin(thRad);
        var sinc2 = u === 0 ? 1 : Math.pow(Math.sin(u) / u, 2);
        var I = sinc2;
        if (type === 'double') {
          var v = Math.PI * d / lambda * Math.sin(thRad);
          I *= Math.cos(v) * Math.cos(v);
        }
        pts.push({ x: thDeg, y: Math.max(0, I) });
      }
      var yMax = 1.05;
      var rr = readAxisRange('diffract-plot');
      if (rr.xMin != null && isFinite(rr.xMin)) xMin = rr.xMin;
      if (rr.xMax != null && isFinite(rr.xMax)) xMax = rr.xMax;
      drawUnifiedCartesianPlot(plotContainer, {
        plotXMin: xMin, plotXMax: xMax, plotYMin: 0, plotYMax: yMax,
        xScale: 'linear', yScale: 'linear',
        xLabel: S.symbol('theta') + ' (deg)', yLabel: 'Relative I',
        title: type === 'single' ? 'Single-slit intensity' : 'Double-slit intensity',
        drawData: function (ctx, h) {
          var toGX = h.toGX, toGY = h.toGY;
          ctx.strokeStyle = PLOT_ACCENT;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          var first = true;
          pts.forEach(function (p) {
            var gx = toGX(p.x);
            var gy = toGY(p.y);
            if (gx != null && gy != null) {
              if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
            }
          });
          ctx.stroke();
        }
      });
    } else if (plotContainer) {
      plotContainer.innerHTML = '';
    }
  }

  function initDiffraction() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('diffract-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Type', inputChoiceButtonsHtml('diffract-type', [
        { value: 'single', label: 'Single slit' },
        { value: 'double', label: 'Double slit' },
        { value: 'grating', label: 'Grating' }
      ], 'single', 'Geometry')) +
      inputRow('Wavelength', S.symbolHtml('lambda'), '<input type="text" id="diffract-lambda" inputmode="decimal" placeholder="e.g. 600" value="600">', 'nm') +
      inputRow('Slit width', S.symbolHtml('length'), '<input type="text" id="diffract-a" inputmode="decimal" placeholder="e.g. 1" value="1">', 'μm', 'diffract-row-a') +
      inputRow('Slit separation', S.symbolHtml('d'), '<input type="text" id="diffract-d" inputmode="decimal" placeholder="e.g. 5" value="5">', 'μm', 'diffract-row-d') +
      inputRow('Lines per mm', S.symbolHtml('N'), '<input type="text" id="diffract-N" inputmode="decimal" placeholder="e.g. 600" value="600">', 'mm⁻¹', 'diffract-row-N') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' },
        { view: 'plot', label: 'Plot (I vs θ)' }
      ],
      resultsId: 'diffract-results',
      equationsHtml: '',
      plotPanes: [{ dataPlot: 'plot', plotId: 'diffract-plot', controlsPrefix: 'diffract-plot', scaleButtons: true }]
    });
    bindChoiceButtons('diffract-type');
    bindInputsToRun(['diffract-type', 'diffract-lambda', 'diffract-a', 'diffract-d', 'diffract-N', 'diffract-plot-xmin', 'diffract-plot-xmax', 'diffract-plot-ymin', 'diffract-plot-ymax', 'plot-aspect-ratio'], runDiffraction);
    bindScaleButtonsInPanel(runDiffraction);
    bindPlotGridButton(runDiffraction);
    runDiffraction();
    var r = document.getElementById('diffract-reset-defaults');
    if (r) r.addEventListener('click', initDiffraction);
  }

  function initSynchrotron() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('synch-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Source type', inputChoiceButtonsHtml('synch-mode', [
        { value: 'bend', label: 'Bending magnet' },
        { value: 'wiggler', label: 'Wiggler' },
        { value: 'undulator', label: 'Undulator' }
      ], 'bend', 'Source type')) +
      inputRow('Beam energy', S.symbolHtml('E'), '<input type="text" id="synch-E" inputmode="decimal" placeholder="e.g. 3" value="3">', 'GeV') +
      inputRow('Beam current', S.symbolHtml('I'), '<input type="text" id="synch-I" inputmode="decimal" placeholder="e.g. 0.5" value="0.5">', 'A') +
      inputRow('Dipole field', S.symbolHtml('B'), '<input type="text" id="synch-B" inputmode="decimal" placeholder="e.g. 1.2" value="1.2">', 'T') +
      inputRow('Bend radius', S.symbolHtml('rho'), '<input type="text" id="synch-rho" inputmode="decimal" placeholder="auto from E,B">', 'm') +
      inputRow('Period', S.symbolHtml('lambda'), '<input type="text" id="synch-lu" inputmode="decimal" placeholder="e.g. 30" value="30">', 'mm', 'synch-row-lu') +
      inputRow('Periods', S.symbolHtml('N'), '<input type="text" id="synch-N" inputmode="decimal" placeholder="e.g. 100" value="100">', '', 'synch-row-N') +
      inputRow('K', 'K', '<input type="text" id="synch-K" inputmode="decimal" placeholder="e.g. 1" value="1">', '', 'synch-row-K') +
      inputRow('Harmonic', S.symbolHtml('n'), '<input type="text" id="synch-harm" inputmode="decimal" placeholder="e.g. 1" value="1">', '', 'synch-row-harm') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' }
      ],
      resultsId: 'synch-results',
      equationsHtml: ''
    });
    bindInputsToRun(['synch-mode', 'synch-E', 'synch-I', 'synch-B', 'synch-rho', 'synch-lu', 'synch-N', 'synch-K', 'synch-harm'], runSynchrotron);
    function updateSynchVisibility() {
      var mode = (document.getElementById('synch-mode') && document.getElementById('synch-mode').value) || 'bend';
      var rowLu = document.getElementById('synch-row-lu');
      var rowN = document.getElementById('synch-row-N');
      var rowK = document.getElementById('synch-row-K');
      var rowH = document.getElementById('synch-row-harm');
      var showUnd = mode === 'undulator';
      if (rowLu) rowLu.style.display = showUnd ? '' : 'none';
      if (rowN) rowN.style.display = showUnd ? '' : 'none';
      if (rowK) rowK.style.display = showUnd ? '' : 'none';
      if (rowH) rowH.style.display = showUnd ? '' : 'none';
    }
    bindChoiceButtons('synch-mode', function () {
      updateSynchVisibility();
      runSynchrotron();
    });
    updateSynchVisibility();
    runSynchrotron();
    var r = document.getElementById('synch-reset-defaults');
    if (r) r.addEventListener('click', initSynchrotron);
  }

  function initBrilliance() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('br-reset-defaults') +
      toolInputTableOpen() +
      inputRow('Flux', S.symbolHtml('Phi'), '<input type="text" id="br-flux" inputmode="decimal" placeholder="e.g. 1e13" value="1e13">', '') +
      inputRow('RMS size X', S.symbolHtml('sigma_x'), '<input type="text" id="br-sx" inputmode="decimal" placeholder="e.g. 30" value="30">', 'μm') +
      inputRow('RMS size Y', S.symbolHtml('sigma_y'), '<input type="text" id="br-sy" inputmode="decimal" placeholder="e.g. 10" value="10">', 'μm') +
      inputRow('RMS div X', S.symbolHtml('sigma_xp'), '<input type="text" id="br-sxp" inputmode="decimal" placeholder="e.g. 30" value="30">', 'μrad') +
      inputRow('RMS div Y', S.symbolHtml('sigma_yp'), '<input type="text" id="br-syp" inputmode="decimal" placeholder="e.g. 10" value="10">', 'μrad') +
      '</tbody></table>' +
      '<p class="tool-input-help">Φ: photons per second per 0.1% bandwidth. σₓ, σᵧ: RMS source sizes in x,y. σₓ′, σᵧ′: RMS angular divergences in x,y (Gaussian approximation).</p></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' }
      ],
      resultsId: 'br-results',
      equationsHtml: ''
    });
    bindInputsToRun(['br-flux', 'br-sx', 'br-sy', 'br-sxp', 'br-syp'], runBrilliance);
    runBrilliance();
    var r = document.getElementById('br-reset-defaults');
    if (r) r.addEventListener('click', initBrilliance);
  }

  function initBragg() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('bragg-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Mode', inputChoiceButtonsHtml('bragg-mode', [
        { value: 'lambda-from-theta', label: 'Solve λ from θ' },
        { value: 'theta-from-lambda', label: 'Solve θ from λ' },
        { value: 'theta-from-energy', label: 'Solve θ from E' }
      ], 'lambda-from-theta', 'Mode')) +
      inputRow('Order', S.symbolHtml('n'), '<input type="text" id="bragg-n" inputmode="decimal" placeholder="e.g. 1" value="1">', '', 'bragg-row-n') +
      inputRow('d-spacing', S.symbolHtml('d'), '<input type="text" id="bragg-d" inputmode="decimal" placeholder="e.g. 3.1356" value="3.1356">', 'Å', 'bragg-row-d') +
      inputRow('Bragg angle', S.symbolHtml('theta'), '<input type="text" id="bragg-theta" inputmode="decimal" placeholder="e.g. 15" value="15">', 'deg', 'bragg-row-theta') +
      inputRow('Wavelength', S.symbolHtml('lambda'), '<input type="text" id="bragg-lambda" inputmode="decimal" placeholder="e.g. 1" value="1">', 'Å', 'bragg-row-lambda') +
      inputRow('Photon energy', S.symbolHtml('E'), '<input type="text" id="bragg-E" inputmode="decimal" placeholder="e.g. 8" value="8">', 'keV', 'bragg-row-E') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' }
      ],
      resultsId: 'bragg-results',
      equationsHtml: ''
    });
    bindInputsToRun(['bragg-mode', 'bragg-n', 'bragg-d', 'bragg-theta', 'bragg-lambda', 'bragg-E'], runBragg);
    var modeEl = document.getElementById('bragg-mode');
    function updateBraggVisibility() {
      var mode = (modeEl && modeEl.value) || 'lambda-from-theta';
      var rowTheta = document.getElementById('bragg-row-theta');
      var rowLambda = document.getElementById('bragg-row-lambda');
      var rowE = document.getElementById('bragg-row-E');
      if (rowTheta) rowTheta.style.display = (mode === 'lambda-from-theta') ? '' : 'none';
      if (rowLambda) rowLambda.style.display = (mode === 'theta-from-lambda') ? '' : 'none';
      if (rowE) rowE.style.display = (mode === 'theta-from-energy') ? '' : 'none';
    }
    bindChoiceButtons('bragg-mode', function () {
      updateBraggVisibility();
      runBragg();
    });
    updateBraggVisibility();
    runBragg();
    var r = document.getElementById('bragg-reset-defaults');
    if (r) r.addEventListener('click', initBragg);
  }

  function runBrilliance() {
    var B = window.SCIRESO_BRILLIANCE;
    var flux = B.parseNum(document.getElementById('br-flux') && document.getElementById('br-flux').value);
    var sx = B.parseNum(document.getElementById('br-sx') && document.getElementById('br-sx').value);
    var sy = B.parseNum(document.getElementById('br-sy') && document.getElementById('br-sy').value);
    var sxp = B.parseNum(document.getElementById('br-sxp') && document.getElementById('br-sxp').value);
    var syp = B.parseNum(document.getElementById('br-syp') && document.getElementById('br-syp').value);
    var r = B.compute({
      flux_phot_s_01bw: flux,
      sigma_x_um: sx,
      sigma_y_um: sy,
      sigma_xp_urad: sxp,
      sigma_yp_urad: syp
    });
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="4" class="placeholder">' + r.error + '</td></tr>');
    } else {
      rows.push(resultRowValUnit('Flux', 'Φ', r.flux_phot_s_01bw, isFinite(r.flux_phot_s_01bw), 'photons/s/0.1% BW'));
      rows.push(resultRowValUnit('Brilliance (SI)', '', r.brilliance_SI, isFinite(r.brilliance_SI), 'photons/(s·m²·sr·0.1% BW)'));
      rows.push(resultRowValUnit('Brilliance (mm·mrad units)', '', r.brilliance_common, isFinite(r.brilliance_common), 'photons/(s·mm²·mrad²·0.1% BW)'));
    }
    var container = document.getElementById('br-results');
    if (container) container.innerHTML = resultTable(rows);
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (eqEl) {
      eqEl.innerHTML =
        '<p class="tool-formula">B = Φ / (A · Ω), with A = 2πσₓσᵧ, Ω = 2πσₓ′σᵧ′.</p>';
    }
  }

  function runBragg() {
    var B = window.SCIRESO_BRAGG;
    var mode = (document.getElementById('bragg-mode') && document.getElementById('bragg-mode').value) || 'lambda-from-theta';
    var n = B.parseNum(document.getElementById('bragg-n') && document.getElementById('bragg-n').value);
    var d = B.parseNum(document.getElementById('bragg-d') && document.getElementById('bragg-d').value);
    var theta = B.parseNum(document.getElementById('bragg-theta') && document.getElementById('bragg-theta').value);
    var lambda = B.parseNum(document.getElementById('bragg-lambda') && document.getElementById('bragg-lambda').value);
    var E = B.parseNum(document.getElementById('bragg-E') && document.getElementById('bragg-E').value);
    var r = B.compute({
      mode: mode,
      n: n,
      d_A: d,
      theta_deg: theta,
      lambda_A: lambda,
      E_keV: E
    });
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="4" class="placeholder">' + r.error + '</td></tr>');
    } else {
      rows.push(resultRowValUnit('Order', S.symbolHtml('n'), r.n, isFinite(r.n), ''));
      rows.push(resultRowValUnit('d-spacing', S.symbolHtml('d'), r.d_A, isFinite(r.d_A), 'Å'));
      rows.push(resultRowValUnit('Bragg angle', S.symbolHtml('theta'), r.theta_deg, isFinite(r.theta_deg), 'deg'));
      rows.push(resultRowValUnit('Wavelength', S.symbolHtml('lambda'), r.lambda_A, isFinite(r.lambda_A), 'Å'));
      rows.push(resultRowValUnit('Photon energy', S.symbolHtml('E'), r.E_keV, isFinite(r.E_keV), 'keV'));
    }
    var container = document.getElementById('bragg-results');
    if (container) container.innerHTML = resultTable(rows);
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (eqEl) {
      eqEl.innerHTML =
        '<p class="tool-formula">nλ = 2d sin θ</p>' +
        '<p class="tool-formula">λ = hc / E</p>';
    }
  }

  function runRefraction() {
    var n1 = parseFloat(String(document.getElementById('refract-n1') && document.getElementById('refract-n1').value).replace(/,/g, ''));
    var n2 = parseFloat(String(document.getElementById('refract-n2') && document.getElementById('refract-n2').value).replace(/,/g, ''));
    var theta1Deg = parseFloat(String(document.getElementById('refract-theta1') && document.getElementById('refract-theta1').value).replace(/,/g, ''));
    var container = document.getElementById('refract-results');
    var rows = [];
    if (isFinite(n1) && isFinite(n2) && n1 > 0 && n2 > 0 && isFinite(theta1Deg)) {
      var sin1 = Math.sin(theta1Deg * Math.PI / 180);
      var sin2 = (n1 / n2) * sin1;
      var theta2Deg = Math.asin(Math.max(-1, Math.min(1, sin2))) * (180 / Math.PI);
      var tir = n1 > n2 && sin2 > 1;
      rows.push(resultRowValUnit(S.meaning('theta_2'), S.symbolHtml('theta_2'), theta2Deg, !tir, 'deg'));
      if (tir) rows.push('<tr><td colspan="4" class="placeholder">Total internal reflection (' + S.symbol('theta_1') + ' &gt; ' + S.symbol('theta_c') + ')</td></tr>');
      var thetaCDeg = n1 > n2 ? Math.asin(n2 / n1) * (180 / Math.PI) : null;
      if (thetaCDeg != null) rows.push(resultRowValUnit(S.meaning('theta_c'), S.symbolHtml('theta_c'), thetaCDeg, true, 'deg'));
    } else {
      rows.push('<tr><td colspan="4" class="placeholder">Enter ' + S.symbol('n_1') + ', ' + S.symbol('n_2') + ', ' + S.symbol('theta_1') + '.</td></tr>');
    }
    if (container) container.innerHTML = resultTable(rows);
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    var n1s = S.symbol('n_1'), n2s = S.symbol('n_2'), t1s = S.symbol('theta_1'), t2s = S.symbol('theta_2'), tcs = S.symbol('theta_c');
    if (eqEl) eqEl.innerHTML = '<p class="tool-formula">' + n1s + ' sin ' + t1s + ' = ' + n2s + ' sin ' + t2s + '</p><p class="tool-formula">' + tcs + ' = arcsin(' + n2s + '/' + n1s + ') when ' + n1s + ' &gt; ' + n2s + '</p>';
  }

  function initRefraction() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('refract-reset-defaults') +
      toolInputTableOpen() +
      inputRow(S.meaning('n_1'), S.symbolHtml('n_1'), '<input type="text" id="refract-n1" inputmode="decimal" placeholder="e.g. 1" value="1">', '') +
      inputRow(S.meaning('n_2'), S.symbolHtml('n_2'), '<input type="text" id="refract-n2" inputmode="decimal" placeholder="e.g. 1.5" value="1.5">', '') +
      inputRow(S.meaning('theta_1'), S.symbolHtml('theta_1'), '<input type="text" id="refract-theta1" inputmode="decimal" placeholder="e.g. 30" value="30">', 'deg') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'refract-results',
      equationsHtml: '<p class="tool-formula">' + S.symbol('n_1') + ' sin ' + S.symbol('theta_1') + ' = ' + S.symbol('n_2') + ' sin ' + S.symbol('theta_2') + '</p>'
    });
    bindInputsToRun(['refract-n1', 'refract-n2', 'refract-theta1'], runRefraction);
    runRefraction();
    var r = document.getElementById('refract-reset-defaults');
    if (r) r.addEventListener('click', initRefraction);
  }

  function runThinLens() {
    var typeEl = document.getElementById('thinlens-type');
    var type = (typeEl && typeEl.value) || 'lens';
    var convEl = document.getElementById('thinlens-conv');
    var converging = (convEl && convEl.value) === 'converging';
    var f = parseFloat(String(document.getElementById('thinlens-f') && document.getElementById('thinlens-f').value).replace(/,/g, ''));
    var s = parseFloat(String(document.getElementById('thinlens-s') && document.getElementById('thinlens-s').value).replace(/,/g, ''));
    var container = document.getElementById('thinlens-results');
    var rows = [];
    if (isFinite(f) && f !== 0 && isFinite(s)) {
      var fSigned = converging ? Math.abs(f) : -Math.abs(f);
      var sPrime = 1 / (1 / fSigned - 1 / s);
      var m = -sPrime / s;
      rows.push(resultRowValUnit(S.meaning('s_prime'), S.symbolHtml('s_prime'), sPrime, true, 'cm'));
      rows.push(resultRowValUnit(S.meaning('m_mag'), S.symbolHtml('m_mag'), m, true, ''));
      rows.push(resultRowValUnit('Image type', '', sPrime > 0 ? 'Real' : 'Virtual', true, ''));
    } else {
      rows.push('<tr><td colspan="4" class="placeholder">Enter ' + S.symbol('f_focal') + ' and ' + S.symbol('s_obj') + ' (non-zero).</td></tr>');
    }
    if (container) container.innerHTML = resultTable(rows);
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    var fs = S.symbol('f_focal'), ss = S.symbol('s_obj'), sps = S.symbol('s_prime'), ms = S.symbol('m_mag');
    if (eqEl) eqEl.innerHTML = '<p class="tool-formula">1/' + ss + ' + 1/' + sps + ' = 1/' + fs + '</p><p class="tool-formula">' + ms + ' = −' + sps + '/' + ss + '</p><p class="tool-formula">Converging: ' + fs + ' &gt; 0, diverging: ' + fs + ' &lt; 0</p>';
  }

  function initThinLens() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('thinlens-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Type', inputChoiceButtonsHtml('thinlens-type', [
        { value: 'lens', label: 'Lens' },
        { value: 'mirror', label: 'Mirror' }
      ], 'lens', 'Type')) +
      inputChoiceSectionRow('Kind', inputChoiceButtonsHtml('thinlens-conv', [
        { value: 'converging', label: 'Converging' },
        { value: 'diverging', label: 'Diverging' }
      ], 'converging', 'Converging / diverging')) +
      inputRow(S.meaning('f_focal'), S.symbolHtml('f_focal'), '<input type="text" id="thinlens-f" inputmode="decimal" placeholder="e.g. 20" value="20">', 'cm') +
      inputRow(S.meaning('s_obj'), S.symbolHtml('s_obj'), '<input type="text" id="thinlens-s" inputmode="decimal" placeholder="e.g. 30" value="30">', 'cm') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'thinlens-results',
      equationsHtml: '<p class="tool-formula">1/' + S.symbol('s_obj') + ' + 1/' + S.symbol('s_prime') + ' = 1/' + S.symbol('f_focal') + '</p>'
    });
    bindChoiceButtons('thinlens-type');
    bindChoiceButtons('thinlens-conv');
    bindInputsToRun(['thinlens-type', 'thinlens-conv', 'thinlens-f', 'thinlens-s'], runThinLens);
    runThinLens();
    var r = document.getElementById('thinlens-reset-defaults');
    if (r) r.addEventListener('click', initThinLens);
  }

  function runHeisenberg() {
    var pairEl = document.getElementById('heisenberg-pair');
    var pair = (pairEl && pairEl.value) || 'xp';
    var hbar = 1.054571817e-34;
    var dx = parseFloat(String(document.getElementById('heisenberg-dx') && document.getElementById('heisenberg-dx').value).replace(/,/g, ''));
    var dp = parseFloat(String(document.getElementById('heisenberg-dp') && document.getElementById('heisenberg-dp').value).replace(/,/g, ''));
    var dE = parseFloat(String(document.getElementById('heisenberg-dE') && document.getElementById('heisenberg-dE').value).replace(/,/g, ''));
    var dt = parseFloat(String(document.getElementById('heisenberg-dt') && document.getElementById('heisenberg-dt').value).replace(/,/g, ''));
    var container = document.getElementById('heisenberg-results');
    var rows = [];
    var dxs = 'Δ' + S.symbol('x'), dps = 'Δ' + S.symbol('p'), dEs = 'Δ' + S.symbol('E'), dts = 'Δ' + S.symbol('t');
    if (pair === 'xp') {
      if (isFinite(dx) && dx > 0) {
        var minDp = hbar / (2 * dx);
        rows.push(resultRowValUnit('Minimum ' + dps, dps + ' ≥ ℏ/(2' + dxs + ')', minDp, true, 'kg·m/s'));
      } else if (isFinite(dp) && dp > 0) {
        var minDx = hbar / (2 * dp);
        rows.push(resultRowValUnit('Minimum ' + dxs, dxs + ' ≥ ℏ/(2' + dps + ')', minDx, true, 'm'));
      } else {
        rows.push('<tr><td colspan="4" class="placeholder">Enter ' + dxs + ' (m) or ' + dps + ' (kg·m/s).</td></tr>');
      }
    } else {
      if (isFinite(dE) && dE > 0) {
        var dEJ = dE * 1.602176634e-19;
        var minDt = hbar / (2 * dEJ);
        rows.push(resultRowValUnit('Minimum ' + dts, dts + ' ≥ ℏ/(2' + dEs + ')', minDt, true, 's'));
      } else if (isFinite(dt) && dt > 0) {
        var minDEJ = hbar / (2 * dt);
        var minDEeV = minDEJ / 1.602176634e-19;
        rows.push(resultRowValUnit('Minimum ' + dEs, dEs + ' ≥ ℏ/(2' + dts + ')', minDEeV, true, 'eV'));
      } else {
        rows.push('<tr><td colspan="4" class="placeholder">Enter ' + dEs + ' (eV) or ' + dts + ' (s).</td></tr>');
      }
    }
    if (container) container.innerHTML = resultTable(rows);
    var eqEl = toolResultsEl && toolResultsEl.querySelector('.tool-equations-content');
    if (eqEl) eqEl.innerHTML = '<p class="tool-formula">' + dxs + ' ' + dps + ' ≥ ℏ/2</p><p class="tool-formula">' + dEs + ' ' + dts + ' ≥ ℏ/2</p><p class="tool-formula">ℏ = 1.055×10⁻³⁴ J·s</p>';
  }

  function initHeisenberg() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('heisenberg-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Uncertainty pair', inputChoiceButtonsHtml('heisenberg-pair', [
        { value: 'xp', label: ('Δ' + S.symbol('x')) + ', ' + ('Δ' + S.symbol('p')) },
        { value: 'Et', label: ('Δ' + S.symbol('E')) + ', ' + ('Δ' + S.symbol('t')) }
      ], 'xp', 'Uncertainty pair')) +
      inputRow('Position uncertainty', 'Δ' + S.symbol('x'), '<input type="text" id="heisenberg-dx" inputmode="decimal" placeholder="e.g. 1e-10" value="1e-10">', 'm', 'heisenberg-row-dx') +
      inputRow('Momentum uncertainty', 'Δ' + S.symbol('p'), '<input type="text" id="heisenberg-dp" inputmode="decimal" placeholder="e.g. 1e-24" value="">', 'kg·m/s', 'heisenberg-row-dp') +
      inputRow('Energy uncertainty', 'Δ' + S.symbol('E'), '<input type="text" id="heisenberg-dE" inputmode="decimal" placeholder="e.g. 1" value="1">', 'eV', 'heisenberg-row-dE') +
      inputRow('Time uncertainty', 'Δ' + S.symbol('t'), '<input type="text" id="heisenberg-dt" inputmode="decimal" placeholder="e.g. 1e-15" value="">', 's', 'heisenberg-row-dt') +
      '</tbody></table></div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'results', label: 'Results' }, { view: 'equations', label: 'Equations' }],
      resultsId: 'heisenberg-results',
      equationsHtml: '<p class="tool-formula">' + ('Δ' + S.symbol('x')) + ' ' + ('Δ' + S.symbol('p')) + ' ≥ ℏ/2</p><p class="tool-formula">' + ('Δ' + S.symbol('E')) + ' ' + ('Δ' + S.symbol('t')) + ' ≥ ℏ/2</p>'
    });
    function toggleHeisenbergInputRows() {
      var pairEl = document.getElementById('heisenberg-pair');
      var pair = (pairEl && pairEl.value) || 'xp';
      var showXp = pair === 'xp';
      var rdx = document.getElementById('heisenberg-row-dx');
      var rdp = document.getElementById('heisenberg-row-dp');
      var rdE = document.getElementById('heisenberg-row-dE');
      var rdt = document.getElementById('heisenberg-row-dt');
      if (rdx) rdx.style.display = showXp ? '' : 'none';
      if (rdp) rdp.style.display = showXp ? '' : 'none';
      if (rdE) rdE.style.display = showXp ? 'none' : '';
      if (rdt) rdt.style.display = showXp ? 'none' : '';
    }
    bindChoiceButtons('heisenberg-pair', toggleHeisenbergInputRows);
    bindInputsToRun(['heisenberg-pair', 'heisenberg-dx', 'heisenberg-dp', 'heisenberg-dE', 'heisenberg-dt'], runHeisenberg);
    toggleHeisenbergInputRows();
    runHeisenberg();
    var r = document.getElementById('heisenberg-reset-defaults');
    if (r) r.addEventListener('click', initHeisenberg);
  }

  function parseNumberList(str) {
    if (!str || typeof str !== 'string') return [];
    var parts = str.trim().split(/[\n,\s]+/).filter(function (p) { return p.length > 0; });
    var out = [];
    for (var i = 0; i < parts.length; i++) {
      var n = parseFloat(parts[i].replace(/,/g, ''));
      if (isFinite(n)) out.push(n);
    }
    return out;
  }

  function parseCsvToXY(text, skipHeader) {
    var lines = text.trim().split(/\r?\n/).filter(function (l) { return l.trim().length > 0; });
    if (lines.length === 0) return { x: [], y: [] };
    var start = (skipHeader && lines.length > 1) ? 1 : 0;
    var x = [], y = [];
    for (var i = start; i < lines.length; i++) {
      var cells = lines[i].split(/[\t,]/).map(function (c) { return c.trim(); });
      var a = parseFloat(cells[0]);
      var b = parseFloat(cells[1]);
      if (isFinite(a) && isFinite(b)) {
        x.push(a);
        y.push(b);
      }
    }
    return { x: x, y: y };
  }

  function dataPlotClearFileLoadMessage() {
    var el = document.getElementById('dp-results');
    if (el && el.querySelector('.dp-load-file-msg')) el.innerHTML = '';
  }

  function dataPlotShowFileLoadMessage(msg) {
    var el = document.getElementById('dp-results');
    if (!el) {
      window.alert(msg);
      return;
    }
    el.innerHTML = '';
    var p = document.createElement('p');
    p.className = 'tool-muted dp-load-file-msg';
    p.textContent = msg;
    el.appendChild(p);
  }

  /** @returns {'text-grid'|'text-try'|'h5'|'raster-image'|'unsupported'} */
  function dataPlotFileLoadKind(nameLower) {
    if (!nameLower) return 'unsupported';
    if (/\.(png|jpe?g|webp|gif|bmp)$/i.test(nameLower)) return 'raster-image';
    if (/\.h5$/i.test(nameLower)) return 'h5';
    if (/\.(csv|txt|dat)$/i.test(nameLower)) return 'text-grid';
    if (nameLower.indexOf('.') < 0) return 'text-try';
    return 'unsupported';
  }

  function drawDataPlotMarker(ctx, gx, gy, typeIndex, color) {
    var r = DATA_PLOT_MARKER_RADIUS;
    var types = ['circle', 'square', 'triangle', 'diamond', 'plus'];
    var t = types[typeIndex % types.length];
    var fillColor = hexToRgba(color, 0.65);
    var strokeColor = hexToRgba(color, 0.82);
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1;
    if (t === 'circle') {
      ctx.beginPath();
      ctx.arc(gx, gy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (t === 'square') {
      ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
      ctx.strokeRect(gx - r, gy - r, r * 2, r * 2);
    } else if (t === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(gx, gy - r);
      ctx.lineTo(gx + r, gy + r);
      ctx.lineTo(gx - r, gy + r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (t === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(gx, gy - r);
      ctx.lineTo(gx + r, gy);
      ctx.lineTo(gx, gy + r);
      ctx.lineTo(gx - r, gy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(gx - r, gy);
      ctx.lineTo(gx + r, gy);
      ctx.moveTo(gx, gy - r);
      ctx.lineTo(gx, gy + r);
      ctx.stroke();
    }
  }

  function hexToRgba(hex, alpha) {
    var m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!m) return hex;
    return 'rgba(' + parseInt(m[1], 16) + ',' + parseInt(m[2], 16) + ',' + parseInt(m[3], 16) + ',' + alpha + ')';
  }

  function interpolateHexColor(hex0, hex1, t) {
    var m0 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex0);
    var m1 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex1);
    if (!m0 || !m1) return hex0;
    var r = Math.round(parseInt(m0[1], 16) * (1 - t) + parseInt(m1[1], 16) * t);
    var g = Math.round(parseInt(m0[2], 16) * (1 - t) + parseInt(m1[2], 16) * t);
    var b = Math.round(parseInt(m0[3], 16) * (1 - t) + parseInt(m1[3], 16) * t);
    return '#' + [r, g, b].map(function (x) { var s = Math.max(0, Math.min(255, x)).toString(16); return s.length === 1 ? '0' + s : s; }).join('');
  }

  function sampleColorScale(scale, n) {
    if (!scale || scale.length === 0 || n <= 0) return scale || [];
    if (n === 1) {
      var p = 0.5;
      var idx = p * (scale.length - 1);
      var i0 = Math.floor(idx);
      var i1 = Math.min(i0 + 1, scale.length - 1);
      return [interpolateHexColor(scale[i0], scale[i1], idx - i0)];
    }
    var out = [];
    for (var i = 0; i < n; i++) {
      var p = (i + 1) / (n + 1);
      var idx = p * (scale.length - 1);
      var i0 = Math.floor(idx);
      var i1 = Math.min(i0 + 1, scale.length - 1);
      var frac = idx - i0;
      out.push(interpolateHexColor(scale[i0], scale[i1], frac));
    }
    return out;
  }

  function solveLinearSystem(A, b) {
    var n = b.length;
    var a = A.map(function (row) { return row.slice(); });
    var x = b.slice();
    for (var col = 0; col < n; col++) {
      var maxRow = col;
      for (var r = col + 1; r < n; r++) { if (Math.abs(a[r][col]) > Math.abs(a[maxRow][col])) maxRow = r; }
      var tmp = a[col]; a[col] = a[maxRow]; a[maxRow] = tmp;
      var t = x[col]; x[col] = x[maxRow]; x[maxRow] = t;
      var pivot = a[col][col];
      if (Math.abs(pivot) < 1e-14) return null;
      for (var j = col; j < n; j++) a[col][j] /= pivot;
      x[col] /= pivot;
      for (var r = 0; r < n; r++) {
        if (r === col) continue;
        var f = a[r][col];
        for (var j = col; j < n; j++) a[r][j] -= f * a[col][j];
        x[r] -= f * x[col];
      }
    }
    return x;
  }

  function fitPolynomial(x, y, degree) {
    var n = x.length;
    if (n <= degree) return null;
    var i;
    for (i = 0; i < n; i++) if (!isFinite(x[i]) || !isFinite(y[i])) return null;
    var xMean = 0;
    for (i = 0; i < n; i++) xMean += x[i];
    xMean /= n;
    var xC = [];
    for (i = 0; i < n; i++) xC[i] = x[i] - xMean;
    var np = degree + 1;
    var XtX = [];
    for (var j = 0; j < np; j++) {
      XtX[j] = [];
      for (var k = 0; k < np; k++) {
        var sum = 0;
        for (i = 0; i < n; i++) sum += Math.pow(xC[i], j + k);
        XtX[j][k] = sum;
      }
    }
    var Xty = [];
    for (j = 0; j < np; j++) {
      var sum = 0;
      for (i = 0; i < n; i++) sum += Math.pow(xC[i], j) * y[i];
      Xty[j] = sum;
    }
    var cCentered = solveLinearSystem(XtX, Xty);
    if (!cCentered) return null;
    function binom(u, v) {
      if (v < 0 || v > u) return 0;
      var r = 1;
      for (var t = 0; t < v; t++) r *= (u - t) / (t + 1);
      return r;
    }
    var coeffs = [];
    for (var k = 0; k < np; k++) {
      var ak = 0;
      for (var j = k; j < np; j++) ak += cCentered[j] * binom(j, k) * Math.pow(-xMean, j - k);
      coeffs[k] = ak;
    }
    var residuals = [];
    for (i = 0; i < n; i++) {
      var fit = 0;
      for (j = 0; j < np; j++) fit += coeffs[j] * Math.pow(x[i], j);
      residuals.push(y[i] - fit);
    }
    var ss = 0;
    for (i = 0; i < n; i++) ss += residuals[i] * residuals[i];
    var sigma2 = n > np ? ss / (n - np) : 0;
    var invXtX = [];
    for (j = 0; j < np; j++) {
      invXtX[j] = [];
      for (var k = 0; k < np; k++) invXtX[j][k] = (j === k) ? 1 : 0;
    }
    for (var col = 0; col < np; col++) {
      var a = XtX.map(function (row) { return row.slice(); });
      var b = invXtX.map(function (row) { return row[col]; });
      var sol = solveLinearSystem(a, b);
      if (!sol) return { coeffs: coeffs, errors: coeffs.map(function () { return NaN; }) };
      for (j = 0; j < np; j++) invXtX[j][col] = sol[j];
    }
    var errors = [];
    for (k = 0; k < np; k++) {
      var varK = 0;
      for (var ii = 0; ii < np; ii++) {
        for (var jj = 0; jj < np; jj++) {
          if (ii >= k && jj >= k)
            varK += binom(ii, k) * Math.pow(-xMean, ii - k) * binom(jj, k) * Math.pow(-xMean, jj - k) * invXtX[ii][jj];
        }
      }
      errors[k] = Math.sqrt(sigma2 * Math.max(0, varK));
    }
    return { coeffs: coeffs, errors: errors };
  }

  function computeDataPlotFit(fitType, x, y) {
    if (!x || !y || x.length !== y.length || x.length < 2) return null;
    var n = x.length;
    if (fitType === 'mean' || fitType === 'constant') {
      var sum = 0;
      for (var i = 0; i < n; i++) sum += y[i];
      var c = sum / n;
      var ss = 0;
      for (var i = 0; i < n; i++) ss += (y[i] - c) * (y[i] - c);
      var se = n > 1 ? Math.sqrt(ss / (n * (n - 1))) : 0;
      return { type: 'mean', coeffs: [c], errors: [se] };
    }
    if (fitType === 'line' || fitType === 'poly1') return Object.assign({ type: 'line' }, fitPolynomial(x, y, 1));
    if (fitType === 'poly2') return Object.assign({ type: 'poly2' }, fitPolynomial(x, y, 2));
    if (fitType === 'poly3') return Object.assign({ type: 'poly3' }, fitPolynomial(x, y, 3));
    return null;
  }

  function evaluateFit(fitResult, x) {
    if (!fitResult || !fitResult.coeffs) return null;
    var c = fitResult.coeffs;
    var v = 0;
    for (var j = 0; j < c.length; j++) v += c[j] * Math.pow(x, j);
    return v;
  }

  function formatFitNum(x) {
    if (x === undefined || x === null || !isFinite(x)) return '—';
    if (x === 0) return '0';
    return Number(x).toPrecision(5);
  }

  function drawDataPlot(container, seriesList, range, options) {
    if (!container) return;
    seriesList = seriesList && Array.isArray(seriesList) ? seriesList : [];
    options = options || {};
    var plotColors = options.colors && options.colors.length ? options.colors : DATA_PLOT_SERIES_COLORS;
    var xLabel = (options.xLabel != null && String(options.xLabel).trim() !== '') ? String(options.xLabel).trim() : 'X';
    var yLabel = (options.yLabel != null && String(options.yLabel).trim() !== '') ? String(options.yLabel).trim() : 'Y';
    var legendPosition = (options.legendPosition != null && options.legendPosition !== 'none') ? options.legendPosition : 'none';
    var showLegend = legendPosition !== 'none';
    var datasetNames = options.datasetNames || [];
    var title = (options.title != null && String(options.title).trim() !== '') ? String(options.title).trim() : '';
    var padEmpty = { L: PAD_LARGE.L, R: PAD_LARGE.R, T: PAD_LARGE.T, B: PAD_LARGE.B };
    var size = getPlotSize(container, PLOT_SLOT.cw, PLOT_SLOT.ch);
    var cw = size.cw;
    var ch = size.ch;
    var wEmpty = cw - padEmpty.L - padEmpty.R;
    var hEmpty = ch - padEmpty.T - padEmpty.B;
    var xMin = Infinity, xMax = -Infinity, yMin = Infinity, yMax = -Infinity;
    for (var s = 0; s < seriesList.length; s++) {
      var xs = seriesList[s].x, ys = seriesList[s].y;
      var nn = Math.min(xs.length, ys.length);
      for (var i = 0; i < nn; i++) {
        if (isFinite(xs[i]) && isFinite(ys[i])) {
          if (xs[i] < xMin) xMin = xs[i];
          if (xs[i] > xMax) xMax = xs[i];
          if (ys[i] < yMin) yMin = ys[i];
          if (ys[i] > yMax) yMax = ys[i];
        }
      }
    }
    if (!isFinite(xMin) || !isFinite(xMax) || !isFinite(yMin) || !isFinite(yMax)) {
      container.innerHTML = '';
      var canvas = document.createElement('canvas');
      canvas.className = 'data-plot';
      var ctx = setupHiDPICanvas(canvas, cw, ch);
      ctx.fillStyle = PLOT_BG;
      ctx.fillRect(0, 0, cw, ch);
      ctx.font = FONT_TITLE;
      ctx.textAlign = 'center';
      ctx.fillStyle = PLOT_MUTED;
      ctx.fillText('No data', padEmpty.L + wEmpty / 2, padEmpty.T + hEmpty / 2);
      container.appendChild(canvas);
      return;
    }
    var rr = range || {};
    var xScale = (rr.xScale === 'log') ? 'log' : 'linear';
    var yScale = (rr.yScale === 'log') ? 'log' : 'linear';
    if (xScale === 'log' && (xMin <= 0 || xMax <= 0)) {
      var xMinPos = Infinity, xMaxPos = -Infinity;
      for (var si = 0; si < seriesList.length; si++) {
        for (var ji = 0; ji < seriesList[si].x.length; ji++) {
          var v = seriesList[si].x[ji];
          if (v > 0) { if (v < xMinPos) xMinPos = v; if (v > xMaxPos) xMaxPos = v; }
        }
      }
      if (isFinite(xMinPos) && isFinite(xMaxPos)) { xMin = xMinPos; xMax = xMaxPos; }
      else { xMin = 0.1; xMax = 10; }
    }
    if (yScale === 'log' && (yMin <= 0 || yMax <= 0)) {
      var yMinPos = Infinity, yMaxPos = -Infinity;
      for (var si = 0; si < seriesList.length; si++) {
        for (var ji = 0; ji < seriesList[si].y.length; ji++) {
          var v = seriesList[si].y[ji];
          if (v > 0) { if (v < yMinPos) yMinPos = v; if (v > yMaxPos) yMaxPos = v; }
        }
      }
      if (isFinite(yMinPos) && isFinite(yMaxPos)) { yMin = yMinPos; yMax = yMaxPos; }
      else { yMin = 0.1; yMax = 10; }
    }
    var userXBoth = (rr.xMin != null && isFinite(rr.xMin)) && (rr.xMax != null && isFinite(rr.xMax));
    var userYBoth = (rr.yMin != null && isFinite(rr.yMin)) && (rr.yMax != null && isFinite(rr.yMax));
    if (rr.xMin != null && isFinite(rr.xMin)) xMin = rr.xMin;
    if (rr.xMax != null && isFinite(rr.xMax)) xMax = rr.xMax;
    if (rr.yMin != null && isFinite(rr.yMin)) yMin = rr.yMin;
    if (rr.yMax != null && isFinite(rr.yMax)) yMax = rr.yMax;
    if (xMax < xMin) { var swapX = xMin; xMin = xMax; xMax = swapX; }
    if (yMax < yMin) { var swapY = yMin; yMin = yMax; yMax = swapY; }
    if (xScale === 'log' && xMin <= 0) xMin = Math.min(0.1, xMax / 1000) || 0.1;
    if (xScale === 'log' && xMax <= 0) xMax = Math.max(10, xMin * 1000) || 10;
    if (yScale === 'log' && yMin <= 0) yMin = Math.min(0.1, yMax / 1000) || 0.1;
    if (yScale === 'log' && yMax <= 0) yMax = Math.max(10, yMin * 1000) || 10;
    var xSpan = xMax - xMin || 1;
    var ySpan = yMax - yMin || 1;
    var userX = userXBoth;
    var userY = userYBoth;
    var margin = 0.02;
    var skipNiceX = !userX;
    var skipNiceY = !userY;
    var plotXMin, plotXMax, plotYMin, plotYMax;
    if (userX) {
      plotXMin = xScale === 'log' && xMin <= 0 ? (Math.min(0.1, xMax / 1000) || 0.1) : xMin;
      plotXMax = xScale === 'log' && xMax <= 0 ? (Math.max(10, xMin * 1000) || 10) : xMax;
    } else {
      if (xScale === 'log') {
        plotXMin = xMin * Math.pow(xMax / xMin, -margin);
        plotXMax = xMax * Math.pow(xMax / xMin, margin);
      } else {
        plotXMin = xMin - xSpan * margin;
        plotXMax = xMax + xSpan * margin;
        if (!skipNiceX) {
          var xNice = uniqSorted(niceTicks(plotXMin, plotXMax, 8));
          if (xNice.length >= 2) {
            var xStep = xNice[1] - xNice[0];
            plotXMin = xStep * Math.floor(plotXMin / xStep);
            plotXMax = xStep * Math.ceil(plotXMax / xStep);
          }
        }
      }
    }
    if (userY) {
      plotYMin = yScale === 'log' && yMin <= 0 ? (Math.min(0.1, yMax / 1000) || 0.1) : yMin;
      plotYMax = yScale === 'log' && yMax <= 0 ? (Math.max(10, yMin * 1000) || 10) : yMax;
    } else {
      if (yScale === 'log') {
        plotYMin = yMin * Math.pow(yMax / yMin, -margin);
        plotYMax = yMax * Math.pow(yMax / yMin, margin);
      } else {
        plotYMin = yMin - ySpan * margin;
        plotYMax = yMax + ySpan * margin;
        if (!skipNiceY) {
          var yNice = uniqSorted(niceTicks(plotYMin, plotYMax, 8));
          if (yNice.length >= 2) {
            var yStep = yNice[1] - yNice[0];
            plotYMin = yStep * Math.floor(plotYMin / yStep);
            plotYMax = yStep * Math.ceil(plotYMax / yStep);
          }
        }
      }
    }
    var plotXSpan = plotXMax - plotXMin || 1;
    var plotYSpan = plotYMax - plotYMin || 1;
    var colors = plotColors;
    var dashes = DATA_PLOT_LINE_DASHES;
    var lineStyleIndex = [];
    var markerStyleIndex = [];
    var nextLine = 0, nextMarker = 0;
    for (var s = 0; s < seriesList.length; s++) {
      var mode = seriesList[s].displayMode || 'line';
      if (mode === 'line' || mode === 'both') lineStyleIndex[s] = nextLine++;
      if (mode === 'marker' || mode === 'both') markerStyleIndex[s] = nextMarker++;
    }
    var markerR = DATA_PLOT_MARKER_RADIUS;
    drawUnifiedCartesianPlot(container, {
      plotXMin: plotXMin, plotXMax: plotXMax, plotYMin: plotYMin, plotYMax: plotYMax,
      xScale: xScale, yScale: yScale, xLabel: xLabel, yLabel: yLabel, title: title,
      canvasClass: 'data-plot',
      extraPadR: 0,
      suppressMajorGrid: false,
      drawData: function (ctx, h) {
        var toGX = h.toGX, toGY = h.toGY, pad = h.pad, w = h.w, h_ = h.h, ch = h.ch, cw = h.cw;
        var gyZero = (yScale === 'log') ? (ch - pad.B) : ch - pad.B - ((0 - plotYMin) / plotYSpan) * h_;
        ctx.lineWidth = 2;
        for (var s = 0; s < seriesList.length; s++) {
          var xs = seriesList[s].x, ys = seriesList[s].y;
          var n = Math.min(xs.length, ys.length);
          if (n === 0) continue;
          var mode = seriesList[s].displayMode || 'line';
          var color = colors[s % colors.length];
          if (mode === 'filled') {
            ctx.fillStyle = hexToRgba(color, 0.5);
            ctx.beginPath();
            var firstGx = null, lastGx = null;
            for (var i = 0; i < n; i++) {
              var gx = toGX(xs[i]);
              var gy = toGY(ys[i]);
              if (gx != null && gy != null) {
                if (firstGx == null) { firstGx = gx; ctx.moveTo(gx, gy); }
                else ctx.lineTo(gx, gy);
                lastGx = gx;
              }
            }
            if (firstGx != null && lastGx != null) {
              ctx.lineTo(lastGx, gyZero);
              ctx.lineTo(firstGx, gyZero);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
        for (var s = 0; s < seriesList.length; s++) {
          var xs = seriesList[s].x, ys = seriesList[s].y;
          var n = Math.min(xs.length, ys.length);
          if (n === 0) continue;
          var mode = seriesList[s].displayMode || 'line';
          var color = colors[s % colors.length];
          ctx.strokeStyle = color;
          if (mode === 'line' || mode === 'both') {
            ctx.setLineDash(dashes[(lineStyleIndex[s] !== undefined ? lineStyleIndex[s] : 0) % dashes.length]);
            ctx.beginPath();
            var started = false;
            for (var i = 0; i < n; i++) {
              var gx = toGX(xs[i]);
              var gy = toGY(ys[i]);
              if (gx != null && gy != null) {
                if (!started) { ctx.moveTo(gx, gy); started = true; }
                else ctx.lineTo(gx, gy);
              } else {
                started = false;
              }
            }
            ctx.stroke();
          }
        }
        var fits = options.fits || [];
        ctx.setLineDash([]);
        for (var fi = 0; fi < fits.length; fi++) {
          var fitResult = fits[fi];
          if (!fitResult || fi >= seriesList.length) continue;
          ctx.strokeStyle = colors[fi % colors.length];
          ctx.lineWidth = 1;
          ctx.beginPath();
          var nSamp = 80;
          var started = false;
          for (var si = 0; si <= nSamp; si++) {
            var x = plotXMin + (plotXMax - plotXMin) * (si / nSamp);
            var y = evaluateFit(fitResult, x);
            if (y == null || (yScale === 'log' && y <= 0)) { started = false; continue; }
            var gx = toGX(x);
            var gy = toGY(y);
            if (gx != null && gy != null) {
              if (!started) { ctx.moveTo(gx, gy); started = true; }
              else ctx.lineTo(gx, gy);
            } else started = false;
          }
          ctx.stroke();
        }
        ctx.setLineDash([]);
        withPlotClip(ctx, { L: pad.L - markerR, T: pad.T - markerR }, w + markerR * 2, h_ + markerR * 2, function () {
          for (var s = 0; s < seriesList.length; s++) {
            var xs = seriesList[s].x, ys = seriesList[s].y;
            var n = Math.min(xs.length, ys.length);
            if (n === 0) continue;
            var mode = seriesList[s].displayMode || 'line';
            if (mode !== 'marker' && mode !== 'both') continue;
            var color = colors[s % colors.length];
            var mIdx = (markerStyleIndex[s] !== undefined ? markerStyleIndex[s] : 0);
            for (var j = 0; j < n; j++) {
              var gx = toGX(xs[j]);
              var gy = toGY(ys[j]);
              if (gx != null && gy != null) drawDataPlotMarker(ctx, gx, gy, mIdx, color);
            }
          }
        });
      },
      afterClip: function (ctx, h) {
        var fits = options.fits || [];
        var fitEntries = [];
        for (var fe = 0; fe < fits.length; fe++) {
          if (fits[fe]) {
            var typ = fits[fe].type;
            var typeStr = typ === 'mean' ? 'constant' : typ === 'line' ? 'line' : typ === 'poly2' ? 'poly 2' : typ === 'poly3' ? 'poly 3' : 'fit';
            fitEntries.push({ label: 'Fit (' + typeStr + '): ' + (datasetNames[fe] || 'Dataset ' + (fe + 1)), datasetIndex: fe });
          }
        }
        var legCount = datasetNames.length + fitEntries.length;
        var pad = h.pad, w = h.w, h_ = h.h, ch = h.ch, cw = h.cw;
        if (!showLegend || legCount === 0) return;
        var legBoxW = 14;
        var legBoxH = 14;
        var legGap = 4;
        var legLineH = legBoxH + 2;
        var legPadding = 4;
        ctx.font = '11px ' + (typeof getComputedStyle !== 'undefined' ? getComputedStyle(document.body).fontFamily : 'sans-serif');
        var maxTw = 0;
        for (var mi = 0; mi < datasetNames.length; mi++) {
          var mw = ctx.measureText(datasetNames[mi] || 'Dataset ' + (mi + 1)).width;
          if (mw > maxTw) maxTw = mw;
        }
        for (var fei = 0; fei < fitEntries.length; fei++) {
          var fw = ctx.measureText(fitEntries[fei].label).width;
          if (fw > maxTw) maxTw = fw;
        }
        var blockWidth = maxTw + legBoxW + legGap + legPadding * 2;
        var blockHeight = legCount * legLineH + 2;
        var pos = legendPosition;
        var blockLeft = pad.L + (pos.indexOf('left') >= 0 ? 8 : pos.indexOf('center') >= 0 ? (w / 2 - blockWidth / 2) : (w - 8 - blockWidth));
        var blockTop = pad.T + (pos.indexOf('top') >= 0 ? 8 : pos.indexOf('middle') >= 0 ? (h_ / 2 - blockHeight / 2) : (h_ - 8 - blockHeight));
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        for (var i = 0; i < legCount; i++) {
          var ly = blockTop + 1 + legBoxH / 2 + 1 + i * legLineH;
          var legSymLeft = blockLeft + legPadding;
          var legSymCenterX = legSymLeft + legBoxW / 2;
          if (i < datasetNames.length) {
            var tw = ctx.measureText(datasetNames[i] || 'Dataset ' + (i + 1)).width;
            ctx.fillStyle = PLOT_BG;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(blockLeft, ly - legBoxH / 2 - 1, tw + legBoxW + legGap + legPadding * 2, legLineH + 2);
            ctx.globalAlpha = 1;
            var mode = (seriesList[i] && seriesList[i].displayMode) || 'line';
            var legColor = colors[i % colors.length];
            if (mode === 'filled') {
              ctx.fillStyle = hexToRgba(legColor, 0.5);
              ctx.beginPath();
              ctx.moveTo(legSymLeft, ly + 4);
              ctx.lineTo(legSymLeft + 4, ly - 4);
              ctx.lineTo(legSymLeft + legBoxW - 4, ly - 4);
              ctx.lineTo(legSymLeft + legBoxW, ly + 4);
              ctx.closePath();
              ctx.fill();
            }
            if (mode === 'line' || mode === 'both') {
              ctx.strokeStyle = legColor;
              ctx.lineWidth = 2;
              ctx.setLineDash(dashes[(lineStyleIndex[i] !== undefined ? lineStyleIndex[i] : 0) % dashes.length]);
              ctx.beginPath();
              ctx.moveTo(legSymLeft, ly);
              ctx.lineTo(legSymLeft + legBoxW, ly);
              ctx.stroke();
              ctx.setLineDash([]);
            }
            if (mode === 'marker' || mode === 'both') {
              drawDataPlotMarker(ctx, legSymCenterX, ly, (markerStyleIndex[i] !== undefined ? markerStyleIndex[i] : 0), legColor);
            }
            ctx.fillStyle = PLOT_FG;
            ctx.fillText(datasetNames[i] || 'Dataset ' + (i + 1), blockLeft + legPadding + legBoxW + legGap, ly);
          } else {
            var fitEntry = fitEntries[i - datasetNames.length];
            var fitTw = ctx.measureText(fitEntry.label).width;
            ctx.fillStyle = PLOT_BG;
            ctx.globalAlpha = 0.85;
            ctx.fillRect(blockLeft, ly - legBoxH / 2 - 1, fitTw + legBoxW + legGap + legPadding * 2, legLineH + 2);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = colors[fitEntry.datasetIndex % colors.length];
            ctx.lineWidth = 1;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(legSymLeft, ly);
            ctx.lineTo(legSymLeft + legBoxW, ly);
            ctx.stroke();
            ctx.fillStyle = PLOT_FG;
            ctx.fillText(fitEntry.label, blockLeft + legPadding + legBoxW + legGap, ly);
          }
        }
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
      }
    });
  }

  var dataPlotDatasets = [];
  var dataPlotCurrentIndex = 0;
  var dataPlotNextId = 1;
  var dataPlotSelectedRowIndex = -1;
  var dataPlotUIState = {
    title: '', xlabel: '', ylabel: '',
    lineColorTheme: 'multicolor',
    legend: 'top-left', aspectRatio: 'auto',
    xMin: '', xMax: '', yMin: '', yMax: '',
    xScale: 'linear', yScale: 'linear'
  };

  function getDataPlotOptions() {
    var themeEl = document.getElementById('dp-color-theme');
    var themeId = (themeEl && themeEl.value) || 'multicolor';
    var colors = DATA_PLOT_COLOR_THEMES[themeId] || DATA_PLOT_COLOR_THEMES.multicolor;
    var legendEl = document.getElementById('dp-legend');
    var legendPosition = (legendEl && legendEl.value) ? legendEl.value : 'top-left';
    var xLabelEl = document.getElementById('dp-xlabel');
    var yLabelEl = document.getElementById('dp-ylabel');
    var titleEl = document.getElementById('dp-title');
    return {
      colors: colors,
      legendPosition: legendPosition,
      xLabel: (xLabelEl && xLabelEl.value) ? xLabelEl.value.trim() : '',
      yLabel: (yLabelEl && yLabelEl.value) ? yLabelEl.value.trim() : '',
      title: (titleEl && titleEl.value) ? titleEl.value.trim() : '',
      datasetNames: dataPlotDatasets.map(function (d) { return d.name; })
    };
  }

  function dataPlotNormalizeDataset(d) {
    if (!d) return;
    d.kind = 'xy';
  }

  function normalizeDataPlotDatasetsForLayout() {
    if (dataPlotUIState.lineColorTheme == null && typeof dataPlotUIState.colorTheme === 'string') {
      dataPlotUIState.lineColorTheme = dataPlotUIState.colorTheme;
    }
    if (dataPlotUIState.lineColorTheme == null) dataPlotUIState.lineColorTheme = 'multicolor';
    for (var j = 0; j < dataPlotDatasets.length; j++) {
      var dj = dataPlotDatasets[j];
      if (dj.kind === 'image') {
        dj.kind = 'xy';
        dj.x = [NaN, NaN, NaN];
        dj.y = [NaN, NaN, NaN];
        delete dj.z;
        delete dj.cellX;
        delete dj.cellY;
        delete dj.rawZ;
        delete dj.rawCellX;
        delete dj.rawCellY;
        delete dj.rawWidth;
        delete dj.rawHeight;
        delete dj.imageBinsW;
        delete dj.imageBinsH;
        delete dj.width;
        delete dj.height;
        delete dj.imageColormap;
        delete dj.imageLogZ;
        delete dj.imageExtent;
        if (!dj.displayMode) dj.displayMode = 'line';
        if (dj.fitType === undefined) dj.fitType = 'none';
      }
      dataPlotNormalizeDataset(dj);
    }
  }

  function fillDataPlotColorThemeSelect() {
    var sel = document.getElementById('dp-color-theme');
    if (!sel) return;
    sel.innerHTML = '<option value="multicolor">Multicolor</option><option value="orange">Orange</option><option value="cyan">Cyan</option><option value="green">Green</option><option value="pink">Pink</option><option value="yellow">Yellow</option><option value="red">Red</option><option value="black">Black</option>';
    sel.value = dataPlotUIState.lineColorTheme || 'multicolor';
  }

  function refreshDataPlotLayoutChrome() {
    fillDataPlotColorThemeSelect();
  }

  function refreshDataPlotTableMode() {
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    if (!d) return;
    dataPlotNormalizeDataset(d);
    var theadTr = document.querySelector('#dp-input-wrap thead tr');
    if (!theadTr) return;
    theadTr.innerHTML = '<th>#</th><th>X</th><th>Y</th>';
    setDataPlotInputTable(d.x, d.y);
    refreshDataPlotLayoutChrome();
  }

  function getDataPlotTableData() {
    var tbody = document.getElementById('dp-input-tbody');
    if (!tbody) return { x: [], y: [] };
    var xArr = [], yArr = [];
    var rows = tbody.querySelectorAll('tr');
    for (var i = 0; i < rows.length; i++) {
      var inputs = rows[i].querySelectorAll('input[type="text"]');
      if (inputs.length < 2) continue;
      var x = parseFloat(String(inputs[0].value).trim().replace(/,/g, ''));
      var y = parseFloat(String(inputs[1].value).trim().replace(/,/g, ''));
      xArr.push(isFinite(x) ? x : NaN);
      yArr.push(isFinite(y) ? y : NaN);
    }
    return { x: xArr, y: yArr };
  }

  function getDataPlotTableColumn(column) {
    var tbody = document.getElementById('dp-input-tbody');
    if (!tbody) return [];
    var rows = tbody.querySelectorAll('tr');
    var arr = [];
    for (var i = 0; i < rows.length; i++) {
      var xInput = rows[i].querySelector('input.dp-x-cell');
      var yInput = rows[i].querySelector('input.dp-y-cell');
      if (column === 'x' && xInput) arr.push(String(xInput.value).trim());
      else if (column === 'y' && yInput) arr.push(String(yInput.value).trim());
    }
    return arr;
  }

  function pasteIntoDataPlotColumn(column, rowIndex, values) {
    var tbody = document.getElementById('dp-input-tbody');
    if (!tbody || (column !== 'x' && column !== 'y')) return;
    var rows = tbody.querySelectorAll('tr');
    var needRows = rowIndex + values.length;
    while (rows.length < needRows) {
      var n = tbody.querySelectorAll('tr').length;
      var tr = document.createElement('tr');
      tr.innerHTML = '<td class="dp-row-num">' + (n + 1) + '</td><td><input type="text" class="dp-x-cell" inputmode="decimal" value=""></td><td><input type="text" class="dp-y-cell" inputmode="decimal" value=""></td>';
      tbody.appendChild(tr);
      rows = tbody.querySelectorAll('tr');
    }
    for (var i = 0; i < rows.length; i++) rows[i].querySelector('.dp-row-num').textContent = i + 1;
    for (var i = 0; i < values.length; i++) {
      var r = rowIndex + i;
      var tr = rows[r];
      if (!tr) continue;
      var input = column === 'x' ? tr.querySelector('input.dp-x-cell') : tr.querySelector('input.dp-y-cell');
      if (input) input.value = values[i];
    }
    runDataPlot();
  }

  function setDataPlotInputTable(xArr, yArr) {
    var theadTr = document.querySelector('#dp-input-wrap thead tr');
    if (theadTr) theadTr.innerHTML = '<th>#</th><th>X</th><th>Y</th>';
    var tbody = document.getElementById('dp-input-tbody');
    if (!tbody) return;
    var nx = xArr && xArr.length ? xArr.length : 0;
    var ny = yArr && yArr.length ? yArr.length : 0;
    var n = Math.max(3, nx, ny);
    function esc(v) { return String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
    var html = '';
    for (var i = 0; i < n; i++) {
      var xv = i < nx ? xArr[i] : NaN;
      var yv = i < ny ? yArr[i] : NaN;
      var xVal = isFinite(xv) ? esc(formatNumber(xv)) : '';
      var yVal = isFinite(yv) ? esc(formatNumber(yv)) : '';
      html += '<tr><td class="dp-row-num">' + (i + 1) + '</td><td><input type="text" class="dp-x-cell" inputmode="decimal" value="' + xVal + '"></td><td><input type="text" class="dp-y-cell" inputmode="decimal" value="' + yVal + '"></td></tr>';
    }
    tbody.innerHTML = html;
    dataPlotSelectedRowIndex = -1;
  }

  function saveCurrentTableToDataset() {
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    if (!d) return;
    dataPlotNormalizeDataset(d);
    var data = getDataPlotTableData();
    d.x = data.x;
    d.y = data.y;
  }

  function refreshDataPlotDatasetSelector() {
    var sel = document.getElementById('dp-dataset-select');
    if (!sel) return;
    sel.innerHTML = '';
    for (var i = 0; i < dataPlotDatasets.length; i++) {
      var opt = document.createElement('option');
      opt.value = String(i);
      opt.textContent = dataPlotDatasets[i].name;
      sel.appendChild(opt);
    }
    sel.value = String(dataPlotCurrentIndex);
  }

  function refreshDatasetNameInput() {
    var el = document.getElementById('dp-dataset-name');
    if (!el) return;
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    el.value = (d && d.name) ? d.name : '';
  }

  function refreshDisplayButtons() {
    document.querySelectorAll('.dp-display-btn').forEach(function (b) { b.classList.remove('is-active'); });
    var mode = (dataPlotDatasets[dataPlotCurrentIndex] && dataPlotDatasets[dataPlotCurrentIndex].displayMode) || 'line';
    var btn = document.querySelector('.dp-display-btn[data-dp-display="' + mode + '"]');
    if (btn) btn.classList.add('is-active');
  }

  function switchDataPlotDataset(index) {
    saveCurrentTableToDataset();
    var nameEl = document.getElementById('dp-dataset-name');
    if (nameEl && dataPlotDatasets[dataPlotCurrentIndex]) dataPlotDatasets[dataPlotCurrentIndex].name = nameEl.value.trim() || dataPlotDatasets[dataPlotCurrentIndex].name;
    dataPlotCurrentIndex = Math.max(0, Math.min(index, dataPlotDatasets.length - 1));
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    dataPlotNormalizeDataset(d);
    if (!d.displayMode) d.displayMode = 'line';
    if (d.fitType === undefined) d.fitType = 'none';
    var fitEl = document.getElementById('dp-fit');
    if (fitEl) fitEl.value = d.fitType || 'none';
    syncInputChoiceButtons('dp-fit');
    refreshDataPlotTableMode();
    refreshDataPlotDatasetSelector();
    refreshDatasetNameInput();
    refreshDisplayButtons();
    runDataPlot();
  }

  function addDataPlotDataset() {
    saveCurrentTableToDataset();
    var nameEl = document.getElementById('dp-dataset-name');
    if (nameEl && dataPlotDatasets[dataPlotCurrentIndex]) dataPlotDatasets[dataPlotCurrentIndex].name = nameEl.value.trim() || dataPlotDatasets[dataPlotCurrentIndex].name;
    var id = dataPlotNextId++;
    var empty3 = [NaN, NaN, NaN];
    dataPlotDatasets.push({ id: id, kind: 'xy', name: 'Dataset ' + (dataPlotDatasets.length + 1), x: empty3.slice(), y: empty3.slice(), displayMode: 'line', fitType: 'none' });
    dataPlotCurrentIndex = dataPlotDatasets.length - 1;
    var dNew = dataPlotDatasets[dataPlotCurrentIndex];
    refreshDataPlotTableMode();
    refreshDataPlotDatasetSelector();
    refreshDatasetNameInput();
    refreshDisplayButtons();
    var fitElAdd = document.getElementById('dp-fit');
    if (fitElAdd) fitElAdd.value = 'none';
    syncInputChoiceButtons('dp-fit');
    runDataPlot();
  }

  function removeDataPlotDataset() {
    if (dataPlotDatasets.length <= 1) return;
    saveCurrentTableToDataset();
    dataPlotDatasets.splice(dataPlotCurrentIndex, 1);
    dataPlotCurrentIndex = Math.min(dataPlotCurrentIndex, dataPlotDatasets.length - 1);
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    refreshDataPlotTableMode();
    var fitElRm = document.getElementById('dp-fit');
    if (fitElRm && d) { fitElRm.value = d.fitType || 'none'; syncInputChoiceButtons('dp-fit'); }
    refreshDataPlotDatasetSelector();
    refreshDatasetNameInput();
    refreshDisplayButtons();
    runDataPlot();
  }

  function removeDataPlotRow() {
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    if (!d) return;
    var tbody = document.getElementById('dp-input-tbody');
    if (!tbody) return;
    var rows = tbody.querySelectorAll('tr');
    if (rows.length <= 3) return;
    var indexToRemove = dataPlotSelectedRowIndex >= 0 && dataPlotSelectedRowIndex < rows.length
      ? dataPlotSelectedRowIndex
      : rows.length - 1;
    rows[indexToRemove].remove();
    var rowsAfter = tbody.querySelectorAll('tr');
    for (var i = 0; i < rowsAfter.length; i++) rowsAfter[i].querySelector('.dp-row-num').textContent = i + 1;
    dataPlotSelectedRowIndex = -1;
    saveCurrentTableToDataset();
    runDataPlot();
  }

  function runDataPlot() {
    if (currentToolId !== 'data-plot' || !toolResultsEl) return;
    saveCurrentTableToDataset();
    var ctRun = document.getElementById('dp-color-theme');
    if (ctRun) dataPlotUIState.lineColorTheme = ctRun.value || 'multicolor';
    var nameEl = document.getElementById('dp-dataset-name');
    if (nameEl && dataPlotDatasets[dataPlotCurrentIndex]) {
      var n = nameEl.value.trim();
      dataPlotDatasets[dataPlotCurrentIndex].name = n || dataPlotDatasets[dataPlotCurrentIndex].name;
      refreshDataPlotDatasetSelector();
    }
    var plotContainer = document.getElementById('dp-plot');
    var seriesList = dataPlotDatasets.map(function (d) {
      dataPlotNormalizeDataset(d);
      var xf = [], yf = [];
      for (var i = 0; i < (d.x && d.x.length) || 0; i++) {
        if (isFinite(d.x[i]) && isFinite(d.y[i])) { xf.push(d.x[i]); yf.push(d.y[i]); }
      }
      return { x: xf, y: yf, displayMode: d.displayMode || 'line' };
    });
    var range = readAxisRange('data-plot');
    range.xScale = getDataPlotAxisScale('x');
    range.yScale = getDataPlotAxisScale('y');
    var opts = getDataPlotOptions();
    var themeEl = document.getElementById('dp-color-theme');
    var themeId = (themeEl && themeEl.value) ? themeEl.value : 'multicolor';
    var lineSeriesCount = 0;
    for (var lsi = 0; lsi < seriesList.length; lsi++) {
      if (seriesList[lsi].x && seriesList[lsi].x.length) lineSeriesCount++;
    }
    if (themeId !== 'multicolor' && lineSeriesCount > 0 && opts.colors && opts.colors.length > 0) {
      opts.colors = sampleColorScale(opts.colors, lineSeriesCount);
    }
    var fitEl = document.getElementById('dp-fit');
    var fitType = (fitEl && fitEl.value) ? fitEl.value : 'none';
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    if (d) d.fitType = fitType;
    var fitResult = null;
    var fitDatasetIndex = null;
    var fitsPerDataset = [];
    for (var fi = 0; fi < dataPlotDatasets.length; fi++) {
      var di = dataPlotDatasets[fi];
      dataPlotNormalizeDataset(di);
      var ft = (di && di.fitType) ? di.fitType : 'none';
      if (ft !== 'none' && di && di.x && di.y) {
        var xf = [], yf = [];
        for (var ki = 0; ki < di.x.length; ki++) {
          if (isFinite(di.x[ki]) && isFinite(di.y[ki])) { xf.push(di.x[ki]); yf.push(di.y[ki]); }
        }
        var fr = (xf.length >= 2 && yf.length >= 2) ? computeDataPlotFit(ft, xf, yf) : null;
        fitsPerDataset[fi] = fr;
        if (fi === dataPlotCurrentIndex) { fitResult = fr; fitDatasetIndex = fi; }
      } else {
        fitsPerDataset[fi] = null;
      }
    }
    opts.fits = fitsPerDataset;
    opts.fitResult = fitResult;
    opts.fitDatasetIndex = fitResult ? fitDatasetIndex : null;
    var resultsEl = document.getElementById('dp-fit-results');
    var wrapEl = document.getElementById('dp-fit-results-wrap');
    if (resultsEl && wrapEl) {
      if (fitResult && fitResult.coeffs && fitResult.errors) {
        var eq = '';
        var SUB = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089';
        function sub(i) { return i < 10 ? SUB[i] : String(i); }
        var coeffParts = [];
        var numCoeffs = fitResult.coeffs.length;
        for (var ci = 0; ci < numCoeffs; ci++) {
          var val = Number(fitResult.coeffs[ci]);
          var err = Number(fitResult.errors[ci]);
          coeffParts.push('a' + sub(ci) + ' = ' + formatFitNum(val) + ' \u00B1 ' + formatFitNum(err));
        }
        var coeffLine = coeffParts.join(',  ');
        if (fitResult.type === 'mean') {
          eq = 'Y = a\u2080';
        } else if (fitResult.type === 'line') {
          eq = 'Y = a\u2080 + a\u2081\u00B7X';
        } else if (fitResult.type === 'poly2') {
          eq = 'Y = a\u2080 + a\u2081\u00B7X + a\u2082\u00B7X\u00B2';
        } else if (fitResult.type === 'poly3') {
          eq = 'Y = a\u2080 + a\u2081\u00B7X + a\u2082\u00B7X\u00B2 + a\u2083\u00B7X\u00B3';
        } else {
          eq = 'Y = a\u2080 + a\u2081\u00B7X + \u2026';
        }
        var errNote = '(\u00B1 = standard error of coefficient, 1\u03C3 from least-squares fit)';
        resultsEl.textContent = eq + '\n' + coeffLine + '\n' + errNote;
        wrapEl.style.display = '';
      } else {
        resultsEl.textContent = '';
        wrapEl.style.display = 'none';
      }
    }
    if (plotContainer) drawDataPlot(plotContainer, seriesList, range, opts);
  }

  function getDataPlotAxisScale(axis) {
    var root = toolResultsEl || document;
    var wrap = root.querySelector('.plot-scale-btns[data-axis="' + axis + '"]');
    if (!wrap) return 'linear';
    var active = wrap.querySelector('.plot-scale-btn.is-active');
    return (active && active.getAttribute('data-scale')) || 'linear';
  }

  function getAxisScaleFromPlotContainer(container, axis) {
    var pane = container && container.closest && container.closest('.tool-plot-pane');
    if (!pane) return 'linear';
    var wrap = pane.querySelector('.plot-scale-btns[data-axis="' + axis + '"]');
    if (!wrap) return 'linear';
    var active = wrap.querySelector('.plot-scale-btn.is-active');
    return (active && active.getAttribute('data-scale')) || 'linear';
  }

  function bindScaleButtonsInPanel(runFn) {
    (toolResultsEl && toolResultsEl.querySelectorAll('.plot-scale-btn') || []).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.plot-scale-btns');
        if (wrap) {
          wrap.querySelectorAll('.plot-scale-btn').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
          runFn();
        }
      });
    });
  }

  function bindDataPlotTableInputs() {
    var wrap = document.getElementById('dp-input-wrap');
    if (!wrap) return;
    wrap.addEventListener('click', function (e) {
      var tr = e.target.closest('tr');
      var tbody = document.getElementById('dp-input-tbody');
      if (tbody && tr && tbody.contains(tr)) {
        var rows = tbody.querySelectorAll('tr');
        for (var i = 0; i < rows.length; i++) {
          if (rows[i] === tr) {
            dataPlotSelectedRowIndex = i;
            rows.forEach(function (r) { r.classList.remove('dp-row-selected'); });
            tr.classList.add('dp-row-selected');
            break;
          }
        }
      }
    });
    wrap.addEventListener('input', function (e) {
      if (e.target.classList.contains('dp-x-cell') || e.target.classList.contains('dp-y-cell')) runDataPlot();
    });
    wrap.addEventListener('change', function (e) {
      if (e.target.classList.contains('dp-x-cell') || e.target.classList.contains('dp-y-cell')) runDataPlot();
    });
    wrap.addEventListener('keydown', function (e) {
      var target = e.target;
      if (!target || (!target.classList.contains('dp-x-cell') && !target.classList.contains('dp-y-cell'))) return;
      if (target.readOnly) return;
      var col = target.classList.contains('dp-x-cell') ? 'x' : 'y';
      if (e.ctrlKey && e.key === 'c') {
        var values = getDataPlotTableColumn(col);
        if (values.length) {
          e.preventDefault();
          e.stopPropagation();
          navigator.clipboard.writeText(values.join('\n')).catch(function () {});
        }
      } else if (e.ctrlKey && e.key === 'v') {
        e.preventDefault();
        e.stopPropagation();
        var tr = target.closest('tr');
        var tbody = document.getElementById('dp-input-tbody');
        var rows = tbody ? tbody.querySelectorAll('tr') : [];
        var rowIndex = 0;
        for (var i = 0; i < rows.length; i++) { if (rows[i] === tr) { rowIndex = i; break; } }
        navigator.clipboard.readText().then(function (text) {
          var parts = text.split(/\r?\n/);
          var values = [];
          for (var j = 0; j < parts.length; j++) {
            var line = parts[j].trim();
            if (line === '') continue;
            var cells = line.split(/\t/);
            values.push(cells[0].trim());
          }
          if (values.length) pasteIntoDataPlotColumn(col, rowIndex, values);
        }).catch(function () {});
      }
    });
  }

  function addDataPlotRow() {
    saveCurrentTableToDataset();
    var d = dataPlotDatasets[dataPlotCurrentIndex];
    if (!d) return;
    if (!d.x) return;
    var n = d.x.length;
    var insertIndex = (dataPlotSelectedRowIndex >= 0 && dataPlotSelectedRowIndex < n)
      ? dataPlotSelectedRowIndex + 1
      : n;
    d.x.splice(insertIndex, 0, NaN);
    d.y.splice(insertIndex, 0, NaN);
    setDataPlotInputTable(d.x, d.y);
    dataPlotSelectedRowIndex = insertIndex;
    var tbody = document.getElementById('dp-input-tbody');
    if (tbody) {
      var rows = tbody.querySelectorAll('tr');
      if (rows[insertIndex]) {
        rows.forEach(function (r) { r.classList.remove('dp-row-selected'); });
        rows[insertIndex].classList.add('dp-row-selected');
      }
    }
    runDataPlot();
  }

  function captureDataPlotUIState() {
    saveCurrentTableToDataset();
    var nameEl = document.getElementById('dp-dataset-name');
    if (nameEl && dataPlotDatasets[dataPlotCurrentIndex]) {
      dataPlotDatasets[dataPlotCurrentIndex].name = nameEl.value.trim() || dataPlotDatasets[dataPlotCurrentIndex].name;
    }
    var titleEl = document.getElementById('dp-title');
    if (titleEl) {
      dataPlotUIState.title = titleEl.value || '';
      var xl = document.getElementById('dp-xlabel');
      dataPlotUIState.xlabel = (xl && xl.value) ? xl.value : '';
      var yl = document.getElementById('dp-ylabel');
      dataPlotUIState.ylabel = (yl && yl.value) ? yl.value : '';
      var ct = document.getElementById('dp-color-theme');
      if (ct) dataPlotUIState.lineColorTheme = ct.value || 'multicolor';
      var leg = document.getElementById('dp-legend');
      dataPlotUIState.legend = (leg && leg.value) ? leg.value : 'top-left';
    }
    var rxMin = document.getElementById('data-plot-xmin');
    if (rxMin) {
      dataPlotUIState.xMin = rxMin.value || '';
      var rxMax = document.getElementById('data-plot-xmax');
      dataPlotUIState.xMax = (rxMax && rxMax.value) ? rxMax.value : '';
      var ryMin = document.getElementById('data-plot-ymin');
      dataPlotUIState.yMin = (ryMin && ryMin.value) ? ryMin.value : '';
      var ryMax = document.getElementById('data-plot-ymax');
      dataPlotUIState.yMax = (ryMax && ryMax.value) ? ryMax.value : '';
    }
    var pane = toolResultsEl && toolResultsEl.querySelector('.tool-plot-pane');
    if (pane) {
      var xWrap = pane.querySelector('.plot-scale-btns[data-axis="x"]');
      if (xWrap) {
        var xActive = xWrap.querySelector('.plot-scale-btn.is-active');
        dataPlotUIState.xScale = (xActive && xActive.getAttribute('data-scale')) || 'linear';
      }
      var yWrap = pane.querySelector('.plot-scale-btns[data-axis="y"]');
      if (yWrap) {
        var yActive = yWrap.querySelector('.plot-scale-btn.is-active');
        dataPlotUIState.yScale = (yActive && yActive.getAttribute('data-scale')) || 'linear';
      }
    }
  }

  function resetDataPlotToDefaults() {
    dataPlotUIState.title = '';
    dataPlotUIState.xlabel = '';
    dataPlotUIState.ylabel = '';
    dataPlotUIState.lineColorTheme = 'multicolor';
    dataPlotUIState.legend = 'top-left';
    dataPlotUIState.xMin = '';
    dataPlotUIState.xMax = '';
    dataPlotUIState.yMin = '';
    dataPlotUIState.yMax = '';
    dataPlotUIState.xScale = 'linear';
    dataPlotUIState.yScale = 'linear';
    dataPlotDatasets.length = 0;
    dataPlotDatasets.push({ id: 0, kind: 'xy', name: 'Dataset 1', x: [NaN, NaN, NaN], y: [NaN, NaN, NaN], displayMode: 'line', fitType: 'none' });
    dataPlotNextId = 1;
    dataPlotCurrentIndex = 0;
    initDataPlot();
  }

  function initDataPlot() {
    if (dataPlotDatasets.length === 0) {
      dataPlotDatasets.push({ id: 0, kind: 'xy', name: 'Dataset 1', x: [NaN, NaN, NaN], y: [NaN, NaN, NaN], displayMode: 'line', fitType: 'none' });
      dataPlotNextId = 1;
      dataPlotCurrentIndex = 0;
    } else {
      dataPlotCurrentIndex = Math.min(dataPlotCurrentIndex, dataPlotDatasets.length - 1);
    }
    normalizeDataPlotDatasetsForLayout();
    for (var ndi = 0; ndi < dataPlotDatasets.length; ndi++) dataPlotNormalizeDataset(dataPlotDatasets[ndi]);
    toolInputsEl.innerHTML =
      '<div class="data-plot-inputs">' +
      '<div class="dp-inputs-header"><button type="button" class="dp-reset-defaults-btn" id="dp-reset-defaults">Reset</button></div>' +
      '<div class="dp-section">' +
      '<h3 class="dp-section-heading">Plot appearance</h3>' +
      '<div class="dp-plot-options">' +
      '<div class="dp-plot-row">' +
      '<span class="dp-plot-row-label">Title</span>' +
      '<input type="text" id="dp-title" class="dp-title-input" placeholder="Figure title">' +
      '</div>' +
      '<div class="dp-plot-row">' +
      '<span class="dp-plot-row-label">X label</span>' +
      '<input type="text" id="dp-xlabel" class="dp-axis-input" placeholder="X">' +
      '</div>' +
      '<div class="dp-plot-row">' +
      '<span class="dp-plot-row-label">Y label</span>' +
      '<input type="text" id="dp-ylabel" class="dp-axis-input" placeholder="Y">' +
      '</div>' +
      '<div class="dp-plot-row">' +
      '<span class="dp-plot-row-label">Color theme</span>' +
      '<select id="dp-color-theme"></select>' +
      '</div>' +
      '<div class="dp-plot-row">' +
      '<span class="dp-plot-row-label">Legend</span>' +
      '<div class="dp-legend-cell">' +
      '<select id="dp-legend">' +
      '<option value="none">None</option>' +
      '<option value="top-left">Top Left</option>' +
      '<option value="top-center">Top Center</option>' +
      '<option value="top-right">Top Right</option>' +
      '<option value="middle-left">Middle Left</option>' +
      '<option value="middle-center">Middle Center</option>' +
      '<option value="middle-right">Middle Right</option>' +
      '<option value="bottom-left">Bottom Left</option>' +
      '<option value="bottom-center">Bottom Center</option>' +
      '<option value="bottom-right">Bottom Right</option>' +
      '</select></div>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '<div class="dp-plot-divider"></div>' +
      '<div class="dp-section">' +
      '<h3 class="dp-section-heading">Data</h3>' +
      '<div class="dp-plot-row dp-dataset-row">' +
      '<span class="dp-plot-row-label">Dataset</span>' +
      '<select id="dp-dataset-select"></select>' +
      '<button type="button" class="dp-add-dataset" id="dp-add-dataset">Add dataset</button>' +
      '<button type="button" class="dp-remove-dataset" id="dp-remove-dataset">Remove dataset</button>' +
      '</div>' +
      '<div class="dp-plot-row">' +
      '<span class="dp-plot-row-label">Name</span>' +
      '<input type="text" id="dp-dataset-name" class="dp-dataset-name-input" placeholder="Dataset name">' +
      '</div>' +
      '<div class="dp-plot-row dp-display-row">' +
      '<span class="dp-plot-row-label">Display</span>' +
      '<div class="dp-display-btns">' +
      '<button type="button" class="dp-display-btn is-active" data-dp-display="line">Line</button>' +
      '<button type="button" class="dp-display-btn" data-dp-display="marker">Marker</button>' +
      '<button type="button" class="dp-display-btn" data-dp-display="both">Both</button>' +
      '<button type="button" class="dp-display-btn" data-dp-display="filled">Filled</button>' +
      '</div>' +
      '</div>' +
      '<div class="dp-plot-row dp-plot-row-fit dp-plot-row-choice-stack">' +
      '<div class="tool-input-choice-section-label">Fit</div>' +
      inputChoiceButtonsHtml('dp-fit', [
        { value: 'none', label: 'None' },
        { value: 'mean', label: 'Mean (constant)' },
        { value: 'line', label: 'Line' },
        { value: 'poly2', label: 'Poly 2' },
        { value: 'poly3', label: 'Poly 3' }
      ], 'none', 'Fit') +
      '</div>' +
      '<div class="dp-fit-results-wrap" id="dp-fit-results-wrap"><pre class="dp-fit-results" id="dp-fit-results"></pre></div>' +
      '<div class="dp-plot-row dp-plot-row-file">' +
      '<span class="dp-plot-row-label">Load file</span>' +
      '<input type="file" id="dp-file" accept=".csv,.txt,.dat,.h5,text/csv,text/plain,application/x-hdf">' +
      '</div>' +
      '<div id="dp-input-wrap" class="dp-input-table-wrap">' +
      '<table class="dp-input-table"><thead><tr><th>#</th><th>X</th><th>Y</th></tr></thead><tbody id="dp-input-tbody"></tbody></table>' +
      '<div class="dp-table-buttons">' +
      '<button type="button" class="dp-add-row" id="dp-add-row">Add row</button>' +
      '<button type="button" class="dp-remove-row" id="dp-remove-row">Delete row</button>' +
      '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [{ view: 'plot', label: 'Plot' }],
      resultsId: 'dp-results',
      resultsContent: '',
      plotPanes: [{
        dataPlot: 'plot',
        plotId: 'dp-plot',
        controlsPrefix: 'data-plot',
        scaleButtons: true,
        includeZControls: false
      }]
    });
    var plotContent = toolResultsEl.querySelector('.tool-plot-content');
    var plotPane = toolResultsEl.querySelector('.tool-plot-pane');
    var plotBtn = toolResultsEl.querySelector('.tool-view-btn[data-view="plot"]');
    if (plotContent) plotContent.classList.add('is-visible');
    if (plotPane) plotPane.classList.add('is-active');
    if (plotBtn) plotBtn.classList.add('is-active');
    refreshDataPlotDatasetSelector();
    refreshDatasetNameInput();
    refreshDisplayButtons();
    var fitElInit0 = document.getElementById('dp-fit');
    if (fitElInit0 && dataPlotDatasets[dataPlotCurrentIndex]) {
      fitElInit0.value = dataPlotDatasets[dataPlotCurrentIndex].fitType || 'none';
    }
    syncInputChoiceButtons('dp-fit');
    refreshDataPlotTableMode();
    var titleEl = document.getElementById('dp-title');
    if (titleEl) titleEl.value = dataPlotUIState.title || '';
    var xl = document.getElementById('dp-xlabel');
    if (xl) xl.value = dataPlotUIState.xlabel || '';
    var yl = document.getElementById('dp-ylabel');
    if (yl) yl.value = dataPlotUIState.ylabel || '';
    var leg = document.getElementById('dp-legend');
    if (leg && dataPlotUIState.legend) leg.value = dataPlotUIState.legend;
    var rxMin = document.getElementById('data-plot-xmin');
    if (rxMin) rxMin.value = dataPlotUIState.xMin || '';
    var rxMax = document.getElementById('data-plot-xmax');
    if (rxMax) rxMax.value = dataPlotUIState.xMax || '';
    var ryMin = document.getElementById('data-plot-ymin');
    if (ryMin) ryMin.value = dataPlotUIState.yMin || '';
    var ryMax = document.getElementById('data-plot-ymax');
    if (ryMax) ryMax.value = dataPlotUIState.yMax || '';
    var pane = toolResultsEl && toolResultsEl.querySelector('.tool-plot-pane');
    if (pane) {
      var xWrap = pane.querySelector('.plot-scale-btns[data-axis="x"]');
      if (xWrap) xWrap.querySelectorAll('.plot-scale-btn').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-scale') === dataPlotUIState.xScale); });
      var yWrap = pane.querySelector('.plot-scale-btns[data-axis="y"]');
      if (yWrap) yWrap.querySelectorAll('.plot-scale-btn').forEach(function (b) { b.classList.toggle('is-active', b.getAttribute('data-scale') === dataPlotUIState.yScale); });
    }
    var fileEl = document.getElementById('dp-file');
    if (fileEl) {
      fileEl.addEventListener('change', function () {
        var f = fileEl.files && fileEl.files[0];
        if (!f) { runDataPlot(); return; }
        var n = (f.name || '').toLowerCase();
        var fk = dataPlotFileLoadKind(n);
        if (fk === 'raster-image') {
          dataPlotShowFileLoadMessage('Image files (PNG, JPEG, and similar) are not supported. Use CSV or TXT for X,Y columns.');
          fileEl.value = '';
          return;
        }
        if (fk === 'h5') {
          dataPlotShowFileLoadMessage('HDF5 (.h5) cannot be read in this tool. Export to CSV or TXT.');
          fileEl.value = '';
          return;
        }
        if (fk === 'unsupported') {
          dataPlotShowFileLoadMessage('Unsupported file type. Use .csv, .txt, .dat, or a no-extension text file with two columns.');
          fileEl.value = '';
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          var parsed = parseCsvToXY(reader.result, false);
          var dc2 = dataPlotDatasets[dataPlotCurrentIndex];
          if (dc2) setDataPlotInputTable(parsed.x, parsed.y);
          dataPlotClearFileLoadMessage();
          runDataPlot();
        };
        reader.onerror = function () {
          dataPlotShowFileLoadMessage('Failed to read the file.');
        };
        reader.readAsText(f);
        fileEl.value = '';
      });
    }
    var sel = document.getElementById('dp-dataset-select');
    if (sel) sel.addEventListener('change', function () { switchDataPlotDataset(parseInt(sel.value, 10)); });
    document.getElementById('dp-add-dataset').addEventListener('click', addDataPlotDataset);
    document.getElementById('dp-remove-dataset').addEventListener('click', removeDataPlotDataset);
    var resetBtn = document.getElementById('dp-reset-defaults');
    if (resetBtn) resetBtn.addEventListener('click', resetDataPlotToDefaults);
    document.querySelectorAll('.dp-display-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var mode = btn.getAttribute('data-dp-display');
        if (dataPlotDatasets[dataPlotCurrentIndex]) dataPlotDatasets[dataPlotCurrentIndex].displayMode = mode;
        refreshDisplayButtons();
        runDataPlot();
      });
    });
    document.getElementById('dp-add-row').addEventListener('click', addDataPlotRow);
    document.getElementById('dp-remove-row').addEventListener('click', removeDataPlotRow);
    bindDataPlotTableInputs();
    bindChoiceButtons('dp-fit');
    bindInputsToRun(['dp-color-theme', 'dp-legend', 'dp-xlabel', 'dp-ylabel', 'dp-title', 'dp-dataset-name', 'dp-fit', 'data-plot-xmin', 'data-plot-xmax', 'data-plot-ymin', 'data-plot-ymax', 'plot-aspect-ratio'], runDataPlot);
    document.getElementById('dp-legend').addEventListener('change', runDataPlot);
    bindPlotGridButton(runDataPlot);
    (toolResultsEl.querySelectorAll('.plot-scale-btn') || []).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var wrap = btn.closest('.plot-scale-btns');
        if (!wrap) return;
        wrap.querySelectorAll('.plot-scale-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        runDataPlot();
      });
    });
    runDataPlot();
  }

  function initLaserPulse() {
    toolInputsEl.innerHTML =
      toolInputsHeaderHtml('lp-reset-defaults') +
      toolInputTableOpen() +
      inputChoiceSectionRow('Spot size type', inputChoiceButtonsHtml('lp-spot-type', [
        { value: 'FWHM', label: S.symbolHtml('FWHM') },
        { value: '1e2', label: '1/e² (diameter)' }
      ], 'FWHM', 'Spot size type')) +
      inputRow('Spot X', S.symbolHtml('x'), '<input type="text" id="lp-spot-x" inputmode="decimal" placeholder="e.g. 10" value="10">', 'μm') +
      inputRow('Spot Y', S.symbolHtml('y'), '<input type="text" id="lp-spot-y" inputmode="decimal" placeholder="e.g. 10" value="10">', 'μm') +
      inputRow(S.meaning('lambda'), S.symbolHtml('lambda'), '<input type="text" id="lp-wavelength" inputmode="decimal" placeholder="e.g. 800" value="800">', '<select id="lp-wavelength-unit"><option value="nm" selected>nm</option><option value="eV">eV</option></select>') +
      inputRow('Pulse duration (FWHM)', S.symbolHtml('tau'), '<input type="text" id="lp-duration" inputmode="decimal" placeholder="e.g. 30" value="30">', '<select id="lp-duration-unit"><option value="fs" selected>fs</option><option value="ps">ps</option><option value="ns">ns</option><option value="us">μs</option><option value="ms">ms</option><option value="s">s</option></select>') +
      inputRow('Pulse energy', S.symbolHtml('E'), '<input type="text" id="lp-energy" inputmode="decimal" placeholder="e.g. 1" value="1">', '<select id="lp-energy-unit"><option value="nJ">nJ</option><option value="uJ" selected>μJ</option><option value="mJ">mJ</option><option value="J">J</option></select>') +
      inputRow('Rep. rate', '', '<input type="text" id="lp-rep-rate" inputmode="decimal" placeholder="e.g. 1" value="1000">', '<select id="lp-rep-rate-unit"><option value="Hz">Hz</option><option value="kHz" selected>kHz</option><option value="MHz">MHz</option></select>') +
      '</tbody></table></div>';
    var lpFormulaHtml =
      '<p class="tool-formula">I = P / A (peak intensity)</p>' +
      '<p class="tool-formula">F = E / A (fluence)</p>' +
      '<p class="tool-formula">N<sub>photons</sub> = E / (hν) = E' + S.symbolHtml('lambda') + ' / (hc)</p>' +
      '<p class="tool-formula">Gaussian beam: inputs are spot diameters; internal calculations use the 1/e² radius w, with FWHM diameter D related by D = w' + sqrtHtml('2 ln 2') + '.</p>' +
      '<p class="tool-formula">Δν · ' + S.symbolHtml('tau') + ' ≥ 0.44 (transform limit, Gaussian)</p>';
    toolResultsEl.innerHTML = buildToolResultsPanel({
      viewButtons: [
        { view: 'results', label: 'Results' },
        { view: 'equations', label: 'Equations' },
        { view: 'plot-2d', label: 'Plot (2D)' },
        { view: 'plot-time', label: 'Plot (t)' },
        { view: 'plot-slice-x', label: 'Plot (X)' },
        { view: 'plot-slice-y', label: 'Plot (Y)' }
      ],
      resultsId: 'lp-results',
      equationsHtml: lpFormulaHtml,
      plotPanes: [
        { dataPlot: 'plot-2d', plotId: 'lp-plot-2d', controlsPrefix: 'lp2d', scaleButtons: true },
        { dataPlot: 'plot-time', plotId: 'lp-plot-time', controlsPrefix: 'lptime', scaleButtons: true },
        { dataPlot: 'plot-slice-x', plotId: 'lp-plot-slice-x', controlsPrefix: 'lpsliceX', scaleButtons: true },
        { dataPlot: 'plot-slice-y', plotId: 'lp-plot-slice-y', controlsPrefix: 'lpsliceY', scaleButtons: true }
      ]
    });
    runLaserPulse();
    bindChoiceButtons('lp-spot-type');
    bindInputsToRun([
      'lp-spot-type', 'lp-spot-x', 'lp-spot-y', 'lp-wavelength', 'lp-duration', 'lp-energy', 'lp-rep-rate',
      'lp2d-xmin', 'lp2d-xmax', 'lp2d-ymin', 'lp2d-ymax',
      'lptime-xmin', 'lptime-xmax', 'lptime-ymin', 'lptime-ymax',
      'lpsliceX-xmin', 'lpsliceX-xmax', 'lpsliceX-ymin', 'lpsliceX-ymax',
      'lpsliceY-xmin', 'lpsliceY-xmax', 'lpsliceY-ymin', 'lpsliceY-ymax',
      'plot-aspect-ratio'
    ], runLaserPulse);
    bindInputsChange(['lp-wavelength-unit', 'lp-duration-unit', 'lp-energy-unit', 'lp-rep-rate-unit'], runLaserPulse);
    bindPlotGridButton(runLaserPulse);
    bindScaleButtonsInPanel(runLaserPulse);
    var lpReset = document.getElementById('lp-reset-defaults');
    if (lpReset) lpReset.addEventListener('click', initLaserPulse);
  }

  function showTool(id) {
    if (id == null || id === '') return;
    if (currentToolId === 'data-plot' && id !== 'data-plot') captureDataPlotUIState();
    currentToolId = id;
    ensureToolResultsEl();
    if (toolResultsEl) toolResultsEl.setAttribute('data-current-tool', id);
    var t = tools[id] || tools.about;
    var titleEl = document.getElementById('tool-title');
    if (titleEl) {
      var link = document.querySelector('.nav-link[data-tool="' + id + '"]');
      titleEl.textContent = link ? link.textContent : (id === 'about' ? 'About' : id);
    }
    if (t.dynamic && id === 'unit-conversion') {
      initUnitConversion();
    } else if (t.dynamic && id === 'chemical-solution') {
      initChemicalSolution();
    } else if (t.dynamic && id === 'absorption') {
      initAbsorption();
    } else if (t.dynamic && id === 'laser-pulse') {
      initLaserPulse();
    } else if (t.dynamic && id === 'particle') {
      initParticle();
    } else if (t.dynamic && id === 'boltzmann') {
      initBoltzmann();
    } else if (t.dynamic && id === 'photoionization') {
      initPhotoionization();
    } else if (t.dynamic && id === 'compton') {
      initCompton();
    } else if (t.dynamic && id === 'blackbody') {
      initBlackbody();
    } else if (t.dynamic && id === 'peak-convolution') {
      initPeakConvolution();
    } else if (t.dynamic && id === 'decay') {
      initDecay();
    } else if (t.dynamic && id === 'data-plot') {
      initDataPlot();
    } else if (t.dynamic && id === 'ideal-gas') {
      initIdealGas();
    } else if (t.dynamic && id === 'diffraction') {
      initDiffraction();
    } else if (t.dynamic && id === 'synchrotron') {
      initSynchrotron();
    } else if (t.dynamic && id === 'heisenberg') {
      initHeisenberg();
    } else if (t.dynamic && id === 'refraction') {
      initRefraction();
    } else if (t.dynamic && id === 'thin-lens') {
      initThinLens();
    } else if (t.dynamic && id === 'brilliance') {
      initBrilliance();
    } else if (t.dynamic && id === 'bragg') {
      initBragg();
    } else {
      toolInputsEl.innerHTML = t.inputs || '';
      toolResultsEl.innerHTML = t.results || '';
    }
    function setActiveNav() {
      var targetId = currentToolId;
      document.querySelectorAll('.nav-link').forEach(function (link) {
        link.classList.toggle('active', link.getAttribute('data-tool') === targetId);
      });
    }
    setActiveNav();
    setTimeout(setActiveNav, 0);
    setTimeout(setActiveNav, 50);
    if (navEl && navEl.classList.contains('is-open')) {
      navEl.classList.remove('is-open');
      if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    }
  }

  function initNav() {
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        showTool(link.getAttribute('data-tool'));
      });
    });
    document.querySelectorAll('.nav-section-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var section = btn.closest('.nav-section');
        if (!section) return;
        var open = section.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }

  function initMenuToggle() {
    if (!menuToggle || !navEl) return;
    menuToggle.addEventListener('click', function () {
      var open = navEl.classList.toggle('is-open');
      menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  function initSettings() {
    var toggleEl = document.getElementById('settings-toggle');
    var panelEl = document.getElementById('settings-panel');
    var optionsEl = document.getElementById('settings-accent-options');
    var themeOptionsEl = document.getElementById('settings-theme-options');
    if (!toggleEl || !panelEl || !optionsEl) return;
    if (themeOptionsEl) {
      themeOptionsEl.querySelectorAll('.settings-theme-btn').forEach(function (btn) {
        var theme = btn.getAttribute('data-theme');
        btn.addEventListener('click', function () {
          applyTheme(theme);
          themeOptionsEl.querySelectorAll('.settings-theme-btn').forEach(function (b) { b.classList.remove('is-active'); });
          btn.classList.add('is-active');
        });
      });
      var currentTheme = (document.body.getAttribute('data-theme') === 'light') ? 'light' : 'dark';
      themeOptionsEl.querySelectorAll('.settings-theme-btn').forEach(function (b) {
        b.classList.toggle('is-active', b.getAttribute('data-theme') === currentTheme);
      });
    }
    var stored = null;
    try { stored = localStorage.getItem('scireso-accent'); } catch (e) { /* ignore */ }
    ACCENT_PRESETS.forEach(function (preset) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'settings-accent-btn';
      btn.textContent = preset.label;
      if ((stored && preset.id === stored) || (!stored && preset.id === 'cyan')) btn.classList.add('is-active');
      btn.addEventListener('click', function () {
        setAccentPreset(preset.id);
        optionsEl.querySelectorAll('.settings-accent-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
      });
      optionsEl.appendChild(btn);
    });
    toggleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panelEl.hasAttribute('hidden');
      if (open) {
        panelEl.removeAttribute('hidden');
        toggleEl.setAttribute('aria-expanded', 'true');
      } else {
        panelEl.setAttribute('hidden', '');
        toggleEl.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', function (e) {
      if (panelEl.hasAttribute('hidden')) return;
      if (panelEl.contains(e.target) || e.target === toggleEl) return;
      panelEl.setAttribute('hidden', '');
      toggleEl.setAttribute('aria-expanded', 'false');
    });
  }

  function initSymbols() {
    var SYM = window.SCIRESO_SYMBOLS;
    var toggleEl = document.getElementById('symbols-toggle');
    var panelEl = document.getElementById('symbols-panel');
    var listEl = document.getElementById('symbols-list');
    if (!SYM || !toggleEl || !panelEl || !listEl) return;
    var defs = SYM.DEFS || {};
    var ids = Object.keys(defs).sort();
    listEl.innerHTML = ids.map(function (id) {
      var d = defs[id];
      var symDisplay = (SYM.symbolHtml && d) ? SYM.symbolHtml(id) : escapeHtml((d && d.symbol != null) ? d.symbol : id);
      var meaning = (d && d.meaning != null) ? d.meaning : '';
      return '<div class="sym-row"><span class="sym-symbol">' + symDisplay + '</span><span class="sym-meaning">' + escapeHtml(meaning) + '</span></div>';
    }).join('');
    function escapeHtml(s) {
      if (s == null) return '';
      var div = document.createElement('div');
      div.textContent = s;
      return div.innerHTML;
    }
    toggleEl.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panelEl.hasAttribute('hidden');
      if (open) {
        panelEl.removeAttribute('hidden');
        toggleEl.setAttribute('aria-expanded', 'true');
      } else {
        panelEl.setAttribute('hidden', '');
        toggleEl.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', function (e) {
      if (panelEl.hasAttribute('hidden')) return;
      if (panelEl.contains(e.target) || e.target === toggleEl) return;
      panelEl.setAttribute('hidden', '');
      toggleEl.setAttribute('aria-expanded', 'false');
    });
  }

  function initViewButtons() {
    if (!toolResultsEl) return;
    toolResultsEl.addEventListener('click', function (e) {
      var saveBtn = e.target && e.target.closest && e.target.closest('.plot-save-png-btn');
      if (saveBtn) {
        savePlotAsPng(saveBtn);
        return;
      }
      var btn = e.target && e.target.closest && e.target.closest('.tool-view-btn');
      if (!btn) return;
      if (btn.hasAttribute('data-value') && !btn.hasAttribute('data-view')) return;
      var view = btn.getAttribute('data-view');
      if (!view) return;
      var container = btn.closest('#tool-results') || btn.closest('.tool-results');
      if (!container) return;
      var resultsContent = container.querySelector('.tool-results-content');
      var equationsContent = container.querySelector('.tool-equations-content');
      var plotContent = container.querySelector('.tool-plot-content');
      var buttons = container.querySelectorAll('.tool-view-btn');
      if (!resultsContent) return;
      buttons.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
      var isPlot = view === 'plot' || view.indexOf('plot-') === 0;
      resultsContent.hidden = view !== 'results';
      if (equationsContent) equationsContent.hidden = view !== 'equations';
      if (plotContent) {
        plotContent.classList.toggle('is-visible', isPlot);
        plotContent.querySelectorAll('.tool-plot-pane').forEach(function (pane) {
          pane.classList.toggle('is-active', pane.getAttribute('data-plot') === view);
        });
        if (isPlot) {
          var tid = typeof currentToolId === 'string' ? currentToolId : '';
          var runPlot = function () {
            if (tid === 'absorption') runAbsorption();
            else if (tid === 'laser-pulse') runLaserPulse();
            else if (tid === 'particle') runParticle();
            else if (tid === 'boltzmann') runBoltzmann();
            else if (tid === 'photoionization') runPhotoionization();
            else if (tid === 'compton') runCompton();
            else if (tid === 'blackbody') runBlackbody();
            else if (tid === 'decay') runDecay();
            else if (tid === 'diffraction') runDiffraction();
            else if (tid === 'data-plot') runDataPlot();
          };
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              runPlot();
              if (plotContent && plotContent.scrollIntoView) plotContent.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
          });
        }
      }
      var tableSection = resultsContent.closest('.mobile-results-section');
      if (tableSection && tableSection.parentElement) {
        tableSection.parentElement.querySelectorAll('.mobile-results-section').forEach(function (sect) {
          if (view === 'equations' && sect !== tableSection) {
            sect.style.setProperty('display', 'none', 'important');
          } else {
            sect.style.removeProperty('display');
          }
        });
      }
    });
  }

  function boot() {
    toolResultsEl = document.getElementById('tool-results');
    toolInputsEl = document.getElementById('tool-inputs');
    navEl = document.getElementById('nav');
    if (!toolResultsEl || !toolInputsEl) return;
    showTool('about');
    initNav();
    var siteTitleLink = document.getElementById('site-title-link');
    if (siteTitleLink) siteTitleLink.addEventListener('click', function (e) {
      e.preventDefault();
      showTool('about');
    });
    toolResultsEl.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[data-tool]');
      if (a) {
        e.preventDefault();
        showTool(a.getAttribute('data-tool'));
      }
    });
    initMenuToggle();
    initSettings();
    initSymbols();
    initViewButtons();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
