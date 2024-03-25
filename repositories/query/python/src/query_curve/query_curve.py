from .utils.decode import decode

def get_point_on_curve_at_t(segment: list[float], t: float) -> tuple[float, float]:
    """
    Returns the point on a cubic Bezier curve at a given t value.
    
    :param segment: The cubic Bezier segment to evaluate.
    :type segment: list[float]
    :param t: The t value at which to evaluate the curve.
    :type t: float
    :return: The cartesian coordinates of the point on the curve at the given t value.
    :rtype: tuple[float, float]
    """
    mt = 1 - t
    mt2 = mt * mt
    t2 = t * t

    a = mt2 * mt
    b = mt2 * t * 3
    c = mt * t2 * 3
    d = t * t2

    x = a * segment[0] + b * segment[2] + c * segment[4] + d * segment[6]
    y = a * segment[1] + b * segment[3] + c * segment[5] + d * segment[7]

    return (x, y)


def get_derivative_at_t(segment: list[float], t: float) -> tuple[float, float]:
    """
    Returns the derivative of a cubic Bezier curve at a given t value.
    
    :param segment: The cubic Bezier segment to evaluate.
    :type segment: list[float]
    :param t: The t value at which to evaluate the derivative.
    :type t: float
    :return: The derivative of the curve at the given t value.
    :rtype: tuple[float, float]
    """
    mt = 1 - t
    t2 = t * t

    # The derivative of a cubic Bezier curve is a second degree polynomial
    a = -3 * mt * mt
    b = 3 * mt * (mt - 2 * t)
    c = 3 * t * (2 * mt - t)
    d = 3 * t2

    x = a * segment[0] + b * segment[2] + c * segment[4] + d * segment[6]
    y = a * segment[1] + b * segment[3] + c * segment[5] + d * segment[7]

    return (x, y)


def get_t_at_x(segment: list[float], x: float) -> float:
    """
    Finds the t value for a given x value on a cubic Bezier curve.
    It is an implementation of the Newton-Raphson method.
    Implementation reference in chromium: https://chromium.googlesource.com/chromium/src/+/master/ui/gfx/geometry/cubic_bezier.cc

    :param segment: The cubic Bezier segment to evaluate.
    :type segment: list[float]
    :param x: The x value for which we will find the associated t value along the curve.
    :type x: float
    :return: The t value for the given x value along the curve.
    :rtype: float
    """

    t = 0.5  # Initial guess
    iteration_count = 0

    while True:
        point_at_t = get_point_on_curve_at_t(segment, t)
        derivative_at_t = get_derivative_at_t(segment, t)

        x_at_t = point_at_t[0]
        x_derivative_at_t = derivative_at_t[0]
        x_difference = x - x_at_t

        # Avoid division by a very small number which can lead to a huge jump
        if abs(x_derivative_at_t) > 1e-6:
            t += x_difference / x_derivative_at_t

        # Keep t within bounds [0, 1]
        t = max(min(t, 1), 0)

        iteration_count += 1

        if iteration_count > 15:
            # logging.warning('Newton-Raphson iteration failed to converge.')
            return None

        if abs(x_difference) <= 1e-6:
            break

    return t


def get_t_at_x_alternative(segment: list[float], x: float, tolerance=1e-6, max_iterations=100) -> float:
    """
    Finds the t value for a given x value on a cubic Bezier curve.
    It is an alternative implementation of the Newton-Raphson method.
    It uses bisection instead of Newton-Raphson.
    It is slower but more reliable and used when Newton-Raphson fails to converge.
    Implementation reference in chromium: https://chromium.googlesource.com/chromium/src/+/master/ui/gfx/geometry/cubic_bezier.cc

    :param segment: The cubic Bezier segment to evaluate.
    :type segment: list[float]
    :param x: The x value for which we will find the associated t value along the curve.
    :type x: float
    :param tolerance: The tolerance for the x value at t.
    :type tolerance: float
    :param max_iterations: The maximum number of iterations to perform.
    :type max_iterations: int
    :return: The t value for the given x value along the curve.
    :rtype: float
    """

    a = 0
    b = 1
    t = (a + b) / 2

    for _ in range(max_iterations):
        t = (a + b) / 2
        x_at_t = get_point_on_curve_at_t(segment, t)[0]

        if abs(x_at_t - x) <= tolerance:
            # The x value at t is close enough to the desired x value.
            return t

        # Determine which subinterval to choose for the next iteration.
        if (x_at_t > x) != (get_point_on_curve_at_t(segment, a)[0] > x):
            b = t
        else:
            a = t

    # Return None if no convergence after max_iterations
    return None


