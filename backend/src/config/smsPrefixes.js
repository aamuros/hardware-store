/**
 * Philippine Telco Prefixes Configuration
 * 
 * All Philippine mobile numbers start with 09XX.
 * This configuration file makes it easy to update prefixes
 * without modifying the core SMS service logic.
 * 
 * Last updated: December 2024
 */

const PH_TELCO_PREFIXES = {
  // Globe Telecom (includes TM - Touch Mobile)
  GLOBE: [
    '0904', '0905', '0906', '0915', '0916', '0917', '0926', '0927',
    '0935', '0936', '0937', '0945', '0953', '0954', '0955', '0956', '0965',
    '0966', '0967', '0975', '0976', '0977', '0978', '0979', '0994', '0995',
    '0996', '0997'
  ],

  // Smart Communications (includes TNT and Sun)
  SMART: [
    '0907', '0908', '0909', '0910', '0911', '0912', '0913', '0914',
    '0918', '0919', '0920', '0921', '0922', '0923', '0924', '0925', '0928',
    '0929', '0930', '0931', '0932', '0933', '0934', '0938', '0939', '0940',
    '0941', '0942', '0943', '0944', '0946', '0947', '0948', '0949', '0950',
    '0951', '0961', '0963', '0968', '0969', '0970', '0971', '0973', '0974',
    '0981', '0989', '0992', '0998', '0999'
  ],

  // DITO Telecommunity (newest network)
  DITO: ['0991', '0993'],
};

// All valid prefixes combined (deduplicated)
const ALL_VALID_PREFIXES = [
  ...new Set([
    ...PH_TELCO_PREFIXES.GLOBE,
    ...PH_TELCO_PREFIXES.SMART,
    ...PH_TELCO_PREFIXES.DITO,
  ])
];

/**
 * Get telco name from phone prefix
 * @param {string} prefix - The 4-digit prefix (e.g., '0917')
 * @returns {string|null} Telco name or null if not found
 */
const getTelcoFromPrefix = (prefix) => {
  if (PH_TELCO_PREFIXES.GLOBE.includes(prefix)) return 'Globe';
  if (PH_TELCO_PREFIXES.SMART.includes(prefix)) return 'Smart';
  if (PH_TELCO_PREFIXES.DITO.includes(prefix)) return 'DITO';
  return null;
};

/**
 * Check if a prefix is valid
 * @param {string} prefix - The 4-digit prefix
 * @returns {boolean}
 */
const isValidPrefix = (prefix) => ALL_VALID_PREFIXES.includes(prefix);

module.exports = {
  PH_TELCO_PREFIXES,
  ALL_VALID_PREFIXES,
  getTelcoFromPrefix,
  isValidPrefix,
};
