/* Absorption / Beer-Lambert: coefficients, I/I0, cross section */

window.SCIRESULTS_ABSORPTION = (function () {
  'use strict';
  var N_A = 6.02214076e23;

  function parseNum(val) {
    var n = parseFloat(val);
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /* Thickness to cm */
  function thicknessToCm(val, unit) {
    if (unit === 'cm') return val;
    if (unit === 'mm') return val * 0.1;
    if (unit === 'um' || unit === 'μm') return val * 1e-4;
    if (unit === 'nm') return val * 1e-7;
    return val;
  }

  /* Linear alpha to 1/cm */
  function linearToPerCm(val, unit) {
    if (unit === 'per_cm') return val;
    if (unit === 'per_mm') return val * 10;
    if (unit === 'per_m') return val * 0.01;
    return val;
  }

  function compute(params) {
    var coefType = params.coefType;
    var coefValue = params.coefValue;
    var coefUnit = params.coefUnit;
    var L_cm = thicknessToCm(params.thickness, params.thicknessUnit);
    var rho = params.density;
    var M = params.molarMass;
    var c = params.concentration;

    var out = {
      I_I0: NaN, A_nap: NaN, A_dec: NaN,
      alpha_per_cm: NaN, a_mass: NaN, epsilon: NaN, sigma_cm2: NaN,
      rho: NaN, M: NaN, c: NaN,
      error: null
    };

    if (L_cm <= 0) { out.error = 'Thickness must be positive.'; return out; }

    var alpha;
    if (coefType === 'linear') {
      alpha = linearToPerCm(coefValue, coefUnit || 'per_cm');
      if (isNaN(alpha) || alpha < 0) { out.error = 'Enter a non-negative linear coefficient.'; return out; }
      out.rho = rho;
      out.M = M;
      out.c = c;
    } else if (coefType === 'mfp') {
      var lambdaCm = thicknessToCm(coefValue, coefUnit || 'nm');
      if (isNaN(lambdaCm) || lambdaCm <= 0) { out.error = 'Enter a positive mean free path.'; return out; }
      alpha = 1 / lambdaCm;
      out.rho = rho;
      out.M = M;
      out.c = c;
    } else {
      var nGiven = [rho, M, c].filter(function (x) { return x > 0 && !isNaN(x); }).length;
      if (nGiven < 2) { out.error = 'Provide at least two of: density, molar mass, concentration.'; return out; }
      if (rho > 0 && M > 0 && (isNaN(c) || c <= 0)) c = rho / M;
      if (rho > 0 && c > 0 && (isNaN(M) || M <= 0)) M = rho / c;
      if (c > 0 && M > 0 && (isNaN(rho) || rho <= 0)) rho = c * M;
      out.rho = rho;
      out.M = M;
      out.c = c;
    }

    if (coefType === 'mass') {
      if (!rho || rho <= 0) { out.error = 'Density required for mass absorption coefficient.'; return out; }
      var a = coefValue;
      if ((coefUnit || '').indexOf('cm2/g') !== -1) a = a;
      else if ((coefUnit || '').indexOf('m2/kg') !== -1) a = a * 0.1;
      alpha = a * rho;
    } else if (coefType === 'molar') {
      if (!c || c <= 0) { out.error = 'Concentration required for molar absorption coefficient.'; return out; }
      var eps = coefValue;
      if ((coefUnit || '').indexOf('L/(mol') !== -1 || (coefUnit || '').indexOf('M-1') !== -1) eps = eps;
      alpha = eps * c;
    }
    /* for linear, alpha already set above */

    var SYM = window.SCIRESO_SYMBOLS;
    var symA = SYM ? SYM.symbol('alpha') : 'alpha';
    if (isNaN(alpha) || alpha < 0) { out.error = 'Invalid coefficient or derived ' + symA + '.'; return out; }

    out.alpha_per_cm = alpha;
    out.I_I0 = Math.exp(-alpha * L_cm);
    out.A_nap = alpha * L_cm;
    out.A_dec = alpha * L_cm / Math.LN10;

    if (rho > 0) out.a_mass = alpha / rho;
    if (c > 0) out.epsilon = alpha / c;
    if (out.epsilon > 0) out.sigma_cm2 = (out.epsilon * 1000) / N_A;

    return out;
  }

  function thicknessRange(L_cm, alpha, nPoints) {
    var points = [];
    var L_max = Math.min(5 / Math.max(alpha, 1e-10), L_cm * 3);
    for (var i = 0; i <= (nPoints || 50); i++) {
      var x = (i / (nPoints || 50)) * L_max;
      points.push({ L_cm: x, I_I0: Math.exp(-alpha * x), A_nap: alpha * x, A_dec: (alpha * x) / Math.LN10 });
    }
    return points;
  }

  function thicknessRangeFromTo(xMin_cm, xMax_cm, alpha, nPoints) {
    var points = [];
    var n = Math.max(1, nPoints || 50);
    for (var i = 0; i <= n; i++) {
      var x = xMin_cm + (i / n) * (xMax_cm - xMin_cm);
      points.push({ L_cm: x, I_I0: Math.exp(-alpha * x), A_nap: alpha * x, A_dec: (alpha * x) / Math.LN10 });
    }
    return points;
  }

  return { compute: compute, parseNum: parseNum, thicknessRange: thicknessRange, thicknessRangeFromTo: thicknessRangeFromTo };
})();