def to_external_coordinate(value: float, curve: list[float]) -> float:
    """
    Converts an internal y value back to external coordinate space.
    
    :param value: The internal y value to convert.
    :type value: float
    :param curve: The curve to which the value belongs.
    :type curve: list[float]
    :return: The external y value.
    :rtype: float
    """
    scaled = (value + curve[3]) * curve[1]
    return 0 if scaled == -0 else scaled


def query_curve(curve: list[float], scaled_x: float) -> float:
    """
    Finds the y value for a given x value along a cubic Bezier curve.
    
    :param curve: The cubic Bezier curve.
    :type curve: list[float]
    :param scaled_x: The x value for which we will find the associated y value along the curve.
    :type scaled_x: float
    :return: The y value for the given x value along the curve.
    :rtype: float
    """
    
    # Constants for indexes
    first = 4
    last = len(curve) - 1

    # Check for valid scale factors
    if not (curve[0] and curve[1]):
        raise ValueError('Scale factors cannot be 0')
    
    # Adjust x to the internal coordinate space
    x = (scaled_x / curve[0]) - curve[2]

    # Check if x is outside the curve's x range
    if x < curve[first] or x > curve[last - 1]:
        return None

    # Check for exact match of x value and return corresponding scaled y value
    for i in range(first, len(curve), 6):
        if curve[i] == x:
            return to_external_coordinate(curve[i + 1], curve)

    # Find the segment containing x
    segment_start_index = None
    for i in range(first, len(curve) - 7, 6):
        start_point = curve[i], curve[i + 1]
        end_point = curve[i + 6], curve[i + 7]
        if start_point[0] <= x <= end_point[0]:
            segment_start_index = i
            break

    # If a segment was found, try to find y value for x within that segment
    if segment_start_index is not None:
        segment = curve[segment_start_index:segment_start_index + 8]
        for attempts in range(10):
            tweak = 0.0001 * attempts
            t = get_t_at_x(segment, x - tweak if x >= 1 else x + tweak)
            if t is None:
                t = get_t_at_x_alternative(segment, x - tweak if x >= 1 else x + tweak)
            if t is None:
                continue
            point = get_point_on_curve_at_t(segment, t)
            y = 0 if abs(point[1]) < 1e-15 else point[1]
            return to_external_coordinate(y, curve)

    raise ValueError('Failed to find y for x on curve')


def query_encoded_curve(encoded_chain: str, scaled_x: float) -> float:
    """
    Finds the y value for a given x value along a cubic Bezier curve.
    Curve is encoded in a string format.
    
    :param encoded_chain: The encoded cubic Bezier curve.
    :type encoded_chain: str
    :param scaled_x: The x value for which we will find the associated y value along the curve.
    :type scaled_x: float
    :return: The y value for the given x value along the curve.
    :rtype: float
    """
    decoded_chain = decode(encoded_chain)
    return query_curve(decoded_chain, scaled_x)


def get_encoded_curve_query_function(encoded_chain: str): # -> Callable[[float], float]:
    """
    Returns a function that can be used to query a cubic Bezier curve.
    
    :param encoded_chain: The encoded cubic Bezier curve.
    :type encoded_chain: str
    :return: The query function.
    :rtype: Callable[[float], float]
    """
    decoded_chain = decode(encoded_chain)
    return lambda scaled_x: query_curve(decoded_chain, scaled_x)
