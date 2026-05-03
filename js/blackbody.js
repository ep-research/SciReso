/* Blackbody radiation: Wien, Stefan-Boltzmann, Planck spectrum */

window.SCIRESO_BLACKBODY = (function () {
  'use strict';

  var H = 6.62607015e-34;   // J·s
  var C = 2.99792458e8;    // m/s
  var K_B = 1.380649e-23;  // J/K
  var WIEN_B = 2.897771955e-3;  // m·K (Wien displacement constant)
  var STEFAN_BOLTZMANN = 5.670374419e-8;  // W/(m²·K⁴)

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /**
   * Compute blackbody quantities for temperature T (K).
   * Returns { T_K, peakWavelength_m, peakWavelength_nm, totalRadiance_Wm2, error }.
   */
  function compute(params) {
    var T = params.T_K;
    var out = {
      T_K: NaN,
      peakWavelength_m: NaN,
      peakWavelength_nm: NaN,
      totalRadiance_Wm2: NaN,
      error: null
    };
    if (T == null || isNaN(T) || T <= 0) {
      out.error = 'Temperature must be positive (K).';
      return out;
    }
    out.T_K = T;
    out.peakWavelength_m = WIEN_B / T;
    out.peakWavelength_nm = out.peakWavelength_m * 1e9;
    out.totalRadiance_Wm2 = STEFAN_BOLTZMANN * T * T * T * T;
    return out;
  }

  /**
   * Planck spectral radiance B(λ,T) in W/(m²·sr·m) per unit wavelength.
   * lambda_m in metres, T in kelvin.
   */
  function spectralRadianceWavelength(lambda_m, T_K) {
    if (lambda_m <= 0 || T_K <= 0) return 0;
    var x = H * C / (lambda_m * K_B * T_K);
    if (x > 700) return 0;
    var expx = Math.exp(x);
    return (2 * H * C * C) / (Math.pow(lambda_m, 5) * (expx - 1));
  }

  /**
   * Return points for spectrum plot: array of { lambda_nm, B_rel } (B_rel normalized to max 1).
   */
  function spectrumPoints(T_K, lambdaMin_nm, lambdaMax_nm, nPoints) {
    if (T_K <= 0) return [];
    nPoints = nPoints || 200;
    var lambdaMin_m = (lambdaMin_nm || 100) * 1e-9;
    var lambdaMax_m = (lambdaMax_nm || 5000) * 1e-9;
    var points = [];
    var Bmax = 0;
    for (var i = 0; i <= nPoints; i++) {
      var lambda_m = lambdaMin_m + (lambdaMax_m - lambdaMin_m) * (i / nPoints);
      var B = spectralRadianceWavelength(lambda_m, T_K);
      var lambda_nm = lambda_m * 1e9;
      points.push({ lambda_nm: lambda_nm, B: B });
      if (B > Bmax) Bmax = B;
    }
    if (Bmax <= 0) Bmax = 1;
    points.forEach(function (p) { p.B_rel = p.B / Bmax; });
    return points;
  }

  return {
    compute: compute,
    spectralRadianceWavelength: spectralRadianceWavelength,
    spectrumPoints: spectrumPoints,
    parseNum: parseNum,
    WIEN_B: WIEN_B,
    STEFAN_BOLTZMANN: STEFAN_BOLTZMANN
  };
})();
