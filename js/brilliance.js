/* Spectral brilliance / brightness estimator */

window.SCIREPO_BRILLIANCE = (function () {
  'use strict';

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  function compute(params) {
    var flux = parseNum(params.flux_phot_s_01bw);
    var sigma_x_um = parseNum(params.sigma_x_um);
    var sigma_y_um = parseNum(params.sigma_y_um);
    var sigma_xp_urad = parseNum(params.sigma_xp_urad);
    var sigma_yp_urad = parseNum(params.sigma_yp_urad);

    var out = {
      flux_phot_s_01bw: flux,
      sigma_x_um: sigma_x_um,
      sigma_y_um: sigma_y_um,
      sigma_xp_urad: sigma_xp_urad,
      sigma_yp_urad: sigma_yp_urad,
      brilliance_SI: NaN,
      brilliance_common: NaN,
      error: null
    };

    if (!flux || flux <= 0 || isNaN(flux)) {
      out.error = 'Photon flux must be positive.';
      return out;
    }
    if (!sigma_x_um || !sigma_y_um || !sigma_xp_urad || !sigma_yp_urad ||
      sigma_x_um <= 0 || sigma_y_um <= 0 || sigma_xp_urad <= 0 || sigma_yp_urad <= 0) {
      out.error = 'All source size/divergence sigmas must be positive.';
      return out;
    }

    var sigma_x_m = sigma_x_um * 1e-6;
    var sigma_y_m = sigma_y_um * 1e-6;
    var sigma_xp_rad = sigma_xp_urad * 1e-6;
    var sigma_yp_rad = sigma_yp_urad * 1e-6;

    var A = (2 * Math.PI * sigma_x_m * sigma_y_m);
    var Omega = (2 * Math.PI * sigma_xp_rad * sigma_yp_rad);
    var denom = A * Omega;
    if (!denom || denom <= 0 || !isFinite(denom)) {
      out.error = 'Invalid phase space area.';
      return out;
    }

    var B_SI = flux / denom;
    var area_mm2 = (sigma_x_m * sigma_y_m) * 1e6;
    var angle_mrad2 = (sigma_xp_rad * sigma_yp_rad) * 1e6;
    var denom_common = (2 * Math.PI * area_mm2) * (2 * Math.PI * angle_mrad2);
    var B_common = flux / denom_common;

    out.brilliance_SI = B_SI;
    out.brilliance_common = B_common;
    return out;
  }

  return {
    compute: compute,
    parseNum: parseNum
  };
})();

