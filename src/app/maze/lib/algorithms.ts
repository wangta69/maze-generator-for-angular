import {forEachContiguousPair} from './utils';
import {Cell, Grid} from './maze';
import {
  ALGORITHM_NONE, ALGORITHM_BINARY_TREE, ALGORITHM_SIDEWINDER, ALGORITHM_ALDOUS_BRODER, ALGORITHM_WILSON, ALGORITHM_HUNT_AND_KILL,
  ALGORITHM_RECURSIVE_BACKTRACK, ALGORITHM_KRUSKAL, ALGORITHM_SIMPLIFIED_PRIMS, ALGORITHM_TRUE_PRIMS, ALGORITHM_ELLERS,
  METADATA_VISITED, METADATA_SET_ID, METADATA_CURRENT_CELL, METADATA_UNPROCESSED_CELL, METADATA_COST,
  DIRECTION_EAST, DIRECTION_SOUTH,
  SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE
} from './constants';

function markAsVisited(cell: Cell) {
  cell.metadata[METADATA_VISITED] = true;
}

function isVisited(cell: Cell) {
  return cell.metadata[METADATA_VISITED];
}

function isUnvisited(cell: Cell) {
  return !isVisited(cell);
}

function algorithmProgress(grid: Grid) {
  let previousCells: any[];

  grid.forEachCell((cell: Cell) => cell.metadata[METADATA_UNPROCESSED_CELL] = true);

  return {
    step(...cells: Cell[]) {
      this.current(...cells);
      cells.forEach((cell: Cell) => delete cell.metadata[METADATA_UNPROCESSED_CELL]);
    },
    current(...cells: Cell[]) {
      (previousCells || []).forEach((previousCell: any) => delete previousCell.metadata[METADATA_CURRENT_CELL]);
      cells.forEach((cell: Cell) => cell.metadata[METADATA_CURRENT_CELL] = true);
      previousCells = cells;
    },
    finished() {
      (previousCells || []).forEach(previousCell => delete previousCell.metadata[METADATA_CURRENT_CELL]);
    }
  };
}

