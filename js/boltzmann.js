/* Boltzmann distribution: relative populations of quantum states at temperature T */

window.SCIRESO_BOLTZMANN = (function () {
  'use strict';

  var K_B_CM = 0.695034800; // k_B in cm⁻¹/K (for E in cm⁻¹)

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /**
   * Compute level energies and degeneracies for a mode.
   * Returns { levels: [{ label, E_cm, g }], error }.
   */
  function getLevels(params) {
    var mode = params.mode; // 'rotational' | 'vibrational' | 'generic'
    var levels = [];
    var err = null;

    if (mode === 'rotational') {
      var B = params.B_cm;
      var maxJ = params.maxJ != null ? Math.max(0, Math.floor(params.maxJ)) : 20;
      var SYM = window.SCIRESO_SYMBOLS;
      var symB = SYM ? SYM.symbol('B_rot') : 'B_rot';
      if (B == null || isNaN(B) || B <= 0) {
        return { levels: [], error: 'Rotational constant ' + symB + ' must be positive (cm⁻¹).' };
      }
      for (var J = 0; J <= maxJ; J++) {
        levels.push({
          label: 'J = ' + J,
          E_cm: B * J * (J + 1),
          g: 2 * J + 1
        });
      }
    } else if (mode === 'vibrational') {
      var omega = params.omega_cm;
      var maxV = params.maxV != null ? Math.max(0, Math.floor(params.maxV)) : 20;
      var SYM = window.SCIRESO_SYMBOLS;
      var symO = SYM ? SYM.symbol('omega_e') : 'omega_e';
      if (omega == null || isNaN(omega) || omega <= 0) {
        return { levels: [], error: 'Vibrational constant ' + symO + ' must be positive (cm⁻¹).' };
      }
      for (var v = 0; v <= maxV; v++) {
        levels.push({
          label: 'v = ' + v,
          E_cm: omega * (v + 0.5),
          g: 1
        });
      }
    } else if (mode === 'generic') {
      var text = (params.levelsText || '').trim();
      if (!text) {
        return { levels: [], error: 'Enter at least one level (E in cm⁻¹ and g, one per line).' };
      }
      var lines = text.split(/\r?\n/);
      for (var i = 0; i < lines.length; i++) {
        var parts = lines[i].trim().split(/[\s,;]+/).filter(Boolean);
        if (parts.length < 2) continue;
        var E_cm = parseNum(parts[0]);
        var g = parseNum(parts[1]);
        if (isNaN(E_cm) || isNaN(g) || g < 0) continue;
        var lbl = parts.length >= 3 ? parts.slice(2).join(' ') : 'Level ' + (levels.length + 1);
        levels.push({ label: lbl, E_cm: E_cm, g: g });
      }
      if (levels.length === 0) {
        return { levels: [], error: 'Could not parse any levels. Use: E (cm⁻¹) g [label], one per line.' };
      }
      levels.sort(function (a, b) { return a.E_cm - b.E_cm; });
    } else {
      return { levels: [], error: 'Select a mode: Rotational, Vibrational, or Generic.' };
    }

    return { levels: levels, error: null };
  }

  /**
   * Compute Boltzmann populations.
   * params: { mode, temperature_K, B_cm?, maxJ?, omega_cm?, maxV?, levelsText? }
   * returns: { levels: [{ label, E_cm, g, relPop, fraction }], partitionFunction, temperature_K, error }
   */
  function compute(params) {
    var T = params.temperature_K;
    if (T == null || isNaN(T) || T <= 0) {
      return { levels: [], partitionFunction: NaN, temperature_K: NaN, error: 'Temperature must be positive (K).' };
    }

    var out = getLevels(params);
    if (out.error) return { levels: [], partitionFunction: NaN, temperature_K: T, error: out.error };

    var levels = out.levels;
    var E0 = levels[0].E_cm;
    var kT = K_B_CM * T;
    var Q = 0;
    var i;

    for (i = 0; i < levels.length; i++) {
      levels[i].relPop = (levels[i].g / levels[0].g) * Math.exp(-(levels[i].E_cm - E0) / kT);
      Q += levels[i].g * Math.exp(-levels[i].E_cm / kT);
    }
    for (i = 0; i < levels.length; i++) {
      levels[i].fraction = (levels[i].g / Q) * Math.exp(-levels[i].E_cm / kT);
    }

    return {
      levels: levels,
      partitionFunction: Q,
      temperature_K: T,
      error: null
    };
  }

  return {
    compute: compute,
    parseNum: parseNum,
    K_B_CM: K_B_CM
  };
})();
