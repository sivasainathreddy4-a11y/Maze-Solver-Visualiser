// Maze Solver & Algorithm Visualizer
// - 20x20 clickable grid
// - Walls toggle on click
// - BFS (queue) and DFS (stack) visualizations

const ROWS = 20;
const COLS = 20;

// Animation speed (milliseconds per step)
const VISIT_DELAY = 18;
const PATH_DELAY = 30;

const gridEl = document.getElementById("grid");
const statusEl = document.getElementById("status");

const generateBtn = document.getElementById("generateBtn");
const bfsBtn = document.getElementById("bfsBtn");
const dfsBtn = document.getElementById("dfsBtn");
const resetBtn = document.getElementById("resetBtn");

// Each cell object: { row, col, isWall, el }
let cells = [];
let isAnimating = false;
let activeTimeouts = [];
let speed;
let isMouseDown = false;
window.onload = () => {
  speed=document.getElementById("speed");
};
document.addEventListener("mousedown", () => {
  isMouseDown = true;
});

document.addEventListener("mouseup", () => {
  isMouseDown = false;
});
function setStatus(text) {
  statusEl.textContent = text;
}

function keyOf(r, c) {
  return `${r},${c}`;
}

function isStart(r, c) {
  return r === 0 && c === 0;
}

function isEnd(r, c) {
  return r === ROWS - 1 && c === COLS - 1;
}

function setButtonsEnabled(enabled) {
  generateBtn.disabled = !enabled;
  bfsBtn.disabled = !enabled;
  dfsBtn.disabled = !enabled;
  resetBtn.disabled = !enabled;
  if(speed){
    speed.disabled=!enabled;
  }
}

function clearAllTimeouts() {
  for (const id of activeTimeouts) clearTimeout(id);
  activeTimeouts = [];
}

function clearSearchColors() {
  // Remove only "visited" and "path" classes (keep walls/start/end).
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const el = cells[r][c].el;
      el.classList.remove("visited", "path");
    }
  }
}

function buildGrid() {
  // Reset state
  clearAllTimeouts();
  isAnimating = false;
  setButtonsEnabled(true);
  setStatus("Ready.");

  gridEl.innerHTML = "";
  cells = Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) => {
      const cellEl = document.createElement("div");
      cellEl.className = "cell";
      cellEl.dataset.row = String(r);
      cellEl.dataset.col = String(c);

      // Mark start/end
      if (isStart(r, c)) cellEl.classList.add("start");
      if (isEnd(r, c)) cellEl.classList.add("end");

      // Click to toggle wall
      cellEl.addEventListener("click", () => {
        if (isAnimating) return;
        if (isStart(r, c) || isEnd(r, c)) return;

        const cell = cells[r][c];

        cell.isWall = !cell.isWall;
        cellEl.classList.toggle("wall", cell.isWall);

        // Clear previous algorithm coloring if user edits walls
        cellEl.classList.remove("visited", "path");
        setStatus("Edited walls.");
      });
      cellEl.addEventListener("mouseover", () => {
        if (!isMouseDown) return;
        if (isAnimating) return;
        if (isStart(r, c) || isEnd(r, c)) return;
      
        const cell = cells[r][c];
      
        cell.isWall = true;
        cellEl.classList.add("wall");
      
        cellEl.classList.remove("visited", "path");
      });

      gridEl.appendChild(cellEl);

      return { row: r, col: c, isWall: false, el: cellEl };
    })
  );
}

function resetGrid() {
  if (isAnimating) return;
  clearAllTimeouts();
  isAnimating = false;

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = cells[r][c];
      cell.isWall = false;
      cell.el.classList.remove("wall", "visited", "path");
    }
  }

  // Re-apply start/end classes (in case they were removed)
  cells[0][0].el.classList.add("start");
  cells[ROWS - 1][COLS - 1].el.classList.add("end");

  setStatus("Grid reset.");
}

function getNeighbors(r, c) {
  // 4-direction movement: up, down, left, right
  const candidates = [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];

  const result = [];
  for (const [nr, nc] of candidates) {
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
    result.push([nr, nc]);
  }
  return result;
}

function reconstructPath(parent, endKey) {
  // parent is a Map: childKey -> parentKey
  const path = [];
  let cur = endKey;
  while (cur) {
    path.push(cur);
    cur = parent.get(cur);
  }
  path.reverse();
  return path;
}
let lastBFSTime = null;
let lastDFSTime = null;

function updateTimeDisplay() {
  let text = "";

  if (lastBFSTime !== null) {
    text += "BFS: " + lastBFSTime + " ms  ";
  }

  if (lastDFSTime !== null) {
    text += "DFS: " + lastDFSTime + " ms";
  }

  document.getElementById("time").innerText = text;
}

