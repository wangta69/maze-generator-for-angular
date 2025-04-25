export type Cell= { //TODO move methods outside so we only have 1 copy of each function
  id: string,
  coords: [number, number],
  metadata?: any,
  neighbours?: any,
  isLinkedTo?: any,
  links: any[]
}

export type Grid = {
  forEachCell: (fn: any) => void,
  getAllCellCoords: () =>  any[],
  link: (cell1: any, cell2: any) => void,
  metadata: any,
  randomCell: () => void,
  addCell: (...coords: any) => void,
  removeCell: (coords: any) => void,
  makeNeighbours: (direction1: any, direction2: any) => void,
  getCellByCoordinates: (...coords: number[]) => Cell,
  getClosestDirectionForClick?: (cell: Cell, ev: any) => string,
  cellCount: number,
  on: (eventName: string, handler: any) => void,
  findPathBetween: (fromCoords: any, toCoords: any) => void,
  findDistancesFrom: (coords: any) => void,
  clearDistances: () => void,
  clearPathAndSolution: () => void,
  clearMetadata: (...keys: any) => void,
  dispose: () => void,
  isSquare?:boolean,
  initialise?: () => void,
  render?: (surface: any) => void,
  placeExits?: () => void
}

import {Config} from '../config';
import {Maze} from './main';
import {buildEventTarget} from './utils';
import {
  METADATA_DISTANCE, METADATA_PATH, METADATA_MAX_DISTANCE, METADATA_MASKED, METADATA_CURRENT_CELL, METADATA_UNPROCESSED_CELL,
  METADATA_START_CELL, METADATA_END_CELL, METADATA_PLAYER_CURRENT, METADATA_PLAYER_VISITED, METADATA_RAW_COORDS,
  EVENT_CLICK,
  DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST, DIRECTION_WEST,
  DIRECTION_NORTH_WEST, DIRECTION_NORTH_EAST, DIRECTION_SOUTH_WEST, DIRECTION_SOUTH_EAST,
  DIRECTION_CLOCKWISE, DIRECTION_ANTICLOCKWISE,
  DIRECTION_INWARDS, DIRECTION_OUTWARDS,
  CELL_BACKGROUND_COLOUR, WALL_COLOUR, PATH_COLOUR, CELL_MASKED_COLOUR, CELL_CURRENT_CELL_COLOUR, CELL_UNPROCESSED_CELL_COLOUR,
  CELL_PLAYER_CURRENT_COLOUR, CELL_PLAYER_VISITED_COLOUR,
  EXITS_NONE, EXITS_HORIZONTAL, EXITS_VERTICAL, EXITS_HARDEST
} from './constants';

function getCellBackgroundColour(cell: Cell, grid: any) {
  const distance = cell.metadata[METADATA_DISTANCE];

  if (distance !== undefined) {
    return getDistanceColour(distance, grid.metadata[METADATA_MAX_DISTANCE]);

  } else if (cell.metadata[METADATA_MASKED]) {
    return CELL_MASKED_COLOUR;

  } else if (cell.metadata[METADATA_CURRENT_CELL]) {
    return CELL_CURRENT_CELL_COLOUR;
  } else if (cell.metadata[METADATA_UNPROCESSED_CELL]) {
    return CELL_UNPROCESSED_CELL_COLOUR;
  } else if (cell.metadata[METADATA_PLAYER_CURRENT]) {
    return CELL_PLAYER_CURRENT_COLOUR;
  } else if (cell.metadata[METADATA_PLAYER_VISITED]) {
    return CELL_PLAYER_VISITED_COLOUR;
  } else {
    return CELL_BACKGROUND_COLOUR;
  }
}

function findExitCells(grid: any) {
  const exitDetails: any = {};

  grid.forEachCell((cell: Cell) => {
    let direction: any = {};
    if (direction = cell.metadata[METADATA_START_CELL]) {
      exitDetails[METADATA_START_CELL] = [cell, direction];
    }
    if (direction = cell.metadata[METADATA_END_CELL]) {
      exitDetails[METADATA_END_CELL] = [cell, direction];
    }
  });

  if (exitDetails[METADATA_START_CELL] && exitDetails[METADATA_END_CELL]) {
    return exitDetails;
  }
}

const exitDirectionOffsets: any = {
  [DIRECTION_NORTH] : {x: 0, y:-1},
  [DIRECTION_SOUTH] : {x: 0, y: 1},
  [DIRECTION_EAST]  : {x: 1, y: 0},
  [DIRECTION_WEST]  : {x:-1, y: 0},
  [DIRECTION_NORTH_WEST]  : {x:-1, y: -1},
  [DIRECTION_NORTH_EAST]  : {x: 0, y: -1},
  [DIRECTION_SOUTH_WEST]  : {x:-1, y:  1},
  [DIRECTION_SOUTH_EAST]  : {x: 0, y:  1},
};

const eventTarget = buildEventTarget('maze');

function buildBaseGrid(config: Maze): Grid {
  const cells: any = {};
  const {random} = config;

  function makeIdFromCoords(coords: number[]) {
      return coords.join(',');
  }
  function buildCell(...coords: any) {
    const id = makeIdFromCoords(coords);
    const cell: Cell = { //TODO move methods outside so we only have 1 copy of each function
      id,
      coords,
      metadata: {},
      neighbours: {
        random(fnCriteria = () => true): any {
          return random.choice?.(this.toArray().filter(fnCriteria));
        },
        toArray(fnCriteria = () => true): any {
          return Object.values(this).filter(value => typeof value !== 'function').filter(fnCriteria);
        },
        linkedDirections() {
          return this.toArray().filter((neighbour: any) => neighbour.isLinkedTo(cell)).map(
            (linkedNeighbour: any) => Object.keys(this).find(direction => this[direction] === linkedNeighbour)
          );
        }
      },
      links: [],
      isLinkedTo(otherCell: never) {
        return (this.links as []).includes(otherCell);
      }
        
    };
    return cell;
  }

  function removeNeighbour(cell: Cell, neighbour: Cell) {
    const linkIndex = cell.links.indexOf(neighbour);
    if (linkIndex >= 0) {
      cell.links.splice(linkIndex, 1);
    }
    Object.keys(cell.neighbours).filter(key => cell.neighbours[key] === neighbour).forEach(key => delete cell.neighbours[key]);
  }

  function removeNeighbours(cell: Cell) {
    cell.neighbours.toArray().forEach((neighbour: Cell) => {
      removeNeighbour(cell, neighbour);
      removeNeighbour(neighbour, cell);
    });
  }

  return {
    forEachCell(fn: any) {
      Object.values(cells).forEach(fn);
    },
    getAllCellCoords() {
      // const allCoords: any[] = [];
      const allCoords: Array<[number, number]> = [];
      // const allCoords: [number, number][] = [];
      this.forEachCell((cell: Cell) => allCoords.push(cell.coords));
      return allCoords;
    },
    link(cell1: Cell, cell2: Cell) {
      console.assert(cell1 !== cell2);
      console.assert(Object.values(cell1.neighbours).includes(cell2));
      console.assert(!cell1.links.includes(cell2));
      console.assert(Object.values(cell2.neighbours).includes(cell1));
      console.assert(!cell2.links.includes(cell1));

      cell1.links.push(cell2);
      cell2.links.push(cell1);
    },
    metadata: config,
    randomCell(fnCriteria = () => true) {
        return random.choice?.(<string[]>Object.values(cells).filter(fnCriteria));
    },
    addCell(...coords: any) {
      const cell = buildCell(...coords);
      const id = cell.id;
      console.assert(!cells[id]);
      cells[id] = cell;
      return id;
    },
    removeCell(...coords: any) {
      const cell = <Cell>this.getCellByCoordinates(coords);
      removeNeighbours(cell);
      delete cells[cell.id];
    },
    makeNeighbours(cell1WithDirection: any, cell2WithDirection: any) {
      const cell1 = cell1WithDirection.cell;
      const cell1Direction = cell1WithDirection.direction;
      const cell2 = cell2WithDirection.cell;
      const cell2Direction = cell2WithDirection.direction;

      console.assert(cell1 !== cell2);
      console.assert(cell1Direction !== cell2Direction);
      console.assert(!cell1.neighbours[cell2Direction]);
      console.assert(!cell2.neighbours[cell1Direction]);
      cell1.neighbours[cell2Direction] = cell2;
      cell2.neighbours[cell1Direction] = cell1;
    },
    getCellByCoordinates(...coords: number[]) {
      const id = makeIdFromCoords(coords);
      return cells[id];
    },
    get cellCount() {
      return Object.values(cells).length;
    },
    on(eventName: string, handler: any) {
      eventTarget.on(eventName, handler);
    },
    findPathBetween(fromCoords: any, toCoords: [number]) {
      this.findDistancesFrom(...toCoords);
      let currentCell = this.getCellByCoordinates(...fromCoords);
      let endCell = this.getCellByCoordinates(...toCoords);

      const path = [];

      path.push(currentCell.coords);
      while(currentCell !== endCell) {
        const currentDistance = currentCell.metadata[METADATA_DISTANCE];
        const nextCell: any = Object.values(currentCell.neighbours)
          .filter(neighbour => currentCell.isLinkedTo(neighbour))
          .find((neighbour: any) => (neighbour.metadata || {})[METADATA_DISTANCE] === currentDistance - 1);
        path.push(nextCell.coords);
        currentCell = nextCell;
      }
      this.metadata[METADATA_PATH] = path;
      this.clearDistances();
    },
    findDistancesFrom(...coords: number[]) {
      this.clearDistances();
      const startCell: Cell = this.getCellByCoordinates(...coords);
      startCell.metadata[METADATA_DISTANCE] = 0;
      const frontier:Cell[] = [startCell];
      let maxDistance = 0, maxDistancePoint;
      while(frontier.length) {
        const next = <Cell>frontier.shift();
        const frontierDistance = next.metadata[METADATA_DISTANCE];
        const linkedUndistancedNeighbours:any[] = Object.values(next.neighbours)
          .filter(neighbour => next.isLinkedTo(neighbour))
          .filter((neighbour: any) => neighbour.metadata[METADATA_DISTANCE] === undefined);

        linkedUndistancedNeighbours.forEach((neighbour: Cell) => {
            neighbour.metadata[METADATA_DISTANCE] = frontierDistance + 1;
        });
        frontier.push(...linkedUndistancedNeighbours);
        if (linkedUndistancedNeighbours.length) {
          if (frontierDistance >= maxDistance) {
            maxDistancePoint = linkedUndistancedNeighbours[0];
          }
          maxDistance = Math.max(frontierDistance+1, maxDistance);
        }
      }
      this.metadata[METADATA_MAX_DISTANCE] = maxDistance;
    },
    clearDistances() {
      this.clearMetadata(METADATA_DISTANCE);
    },
    clearPathAndSolution() {
      this.clearMetadata(METADATA_PATH, METADATA_PLAYER_CURRENT, METADATA_PLAYER_VISITED);
    },
    clearMetadata(...keys: any) {
      keys.forEach((key: any) => {
        delete this.metadata[key];
        this.forEachCell((cell: Cell) => delete cell.metadata[key]);
      });
    },
    dispose() {
      eventTarget.off();
      if (config.drawingSurface) {
        config.drawingSurface.dispose();
      }
    }
  };
}

