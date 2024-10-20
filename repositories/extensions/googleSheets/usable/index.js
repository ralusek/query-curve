// This function is called when the spreadsheet is opened
function onOpen(e) {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('QueryCurve')
    .addItem('Help', 'showHelp')
    .addToUi();
}

// This function is called when the add-on is installed
function onInstall(e) {
  onOpen(e);
}

// Function to show help dialog
function showHelp() {
  var ui = SpreadsheetApp.getUi();
  ui.alert('To use the custom function, enter =QUERYCURVE(x, curve) in a cell, where x is the input value, and "curve" is the encoded curve from https://querycurve.com.');
}

/**
 * Returns the value of a point on a curve generated at https://querycurve.com
 * @param {*} value The x value to query for a corresponding y value along the curve
 * @param {*} curve The encoded curve from https://querycurve.com to query
 * @returns The y value corresponding to the x value on the curve
 */
function QUERYCURVE(value, curve) {
  return QUERYCURVE_EXP(value, curve);
}

const QUERYCURVE_EXP = (() => {
  var BASE_62_CHAR_SET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  function fromBase62(str) {
    return str.split("").reverse().reduce((prev, curr, i) => {
      return prev + BASE_62_CHAR_SET.indexOf(curr) * Math.pow(62, i);
    }, 0);
  }
  var ENCODING_SCALE_FACTOR = Math.pow(10, 7);
  function decode(chain) {
    const matches = chain.replace(/^/, "-").match(/--?[0-9A-Za-z]+/g) || [];
    return matches.map((link) => {
      const isNegative = link.startsWith("--");
      const transformed = fromBase62(link.replace(/^-+/, ""));
      return (isNegative ? -transformed : transformed) / ENCODING_SCALE_FACTOR;
    });
  }
  function queryCurve2(curve, scaledX) {
    const first = 4;
    const last = curve.length - 1;
    if (!(curve[0] && curve[1]))
      throw new Error("Scale factors cannot be 0");
    const x = scaledX / curve[0] - curve[2];
    if (x < curve[first] || x > curve[last - 1])
      return null;
    for (let i = first; i < curve.length; i += 6) {
      if (curve[i] === x)
        return toExternalCoordinate(curve[i + 1]);
    }
    let segmentStartIndex;
    for (let i = first; i < curve.length - 7; i += 6) {
      const startPoint = [curve[i], curve[i + 1]];
      const endPoint = [curve[i + 6], curve[i + 7]];
      if (x >= startPoint[0] && x <= endPoint[0]) {
        segmentStartIndex = i;
        break;
      }
    }
    const segment = curve.slice(segmentStartIndex, segmentStartIndex + 8);
    for (let attempts = 0; attempts < 10; attempts++) {
      const tweak = 1e-4 * attempts;
      let t = getTAtX(segment, x >= 1 ? x - tweak : x + tweak);
      if (t === null)
        t = getTAtXAlternative(segment, x >= 1 ? x - tweak : x + tweak);
      if (t === null)
        continue;
      const point = getPointOnCurveAtT(segment, t);
      const y = Math.abs(point[1]) < 1e-15 ? 0 : point[1];
      return toExternalCoordinate(y);
    }
    throw new Error("Failed to find y for x on curve");
    function toExternalCoordinate(value) {
      const scaled = (value + curve[3]) * curve[1];
      return Object.is(scaled, -0) ? 0 : scaled;
    }
  }
  function queryEncodedCurve2(encodedChain, scaledX) {
    const chain = decode(encodedChain);
    return queryCurve2(chain, scaledX);
  }
  function getEncodedCurveQueryFunction(encodedChain) {
    const decodedChain = decode(encodedChain);
    return (scaledX) => queryCurve2(decodedChain, scaledX);
  }
  function getPointOnCurveAtT(segment, t) {
    const mt = 1 - t;
    const mt2 = mt * mt;
    const t2 = t * t;
    const a = mt2 * mt;
    const b = mt2 * t * 3;
    const c = mt * t2 * 3;
    const d = t * t2;
    const x = a * segment[0] + b * segment[2] + c * segment[4] + d * segment[6];
    const y = a * segment[1] + b * segment[3] + c * segment[5] + d * segment[7];
    return [x, y];
  }
  function getDerivativeAtT(segment, t) {
    const mt = 1 - t;
    const t2 = t * t;
    const a = -3 * mt * mt;
    const b = 3 * mt * (mt - 2 * t);
    const c = 3 * t * (2 * mt - t);
    const d = 3 * t2;
    const x = a * segment[0] + b * segment[2] + c * segment[4] + d * segment[6];
    const y = a * segment[1] + b * segment[3] + c * segment[5] + d * segment[7];
    return [x, y];
  }
  function getTAtX(segment, x) {
    let t = 0.5;
    let xAtT, xDerivativeAtT, xDifference, iterationCount = 0;
    do {
      const pointAtT = getPointOnCurveAtT(segment, t);
      const derivativeAtT = getDerivativeAtT(segment, t);
      xAtT = pointAtT[0];
      xDerivativeAtT = derivativeAtT[0];
      xDifference = x - xAtT;
      if (Math.abs(xDerivativeAtT) > 1e-6) {
        t += xDifference / xDerivativeAtT;
      }
      t = Math.max(Math.min(t, 1), 0);
      iterationCount++;
      if (iterationCount > 15) {
        return null;
      }
    } while (Math.abs(xDifference) > 1e-6);
    return t;
  }
  function getTAtXAlternative(segment, x, tolerance = 1e-6, maxIterations = 100) {
    let a = 0;
    let b = 1;
    let t = (a + b) / 2;
    for (let i = 0; i < maxIterations; i++) {
      t = (a + b) / 2;
      const xAtT = getPointOnCurveAtT(segment, t)[0];
      if (Math.abs(xAtT - x) <= tolerance) {
        return t;
      }
      if (xAtT > x !== getPointOnCurveAtT(segment, a)[0] > x) {
        b = t;
      } else {
        a = t;
      }
    }
    return null;
  }

  return function QUERYCURVE(value, curve) {
    return queryEncodedCurve2(curve, typeof value === "string" ? parseFloat(value) : value);
  };
})();
