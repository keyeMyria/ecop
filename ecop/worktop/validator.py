import re

__ikeaOrderId__ = re.compile(r'^([1-9]|SAMS)\d{8}$', flags=re.I)


def isIkeaOrderId(value):
    return bool(__ikeaOrderId__.match(value))
