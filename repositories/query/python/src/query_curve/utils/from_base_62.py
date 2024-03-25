BASE_62_CHAR_SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

def from_base_62(str: str) -> int:
    """
    Convert a base62 string to a number.

    :param s: The base62 string to convert.
    :type s: str
    :return: The number representation of the base62 string.
    :rtype: int
    """
    return sum(BASE_62_CHAR_SET.index(curr) * (62 ** i) for i, curr in enumerate(reversed(str)))
