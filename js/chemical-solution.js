/* Chemical solution: concentration types, units, and calculation */

window.SCIRESULTS_CS = (function () {
  'use strict';
  var N_A = 6.02214076e23;

  var concTypes = {
    molarity: {
      label: 'Molarity',
      needs: ['M'],
      units: [
        { id: 'M', label: 'M', toMolPerL: 1 },
        { id: 'mM', label: 'mM', toMolPerL: 1e-3 },
        { id: 'uM', label: 'μM', toMolPerL: 1e-6 }
      ],
      toBase: function (val, unitId) {
        var u = this.units.find(function (x) { return x.id === unitId; });
        return u ? val * u.toMolPerL : val;
      }
    },
    mass_vol: {
      label: 'Mass/volume',
      needs: [],
      units: [
        { id: 'g/L', label: 'g/L', toGPerL: 1 },
        { id: 'mg/mL', label: 'mg/mL', toGPerL: 1 },
        { id: 'ug/mL', label: 'μg/mL', toGPerL: 1e-3 },
        { id: '%wv', label: '% w/v', toGPerL: 10 }
      ],
      toBaseGPerL: function (val, unitId) {
        var u = this.units.find(function (x) { return x.id === unitId; });
        return u ? val * u.toGPerL : val;
      }
    },
    vol_vol: {
      label: 'Volume/volume',
      needs: ['rho_solute'],
      units: [
        { id: '%vv', label: '% v/v', fractionOfTotal: 0.01 },
        { id: 'mL/L', label: 'mL/L', fractionOfTotal: 1/1000 }
      ],
      toFraction: function (val, unitId) {
        var u = this.units.find(function (x) { return x.id === unitId; });
        return u ? val * u.fractionOfTotal : val;
      }
    },
    molality: {
      label: 'Molality',
      needs: ['M'],
      targetIsMass: true,
      units: [
        { id: 'mol/kg', label: 'mol/kg', toMolPerKg: 1 }
      ],
      toBase: function (val) { return val; }
    },
    number: {
      label: 'Number concentration',
      needs: ['M'],
      units: [
        { id: '/mL', label: '/mL', perL: 1000 },
        { id: '/L', label: '/L', perL: 1 },
        { id: '/m3', label: '/m³', perL: 1e-3 }
      ],
      toPerL: function (val, unitId) {
        var u = this.units.find(function (x) { return x.id === unitId; });
        return u ? val * u.perL : val;
      }
    },
    mass_fraction: {
      label: 'Mass fraction',
      needs: ['rho_solution'],
      units: [
        { id: '%ww', label: '% w/w', toFraction: 0.01 },
        { id: 'g/g', label: 'g/g', toFraction: 1 }
      ],
      toFraction: function (val, unitId) {
        var u = this.units.find(function (x) { return x.id === unitId; });
        return u ? val * u.toFraction : val;
      }
    }
  };

  function parseNum(val) {
    var n = parseFloat(val);
    return typeof n === 'number' && !isNaN(n) ? n : NaN;
  }

  function compute(params) {
    var source = params.source;
    var cType = params.concType;
    var cVal = params.concValue;
    var cUnit = params.concUnit;
    var targetVal = params.targetValue;
    var targetUnit = params.targetUnit;
    var M = params.molarMass;
    var rhoSolute = params.rhoSolute;
    var rhoSolution = params.rhoSolution;
    var rhoSolvent = params.rhoSolvent;
    var stockValue = params.stockValue;
    var stockUnit = params.stockUnit;

    var result = { mass_g: NaN, volume_mL: NaN, moles: NaN, V_stock_mL: NaN, V_final_L: NaN, error: null };

    if (cType === 'molality') {
      var mSolvent_kg = targetUnit === 'kg' ? targetVal : targetVal * 0.001;
      if (mSolvent_kg <= 0 || !M || M <= 0) { result.error = 'Enter positive solvent mass and molar mass.'; return result; }
      var b = cVal;
      result.moles = b * mSolvent_kg;
      result.mass_g = result.moles * M;
    } else {
      var V_L = targetUnit === 'L' ? targetVal : targetUnit === 'mL' ? targetVal * 1e-3 : targetVal * 1e-6;
      result.V_final_L = V_L;
      if (V_L <= 0) { result.error = 'Enter positive final volume.'; return result; }

      switch (cType) {
        case 'molarity': {
          if (!M || M <= 0) { result.error = 'Enter molar mass.'; return result; }
          var c = concTypes.molarity.toBase.call(concTypes.molarity, cVal, cUnit);
          result.moles = c * V_L;
          result.mass_g = result.moles * M;
          break;
        }
        case 'mass_vol': {
          var cg = concTypes.mass_vol.toBaseGPerL.call(concTypes.mass_vol, cVal, cUnit);
          result.mass_g = cg * V_L;
          result.moles = (M && M > 0) ? result.mass_g / M : NaN;
          break;
        }
        case 'vol_vol': {
          if (!rhoSolute || rhoSolute <= 0) { result.error = 'Enter solute density (g/mL).'; return result; }
          var frac = concTypes.vol_vol.toFraction.call(concTypes.vol_vol, cVal, cUnit);
          var V_solute_L = frac * V_L;
          result.volume_mL = V_solute_L * 1000;
          result.mass_g = V_solute_L * 1000 * rhoSolute;
          result.moles = (M && M > 0) ? result.mass_g / M : NaN;
          break;
        }
        case 'number': {
          if (!M || M <= 0) { result.error = 'Enter molar mass.'; return result; }
          var perL = concTypes.number.toPerL.call(concTypes.number, cVal, cUnit);
          result.moles = (perL * V_L) / N_A;
          result.mass_g = result.moles * M;
          break;
        }
        case 'mass_fraction': {
          if (!rhoSolution || rhoSolution <= 0) { result.error = 'Enter solution density (g/mL).'; return result; }
          var w = concTypes.mass_fraction.toFraction.call(concTypes.mass_fraction, cVal, cUnit);
          var V_mL = V_L * 1000;
          var m_solution_g = rhoSolution * V_mL;
          result.mass_g = w * m_solution_g;
          result.moles = (M && M > 0) ? result.mass_g / M : NaN;
          break;
        }
        default:
          result.error = 'Unknown concentration type.';
          return result;
      }
    }

    if (source === 'stock' && (result.moles > 0 || result.mass_g > 0)) {
      var cStock = parseNum(stockValue);
      if (isNaN(cStock) || cStock <= 0) { result.error = 'Enter positive stock concentration.'; return result; }
      var cTarget = cVal;
      var cUnitId = cUnit;
      if (cType === 'molarity') {
        var cT = concTypes.molarity.toBase.call(concTypes.molarity, cVal, cUnit);
        var cS = concTypes.molarity.toBase.call(concTypes.molarity, cStock, stockUnit);
        if (cS <= 0) { result.error = 'Invalid stock unit.'; return result; }
        result.V_stock_mL = (cT / cS) * result.V_final_L * 1000;
      } else if (cType === 'mass_vol') {
        var gT = concTypes.mass_vol.toBaseGPerL.call(concTypes.mass_vol, cVal, cUnit);
        var gS = concTypes.mass_vol.toBaseGPerL.call(concTypes.mass_vol, cStock, stockUnit);
        if (gS <= 0) { result.error = 'Invalid stock unit.'; return result; }
        result.V_stock_mL = (gT / gS) * result.V_final_L * 1000;
      } else {
        result.error = 'Stock dilution supported for molarity and mass/volume only.';
      }
    }

    if (result.mass_g < 0) result.mass_g = NaN;
    return result;
  }

  return { concTypes: concTypes, compute: compute, parseNum: parseNum };
})();
