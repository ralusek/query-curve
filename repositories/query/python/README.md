# QueryCurve
This tool allows you to invoke queries against a curve you've laid out at [https://querycurve.com](https://querycurve.com/)

Once you have a curve in the shape you'd like:
![Example curve from QueryCurve.com](https://querycurve.com/example_d.png)

You'll get a resulting encoded curve that'll look like this:
`2BLnMW-2BLnMW--KyjA--KyjA-0-KyjA-CaR6-XZAG-KyjA-TN1E-KyjA-KyjA-KyjA-CaR6-TN1E-8OI4-fxSK-KyjA`

## Time to query!

### Installation from PyPi
```bash
$ pip install query-curve
```

### Usage

```python
from query_curve import query_encoded_curve
```

#### Querying with a dynamically loaded curve
If you are pulling your curve from a db or otherwise need it to be dynamic:
```python
dynamically_loaded_curve = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK' # assume this was loaded from db
my_x_value = 0.35

# Gets the corresponding y value along the curve for a given x
result = query_encoded_curve(dynamically_loaded_curve, my_x_value)
```
Note: While decoding the curve is fast, repeatedly querying against the same curve can be optimized by preloading the curve.
If you anticipate multiple queries against the same curve, consider using:

#### Querying with a preloaded or reused curve
If the curve you're using will be used to facilitate multiple queries, this alternative for querying will
bypass the need to decode the curve on every query.

```python
from query_curve import get_encoded_curve_query_function
fixed_curve = 'fxSK-fxSK-0-0-0-0-KyjA-0-KyjA-fxSK-fxSK-fxSK'
# Returns a function with a reference to the decoded curve
query_my_curve = get_encoded_curve_query_function(fixed_curve) 

query_my_curve(0)
query_my_curve(0.5)
query_my_curve(0.37)
```
