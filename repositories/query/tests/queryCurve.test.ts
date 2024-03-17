import queryCurve, { getEncodedCurveQueryFunction, queryEncodedCurve } from '../dist';

describe('@query-curve/queryCurve', () => {
  it('should correctly query for the value on the curves', async () => {
    const curve = [1, 1, 0, 0, 0, 0, 0.5, 0, 0.5, 1, 1, 1];

    expect(queryCurve(curve, 0)).toBe(0);
    expect(queryCurve(curve, 0.3)?.toFixed(2)).toBe('0.16');
    expect(queryCurve(curve, 0.5)).toBe(0.5);
    expect(queryCurve(curve, 0.6)?.toFixed(2)).toBe('0.69');
    expect(queryCurve(curve, 0.8)?.toFixed(2)).toBe('0.94');
    expect(queryCurve(curve, 1)).toBe(1);
  });

  it('should correctly query for the value on the encoded curves', async () => {
    const encodedScaledChain = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK';
    expect(queryEncodedCurve(encodedScaledChain, 0)).toBe(0);
    expect(queryEncodedCurve(encodedScaledChain, 0.3)?.toFixed(2)).toBe('0.16');
    expect(queryEncodedCurve(encodedScaledChain, 0.5)).toBe(0.5);
    expect(queryEncodedCurve(encodedScaledChain, 0.6)?.toFixed(2)).toBe('0.69');
    expect(queryEncodedCurve(encodedScaledChain, 0.8)?.toFixed(2)).toBe('0.94');
    expect(queryEncodedCurve(encodedScaledChain, 1)).toBe(1);
  });

  it('should correctly create a function capable of querying onto a stored encoded chain', async () => {
    const encodedScaledChain = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK';
    const queryMyCurve = getEncodedCurveQueryFunction(encodedScaledChain);

    expect(queryMyCurve(0)).toBe(0);
    expect(queryMyCurve(0.3)?.toFixed(2)).toBe('0.16');
    expect(queryMyCurve(0.5)).toBe(0.5);
    expect(queryMyCurve(0.6)?.toFixed(2)).toBe('0.69');
    expect(queryMyCurve(0.8)?.toFixed(2)).toBe('0.94');
    expect(queryMyCurve(1)).toBe(1);

    const encodedScaledChain2 = 'fxSK-fxSK-0-0-0-0-264W-0-AQ1l-0-CW6H-0-KYiG-0-OgWT-fxSK-VkR1-fxSK-XqVX-fxSK-drNo-fxSK-fxSK-fxSK';
    const queryMyCurve2 = getEncodedCurveQueryFunction(encodedScaledChain2);

    expect(queryMyCurve2(0)).toBe(0);
    expect(queryMyCurve2(0.3)?.toFixed(2)).toBe('0.00');
    expect(queryMyCurve2(0.5)! - 0.37).toBeLessThan(0.01);
    expect(queryMyCurve2(0.7)! - 0.96).toBeLessThan(0.01);
    expect(Math.abs(queryMyCurve2(0.8)! - 1)).toBeLessThan(0.000001);
  });

  it('should correctly create a function capable of querying onto a stored encoded chain with negative values', async () => {
    // -1, -1 scale
    const chain1 = '-fxSK--fxSK-0-0-0-0-fxSK-fxSK-0-0-fxSK-fxSK';
    const queryMyCurve1 = getEncodedCurveQueryFunction(chain1);

    expect(queryMyCurve1(0)).toBe(0);
    expect(queryMyCurve1(-1)).toBe(-1);
    expect(queryMyCurve1(-0.5)).toBe(-0.5);
  });

  it('should correctly create a function capable of querying onto a stored encoded chain with offset and scale', async () => {
    // 2, 4 scale, -3, 5 offset
    const chain1 = '1Luue-2hppI--21sMy-3NnHc-0-0-fxSK-fxSK-0-0-fxSK-fxSK';
    const queryMyCurve1 = getEncodedCurveQueryFunction(chain1);

    expect(queryMyCurve1(-6)).toBe(20); // 0, 0 in internal space is -6, 20 in external space (-3 offset * 2 scale, 5 offset * 4 scale)
    expect(queryMyCurve1(-4)).toBe(24); // 1, 1 in internal space is -4, 24 in external space ((1 - 3 offset) * 2 scale, (1 + 5 offset) * 4 scale)
    expect(queryMyCurve1(-5)).toBe(22); // 0.5, 0.5 in internal space is -5, 22 in external space ((0.5 - 3 offset) * 2 scale, (0.5 + 5 offset) * 4 scale)
  });
});
