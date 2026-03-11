/* Particle: properties from mass (u) and kinetic energy (eV), trajectory in B or E field */

window.SCIREPO_PARTICLE = (function () {
  'use strict';

  var C = 2.99792458e8;      // m/s
  var H = 6.62607015e-34;   // J·s
  var E_CHARGE = 1.602176634e-19; // C
  var U_KG = 1.66053906660e-27;  // kg (unified atomic mass unit)

  var COMMON_PARTICLES = [
    { id: 'electron', label: 'Electron', mass_u: 0.000548579909, charge_e: -1 },
    { id: 'proton', label: 'Proton', mass_u: 1.007276466621, charge_e: 1 },
    { id: 'neutron', label: 'Neutron', mass_u: 1.00866491595, charge_e: 0 },
    { id: 'deuteron', label: 'Deuteron', mass_u: 2.013553212745, charge_e: 1 },
    { id: 'alpha', label: 'Alpha (⁴He²⁺)', mass_u: 4.001506179127, charge_e: 2 },
    { id: 'custom', label: 'Custom', mass_u: NaN, charge_e: NaN }
  ];

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  function compute(params) {
    var mass_u = params.mass_u;
    var charge_e = params.charge_e;
    var Ek_eV = params.kineticEnergy_eV;

    var out = {
      mass_u: NaN,
      mass_kg: NaN,
      charge_e: NaN,
      charge_C: NaN,
      kineticEnergy_eV: NaN,
      kineticEnergy_J: NaN,
      totalEnergy_J: NaN,
      totalEnergy_eV: NaN,
      restEnergy_J: NaN,
      restEnergy_eV: NaN,
      relativisticMass_kg: NaN,
      velocityClassical_ms: NaN,
      velocityRelativistic_ms: NaN,
      momentumClassical_kgms: NaN,
      momentumRelativistic_kgms: NaN,
      deBroglieWavelength_m: NaN,
      lorentzFactor: NaN,
      error: null
    };

    if (mass_u == null || isNaN(mass_u) || mass_u <= 0) {
      out.error = 'Mass must be positive.';
      return out;
    }
    if (Ek_eV == null || isNaN(Ek_eV) || Ek_eV < 0) {
      out.error = 'Kinetic energy must be non-negative.';
      return out;
    }

    var m_kg = mass_u * U_KG;
    var E0_J = m_kg * C * C;
    var E0_eV = E0_J / E_CHARGE;
    var Ek_J = Ek_eV * E_CHARGE;
    var E_total_J = E0_J + Ek_J;
    var gamma = E_total_J / E0_J;
    var v_rel = C * Math.sqrt(1 - 1 / (gamma * gamma));
    var p_rel = Math.sqrt(E_total_J * E_total_J / (C * C) - m_kg * m_kg * C * C);
    var v_class = (Ek_J > 0 && m_kg > 0) ? Math.sqrt(2 * Ek_J / m_kg) : 0;
    var p_class = m_kg * v_class;
    var lambda_dB = (p_rel > 0) ? H / p_rel : Infinity;

    out.mass_u = mass_u;
    out.mass_kg = m_kg;
    out.charge_e = charge_e;
    out.charge_C = (charge_e != null && !isNaN(charge_e)) ? charge_e * E_CHARGE : NaN;
    out.kineticEnergy_eV = Ek_eV;
    out.kineticEnergy_J = Ek_J;
    out.restEnergy_J = E0_J;
    out.restEnergy_eV = E0_eV;
    out.totalEnergy_J = E_total_J;
    out.totalEnergy_eV = E_total_J / E_CHARGE;
    out.relativisticMass_kg = gamma * m_kg;
    out.velocityClassical_ms = v_class;
    out.velocityRelativistic_ms = v_rel;
    out.momentumClassical_kgms = p_class;
    out.momentumRelativistic_kgms = p_rel;
    out.deBroglieWavelength_m = lambda_dB;
    out.lorentzFactor = gamma;

    return out;
  }

  /** Trajectory in constant B or E field. Returns array of {x, y} in m. */
  function trajectory(params) {
    var r = compute(params);
    if (r.error) return null;
    var B_T = params.B_T;
    var E_Vm = params.E_Vm;
    var fieldType = params.fieldType; // 'B' or 'E'
    var nSteps = params.nSteps != null ? params.nSteps : 400;
    var tMax;

    var m = r.mass_kg;
    var q = r.charge_C;
    var v0 = r.velocityRelativistic_ms;
    if (v0 <= 0 || !isFinite(v0)) return null;

    var points = [];
    var dt = tMax / nSteps;

    if (fieldType === 'B' && B_T != null && isFinite(B_T) && B_T !== 0 && q !== 0) {
      var B = B_T;
      var omega = (q * B) / m;
      tMax = (2 * Math.PI / Math.abs(omega)) * 1.5;
      dt = tMax / nSteps;
      var r_gyro = (m * v0) / (Math.abs(q) * B);
      for (var i = 0; i <= nSteps; i++) {
        var t = i * dt;
        var x = r_gyro * (Math.cos(omega * t) - 1);
        var y = r_gyro * Math.sin(omega * t);
        points.push({ x: x, y: y });
      }
    } else if (fieldType === 'E' && E_Vm != null && isFinite(E_Vm) && E_Vm !== 0 && q !== 0) {
      var E = E_Vm;
      var a = (q * E) / m;
      tMax = params.tMax_s != null ? params.tMax_s : 1e-8;
      dt = tMax / nSteps;
      for (var i = 0; i <= nSteps; i++) {
        var t = i * dt;
        var x = v0 * t;
        var y = 0.5 * a * t * t;
        points.push({ x: x, y: y });
      }
    } else {
      return null;
    }
    return points;
  }

  return {
    compute: compute,
    trajectory: trajectory,
    parseNum: parseNum,
    COMMON_PARTICLES: COMMON_PARTICLES,
    C: C,
    H: H,
    E_CHARGE: E_CHARGE,
    U_KG: U_KG
  };
})();
