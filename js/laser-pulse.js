/* Laser pulse: spot size, intensity, fluence, photons, power, beam profiles */

window.SCIRESULTS_LASER_PULSE = (function () {
  'use strict';

  var H = 6.62607015e-34;   // J⋅s
  var C = 2.99792458e8;     // m/s
  var EPS0 = 8.8541878128e-12; // F/m
  var HC_Jm = 1.986e-25;   // h*c in J⋅m
  var EV_TO_NM = 1239.84193; // ≈ h*c/(e) in nm⋅eV
  var E_CHARGE = 1.602176634e-19; // C (elementary charge)
  var GAUSSIAN_TBP = 0.441271200376932; // Δν·Δt (FWHM) = 2*ln(2)/π for transform-limited Gaussian

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /** Spot diameter (μm) and type 'FWHM'|'1e2' => 1/e² radius in m. FWHM_diameter = w*sqrt(2*ln2)*2 so w = FWHM_diam/sqrt(2*ln2). */
  function diameterToW_metres(diam_um, type) {
    if (!diam_um || diam_um <= 0 || isNaN(diam_um)) return NaN;
    var w_um = type === 'FWHM' ? diam_um / Math.sqrt(2 * Math.LN2) : diam_um / 2;
    return w_um * 1e-6;
  }

  /** Wavelength: nm or eV => wavelength in m */
  function wavelengthToMetres(val, unit) {
    if (val == null || isNaN(val) || val <= 0) return NaN;
    if (unit === 'eV') return (EV_TO_NM / val) * 1e-9;
    return val * 1e-9; // nm
  }

  /** Duration: value in given unit => FWHM in s */
  function durationToSeconds(val, unit) {
    if (val == null || isNaN(val) || val < 0) return NaN;
    var scale = 1;
    if (unit === 'fs') scale = 1e-15;
    else if (unit === 'ps') scale = 1e-12;
    else if (unit === 'ns') scale = 1e-9;
    else if (unit === 'us' || unit === 'μs') scale = 1e-6;
    else if (unit === 'ms') scale = 1e-3;
    return val * scale;
  }

  /** Energy: value in given unit => J */
  function energyToJoules(val, unit) {
    if (val == null || isNaN(val) || val < 0) return NaN;
    var scale = 1;
    if (unit === 'nJ') scale = 1e-9;
    else if (unit === 'uJ' || unit === 'μJ') scale = 1e-6;
    else if (unit === 'mJ') scale = 1e-3;
    return val * scale;
  }

  /** Rep rate: value in given unit => Hz */
  function repRateToHz(val, unit) {
    if (val == null || isNaN(val) || val < 0) return NaN;
    var scale = 1;
    if (unit === 'kHz') scale = 1e3;
    else if (unit === 'MHz') scale = 1e6;
    return val * scale;
  }

  function compute(params) {
    var spotType = (params.spotType || 'FWHM').toLowerCase();
    if (spotType !== 'fwhm' && spotType !== '1e2') spotType = 'fwhm';
    var wx_m = diameterToW_metres(params.spotX_um, spotType === 'fwhm' ? 'FWHM' : '1e2');
    var wy_m = diameterToW_metres(params.spotY_um, spotType === 'fwhm' ? 'FWHM' : '1e2');
    if (!wy_m || isNaN(wy_m) || wy_m <= 0) wy_m = wx_m;
    var lambda_m = wavelengthToMetres(params.wavelength, params.wavelengthUnit || 'nm');
    var tau_FWHM_s = durationToSeconds(params.duration, params.durationUnit || 'fs');
    var E_J = energyToJoules(params.energy, params.energyUnit || 'uJ');
    var rep_Hz = repRateToHz(params.repRate, params.repRateUnit || 'kHz');

    var out = {
      spotX_1e2_um: NaN,
      spotY_1e2_um: NaN,
      spotX_FWHM_um: NaN,
      spotY_FWHM_um: NaN,
      wavelength_nm: NaN,
      wavelength_eV: NaN,
      duration_FWHM_s: NaN,
      energy_J: NaN,
      repRate_Hz: NaN,
      peakIntensity_Wm2: NaN,
      peakIntensity_Wcm2: NaN,
      peakEfield_Vm: NaN,
      peakBfield_T: NaN,
      area_1e2_um2: NaN,
      area_FWHM_um2: NaN,
      bandwidthMin_Hz: NaN,
      bandwidthMin_nm: NaN,
      bandwidthMin_eV: NaN,
      fluence_Jm2: NaN,
      photonsPerPulse: NaN,
      photonsPerSec: NaN,
      power_W: NaN,
      error: null
    };

    out.spotX_1e2_um = wx_m * 1e6;
    out.spotY_1e2_um = wy_m * 1e6;
    out.spotX_FWHM_um = wx_m * Math.sqrt(2 * Math.LN2) * 1e6;
    out.spotY_FWHM_um = wy_m * Math.sqrt(2 * Math.LN2) * 1e6;
    out.wavelength_nm = lambda_m * 1e9;
    out.wavelength_eV = lambda_m > 0 ? EV_TO_NM / out.wavelength_nm : NaN;
    out.duration_FWHM_s = tau_FWHM_s;
    out.energy_J = E_J;
    out.repRate_Hz = rep_Hz;

    if (wx_m <= 0 || wy_m <= 0) {
      out.error = 'Spot dimensions must be positive.';
      return out;
    }
    if (tau_FWHM_s <= 0 || isNaN(tau_FWHM_s)) {
      out.error = 'Pulse duration must be positive.';
      return out;
    }
    if (E_J < 0 || isNaN(E_J)) {
      out.error = 'Pulse energy must be non-negative.';
      return out;
    }

    var tau_1e2_s = tau_FWHM_s / Math.sqrt(2 * Math.LN2);
    if (tau_1e2_s > 0 && E_J >= 0) {
      out.peakIntensity_Wm2 = 2 * E_J / (Math.pow(Math.PI, 1.5) * wx_m * wy_m * tau_1e2_s);
      out.peakIntensity_Wcm2 = out.peakIntensity_Wm2 / 1e4;
      out.fluence_Jm2 = 2 * E_J / (Math.PI * wx_m * wy_m);
      if (out.peakIntensity_Wm2 > 0) {
        out.peakEfield_Vm = Math.sqrt(2 * out.peakIntensity_Wm2 / (EPS0 * C));
        out.peakBfield_T = out.peakEfield_Vm / C;
      }
    }
    if (wx_m > 0 && wy_m > 0) {
      out.area_1e2_um2 = Math.PI * (wx_m * 1e6) * (wy_m * 1e6);
      out.area_FWHM_um2 = Math.PI * (wx_m * 1e6) * (wy_m * 1e6) * (Math.LN2 / 2);
    }
    if (tau_FWHM_s > 0 && !isNaN(tau_FWHM_s)) {
      out.bandwidthMin_Hz = GAUSSIAN_TBP / tau_FWHM_s;
      out.bandwidthMin_eV = (H * out.bandwidthMin_Hz) / E_CHARGE;
      if (lambda_m > 0) {
        out.bandwidthMin_nm = (lambda_m * lambda_m * 1e9) * GAUSSIAN_TBP / (tau_FWHM_s * C);
      }
    }
    if (lambda_m > 0 && E_J >= 0) {
      out.photonsPerPulse = (E_J * lambda_m) / HC_Jm;
      if (rep_Hz >= 0 && !isNaN(rep_Hz)) {
        out.photonsPerSec = out.photonsPerPulse * rep_Hz;
        out.power_W = E_J * rep_Hz;
      }
    }

    return out;
  }

  /** Gaussian intensity at radius r (1/e² radius w): I0 * exp(-2*r²/w²) */
  function intensityProfile(r, w, I0) {
    if (w <= 0) return 0;
    return I0 * Math.exp(-2 * (r * r) / (w * w));
  }

  return {
    compute: compute,
    parseNum: parseNum,
    intensityProfile: intensityProfile,
    EV_TO_NM: EV_TO_NM,
    HC_Jm: HC_Jm
  };
})();
