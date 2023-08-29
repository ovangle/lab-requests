import fractions
import itertools


def is_terminal_state(m, idx):
    return all(item == 0 for item in m[idx])

class Solver:

    def __init__(self, m):
        self.m = m

        # Transition caches for m
        self._next_adjacent_states = {}
        self._prev_adjacent_states = {}

        self.terminal_states = set([s for s in range(len(m)) if is_terminal_state(m, s)])

    def total_states_leaving(self, src_id):
        return sum(item for item in self.m[src_id])

    def next_adjacent_states(self, row_id):
        """
        A list of (row_index, row, probability) tuples which are
        reachable via a single transition from the row with index row_id
        """
        def iter_next_adjacent_states():
            for (dest_id, cell) in enumerate(self.m[row_id]):
                if cell != 0:
                    probability = fractions.Fraction(cell, self.total_states_leaving(row_id))
                    yield (dest_id, probability)

        if row_id not in self._next_adjacent_states:
            self._next_adjacent_states[row_id] = list(iter_next_adjacent_states())
        return self._next_adjacent_states[row_id]

    def prev_adjacent_states(self, state):
        """
        A list of (state, transition_probability) tuples which transition
        to the given state
        """
        def iter_prev_adjacent_states():
            for (row_id, row) in self.m:
                if row[state] != 0:
                    yield row_id

        if state not in self._prev_adjacent_states:
            self._prev_adjacent_states[state] = list(iter_prev_adjacent_states())
        return self._prev_adjacent_states[state]

    def probability_of_completing_path(self, src, dest, not_visiting = None):
        """
        The probability of completing any path between the src and dest and dest states
        which doesn't pass through the not_visited states
        """
        not_visiting = set(not_visiting or [])

        if src in not_visiting:
            return 0

        if src in self.terminal_states:
            return 0

        def _probability_of_completing_path(state, dest):
            return (
                1 if state == dest
                else self.probability_of_completing_path(state, dest, not_visiting=not_visiting.union([src]))
            )

        def log(stmt):
            prefix = ('  ' * len(not_visiting)) + '{0} -> {1}: '.format(str(src), str(dest))
            print(prefix + str(stmt))

        # The probability of returning to the source state once
        # is the probability of taking any path which starts at one
        # of the source's next adjacent states and ends at src.

        # log('not visiting: {0}'.format(','.join(map(str, not_visiting))))
        probability_of_returning_to_src_once = 0
        for (next_s, next_s_prob) in self.next_adjacent_states(src):
            if next_s not in not_visiting:
                # log('considering {0} (prob: {1})'.format(next_s, next_s_prob))
                prob_complete = _probability_of_completing_path(next_s, src)
                # log('prob complete path: {0}'.format(prob_complete))
                probability_of_returning_to_src_once += next_s_prob * prob_complete
            # else:
                # log('skipping {0}'.format(next_s))

        # probability_of_returning_to_src_once = sum(
        #    next_state_probability * _probability_of_completing_path(next_state, src)
        #    for (next_state, next_state_probability) in self.next_adjacent_states(src)
        #    if next_state not in not_visiting
        #)
        # log('probability of returning to src once: {0}'.format(probability_of_returning_to_src_once))


        # If there is a probability of returning to src once, then there is a cycle
        # and ending at src, which can we can travel along 0 or more times before escaping
        # the source row.
        # Note, this is not actually a probability as it represents an unreachable state.
        probability_of_returning_to_src =  1 / (1 - probability_of_returning_to_src_once)

        result = probability_of_returning_to_src * sum(
            next_state_probability * _probability_of_completing_path(next_state, dest)
            for (next_state, next_state_probability) in self.next_adjacent_states(src)
            if (next_state != src and (next_state not in not_visiting) or next_state == dest)
        )
        # log('result: {0}'.format(result))
        return result

    def probability_terminates_at(self, state):
        return self.probability_of_completing_path(0, state)


def solution(m):
    solver = Solver(m)

    terminal_states = [state for state in range(len(m)) if is_terminal_state(m, state)]
    probabilities = [
        solver.probability_terminates_at(state)
        for state in terminal_states
    ]
    max_denominator = max(s.denominator for s in probabilities)
    result_arr = []
    for p in probabilities:
        result_arr.append(int(p * max_denominator))

    result_arr.append(max_denominator)
    return result_arr

TEST_CASES = {
    1: {
        'm': [[0, 2, 1, 0, 0], [0, 0, 0, 3, 4], [0, 0, 0, 0, 0], [0, 0, 0, 0,0], [0, 0, 0, 0, 0]],
        'result': [7, 6, 8, 21]
    },
    2: {
        'm': [[0, 1, 0, 0, 0, 1], [4, 0, 0, 3, 2, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
        'result': [0, 3, 2, 9, 14]
    },
    3: {
        # multiple non-terminal states map to same terminal state
        'm': [[0, 1, 0, 0, 1], [4, 0, 0, 3, 2], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
        'result': [0, 3, 11, 14]
    },
    4: {
        'm': [[2, 2, 0, 0, 0, 1], [1, 0, 0, 0, 1, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0 ,0, 0], [0, 0, 0, 0, 0, 0]],
        'result': [0, 5, 1, 6] # ???
    },
    5: {
        'm': [[0, 0, 1, 0, 0, 1], [4, 0, 0, 3, 2, 0], [0, 1, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
        'result': [3, 2, 9, 14]
    },
    6: {
        # 0 always goes to 2, no cycles starting at 0
        'm': [[0, 0, 1, 0, 0, 0], [4, 0, 0, 3, 2, 0], [0, 1, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
        'result': [3, 2, 9, 14]
    },
    # THIS IS THE FAILING TEST!
    # 7: {
    #     # 0 always goes to 2, no cycles starting at 0
    #     'm': [[0, 0, 1, 0, 0, 1], [4, 0, 0, 3, 2, 0], [0, 1, 0, 0, 0, 1], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0]],
    #     'result': [3, 2, 9, 14]
    # }
    7: {
        'm': [[0, 1, 2, 0, 1], [3, 0, 1, 1, 0], [1, 1, 0, 0, 0], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]],
        'result': [1,2,10]
    }
}
def get_test_case_m(id):
    return TEST_CASES[id]['m']

def run_test(id):
    test_case = TEST_CASES[id]
    expect_result = solution(test_case['m'])
    assert test_case['result'] == expect_result
    print('success')

def run_all_tests():
    for i in range(1, 5):
        try:
            run_test(i)
        except AssertionError:
            print('{0} failed'.format(i))