export const algorithms = {
  [ALGORITHM_NONE]: {
    metadata: {
      'description': 'Grid',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: Grid, config: any) {}
  },
  [ALGORITHM_BINARY_TREE]: {
    metadata: {
      'description': 'Binary Tree',
      'maskable': false,
      'shapes': [SHAPE_SQUARE]
    },
    fn: function*(grid: Grid, config: any) {
      const {random} = config;
      const allCoords = grid.getAllCellCoords();
      const progress = algorithmProgress(grid);

      for (let i = 0; i < allCoords.length; i++) {
          const
              cell = grid.getCellByCoordinates(allCoords[i]),
              eastNeighbour = cell.neighbours[DIRECTION_EAST],
              southNeighbour = cell.neighbours[DIRECTION_SOUTH],
              goEast = random.int(2) === 0,
              goSouth = !goEast,
              linkEast = eastNeighbour && (goEast || !southNeighbour),
              linkSouth = southNeighbour && (goSouth || !eastNeighbour);

          if (linkEast) {
              grid.link(cell, eastNeighbour);

          } else if (linkSouth) {
              grid.link(cell, southNeighbour);
          }
          progress.step(cell);
          yield;
      }
      progress.finished();
    }
  },
  [ALGORITHM_SIDEWINDER]: {
    metadata: {
      'description': 'Sidewinder',
      'maskable': false,
      'shapes': [SHAPE_SQUARE]
    },
    fn: function*(grid: any, config: any) {
      const {random} = config;
      const progress = algorithmProgress(grid);

      for (let y = 0; y < grid.metadata.height; y++) {
        let currentRun = [];
        for (let x = 0; x < grid.metadata.width; x++) {
          const cell = grid.getCellByCoordinates(x, y);
          const eastNeighbour = cell.neighbours[DIRECTION_EAST];
          const southNeighbour = cell.neighbours[DIRECTION_SOUTH];
          const goEast = eastNeighbour && (random.int(2) === 0 || !southNeighbour);

          currentRun.push(cell);
          if (goEast) {
            grid.link(cell, eastNeighbour);

          } else if (southNeighbour) {
            const randomCellFromRun = random.choice(currentRun);
            const southNeighbourOfRandomCell = randomCellFromRun.neighbours[DIRECTION_SOUTH];

            grid.link(randomCellFromRun, southNeighbourOfRandomCell);

            currentRun = [];
          }

          progress.step(cell);
          yield;
        }
      }
      progress.finished();
    }
  },
  [ALGORITHM_ALDOUS_BRODER]: {
    metadata: {
      'description': 'Aldous Broder',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: Grid, config: any) {
      const progress = algorithmProgress(grid);
      let unvisitedCount = grid.cellCount;
      let currentCell!: Cell;

      function moveTo(nextCell: any) {
        if (isUnvisited(nextCell)) {
          unvisitedCount--;
          markAsVisited(nextCell);
          if (currentCell) {
            grid.link(currentCell, nextCell);
          }
        }
        progress.step(currentCell = nextCell);
      }

      const startCell = grid.randomCell();
      moveTo(startCell);

      while (unvisitedCount) {
        const nextCell = currentCell.neighbours.random();
        yield;

        moveTo(nextCell);
      }
        progress.finished();
    }
  },
  [ALGORITHM_WILSON]: {
    metadata: {
      'description': 'Wilson',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: any, config: any) {
      const progress = algorithmProgress(grid);

      function markVisited(cell: Cell) {
        progress.step(cell);
        cell.metadata[METADATA_VISITED] = true;
      }
      function removeLoops(cells: Cell[]) {
        const latestCell = cells[cells.length - 1];
        const indexOfPreviousVisit = cells.findIndex((cell: Cell) => cell === latestCell);
        if (indexOfPreviousVisit >= 0) {
          cells.splice(indexOfPreviousVisit + 1);
        }
      }

      markVisited(grid.randomCell(isUnvisited));

      let currentCell;
      while (currentCell = grid.randomCell(isUnvisited)) {
        let currentPath = [currentCell];

        while (true) {
          const nextCell: Cell = currentCell.neighbours.random();
          currentPath.push(nextCell);
          progress.current(nextCell);

          if (isUnvisited(nextCell)) {
            removeLoops(currentPath);
            currentCell = nextCell;
          } else {
            forEachContiguousPair(currentPath, grid.link);
            currentPath.forEach(markVisited);
            break;
          }
          yield;
        }
      }
      progress.finished();
    }
  },
  [ALGORITHM_HUNT_AND_KILL]: {
    metadata: {
      'description': 'Hunt and Kill',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: any, config: any) {
      const progress = algorithmProgress(grid);

      let currentCell = grid.randomCell();

      progress.step(currentCell);
      markAsVisited(currentCell);

      while (true) {
        const nextCell = currentCell.neighbours.random(isUnvisited);
        if (nextCell) {
          markAsVisited(nextCell);
          grid.link(currentCell, nextCell);
          currentCell = nextCell;
        } else {
          const unvisitedCellWithVisitedNeighbours = grid.randomCell((cell: Cell) => isUnvisited(cell) && cell.neighbours.random(isVisited));
          if (unvisitedCellWithVisitedNeighbours) {
            const visitedNeighbour = unvisitedCellWithVisitedNeighbours.neighbours.random(isVisited);
            markAsVisited(unvisitedCellWithVisitedNeighbours);
            grid.link(unvisitedCellWithVisitedNeighbours, visitedNeighbour);
            currentCell = unvisitedCellWithVisitedNeighbours;
          } else {
            break;
          }
        }
        progress.step(currentCell);
        yield;
      }
      progress.finished();
    }
  },
  [ALGORITHM_RECURSIVE_BACKTRACK]: {
    metadata: {
      'description': 'Recursive Backtrack',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: any) {
      const stack: any[] = []
      const progress = algorithmProgress(grid);
      let currentCell: any;

      function visitCell(nextCell: any) {
        const previousCell = currentCell;
        currentCell = nextCell;
        markAsVisited(currentCell);
        if (previousCell) {
            grid.link(currentCell, previousCell);
        }
        stack.push(currentCell);
      }

      const startCell = grid.randomCell();
      visitCell(startCell);
      progress.step(startCell);

      while (stack.length) {
        const nextCell = currentCell.neighbours.random(isUnvisited);
        if (nextCell) {
          visitCell(nextCell);

        } else {
          while (!currentCell.neighbours.random(isUnvisited)) {
            stack.pop();
            if (!stack.length) {
              break;
            }
            currentCell = stack[stack.length - 1];
          }
        }
        progress.step(currentCell);
        yield;
      }
      progress.finished();
    }
  },
  [ALGORITHM_KRUSKAL]: {
    metadata: {
      'description': 'Kruskal',
      'maskable': true,
      'shapes': [SHAPE_SQUARE]
    },
    fn: function*(grid: any, config: any) {
      const {random} = config;
      const links: any[] = [];
      const connectedSets:any = [];
      const progress = algorithmProgress(grid);

      grid.forEachCell((cell: Cell) => {
        
        const eastNeighbour = cell.neighbours[DIRECTION_EAST];
        const southNeighbour = cell.neighbours[DIRECTION_SOUTH];

        if (eastNeighbour) {
          links.push([cell, eastNeighbour]);
        }
        if (southNeighbour) {
          links.push([cell, southNeighbour]);
        }
        cell.metadata[METADATA_SET_ID] = cell.id;
        connectedSets[cell.id] = [cell];
      });

      random.shuffle(links);

      function mergeSets(id1: any, id2: any) {
        connectedSets[id2].forEach((cell: Cell) => {
          cell.metadata[METADATA_SET_ID] = id1;
          connectedSets[id1].push(cell);
        });
        delete connectedSets[id2];
      }

      while (links.length) {
        const [cell1, cell2] = links.pop();
        const id1 = cell1.metadata[METADATA_SET_ID];
        const id2 = cell2.metadata[METADATA_SET_ID];
        if (id1 !== id2) {
          grid.link(cell1, cell2);
          mergeSets(id1, id2);
          progress.step(cell1, cell2);
          yield;
        }
      }
      progress.finished();
    }
  },
  [ALGORITHM_SIMPLIFIED_PRIMS]: {
    metadata: {
      'description': 'Simplified Prims',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: any, config: any) {
      function addToActive(cell: Cell) {
        active.push(cell);
        cell.metadata[METADATA_VISITED] = true;
        progress.step(cell);
      }
      const {random} = config;
      const progress = algorithmProgress(grid);
      const active: any[] = [];

      addToActive(grid.randomCell());

      while (active.length) {
        const randomActiveCell = random.choice(active),
          randomInactiveNeighbour = randomActiveCell.neighbours.random(isUnvisited);
        if (!randomInactiveNeighbour) {
          const indexOfRandomActiveCell = active.indexOf(randomActiveCell);
          console.assert(indexOfRandomActiveCell > -1);
          active.splice(indexOfRandomActiveCell, 1);
        } else {
          grid.link(randomActiveCell, randomInactiveNeighbour);
          addToActive(randomInactiveNeighbour);
          yield;
        }
      }
      progress.finished();

    }
  },
  [ALGORITHM_TRUE_PRIMS]: {
    metadata: {
      'description': 'True Prims',
      'maskable': true,
      'shapes': [SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE]
    },
    fn: function*(grid: any, config: any) {
      function addToActive(cell: Cell) {
        active.push(cell);
        cell.metadata[METADATA_VISITED] = true;
        progress.step(cell);
      }

      function getCellWithLowestCost(cells: Cell[]) {
        return cells.sort((n1: any, n2: any) => n1.metadata[METADATA_COST] - n2.metadata[METADATA_COST])[0]
      }

      const {random} = config;
      const progress = algorithmProgress(grid);
      const active: any[] = [];

      grid.forEachCell((cell: Cell) => {
        cell.metadata[METADATA_COST] = random.int(grid.cellCount);
      });

      addToActive(grid.randomCell());

      while (active.length) {
        const randomActiveCell = getCellWithLowestCost(active);
        const inactiveNeighbours = randomActiveCell.neighbours.toArray().filter(isUnvisited);

        if (!inactiveNeighbours.length) {
          const indexOfRandomActiveCell = active.indexOf(randomActiveCell);
          console.assert(indexOfRandomActiveCell > -1);
          active.splice(indexOfRandomActiveCell, 1);
        } else {
          const inactiveNeighbourWithLowestCost = getCellWithLowestCost(inactiveNeighbours);
          grid.link(randomActiveCell, inactiveNeighbourWithLowestCost);
          addToActive(inactiveNeighbourWithLowestCost);
          yield;
        }
      }

      progress.finished();
    }
  },
  [ALGORITHM_ELLERS]: {
    metadata: {
      'description': 'Ellers',
      'maskable': false,
      'shapes': [SHAPE_SQUARE]
    },
    fn: function*(grid: Grid, config: any) {
      const ODDS_OF_MERGE = 2;
      const ODDS_OF_LINK_BELOW = 5;
      const sets: any = {};
      const {random} = config;
      const {width, height} = grid.metadata;
      let nextSetId = 1;

      function addCellToSet(setId: number, cell: Cell) {
        cell.metadata[METADATA_SET_ID] = setId;
        if (!sets[setId]) {
          sets[setId] = [];
        }
        sets[setId].push(cell);
      }

      function mergeSets(setId1: number, setId2: number) {
        const set1 = sets[setId1];
        const set2 = sets[setId2];
        console.assert(set1.length && set2.length);
        set2.forEach((cell: Cell) => addCellToSet(setId1, cell));
        delete sets[setId2];
      }

      function linkToCellBelow(cell: Cell) {
        const [x,y] = cell.coords;
        const cellBelow = grid.getCellByCoordinates(x, y+1);
        grid.link(cell, cellBelow);
        addCellToSet(cell.metadata[METADATA_SET_ID], cellBelow);
      }

      function mergeCellsInRow(y: number, oddsOfMerge=1) {
        for(let i=0; i<width-1; i++) {
          const cell1 = grid.getCellByCoordinates(i, y);
          const cell2 = grid.getCellByCoordinates(i+1, y);
          const cell1SetId = cell1.metadata[METADATA_SET_ID];
          const cell2SetId = cell2.metadata[METADATA_SET_ID];

          if (cell1SetId !== cell2SetId && random.int(oddsOfMerge) === 0) {
            grid.link(cell1, cell2);
            mergeSets(cell1.metadata[METADATA_SET_ID], cell2.metadata[METADATA_SET_ID]);
          }
        }
      }

      for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
          const cell = grid.getCellByCoordinates(x, y);
          if (!cell.metadata[METADATA_SET_ID]) {
            addCellToSet(nextSetId++, cell);
          }
          row.push(cell);
        }

        const isLastRow = y === height - 1;
        if (isLastRow) {
          mergeCellsInRow(y);
        } else {
          mergeCellsInRow(y, ODDS_OF_MERGE);

          const cellsInRowBySet: any = {};
          row.forEach(cell => {
            const setId = cell.metadata[METADATA_SET_ID];
            if (!cellsInRowBySet[setId]) {
              cellsInRowBySet[setId] = [];
            }
            cellsInRowBySet[setId].push(cell);
          });

          Object.keys(cellsInRowBySet).forEach(setId => {
            random.shuffle(cellsInRowBySet[setId]).forEach((cell: Cell, i: number) => {
              if (i === 0) {
                linkToCellBelow(cell);
              } else if (random.int(ODDS_OF_LINK_BELOW) === 0) {
                linkToCellBelow(cell);
              }
            });
          });
        }
      }
      grid.clearMetadata(METADATA_SET_ID);
      return grid;
    }
  }
};



