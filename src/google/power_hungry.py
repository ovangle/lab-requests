def solution(xs):
    def prod(iterable):
        from operator import mul
        return reduce(mul, iterable, 1)

    xs = [x for x in xs if x != 0]
    if not xs:
        return str(0)

    positive_xs = [x for x in xs if x > 0]
    negative_xs = [x for x in xs if x < 0]

    positive_prod = prod(positive_xs)
    negative_prod = prod(negative_xs)
    if negative_prod < 0:
        negative_prod //= max(negative_xs)

    return str(positive_prod * negative_prod)

def solution(xs):
    def prod(iterable):
        from operator import mul
        return reduce(mul, iterable, 1)

    xs = [x for x in xs if x != 0]
    if not xs:
        return 0

    positive_xs = [x for x in xs if x > 0]
    negative_xs = [x for x in xs if x < 0]
    print('negatives', negative_xs)

    positive_prod = prod(positive_xs)
    negative_prod = prod(negative_xs)
    ## If there are an odd number of negative values
    ## then dividing the total product by the maximum negative
    ## value is the same as removing it from the original product
    if negative_prod < 0:
        negative_prod //= max(negative_xs)

    return str(positive_prod * negative_prod)

def solution(xs):
    def prod(iterable):
        from operator import mul
        return reduce(mul, iterable, 1)

    xs = [x for x in xs if x != 0]
    if not xs:
        return '0'

    positive_xs = [x for x in xs if x > 0]
    negative_xs = [x for x in xs if x < 0]

    positive_prod = prod(positive_xs)

    if len(negative_xs) == 1 and not positive_xs:
        return str(negative_xs[0])
    negative_prod = prod(negative_xs)
    if negative_prod < 0:
        negative_prod //= max(negative_xs)

    return str(abs(positive_prod * negative_prod))