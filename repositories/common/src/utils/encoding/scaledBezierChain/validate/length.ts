import { ScaledBezierChain } from '@common/types';

/**
 * After removing the scale factor, a scaled chain should look like this:
 * pphhhhpphhhhpphhhhpp
 * xx-----6-----12----18
 * Valid stopping points, after removing the first point, is every 6th point.
 * @param chain The scaled bezier chain to validate.
 * @returns {boolean} Whether the chain length is valid.
 */
export default function validateScaledBezierChainLength(chain: ScaledBezierChain): boolean {
  let remainder = chain.length;
  remainder -= 2; // Remove the scale factors
  remainder -= 2; // Remove the first point
  return ((remainder % 6) !== 0)
}