function getDistanceColour(distance: number, maxDistance: number) {
  return `hsl(${Math.floor(100 - 100 * distance/maxDistance)}, 100%, 50%)`;
}

export function buildSquareGrid(config: Maze) {
  const {drawingSurface: defaultDrawingSurface} = config;
  const grid: any = buildBaseGrid(config);

  defaultDrawingSurface.on(EVENT_CLICK, (event: any) => {
    const coords = [Math.floor(event.x), Math.floor(event.y)];
    if (grid.getCellByCoordinates(coords)) {
      eventTarget.trigger(EVENT_CLICK, {
        coords,
        rawCoords: [event.rawX, event.rawY],
        shift: event.shift,
        alt: event.alt
      });
    }
  });

  grid.isSquare = true;
  grid.initialise = function() {
    for (let x=0; x < config.width; x++) {
      for (let y=0; y < config.height; y++) {
        grid.addCell(x, y);
      }
    }
    for (let x=0; x < config.width; x++) {
      for (let y=0; y < config.height; y++) {
        const cell = grid.getCellByCoordinates(x, y);
        const eastNeighbour = grid.getCellByCoordinates(x+1, y);
        const southNeighbour = grid.getCellByCoordinates(x, y+1);
        if (eastNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_WEST}, {cell: eastNeighbour, direction: DIRECTION_EAST});
        }
        if (southNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_NORTH}, {cell: southNeighbour, direction: DIRECTION_SOUTH});
        }
      }
    }
  };

  grid.render = function(drawingSurface = defaultDrawingSurface) {
    function drawFilledSquare(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, p4x: number, p4y: number, cell: Cell) {
      drawingSurface.setColour(getCellBackgroundColour(cell, grid));
      drawingSurface.fillPolygon({x: p1x, y:p1y}, {x: p2x, y:p2y}, {x: p3x, y:p3y}, {x: p4x, y:p4y});
      drawingSurface.setColour(WALL_COLOUR);
    }

    drawingSurface.setSpaceRequirements(grid.metadata.width, grid.metadata.height);
    drawingSurface.clear();
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      drawFilledSquare(x, y, x+1, y, x+1, y+1, x, y+1, cell);
    });

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      const northNeighbour = cell.neighbours[DIRECTION_NORTH];
      const southNeighbour = cell.neighbours[DIRECTION_SOUTH];
      const eastNeighbour = cell.neighbours[DIRECTION_EAST];
      const westNeighbour = cell.neighbours[DIRECTION_WEST];
      const exitDirection = cell.metadata[METADATA_START_CELL] || cell.metadata[METADATA_END_CELL];

      if ((!northNeighbour || !cell.isLinkedTo(northNeighbour)) && !(exitDirection === DIRECTION_NORTH)) {
        drawingSurface.line(x, y, x+1, y);
      }
      if ((!southNeighbour || !cell.isLinkedTo(southNeighbour)) && !(exitDirection === DIRECTION_SOUTH)) {
        drawingSurface.line(x, y+1, x+1, y+1);
      }
      if ((!eastNeighbour || !cell.isLinkedTo(eastNeighbour)) && !(exitDirection === DIRECTION_EAST)) {
        drawingSurface.line(x+1, y, x+1, y+1);
      }
      if ((!westNeighbour || !cell.isLinkedTo(westNeighbour)) && !(exitDirection === DIRECTION_WEST)) {
        drawingSurface.line(x, y, x, y+1);
      }
      cell.metadata[METADATA_RAW_COORDS] = drawingSurface.convertCoords(x + 0.5, y + 0.5);
    });

    const path = grid.metadata[METADATA_PATH];
    if (path) {
      const LINE_OFFSET = 0.5;
      const exitDetails = findExitCells(grid);

      if (exitDetails) {
        const [startCell, startDirection] = exitDetails[METADATA_START_CELL];
        const {x: startXOffset, y: startYOffset} = exitDirectionOffsets[startDirection];
        const [endCell, endDirection] = exitDetails[METADATA_END_CELL];
        const {x: endXOffset, y: endYOffset} = exitDirectionOffsets[endDirection];
        path.unshift([path[0][0] + startXOffset, path[0][1] + startYOffset]);
        path.push([path[path.length - 1][0] + endXOffset, path[path.length - 1][1] + endYOffset]);
      }

      let previousCoords: number[];
      drawingSurface.setColour(PATH_COLOUR);
      path.forEach((currentCoords: number[], i: number) => {
        if (i) {
          const x1 = previousCoords[0] + LINE_OFFSET;
          const y1 = previousCoords[1] + LINE_OFFSET;
          const x2 = currentCoords[0] + LINE_OFFSET;
          const y2 = currentCoords[1] + LINE_OFFSET;
          drawingSurface.line(x1, y1, x2, y2);
        }
        previousCoords = currentCoords;
      });

      drawingSurface.setColour(WALL_COLOUR);
    }
  };

  function findHardestExits() {
    let edgeCells: Cell[] = [];

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;

      if (cell.neighbours.toArray().length !== 4) {
        edgeCells.push(cell);
      }
    });

    function findRandomMissingNeighbourDirection(cell: Cell) {
      const missingNeighbourDirections = [DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST, DIRECTION_WEST].filter(direction => !cell.neighbours[direction]);
      return config.random.choice?.(missingNeighbourDirections);
    }

    function findFurthestEdgeCellFrom(startCell: Cell) {
      let maxDistance = 0;
      let furthestEdgeCell!: Cell;

      grid.findDistancesFrom(startCell.coords);

      edgeCells.forEach((edgeCell: Cell) => {
        const distance = edgeCell.metadata[METADATA_DISTANCE];
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestEdgeCell = edgeCell;
        }
      });
      grid.clearDistances();

      return furthestEdgeCell;
    }

    const tmpStartCell = <Cell>config.random.choice?.(edgeCells);
    const endCell: Cell = findFurthestEdgeCellFrom(tmpStartCell);
    const startCell: Cell = findFurthestEdgeCellFrom(endCell);

    startCell.metadata[METADATA_START_CELL] = findRandomMissingNeighbourDirection(startCell);
    endCell.metadata[METADATA_END_CELL] = findRandomMissingNeighbourDirection(endCell);
  }

  function findVerticalExits() {
    const centerX = Math.round(grid.metadata.width / 2) - 1;
    let minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE;
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      if (x === centerX) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
    grid.getCellByCoordinates(centerX, maxY).metadata[METADATA_START_CELL] = DIRECTION_SOUTH;
    grid.getCellByCoordinates(centerX, minY).metadata[METADATA_END_CELL] = DIRECTION_NORTH;
  }

  function findHorizontalExits() {
    const centerY = Math.round(grid.metadata.height / 2) - 1;
    let minX = Number.MAX_VALUE, maxX = Number.MIN_VALUE;
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      if (y === centerY) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    });
    grid.getCellByCoordinates(minX, centerY).metadata[METADATA_START_CELL] = DIRECTION_WEST;
    grid.getCellByCoordinates(maxX, centerY).metadata[METADATA_END_CELL] = DIRECTION_EAST;
  }

  grid.placeExits = function() {
    const exitConfig = config.exitConfig;

    if (exitConfig === EXITS_HARDEST) {
      findHardestExits();
    } else if (exitConfig === EXITS_VERTICAL) {
      findVerticalExits();
    } else if (exitConfig === EXITS_HORIZONTAL) {
      findHorizontalExits();
    }
  };

  grid.getClosestDirectionForClick = function(cell: Cell, clickEvent: any) {
    const [cellX, cellY] = cell.metadata[METADATA_RAW_COORDS];
    const [clickX, clickY] = clickEvent.rawCoords;
    const xDiff = clickX - cellX;
    const yDiff = clickY - cellY;

    if (Math.abs(xDiff) < Math.abs(yDiff)) {
      return yDiff > 0 ? DIRECTION_SOUTH : DIRECTION_NORTH;
    } else {
      return xDiff > 0 ? DIRECTION_EAST : DIRECTION_WEST;
    }
  };

  return grid;
}

