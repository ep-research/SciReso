/* Peak convolution: convoluted/deconvoluted FWHM for Gaussians, Lorentzians, Voigts */

window.SCIREPO_PEAK_CONVOLUTION = (function () {
  'use strict';

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  /**
   * Voigt FWHM from Gaussian and Lorentzian FWHM (Olivero–Longbothum approximation).
   * FWHM_V ≈ 0.5346*FWHM_L + sqrt(0.2166*FWHM_L² + FWHM_G²)
   */
  function voigtFWHM(fwhmG, fwhmL) {
    if (fwhmG < 0 || fwhmL < 0) return NaN;
    if (fwhmG === 0) return fwhmL;
    if (fwhmL === 0) return fwhmG;
    return 0.5346 * fwhmL + Math.sqrt(0.2166 * fwhmL * fwhmL + fwhmG * fwhmG);
  }

  /**
   * Get (FWHM_G, FWHM_L) for a peak type.
   * Gaussian: (fwhm, 0), Lorentzian: (0, fwhm), Voigt: (fwhmG, fwhmL).
   */
  function getGL(type, fwhm, fwhmG, fwhmL) {
    if (type === 'gaussian') return { G: fwhm, L: 0 };
    if (type === 'lorentzian') return { G: 0, L: fwhm };
    if (type === 'voigt') return { G: fwhmG, L: fwhmL };
    return { G: 0, L: 0 };
  }

  /**
   * Convolution: combined (G_conv, L_conv).
   * G_conv² = G1² + G2², L_conv = L1 + L2.
   */
  function convolve(peak1, peak2) {
    var G = Math.sqrt(peak1.G * peak1.G + peak2.G * peak2.G);
    var L = peak1.L + peak2.L;
    return { G: G, L: L };
  }

  /**
   * Deconvolve: given convoluted (G_conv, L_conv) and known peak1, find peak2.
   * G2 = sqrt(G_conv² - G1²), L2 = L_conv - L1.
   */
  function deconvolve(convoluted, peak1) {
    var G2sq = convoluted.G * convoluted.G - peak1.G * peak1.G;
    if (G2sq < 0) return null;
    var G2 = Math.sqrt(G2sq);
    var L2 = convoluted.L - peak1.L;
    if (L2 < 0) return null;
    return { G: G2, L: L2 };
  }

  /**
   * Compute convolution or deconvolution.
   * Params: mode ('convolve'|'deconvolve'), type1, type2 (for convolve),
   * fwhm1, fwhm1G, fwhm1L, fwhm2, fwhm2G, fwhm2L,
   * convFwhm, convG, convL (for deconvolve: the measured convoluted result).
   */
  function compute(params) {
    var mode = params.mode || 'convolve';
    var type1 = params.type1 || 'gaussian';
    var type2 = params.type2 || 'gaussian';
    var out = {
      mode: mode,
      fwhmResult: NaN,
      fwhmResultG: NaN,
      fwhmResultL: NaN,
      fwhmVoigt: NaN,
      error: null
    };

    if (mode === 'convolve') {
      var fwhm1 = params.fwhm1;
      var fwhm2 = params.fwhm2;
      var p1 = getGL(type1, fwhm1, params.fwhm1G, params.fwhm1L);
      var p2 = getGL(type2, fwhm2, params.fwhm2G, params.fwhm2L);
      if (type1 === 'voigt' && (isNaN(p1.G) || isNaN(p1.L) || p1.G < 0 || p1.L < 0)) {
        out.error = 'Peak 1 (Voigt): enter valid FWHM_G and FWHM_L.';
        return out;
      }
      if (type2 === 'voigt' && (isNaN(p2.G) || isNaN(p2.L) || p2.G < 0 || p2.L < 0)) {
        out.error = 'Peak 2 (Voigt): enter valid FWHM_G and FWHM_L.';
        return out;
      }
      if (type1 !== 'voigt' && (isNaN(fwhm1) || fwhm1 < 0)) {
        out.error = 'Peak 1: enter a non-negative FWHM.';
        return out;
      }
      if (type2 !== 'voigt' && (isNaN(fwhm2) || fwhm2 < 0)) {
        out.error = 'Peak 2: enter a non-negative FWHM.';
        return out;
      }
      var conv = convolve(p1, p2);
      out.fwhmResultG = conv.G;
      out.fwhmResultL = conv.L;
      out.fwhmVoigt = voigtFWHM(conv.G, conv.L);
      out.fwhmResult = (conv.G > 0 && conv.L === 0) ? conv.G : (conv.G === 0 && conv.L > 0) ? conv.L : out.fwhmVoigt;
      return out;
    }

    if (mode === 'deconvolve') {
      var convFwhm = params.convFwhm;
      var convG = params.convG;
      var convL = params.convL;
      var convType = params.convType || 'gaussian';
      var knownFwhm = params.fwhm1;
      var knownG = params.fwhm1G;
      var knownL = params.fwhm1L;
      var known = getGL(type1, knownFwhm, knownG, knownL);
      var convoluted;
      if (convType === 'gaussian') {
        if (isNaN(convFwhm) || convFwhm < 0) { out.error = 'Convoluted FWHM must be non-negative.'; return out; }
        convoluted = { G: convFwhm, L: 0 };
      } else if (convType === 'lorentzian') {
        if (isNaN(convFwhm) || convFwhm < 0) { out.error = 'Convoluted FWHM must be non-negative.'; return out; }
        convoluted = { G: 0, L: convFwhm };
      } else {
        if (isNaN(convG) || isNaN(convL) || convG < 0 || convL < 0) {
          out.error = 'Convoluted Voigt: enter valid FWHM_G and FWHM_L.';
          return out;
        }
        convoluted = { G: convG, L: convL };
      }
      if (type1 === 'voigt' && (isNaN(known.G) || isNaN(known.L) || known.G < 0 || known.L < 0)) {
        out.error = 'Known peak (Voigt): enter valid FWHM_G and FWHM_L.';
        return out;
      }
      if (type1 !== 'voigt' && (isNaN(knownFwhm) || knownFwhm < 0)) {
        out.error = 'Known peak: enter a non-negative FWHM.';
        return out;
      }
      var peak2 = deconvolve(convoluted, known);
      if (!peak2) {
        out.error = 'Deconvolution impossible (convoluted FWHM too small or invalid).';
        return out;
      }
      out.fwhmResultG = peak2.G;
      out.fwhmResultL = peak2.L;
      out.fwhmVoigt = voigtFWHM(peak2.G, peak2.L);
      out.fwhmResult = (peak2.G > 0 && peak2.L === 0) ? peak2.G : (peak2.G === 0 && peak2.L > 0) ? peak2.L : out.fwhmVoigt;
      return out;
    }

    out.error = 'Unknown mode.';
    return out;
  }

  return {
    compute: compute,
    voigtFWHM: voigtFWHM,
    convolve: convolve,
    deconvolve: deconvolve,
    getGL: getGL,
    parseNum: parseNum
  };
})();
