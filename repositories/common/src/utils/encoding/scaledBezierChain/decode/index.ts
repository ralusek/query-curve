// Types
import { EncodedScaledBezierChain, ScaledBezierChain } from '@common/types';

// Utils
import fromBase62 from '../../base62/fromBase62';

// Constants
import { ENCODING_SCALE_FACTOR } from '../constants';

// Encoded chain will look like this:
// fxSK-fxSK-0-0-fxSK-fxSK-0-0-fxSK-fxSK
// or
// -fxSK-fxSK-0-0-fxSK-fxSK-0-0-fxSK-fxSK
// or
// fxSK--fxSK-0-0-fxSK-fxSK-0-0-fxSK-fxSK
// Note the second 2 examples have an extra leading -, indicating a negative.
// For anything but the first, this results in a double -- preceding a value.
/**
 * Decode an encoded scaled Bezier chain
 * @param chain {EncodedScaledBezierChain} The encoded chain
 * @returns {ScaledBezierChain} The decoded chain
 */
export default function decode(chain: EncodedScaledBezierChain): ScaledBezierChain {
  const matches = chain
    // Add a leading - to the chain such that every value begins with - or --.
    .replace(/^/, '-')
    .match(/--?[0-9A-Za-z]+/g) || [];
  return matches.map((link) => {
    const isNegative = link.startsWith('--'); // If string starts with doubled (--), it's negative.
    const transformed = fromBase62(link.replace(/^-+/, ''));
    return (isNegative ? -transformed : transformed) / ENCODING_SCALE_FACTOR;
  });
}