function midPoint(...values: number[]) {
  return values.reduce((a,b) => a + b, 0) / values.length;
}

export function buildTriangularGrid(config: Maze) {
  const {drawingSurface: defaultDrawingSurface} = config;
  const grid: any = buildBaseGrid(config);
  const verticalAltitude = Math.sin(Math.PI/3);

  defaultDrawingSurface.on(EVENT_CLICK, (event: any) => {
    function getXCoord(event: any) {
      const xDivision = 2 * event.x;
      const y = getYCoord(event);

      if ((Math.floor(xDivision) + y) % 2) {
        const tx = 1 - (xDivision % 1);
        const ty = (event.y / verticalAltitude) % 1;
        if (tx > ty) {
          return Math.floor(xDivision) - 1;
        } else {
          return Math.floor(xDivision);
        }
      } else {
        const tx = xDivision % 1;
        const ty = (event.y / verticalAltitude) % 1;
        if (tx > ty) {
          return Math.floor(xDivision);
        } else {
          return Math.floor(xDivision) - 1;
        }
      }
    }
    function getYCoord(event:any) {
      return Math.floor(event.y / verticalAltitude);
    }
    const x = getXCoord(event);
    const y = getYCoord(event);
    const coords = [x,y];

    if (grid.getCellByCoordinates(coords)) {
      eventTarget.trigger(EVENT_CLICK, {
        coords,
        rawCoords: [event.rawX, event.rawY],
        shift: event.shift,
        alt: event.alt
      });
    }
  });

  function hasBaseOnSouthSide(x : number, y: number) {
    return (x+y) % 2;
  }

  grid.isSquare = false;
  grid.initialise = function() {
    for (let x=0; x < config.width; x++) {
      for (let y=0; y < config.height; y++) {
        grid.addCell(x, y);
      }
    }
    for (let x=0; x < config.width; x++) {
      for (let y=0; y < config.height; y++) {
        const cell = grid.getCellByCoordinates(x, y);
        const eastNeighbour = grid.getCellByCoordinates(x+1, y);
        const southNeighbour = hasBaseOnSouthSide(x, y) && grid.getCellByCoordinates(x, y+1);
        if (eastNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_WEST}, {cell: eastNeighbour, direction: DIRECTION_EAST});
        }
        if (southNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_NORTH}, {cell: southNeighbour, direction: DIRECTION_SOUTH});
        }
      }
    }
  };

  grid.render = function(drawingSurface = defaultDrawingSurface) {
    drawingSurface.setSpaceRequirements(0.5 + grid.metadata.width/2, grid.metadata.height * verticalAltitude, 0.8);

    function drawFilledTriangle(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, cell: Cell) {
      drawingSurface.setColour(getCellBackgroundColour(cell, grid));
      drawingSurface.fillPolygon({x: p1x, y:p1y}, {x: p2x, y:p2y}, {x: p3x, y:p3y});
      drawingSurface.setColour(WALL_COLOUR);
    }

    function getCornerCoords(x: number, y: number) {
      let p1x, p1y, p2x, p2y, p3x, p3y;

      if (hasBaseOnSouthSide(x, y)) {
        p1x = x/2;
        p1y = (y+1) * verticalAltitude;
        p2x = (x+1)/2;
        p2y = p1y - verticalAltitude;
        p3x = p1x + 1;
        p3y = p1y;

      } else {
        p1x = x/2;
        p1y = y * verticalAltitude;
        p2x = (x+1)/2;
        p2y = p1y + verticalAltitude;
        p3x = p1x + 1;
        p3y = p1y
      }
      return [p1x, p1y, p2x, p2y, p3x, p3y];
    }

    drawingSurface.clear();

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      const [p1x, p1y, p2x, p2y, p3x, p3y] = getCornerCoords(x, y);
      drawFilledTriangle(p1x, p1y, p2x, p2y, p3x, p3y, cell);
    });

    const path = grid.metadata[METADATA_PATH];
    if (path) {
      const exitDetails = findExitCells(grid);

      let previousX, previousY;
      drawingSurface.setColour(PATH_COLOUR);

      if (exitDetails) {
        const [startCell, startDirection] = exitDetails[METADATA_START_CELL];
        const {x: startXOffset, y: startYOffset} = exitDirectionOffsets[startDirection];
        const [endCell, endDirection] = exitDetails[METADATA_END_CELL];
        const {x: endXOffset, y: endYOffset} = exitDirectionOffsets[endDirection];
        path.unshift([path[0][0] + startXOffset, path[0][1] + startYOffset]);
        path.push([path[path.length - 1][0] + endXOffset, path[path.length - 1][1] + endYOffset]);
      }

      for (let i = 0; i < path.length; i++) {
        const currentCellCoords = path[i];
        const nextCellCoords = path[i+1];
        const [p1x, p1y, p2x, p2y, p3x, p3y] = getCornerCoords(...(currentCellCoords as [number, number]));

        if (nextCellCoords) {
          const [currentCellX, ] = currentCellCoords;
          const [nextCellX, ] = nextCellCoords;

          let currentX, currentY;
          if (nextCellX > currentCellX) {
            currentX = midPoint(p2x, p3x);
            currentY = midPoint(p2y, p3y);
          } else if (nextCellX < currentCellX) {
            currentX = midPoint(p1x, p2x);
            currentY = midPoint(p1y, p2y);
          } else {
            currentX = midPoint(p3x, p1x);
            currentY = midPoint(p3y, p1y);
          }
          drawingSurface.line(previousX, previousY, currentX, currentY);
          [previousX, previousY] = [currentX, currentY];
        }
      }
      drawingSurface.setColour(WALL_COLOUR);
    }

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      const northNeighbour = cell.neighbours[DIRECTION_NORTH];
      const southNeighbour = cell.neighbours[DIRECTION_SOUTH];
      const eastNeighbour = cell.neighbours[DIRECTION_EAST];
      const westNeighbour = cell.neighbours[DIRECTION_WEST];
      const exitDirection = cell.metadata[METADATA_START_CELL] || cell.metadata[METADATA_END_CELL];

      const [p1x, p1y, p2x, p2y, p3x, p3y] = getCornerCoords(x, y);
      const northOrSouthNeighbour = hasBaseOnSouthSide(x, y) ? southNeighbour : northNeighbour;

      if ((!northOrSouthNeighbour || !cell.isLinkedTo(northOrSouthNeighbour)) && ![DIRECTION_NORTH, DIRECTION_SOUTH].includes(exitDirection)) {
        drawingSurface.line(p1x, p1y, p3x, p3y);
      }
      if ((!eastNeighbour || !cell.isLinkedTo(eastNeighbour)) && !(exitDirection === DIRECTION_EAST)) {
        drawingSurface.line(p2x, p2y, p3x, p3y);
      }
      if ((!westNeighbour || !cell.isLinkedTo(westNeighbour)) && !(exitDirection === DIRECTION_WEST)) {
        drawingSurface.line(p1x, p1y, p2x, p2y);
      }
      cell.metadata[METADATA_RAW_COORDS] = drawingSurface.convertCoords(midPoint(p1x, p2x, p3x), midPoint(p1y, p2y, p3y));
    });
  };

  function findHardestExits() {
    let edgeCells: Cell[] = [];

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;

      if (cell.neighbours.toArray().length !== 3) {
        edgeCells.push(cell);
      }
    });

    function findRandomMissingNeighbourDirection(cell: Cell) {
      const directions = [DIRECTION_EAST, DIRECTION_WEST];
      if (hasBaseOnSouthSide(...(cell.coords as [number, number]))) {
        directions.push(DIRECTION_SOUTH);
      } else {
        directions.push(DIRECTION_NORTH);
      }
      const missingNeighbourDirections = directions.filter(direction => !cell.neighbours[direction]);
      return config.random.choice?.(missingNeighbourDirections);
    }

    function findFurthestEdgeCellFrom(startCell: Cell) {
      let maxDistance = 0;
      let furthestEdgeCell!: Cell;

      grid.findDistancesFrom(startCell.coords);

      edgeCells.forEach(edgeCell => {
        const distance = edgeCell.metadata[METADATA_DISTANCE];
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestEdgeCell = edgeCell;
        }
      });
      grid.clearDistances();

      return furthestEdgeCell;
    }

    const tmpStartCell = <Cell>config.random.choice?.(edgeCells);
    const endCell: Cell = findFurthestEdgeCellFrom(tmpStartCell);
    const startCell: Cell = findFurthestEdgeCellFrom(endCell);

    startCell.metadata[METADATA_START_CELL] = findRandomMissingNeighbourDirection(startCell);
    endCell.metadata[METADATA_END_CELL] = findRandomMissingNeighbourDirection(endCell);
  }

  function findVerticalExits() {
    const centerX = Math.round(grid.metadata.width / 2) - 1;
    let minY = Number.MAX_VALUE;
    let maxY = Number.MIN_VALUE;
    let startXCoord, endXCoord;

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      if (x === centerX || x === centerX + 1) {
        if (hasBaseOnSouthSide(x, y)) {
          if (y > maxY) {
            maxY = Math.max(maxY, y);
            startXCoord = x;
          }
        } else if (y < minY) {
          minY = Math.min(minY, y);
          endXCoord = x;
        }
      }
    });
    grid.getCellByCoordinates(startXCoord, maxY).metadata[METADATA_START_CELL] = DIRECTION_SOUTH;
    grid.getCellByCoordinates(endXCoord, minY).metadata[METADATA_END_CELL] = DIRECTION_NORTH;
  }

  function findHorizontalExits() {
    const centerY = Math.round(grid.metadata.height / 2) - 1;
    let minX = Number.MAX_VALUE;
    let maxX = Number.MIN_VALUE;
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      if (y === centerY) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    });
    grid.getCellByCoordinates(minX, centerY).metadata[METADATA_START_CELL] = DIRECTION_WEST;
    grid.getCellByCoordinates(maxX, centerY).metadata[METADATA_END_CELL] = DIRECTION_EAST;
  }

  grid.placeExits = function() {
    const exitConfig = config.exitConfig;

    if (exitConfig === EXITS_HARDEST) {
      findHardestExits();

    } else if (exitConfig === EXITS_VERTICAL) {
      findVerticalExits();

    } else if (exitConfig === EXITS_HORIZONTAL) {
      findHorizontalExits();
    }
  };

  grid.getClosestDirectionForClick = function(cell: Cell, clickEvent: any) {
    const cellCoords = cell.metadata[METADATA_RAW_COORDS];
    const clickCoords = clickEvent.rawCoords;
    const baseOnSouthSide = hasBaseOnSouthSide(...cell.coords);

    let angleFromNorth = getAngleFromNorth(cellCoords, clickCoords);
    let sixtyDegrees = Math.PI * 2 / 6;

    if (baseOnSouthSide) {
      if (Math.abs(angleFromNorth) > 2 * sixtyDegrees) {
        return DIRECTION_SOUTH;
      } else if (angleFromNorth > 0) {
        return DIRECTION_EAST;
      } else {
        return DIRECTION_WEST;
      }
    } else {
      if (Math.abs(angleFromNorth) < sixtyDegrees) {
        return DIRECTION_NORTH;
      } else if (angleFromNorth > 0) {
        return DIRECTION_EAST;
      } else {
        return DIRECTION_WEST;
      }
    }
  };

  return grid;
}

