from re import findall
from .from_base_62 import from_base_62

ENCODING_SCALE_FACTOR = 10 ** 7 # Allows for most use of 4 base62 characters

def decode(chain: str) -> list[float]:
    """
    Decode an encoded scaled Bezier chain.

    :param chain: The encoded chain.
    :type chain: str
    :return: The decoded chain.
    :rtype: list[float]
    """
    # Add a leading '-' to the chain so every value begins with '-' or '--'.
    chain = '-' + chain
    # Find all matches that start with '--' or '-' followed by alphanumeric characters.
    matches = [match for match in findall(r'--?[0-9A-Za-z]+', chain)] or []
    
    decoded_chain = []
    for link in matches:
        is_negative = link.startswith('--')  # Check if the value is negative.
        # Remove '-' or '--' prefix and convert from base62.
        transformed = from_base_62(link.lstrip('-'))
        # Apply negative sign if needed and scale.
        decoded_value = (-transformed if is_negative else transformed) / ENCODING_SCALE_FACTOR
        decoded_chain.append(decoded_value)
    
    return decoded_chain
