def solution(s):
    def iter_factors(n):
        """
        Returns a list of the factors of `n`
        """
        # Could do this faster
        for i in range(1, n // 2 + 1):
            if n % i == 0:
                yield i
        yield n

    def iter_partitions(s, partition_len, offset = 0):
        """
        Given a (circular) input string `s`, yield substrings of `s` of given length `partition_len`
        beginning at offset.
        """
        if not (0 <= offset < partition_len):
            raise IndexError('Offset must be in range [0, {partition_len})'.format(partition_len=partition_len))
        for i in range(len(s) // partition_len):
            start = partition_len * i + offset
            end = partition_len * (i + 1) + offset
            if end < len(s):
                yield s[start:end]
            else:
                yield (s[start:] + s[0:end - len(s)])


    def get_offset_of_equal_partitions(s, partition_len):
        """
        Given an input `s`, (circularly) partition the input into substrings of length `partition_len`
        and, if all the partitions at a particular offset are equal, return said offset.

        Otherwise, return `None`
        """
        def is_all_offset_partitions_equal(offset):
            partitions = list(iter_partitions(s, partition_len, offset))
            return all(p == partitions[0] for p in partitions)

        for offset in range(partition_len):
            if is_all_offset_partitions_equal(offset):
                return offset

        return None

    for factor in iter_factors(len(s)):
        offset = get_offset_of_equal_partitions(s, factor)
        if offset is not None:
            return len(s) // factor
    raise RuntimeError('len(s) should always be an equal partition length for s')