

def solution(src, dest):
    def as_coords(square_index):
        col = square_index // 8
        row = square_index % 8
        return (col, row)

    if src == dest:
        return 0

    src_coord, dest_coord = (as_coords(src), as_coords(dest))
    for move_count, reachable_coord in iter_reachable_coords(src_coord):
        print(move_count, reachable_coord)
        if reachable_coord == dest_coord:
            return move_count
    raise RuntimeError()

def iter_coords_reachable_in_one_move(coord):
    def iter_coords_reachable_in_one_move(coord):
        x, y = coord
        for move_x in (-2, 2):
            for move_y in (-1, 1):
                yield (x + move_x, y + move_y)
        for move_x in (-1, 1):
            for move_y in (-2, 2):
                yield (x + move_x, y + move_y)
    return (
        (x, y) for (x, y) in
        iter_coords_reachable_in_one_move(coord)
        if 0 <= x < 8 and 0 <= y < 8
    )

def coords_reachable_in_one_move(src):
    return list(iter_coords_reachable_in_one_move(src))

def iter_reachable_coords(src, move_count = 1, _seen = None):
    srcs = [src] if not isinstance(src, (list, set)) else src

    if not srcs:
        return

    _seen = set(_seen or []).union(set(srcs))
    next_srcs = set()

    for src in srcs:
        for coord in iter_coords_reachable_in_one_move(src):
            if coord in _seen:
                continue
            next_srcs.add(coord)
            yield (move_count, coord)
    for (in_move_count, dest) in (
        iter_reachable_coords(next_srcs, move_count + 1, _seen)
    ):
        yield (in_move_count, dest)

def reachable_coords(src):
    return list(iter_reachable_coords(src))
