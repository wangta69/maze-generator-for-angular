import {buildSquareGrid, buildTriangularGrid, buildHexagonalGrid, buildCircularGrid} from './maze';
import {drawingSurfaces} from './drawingSurfaces';
import {buildRandom, Random} from './random';
import {algorithms} from './algorithms';
import {ExitConfig} from '../model';
import {
  SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE,
  ALGORITHM_NONE, ALGORITHM_BINARY_TREE, ALGORITHM_SIDEWINDER, ALGORITHM_ALDOUS_BRODER, ALGORITHM_WILSON, ALGORITHM_HUNT_AND_KILL, ALGORITHM_RECURSIVE_BACKTRACK, ALGORITHM_KRUSKAL, ALGORITHM_SIMPLIFIED_PRIMS, ALGORITHM_TRUE_PRIMS, ALGORITHM_ELLERS
} from './constants';

// const SIZE=30;

const shapeLookup = {
  [SHAPE_SQUARE]: buildSquareGrid,
  [SHAPE_TRIANGLE]: buildTriangularGrid,
  [SHAPE_HEXAGON]: buildHexagonalGrid,
  [SHAPE_CIRCLE]: buildCircularGrid
};

export type Maze = {
  width: number,
  height: number,
  layers: number,
  exitConfig: ExitConfig,
  random: Random,
  drawingSurface: any
}
export type Config = {
grid: {
  cellShape:'square'| 'triangle' | 'hexagon' | 'circle',
  width: number,
  height: number,
  layers: number,
  
}, // {cellShape}
element: {
  tagName: 'canvas' | 'svg',
},
randomSeed?: number,
lineWidth?: number,
exitConfig: ExitConfig,
algorithm: 'none' | 'binaryTree' | 'sidewinder' | 'aldousBroder' | 'wilson' 
| 'huntAndKill' | 'recursiveBacktrack' | 'kruskal' | 'simplifiedPrims' | 'truePrims' | 'ellers',
mask: [number, number][]

}

function validateConfig(config: Config) {
  if (!config) {
    throw new Error('config object missing');
  }

  if (! config.grid) {
    throw new Error('no "grid" property in config object');
  }

  if (! config.grid.cellShape) {
    throw new Error('no "grid.cellShape" property in config object');
  }

  if (![SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE].includes(config.grid.cellShape)) {
    throw new Error('invalid "grid.cellShape" property in config object');
  }

  if ([SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON].includes(config.grid.cellShape)) {
    if (!config.grid.width) {
      throw new Error('missing/invalid "grid.width" property in config object');
    }
    if (!config.grid.height) {
      throw new Error('missing/invalid "grid.height" property in config object');
    }

  } else if (config.grid.cellShape === SHAPE_CIRCLE) {
    if (!config.grid.layers) {
      throw new Error('missing/invalid "grid.layers" property in config object');
    }
  }

  if (![ALGORITHM_NONE, ALGORITHM_BINARY_TREE, ALGORITHM_SIDEWINDER, ALGORITHM_ALDOUS_BRODER, ALGORITHM_WILSON, ALGORITHM_HUNT_AND_KILL, ALGORITHM_RECURSIVE_BACKTRACK, ALGORITHM_KRUSKAL, ALGORITHM_SIMPLIFIED_PRIMS, ALGORITHM_TRUE_PRIMS, ALGORITHM_ELLERS].includes(config.algorithm)) {
    throw new Error('missing/invalid "algorithm" property in config object');
  }

  if (!config.element) {
    throw new Error('missing/invalid "element" property in config object');
  }
  if (!['canvas', 'svg'].includes(config.element.tagName.toLowerCase())) {
    throw new Error('invalid "element" property in config object' + config.element.tagName.toLowerCase());
  }
}

export function buildMaze(config: Config) {
  validateConfig(config);

  const random: Random = buildRandom(config.randomSeed || Date.now());
  const grid = shapeLookup[config.grid.cellShape]({
    width: config.grid.width,
    height: config.grid.height,
    layers: config.grid.layers,
    exitConfig: config.exitConfig,
    random,
    drawingSurface: drawingSurfaces[config.element.tagName.toLowerCase()]({
      el: config.element,
      lineWidth: config.lineWidth
    })
  });
  const algorithm = algorithms[config.algorithm];

  grid.initialise();
  (config.mask || []).forEach((maskedCoords: [number, number]) => {
      grid.removeCell(maskedCoords);
  });

  const iterator = algorithm.fn(grid, {random});
  grid.runAlgorithm = {
    oneStep() {
      return iterator.next().done && (grid.placeExits() || true);
    },
    toCompletion() {
      while(!iterator.next().done);
      grid.placeExits();
    }
  };

  return grid;
}