function getAngleFromNorth(origin: number[], point: number[]) {
  const [ox, oy] = origin;
  const [px, py] = point;
  const angle = Math.atan2(oy - py, px - ox);
  const transformedAngle = Math.PI / 2 - angle;

  if (transformedAngle <= Math.PI) {
    return transformedAngle;
  }
  return -(Math.PI * 2 - transformedAngle);
}

export function buildHexagonalGrid(config: Maze) {
  const {drawingSurface: defaultDrawingSurface} = config;
  const grid: any = buildBaseGrid(config);

  const yOffset1 = Math.cos(Math.PI / 3);
  const yOffset2 = 2 - yOffset1;
  const yOffset3 = 2;
  const xOffset = Math.sin(Math.PI / 3);

  defaultDrawingSurface.on(EVENT_CLICK, (event: any) => {
    const ty = (event.y / (2 - yOffset1)) % 1;
    let x, y;
    const row = Math.floor(event.y / (2 - yOffset1));
    const xRowBasedAdjustment = (row % 2) * xOffset;

    if (ty <= yOffset1) {
      // in zig-zag region
      const tx = Math.abs(xOffset - ((event.x - xRowBasedAdjustment) % (2 * xOffset)));
      const tty = ty * (2 - yOffset1);
      const isAboveLine = tx/tty > Math.tan(Math.PI/3);
      let xYBasedAdjustment, yAdjustment;
      if (isAboveLine) {
        if (xRowBasedAdjustment) {
          xYBasedAdjustment = (event.x - xRowBasedAdjustment) % (2 * xOffset) > xOffset ? 1 : 0;
        } else {
          xYBasedAdjustment = event.x % (2 * xOffset) > xOffset ? 0 : -1;
        }
        yAdjustment = -1;
      } else {
        xYBasedAdjustment = 0;
        yAdjustment = 0;
      }
      x = Math.floor((event.x - xRowBasedAdjustment) / (2 * xOffset)) + xYBasedAdjustment;
      y = row + yAdjustment;
    } else {
      // in rectangular region
      x = Math.floor((event.x - xRowBasedAdjustment) / (2 * xOffset));
      y = row;
    }
    const coords = [x, y];

    if (grid.getCellByCoordinates(coords)) {
      eventTarget.trigger(EVENT_CLICK, {
        coords,
        rawCoords: [event.rawX, event.rawY],
        shift: event.shift,
        alt: event.alt
      });
    }
  });

  grid.isSquare = false;
  grid.initialise = function() {
    for (let x=0; x < config.width; x++) {
      for (let y=0; y < config.height; y++) {
        grid.addCell(x, y);
      }
    }
    for (let x=0; x < config.width; x++) {
      for (let y=0; y < config.height; y++) {
        const cell = grid.getCellByCoordinates(x, y),
          rowBasedXOffset = ((y + 1) % 2),
          eastNeighbour = grid.getCellByCoordinates(x+1, y),
          southWestNeighbour = grid.getCellByCoordinates(x - rowBasedXOffset, y+1),
          southEastNeighbour = grid.getCellByCoordinates(x + 1 - rowBasedXOffset, y+1);

        if (eastNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_WEST}, {cell: eastNeighbour, direction: DIRECTION_EAST});
        }
        if (southWestNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_NORTH_EAST}, {cell: southWestNeighbour, direction: DIRECTION_SOUTH_WEST});
        }
        if (southEastNeighbour) {
          grid.makeNeighbours({cell, direction: DIRECTION_NORTH_WEST}, {cell: southEastNeighbour, direction: DIRECTION_SOUTH_EAST});
        }
      }
    }
  };

  grid.render = function(drawingSurface = defaultDrawingSurface) {
    drawingSurface.setSpaceRequirements(grid.metadata.width * 2 * xOffset + Math.min(1, grid.metadata.height - 1) * xOffset, grid.metadata.height * yOffset2 + yOffset1, 1.5);

    function drawFilledHexagon(p1x: number, p1y: number, p2x: number, p2y: number, p3x: number, p3y: number, p4x: number, p4y: number, p5x: number, p5y: number, p6x: number, p6y: number, cell: Cell) {
      drawingSurface.setColour(getCellBackgroundColour(cell, grid));
      drawingSurface.fillPolygon({x: p1x, y:p1y}, {x: p2x, y:p2y}, {x: p3x, y:p3y}, {x: p4x, y:p4y}, {x: p5x, y:p5y}, {x: p6x, y:p6y});
      drawingSurface.setColour(WALL_COLOUR);
    }
    function getCornerCoords(x: number, y: number) {
      const rowXOffset = Math.abs(y % 2) * xOffset;
      const p1x = rowXOffset + x * xOffset * 2;
      const p1y = yOffset1 + y * yOffset2;
      const p2x = p1x;
      const p2y = (y + 1) * yOffset2;
      const p3x = rowXOffset + (2 * x + 1) * xOffset;
      const p3y = y * yOffset2 + yOffset3;
      const p4x = p2x + 2 * xOffset;
      const p4y = p2y;
      const p5x = p4x;
      const p5y = p1y;
      const p6x = p3x;
      const p6y = y * yOffset2;

      return [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y];
    }

    drawingSurface.clear();
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      const [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y] = getCornerCoords(x, y);

      drawFilledHexagon(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y, cell);
    });

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      const eastNeighbour = cell.neighbours[DIRECTION_EAST];
      const westNeighbour = cell.neighbours[DIRECTION_WEST];
      const northEastNeighbour = cell.neighbours[DIRECTION_NORTH_EAST];
      const northWestNeighbour = cell.neighbours[DIRECTION_NORTH_WEST];
      const southEastNeighbour = cell.neighbours[DIRECTION_SOUTH_EAST];
      const southWestNeighbour = cell.neighbours[DIRECTION_SOUTH_WEST];
      const exitDirection = cell.metadata[METADATA_START_CELL] || cell.metadata[METADATA_END_CELL];
      const [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y] = getCornerCoords(x, y);

      if ((!eastNeighbour || !cell.isLinkedTo(eastNeighbour)) && !(exitDirection === DIRECTION_EAST)) {
        drawingSurface.line(p4x, p4y, p5x, p5y);
      }
      if ((!westNeighbour || !cell.isLinkedTo(westNeighbour)) && !(exitDirection === DIRECTION_WEST)) {
        drawingSurface.line(p1x, p1y, p2x, p2y);
      }
      if ((!northEastNeighbour || !cell.isLinkedTo(northEastNeighbour)) && !(exitDirection === DIRECTION_NORTH_EAST)) {
        drawingSurface.line(p5x, p5y, p6x, p6y);
      }
      if ((!northWestNeighbour || !cell.isLinkedTo(northWestNeighbour)) && !(exitDirection === DIRECTION_NORTH_WEST)) {
        drawingSurface.line(p1x, p1y, p6x, p6y);
      }
      if ((!southEastNeighbour || !cell.isLinkedTo(southEastNeighbour)) && !(exitDirection === DIRECTION_SOUTH_EAST)) {
        drawingSurface.line(p3x, p3y, p4x, p4y);
      }
      if ((!southWestNeighbour || !cell.isLinkedTo(southWestNeighbour)) && !(exitDirection === DIRECTION_SOUTH_WEST)) {
        drawingSurface.line(p2x, p2y, p3x, p3y);
      }
      cell.metadata[METADATA_RAW_COORDS] = drawingSurface.convertCoords(midPoint(p1x, p2x, p3x, p4x, p5x, p6x), midPoint(p1y, p2y, p3y, p4y, p5y, p6y));
    });

    const path = grid.metadata[METADATA_PATH];

    function drawExitLine(cell: Cell, direction: 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw') {
      const [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y] = getCornerCoords(...cell.coords);
      const centerX = p3x;
      const centerY = (p3y + p6y) / 2;

      const [endX, endY] =  {
        [DIRECTION_EAST] : [midPoint(p4x, p5x), midPoint(p4y, p5y)],
        [DIRECTION_WEST] : [midPoint(p1x, p2x), midPoint(p1y, p2y)],
        [DIRECTION_NORTH_EAST] : [midPoint(p5x, p6x), midPoint(p5y, p6y)],
        [DIRECTION_NORTH_WEST] : [midPoint(p1x, p6x), midPoint(p1y, p6y)],
        [DIRECTION_SOUTH_EAST] : [midPoint(p3x, p4x), midPoint(p3y, p4y)],
        [DIRECTION_SOUTH_WEST] : [midPoint(p2x, p3x), midPoint(p2y, p3y)],
      }[direction];

      drawingSurface.line(centerX, centerY, endX, endY);
    }

    if (path) {
      drawingSurface.setColour(PATH_COLOUR);
      const exitDetails = findExitCells(grid);

      if (exitDetails) {
        drawExitLine(...(exitDetails[METADATA_START_CELL] as [Cell, 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw']));
        drawExitLine(...(exitDetails[METADATA_END_CELL] as [Cell, 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw']));
      }

      let previousX: number, previousY: number;
      path.forEach((currentCoords: number[], i: number) => {
        const [p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, p5x, p5y, p6x, p6y] = getCornerCoords(currentCoords[0], currentCoords[1]);
        const centerX = p3x;
        const centerY = (p3y + p6y) / 2;
        if (i) {
          drawingSurface.line(previousX, previousY, centerX, centerY);
        }
        [previousX, previousY] = [centerX, centerY];
      });
      drawingSurface.setColour(WALL_COLOUR);
    }
  };

  function findHardestExits() {
    let edgeCells: Cell[] = [];

    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;

      if (cell.neighbours.toArray().length !== 6) {
        edgeCells.push(cell);
      }
    });

    function findRandomMissingNeighbourDirection(cell: Cell) {
      const missingNeighbourDirections = [DIRECTION_WEST, DIRECTION_EAST, DIRECTION_NORTH_EAST, DIRECTION_NORTH_WEST, DIRECTION_SOUTH_EAST, DIRECTION_SOUTH_WEST].filter(direction => !cell.neighbours[direction]);
      return config.random.choice?.(missingNeighbourDirections);
    }

    function findFurthestEdgeCellFrom(startCell: Cell): Cell {
      let maxDistance = 0, furthestEdgeCell!: Cell;

      grid.findDistancesFrom(startCell.coords);

      edgeCells.forEach(edgeCell => {
        const distance = edgeCell.metadata[METADATA_DISTANCE];
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestEdgeCell = edgeCell;
        }
      });
      grid.clearDistances();

      return furthestEdgeCell;
    }

    const tmpStartCell = <Cell>config.random.choice?.(edgeCells);
    const  endCell: Cell = findFurthestEdgeCellFrom(tmpStartCell);
    const startCell = findFurthestEdgeCellFrom(endCell);

    startCell.metadata[METADATA_START_CELL] = findRandomMissingNeighbourDirection(startCell);
    endCell.metadata[METADATA_END_CELL] = findRandomMissingNeighbourDirection(endCell);
  }

  function findVerticalExits() {
    const centerX = Math.round(grid.metadata.width / 2) - 1;
    let minY = Number.MAX_VALUE, maxY = Number.MIN_VALUE;
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      if (x === centerX) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    });
    grid.getCellByCoordinates(centerX, maxY).metadata[METADATA_START_CELL] = DIRECTION_SOUTH_EAST;
    grid.getCellByCoordinates(centerX, minY).metadata[METADATA_END_CELL] = DIRECTION_NORTH_EAST;
  }

  function findHorizontalExits() {
    const centerY = Math.round(grid.metadata.height / 2) - 1;
    let minX = Number.MAX_VALUE, maxX = Number.MIN_VALUE;
    grid.forEachCell((cell: Cell) => {
      const [x,y] = cell.coords;
      if (y === centerY) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    });
    grid.getCellByCoordinates(minX, centerY).metadata[METADATA_START_CELL] = DIRECTION_WEST;
    grid.getCellByCoordinates(maxX, centerY).metadata[METADATA_END_CELL] = DIRECTION_EAST;
  }

  grid.placeExits = function() {
    const exitConfig = config.exitConfig;

    if (exitConfig === EXITS_HARDEST) {
      findHardestExits();
    } else if (exitConfig === EXITS_VERTICAL) {
      findVerticalExits();
    } else if (exitConfig === EXITS_HORIZONTAL) {
      findHorizontalExits();
    }
  };

  grid.getClosestDirectionForClick = function(cell: Cell, clickEvent: any) {
    const cellCoords = cell.metadata[METADATA_RAW_COORDS];
    const clickCoords = clickEvent.rawCoords;

    let angleFromNorth = getAngleFromNorth(cellCoords, clickCoords);
    let sixtyDegrees = Math.PI * 2 / 6;
    let sector = Math.floor((angleFromNorth + Math.PI) / sixtyDegrees);

    return [DIRECTION_SOUTH_WEST, DIRECTION_WEST, DIRECTION_NORTH_WEST, DIRECTION_NORTH_EAST, DIRECTION_EAST, DIRECTION_SOUTH_EAST][sector];
  };

  return grid;
}

