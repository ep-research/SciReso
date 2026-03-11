/* Compton scattering: scattered energy, wavelength shift, recoil KE, angle vs energy */

window.SCIREPO_COMPTON = (function () {
  'use strict';

  var M_E_C2_EV = 510998.95;
  var H = 4.135667662e-15;
  var C = 2.99792458e8;
  var LAMBDA_C_PM = 2.42631023867;

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /**
   * Compton scattering: E' = E / (1 + (E / m_e c²)(1 - cos θ))
   * params: { E_incident_eV, theta_deg }
   * returns: { E_incident_eV, theta_deg, E_scattered_eV, deltaLambda_pm, recoil_KE_eV, lambda_incident_pm, lambda_scattered_pm, error }
   */
  function compute(params) {
    var E = params.E_incident_eV;
    var thetaDeg = params.theta_deg;

    var out = {
      E_incident_eV: NaN,
      theta_deg: NaN,
      E_scattered_eV: NaN,
      deltaLambda_pm: NaN,
      recoil_KE_eV: NaN,
      lambda_incident_pm: NaN,
      lambda_scattered_pm: NaN,
      error: null
    };

    if (E == null || isNaN(E)) {
      out.error = 'Incident photon energy (eV) is required.';
      return out;
    }
    if (E <= 0) {
      out.error = 'Incident energy must be positive.';
      return out;
    }

    var theta = (thetaDeg != null && !isNaN(thetaDeg)) ? thetaDeg * Math.PI / 180 : 0;
    var oneMinusCos = 1 - Math.cos(theta);
    var alpha = E / M_E_C2_EV;
    var Eprime = E / (1 + alpha * oneMinusCos);
    var recoil = E - Eprime;

    out.E_incident_eV = E;
    out.theta_deg = (thetaDeg != null && !isNaN(thetaDeg)) ? thetaDeg : 0;
    out.E_scattered_eV = Eprime;
    out.deltaLambda_pm = LAMBDA_C_PM * oneMinusCos;
    out.recoil_KE_eV = recoil;
    out.lambda_incident_pm = 1e12 * (H * C) / E;
    out.lambda_scattered_pm = 1e12 * (H * C) / Eprime;

    return out;
  }

  /**
   * Points for plot: scattering angle (deg) vs scattered photon energy (eV).
   */
  function angleVsEnergy(E_incident_eV, thetaMinDeg, thetaMaxDeg, nPoints) {
    nPoints = nPoints || 150;
    if (!E_incident_eV || E_incident_eV <= 0 || isNaN(E_incident_eV)) return [];
    var tMin = (thetaMinDeg != null && !isNaN(thetaMinDeg)) ? thetaMinDeg : 0;
    var tMax = (thetaMaxDeg != null && !isNaN(thetaMaxDeg)) ? thetaMaxDeg : 180;
    var points = [];
    for (var i = 0; i <= nPoints; i++) {
      var thetaDeg = tMin + (tMax - tMin) * i / nPoints;
      var theta = thetaDeg * Math.PI / 180;
      var oneMinusCos = 1 - Math.cos(theta);
      var alpha = E_incident_eV / M_E_C2_EV;
      var Eprime = E_incident_eV / (1 + alpha * oneMinusCos);
      points.push({ theta_deg: thetaDeg, E_scattered_eV: Eprime });
    }
    return points;
  }

  return {
    parseNum: parseNum,
    compute: compute,
    angleVsEnergy: angleVsEnergy
  };
})();
