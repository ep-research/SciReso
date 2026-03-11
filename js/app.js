(function () {
  'use strict';

  var CONV = window.SCIRESULTS_CONVERSION;
  var TEMP = window.SCIRESULTS_TEMP;

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
    irradiance: 'Irradiance'
  };

  var tools = {
    about: {
      inputs: '',
      results: '<div class="about-content">' +
        '<h2>About</h2>' +
        '<p>SCIREPO — A science repository.</p>' +
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
    decay: { dynamic: true },
    'ideal-gas': { dynamic: true }
  };

  var toolInputsEl = document.getElementById('tool-inputs');
  var toolResultsEl = document.getElementById('tool-results');
  var navEl = document.getElementById('nav');
  var menuToggle = document.querySelector('.menu-toggle');
  var currentToolId = null;

  var THEME = window.SCIREPO_THEME || {};
  var PLOT = THEME.PLOT || {};
  var TABLE = THEME.TABLE || {};
  var PLOT_SIZE = PLOT.size || {};
  var PLOT_PAD = PLOT.pad || {};
  var PLOT_FONT = PLOT.font || {};
  var COLORS = THEME.COLORS || {};

  var ACCENT_PRESETS = [
    { id: 'orange', label: 'Orange', accent: '#ff8c00', accentAlpha: 'rgba(255,140,0,0.9)' },
    { id: 'cyan', label: 'Cyan', accent: '#06b6d4', accentAlpha: 'rgba(6,182,212,0.9)' },
    { id: 'neon-green', label: 'Green', accent: '#39ff14', accentAlpha: 'rgba(57,255,20,0.9)' },
    { id: 'pink', label: 'Pink', accent: '#ec4899', accentAlpha: 'rgba(236,72,153,0.9)' }
  ];

  var PLOT_BG = COLORS.bg || '#0d0d0d';
  var PLOT_FG = COLORS.fg || '#ffffff';
  var PLOT_MUTED = COLORS.muted || 'rgba(255,255,255,0.6)';
  var PLOT_MUTED_FILL = COLORS.mutedFill || PLOT_MUTED;
  var PLOT_GRID = COLORS.grid || '#2a2a2a';
  var PLOT_ACCENT = COLORS.accent || '#06b6d4';
  var PLOT_ACCENT_ALPHA = COLORS.accentAlpha || PLOT_ACCENT;
  var PLOT_GUIDE_LINE = COLORS.guideLine || PLOT_GRID;

  function applyStoredAccent() {
    try {
      var stored = localStorage.getItem('scirepo-accent');
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

  function setAccentPreset(presetId) {
    for (var i = 0; i < ACCENT_PRESETS.length; i++) {
      if (ACCENT_PRESETS[i].id === presetId) {
        PLOT_ACCENT = ACCENT_PRESETS[i].accent;
        PLOT_ACCENT_ALPHA = ACCENT_PRESETS[i].accentAlpha;
        try { localStorage.setItem('scirepo-accent', presetId); } catch (e) { /* ignore */ }
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
      rootStyle.setProperty('--range-input-bg', PLOT_CONTROLS.inputBg || COLORS.bg || '#0d0d0d');
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

  function withPlotClip(ctx, pad, w, h, drawFn) {
    if (!ctx || !pad || !drawFn) { if (drawFn) drawFn(); return; }
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.L, pad.T, w, h);
    ctx.clip();
    drawFn();
    ctx.restore();
  }

  function formatNumber(x) {
    if (x === 0) return '0';
    var a = Math.abs(x);
    if (a >= 1000 || (a < 0.001 && a > 0)) return x.toExponential(4);
    if (a >= 100) return x.toFixed(2);
    if (a >= 1) return x.toFixed(4);
    if (a >= 0.01) return x.toFixed(6);
    return x.toExponential(4);
  }

  function renderUnitConversionInputs() {
    var qOpts = Object.keys(CONV).map(function (key) {
      return '<option value="' + key + '">' + (quantityLabels[key] || key) + '</option>';
    }).join('');
    return '<div class="tool-input-group">' +
      '<label for="uc-quantity">Quantity</label>' +
      '<select id="uc-quantity">' + qOpts + '</select>' +
      '<label for="uc-unit">Unit</label>' +
      '<select id="uc-unit"></select>' +
      '<label for="uc-value">Value</label>' +
      '<input type="text" id="uc-value" inputmode="decimal" placeholder="Enter number" value="1">' +
      '</div>';
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
      return;
    }
    if (!q || !q.units) return;
    q.units.forEach(function (u) {
      var opt = document.createElement('option');
      opt.value = u.id;
      opt.textContent = u.label;
      sel.appendChild(opt);
    });
  }

  function runConversion() {
    var quantityId = document.getElementById('uc-quantity') && document.getElementById('uc-quantity').value;
    var unitId = document.getElementById('uc-unit') && document.getElementById('uc-unit').value;
    var valueStr = document.getElementById('uc-value') && document.getElementById('uc-value').value.trim();
    var container = document.getElementById('uc-results-table');
    if (!container || !quantityId || !CONV[quantityId]) return;

    var num = parseFloat(valueStr);
    var q = CONV[quantityId];
    var rows = [];
    var valueInBase;
    var invalid = isNaN(num);

    if (!invalid && q.special && quantityId === 'temperature') {
      valueInBase = TEMP[unitId].toBase(num);
      ['K', 'C', 'F'].forEach(function (key) {
        var t = TEMP[key];
        rows.push([t.label + ' (' + t.name + ')', formatNumber(t.fromBase(valueInBase))]);
      });
    } else if (!invalid) {
      var fromUnit = q.units.find(function (u) { return u.id === unitId; });
      if (fromUnit) {
        valueInBase = fromUnit.toBase ? fromUnit.toBase(num) : num * fromUnit.factor;
        q.units.forEach(function (u) {
          var v = u.fromBase ? u.fromBase(valueInBase) : valueInBase / u.factor;
          var unitCell = u.name ? u.label + ' (' + u.name + ')' : u.label;
          rows.push([unitCell, formatNumber(v)]);
        });
      }
    }
    if (invalid || rows.length === 0) {
      if (q.special && quantityId === 'temperature') {
        ['K', 'C', 'F'].forEach(function (key) {
          var t = TEMP[key];
          rows.push([t.label + ' (' + t.name + ')', '—']);
        });
      } else if (q && q.units) {
        q.units.forEach(function (u) {
          var unitCell = u.name ? u.label + ' (' + u.name + ')' : u.label;
          rows.push([unitCell, '—']);
        });
      }
    }

    var table = '<h2>Unit Conversion</h2>' + (invalid ? '<p class="placeholder">Enter a valid number.</p>' : '') + '<table class="conversion-table absorption-table"><thead><tr><th class="abs-name">Unit</th><th class="abs-val">Value</th></tr></thead><tbody>';
    rows.forEach(function (r) {
      table += '<tr><td class="abs-name">' + r[0] + '</td><td class="abs-val">' + r[1] + '</td></tr>';
    });
    table += '</tbody></table>';
    container.innerHTML = table;
  }

  function initUnitConversion() {
    toolInputsEl.innerHTML = renderUnitConversionInputs();
    toolResultsEl.innerHTML = '<div id="uc-results-table"></div>';
    fillUnitSelect('energy');
    runConversion();

    document.getElementById('uc-quantity').addEventListener('change', function () {
      fillUnitSelect(this.value);
      runConversion();
    });
    document.getElementById('uc-unit').addEventListener('change', runConversion);
    document.getElementById('uc-value').addEventListener('input', runConversion);
    document.getElementById('uc-value').addEventListener('change', runConversion);
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
    var knowns = [];
    if (t.needs.indexOf('M') !== -1) knowns.push('<label for="cs-molar-mass">Molar mass (g/mol)</label><input type="text" id="cs-molar-mass" inputmode="decimal" placeholder="g/mol" value="58.44">');
    if (t.needs.indexOf('rho_solute') !== -1) knowns.push('<label for="cs-rho-solute">Solute density (g/mL)</label><input type="text" id="cs-rho-solute" inputmode="decimal" placeholder="g/mL" value="1">');
    if (t.needs.indexOf('rho_solution') !== -1) knowns.push('<label for="cs-rho-solution">Solution density (g/mL)</label><input type="text" id="cs-rho-solution" inputmode="decimal" placeholder="g/mL" value="1">');
    var knownsEl = document.getElementById('cs-knowns');
    if (knownsEl) knownsEl.innerHTML = knowns.join('');
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
    if (stockRow) stockRow.style.display = source === 'stock' ? 'block' : 'none';
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
      rows.push('<tr><td class="abs-name">Result</td><td class="abs-val">—</td></tr>');
    } else if (source !== 'stock' && !isNaN(r.mass_g) && r.mass_g >= 0) {
      rows.push('<tr><td class="abs-name">Mass to add</td><td class="abs-val">' + formatNumber(r.mass_g) + ' g</td></tr>');
      rows.push('<tr><td class="abs-name"></td><td class="abs-val">' + formatNumber(r.mass_g * 1000) + ' mg</td></tr>');
    }
    if (!isNaN(r.volume_mL) && r.volume_mL >= 0) {
      rows.push('<tr><td class="abs-name">Volume to add (liquid solute)</td><td class="abs-val">' + formatNumber(r.volume_mL) + ' mL</td></tr>');
      if (r.volume_mL < 1) rows.push('<tr><td class="abs-name"></td><td class="abs-val">' + formatNumber(r.volume_mL * 1000) + ' μL</td></tr>');
    }
    if (!isNaN(r.V_stock_mL) && r.V_stock_mL >= 0) {
      rows.push('<tr><td class="abs-name">Take stock</td><td class="abs-val">' + formatNumber(r.V_stock_mL) + ' mL</td></tr>');
      var Vfinal = (r.V_final_L || 0) * 1000;
      if (Vfinal > 0) rows.push('<tr><td class="abs-name">Add solvent to</td><td class="abs-val">' + formatNumber(Vfinal) + ' mL total</td></tr>');
    }
    if (!r.error && !isNaN(r.moles) && r.moles >= 0) rows.push('<tr><td class="abs-name">Amount in final solution</td><td class="abs-val">' + formatNumber(r.moles * 1000) + ' mmol</td></tr>');
    if (!r.error && rows.length === 0) rows.push('<tr><td class="abs-name">Result</td><td class="abs-val">—</td></tr>');
    var html = '<h2>Chemical Solution</h2>' + formulaHtml + (r.error ? '<p class="placeholder">' + r.error + '</p>' : '');
    html += '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = html;
  }

  function initChemicalSolution() {
    var CS = window.SCIRESULTS_CS;
    var typeOpts = Object.keys(CS.concTypes).map(function (k) { return '<option value="' + k + '">' + CS.concTypes[k].label + '</option>'; }).join('');
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="cs-source">I am adding</label><select id="cs-source"><option value="solid" selected>Solid solute</option><option value="liquid">Pure liquid solute</option><option value="stock">From stock solution</option></select>' +
      '<div id="cs-stock-row" style="display:none"><label for="cs-stock-value">Stock concentration</label><input type="text" id="cs-stock-value" inputmode="decimal" placeholder="e.g. 1" value="1"><select id="cs-stock-unit"></select></div>' +
      '<div id="cs-knowns"></div>' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group">' +
      '<label for="cs-conc-type">Concentration type</label><select id="cs-conc-type">' + typeOpts + '</select>' +
      '<label for="cs-conc">Target concentration</label><input type="text" id="cs-conc" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '<select id="cs-conc-unit"></select>' +
      '<label for="cs-target">Target final volume or solvent mass</label><input type="text" id="cs-target" inputmode="decimal" placeholder="e.g. 100" value="100">' +
      '<select id="cs-target-unit"></select>' +
      '</div>';
    toolResultsEl.innerHTML = '<div id="cs-results"></div>';
    updateCsKnowns();
    ['cs-source', 'cs-conc-type', 'cs-conc', 'cs-target', 'cs-stock-value'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runChemicalSolution); el.addEventListener('change', runChemicalSolution); }
    });
    document.getElementById('cs-source').addEventListener('change', function () { updateCsKnowns(); });
    document.getElementById('cs-conc-type').addEventListener('change', function () { updateCsKnowns(); });
    document.getElementById('cs-conc-unit').addEventListener('change', runChemicalSolution);
    document.getElementById('cs-target-unit').addEventListener('change', runChemicalSolution);
    document.getElementById('cs-stock-unit') && document.getElementById('cs-stock-unit').addEventListener('change', runChemicalSolution);
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
    container.innerHTML = '';
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
    var canvas = document.createElement('canvas');
    var cw = size.cw;
    var ch = size.ch;
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'absorption-plot';
    var ctx = canvas.getContext('2d');
    var pad = PAD_LARGE;
    var w = canvas.width - pad.L - pad.R, h = canvas.height - pad.T - pad.B;
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, canvas.height - pad.B);
    ctx.lineTo(canvas.width - pad.R, canvas.height - pad.B);
    ctx.stroke();
    var xLabel = 'Thickness (' + thicknessUnitLabel(thicknessUnit_) + ')';
    ctx.font = FONT_LABEL;
    ctx.fillText(xLabel, canvas.width / 2, canvas.height - 10);
    var yLabel = plotY === 'I_I0' ? 'I/I₀' : plotY === 'A_nap' ? '−ln(I/I₀)' : '−log(I/I₀)';
    ctx.save();
    ctx.translate(18, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
    ctx.textAlign = 'right';
    var nX = 5, nY = 5;
    var xSpanDisplay = xMaxDisplay - xMinDisplay;
    var ySpan = yMax - yMin;
    ctx.font = FONT_SMALL;
    for (var xi = 0; xi <= nX; xi++) {
      var xVal = xMinDisplay + (xi / nX) * xSpanDisplay;
      var gx = pad.L + (xi / nX) * w;
      ctx.beginPath();
      ctx.moveTo(gx, canvas.height - pad.B);
      ctx.lineTo(gx, canvas.height - pad.B + 4);
      ctx.stroke();
      if (xi !== 0 && xi !== nX) ctx.fillText(formatPlotNum(xVal), gx - 4, canvas.height - pad.B + 18);
    }
    for (var yi = 0; yi <= nY; yi++) {
      var yVal = yMin + (yi / nY) * ySpan;
      var gy = canvas.height - pad.B - (yi / nY) * h;
      ctx.beginPath();
      ctx.moveTo(pad.L - 4, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
      if (yi !== 0 && yi !== nY) ctx.fillText(formatPlotNum(yVal), pad.L - 8, gy + 4);
    }
    ctx.textAlign = 'left';
    if (points.length && ySpan > 0) {
      ctx.strokeStyle = PLOT_ACCENT;
      ctx.lineWidth = 2;
      withPlotClip(ctx, pad, w, h, function () {
        ctx.beginPath();
        var xSpan_cm = xMax_cm - xMin_cm;
        var needMove = true;
        for (var i = 0; i < points.length; i++) {
          var tx = xSpan_cm > 0 ? (points[i].L_cm - xMin_cm) / xSpan_cm : 0;
          var ty = (points[i][yKey] - yMin) / ySpan;
          var inRange = tx >= 0 && tx <= 1 && ty >= 0 && ty <= 1;
          if (inRange) {
            var px = pad.L + tx * w;
            var py = canvas.height - pad.B - ty * h;
            if (needMove) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            needMove = false;
          } else {
            needMove = true;
          }
        }
        ctx.stroke();
      });
    }
    container.innerHTML = '';
    container.appendChild(canvas);
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

  function readAxisRange(prefix) {
    var xMinEl = document.getElementById(prefix + '-xmin');
    var xMaxEl = document.getElementById(prefix + '-xmax');
    var yMinEl = document.getElementById(prefix + '-ymin');
    var yMaxEl = document.getElementById(prefix + '-ymax');
    var xMin = (xMinEl && xMinEl.value.trim() !== '') ? parseFloat(xMinEl.value.replace(/,/g, '')) : null;
    var xMax = (xMaxEl && xMaxEl.value.trim() !== '') ? parseFloat(xMaxEl.value.replace(/,/g, '')) : null;
    var yMin = (yMinEl && yMinEl.value.trim() !== '') ? parseFloat(yMinEl.value.replace(/,/g, '')) : null;
    var yMax = (yMaxEl && yMaxEl.value.trim() !== '') ? parseFloat(yMaxEl.value.replace(/,/g, '')) : null;
    return { xMin: xMin, xMax: xMax, yMin: yMin, yMax: yMax };
  }

  function runAbsorption() {
    var container = document.getElementById('abs-results');
    var plotContainer = document.getElementById('abs-plot');
    if (!container) return;
    var ABS = window.SCIRESULTS_ABSORPTION;
    var coefType = (document.getElementById('abs-coef-type') && document.getElementById('abs-coef-type').value) || 'linear';
    var thicknessUnit = (document.getElementById('abs-thickness-unit') && document.getElementById('abs-thickness-unit').value) || 'um';
    var derive = (document.getElementById('abs-derive') && document.getElementById('abs-derive').value) || 'concentration';
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
    var getAbsRange = function () {
      var xMin = getAbsVal('abs-x-min'), xMax = getAbsVal('abs-x-max'), yMin = getAbsVal('abs-y-min'), yMax = getAbsVal('abs-y-max');
      var out = {};
      if (!isNaN(xMin) && !isNaN(xMax) && xMax > xMin) { out.xMin = xMin; out.xMax = xMax; }
      if (!isNaN(yMin) && !isNaN(yMax) && yMax > yMin) { out.yMin = yMin; out.yMax = yMax; }
      return Object.keys(out).length ? out : null;
    };
    var fmt = function (val) { return (val != null && !isNaN(val)) ? formatNumber(val) : '—'; };
    var valUnit = function (val, ok, unit) { return ok ? '<td class="abs-val">' + formatNumber(val) + '</td><td class="abs-unit">' + (unit || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var rows = [
      '<tr><td class="abs-name">I/I₀</td>' + (r.I_I0 != null && !isNaN(r.I_I0) ? '<td class="abs-val">' + fmt(r.I_I0) + '</td><td class="abs-unit"></td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">−ln(I/I₀)</td>' + (r.A_nap != null && !isNaN(r.A_nap) ? '<td class="abs-val">' + fmt(r.A_nap) + '</td><td class="abs-unit"></td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">−log₁₀(I/I₀)</td>' + (r.A_dec != null && !isNaN(r.A_dec) ? '<td class="abs-val">' + fmt(r.A_dec) + '</td><td class="abs-unit"></td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">α</td>' + valUnit(r.alpha_per_cm, r.alpha_per_cm != null && !isNaN(r.alpha_per_cm) && r.alpha_per_cm >= 0, 'cm⁻¹') + '</tr>',
      '<tr><td class="abs-name">a</td>' + valUnit(r.a_mass, r.a_mass != null && !isNaN(r.a_mass) && r.a_mass >= 0, 'cm²/g') + '</tr>',
      '<tr><td class="abs-name">ε</td>' + valUnit(r.epsilon, r.epsilon != null && !isNaN(r.epsilon) && r.epsilon >= 0, 'L/(mol·cm)') + '</tr>',
      '<tr><td class="abs-name">σ</td>' + valUnit(r.sigma_cm2, r.sigma_cm2 != null && !isNaN(r.sigma_cm2) && r.sigma_cm2 >= 0, 'cm²') + '</tr>'
    ];
    var formulaHtml = '<p class="tool-formula">I/I₀ = e<sup>−αL</sup></p>';
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Absorption</h2>' + formulaHtml + (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
    var plotY = (document.getElementById('abs-plot-y') && document.getElementById('abs-plot-y').value) || 'I_I0';
    var L_val = ABS.parseNum(document.getElementById('abs-thickness') && document.getElementById('abs-thickness').value);
    var L_cm_conv = (thicknessUnit === 'cm' ? 1 : thicknessUnit === 'mm' ? 0.1 : thicknessUnit === 'um' || thicknessUnit === 'μm' ? 1e-4 : 1e-7);
    var L_cm = (!isNaN(L_val) && L_val > 0) ? L_val * L_cm_conv : 0.01;
    var alpha = (r && !r.error && r.alpha_per_cm > 0) ? r.alpha_per_cm : 0;
    if (plotContainer) drawAbsorptionPlot(plotContainer, L_cm, alpha, plotY, thicknessUnit, getAbsRange());
  }

  function updateAbsorptionUnits() {
    var t = (document.getElementById('abs-coef-type') && document.getElementById('abs-coef-type').value) || 'linear';
    var sel = document.getElementById('abs-coef-unit');
    if (!sel) return;
    if (t === 'linear') sel.innerHTML = '<option value="per_cm">cm⁻¹</option><option value="per_mm">mm⁻¹</option><option value="per_m">m⁻¹</option>';
    else if (t === 'mass') sel.innerHTML = '<option value="cm2/g">cm²/g</option><option value="m2/kg">m²/kg</option>';
    else sel.innerHTML = '<option value="L/(mol·cm)">L/(mol·cm)</option>';
    runAbsorption();
  }

  function initAbsorption() {
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="abs-coef-type">Coefficient type</label><select id="abs-coef-type"><option value="linear">Linear (α)</option><option value="mass">Mass (a)</option><option value="molar">Molar (ε)</option></select>' +
      '<label for="abs-coef-value">Coefficient value</label><input type="text" id="abs-coef-value" inputmode="decimal" placeholder="e.g. 10000" value="10000">' +
      '<select id="abs-coef-unit"></select>' +
      '<label for="abs-thickness">Sample thickness</label><input type="text" id="abs-thickness" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '<select id="abs-thickness-unit"><option value="cm">cm</option><option value="mm">mm</option><option value="um" selected>μm</option><option value="nm">nm</option></select>' +
      '<label for="abs-derive">Derive (give the other two)</label><select id="abs-derive"><option value="concentration" selected>Concentration (from ρ, M)</option><option value="molarMass">Molar mass (from ρ, c)</option><option value="density">Density (from M, c)</option></select>' +
      '<label for="abs-density">Density (g/cm³)</label><input type="text" id="abs-density" inputmode="decimal" placeholder="optional" value="1">' +
      '<label for="abs-molar-mass">Molar mass (g/mol)</label><input type="text" id="abs-molar-mass" inputmode="decimal" placeholder="optional" value="58.44">' +
      '<label for="abs-concentration">Concentration (mol/L)</label><input type="text" id="abs-concentration" inputmode="decimal" placeholder="optional" value="0.1">' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group">' +
      '<label for="abs-plot-y">Plot Y-axis</label><select id="abs-plot-y"><option value="I_I0" selected>I/I₀</option><option value="A_nap">−ln(I/I₀)</option><option value="A_dec">−log(I/I₀)</option></select>' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="absorption-results-wrap">' +
      '<select class="mobile-results-select" id="abs-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot">Plot</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="abs-results"></div></div>' +
      '<div class="mobile-results-section" data-section="plot"><div class="plot-panel">' +
      '<div id="abs-plot" class="absorption-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="abs-x-min" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="abs-x-max" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="abs-y-min" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="abs-y-max" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div>';
    updateAbsorptionUnits();
    ['abs-coef-type', 'abs-coef-value', 'abs-thickness', 'abs-density', 'abs-molar-mass', 'abs-concentration', 'abs-derive', 'abs-x-min', 'abs-x-max', 'abs-y-min', 'abs-y-max'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runAbsorption); el.addEventListener('change', runAbsorption); }
    });
    document.getElementById('abs-coef-type').addEventListener('change', updateAbsorptionUnits);
    document.getElementById('abs-coef-unit') && document.getElementById('abs-coef-unit').addEventListener('change', runAbsorption);
    document.getElementById('abs-thickness-unit') && document.getElementById('abs-thickness-unit').addEventListener('change', runAbsorption);
    document.getElementById('abs-plot-y') && document.getElementById('abs-plot-y').addEventListener('change', runAbsorption);
    bindMobileResultsSwitcher('abs-mobile-select', 'absorption-results-wrap');
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
    var container = document.getElementById('lp-results');
    if (!container) return;
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
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var rows = [
      '<tr><td class="abs-name">Spot 1/e² X</td>' + valUnit(r.spotX_1e2_um, 'μm') + '</tr>',
      '<tr><td class="abs-name">Spot 1/e² Y</td>' + valUnit(r.spotY_1e2_um, 'μm') + '</tr>',
      '<tr><td class="abs-name">Spot FWHM X</td>' + valUnit(r.spotX_FWHM_um, 'μm') + '</tr>',
      '<tr><td class="abs-name">Spot FWHM Y</td>' + valUnit(r.spotY_FWHM_um, 'μm') + '</tr>',
      '<tr><td class="abs-name">Wavelength</td>' + valUnit(r.wavelength_nm, 'nm') + '</tr>',
      '<tr><td class="abs-name">Photon energy</td>' + valUnit(r.wavelength_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Duration (FWHM)</td>' + (r.duration_FWHM_s != null && !isNaN(r.duration_FWHM_s) ? '<td class="abs-val">' + formatNumber(r.duration_FWHM_s * 1e15) + '</td><td class="abs-unit">fs</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">Peak intensity</td>' + valUnit(r.peakIntensity_Wm2, 'W/m²') + '</tr>',
      '<tr><td class="abs-name"></td>' + valUnit(r.peakIntensity_Wcm2, 'W/cm²') + '</tr>',
      '<tr><td class="abs-name">Peak E field</td>' + valUnit(r.peakEfield_Vm, 'V/m') + '</tr>',
      '<tr><td class="abs-name">Peak B field</td>' + valUnit(r.peakBfield_T, 'T') + '</tr>',
      '<tr><td class="abs-name">Area (1/e²)</td>' + valUnit(r.area_1e2_um2, 'μm²') + '</tr>',
      '<tr><td class="abs-name">Area (FWHM)</td>' + valUnit(r.area_FWHM_um2, 'μm²') + '</tr>',
      '<tr><td class="abs-name">Min. bandwidth</td>' + (r.bandwidthMin_Hz != null && !isNaN(r.bandwidthMin_Hz) ? '<td class="abs-val">' + formatNumber(r.bandwidthMin_Hz >= 1e12 ? r.bandwidthMin_Hz / 1e12 : r.bandwidthMin_Hz) + '</td><td class="abs-unit">' + (r.bandwidthMin_Hz >= 1e12 ? 'THz' : 'Hz') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name"></td>' + valUnit(r.bandwidthMin_nm, 'nm') + '</tr>',
      '<tr><td class="abs-name"></td>' + valUnit(r.bandwidthMin_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Fluence</td>' + valUnit(r.fluence_Jm2, 'J/m²') + '</tr>',
      '<tr><td class="abs-name">Photons/pulse</td>' + valUnit(r.photonsPerPulse, '') + '</tr>',
      '<tr><td class="abs-name">Photons/s</td>' + valUnit(r.photonsPerSec, '') + '</tr>',
      '<tr><td class="abs-name">Power</td>' + valUnit(r.power_W, 'W') + '</tr>'
    ];
    var formulaHtml = '';
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Laser Pulse</h2>' + formulaHtml + (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
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
    var canvas = document.createElement('canvas');
    var size = getPlotSize(container, SIZE_MED.cw, SIZE_MED.ch);
    var cw = size.cw;
    var ch = size.ch;
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    var pad = PAD_SMALL;
    var ww = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText(title, cw / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    var rr = readAxisRange(rangePrefix || 'lp-plot');
    var xMin = -naturalExtent, xMax = naturalExtent;
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) {
      xMin = rr.xMin;
      xMax = rr.xMax;
    }
    // Generate points over the current X range so zooming is a true data zoom, not just axis rescale.
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
    var xt = axisTicks(xMin, xMax, 5);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    xMinors.forEach(function (xVal) {
      var tx = (xVal - xMin) / (xMax - xMin || 1);
      if (tx >= 0 && tx <= 1) {
        var gx = pad.L + tx * ww;
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var ty = (yVal - yMin) / (yMax - yMin || 1);
      var gy = ch - pad.B - ty * h;
      ctx.beginPath();
      ctx.moveTo(pad.L - 3, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
    });
    xTicks.forEach(function (xVal) {
      var tx = (xVal - xMin) / (xMax - xMin || 1);
      if (tx >= 0 && tx <= 1) {
        var gx = pad.L + tx * ww;
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.font = FONT_TICK;
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.round(xVal * 10) / 10), gx, ch - pad.B + 22);
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var ty = (yVal - yMin) / (yMax - yMin || 1);
      var gy = ch - pad.B - ty * h;
      ctx.beginPath();
      ctx.moveTo(pad.L - 6, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
      ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('Position (μm)', pad.L + ww / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Intensity (W/cm²)', 0, 0);
    ctx.restore();
    ctx.lineWidth = 1.5;
    if (hasData && points.length) {
      ctx.strokeStyle = PLOT_ACCENT;
      withPlotClip(ctx, pad, ww, h, function () {
        ctx.beginPath();
        var needMove = true;
        var xSpan = xMax - xMin || 1;
        for (var i = 0; i < points.length; i++) {
          var tx = (points[i].x - xMin) / xSpan;
          var ty = (yMax - yMin) > 0 ? (points[i].I - yMin) / (yMax - yMin) : 0;
          if (tx >= 0 && tx <= 1 && ty >= 0 && ty <= 1) {
            var px = pad.L + tx * ww;
            var py = ch - pad.B - ty * h;
            if (needMove) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            needMove = false;
          } else { needMove = true; }
        }
        ctx.stroke();
      });
      var fwhmRadius = w * Math.sqrt(Math.LN2 / 2);
      var I_1e2 = I0_Wcm2 * Math.exp(-2);
      var I_hm = IMax / 2;
      var ySpan = (yMax - yMin) || 1;
      var gy_1e2 = ch - pad.B - (I_1e2 - yMin) / ySpan * h;
      var gy_hm = ch - pad.B - (I_hm - yMin) / ySpan * h;
      var plotTop = pad.T;
      var plotBottom = ch - pad.B;
      var clipY = function (gy) { return Math.max(plotTop, Math.min(gy, plotBottom)); };
      ctx.lineWidth = 1;
      var xSpan = xMax - xMin || 1;
      [w, -w].forEach(function (xVal) {
        var tx = (xVal - xMin) / xSpan;
        if (tx >= 0 && tx <= 1) {
          var gx = pad.L + tx * ww;
          ctx.strokeStyle = PLOT_FG;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(gx, plotBottom);
          ctx.lineTo(gx, clipY(gy_1e2));
          ctx.stroke();
        }
      });
      [fwhmRadius, -fwhmRadius].forEach(function (xVal) {
        var tx = (xVal - xMin) / xSpan;
        if (tx >= 0 && tx <= 1) {
          var gx = pad.L + tx * ww;
          ctx.strokeStyle = PLOT_GUIDE_LINE;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(gx, plotBottom);
          ctx.lineTo(gx, clipY(gy_hm));
          ctx.stroke();
        }
      });
    } else {
      ctx.fillStyle = PLOT_MUTED_FILL;
      ctx.font = FONT_TICK;
      ctx.textAlign = 'center';
      ctx.fillText('No data', pad.L + ww / 2, pad.T + h / 2);
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = PLOT_FG;
    var legX = pad.L + ww - 72;
    var legY = pad.T + 10;
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'left';
    ctx.strokeStyle = PLOT_FG;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 18, legY);
    ctx.stroke();
    ctx.fillText('1/e²', legX + 22, legY + 4);
    legY += 14;
    ctx.strokeStyle = PLOT_GUIDE_LINE;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 18, legY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('FWHM', legX + 22, legY + 4);
    container.innerHTML = '';
    container.appendChild(canvas);
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
    var size = getPlotSize(container, SIZE_MED.cw, SIZE_MED.ch);
    var cw = size.cw;
    var ch = size.ch;
    var d = Math.min(cw - pad.L - pad.R, ch - pad.T - pad.B);
    d = Math.max(d, 200);
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    if (hasData) {
      var rgb = hexToRgb(PLOT_ACCENT);
      var imgData = ctx.createImageData(d, d);
      var data = imgData.data;
      for (var py = 0; py < d; py++) {
        for (var px = 0; px < d; px++) {
          var x_um = xMin + (xMax - xMin) * (px / (d - 1 || 1));
          var y_um = yMin + (yMax - yMin) * (py / (d - 1 || 1));
          var r2 = (x_um * x_um) / (wx * wx) + (y_um * y_um) / (wy * wy);
          var I = I0_Wm2 * Math.exp(-2 * r2);
          var frac = I0_Wm2 > 0 ? Math.sqrt(I / I0_Wm2) : 0;
          frac = Math.min(1, frac);
          var i = (py * d + px) * 4;
          data[i] = Math.round(rgb.r * frac);
          data[i + 1] = Math.round(rgb.g * frac);
          data[i + 2] = Math.round(rgb.b * frac);
          data[i + 3] = 255;
        }
      }
      ctx.putImageData(imgData, pad.L, pad.T);
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
    ctx.fillText('X (μm)', pad.L + d / 2, xLabelY);
    ctx.save();
    ctx.translate(52, pad.T + d / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Y (μm)', 0, 0);
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
    var canvas = document.createElement('canvas');
    var size = getPlotSize(container, SIZE_MED.cw, SIZE_MED.ch);
    var cw = size.cw;
    var ch = size.ch;
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    var pad = PAD_SMALL;
    var ww = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText('Pulse (time)', cw / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    var rr = readAxisRange(rangePrefix || 'lp-plot');
    var xMin = -naturalExtent, xMax = naturalExtent;
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) {
      xMin = rr.xMin;
      xMax = rr.xMax;
    }
    // Generate points over the current X range (time axis).
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
    var xt = axisTicks(xMin, xMax, 5);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    xMinors.forEach(function (xVal) {
      var tx = (xVal - xMin) / (xMax - xMin || 1);
      if (tx >= 0 && tx <= 1) {
        var gx = pad.L + tx * ww;
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var ty = (yVal - yMin) / (yMax - yMin || 1);
      var gy = ch - pad.B - ty * h;
      ctx.beginPath();
      ctx.moveTo(pad.L - 3, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
    });
    xTicks.forEach(function (xVal) {
      var tx = (xVal - xMin) / (xMax - xMin || 1);
      if (tx >= 0 && tx <= 1) {
        var gx = pad.L + tx * ww;
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.font = FONT_TICK;
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.round(xVal * 10) / 10), gx, ch - pad.B + 22);
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var ty = (yVal - yMin) / (yMax - yMin || 1);
      var gy = ch - pad.B - ty * h;
      ctx.beginPath();
      ctx.moveTo(pad.L - 6, gy);
      ctx.lineTo(pad.L, gy);
      ctx.stroke();
      ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('Time (fs)', pad.L + ww / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Intensity (W/cm²)', 0, 0);
    ctx.restore();
    ctx.lineWidth = 1.5;
    var ySpanT = (yMax - yMin) || 1;
    var I_1e2 = I0_Wcm2 * Math.exp(-2);
    var I_hm = IMax / 2;
    var gy_1e2 = ch - pad.B - (I_1e2 - yMin) / ySpanT * h;
    var gy_hm = ch - pad.B - (I_hm - yMin) / ySpanT * h;
    var plotTopT = pad.T;
    var plotBottomT = ch - pad.B;
    var clipYT = function (gy) { return Math.max(plotTopT, Math.min(gy, plotBottomT)); };
    var xSpanT = (xMax - xMin) || 1;
    if (hasData && points.length) {
      ctx.strokeStyle = PLOT_ACCENT;
      withPlotClip(ctx, pad, ww, h, function () {
        ctx.beginPath();
        var needMove = true;
        for (var i = 0; i < points.length; i++) {
          var tx = (points[i].t - xMin) / xSpanT;
          var ty = (points[i].I - yMin) / ySpanT;
          if (tx >= 0 && tx <= 1 && ty >= 0 && ty <= 1) {
            var px = pad.L + tx * ww;
            var py = ch - pad.B - ty * h;
            if (needMove) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            needMove = false;
          } else { needMove = true; }
        }
        ctx.stroke();
      });
      var tau_FWHM_fs = tau_FWHM_s * 1e15;
      var fwhmHalf_fs = tau_FWHM_fs / 2;
      ctx.lineWidth = 1;
      [tau_fs, -tau_fs].forEach(function (tVal) {
        var tx = (tVal - xMin) / xSpanT;
        if (tx >= 0 && tx <= 1) {
          var gx = pad.L + tx * ww;
          ctx.strokeStyle = PLOT_FG;
          ctx.setLineDash([]);
          ctx.beginPath();
          ctx.moveTo(gx, plotBottomT);
          ctx.lineTo(gx, clipYT(gy_1e2));
          ctx.stroke();
        }
      });
      [fwhmHalf_fs, -fwhmHalf_fs].forEach(function (tVal) {
        var tx = (tVal - xMin) / xSpanT;
        if (tx >= 0 && tx <= 1) {
          var gx = pad.L + tx * ww;
          ctx.strokeStyle = PLOT_GUIDE_LINE;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(gx, plotBottomT);
          ctx.lineTo(gx, clipYT(gy_hm));
          ctx.stroke();
        }
      });
    } else {
      ctx.fillStyle = PLOT_MUTED_FILL;
      ctx.font = FONT_TICK;
      ctx.textAlign = 'center';
      ctx.fillText('No data', pad.L + ww / 2, pad.T + h / 2);
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1.5;
    ctx.fillStyle = PLOT_FG;
    var legX = pad.L + ww - 72;
    var legY = pad.T + 10;
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'left';
    ctx.strokeStyle = PLOT_FG;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 18, legY);
    ctx.stroke();
    ctx.fillText('1/e²', legX + 22, legY + 4);
    legY += 14;
    ctx.strokeStyle = PLOT_GUIDE_LINE;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(legX, legY);
    ctx.lineTo(legX + 18, legY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('FWHM', legX + 22, legY + 4);
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function runParticle() {
    var PART = window.SCIREPO_PARTICLE;
    if (!PART) return;
    var container = document.getElementById('part-results');
    var plotContainer = document.getElementById('part-plot');
    if (!container) return;
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
    var rows = [
      '<tr><td class="abs-name">Mass</td>' + valUnit(r.mass_u, 'u') + '</tr>',
      '<tr><td class="abs-name">Charge</td>' + valUnit(r.charge_e, 'e') + '</tr>',
      '<tr><td class="abs-name">Kinetic energy</td>' + valUnit(r.kineticEnergy_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Total energy</td>' + valUnit(r.totalEnergy_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Rest energy</td>' + valUnit(r.restEnergy_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Relativistic mass</td>' + valUnit(r.relativisticMass_kg, 'kg') + '</tr>',
      '<tr><td class="abs-name">Velocity (classical)</td>' + valUnit(r.velocityClassical_ms, 'm/s') + '</tr>',
      '<tr><td class="abs-name"></td>' + (r.velocityClassical_ms != null && isFinite(r.velocityClassical_ms) ? '<td class="abs-val">' + formatNumber(r.velocityClassical_ms / 2.99792458e8) + '</td><td class="abs-unit">c</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">Velocity (relativistic)</td>' + valUnit(r.velocityRelativistic_ms, 'm/s') + '</tr>',
      '<tr><td class="abs-name"></td>' + (r.velocityRelativistic_ms != null && isFinite(r.velocityRelativistic_ms) ? '<td class="abs-val">' + formatNumber(r.velocityRelativistic_ms / 2.99792458e8) + '</td><td class="abs-unit">c</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">Momentum (classical)</td>' + valUnit(r.momentumClassical_kgms, 'kg·m/s') + '</tr>',
      '<tr><td class="abs-name">Momentum (relativistic)</td>' + valUnit(r.momentumRelativistic_kgms, 'kg·m/s') + '</tr>',
      '<tr><td class="abs-name">De Broglie wavelength</td>' + (r.deBroglieWavelength_m != null && isFinite(r.deBroglieWavelength_m) ? '<td class="abs-val">' + formatNumber(r.deBroglieWavelength_m < 1e-6 ? r.deBroglieWavelength_m * 1e9 : r.deBroglieWavelength_m) + '</td><td class="abs-unit">' + (r.deBroglieWavelength_m < 1e-6 ? 'nm' : 'm') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>') + '</tr>',
      '<tr><td class="abs-name">Lorentz factor γ</td>' + valUnit(r.lorentzFactor, '') + '</tr>'
    ];
    if (isFinite(radiusB)) rows.push('<tr><td class="abs-name">Trajectory radius (in B-field)</td>' + valUnit(radiusB, 'm') + '</tr>');
    if (isFinite(accelE)) rows.push('<tr><td class="abs-name">Acceleration (in E-field)</td>' + valUnit(accelE, 'm/s²') + '</tr>');
    var formulaHtml = '';
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Particle</h2>' + formulaHtml + (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
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
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
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
    var pad = PAD_LARGE;
    var cw = size.cw;
    var ch = size.ch;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var scaleX = w / (xHi - xLo);
    var scaleY = h / (yHi - yLo);
    var scale = Math.min(scaleX, scaleY);
    var offsetX = (w - (xHi - xLo) * scale) / 2;
    var offsetY = (h - (yHi - yLo) * scale) / 2;
    var ax = pad.L;
    var ay = pad.T;
    var axisBottom = ay + h;
    var axisLeft = ax;
    var xt = axisTicks(xLo, xHi, 4);
    var yt = axisTicks(yLo, yHi, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText(hasData ? 'Trajectory' : 'Trajectory (enter field value)', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(axisLeft, ay);
    ctx.lineTo(axisLeft, axisBottom);
    ctx.lineTo(ax + w, axisBottom);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    var tTol = 1e-12;
    xMinors.forEach(function (xVal) {
      var gx = ax + offsetX + (xVal - xLo) * scale;
      if (gx >= axisLeft - 1 && gx <= ax + w + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, axisBottom);
        ctx.lineTo(gx, axisBottom + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ay + h - offsetY - (yVal - yLo) * scale;
      if (gy >= ay - 1 && gy <= axisBottom + 1) {
        ctx.beginPath();
        ctx.moveTo(axisLeft - 3, gy);
        ctx.lineTo(axisLeft, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_SMALL;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = ax + offsetX + (xVal - xLo) * scale;
      if (gx >= axisLeft - 1 && gx <= ax + w + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, axisBottom);
        ctx.lineTo(gx, axisBottom + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(xVal), gx, axisBottom + 20);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ay + h - offsetY - (yVal - yLo) * scale;
      if (gy >= ay - 1 && gy <= axisBottom + 1) {
        ctx.beginPath();
        ctx.moveTo(axisLeft - 6, gy);
        ctx.lineTo(axisLeft, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), axisLeft - 8, gy + 4);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('x (m)', ax + w / 2, ch - 10);
    ctx.save();
    ctx.translate(14, ay + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('y (m)', 0, 0);
    ctx.restore();
    if (hasData) {
      ctx.strokeStyle = PLOT_ACCENT;
      ctx.lineWidth = 1.5;
      withPlotClip(ctx, { L: ax, T: ay }, w, h, function () {
        ctx.beginPath();
        ctx.moveTo(ax + offsetX + (pts[0].x - xLo) * scale, ay + h - offsetY - (pts[0].y - yLo) * scale);
        for (var i = 1; i < pts.length; i++) {
          ctx.lineTo(ax + offsetX + (pts[i].x - xLo) * scale, ay + h - offsetY - (pts[i].y - yLo) * scale);
        }
        ctx.stroke();
      });
    }
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function initParticle() {
    var PART = window.SCIREPO_PARTICLE;
    if (!PART) return;
    var opts = PART.COMMON_PARTICLES.map(function (p) {
      return '<option value="' + p.id + '">' + p.label + '</option>';
    }).join('');
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="part-type">Particle</label><select id="part-type">' + opts + '</select>' +
      '<div id="part-custom-wrap" style="display:none">' +
      '<label for="part-mass">Mass (u)</label><input type="text" id="part-mass" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '<label for="part-charge">Charge (e)</label><input type="text" id="part-charge" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '</div>' +
      '<label for="part-ke">Kinetic energy (eV)</label><input type="text" id="part-ke" inputmode="decimal" placeholder="e.g. 1000" value="1000">' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group">' +
      '<label for="part-field-type">Trajectory: field</label><select id="part-field-type"><option value="B">B (magnetic)</option><option value="E">E (electric)</option></select>' +
      '<label for="part-field-val">Field value</label><input type="text" id="part-field-val" inputmode="decimal" placeholder="B in T or E in V/m" value="1">' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="part-results-wrap">' +
      '<select class="mobile-results-select" id="part-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot">Plot</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="part-results"></div></div>' +
      '<div class="mobile-results-section" data-section="plot"><div class="plot-panel">' +
      '<div class="part-plots-wrap"><div id="part-plot" class="laser-plot-wrap"></div></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="part-plot-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="part-plot-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="part-plot-ymin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="part-plot-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div>';
    runParticle();
    bindMobileResultsSwitcher('part-mobile-select', 'part-results-wrap');
    var typeEl = document.getElementById('part-type');
    if (typeEl) {
      typeEl.addEventListener('change', function () {
        document.getElementById('part-custom-wrap').style.display = typeEl.value === 'custom' ? 'block' : 'none';
        runParticle();
      });
    }
    ['part-mass', 'part-charge', 'part-ke', 'part-field-type', 'part-field-val', 'part-plot-xmin', 'part-plot-xmax', 'part-plot-ymin', 'part-plot-ymax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runParticle); el.addEventListener('change', runParticle); }
    });
  }

  function runBoltzmann() {
    var BOLT = window.SCIREPO_BOLTZMANN;
    if (!BOLT) return;
    var container = document.getElementById('boltzmann-results');
    var plotContainer = document.getElementById('boltzmann-plot');
    if (!container) return;
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
    var formulaHtml = '<p class="tool-formula">p<sub>i</sub> = g<sub>i</sub> e<sup>−E<sub>i</sub>/(kT)</sup> / Q</p>';
    var rows = [];
    if (r.error) {
      rows.push('<tr><td class="abs-name">Temperature</td><td class="abs-val">—</td><td class="abs-unit">K</td><td colspan="2"></td></tr>');
      rows.push('<tr><td class="abs-name">Partition function Q</td><td class="abs-val">—</td><td class="abs-unit" colspan="3"></td></tr>');
      rows.push('<tr><td class="abs-name">State</td><td class="abs-name">E (cm⁻¹)</td><td class="abs-name">g</td><td class="abs-name">N/N₀</td><td class="abs-name">Fraction</td></tr>');
      rows.push('<tr><td class="abs-name">—</td><td class="abs-val">—</td><td class="abs-val">—</td><td class="abs-val">—</td><td class="abs-val">—</td></tr>');
      var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
      container.innerHTML = '<h2>Boltzmann distribution</h2>' + formulaHtml + '<p class="placeholder">' + r.error + '</p>' + tableHtml;
      if (plotContainer) drawBoltzmannPlot(plotContainer, r);
      return;
    }
    rows.push('<tr><td class="abs-name">Temperature</td>' + valCell(r.temperature_K) + '<td class="abs-unit">K</td><td colspan="2"></td></tr>');
    rows.push('<tr><td class="abs-name">Partition function Q</td>' + valCell(r.partitionFunction) + '<td class="abs-unit" colspan="3"></td></tr>');
    rows.push('<tr><td class="abs-name">State</td><td class="abs-name">E (cm⁻¹)</td><td class="abs-name">g</td><td class="abs-name">N/N₀</td><td class="abs-name">Fraction</td></tr>');
    r.levels.forEach(function (lev) {
      rows.push('<tr><td class="abs-name">' + (lev.label || '') + '</td>' + valCell(lev.E_cm) + valCell(lev.g) + valCell(lev.relPop) + valCell(lev.fraction) + '</tr>');
    });
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Boltzmann distribution</h2>' + formulaHtml + tableHtml;
    if (plotContainer) drawBoltzmannPlot(plotContainer, r);
  }

  function initBoltzmann() {
    var BOLT = window.SCIREPO_BOLTZMANN;
    if (!BOLT) return;
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="boltzmann-mode">Mode</label><select id="boltzmann-mode">' +
      '<option value="rotational">Rotational</option>' +
      '<option value="vibrational">Vibrational</option>' +
      '<option value="generic">Generic</option>' +
      '</select>' +
      '<label for="boltzmann-T">Temperature (K)</label><input type="text" id="boltzmann-T" inputmode="decimal" placeholder="e.g. 300" value="300">' +
      '<div id="boltzmann-rot" class="boltzmann-mode-wrap">' +
      '<label for="boltzmann-B">B (cm⁻¹)</label><input type="text" id="boltzmann-B" inputmode="decimal" placeholder="e.g. 2" value="2">' +
      '<label for="boltzmann-maxJ">Max J</label><input type="text" id="boltzmann-maxJ" inputmode="decimal" placeholder="20" value="20">' +
      '</div>' +
      '<div id="boltzmann-vib" class="boltzmann-mode-wrap" style="display:none">' +
      '<label for="boltzmann-omega">ω_e (cm⁻¹)</label><input type="text" id="boltzmann-omega" inputmode="decimal" placeholder="e.g. 2000" value="2000">' +
      '<label for="boltzmann-maxV">Max v</label><input type="text" id="boltzmann-maxV" inputmode="decimal" placeholder="10" value="10">' +
      '</div>' +
      '<div id="boltzmann-gen" class="boltzmann-mode-wrap" style="display:none">' +
      '<label for="boltzmann-levels">Levels (E cm⁻¹, g, one per line)</label><textarea id="boltzmann-levels" rows="6" placeholder="0 1&#10;10 2&#10;25 1"></textarea>' +
      '</div>' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="boltzmann-results-wrap">' +
      '<select class="mobile-results-select" id="boltzmann-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot">Plot</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="boltzmann-results"></div></div>' +
      '<div class="mobile-results-section" data-section="plot"><div class="plot-panel">' +
      '<div class="boltzmann-plot-wrap"><div id="boltzmann-plot" class="laser-plot-wrap"></div></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="boltzmann-plot-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="boltzmann-plot-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="boltzmann-plot-ymin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="boltzmann-plot-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div>';
    var modeEl = document.getElementById('boltzmann-mode');
    var rotDiv = document.getElementById('boltzmann-rot');
    var vibDiv = document.getElementById('boltzmann-vib');
    var genDiv = document.getElementById('boltzmann-gen');
    function toggleMode() {
      var m = modeEl.value;
      if (rotDiv) rotDiv.style.display = m === 'rotational' ? 'block' : 'none';
      if (vibDiv) vibDiv.style.display = m === 'vibrational' ? 'block' : 'none';
      if (genDiv) genDiv.style.display = m === 'generic' ? 'block' : 'none';
      runBoltzmann();
    }
    if (modeEl) modeEl.addEventListener('change', toggleMode);
    ['boltzmann-T', 'boltzmann-B', 'boltzmann-maxJ', 'boltzmann-omega', 'boltzmann-maxV', 'boltzmann-levels', 'boltzmann-plot-xmin', 'boltzmann-plot-xmax', 'boltzmann-plot-ymin', 'boltzmann-plot-ymax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runBoltzmann); el.addEventListener('change', runBoltzmann); }
    });
    runBoltzmann();
    bindMobileResultsSwitcher('boltzmann-mobile-select', 'boltzmann-results-wrap');
  }

  function drawBoltzmannPlot(container, r) {
    var levels = r && r.levels ? r.levels : [];
    var plotMax = null;
    var yMaxManual = null;
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
    var cw = size.cw;
    var ch = size.ch;
    if (!levels.length) {
      var pad = PAD_LARGE;
      var w = cw - pad.L - pad.R;
      var h = ch - pad.T - pad.B;
      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.className = 'laser-plot';
      var ctx = canvas.getContext('2d');
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
    var pad = PAD_LARGE;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xMin = -0.5;
    var xMax = useLevels.length - 0.5;
    var yMin = 0;
    var rr = readAxisRange('boltzmann-plot');
    if (rr.xMin != null && rr.xMax != null && isFinite(rr.xMin) && isFinite(rr.xMax) && rr.xMax > rr.xMin) { xMin = rr.xMin; xMax = rr.xMax; }
    if (rr.yMin != null && rr.yMax != null && isFinite(rr.yMin) && isFinite(rr.yMax) && rr.yMax > rr.yMin) { yMin = rr.yMin; yMax = rr.yMax; }
    else if (rr.yMin != null && isFinite(rr.yMin)) yMin = rr.yMin;
    var xt = axisTicks(xMin, xMax, 4);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText('Population fraction', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    var tTol = 1e-12;
    xMinors.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal / yMax) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(xVal), gx, ch - pad.B + 22);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 6, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('State index', pad.L + w / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Fraction', 0, 0);
    ctx.restore();
    var barW = (xMax > xMin ? w / (xMax - xMin) : w) * 0.7;
    var dx = (xMax > xMin ? w / (xMax - xMin) : 1);
    ctx.fillStyle = PLOT_ACCENT;
    withPlotClip(ctx, pad, w, h, function () {
      useLevels.forEach(function (lev, i) {
        var frac = lev.fraction != null ? lev.fraction : 0;
        var gx = pad.L + (i - xMin) * dx - barW / 2;
        var barH = (frac / yMax) * h;
        var gy = ch - pad.B - barH;
        if (barH > 0) ctx.fillRect(gx, gy, barW, barH);
      });
    });
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function runPhotoionization() {
    var PI = window.SCIREPO_PHOTOIONIZATION;
    if (!PI) return;
    var container = document.getElementById('pi-results');
    var plotContainer = document.getElementById('pi-plot');
    if (!container) return;
    var E_photon = PI.parseNum(document.getElementById('pi-Ephoton') && document.getElementById('pi-Ephoton').value);
    var E_binding = PI.parseNum(document.getElementById('pi-Ebinding') && document.getElementById('pi-Ebinding').value);
    var mass_u = PI.parseNum(document.getElementById('pi-mass') && document.getElementById('pi-mass').value);
    var Gamma = PI.parseNum(document.getElementById('pi-Gamma') && document.getElementById('pi-Gamma').value);
    var E_Auger = PI.parseNum(document.getElementById('pi-EAuger') && document.getElementById('pi-EAuger').value);
    var params = { E_photon_eV: E_photon, E_binding_eV: E_binding, mass_u: mass_u, Gamma_eV: Gamma, E_Auger_eV: E_Auger };
    var r = PI.compute(params);
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var rows = [];
    var formulaHtml = '<p class="tool-formula">KE = hν − E<sub>bind</sub></p>';
    if (r.error) {
      var emptyRows = [
        '<tr><td class="abs-name">KE (e⁻)</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>',
        '<tr><td class="abs-name">Recoil KE (ion)</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>',
        '<tr class="pi-table-sep"><td colspan="3"></td></tr>',
        '<tr><td class="abs-name">Post-collision interaction shift</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>',
        '<tr><td class="abs-name">KE after PCI and recoil (e⁻)</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>'
      ];
      var emptyTable = '<table class="conversion-table absorption-table pi-results-table"><tbody>' + emptyRows.join('') + '</tbody></table>';
      container.innerHTML = '<h2>Photoionization</h2>' + formulaHtml + '<p class="placeholder">' + r.error + '</p>' + emptyTable;
      if (plotContainer) drawPhotoionizationAngular(plotContainer);
      var lineshapeContainer = document.getElementById('pi-plot-lineshape');
      if (lineshapeContainer) drawPhotoionizationLineshape(lineshapeContainer, r);
      return;
    }
    rows.push('<tr><td class="abs-name">KE (e⁻)</td>' + valUnit(r.KE_eV, 'eV') + '</tr>');
    rows.push('<tr><td class="abs-name">Recoil KE (ion)</td>' + valUnit(r.recoil_eV, 'eV') + '</tr>');
    rows.push('<tr class="pi-table-sep"><td colspan="3"></td></tr>');
    rows.push('<tr><td class="abs-name">Post-collision interaction shift</td>' + valUnit(r.PCI_shift_eV, 'eV') + '</tr>');
    rows.push('<tr><td class="abs-name">KE after PCI and recoil (e⁻)</td>' + valUnit(r.KE_after_PCI_and_recoil_eV, 'eV') + '</tr>');
    var tableHtml = '<table class="conversion-table absorption-table pi-results-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Photoionization</h2>' + formulaHtml + tableHtml;
    if (plotContainer) drawPhotoionizationAngular(plotContainer);
    var lineshapeContainer = document.getElementById('pi-plot-lineshape');
    if (lineshapeContainer) drawPhotoionizationLineshape(lineshapeContainer, r);
  }

  function drawPhotoionizationAngular(container) {
    var PI = window.SCIREPO_PHOTOIONIZATION;
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
    var size = getPlotSize(container, SIZE_SMALL.cw, SIZE_SMALL.ch);
    var cw = size.cw;
    var ch = size.ch;
    var pad = PAD_SMALL;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xt = axisTicks(xMin, xMax, 4);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText('Angular distribution (β = ' + formatNumber(beta) + ')', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    xMinors.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(xVal), gx, ch - pad.B + 22);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 6, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('θ (deg)', pad.L + w / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Relative intensity', 0, 0);
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.rect(pad.L, pad.T, w, h);
    ctx.clip();
    ctx.strokeStyle = PLOT_ACCENT;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    var first = true;
    points.forEach(function (p) {
      if (p.theta_deg < xMin || p.theta_deg > xMax) return;
      var gx = pad.L + (p.theta_deg - xMin) / (xMax - xMin || 1) * w;
      var gy = ch - pad.B - (p.intensity - yMin) / (yMax - yMin || 1) * h;
      if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
    });
    ctx.stroke();
    ctx.restore();
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function drawPhotoionizationLineshape(container, r) {
    var PI = window.SCIREPO_PHOTOIONIZATION;
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
    var size = getPlotSize(container, SIZE_SMALL.cw, SIZE_SMALL.ch);
    var cw = size.cw;
    var ch = size.ch;
    var pad = PAD_SMALL;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xt = axisTicks(xMin, xMax, 4);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText('Photoelectron lineshape', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    xMinors.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(xVal), gx, ch - pad.B + 22);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 6, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('E (eV)', pad.L + w / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Relative intensity', 0, 0);
    ctx.restore();
    if (points.length) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.L, pad.T, w, h);
      ctx.clip();
      ctx.strokeStyle = PLOT_ACCENT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var first = true;
      points.forEach(function (p) {
        var gx = pad.L + (p.E_eV - xMin) / (xMax - xMin || 1) * w;
        var gy = ch - pad.B - (p.intensity - yMin) / (yMax - yMin || 1) * h;
        if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
      });
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = PLOT_MUTED;
      ctx.font = FONT_TITLE;
      ctx.textAlign = 'center';
      ctx.fillText('No lineshape data', pad.L + w / 2, pad.T + h / 2);
    }
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function initPhotoionization() {
    var PI = window.SCIREPO_PHOTOIONIZATION;
    if (!PI) return;
    toolInputsEl.innerHTML =
      '<div class="pi-input-group"><span class="pi-input-head">KE</span>' +
      '<label for="pi-Ephoton">Photon energy (eV)</label><input type="text" id="pi-Ephoton" inputmode="decimal" placeholder="e.g. 1000" value="1000">' +
      '<label for="pi-Ebinding">Binding energy (eV)</label><input type="text" id="pi-Ebinding" inputmode="decimal" placeholder="e.g. 500" value="500">' +
      '</div><hr class="pi-input-sep">' +
      '<div class="pi-input-group"><span class="pi-input-head">Recoil</span>' +
      '<label for="pi-mass">Mass (u, optional)</label><input type="text" id="pi-mass" inputmode="decimal" placeholder="e.g. 16" value="16">' +
      '</div><hr class="pi-input-sep">' +
      '<div class="pi-input-group"><span class="pi-input-head">Post-collision interaction</span>' +
      '<label for="pi-Gamma">Core hole Γ (FWHM, eV, optional)</label><input type="text" id="pi-Gamma" inputmode="decimal" placeholder="e.g. 0.1" value="0.1">' +
      '<label for="pi-EAuger">Auger energy (eV, optional)</label><input type="text" id="pi-EAuger" inputmode="decimal" placeholder="e.g. 200" value="200">' +
      '</div><hr class="pi-input-sep">' +
      '<div class="pi-input-group"><span class="pi-input-head">Angular distribution</span>' +
      '<label for="pi-beta">β</label><input type="text" id="pi-beta" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '</div><hr class="pi-input-sep">' +
      '<div class="pi-input-group"><span class="pi-input-head">Lineshape</span>' +
      '<label for="pi-resolution">Experimental resolution (FWHM, eV)</label><input type="text" id="pi-resolution" inputmode="decimal" placeholder="e.g. 0.05" value="0.05">' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="pi-results-wrap">' +
      '<select class="mobile-results-select" id="pi-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot-angular">Angular</option><option value="plot-lineshape">Lineshape</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="pi-results"></div></div>' +
      '<div class="pi-plots-group">' +
      '<div class="mobile-results-section" data-section="plot-angular"><div class="pi-plot-wrap"><div class="plot-panel">' +
      '<div id="pi-plot" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="pi-plot-xmin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="pi-plot-xmax" inputmode="decimal" placeholder="180" value="180"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="pi-plot-ymin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="pi-plot-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div>' +
      '<div class="mobile-results-section" data-section="plot-lineshape"><div class="pi-plot-wrap"><div class="plot-panel">' +
      '<div id="pi-plot-lineshape" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="pi-lineshape-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="pi-lineshape-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="pi-lineshape-ymin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="pi-lineshape-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div></div></div>';
    ['pi-Ephoton', 'pi-Ebinding', 'pi-mass', 'pi-Gamma', 'pi-EAuger', 'pi-resolution', 'pi-beta', 'pi-plot-xmin', 'pi-plot-xmax', 'pi-plot-ymin', 'pi-plot-ymax', 'pi-lineshape-xmin', 'pi-lineshape-xmax', 'pi-lineshape-ymin', 'pi-lineshape-ymax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runPhotoionization); el.addEventListener('change', runPhotoionization); }
    });
    runPhotoionization();
    bindMobileResultsSwitcher('pi-mobile-select', 'pi-results-wrap');
  }

  function runCompton() {
    var COM = window.SCIREPO_COMPTON;
    if (!COM) return;
    var container = document.getElementById('compton-results');
    var plotContainer = document.getElementById('compton-plot');
    if (!container) return;
    var E_incident = COM.parseNum(document.getElementById('compton-E') && document.getElementById('compton-E').value);
    var theta = COM.parseNum(document.getElementById('compton-theta') && document.getElementById('compton-theta').value);
    if (isNaN(theta)) theta = 0;
    var r = COM.compute({ E_incident_eV: E_incident, theta_deg: theta });
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var formulaHtml = '<p class="tool-formula">E′ = E / (1 + (E / m<sub>e</sub>c²)(1 − cos θ))</p><p class="tool-formula">Δλ = λ<sub>C</sub>(1 − cos θ)</p>';
    if (r.error) {
      var emptyRows = [
        '<tr><td class="abs-name">Energy of scattered photon (eV)</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>',
        '<tr><td class="abs-name">Energy of electron (eV)</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>',
        '<tr><td class="abs-name">Δλ (pm)</td><td class="abs-val">—</td><td class="abs-unit"></td></tr>'
      ];
      var emptyTable = '<table class="conversion-table absorption-table"><tbody>' + emptyRows.join('') + '</tbody></table>';
      container.innerHTML = '<h2>Compton scattering</h2>' + formulaHtml + '<p class="placeholder">' + r.error + '</p>' + emptyTable;
      if (plotContainer) drawComptonPlot(plotContainer);
      return;
    }
    var rows = [
      '<tr><td class="abs-name">Energy of scattered photon (eV)</td>' + valUnit(r.E_scattered_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Energy of electron (eV)</td>' + valUnit(r.recoil_KE_eV, 'eV') + '</tr>',
      '<tr><td class="abs-name">Δλ (pm)</td>' + valUnit(r.deltaLambda_pm, 'pm') + '</tr>'
    ];
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Compton scattering</h2>' + formulaHtml + tableHtml;
    if (plotContainer) drawComptonPlot(plotContainer);
  }

  function drawComptonPlot(container) {
    var COM = window.SCIREPO_COMPTON;
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
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
    var cw = size.cw;
    var ch = size.ch;
    var pad = PAD_LARGE;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xt = axisTicks(xMin, xMax, 4);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText('Scattered energy vs angle', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    xMinors.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(xVal), gx, ch - pad.B + 22);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 6, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('θ (deg)', pad.L + w / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('E (eV)', 0, 0);
    ctx.restore();
    if (points.length) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.L, pad.T, w, h);
      ctx.clip();
      ctx.strokeStyle = PLOT_ACCENT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      var first = true;
      points.forEach(function (p) {
        if (p.theta_deg < xMin || p.theta_deg > xMax) return;
        var gx = pad.L + (p.theta_deg - xMin) / (xMax - xMin || 1) * w;
        var gy = ch - pad.B - (p.E_scattered_eV - yMin) / (yMax - yMin || 1) * h;
        if (first) { ctx.moveTo(gx, gy); first = false; } else ctx.lineTo(gx, gy);
      });
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = PLOT_MUTED;
      ctx.font = FONT_TITLE;
      ctx.textAlign = 'center';
      ctx.fillText('Enter incident energy (eV)', pad.L + w / 2, pad.T + h / 2);
    }
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function initCompton() {
    var COM = window.SCIREPO_COMPTON;
    if (!COM) return;
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="compton-E">Incident photon energy (eV)</label><input type="text" id="compton-E" inputmode="decimal" placeholder="e.g. 100000" value="100000">' +
      '<label for="compton-theta">Scattering angle (deg)</label><input type="text" id="compton-theta" inputmode="decimal" placeholder="e.g. 90" value="90">' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="pi-results-wrap">' +
      '<select class="mobile-results-select" id="compton-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot">Plot</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="compton-results"></div></div>' +
      '<div class="mobile-results-section" data-section="plot"><div class="plot-panel">' +
      '<div id="compton-plot" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="compton-plot-xmin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="compton-plot-xmax" inputmode="decimal" placeholder="180" value="180"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="compton-plot-ymin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="compton-plot-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div>';
    ['compton-E', 'compton-theta', 'compton-plot-xmin', 'compton-plot-xmax', 'compton-plot-ymin', 'compton-plot-ymax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runCompton); el.addEventListener('change', runCompton); }
    });
    runCompton();
    bindMobileResultsSwitcher('compton-mobile-select', 'pi-results-wrap');
  }

  function runBlackbody() {
    var BB = window.SCIREPO_BLACKBODY;
    if (!BB) return;
    var container = document.getElementById('bb-results');
    var plotContainer = document.getElementById('bb-plot');
    if (!container) return;
    var T_K = BB.parseNum(document.getElementById('bb-T') && document.getElementById('bb-T').value);
    var r = BB.compute({ T_K: T_K });
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var rows = [
      '<tr><td class="abs-name">Temperature</td>' + valUnit(r.T_K, 'K') + '</tr>',
      '<tr><td class="abs-name">Peak wavelength (Wien)</td>' + valUnit(r.peakWavelength_nm, 'nm') + '</tr>',
      '<tr><td class="abs-name">Peak wavelength</td>' + valUnit(r.peakWavelength_m, 'm') + '</tr>',
      '<tr><td class="abs-name">Total radiance (Stefan–Boltzmann)</td>' + valUnit(r.totalRadiance_Wm2, 'W/m²') + '</tr>'
    ];
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Blackbody</h2>' + (r.error ? '<p class="placeholder">' + r.error + '</p>' : '') + tableHtml;
    if (plotContainer) drawBlackbodySpectrum(plotContainer, r.error ? NaN : r.T_K);
  }

  function drawBlackbodySpectrum(container, T_K) {
    var BB = window.SCIREPO_BLACKBODY;
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
      // Choose the plotted window where the curve has meaningful amplitude.
      var thr = 0.01; // 1% of peak
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
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
    var cw = size.cw;
    var ch = size.ch;
    var pad = PAD_LARGE;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xt = axisTicks(xMin, xMax, 4);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText(hasData ? 'Spectral radiance (relative)' : 'Enter temperature (K)', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    xMinors.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = pad.L + (xVal - xMin) / (xMax - xMin || 1) * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(xVal), gx, ch - pad.B + 22);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / (yMax - yMin || 1) * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 6, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('Wavelength (nm)', pad.L + w / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Relative B(λ)', 0, 0);
    ctx.restore();
    if (hasData && points.length >= 2) {
      ctx.strokeStyle = PLOT_ACCENT;
      ctx.lineWidth = 1.5;
      // Clip to the plot area so zoomed ranges can't draw outside axes.
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.L, pad.T, w, h);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(pad.L + (points[0].lambda_nm - xMin) / (xMax - xMin) * w, ch - pad.B - (points[0].B_rel - yMin) / (yMax - yMin) * h);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(pad.L + (points[i].lambda_nm - xMin) / (xMax - xMin) * w, ch - pad.B - (points[i].B_rel - yMin) / (yMax - yMin) * h);
      }
      ctx.stroke();
      ctx.restore();
    }
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function initBlackbody() {
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="bb-T">Temperature</label><input type="text" id="bb-T" inputmode="decimal" placeholder="e.g. 5778" value="5778">' +
      '<span class="abs-unit" style="margin-left:0.25rem">K</span>' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="absorption-results-wrap">' +
      '<select class="mobile-results-select" id="bb-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot">Plot</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="bb-results"></div></div>' +
      '<div class="mobile-results-section" data-section="plot"><div class="plot-panel">' +
      '<div id="bb-plot" class="bb-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="bb-plot-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="bb-plot-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="bb-plot-ymin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="bb-plot-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div>';
    var el = document.getElementById('bb-T');
    if (el) { el.addEventListener('input', runBlackbody); el.addEventListener('change', runBlackbody); }
    ['bb-plot-xmin', 'bb-plot-xmax', 'bb-plot-ymin', 'bb-plot-ymax'].forEach(function (id) {
      var rEl = document.getElementById(id);
      if (rEl) { rEl.addEventListener('input', runBlackbody); rEl.addEventListener('change', runBlackbody); }
    });
    runBlackbody();
    bindMobileResultsSwitcher('bb-mobile-select', 'absorption-results-wrap');
  }

  function runPeakConvolution() {
    var PC = window.SCIREPO_PEAK_CONVOLUTION;
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
    var valUnit = function (v, u) { return (v != null && !isNaN(v) && isFinite(v)) ? '<td class="abs-val">' + formatNumber(v) + '</td><td class="abs-unit">' + (u || '') + '</td>' : '<td class="abs-val">—</td><td class="abs-unit"></td>'; };
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="3" class="placeholder">' + r.error + '</td></tr>');
    } else {
      if (mode === 'convolve') {
        rows.push('<tr><td class="abs-name">Conv. FWHM</td>' + valUnit(r.fwhmResult, '') + '</tr>');
        if (r.fwhmResultG > 0 || r.fwhmResultL > 0) {
          rows.push('<tr><td class="abs-name">FWHM_G</td>' + valUnit(r.fwhmResultG, '') + '</tr>');
          rows.push('<tr><td class="abs-name">FWHM_L</td>' + valUnit(r.fwhmResultL, '') + '</tr>');
          if (r.fwhmResultG > 0 && r.fwhmResultL > 0) rows.push('<tr><td class="abs-name">Voigt FWHM</td>' + valUnit(r.fwhmVoigt, '') + '</tr>');
        }
      } else {
        rows.push('<tr><td class="abs-name">Peak 2 FWHM</td>' + valUnit(r.fwhmResult, '') + '</tr>');
        if (r.fwhmResultG > 0 || r.fwhmResultL > 0) {
          rows.push('<tr><td class="abs-name">FWHM_G</td>' + valUnit(r.fwhmResultG, '') + '</tr>');
          rows.push('<tr><td class="abs-name">FWHM_L</td>' + valUnit(r.fwhmResultL, '') + '</tr>');
          if (r.fwhmResultG > 0 && r.fwhmResultL > 0) rows.push('<tr><td class="abs-name">Voigt FWHM</td>' + valUnit(r.fwhmVoigt, '') + '</tr>');
        }
      }
    }
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    container.innerHTML = '<h2>Peak Convolution</h2>' + tableHtml;
  }

  function initPeakConvolution() {
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="pc-mode">Mode</label><select id="pc-mode"><option value="convolve">Convolve two peaks</option><option value="deconvolve">Deconvolve (find peak 2)</option></select>' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group" id="pc-peak1-wrap">' +
      '<label for="pc-type1">Peak 1 type</label><select id="pc-type1"><option value="gaussian">Gaussian</option><option value="lorentzian">Lorentzian</option><option value="voigt">Voigt</option></select>' +
      '<div id="pc-fwhm1-wrap"><label for="pc-fwhm1">Peak 1 FWHM</label><input type="text" id="pc-fwhm1" inputmode="decimal" placeholder="e.g. 1" value="1"></div>' +
      '<div id="pc-voigt1-wrap" style="display:none">' +
      '<label for="pc-fwhm1g">Peak 1 FWHM_G</label><input type="text" id="pc-fwhm1g" inputmode="decimal" placeholder="Gaussian part" value="0.5">' +
      '<label for="pc-fwhm1l">Peak 1 FWHM_L</label><input type="text" id="pc-fwhm1l" inputmode="decimal" placeholder="Lorentzian part" value="0.5">' +
      '</div>' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group" id="pc-peak2-wrap">' +
      '<label for="pc-type2">Peak 2 type</label><select id="pc-type2"><option value="gaussian">Gaussian</option><option value="lorentzian">Lorentzian</option><option value="voigt">Voigt</option></select>' +
      '<div id="pc-fwhm2-wrap"><label for="pc-fwhm2">Peak 2 FWHM</label><input type="text" id="pc-fwhm2" inputmode="decimal" placeholder="e.g. 1" value="1"></div>' +
      '<div id="pc-voigt2-wrap" style="display:none">' +
      '<label for="pc-fwhm2g">Peak 2 FWHM_G</label><input type="text" id="pc-fwhm2g" inputmode="decimal" placeholder="Gaussian part" value="0.5">' +
      '<label for="pc-fwhm2l">Peak 2 FWHM_L</label><input type="text" id="pc-fwhm2l" inputmode="decimal" placeholder="Lorentzian part" value="0.5">' +
      '</div>' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group" id="pc-conv-wrap" style="display:none">' +
      '<label for="pc-conv-type">Convoluted result type</label><select id="pc-conv-type"><option value="gaussian">Gaussian</option><option value="lorentzian">Lorentzian</option><option value="voigt">Voigt</option></select>' +
      '<div id="pc-conv-fwhm-wrap"><label for="pc-conv-fwhm">Convoluted FWHM</label><input type="text" id="pc-conv-fwhm" inputmode="decimal" placeholder="measured total" value="2"></div>' +
      '<div id="pc-conv-voigt-wrap" style="display:none">' +
      '<label for="pc-conv-g">Convoluted FWHM_G</label><input type="text" id="pc-conv-g" inputmode="decimal" placeholder="Gaussian part" value="0.5">' +
      '<label for="pc-conv-l">Convoluted FWHM_L</label><input type="text" id="pc-conv-l" inputmode="decimal" placeholder="Lorentzian part" value="0.5">' +
      '</div>' +
      '</div>';
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
      var fwhmW = document.getElementById('pc-fwhm1-wrap');
      if (voigtW) voigtW.style.display = t === 'voigt' ? '' : 'none';
      if (fwhmW) fwhmW.style.display = t === 'voigt' ? 'none' : '';
    }
    function toggleVoigt2() {
      var t = document.getElementById('pc-type2') && document.getElementById('pc-type2').value;
      var voigtW = document.getElementById('pc-voigt2-wrap');
      var fwhmW = document.getElementById('pc-fwhm2-wrap');
      if (voigtW) voigtW.style.display = t === 'voigt' ? '' : 'none';
      if (fwhmW) fwhmW.style.display = t === 'voigt' ? 'none' : '';
    }
    function toggleConvVoigt() {
      var t = document.getElementById('pc-conv-type') && document.getElementById('pc-conv-type').value;
      var voigtW = document.getElementById('pc-conv-voigt-wrap');
      var fwhmW = document.getElementById('pc-conv-fwhm-wrap');
      if (voigtW) voigtW.style.display = t === 'voigt' ? '' : 'none';
      if (fwhmW) fwhmW.style.display = t === 'voigt' ? 'none' : '';
    }
    function updateLabels() {
      var mode = document.getElementById('pc-mode') && document.getElementById('pc-mode').value;
      var lbl = document.querySelector('#pc-peak1-wrap label[for="pc-type1"]');
      if (lbl) lbl.textContent = mode === 'deconvolve' ? 'Known peak type' : 'Peak 1 type';
      var fw = document.querySelector('#pc-peak1-wrap label[for="pc-fwhm1"]');
      if (fw) fw.textContent = mode === 'deconvolve' ? 'Known peak FWHM' : 'Peak 1 FWHM';
    }
    var modeEl = document.getElementById('pc-mode');
    if (modeEl) modeEl.addEventListener('change', function () { toggleDeconv(); updateLabels(); runPeakConvolution(); });
    var t1 = document.getElementById('pc-type1');
    if (t1) t1.addEventListener('change', function () { toggleVoigt1(); runPeakConvolution(); });
    var t2 = document.getElementById('pc-type2');
    if (t2) t2.addEventListener('change', function () { toggleVoigt2(); runPeakConvolution(); });
    var tc = document.getElementById('pc-conv-type');
    if (tc) tc.addEventListener('change', function () { toggleConvVoigt(); runPeakConvolution(); });
    toggleDeconv();
    toggleVoigt1();
    toggleVoigt2();
    toggleConvVoigt();
    updateLabels();
    ['pc-fwhm1', 'pc-fwhm1g', 'pc-fwhm1l', 'pc-fwhm2', 'pc-fwhm2g', 'pc-fwhm2l', 'pc-conv-fwhm', 'pc-conv-g', 'pc-conv-l'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runPeakConvolution); el.addEventListener('change', runPeakConvolution); }
    });
    runPeakConvolution();
  }

  function runDecay() {
    var DECAY = window.SCIREPO_DECAY;
    if (!DECAY) return;
    var container = document.getElementById('decay-results');
    var plotContainer = document.getElementById('decay-plot');
    var N0El = document.getElementById('decay-N0');
    var tHalfEl = document.getElementById('decay-t-half');
    var tHalfUnitEl = document.getElementById('decay-t-half-unit');
    var tEl = document.getElementById('decay-t');
    var tUnitEl = document.getElementById('decay-t-unit');
    var N0 = DECAY.parseNum(N0El && N0El.value);
    var tHalf = DECAY.parseNum(tHalfEl && tHalfEl.value);
    var t = DECAY.parseNum(tEl && tEl.value);
    var tHalfUnit = (tHalfUnitEl && tHalfUnitEl.value) || 's';
    var tUnit = (tUnitEl && tUnitEl.value) || 's';
    var r = DECAY.compute({ N0: N0, t_half: tHalf, t_half_unit: tHalfUnit, t: t, t_unit: tUnit });
    var rows = [];
    if (r.error) {
      rows.push('<tr><td colspan="3" class="placeholder">' + r.error + '</td></tr>');
    } else {
      rows.push('<tr><td class="abs-name">N(t)</td><td class="abs-val">' + formatNumber(r.N) + '</td><td class="abs-unit"></td></tr>');
      rows.push('<tr><td class="abs-name">Activity</td><td class="abs-val">' + formatNumber(r.A_Bq) + '</td><td class="abs-unit">Bq</td></tr>');
      rows.push('<tr><td class="abs-name">Decay constant λ</td><td class="abs-val">' + (r.lambda_s != null ? r.lambda_s.toExponential(4) : '—') + '</td><td class="abs-unit">s⁻¹</td></tr>');
      rows.push('<tr><td class="abs-name">Half-lives elapsed</td><td class="abs-val">' + formatNumber(r.halfLivesElapsed) + '</td><td class="abs-unit"></td></tr>');
    }
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    if (container) container.innerHTML = '<h2>Decay / half-life</h2>' + tableHtml;
    if (plotContainer) drawDecayPlot(plotContainer, N0, r.error ? null : r.tHalf_s, r, tUnit);
  }

  function drawDecayPlot(container, N0, tHalf_s, r, tUnit) {
    var DECAY = window.SCIREPO_DECAY;
    if (!DECAY || !container) return;
    var timeLabel = DECAY.timeUnitLabel ? DECAY.timeUnitLabel(tUnit || 's') : 's';
    var pad = PAD_LARGE;
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
    var cw = size.cw;
    var ch = size.ch;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    if (!r || r.error || N0 <= 0 || !tHalf_s || tHalf_s <= 0) {
      var canvas = document.createElement('canvas');
      canvas.width = cw;
      canvas.height = ch;
      canvas.className = 'laser-plot';
      var ctx = canvas.getContext('2d');
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
    var size = getPlotSize(container, SIZE_LARGE.cw, SIZE_LARGE.ch);
    var cw = size.cw;
    var ch = size.ch;
    var pad = PAD_LARGE;
    var w = cw - pad.L - pad.R;
    var h = ch - pad.T - pad.B;
    var xt = axisTicks(tMin_s, tMax_s, 5);
    var yt = axisTicks(yMin, yMax, 4);
    var xTicks = xt.majors;
    var yTicks = yt.majors;
    var xMinors = xt.minors;
    var yMinors = yt.minors;
    var canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    canvas.className = 'laser-plot';
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = PLOT_BG;
    ctx.fillRect(0, 0, cw, ch);
    ctx.strokeStyle = PLOT_FG;
    ctx.fillStyle = PLOT_FG;
    ctx.font = FONT_TITLE;
    ctx.textAlign = 'center';
    ctx.fillText('N(t) vs time', pad.L + w / 2, 16);
    ctx.beginPath();
    ctx.moveTo(pad.L, pad.T);
    ctx.lineTo(pad.L, ch - pad.B);
    ctx.lineTo(cw - pad.R, ch - pad.B);
    ctx.stroke();
    ctx.strokeStyle = PLOT_FG;
    ctx.lineWidth = 1;
    var xSpan = tMax_s - tMin_s || 1;
    var ySpan = yMax - yMin || 1;
    var timeFromSec = DECAY.timeFromSeconds ? function (t_s) { return DECAY.timeFromSeconds(t_s, tUnit); } : function (t_s) { return t_s; };
    xMinors.forEach(function (xVal) {
      var gx = pad.L + (xVal - tMin_s) / xSpan * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 3);
        ctx.stroke();
      }
    });
    yMinors.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / ySpan * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 3, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
      }
    });
    ctx.font = FONT_TICK;
    ctx.textAlign = 'center';
    xTicks.forEach(function (xVal) {
      var gx = pad.L + (xVal - tMin_s) / xSpan * w;
      if (gx >= pad.L - 1 && gx <= cw - pad.R + 1) {
        ctx.beginPath();
        ctx.moveTo(gx, ch - pad.B);
        ctx.lineTo(gx, ch - pad.B + 6);
        ctx.stroke();
        ctx.fillText(formatPlotNum(timeFromSec(xVal)), gx, ch - pad.B + 22);
      }
    });
    ctx.textAlign = 'right';
    yTicks.forEach(function (yVal) {
      var gy = ch - pad.B - (yVal - yMin) / ySpan * h;
      if (gy >= pad.T - 1 && gy <= ch - pad.B + 1) {
        ctx.beginPath();
        ctx.moveTo(pad.L - 6, gy);
        ctx.lineTo(pad.L, gy);
        ctx.stroke();
        ctx.fillText(formatPlotNum(yVal), pad.L - 10, gy + 5);
      }
    });
    ctx.font = FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('Time (' + timeLabel + ')', pad.L + w / 2, ch - 8);
    ctx.save();
    ctx.translate(12, pad.T + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('N', 0, 0);
    ctx.restore();
    if (points.length >= 2) {
      ctx.strokeStyle = PLOT_ACCENT;
      ctx.lineWidth = 1.5;
      ctx.save();
      ctx.beginPath();
      ctx.rect(pad.L, pad.T, w, h);
      ctx.clip();
      ctx.beginPath();
      ctx.moveTo(pad.L + (points[0].t_s - tMin_s) / xSpan * w, ch - pad.B - (points[0].N - yMin) / ySpan * h);
      for (var i = 1; i < points.length; i++) {
        ctx.lineTo(pad.L + (points[i].t_s - tMin_s) / xSpan * w, ch - pad.B - (points[i].N - yMin) / ySpan * h);
      }
      ctx.stroke();
      ctx.restore();
    }
    container.innerHTML = '';
    container.appendChild(canvas);
  }

  function initDecay() {
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="decay-N0">Initial amount N₀</label><input type="text" id="decay-N0" inputmode="decimal" placeholder="e.g. 1e6" value="1e6">' +
      '<label for="decay-t-half">Half-life</label><input type="text" id="decay-t-half" inputmode="decimal" placeholder="e.g. 10" value="10">' +
      '<select id="decay-t-half-unit"><option value="s">s</option><option value="min">min</option><option value="h">h</option><option value="d">d</option><option value="y" selected>yr</option></select>' +
      '<label for="decay-t">Time t</label><input type="text" id="decay-t" inputmode="decimal" placeholder="e.g. 5" value="5">' +
      '<select id="decay-t-unit"><option value="s">s</option><option value="min">min</option><option value="h">h</option><option value="d">d</option><option value="y" selected>yr</option></select>' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="absorption-results-wrap">' +
      '<select class="mobile-results-select" id="decay-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option><option value="plot">Plot</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="decay-results"></div></div>' +
      '<div class="mobile-results-section" data-section="plot"><div class="plot-panel">' +
      '<div id="decay-plot" class="bb-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="decay-plot-xmin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="decay-plot-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="decay-plot-ymin" inputmode="decimal" placeholder="0" value="0">' +
      '<input type="text" id="decay-plot-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div></div>';
    ['decay-N0', 'decay-t-half', 'decay-t', 'decay-t-half-unit', 'decay-t-unit', 'decay-plot-xmin', 'decay-plot-xmax', 'decay-plot-ymin', 'decay-plot-ymax'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runDecay); el.addEventListener('change', runDecay); }
    });
    runDecay();
    bindMobileResultsSwitcher('decay-mobile-select', 'absorption-results-wrap');
  }

  function runIdealGas() {
    var IG = window.SCIREPO_IDEAL_GAS;
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
      rows.push('<tr><td colspan="3" class="placeholder">' + r.error + '</td></tr>');
    } else {
      var fmt = function (v) { return v != null && isFinite(v) ? formatNumber(v) : '—'; };
      rows.push('<tr><td class="abs-name">P</td><td class="abs-val">' + fmt(r.P_Pa) + '</td><td class="abs-unit">Pa</td></tr>');
      rows.push('<tr><td class="abs-name">V</td><td class="abs-val">' + fmt(r.V_m3) + '</td><td class="abs-unit">m³</td></tr>');
      rows.push('<tr><td class="abs-name">n</td><td class="abs-val">' + fmt(r.n_mol) + '</td><td class="abs-unit">mol</td></tr>');
      rows.push('<tr><td class="abs-name">T</td><td class="abs-val">' + fmt(r.T_K) + '</td><td class="abs-unit">K</td></tr>');
    }
    var tableHtml = '<table class="conversion-table absorption-table"><tbody>' + rows.join('') + '</tbody></table>';
    if (container) container.innerHTML = '<h2>Ideal gas</h2>' + tableHtml;
  }

  function initIdealGas() {
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="ideal-gas-solve">Solve for</label><select id="ideal-gas-solve">' +
      '<option value="P">P (pressure)</option><option value="V">V (volume)</option><option value="n">n (amount)</option><option value="T">T (temperature)</option>' +
      '</select>' +
      '<label for="ideal-gas-P">P</label><input type="text" id="ideal-gas-P" inputmode="decimal" placeholder="e.g. 101325" value="101325">' +
      '<select id="ideal-gas-P-unit"><option value="Pa">Pa</option><option value="bar">bar</option><option value="atm" selected>atm</option><option value="mmHg">mmHg</option></select>' +
      '<label for="ideal-gas-V">V</label><input type="text" id="ideal-gas-V" inputmode="decimal" placeholder="e.g. 22.4" value="22.4">' +
      '<select id="ideal-gas-V-unit"><option value="m3">m³</option><option value="L" selected>L</option><option value="mL">mL</option></select>' +
      '<label for="ideal-gas-n">n (mol)</label><input type="text" id="ideal-gas-n" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '<label for="ideal-gas-T">T</label><input type="text" id="ideal-gas-T" inputmode="decimal" placeholder="e.g. 273.15" value="273.15">' +
      '<select id="ideal-gas-T-unit"><option value="K" selected>K</option><option value="c">°C</option></select>' +
      '</div>';
    toolResultsEl.innerHTML = '<div id="ideal-gas-results"></div>';
    ['ideal-gas-solve', 'ideal-gas-P', 'ideal-gas-V', 'ideal-gas-n', 'ideal-gas-T', 'ideal-gas-P-unit', 'ideal-gas-V-unit', 'ideal-gas-T-unit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runIdealGas); el.addEventListener('change', runIdealGas); }
    });
    runIdealGas();
  }

  function initLaserPulse() {
    toolInputsEl.innerHTML =
      '<div class="tool-input-group">' +
      '<label for="lp-spot-type">Spot size type</label><select id="lp-spot-type"><option value="FWHM" selected>FWHM</option><option value="1e2">1/e²</option></select>' +
      '<label for="lp-spot-x">Spot X (μm)</label><input type="text" id="lp-spot-x" inputmode="decimal" placeholder="e.g. 10" value="10">' +
      '<label for="lp-spot-y">Spot Y (μm)</label><input type="text" id="lp-spot-y" inputmode="decimal" placeholder="e.g. 10" value="10">' +
      '<label for="lp-wavelength">Wavelength</label><input type="text" id="lp-wavelength" inputmode="decimal" placeholder="e.g. 800" value="800">' +
      '<select id="lp-wavelength-unit"><option value="nm" selected>nm</option><option value="eV">eV</option></select>' +
      '<label for="lp-duration">Pulse duration (FWHM)</label><input type="text" id="lp-duration" inputmode="decimal" placeholder="e.g. 30" value="30">' +
      '<select id="lp-duration-unit"><option value="fs" selected>fs</option><option value="ps">ps</option><option value="ns">ns</option><option value="us">μs</option><option value="ms">ms</option><option value="s">s</option></select>' +
      '<label for="lp-energy">Pulse energy</label><input type="text" id="lp-energy" inputmode="decimal" placeholder="e.g. 1" value="1">' +
      '<select id="lp-energy-unit"><option value="nJ">nJ</option><option value="uJ" selected>μJ</option><option value="mJ">mJ</option><option value="J">J</option></select>' +
      '</div><hr class="tool-input-sep">' +
      '<div class="tool-input-group">' +
      '<label for="lp-rep-rate">Rep. rate</label><input type="text" id="lp-rep-rate" inputmode="decimal" placeholder="e.g. 1" value="1000">' +
      '<select id="lp-rep-rate-unit"><option value="Hz">Hz</option><option value="kHz" selected>kHz</option><option value="MHz">MHz</option></select>' +
      '</div>';
    toolResultsEl.innerHTML =
      '<div class="lp-results-wrap">' +
      '<select class="mobile-results-select" id="lp-mobile-select" aria-label="View on mobile">' +
      '<option value="table">Table</option>' +
      '<option value="plot-2d">2D profile</option><option value="plot-time">Time</option>' +
      '<option value="plot-slice-x">X slice</option><option value="plot-slice-y">Y slice</option>' +
      '</select>' +
      '<div class="mobile-results-section" data-section="table"><div id="lp-results"></div></div>' +
      '<div class="lp-plots-wrap">' +
      '<div class="mobile-results-section" data-section="plot-2d"><div class="lp-plot-panel">' +
      '<div id="lp-plot-2d" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="lp2d-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lp2d-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="lp2d-ymin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lp2d-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div>' +
      '<div class="mobile-results-section" data-section="plot-time"><div class="lp-plot-panel">' +
      '<div id="lp-plot-time" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="lptime-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lptime-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="lptime-ymin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lptime-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div>' +
      '<div class="mobile-results-section" data-section="plot-slice-x"><div class="lp-plot-panel">' +
      '<div id="lp-plot-slice-x" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="lpsliceX-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lpsliceX-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="lpsliceX-ymin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lpsliceX-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div>' +
      '<div class="mobile-results-section" data-section="plot-slice-y"><div class="lp-plot-panel">' +
      '<div id="lp-plot-slice-y" class="laser-plot-wrap"></div>' +
      '<div class="plot-controls">' +
      '<span class="plot-control"><label>X</label>' +
      '<input type="text" id="lpsliceY-xmin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lpsliceY-xmax" inputmode="decimal" placeholder="auto"></span>' +
      '<span class="plot-control"><label>Y</label>' +
      '<input type="text" id="lpsliceY-ymin" inputmode="decimal" placeholder="auto">' +
      '<input type="text" id="lpsliceY-ymax" inputmode="decimal" placeholder="auto"></span>' +
      '</div></div></div>' +
      '</div></div>';
    runLaserPulse();
    bindMobileResultsSwitcher('lp-mobile-select', 'lp-results-wrap');
    ['lp-spot-type', 'lp-spot-x', 'lp-spot-y', 'lp-wavelength', 'lp-duration', 'lp-energy', 'lp-rep-rate',
      'lp2d-xmin', 'lp2d-xmax', 'lp2d-ymin', 'lp2d-ymax',
      'lptime-xmin', 'lptime-xmax', 'lptime-ymin', 'lptime-ymax',
      'lpsliceX-xmin', 'lpsliceX-xmax', 'lpsliceX-ymin', 'lpsliceX-ymax',
      'lpsliceY-xmin', 'lpsliceY-xmax', 'lpsliceY-ymin', 'lpsliceY-ymax'
    ].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) { el.addEventListener('input', runLaserPulse); el.addEventListener('change', runLaserPulse); }
    });
    ['lp-wavelength-unit', 'lp-duration-unit', 'lp-energy-unit', 'lp-rep-rate-unit'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', runLaserPulse);
    });
  }

  function showTool(id) {
    currentToolId = id;
    var t = tools[id] || tools.about;
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
    } else if (t.dynamic && id === 'ideal-gas') {
      initIdealGas();
    } else {
      toolInputsEl.innerHTML = t.inputs || '';
      toolResultsEl.innerHTML = t.results || '';
    }
    document.querySelectorAll('.nav-link').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-tool') === id);
    });
    if (navEl.classList.contains('is-open')) {
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
    if (!toggleEl || !panelEl || !optionsEl) return;
    var stored = null;
    try { stored = localStorage.getItem('scirepo-accent'); } catch (e) { /* ignore */ }
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

  showTool('about');
  initNav();
  initMenuToggle();
  initSettings();
})();