export function buildCircularGrid(config: Maze) {
  const grid: Grid = buildBaseGrid(config);
  const cellCounts = cellCountsForLayers(config.layers);
  const {drawingSurface: defaultDrawingSurface} = config;

  const cx = grid.metadata.layers;
  const cy = grid.metadata.layers;

  defaultDrawingSurface.on(EVENT_CLICK, (event:any) => {
    const xDistance = event.x - cx;
    const yDistance = event.y - cy;
    const distanceFromCenter = Math.sqrt(Math.pow(xDistance, 2) + Math.pow(yDistance, 2));
    const layer = Math.floor(distanceFromCenter);
    const cellsInThisLayer = cellCounts[layer];
    const anglePerCell = Math.PI * 2 / cellsInThisLayer;
    const angle = (Math.atan2(yDistance, xDistance) + 2.5 * Math.PI) % (Math.PI * 2);
    const cell = Math.floor(angle / anglePerCell);
    const coords: [number, number] = [layer, cell];

    if (grid.getCellByCoordinates(...coords)) {
      eventTarget.trigger(EVENT_CLICK, {
        coords,
        rawCoords: [event.rawX, event.rawY],
        shift: event.shift,
        alt: event.alt
      });
    }
  });
  function cellCountsForLayers(layers: number) {
    const counts = [1];
    const rowRadius = 1 / layers;
    while (counts.length < layers) {
      const layer = counts.length;
      const previousCount = counts[layer-1];
      const circumference = Math.PI * 2 * layer * rowRadius / previousCount;
      counts.push(previousCount * Math.round(circumference / rowRadius));
    }
    return counts;
  }

  grid.isSquare = false;
  grid.initialise = function() {
    for (let l=0; l < config.layers; l++) {
      const cellsInLayer = cellCounts[l];
      for (let c=0; c < cellsInLayer; c++) {
        grid.addCell(l, c);
      }
    }

    for (let l=0; l < config.layers; l++) {
      const cellsInLayer = cellCounts[l];
      for (let c=0; c < cellsInLayer; c++) {
        const cell = grid.getCellByCoordinates(l, c);
        if (cellsInLayer > 1) {
          const clockwiseNeighbour = grid.getCellByCoordinates(l, (c + 1) % cellsInLayer);
          const anticlockwiseNeighbour = grid.getCellByCoordinates(l, (c + cellsInLayer - 1) % cellsInLayer);
          grid.makeNeighbours({cell, direction: DIRECTION_CLOCKWISE}, {cell: anticlockwiseNeighbour, direction: DIRECTION_ANTICLOCKWISE});
        }

        if (l < config.layers - 1) {
          const cellsInNextLayer = cellCounts[l+1];
          const outerNeighbourCount = cellsInNextLayer / cellsInLayer;
          for (let o = 0; o < outerNeighbourCount; o++) {
            const outerNeighbour = grid.getCellByCoordinates(l+1, c * outerNeighbourCount + o);
            grid.makeNeighbours({cell, direction: DIRECTION_INWARDS}, {cell: outerNeighbour, direction: `${DIRECTION_OUTWARDS}_${o}`});
          }
        }
      }
    }
  };

  function getCellCoords(l: number, c: number) {
    const cellsInLayer = cellCounts[l];
    const anglePerCell = Math.PI * 2 / cellsInLayer;
    const startAngle = anglePerCell * c;
    const endAngle = startAngle + anglePerCell;
    const innerDistance = l;
    const outerDistance = l + 1;

    return [startAngle, endAngle, innerDistance, outerDistance];
  }

  function thisCell(thisCoords: any) {
    const LAYER = 0;
    const INDEX = 1;
    const [thisLayer, thisIndex] = thisCoords;
    return {
      isOnInnermostLayer() {
        return thisLayer === 0;
      },
      isOnOutermostLayer() {
        return thisLayer === grid.metadata.layers - 1;
      },
      hasFiveExits() {
        return ! this.isOnInnermostLayer() && ! this.isOnOutermostLayer() && (cellCounts[thisLayer] < cellCounts[thisLayer + 1]);
      },
      hasAntiClockwiseOutsideBorderWith(otherCoords: any) {
        return this.hasFiveExits() && thisLayer + 1 === otherCoords[LAYER] && thisIndex * 2 === otherCoords[INDEX];
      },
      hasClockwiseOutsideBorderWith(otherCoords: any) {
        return this.hasFiveExits() && thisLayer + 1 === otherCoords[LAYER] && thisIndex * 2 + 1=== otherCoords[INDEX];
      },
      isInSameLayerAs(otherCoords: any) {
        return thisLayer === otherCoords[LAYER];
      },
      isInside(otherCoords: any) {
        return thisLayer < otherCoords[LAYER];
      },
      isOutside(otherCoords: any) {
        return thisLayer > otherCoords[LAYER];
      },
      isAntiClockwiseFrom(otherCoords: any) {
        return this.isInSameLayerAs(otherCoords) && ((otherCoords[INDEX] === thisIndex + 1) || (thisIndex === cellCounts[thisLayer] - 1 && otherCoords[INDEX] === 0));
      },
      isClockwiseFrom(otherCoords: any) {
        return this.isInSameLayerAs(otherCoords) && ((otherCoords[INDEX] === thisIndex - 1) || (otherCoords[INDEX] === cellCounts[thisLayer] - 1 && thisIndex === 0));
      },
      getCoords() {
        return getCellCoords(thisLayer, thisIndex);
      }
    };
  }

  grid.render = function(drawingSurface = defaultDrawingSurface) {
    drawingSurface.setSpaceRequirements(grid.metadata.layers * 2, grid.metadata.layers * 2, 1.5);

    function polarToXy(angle: number, distance: number) {
      return [cx + distance * Math.sin(angle), cy - distance * Math.cos(angle)];
    }
    function drawFilledSegment(smallR:number, bigR:number, startAngle:number, endAngle:number, cell: Cell) {
      drawingSurface.setColour(getCellBackgroundColour(cell, grid));
      drawingSurface.fillSegment(cx, cy, smallR, bigR, startAngle, endAngle);
      drawingSurface.setColour(WALL_COLOUR);
    }

    drawingSurface.clear();
    grid.forEachCell((cell: Cell) => {
      const [l,c] = cell.coords;
      const [startAngle, endAngle, innerDistance, outerDistance] = getCellCoords(l, c);

      drawFilledSegment(l, l + 1, startAngle, endAngle, cell);
    });

    grid.forEachCell((cell: Cell) => {
      const [l,c] = cell.coords;
      const [startAngle, endAngle, innerDistance, outerDistance] = getCellCoords(l, c);
      const clockwiseNeighbour = cell.neighbours[DIRECTION_CLOCKWISE];
      const anticlockwiseNeighbour = cell.neighbours[DIRECTION_ANTICLOCKWISE];
      const inwardsNeighbour = cell.neighbours[DIRECTION_INWARDS];
      const anticlockwiseOutsideNeighbour = cell.neighbours[`${DIRECTION_OUTWARDS}_0`];
      const clockwiseOutsideNeighbour = cell.neighbours[`${DIRECTION_OUTWARDS}_1`];
      const isOutermostLayer = l === grid.metadata.layers - 1;
      const isStartCell = cell.metadata[METADATA_START_CELL];

      if (l > 0) {
        if (!cell.isLinkedTo(anticlockwiseNeighbour)) {
          drawingSurface.line(...polarToXy(startAngle, innerDistance), ...polarToXy(startAngle, outerDistance));
        }
        if (!cell.isLinkedTo(clockwiseNeighbour)) {
          drawingSurface.line(...polarToXy(endAngle, innerDistance), ...polarToXy(endAngle, outerDistance));
        }
        if (!cell.isLinkedTo(inwardsNeighbour)) {
          drawingSurface.arc(cx, cy, innerDistance, startAngle, endAngle);
        }
        const nextLaterOutHasSameNumberOfCells = (cellCounts[l] === cellCounts[l+1]);
        if ((isOutermostLayer || (nextLaterOutHasSameNumberOfCells && !cell.isLinkedTo(anticlockwiseOutsideNeighbour))) && !isStartCell) {
          drawingSurface.arc(cx, cy, outerDistance, startAngle, endAngle);
        } else if (!nextLaterOutHasSameNumberOfCells) {
          const halfwayAngle = (endAngle + startAngle) / 2;
          if (!cell.isLinkedTo(anticlockwiseOutsideNeighbour) && !isStartCell) {
            drawingSurface.arc(cx, cy, outerDistance, startAngle, halfwayAngle);
          }
          if (!cell.isLinkedTo(clockwiseOutsideNeighbour) && !isStartCell) {
            drawingSurface.arc(cx, cy, outerDistance, halfwayAngle, endAngle);
          }
        }
        cell.metadata[METADATA_RAW_COORDS] = drawingSurface.convertCoords(...polarToXy(midPoint(startAngle, endAngle), midPoint(innerDistance, outerDistance)));
      } else {
        cell.metadata[METADATA_RAW_COORDS] = drawingSurface.convertCoords(cx, cy);
      }
    });

    const path = grid.metadata[METADATA_PATH];

    if (path) {
      drawingSurface.setColour(PATH_COLOUR);
      for (let i = 0; i < path.length; i++) {
        const previousCellCoords = path[i-1];
        const currentCellCoords = path[i];
        const nextCellCoords = path[i+1];
        const cell = thisCell(currentCellCoords);
        const [startAngle, endAngle, innerDistance, outerDistance] = cell.getCoords();
        const centerDistance = (innerDistance + outerDistance) / 2;
        const centerAngle = (startAngle + endAngle) / 2;

        if (cell.isOnInnermostLayer()) {
          if (previousCellCoords) {
            const [previousStartAngle, previousEndAngle, _1, _2] = thisCell(previousCellCoords).getCoords();
            const previousCenterAngle = (previousStartAngle + previousEndAngle) / 2;
            drawingSurface.line(...polarToXy(previousCenterAngle, 0), ...polarToXy(previousCenterAngle, outerDistance));
          }

          if (nextCellCoords) {
            const [nextStartAngle, nextEndAngle, _1, _2] = thisCell(nextCellCoords).getCoords();
            const nextCenterAngle = (nextStartAngle + nextEndAngle) / 2;
            drawingSurface.line(...polarToXy(nextCenterAngle, 0), ...polarToXy(nextCenterAngle, outerDistance));
          }

        } else if (cell.hasFiveExits()) {
          const centerClockwiseAngle = (centerAngle + endAngle) / 2;
          const centerAnticlockwiseAngle = (startAngle + centerAngle) / 2;
          if (previousCellCoords) {
            if (cell.isClockwiseFrom(previousCellCoords)) {
              if (nextCellCoords) {
                if (cell.isOutside(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAngle);
                  drawingSurface.line(...polarToXy(centerAngle, centerDistance), ...polarToXy(centerAngle, innerDistance));

                } else if (cell.isAntiClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, endAngle);

                } else if (cell.hasClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, centerClockwiseAngle);
                  drawingSurface.line(...polarToXy(centerClockwiseAngle, centerDistance), ...polarToXy(centerClockwiseAngle, outerDistance));

                } else if (cell.hasAntiClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAnticlockwiseAngle);
                  drawingSurface.line(...polarToXy(centerAnticlockwiseAngle, centerDistance), ...polarToXy(centerAnticlockwiseAngle, outerDistance));
                } else {
                  console.assert(false);
                }

              } else {
                drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAngle);
              }

            } else if (cell.isAntiClockwiseFrom(previousCellCoords)) {
              if (nextCellCoords) {
                if (cell.isOutside(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAngle, endAngle);
                  drawingSurface.line(...polarToXy(centerAngle, centerDistance), ...polarToXy(centerAngle, innerDistance));

                } else if (cell.isClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, endAngle);

                } else if (cell.hasClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerClockwiseAngle, endAngle);
                  drawingSurface.line(...polarToXy(centerClockwiseAngle, centerDistance), ...polarToXy(centerClockwiseAngle, outerDistance));

                } else if (cell.hasAntiClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAnticlockwiseAngle, endAngle);
                  drawingSurface.line(...polarToXy(centerAnticlockwiseAngle, centerDistance), ...polarToXy(centerAnticlockwiseAngle, outerDistance));
                } else {
                  console.assert(false);
                }

              } else {
                drawingSurface.arc(cx, cy, centerDistance, centerAngle, endAngle);
              }

            } else if (cell.isOutside(previousCellCoords)) {
              drawingSurface.line(...polarToXy(centerAngle, innerDistance), ...polarToXy(centerAngle, centerDistance));
              if (nextCellCoords) {
                if (cell.isClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAngle);

                } else if (cell.isAntiClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAngle, endAngle);

                } else if (cell.hasClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAngle, centerClockwiseAngle);
                  drawingSurface.line(...polarToXy(centerClockwiseAngle, centerDistance), ...polarToXy(centerClockwiseAngle, outerDistance));

                } else if (cell.hasAntiClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAnticlockwiseAngle, centerAngle);
                  drawingSurface.line(...polarToXy(centerAnticlockwiseAngle, centerDistance), ...polarToXy(centerAnticlockwiseAngle, outerDistance));

                } else {
                  console.assert(false);
                }
              }

            } else if (cell.hasClockwiseOutsideBorderWith(previousCellCoords) ) {
              drawingSurface.line(...polarToXy(centerClockwiseAngle, outerDistance), ...polarToXy(centerClockwiseAngle, centerDistance));
              if (nextCellCoords) {
                if (cell.isClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, centerClockwiseAngle);

                } else if (cell.isAntiClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerClockwiseAngle, endAngle);

                } else if (cell.hasAntiClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAnticlockwiseAngle, centerClockwiseAngle);
                  drawingSurface.line(...polarToXy(centerAnticlockwiseAngle, centerDistance), ...polarToXy(centerAnticlockwiseAngle, outerDistance));

                } else if (cell.isOutside(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAngle, centerClockwiseAngle);
                  drawingSurface.line(...polarToXy(centerAngle, centerDistance), ...polarToXy(centerAngle, innerDistance));

                } else {
                  console.assert(false);
                }
              }

            } else if (cell.hasAntiClockwiseOutsideBorderWith(previousCellCoords) ) {
              drawingSurface.line(...polarToXy(centerAnticlockwiseAngle, outerDistance), ...polarToXy(centerAnticlockwiseAngle, centerDistance));
              if (nextCellCoords) {
                if (cell.isClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAnticlockwiseAngle);

                } else if (cell.isAntiClockwiseFrom(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAnticlockwiseAngle, endAngle);

                } else if (cell.hasClockwiseOutsideBorderWith(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAnticlockwiseAngle, centerClockwiseAngle);
                  drawingSurface.line(...polarToXy(centerClockwiseAngle, centerDistance), ...polarToXy(centerClockwiseAngle, outerDistance));

                } else if (cell.isOutside(nextCellCoords)) {
                  drawingSurface.arc(cx, cy, centerDistance, centerAnticlockwiseAngle, centerAngle);
                  drawingSurface.line(...polarToXy(centerAngle, centerDistance), ...polarToXy(centerAngle, innerDistance));

                } else {
                  console.assert(false);
                }
              }

            } else {
              console.assert(false);
            }
          }

        } else {
          if (previousCellCoords) {
            if (cell.isClockwiseFrom(previousCellCoords)) {
              drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAngle);
            } else if (cell.isAntiClockwiseFrom(previousCellCoords)) {
              drawingSurface.arc(cx, cy, centerDistance, centerAngle, endAngle);
            } else if (cell.isOutside(previousCellCoords)) {
              drawingSurface.line(...polarToXy(centerAngle, innerDistance), ...polarToXy(centerAngle, centerDistance));
            } else if (cell.isInside(previousCellCoords)) {
              drawingSurface.line(...polarToXy(centerAngle, outerDistance), ...polarToXy(centerAngle, centerDistance));
            } else {
              console.assert(false);
            }
          }

          if (nextCellCoords) {
            if (cell.isAntiClockwiseFrom(nextCellCoords)) {
              drawingSurface.arc(cx, cy, centerDistance, centerAngle, endAngle);
            } else if (cell.isClockwiseFrom(nextCellCoords)) {
              drawingSurface.arc(cx, cy, centerDistance, startAngle, centerAngle);
            } else if (cell.isOutside(nextCellCoords)) {
              drawingSurface.line(...polarToXy(centerAngle, centerDistance), ...polarToXy(centerAngle, innerDistance));
            } else if (cell.isInside(nextCellCoords)) {
              drawingSurface.line(...polarToXy(centerAngle, centerDistance), ...polarToXy(centerAngle, outerDistance));
            } else {
              console.assert(false);
            }
          }
        }
      }
      drawingSurface.setColour(WALL_COLOUR);
    }
  };

  function findHardestExits() {
    let edgeCells: Cell[] = [];

    grid.forEachCell((cell:Cell) => {
      if (!cell.neighbours[`${DIRECTION_OUTWARDS}_0`] && !cell.neighbours[`${DIRECTION_OUTWARDS}_1`]) {
        edgeCells.push(cell);
      }
    });

    function findFurthestEdgeCellFrom(startCell: Cell): Cell {
      let maxDistance = 0;
      let furthestEdgeCell!:Cell;

      grid.findDistancesFrom(startCell.coords);

      edgeCells.forEach((edgeCell: Cell) => {
        const distance = edgeCell.metadata[METADATA_DISTANCE];
        if (distance > maxDistance) {
          maxDistance = distance;
          furthestEdgeCell = edgeCell;
        }
      });
      grid.clearDistances();

      return furthestEdgeCell;
    }

    const endCell = grid.getCellByCoordinates(0, 0);
    const startCell: Cell = findFurthestEdgeCellFrom(endCell);

    startCell.metadata[METADATA_START_CELL] = DIRECTION_OUTWARDS;
    endCell.metadata[METADATA_END_CELL] = DIRECTION_OUTWARDS;
  }

  function findVerticalExits() {
    grid.getCellByCoordinates(0, 0).metadata[METADATA_END_CELL] = DIRECTION_OUTWARDS;

    let layerIndex = grid.metadata.layers - 1;
    while(layerIndex > 0) {
      const bottomCellIndex = cellCounts[layerIndex] / 2;
      const bottomCellOnThisLayer = grid.getCellByCoordinates(layerIndex, bottomCellIndex);
      if (bottomCellOnThisLayer) {
        bottomCellOnThisLayer.metadata[METADATA_START_CELL] = DIRECTION_OUTWARDS;
        return;
      }
      layerIndex--;
    }
  }

  function findHorizontalExits() {
    grid.getCellByCoordinates(0, 0).metadata[METADATA_END_CELL] = DIRECTION_OUTWARDS;

    let layerIndex = grid.metadata.layers - 1;
    while(layerIndex > 0) {
      const leftCellIndex = Math.round(0.75 * cellCounts[layerIndex]);
      const leftCellOnThisLayer = grid.getCellByCoordinates(layerIndex, leftCellIndex);
      if (leftCellOnThisLayer) {
        leftCellOnThisLayer.metadata[METADATA_START_CELL] = DIRECTION_OUTWARDS;
        return;
      }
      layerIndex--;
    }
  }

  grid.placeExits = function() {
    const exitConfig = config.exitConfig;

    if (exitConfig === EXITS_HARDEST) {
      findHardestExits();

    } else if (exitConfig === EXITS_VERTICAL) {
      findVerticalExits();

    } else if (exitConfig === EXITS_HORIZONTAL) {
      findHorizontalExits();
    }
  };

  grid.getClosestDirectionForClick = function(cell: Cell, clickEvent: any) {
    const cellCoords = cell.metadata[METADATA_RAW_COORDS];
    const clickCoords = clickEvent.rawCoords;
        // [startAngle, endAngle, _1, _2] = getCellCoords(...cell.coords),
    const [startAngle, endAngle, _1, _2] = getCellCoords(...(cell.coords as [any, any]));
    const coordAngle = midPoint(startAngle, endAngle);
    const hasFiveExits = thisCell(cell.coords).hasFiveExits();

    let angleFromNorth = getAngleFromNorth(cellCoords, clickCoords); // -180 to 180
    let angleFromLineToCenter = (Math.PI * 4 + angleFromNorth - coordAngle) % (Math.PI * 2); //

    const fortyFiveDegrees = Math.PI / 4;
    if (angleFromLineToCenter <= fortyFiveDegrees) {
      return `${DIRECTION_OUTWARDS}_${hasFiveExits ? 1 : 0}`;
    } else if (angleFromLineToCenter > fortyFiveDegrees && angleFromLineToCenter <= 3 * fortyFiveDegrees) {
      return DIRECTION_CLOCKWISE;
    } else if (angleFromLineToCenter > 3 * fortyFiveDegrees && angleFromLineToCenter <= 5 * fortyFiveDegrees) {
      return DIRECTION_INWARDS;
    } else if (angleFromLineToCenter > 5 * fortyFiveDegrees && angleFromLineToCenter <= 7 * fortyFiveDegrees) {
      return DIRECTION_ANTICLOCKWISE;
    } else {
      return `${DIRECTION_OUTWARDS}_0`;
    }
  };

  return grid;
}
