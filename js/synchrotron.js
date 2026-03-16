/* Synchrotron radiation: bending magnet, wiggler, undulator (basic scalings) */

window.SCIREPO_SYNCHROTRON = (function () {
  'use strict';

  var C = 2.99792458e8;        // m/s
  var E_CHARGE = 1.602176634e-19; // C
  var M_E = 9.1093837015e-31;  // kg
  var H = 6.62607015e-34;      // J·s

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  function gevToGamma(E_GeV) {
    if (!E_GeV || E_GeV <= 0 || isNaN(E_GeV)) return NaN;
    var E_J = E_GeV * 1e9 * E_CHARGE;
    return E_J / (M_E * C * C);
  }

  function criticalEnergy_Bend(E_GeV, rho_m) {
    var gamma = gevToGamma(E_GeV);
    if (!gamma || !rho_m || rho_m <= 0) return NaN;
    var omega_c = (3 / 2) * C * Math.pow(gamma, 3) / rho_m;
    var E_J = H * omega_c / (2 * Math.PI);
    return E_J / E_CHARGE;
  }

  function rhoFromB(E_GeV, B_T) {
    if (!E_GeV || !B_T || B_T <= 0) return NaN;
    return E_GeV / (0.299792458 * B_T);
  }

  function undulatorResonance(E_GeV, lambda_u_m, K, harmonic) {
    var n = harmonic || 1;
    var gamma = gevToGamma(E_GeV);
    if (!gamma || !lambda_u_m || lambda_u_m <= 0 || n <= 0) return { E_eV: NaN, lambda_m: NaN };
    var lambda_n = (lambda_u_m / (2 * gamma * gamma)) * (1 + (K * K) / 2) / n;
    var E_eV = (H * C) / (lambda_n * E_CHARGE);
    return { E_eV: E_eV, lambda_m: lambda_n };
  }

  function compute(params) {
    var mode = (params.mode || 'bend').toLowerCase();
    var E_GeV = parseNum(params.E_GeV);
    var I_A = parseNum(params.current_A);
    var B_T = parseNum(params.B_T);
    var rho_m = parseNum(params.rho_m);
    var lambda_u_m = parseNum(params.lambda_u_m);
    var N_periods = parseNum(params.N_periods);
    var K = parseNum(params.K);
    var harmonic = parseNum(params.harmonic);
    if (!isFinite(harmonic) || harmonic <= 0) harmonic = 1;

    var out = {
      mode: mode,
      E_GeV: E_GeV,
      current_A: I_A,
      B_T: B_T,
      rho_m: rho_m,
      lambda_u_m: lambda_u_m,
      N_periods: N_periods,
      K: K,
      harmonic: harmonic,
      gamma: NaN,
      criticalEnergy_eV: NaN,
      totalPower_kW: NaN,
      undulator_Eharm_eV: NaN,
      undulator_lambda_nm: NaN,
      error: null
    };

    if (!E_GeV || E_GeV <= 0 || isNaN(E_GeV)) {
      out.error = 'Beam energy must be positive (GeV).';
      return out;
    }
    out.gamma = gevToGamma(E_GeV);

    var rhoUsed = rho_m;
    if ((!rhoUsed || rhoUsed <= 0) && B_T && B_T > 0) {
      rhoUsed = rhoFromB(E_GeV, B_T);
    }
    out.rho_m = rhoUsed;
    out.B_T = B_T;
    out.criticalEnergy_eV = criticalEnergy_Bend(E_GeV, rhoUsed);

    if (I_A != null && isFinite(I_A) && rhoUsed && rhoUsed > 0) {
      var U0_MeV = 0.0885 * Math.pow(E_GeV, 4) / rhoUsed;
      var U0_J = U0_MeV * 1e6 * E_CHARGE;
      out.totalPower_kW = (U0_J * I_A) / 1000;
    }

    if (mode === 'undulator' && lambda_u_m && lambda_u_m > 0 && K && K >= 0) {
      var u = undulatorResonance(E_GeV, lambda_u_m, K, harmonic);
      out.undulator_Eharm_eV = u.E_eV;
      out.undulator_lambda_nm = u.lambda_m * 1e9;
    }

    return out;
  }

  return {
    compute: compute,
    parseNum: parseNum,
    gevToGamma: gevToGamma,
    criticalEnergy_Bend: criticalEnergy_Bend,
    rhoFromB: rhoFromB,
    undulatorResonance: undulatorResonance
  };
})();

