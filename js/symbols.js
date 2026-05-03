/* SCIRESO — Central symbol registry. Single source for (meaning, symbol). No units.
 * Each entry must have a unique rendered symbol: disambiguate with subscripts in the
 * symbol string (underscore → <sub> in symbolHtml), e.g. λ_mfp vs λ for wavelength. */

window.SCIRESO_SYMBOLS = (function () {
  'use strict';

  var DEFS = {
    N:           { meaning: 'Amount',                symbol: 'N' },
    N0:          { meaning: 'Amount (initial)',     symbol: 'N₀' },
    N_t:         { meaning: 'Amount (at time t)',   symbol: 'N(t)' },

    I:           { meaning: 'Intensity',            symbol: 'I' },
    I0:          { meaning: 'Intensity (initial)',  symbol: 'I₀' },

    alpha:       { meaning: 'Absorption coeff. (linear)', symbol: 'α' },
    lambda_mfp:  { meaning: 'Mean free path',              symbol: 'λ_mfp' },
    a:           { meaning: 'Absorption coeff. (mass)',   symbol: 'a' },
    epsilon:     { meaning: 'Absorption coeff. (molar)',  symbol: 'ε' },
    sigma:       { meaning: 'Cross section',               symbol: 'σ' },
    L:           { meaning: 'Path length',                 symbol: 'L' },

    t:           { meaning: 'Time',                 symbol: 't' },
    t_half:      { meaning: 'Half-life',             symbol: 't₁/₂' },
    lambda_dec:  { meaning: 'Decay constant',        symbol: 'λ_dec' },
    A:           { meaning: 'Activity',              symbol: 'A' },

    P:           { meaning: 'Pressure',              symbol: 'P' },
    V:           { meaning: 'Volume',                symbol: 'V' },
    n:           { meaning: 'Amount',                symbol: 'n' },
    T:           { meaning: 'Temperature',           symbol: 'T' },
    Q:           { meaning: 'Partition function',    symbol: 'Q' },

    E:           { meaning: 'Energy',                symbol: 'E' },
    E_prime:     { meaning: 'Energy (scattered)',    symbol: 'E′' },
    E_bind:      { meaning: 'Binding energy',        symbol: 'E_bind' },
    E_k:         { meaning: 'Kinetic energy',        symbol: 'E_k' },

    lambda:      { meaning: 'Wavelength',           symbol: 'λ' },
    lambda_C:    { meaning: 'Compton wavelength',   symbol: 'λ_C' },
    lambda_dB:   { meaning: 'De Broglie wavelength', symbol: 'λ_dB' },
    delta_lambda:{ meaning: 'Wavelength shift',     symbol: 'Δλ' },

    theta:       { meaning: 'Angle',                 symbol: 'θ' },
    beta:        { meaning: 'Asymmetry parameter',  symbol: 'β' },

    m:           { meaning: 'Mass',                  symbol: 'm' },
    m_e:         { meaning: 'Electron mass',        symbol: 'm_e' },
    q:           { meaning: 'Charge',                symbol: 'q' },
    gamma:       { meaning: 'Lorentz factor',       symbol: 'γ' },
    v:           { meaning: 'Velocity',             symbol: 'v' },
    p:           { meaning: 'Momentum',              symbol: 'p' },

    B:           { meaning: 'Magnetic field',       symbol: 'B' },
    E_f:         { meaning: 'Electric field',       symbol: 'E_f' },

    g:           { meaning: 'Degeneracy',           symbol: 'g' },

    tau:         { meaning: 'Duration (FWHM)',     symbol: 'τ' },
    F:           { meaning: 'Fluence',              symbol: 'F' },
    P_w:         { meaning: 'Power',                symbol: 'P_w' },

    FWHM:        { meaning: 'FWHM',                  symbol: 'FWHM' },
    FWHM_G:      { meaning: 'FWHM (Gaussian)',      symbol: 'FWHM_G' },
    FWHM_L:      { meaning: 'FWHM (Lorentzian)',    symbol: 'FWHM_L' },

    x:           { meaning: 'Position (x)',          symbol: 'x' },
    y:           { meaning: 'Position (y)',         symbol: 'y' },

    B_rot:       { meaning: 'Rotational constant',   symbol: 'B_rot' },
    omega_e:     { meaning: 'Vibrational constant', symbol: 'ω_e' },
    Gamma:       { meaning: 'Linewidth (FWHM)',      symbol: 'Γ' },

    rho:         { meaning: 'Density',                symbol: 'ρ' },

    length:      { meaning: 'Length',                symbol: 'ℓ' },
    d:           { meaning: 'Spacing',               symbol: 'd' },

    sigma_x:     { meaning: 'Horizontal size',        symbol: 'σₓ' },
    sigma_y:     { meaning: 'Vertical size',          symbol: 'σᵧ' },
    sigma_xp:    { meaning: 'Horizontal divergence',  symbol: 'σₓ′' },
    sigma_yp:    { meaning: 'Vertical divergence',    symbol: 'σᵧ′' },

    Phi:         { meaning: 'Flux',                   symbol: 'Φ' },

    n_1:         { meaning: 'Refractive index (1)',   symbol: 'n₁' },
    n_2:         { meaning: 'Refractive index (2)',   symbol: 'n₂' },
    theta_1:     { meaning: 'Incident angle',         symbol: 'θ₁' },
    theta_2:     { meaning: 'Refracted angle',        symbol: 'θ₂' },
    theta_c:     { meaning: 'Critical angle',         symbol: 'θ_c' },

    f_focal:     { meaning: 'Focal length',           symbol: 'f' },
    s_obj:       { meaning: 'Object distance',        symbol: 's' },
    s_prime:     { meaning: 'Image distance',         symbol: "s'" },
    m_mag:       { meaning: 'Magnification',         symbol: 'M' },

    delta_theta: { meaning: 'Angular separation',    symbol: 'Δθ' }
  };

  function get(id) {
    var d = DEFS[id];
    return d ? { meaning: d.meaning, symbol: d.symbol } : null;
  }

  function symbol(id) {
    var d = get(id);
    return d ? d.symbol : String(id);
  }

  /** Symbol with underscore parts rendered as HTML subscript (for use in innerHTML). */
  function symbolHtml(id) {
    var s = symbol(id);
    if (typeof s !== 'string' || s.indexOf('_') === -1) return s;
    var parts = s.split('_');
    return parts[0] + parts.slice(1).map(function (p) { return '<sub>' + p + '</sub>'; }).join('');
  }

  function meaning(id) {
    var d = get(id);
    return d ? d.meaning : String(id);
  }

  return {
    get: get,
    symbol: symbol,
    symbolHtml: symbolHtml,
    meaning: meaning,
    DEFS: DEFS
  };
})();