function bfsSolve() {
  // Breadth-First Search finds the shortest path in an unweighted grid.
  clearSearchColors();
  let startTime = performance.now();

  const start = [0, 0];
  const end = [ROWS - 1, COLS - 1];

  const q = []; // queue of [r, c]
  let head = 0; // avoid O(n) shift()

  const visited = new Set();
  const parent = new Map();
  const order = []; // visited order for animation

  q.push(start);
  visited.add(keyOf(start[0], start[1]));

  while (head < q.length) {
    const [r, c] = q[head++];
    const curKey = keyOf(r, c);
    order.push(curKey);

    if (r === end[0] && c === end[1]) {
      let endTime = performance.now();
  let bfsTime = (endTime - startTime).toFixed(2);

  lastBFSTime = bfsTime;
  updateTimeDisplay();
      return { order, path: reconstructPath(parent, curKey) };
    }

    for (const [nr, nc] of getNeighbors(r, c)) {
      const nKey = keyOf(nr, nc);
      if (visited.has(nKey)) continue;
      if (cells[nr][nc].isWall) continue;

      visited.add(nKey);
      parent.set(nKey, curKey);
      q.push([nr, nc]);
    }
  }
  


  return { order, path: [] }; // no path
}

function dfsSolve() {
  // Depth-First Search explores deep paths first (does NOT guarantee shortest path).
  clearSearchColors();
  let startTime = performance.now();

  const start = [0, 0];
  const end = [ROWS - 1, COLS - 1];

  const stack = []; // stack of [r, c]
  const visited = new Set();
  const parent = new Map();
  const order = [];

  stack.push(start);
  visited.add(keyOf(start[0], start[1]));

  while (stack.length > 0) {
    const [r, c] = stack.pop();
    const curKey = keyOf(r, c);
    order.push(curKey);

    if (r === end[0] && c === end[1]) {
      let endTime = performance.now();
  let dfsTime = (endTime - startTime).toFixed(2);

  lastDFSTime = dfsTime;
  updateTimeDisplay();
      return { order, path: reconstructPath(parent, curKey) };
    }

    // Neighbor order affects how DFS looks; this order is easy to understand.
    // Push in reverse of the desired visiting order since stack is LIFO.
    const neighbors = getNeighbors(r, c);
    for (let i = neighbors.length - 1; i >= 0; i--) {
      const [nr, nc] = neighbors[i];
      const nKey = keyOf(nr, nc);
      if (visited.has(nKey)) continue;
      if (cells[nr][nc].isWall) continue;

      visited.add(nKey);
      parent.set(nKey, curKey);
      stack.push([nr, nc]);
    }
  }
  

  return { order, path: [] };
}

function animateResult(order, path) {
  isAnimating = true;
  setButtonsEnabled(false);

  // Always keep start/end colors visible
  const startKey = keyOf(0, 0);
  const endKey = keyOf(ROWS - 1, COLS - 1);

  const isSpecial = (k) => k === startKey || k === endKey;

  // 1) Animate visited cells (yellow)
  order.forEach((k, i) => {
    const id = setTimeout(() => {
      const [r, c] = k.split(",").map(Number);
      if (!isSpecial(k)) cells[r][c].el.classList.add("visited");
      if (i === order.length - 1) {
        // After visited animation ends, animate path
        animatePath(path);
      }
    }, i * VISIT_DELAY);
    activeTimeouts.push(id);
  });

  // Edge case: if there were no visited steps (shouldn't happen), still animate path
  if (order.length === 0) animatePath(path);
}

function animatePath(path) {
  const startKey = keyOf(0, 0);
  const endKey = keyOf(ROWS - 1, COLS - 1);
  const isSpecial = (k) => k === startKey || k === endKey;

  if (!path || path.length === 0) {
    const id = setTimeout(() => {
      isAnimating = false;
      setButtonsEnabled(true);
      setStatus("No path found.");
    }, 200);
    activeTimeouts.push(id);
    return;
  }

  path.forEach((k, i) => {
    const id = setTimeout(() => {
      const [r, c] = k.split(",").map(Number);
      if (!isSpecial(k)) cells[r][c].el.classList.add("path");

      if (i === path.length - 1) {
        isAnimating = false;
        setButtonsEnabled(true);
        setStatus(`Done. Path length: ${Math.max(0, path.length - 1)} steps.`);
      }
    }, i *(210-speed.value));
    activeTimeouts.push(id);
  });
}

function runSolver(type) {
  if (isAnimating) return;
  clearAllTimeouts();
  clearSearchColors();

  const label = type === "bfs" ? "BFS" : "DFS";
  setStatus(`Solving using ${label}...`);

  const result = type === "bfs" ? bfsSolve() : dfsSolve();

  // If the grid is completely blocked, you still get visited animation.
  animateResult(result.order, result.path);
}

// Wire up buttons
generateBtn.addEventListener("click", () => {
  buildGrid();
  setStatus("New grid generated.");
});

resetBtn.addEventListener("click", () => resetGrid());
bfsBtn.addEventListener("click", () => runSolver("bfs"));
dfsBtn.addEventListener("click", () => runSolver("dfs"));

// Create initial grid on load
buildGrid();

