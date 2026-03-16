/* Bragg diffraction: n λ = 2 d sin θ */

window.SCIREPO_BRAGG = (function () {
  'use strict';

  var H = 6.62607015e-34;   // J·s
  var C = 2.99792458e8;     // m/s
  var E_CHARGE = 1.602176634e-19; // C

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  function lambdaFromEnergy(E_keV) {
    if (!E_keV || E_keV <= 0 || isNaN(E_keV)) return NaN;
    var E_J = E_keV * 1e3 * E_CHARGE;
    return (H * C) / E_J;
  }

  function energyFromLambda(lambda_A) {
    if (!lambda_A || lambda_A <= 0 || isNaN(lambda_A)) return NaN;
    var lambda_m = lambda_A * 1e-10;
    var E_J = (H * C) / lambda_m;
    return E_J / (E_CHARGE * 1e3);
  }

  function compute(params) {
    var mode = (params.mode || 'lambda-from-theta').toLowerCase();
    var n = parseNum(params.n) || 1;
    if (n <= 0) n = 1;
    var d_A = parseNum(params.d_A);
    var theta_deg = parseNum(params.theta_deg);
    var lambda_A = parseNum(params.lambda_A);
    var E_keV = parseNum(params.E_keV);

    var out = {
      mode: mode,
      n: n,
      d_A: d_A,
      theta_deg: theta_deg,
      lambda_A: NaN,
      E_keV: NaN,
      error: null
    };

    if (!d_A || d_A <= 0 || isNaN(d_A)) {
      out.error = 'd-spacing must be positive (Å).';
      return out;
    }

    var d_m = d_A * 1e-10;

    if (mode === 'lambda-from-theta') {
      if (!theta_deg || isNaN(theta_deg)) {
        out.error = 'Scattering angle θ (deg) is required.';
        return out;
      }
      var theta = theta_deg * Math.PI / 180;
      var lambda_m = (2 * d_m * Math.sin(theta)) / n;
      if (lambda_m <= 0) {
        out.error = 'No real solution for given θ and n.';
        return out;
      }
      out.theta_deg = theta_deg;
      out.lambda_A = lambda_m * 1e10;
      out.E_keV = energyFromLambda(out.lambda_A);
    } else if (mode === 'theta-from-lambda') {
      if (!lambda_A || isNaN(lambda_A) || lambda_A <= 0) {
        out.error = 'Wavelength (Å) is required.';
        return out;
      }
      var lambda_m2 = lambda_A * 1e-10;
      var arg = (n * lambda_m2) / (2 * d_m);
      if (arg > 1) {
        out.error = 'No Bragg angle: nλ > 2d.';
        return out;
      }
      var theta2 = Math.asin(arg);
      out.lambda_A = lambda_A;
      out.E_keV = energyFromLambda(lambda_A);
      out.theta_deg = theta2 * 180 / Math.PI;
    } else if (mode === 'theta-from-energy') {
      if (!E_keV || isNaN(E_keV) || E_keV <= 0) {
        out.error = 'Photon energy (keV) is required.';
        return out;
      }
      var lambda_from_E = lambdaFromEnergy(E_keV) * 1e10;
      var lambda_m3 = lambda_from_E * 1e-10;
      var arg2 = (n * lambda_m3) / (2 * d_m);
      if (arg2 > 1) {
        out.error = 'No Bragg angle: nλ > 2d.';
        return out;
      }
      var theta3 = Math.asin(arg2);
      out.lambda_A = lambda_from_E;
      out.E_keV = E_keV;
      out.theta_deg = theta3 * 180 / Math.PI;
    } else {
      out.error = 'Unknown mode.';
    }

    return out;
  }

  return {
    compute: compute,
    parseNum: parseNum,
    lambdaFromEnergy: lambdaFromEnergy,
    energyFromLambda: energyFromLambda
  };
})();

