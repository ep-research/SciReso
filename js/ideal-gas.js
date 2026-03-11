/* Ideal gas: PV = nRT, R = 8.314462618 J/(mol·K) = 8.314462618 Pa·m³/(mol·K) */

window.SCIREPO_IDEAL_GAS = (function () {
  'use strict';

  var R = 8.314462618; // Pa·m³/(mol·K)

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  var P_TO_PA = { Pa: 1, bar: 1e5, atm: 101325, mmHg: 101325 / 760 };
  var V_TO_M3 = { 'm3': 1, L: 0.001, mL: 1e-6 };
  function toPa(p, unit) {
    var u = (unit || 'Pa').replace('m³', 'm3').replace('m3', 'm3');
    return (p || 0) * (P_TO_PA[u] != null ? P_TO_PA[u] : 1);
  }
  function toM3(v, unit) {
    var u = (unit || 'L').replace('m³', 'm3');
    return (v || 0) * (V_TO_M3[u] != null ? V_TO_M3[u] : 0.001);
  }
  function toKelvin(T, unit) {
    if ((unit || 'K').toLowerCase() === 'c') return (T || 0) + 273.15;
    return T || 0;
  }

  /**
   * Solve for one of P, V, n, T given the other three (all in SI: Pa, m³, mol, K).
   * params: { solveFor: 'P'|'V'|'n'|'T', P_Pa, V_m3, n_mol, T_K }
   * returns: { P_Pa, V_m3, n_mol, T_K, error }
   */
  function compute(params) {
    var solveFor = (params.solveFor || 'P').trim().toUpperCase();
    if (solveFor !== 'P' && solveFor !== 'V' && solveFor !== 'N' && solveFor !== 'T') {
      return { error: 'Solve for must be P, V, n, or T.' };
    }
    var P_Pa = params.P_Pa != null ? parseNum(params.P_Pa) : NaN;
    var V_m3 = params.V_m3 != null ? parseNum(params.V_m3) : NaN;
    var n_mol = params.n_mol != null ? parseNum(params.n_mol) : NaN;
    var T_K = params.T_K != null ? parseNum(params.T_K) : NaN;

    if (solveFor !== 'P' && (P_Pa == null || isNaN(P_Pa) || P_Pa <= 0)) {
      return { error: 'Pressure must be a positive number.' };
    }
    if (solveFor !== 'V' && (V_m3 == null || isNaN(V_m3) || V_m3 <= 0)) {
      return { error: 'Volume must be a positive number.' };
    }
    if (solveFor !== 'N' && (n_mol == null || isNaN(n_mol) || n_mol < 0)) {
      return { error: 'Amount n must be a non-negative number.' };
    }
    if (solveFor !== 'T' && (T_K == null || isNaN(T_K) || T_K <= 0)) {
      return { error: 'Temperature must be a positive number.' };
    }

    var out = { P_Pa: null, V_m3: null, n_mol: null, T_K: null, error: null };
    if (solveFor === 'P') {
      out.P_Pa = (n_mol * R * T_K) / V_m3;
      out.V_m3 = V_m3;
      out.n_mol = n_mol;
      out.T_K = T_K;
    } else if (solveFor === 'V') {
      out.V_m3 = (n_mol * R * T_K) / P_Pa;
      out.P_Pa = P_Pa;
      out.n_mol = n_mol;
      out.T_K = T_K;
    } else if (solveFor === 'N') {
      out.n_mol = (P_Pa * V_m3) / (R * T_K);
      out.P_Pa = P_Pa;
      out.V_m3 = V_m3;
      out.T_K = T_K;
    } else {
      out.T_K = (P_Pa * V_m3) / (R * n_mol);
      out.P_Pa = P_Pa;
      out.V_m3 = V_m3;
      out.n_mol = n_mol;
    }
    return out;
  }

  return {
    R: R,
    parseNum: parseNum,
    toPa: toPa,
    toM3: toM3,
    toKelvin: toKelvin,
    compute: compute
  };
})();
