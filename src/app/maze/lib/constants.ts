export const
  SHAPE_SQUARE = 'square',
  SHAPE_TRIANGLE = 'triangle',
  SHAPE_HEXAGON = 'hexagon',
  SHAPE_CIRCLE = 'circle',

  ALGORITHM_NONE = 'none',
  ALGORITHM_BINARY_TREE = 'binaryTree',
  ALGORITHM_SIDEWINDER = 'sidewinder',
  ALGORITHM_ALDOUS_BRODER = 'aldousBroder',
  ALGORITHM_WILSON = 'wilson',
  ALGORITHM_HUNT_AND_KILL = 'huntAndKill',
  ALGORITHM_RECURSIVE_BACKTRACK = 'recursiveBacktrack',
  ALGORITHM_KRUSKAL = 'kruskal',
  ALGORITHM_SIMPLIFIED_PRIMS = 'simplifiedPrims',
  ALGORITHM_TRUE_PRIMS = 'truePrims',
  ALGORITHM_ELLERS = 'ellers',

  DIRECTION_NORTH = 'n',
  DIRECTION_SOUTH = 's',
  DIRECTION_EAST = 'e',
  DIRECTION_WEST = 'w',
  DIRECTION_NORTH_WEST = 'nw',
  DIRECTION_NORTH_EAST = 'ne',
  DIRECTION_SOUTH_WEST = 'sw',
  DIRECTION_SOUTH_EAST = 'se',
  DIRECTION_CLOCKWISE = 'cw',
  DIRECTION_ANTICLOCKWISE = 'acw',
  DIRECTION_INWARDS = 'in',
  DIRECTION_OUTWARDS = 'out',

  EVENT_CLICK = 'click',
  EVENT_MOUSE_OVER = 'mouseOver',

  METADATA_VISITED = 'visited',
  METADATA_SET_ID = 'setId',
  METADATA_MAX_DISTANCE = 'maxDistance',
  METADATA_DISTANCE = 'distance',
  METADATA_PATH = 'path',
  METADATA_MASKED = 'masked',
  METADATA_CURRENT_CELL = 'current',
  METADATA_UNPROCESSED_CELL = 'unprocessed',
  METADATA_START_CELL = 'startCell',
  METADATA_END_CELL = 'endCell',
  METADATA_COST = 'cost',
  METADATA_PLAYER_CURRENT = 'playerCurrent',
  METADATA_PLAYER_VISITED = 'playerVisited',
  METADATA_RAW_COORDS = 'rawCoords',

  EXITS_NONE = 'no exits',
  EXITS_HARDEST = 'hardest',
  EXITS_HORIZONTAL = 'horizontal',
  EXITS_VERTICAL = 'vertical',

  PATH_COLOUR = '#006BB7',
  CELL_BACKGROUND_COLOUR = 'white',
  CELL_MASKED_COLOUR = 'grey',
  CELL_UNPROCESSED_CELL_COLOUR = '#bbb',
  CELL_PLAYER_CURRENT_COLOUR = PATH_COLOUR,
  CELL_PLAYER_VISITED_COLOUR = PATH_COLOUR + '44',
  CELL_CURRENT_CELL_COLOUR = PATH_COLOUR,
  WALL_COLOUR = 'black';


export const keyCodeToDirection: any = {
  38: DIRECTION_NORTH,
  40: DIRECTION_SOUTH,
  39: DIRECTION_EAST,
  37: DIRECTION_WEST,
  65: DIRECTION_NORTH_WEST, // A
  83: DIRECTION_NORTH_EAST, // S
  90: DIRECTION_SOUTH_WEST, // Z
  88: DIRECTION_SOUTH_EAST, // X
  81: DIRECTION_CLOCKWISE,  // Q
  87: DIRECTION_ANTICLOCKWISE, // W
  80: DIRECTION_INWARDS, // P
  76: `${DIRECTION_OUTWARDS}_1`, // L
  186: `${DIRECTION_OUTWARDS}_0` // ;
};