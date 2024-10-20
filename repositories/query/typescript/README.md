[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/ralusek/query-curve/blob/master/LICENSE)
[![npm version](https://img.shields.io/npm/v/@query-curve/query.svg?style=flat)](https://www.npmjs.com/package/@query-curve/query)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/ralusek/query-curve/blob/master/LICENSE)

# QueryCurve
This tool allows you to invoke queries against a curve you've laid out at [https://querycurve.com](https://querycurve.com/)

Once you have a curve in the shape you'd like:
![Example curve from QueryCurve.com](https://querycurve.com/example_d.png)

You'll get a resulting encoded curve that'll look like this:
`2BLnMW-2BLnMW--KyjA--KyjA-0-KyjA-CaR6-XZAG-KyjA-TN1E-KyjA-KyjA-KyjA-CaR6-TN1E-8OI4-fxSK-KyjA`

## Time to query!

### Installation from npm
```bash
$ npm install --save @query-curve/query
```

### Usage

```typescript
import { getEncodedCurveQueryFunction, queryEncodedCurve } from '@query-curve/query';

queryEncodedCurve('5SNUPI-8nlt2n2-0-0-0-fxSK-3yGp-fn3A-TzAp-e6zY-bau8-PAsC-dGxk-LXPh-f3xT-9cbF-fxSK-0', 0);
```

#### Querying with a dynamically loaded curve
If you are pulling your curve from a db or otherwise need it to be dynamic:
```typescript
const dynamicallyLoadedCurve = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK'; // assume this was loaded from db
const myXValue = 0.35;

// Gets the corresponding y value along the curve for a given x
const result = queryEncodedCurve(dynamicallyLoadedCurve, myXValue);
```
Note: While decoding the curve is fast, repeatedly querying against the same curve can be optimized by preloading the curve.
If you anticipate multiple queries against the same curve, consider using:

#### Querying with a preloaded or reused curve
If the curve you're using will be used to facilitate multiple queries, this alternative for querying will
bypass the need to decode the curve on every query.

```typescript
import { getEncodedCurveQueryFunction } from '@query-curve/query';
const fixedCurve = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK';
// Returns a function with a reference to the decoded curve
const queryMyCurve = getEncodedCurveQueryFunction(fixed_curve) ;

queryMyCurve(0);
queryMyCurve(0.5);
queryMyCurve(0.37);
```
