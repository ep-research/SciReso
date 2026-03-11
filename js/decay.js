/* Decay / half-life: N(t) = N0 * 2^(-t/t_half), A = λN, λ = ln(2)/t_half */

window.SCIREPO_DECAY = (function () {
  'use strict';

  var LN2 = Math.LN2;

  function parseNum(val) {
    var n = parseFloat(String(val).replace(/,/g, ''));
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  var TIME_FACTORS = { s: 1, min: 60, h: 3600, d: 86400, y: 31557600 };
  function timeToSeconds(val, unit) {
    var u = (unit || 's').toLowerCase().replace('yr', 'y');
    var f = TIME_FACTORS[u] != null ? TIME_FACTORS[u] : 1;
    return (val || 0) * f;
  }
  function timeFromSeconds(t_s, unit) {
    var u = (unit || 's').toLowerCase().replace('yr', 'y');
    var f = TIME_FACTORS[u] != null ? TIME_FACTORS[u] : 1;
    return (t_s || 0) / f;
  }
  function timeUnitLabel(unit) {
    var u = (unit || 's').toLowerCase().replace('yr', 'y');
    return { s: 's', min: 'min', h: 'h', d: 'd', y: 'yr' }[u] || 's';
  }

  /**
   * Compute decay at time t.
   * params: { N0, t_half, t_half_unit, t, t_unit }
   * returns: { N, A_Bq, lambda_s, halfLivesElapsed, error }
   */
  function compute(params) {
    var N0 = parseNum(params.N0);
    var tHalf = parseNum(params.t_half);
    var t = parseNum(params.t);
    var tHalfUnit = params.t_half_unit || 's';
    var tUnit = params.t_unit || 's';

    if (N0 == null || isNaN(N0) || N0 < 0) {
      return { N: NaN, A_Bq: NaN, lambda_s: NaN, halfLivesElapsed: NaN, error: 'Initial amount N₀ must be a non-negative number.' };
    }
    if (tHalf == null || isNaN(tHalf) || tHalf <= 0) {
      return { N: NaN, A_Bq: NaN, lambda_s: NaN, halfLivesElapsed: NaN, error: 'Half-life must be a positive number.' };
    }
    if (t == null || isNaN(t) || t < 0) {
      return { N: NaN, A_Bq: NaN, lambda_s: NaN, halfLivesElapsed: NaN, error: 'Time t must be a non-negative number.' };
    }

    var tHalf_s = timeToSeconds(tHalf, tHalfUnit);
    var t_s = timeToSeconds(t, tUnit);
    var lambda = LN2 / tHalf_s;
    var N = N0 * Math.pow(2, -t_s / tHalf_s);
    var A_Bq = lambda * N;
    var halfLivesElapsed = t_s / tHalf_s;

    return {
      N: N,
      A_Bq: A_Bq,
      lambda_s: lambda,
      halfLivesElapsed: halfLivesElapsed,
      tHalf_s: tHalf_s,
      error: null
    };
  }

  /**
   * Generate points for N(t) plot. t in seconds.
   * Returns array of { t_s, N, A } (A in Bq).
   */
  function spectrumPointsWithHalfLife(N0, tHalf_s, tMin_s, tMax_s, nPoints) {
    var out = [];
    if (N0 <= 0 || tHalf_s <= 0 || tMax_s <= tMin_s) return out;
    for (var i = 0; i <= (nPoints || 120); i++) {
      var t_s = tMin_s + (tMax_s - tMin_s) * i / (nPoints || 120);
      var N = N0 * Math.pow(2, -t_s / tHalf_s);
      var A = (LN2 / tHalf_s) * N;
      out.push({ t_s: t_s, N: N, A: A });
    }
    return out;
  }

  return {
    parseNum: parseNum,
    timeToSeconds: timeToSeconds,
    timeFromSeconds: timeFromSeconds,
    timeUnitLabel: timeUnitLabel,
    compute: compute,
    spectrumPointsWithHalfLife: spectrumPointsWithHalfLife
  };
})();
