// Types
import { EncodedScaledBezierChain, ScaledBezierChain } from '@common/types';

// Utils
import toBase62 from '@common/utils/encoding/base62/toBase62';

// Constants
import { ENCODING_SCALE_FACTOR } from '../constants';

export default function encode(chain: ScaledBezierChain): EncodedScaledBezierChain {
  return chain.map((link) => {
    const transformed = Math.round(link * ENCODING_SCALE_FACTOR);
    const isNegative = transformed < 0;
    const encoded = toBase62(isNegative ? -transformed : transformed);
    const signed = `${isNegative ? '-' : ''}${encoded}`;
    return signed;
  }).join('-');
}
