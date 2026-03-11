/* Conversion factors: value_in_base = value_in_unit * factor (for linear units).
   So factor = base units per 1 of this unit.
   For reciprocal units (e.g. energy as wavelength λ = hc/E), use toBase/fromBase instead. */

var h = 6.62607015e-34;   // J·s (CODATA 2019)
var c = 299792458;        // m/s (exact)
var hc = 1.986311e-25;    // J·m (h*c). λ(nm) = hc*1e9 / E(J)
var N_A = 6.02214076e23;  // per mol

window.SCIRESULTS_CONVERSION = {
  energy: {
    base: 'J',
    units: [
      { id: 'eV', label: 'eV', name: 'Electronvolts', factor: 1.602176634e-19 },
      { id: 'cm-1', label: 'cm⁻¹', name: 'Wavenumber', factor: h * c * 100 },
      { id: 'nm', label: 'nm (λ)', name: 'Wavelength', factor: null, toBase: function (v) { return (hc * 1e9) / v; }, fromBase: function (E) { return (hc * 1e9) / E; } },
      { id: 'Ha', label: 'Hartree', name: 'Hartree', factor: 4.359744722e-18 },
      { id: 'Ry', label: 'Rydberg', name: 'Rydberg', factor: 2.179872361e-18 },
      { id: 'Hz', label: 'Hz', name: 'Hertz', factor: h },
      { id: 'kHz', label: 'kHz', name: 'Kilohertz', factor: h * 1e3 },
      { id: 'MHz', label: 'MHz', name: 'Megahertz', factor: h * 1e6 },
      { id: 'GHz', label: 'GHz', name: 'Gigahertz', factor: h * 1e9 },
      { id: 'THz', label: 'THz', name: 'Terahertz', factor: h * 1e12 },
      { id: 'kcal/mol', label: 'kcal/mol', name: 'Kilocalories per mole', factor: 4184 / N_A },
      { id: 'kJ/mol', label: 'kJ/mol', name: 'Kilojoules per mole', factor: 1000 / N_A },
      { id: 'J', label: 'J', name: 'Joules', factor: 1 },
      { id: 'kcal', label: 'kcal', name: 'Kilocalories', factor: 4184 },
      { id: 'cal', label: 'cal', name: 'Calories', factor: 4.184 },
      { id: 'erg', label: 'erg', name: 'Ergs', factor: 1e-7 },
      { id: 'kWh', label: 'kWh', name: 'Kilowatt-hours', factor: 3.6e6 },
      { id: 'Wh', label: 'Wh', name: 'Watt-hours', factor: 3600 }
    ]
  },
  mass: {
    base: 'kg',
    units: [
      { id: 'g', label: 'g', name: 'Grams', factor: 1e-3 },
      { id: 'kg', label: 'kg', name: 'Kilograms', factor: 1 },
      { id: 'mg', label: 'mg', name: 'Milligrams', factor: 1e-6 },
      { id: 'ug', label: 'μg', name: 'Micrograms', factor: 1e-9 },
      { id: 'ng', label: 'ng', name: 'Nanograms', factor: 1e-12 },
      { id: 'amu', label: 'u (amu)', name: 'Unified atomic mass unit', factor: 1.66053906660e-27 },
      { id: 'lb', label: 'lb', name: 'Pounds', factor: 0.45359237 },
      { id: 'oz', label: 'oz', name: 'Ounces', factor: 0.028349523125 }
    ]
  },
  speed: {
    base: 'm/s',
    units: [
      { id: 'm/s', label: 'm/s', name: 'Metres per second', factor: 1 },
      { id: 'km/h', label: 'km/h', name: 'Kilometres per hour', factor: 1 / 3.6 },
      { id: 'cm/s', label: 'cm/s', name: 'Centimetres per second', factor: 0.01 },
      { id: 'c', label: 'c', name: 'Speed of light', factor: c },
      { id: 'mph', label: 'mph', name: 'Miles per hour', factor: 0.44704 },
      { id: 'ft/s', label: 'ft/s', name: 'Feet per second', factor: 0.3048 },
      { id: 'knot', label: 'knot', name: 'Knots', factor: 0.514444 }
    ]
  },
  temperature: {
    base: 'K',
    special: true
  },
  bfield: {
    base: 'T',
    units: [
      { id: 'T', label: 'T', name: 'Tesla', factor: 1 },
      { id: 'mT', label: 'mT', name: 'Millitesla', factor: 1e-3 },
      { id: 'G', label: 'G', name: 'Gauss', factor: 1e-4 },
      { id: 'uT', label: 'μT', name: 'Microtesla', factor: 1e-6 },
      { id: 'Oe', label: 'Oe', name: 'Oersted', factor: 1e-4 }
    ]
  },
  efield: {
    base: 'V/m',
    units: [
      { id: 'V/m', label: 'V/m', name: 'Volts per metre', factor: 1 },
      { id: 'kV/m', label: 'kV/m', name: 'Kilovolts per metre', factor: 1000 },
      { id: 'V/cm', label: 'V/cm', name: 'Volts per centimetre', factor: 100 },
      { id: 'V/mm', label: 'V/mm', name: 'Volts per millimetre', factor: 1000 },
      { id: 'MV/m', label: 'MV/m', name: 'Megavolts per metre', factor: 1e6 }
    ]
  },
  pressure: {
    base: 'Pa',
    units: [
      { id: 'bar', label: 'bar', name: 'Bar', factor: 1e5 },
      { id: 'atm', label: 'atm', name: 'Atmosphere', factor: 101325 },
      { id: 'mmHg', label: 'mmHg', name: 'Millimetre of mercury', factor: 133.322 },
      { id: 'torr', label: 'Torr', name: 'Torr', factor: 133.322 },
      { id: 'Pa', label: 'Pa', name: 'Pascal', factor: 1 },
      { id: 'kPa', label: 'kPa', name: 'Kilopascal', factor: 1000 },
      { id: 'MPa', label: 'MPa', name: 'Megapascal', factor: 1e6 },
      { id: 'psi', label: 'psi', name: 'Pounds per square inch', factor: 6894.76 },
      { id: 'mbar', label: 'mbar', name: 'Millibar', factor: 100 },
      { id: 'inHg', label: 'inHg', name: 'Inch of mercury', factor: 3386.39 }
    ]
  },
  frequency: {
    base: 'Hz',
    units: [
      { id: 'Hz', label: 'Hz', name: 'Hertz', factor: 1 },
      { id: 'kHz', label: 'kHz', name: 'Kilohertz', factor: 1e3 },
      { id: 'MHz', label: 'MHz', name: 'Megahertz', factor: 1e6 },
      { id: 'GHz', label: 'GHz', name: 'Gigahertz', factor: 1e9 },
      { id: 'THz', label: 'THz', name: 'Terahertz', factor: 1e12 },
      { id: 'cm-1', label: 'cm⁻¹', name: 'Wavenumber (reciprocal cm)', factor: c * 100 },
      { id: 'rad/s', label: 'rad/s', name: 'Radians per second', factor: 1 / (2 * Math.PI) },
      { id: 'rpm', label: 'rpm', name: 'Revolutions per minute', factor: 1 / 60 }
    ]
  },
  angle: {
    base: 'rad',
    units: [
      { id: 'deg', label: '°', name: 'Degrees', factor: Math.PI / 180 },
      { id: 'rad', label: 'rad', name: 'Radians', factor: 1 },
      { id: 'arcmin', label: '′', name: 'Arcminutes', factor: Math.PI / 180 / 60 },
      { id: 'arcsec', label: '″', name: 'Arcseconds', factor: Math.PI / 180 / 3600 },
      { id: 'grad', label: 'grad', name: 'Gradians', factor: Math.PI / 200 },
      { id: 'turn', label: 'turn', name: 'Revolutions (turns)', factor: 2 * Math.PI }
    ]
  },
  irradiance: {
    base: 'W/m²',
    units: [
      { id: 'W/m2', label: 'W/m²', name: 'Watts per square metre', factor: 1 },
      { id: 'mW/cm2', label: 'mW/cm²', name: 'Milliwatts per square centimetre', factor: 10 },
      { id: 'kW/m2', label: 'kW/m²', name: 'Kilowatts per square metre', factor: 1000 },
      { id: 'W/cm2', label: 'W/cm²', name: 'Watts per square centimetre', factor: 1e4 },
      { id: 'MW/m2', label: 'MW/m²', name: 'Megawatts per square metre', factor: 1e6 },
      { id: 'erg/s/cm2', label: 'erg/(s·cm²)', name: 'Ergs per second per square centimetre', factor: 1e-3 }
    ]
  }
};

/* Temperature: conversions to/from Kelvin */
window.SCIRESULTS_TEMP = {
  K:  { label: 'K', name: 'Kelvin', toBase: function (v) { return v; }, fromBase: function (v) { return v; } },
  C:  { label: '°C', name: 'Celsius', toBase: function (v) { return v + 273.15; }, fromBase: function (v) { return v - 273.15; } },
  F:  { label: '°F', name: 'Fahrenheit', toBase: function (v) { return (v + 459.67) * 5 / 9; }, fromBase: function (v) { return v * 9 / 5 - 459.67; } }
};
