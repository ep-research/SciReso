/* Photoionization / photoelectric effect: KE, recoil, PCI shift, angular distribution */

window.SCIREPO_PHOTOIONIZATION = (function () {
  'use strict';

  var M_E_KG = 9.1093837015e-31;
  var U_KG = 1.66053906660e-27;

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /**
   * Compute photoionization quantities.
   * params: { E_photon_eV, E_binding_eV, mass_u?, Gamma_eV?, E_Auger_eV? }
   * returns: { KE_eV, recoil_eV, PCI_shift_eV, error }
   */
  function compute(params) {
    var E_photon = params.E_photon_eV;
    var E_binding = params.E_binding_eV;
    var mass_u = params.mass_u;
    var Gamma = params.Gamma_eV;
    var E_Auger = params.E_Auger_eV;

    var out = {
      KE_eV: NaN,
      recoil_eV: NaN,
      KE_after_recoil_eV: NaN,
      PCI_shift_eV: NaN,
      KE_after_PCI_eV: NaN,
      KE_after_PCI_and_recoil_eV: NaN,
      error: null
    };

    if (E_photon == null || isNaN(E_photon) || E_binding == null || isNaN(E_binding)) {
      out.error = 'Photon energy and binding energy are required (eV).';
      return out;
    }

    var KE = E_photon - E_binding;
    if (KE < 0) {
      out.error = 'Photon energy must be greater than binding energy.';
      return out;
    }

    out.KE_eV = KE;

    if (mass_u != null && !isNaN(mass_u) && mass_u > 0) {
      var M_kg = mass_u * U_KG;
      out.recoil_eV = (M_E_KG / M_kg) * KE;
      out.KE_after_recoil_eV = KE - out.recoil_eV;
    }

    if (Gamma != null && !isNaN(Gamma) && Gamma > 0 && E_Auger != null && !isNaN(E_Auger) && E_Auger > 0) {
      out.PCI_shift_eV = -(Gamma / Math.PI) * Math.log(1 + E_Auger / Gamma);
      out.KE_after_PCI_eV = KE + out.PCI_shift_eV;
      out.KE_after_PCI_and_recoil_eV = (out.KE_after_recoil_eV != null && isFinite(out.KE_after_recoil_eV))
        ? out.KE_after_recoil_eV + out.PCI_shift_eV
        : out.KE_after_PCI_eV - (out.recoil_eV || 0);
    } else {
      out.KE_after_PCI_and_recoil_eV = out.KE_after_recoil_eV;
    }

    return out;
  }

  /**
   * Photoelectron lineshape: Lorentzian (lifetime Γ FWHM) convolved with Gaussian (resolution FWHM).
   * Optional PCI asymmetry: shift center to KE_after_PCI; asymmetry can skew the line - here we use symmetric Lorentzian.
   * Returns array of { E_eV, intensity }.
   */
  function photoelectronLineshape(KE_center_eV, Gamma_FWHM_eV, resolution_FWHM_eV, nPoints) {
    nPoints = nPoints || 300;
    var gamma = (Gamma_FWHM_eV != null && !isNaN(Gamma_FWHM_eV) && Gamma_FWHM_eV > 0) ? Gamma_FWHM_eV : 0;
    var resFWHM = (resolution_FWHM_eV != null && !isNaN(resolution_FWHM_eV) && resolution_FWHM_eV >= 0) ? resolution_FWHM_eV : 0;
    var sigma = resFWHM > 0 ? resFWHM / (2 * Math.sqrt(2 * Math.LN2)) : 0;
    var extent = 5 * Math.max(gamma, sigma, 1);
    var Emin = KE_center_eV - extent;
    var Emax = KE_center_eV + extent;
    var dE = (Emax - Emin) / (nPoints - 1);
    var out = [];
    for (var i = 0; i < nPoints; i++) {
      var E = Emin + i * dE;
      var val;
      if (gamma > 0 && sigma > 0) {
        var nConv = Math.min(150, Math.ceil(12 * Math.max(gamma, sigma) / dE));
        var sum = 0;
        for (var j = -nConv; j <= nConv; j++) {
          var u = j * dE;
          var Eprime = E - u;
          var L = (gamma / (2 * Math.PI)) / (Math.pow(Eprime - KE_center_eV, 2) + Math.pow(gamma / 2, 2));
          var G = Math.exp(-u * u / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
          sum += L * G * dE;
        }
        val = sum;
      } else if (gamma > 0) {
        val = (gamma / (2 * Math.PI)) / (Math.pow(E - KE_center_eV, 2) + Math.pow(gamma / 2, 2));
      } else if (sigma > 0) {
        val = Math.exp(-Math.pow(E - KE_center_eV, 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
      } else {
        val = (Math.abs(E - KE_center_eV) < dE) ? 1 / dE : 0;
      }
      out.push({ E_eV: E, intensity: val });
    }
    var maxI = Math.max.apply(null, out.map(function (p) { return p.intensity; }));
    if (maxI > 0) out.forEach(function (p) { p.intensity /= maxI; });
    return out;
  }

  /**
   * Angular distribution: I(θ) ∝ 1 + β * P2(cos θ), P2(x) = (3x² - 1) / 2.
   * Returns array of { theta_deg, intensity } for 0..180 deg.
   */
  function angularDistribution(beta, nPoints) {
    nPoints = nPoints || 100;
    var out = [];
    for (var i = 0; i <= nPoints; i++) {
      var thetaDeg = (180 * i) / nPoints;
      var thetaRad = (thetaDeg * Math.PI) / 180;
      var cosTheta = Math.cos(thetaRad);
      var P2 = (3 * cosTheta * cosTheta - 1) / 2;
      var I = 1 + beta * P2;
      out.push({ theta_deg: thetaDeg, intensity: Math.max(0, I) });
    }
    return out;
  }

  return {
    compute: compute,
    angularDistribution: angularDistribution,
    photoelectronLineshape: photoelectronLineshape,
    parseNum: parseNum
  };
})();
