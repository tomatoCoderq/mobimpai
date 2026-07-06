import math
from dataclasses import dataclass
from typing import Dict, Iterable, List, Optional, Tuple


@dataclass(frozen=True)
class Node:
    x: int
    y: int


def build_grid(
    start: Tuple[float, float], end: Tuple[float, float], size: int
) -> Tuple[List[float], List[float]]:
    min_lng = min(start[0], end[0])
    max_lng = max(start[0], end[0])
    min_lat = min(start[1], end[1])
    max_lat = max(start[1], end[1])
    pad_lng = (max_lng - min_lng) * 0.15 or 0.001
    pad_lat = (max_lat - min_lat) * 0.15 or 0.001
    min_lng -= pad_lng
    max_lng += pad_lng
    min_lat -= pad_lat
    max_lat += pad_lat

    lngs = [min_lng + i * (max_lng - min_lng) / (size - 1) for i in range(size)]
    lats = [min_lat + i * (max_lat - min_lat) / (size - 1) for i in range(size)]
    return lngs, lats


def neighbors(node: Node, size: int) -> Iterable[Node]:
    for dx in (-1, 0, 1):
        for dy in (-1, 0, 1):
            if dx == 0 and dy == 0:
                continue
            nx = node.x + dx
            ny = node.y + dy
            if 0 <= nx < size and 0 <= ny < size:
                yield Node(nx, ny)


def heuristic(a: Node, b: Node) -> float:
    return math.hypot(a.x - b.x, a.y - b.y)


def nearest_index(value: float, values: List[float]) -> int:
    return min(range(len(values)), key=lambda i: abs(values[i] - value))


def astar(
    start: Node,
    goal: Node,
    size: int,
    passability: Dict[Node, float],
) -> List[Node]:
    open_set = {start}
    came_from: Dict[Node, Optional[Node]] = {start: None}
    g_score: Dict[Node, float] = {start: 0.0}
    f_score: Dict[Node, float] = {start: heuristic(start, goal)}

    while open_set:
        current = min(open_set, key=lambda n: f_score.get(n, float("inf")))
        if current == goal:
            path = []
            while current is not None:
                path.append(current)
                current = came_from[current]
            return list(reversed(path))

        open_set.remove(current)
        for neighbor in neighbors(current, size):
            score = passability.get(neighbor, 0.0)
            if score <= 0.05:
                continue
            step_cost = 1.0 / max(score, 0.05)
            tentative_g = g_score[current] + step_cost
            if tentative_g < g_score.get(neighbor, float("inf")):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                open_set.add(neighbor)

    return []
