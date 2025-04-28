import { Component,OnInit,AfterViewInit, ViewEncapsulation  } from '@angular/core';

import {buildModel,Model, ExitConfig} from './maze/model';
import {buildView, View} from './maze/view';
import {buildMaze} from './maze/lib/main';
import {buildStateMachine, STATE_INIT, STATE_DISPLAYING, STATE_PLAYING, STATE_MASKING, STATE_DISTANCE_MAPPING, STATE_RUNNING_ALGORITHM, State} from './maze/stateMachine';
import {shapes} from './maze/lib/shapes';
import {drawingSurfaces} from './maze/lib/drawingSurfaces';
import {
    EVENT_MAZE_SHAPE_SELECTED, EVENT_SIZE_PARAMETER_CHANGED, EVENT_ALGORITHM_SELECTED, EVENT_GO_BUTTON_CLICKED, EVENT_WINDOW_RESIZED,
    EVENT_SHOW_MAP_BUTTON_CLICKED, EVENT_CLEAR_MAP_BUTTON_CLICKED, EVENT_CREATE_MASK_BUTTON_CLICKED,
    EVENT_SAVE_MASK_BUTTON_CLICKED, EVENT_CLEAR_MASK_BUTTON_CLICKED, EVENT_FINISH_RUNNING_BUTTON_CLICKED, EVENT_DELAY_SELECTED,
    EVENT_CHANGE_PARAMS_BUTTON_CLICKED, EVENT_EXITS_SELECTED, EVENT_SOLVE_BUTTON_CLICKED, EVENT_PLAY_BUTTON_CLICKED, EVENT_STOP_BUTTON_CLICKED,
    EVENT_KEY_PRESS, EVENT_DOWNLOAD_CLICKED
} from './maze/view.js';
import {config, Shape} from './maze/config';
import {algorithms} from './maze/lib/algorithms';
import {buildRandom} from './maze/lib/random';
import {Cell} from './maze/lib/maze';
import {
    ALGORITHM_NONE, METADATA_MASKED, METADATA_END_CELL, METADATA_START_CELL, EVENT_CLICK, EXITS_NONE, EXITS_HARDEST, EXITS_HORIZONTAL, EXITS_VERTICAL,
    METADATA_PLAYER_CURRENT, METADATA_PLAYER_VISITED, METADATA_PATH, METADATA_VISITED,
    DIRECTION_NORTH, DIRECTION_SOUTH, DIRECTION_EAST, DIRECTION_WEST, DIRECTION_NORTH_WEST, DIRECTION_NORTH_EAST, DIRECTION_SOUTH_WEST, DIRECTION_SOUTH_EAST,
    DIRECTION_CLOCKWISE, DIRECTION_ANTICLOCKWISE, DIRECTION_INWARDS, DIRECTION_OUTWARDS,
    SHAPE_SQUARE, SHAPE_TRIANGLE, SHAPE_HEXAGON, SHAPE_CIRCLE,
    keyCodeToDirection
} from './maze/lib/constants';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, AfterViewInit{
  private model!: Model;
  private stateMachine!: State;
  private view!: View;

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.init();
  }


  private init() {
    this.model = buildModel(),
    this.stateMachine = <State>buildStateMachine(),
    this.view = buildView(this.model, this.stateMachine);

    this.setupShapeParameter();
    this.setupSizeParameters();
    this.setupExitConfigs();
    this.setupAlgorithmDelay();
    this.setupAlgorithms();
    this.showEmptyGrid(true);



    this.view.on(EVENT_GO_BUTTON_CLICKED, () => {
      this.model.randomSeed = Number(this.view.getSeed() || buildRandom().int(Math.pow(10,9)));
      this.view.showSeedValue();

      const errors = this.view.inputErrorMessage();
      if (errors) {
        alert(errors);
      } else {
        this.buildMazeUsingModel().then(() => {
          this.view.toggleSolveButtonCaption(true);
          this.model.maze.render();
          this.stateMachine.displaying();
        });
      }
    });

    this.view.on(EVENT_SHOW_MAP_BUTTON_CLICKED, () => {
      this.stateMachine.distanceMapping();
      const [startCell, _1] = this.findStartAndEndCells();
      const coords = (startCell || this.model.maze.randomCell()).coords;
      this.model.maze.findDistancesFrom(...coords);
      this.model.maze.render();
    });

    this. view.on(EVENT_CLEAR_MAP_BUTTON_CLICKED, () => {
      this.stateMachine.displaying();
      this.model.maze.clearDistances();
      this.model.maze.render();
    });

    this.view.on(EVENT_FINISH_RUNNING_BUTTON_CLICKED, () => {
      clearInterval(this.model.runningAlgorithm.interval);
      this.model.runningAlgorithm.run.toCompletion();
      delete this.model.runningAlgorithm;
      this.stateMachine.displaying();
      this.model.maze.render();
    });

    this.stateMachine.onStateChange((newState: any) => {
      this.view.updateForNewState(newState);
    });

    this.view.updateForNewState(this.stateMachine.state);
    this.view.on(EVENT_CREATE_MASK_BUTTON_CLICKED, () => {
      this.stateMachine.masking();
      this.showEmptyGrid(false);
      (this.model.mask[this.getModelMaskKey() as string] || []).forEach((maskedCoords: [number, number]) => {
        const cell = this.model.maze.getCellByCoordinates(maskedCoords);
        cell.metadata[METADATA_MASKED] = true;
      });
      this.model.maze.render();
    });

    this.view.on(EVENT_SAVE_MASK_BUTTON_CLICKED, () => {
      try {
        this.validateMask();
        this.stateMachine.init();
        const mask: [number, number][] = this.model.mask[this.getModelMaskKey() as string] = [];
        this.model.maze.forEachCell((cell: Cell) => {
          if (cell.metadata[METADATA_MASKED]) {
            mask.push(cell.coords);
          }
        });
        this.showEmptyGrid(true);
        this.setupAlgorithms();
        this.view.updateMaskButtonCaption(this.isMaskAvailableForCurrentConfig());
      } catch (err) {
        alert(err);
      }
    });

    this.view.on(EVENT_CLEAR_MASK_BUTTON_CLICKED, () => {
      this.model.maze.forEachCell((cell: Cell) => {
        delete cell.metadata[METADATA_MASKED];
      });
      this.model.maze.render();
    });

    this.view.on(EVENT_WINDOW_RESIZED, () => {
      this.model.maze.render();
    });

    this.view.on(EVENT_CHANGE_PARAMS_BUTTON_CLICKED, () => {
      this.showEmptyGrid(true);
      this.stateMachine.init();
    });


    this.view.on(EVENT_SOLVE_BUTTON_CLICKED, () => {
      const [startCell, endCell] = this.findStartAndEndCells();
      if (!(startCell && endCell)) {
        alert('You must generate a maze with exits in order to solve');
        return;
      }
      if (this.model.maze.metadata[METADATA_PATH]) {
        this.model.maze.clearPathAndSolution();
        this.view.toggleSolveButtonCaption(true);
      } else {
        const [startCell, endCell] = this.findStartAndEndCells();
        // console.assert(startCell);
        // console.assert(endCell);
        this.model.maze.findPathBetween(startCell.coords, endCell.coords);
        this.view.toggleSolveButtonCaption(false);
      }
      this.model.maze.render();
    });



    this.view.on(EVENT_PLAY_BUTTON_CLICKED, () => {
      const [startCell, endCell] = this.findStartAndEndCells();
      if (!(startCell && endCell)) {
        alert('You must generate a maze with exits in order to play');
        return;
      }
      this.model.maze.clearPathAndSolution();
      this.model.playState = {startCell, endCell, currentCell: startCell, startTime: Date.now()};
      startCell.metadata[METADATA_PLAYER_CURRENT] = true;
      startCell.metadata[METADATA_PLAYER_VISITED] = true;
      this.model.maze.render();
      this.stateMachine.playing();
      this.view.setNavigationInstructions(this.getNavigationInstructions());
    });

    this.view.on(EVENT_STOP_BUTTON_CLICKED, () => {
      this.model.maze.clearMetadata(METADATA_PLAYER_CURRENT, METADATA_PLAYER_VISITED);
      this.model.maze.render();
      this.stateMachine.displaying();
    });

    this. view.on(EVENT_KEY_PRESS, this.ifStateIs(this.stateMachine, STATE_PLAYING).then((event: any) => {
      const {keyCode, shift, alt} = event,
          direction = keyCodeToDirection[(keyCode as number)];

      this.navigate(direction, shift, alt);
      this.model.maze.render();
    }));

    this.view.on(EVENT_DOWNLOAD_CLICKED, () => {
      function saveSvg(svgEl: any, name: string) {
        const svgData = svgEl.outerHTML;
        const prolog = '<?xml version="1.0" standalone="no"?>';
        const blob = new Blob([prolog, svgData], {type: 'image/svg+xml;charset=utf-8'});
        const blobAsUrl = URL.createObjectURL(blob);
        const downloadLink = document.createElement('a');

        downloadLink.href = blobAsUrl;
        downloadLink.download = name;
        downloadLink.click();
      }

      const SVG_SIZE = 500;
      const elSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      elSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      elSvg.setAttribute('width', SVG_SIZE.toString());
      elSvg.setAttribute('height', SVG_SIZE.toString());

      const svgDrawingSurface = drawingSurfaces.svg({el: elSvg});
      const fileName = `maze_${this.model.shape}_${Object.values(this.model.size).join('_')}_${this.model.randomSeed}.svg`;
      this.model.maze.render(svgDrawingSurface);
      saveSvg(elSvg, fileName);
    });
  }

  private getModelMaskKey() {
    if (this.model.shape && this.model.size) {
      return `${this.model.shape}-${Object.values(this.model.size).join('-')}`;
    }

    return '';
  }

  private validateMask() {
    const isNotMasked = (cell: Cell) => !cell.metadata[METADATA_MASKED],
      startCell = this.model.maze.randomCell(isNotMasked);
    let unmaskedCellCount = 0;

    this.model.maze.forEachCell((cell: Cell) => {
      if (isNotMasked(cell)) {
        unmaskedCellCount++;
      }
    });
    if (!startCell) {
      throw 'No unmasked cells remain';
    }
    if (unmaskedCellCount < 4) {
      throw 'Not enough unmasked cells to build a maze';
    }

    function countUnmasked(cell: Cell) {
      cell.metadata[METADATA_VISITED] = true;
      let count = 1;
      cell.neighbours.toArray(isNotMasked).forEach((neighbourCell: Cell) => {
        if (!neighbourCell.metadata[METADATA_VISITED]) {
          count += countUnmasked(neighbourCell);
        }
      });
      return count;
    }

    this.model.maze.forEachCell((cell: Cell) => {
      delete cell.metadata[METADATA_VISITED];
    });

    if (unmaskedCellCount !== countUnmasked(startCell)) {
      throw 'Your mask has cut off one or more cells so they are not reachable from the rest of the maze.';
    }

    if (this.model.shape === SHAPE_CIRCLE && this.model.maze.getCellByCoordinates(0,0).metadata[METADATA_MASKED]) {
      throw 'You can\'t mask out the centre of a circular maze';
    }
  }

  private getNavigationInstructions() {
    const isMobile = this.view.isMobileLayout,
      MOBILE_INSTRUCTIONS = 'Tap to move through the maze to the next junction',
      MOUSE_INSTRUCTIONS = 'Click to move through the maze',
      ALT_SHIFT_INSTRUCTIONS = 'Holding down <b>SHIFT</b> will move you as far as possible in one direction<br><br>Holding down <b>ALT</b> and <b>SHIFT</b> will move you to the next junction';

    if (isMobile) {
      return MOBILE_INSTRUCTIONS;
    }

    return {
      [SHAPE_SQUARE]:   `${MOUSE_INSTRUCTIONS} or use the arrow keys<br><br>${ALT_SHIFT_INSTRUCTIONS}`,
      [SHAPE_TRIANGLE]: `${MOUSE_INSTRUCTIONS} or use the arrow keys<br><br>${ALT_SHIFT_INSTRUCTIONS}`,
      [SHAPE_HEXAGON]:  `${MOUSE_INSTRUCTIONS}<br><br>${ALT_SHIFT_INSTRUCTIONS}`,
      [SHAPE_CIRCLE]:   `${MOUSE_INSTRUCTIONS}<br><br>${ALT_SHIFT_INSTRUCTIONS}`
    }[this.model.shape];
  }

  private findStartAndEndCells() {
    let startCell!:Cell, endCell!:Cell;
    this.model.maze.forEachCell((cell: Cell) => {
      if (cell.metadata[METADATA_START_CELL]) {
        startCell = cell;
      }
      if (cell.metadata[METADATA_END_CELL]) {
        endCell = cell;
      }
    });
    return [startCell, endCell];
  }

  private buildMazeUsingModel(overrides: any={}) {
    if (this.model.maze) {
      this.model.maze.dispose();
    }

    const grid = Object.assign({'cellShape': this.model.shape}, this.model.size);
    const maze = buildMaze({
        grid,
        'algorithm':  overrides.algorithm || this.model.algorithm,
        'randomSeed' : this.model.randomSeed,
        'element': overrides.element || document.getElementById('maze'),
        'mask': overrides.mask || this.model.mask[this.getModelMaskKey() as string],
        'exitConfig': overrides.exitConfig || this.model.exitConfig
      });

      this.model.maze = maze;

    maze.on(EVENT_CLICK, this.ifStateIs(this.stateMachine, STATE_DISTANCE_MAPPING).then((event: any) => {
      maze.findDistancesFrom(...event.coords);
      maze.render();
    }));


    maze.on(EVENT_CLICK, this.ifStateIs(this.stateMachine, STATE_MASKING).then((event: any) => {
      const cell = maze.getCellByCoordinates(event.coords);
      cell.metadata[METADATA_MASKED] = !cell.metadata[METADATA_MASKED];
      maze.render();
    }));

    maze.on(EVENT_CLICK, this.ifStateIs(this.stateMachine, STATE_PLAYING).then((event: any) => {
      const currentCell = this.model.playState.currentCell;
      const direction = maze.getClosestDirectionForClick(currentCell, event);
      this.navigate(direction, event.shift || this.view.isMobileLayout, event.alt || this.view.isMobileLayout);
      maze.render();
    }));

    const algorithmDelay = overrides.algorithmDelay !== undefined ? overrides.algorithmDelay : this.model.algorithmDelay;
    const runAlgorithm = maze.runAlgorithm;
    if (algorithmDelay) {
      this.model.runningAlgorithm = {run: runAlgorithm};
      return new Promise(resolve => {
        this.stateMachine.runningAlgorithm();
          this.model.runningAlgorithm.interval = setInterval(() => {
            const done = runAlgorithm.oneStep();
            maze.render();
            if (done) {
              clearInterval(this.model.runningAlgorithm.interval);
              delete this.model.runningAlgorithm;
              this.stateMachine.displaying();
              resolve(true);
            }
          }, algorithmDelay/maze.cellCount);
      });

    } else {
      runAlgorithm.toCompletion();
      maze.render();
      return Promise.resolve();
    }
  }


  private isMaskAvailableForCurrentConfig() {
    const currentMask = this.model.mask[this.getModelMaskKey() as string];
    return currentMask && currentMask.length;
  }

  private onShapeSelected(shapeName: Shape) {
    this.view.setShape(this.model.shape = shapeName);
    this.view.updateMaskButtonCaption(this.isMaskAvailableForCurrentConfig());
  }

  private setupShapeParameter() {
    Object.keys(shapes).forEach(name => {
      this.view.addShape(name);
    });

  
    this.onShapeSelected(this.model.shape);

    this.view.on(EVENT_MAZE_SHAPE_SELECTED, (shapeName: Shape) => {
      this.onShapeSelected(shapeName);
      this.setupSizeParameters();
      this.setupAlgorithms();
      this.showEmptyGrid(true);
    });
  }

  private onParameterChanged(name: string, value: number) {
    this.model.size[name] = value;
    this.view.setSizeParameter(name, value);
    this.view.updateMaskButtonCaption(this.isMaskAvailableForCurrentConfig());
  }

  private setupSizeParameters() {
    const shape = this.model.shape,
      parameters = config.shapes[shape].parameters;

    this.model.size = {};
    this.view.clearSizeParameters();

    Object.entries(parameters).forEach(([paramName, paramValues]) => {
      this.view.addSizeParameter(paramName, paramValues.min, paramValues.max);
    });


    Object.entries(parameters).forEach(([paramName, paramValues]) => {
      this.onParameterChanged(paramName, paramValues.initial);
    });

    this.view.on(EVENT_SIZE_PARAMETER_CHANGED, (data: any) => {
      if (this.view.getValidSizeParameters().includes(data.name)) {
        this.onParameterChanged(data.name, data.value);
        this.showEmptyGrid(true);
        this.setupAlgorithms();
      }
    });
  }

  private onAlgorithmChanged(algorithmId: string) {
    this.view.setAlgorithm(this.model.algorithm = algorithmId);
  }
  private setupAlgorithms() {
    const shape = this.model.shape;

    this.view.clearAlgorithms();

    Object.entries(algorithms).filter(([algorithmId, algorithm]) => algorithmId !== ALGORITHM_NONE).forEach(([algorithmId, algorithm]) => {
      if (algorithm.metadata.shapes.includes(shape) && (algorithm.metadata.maskable || !this.isMaskAvailableForCurrentConfig())) {
        this.view.addAlgorithm(algorithm.metadata.description, algorithmId);
      }
    });

    this.onAlgorithmChanged(config.shapes[shape].defaultAlgorithm);
    this.view.on(EVENT_ALGORITHM_SELECTED, this.onAlgorithmChanged.bind(this));
  }

  private setupAlgorithmDelay() {
    this.view.addAlgorithmDelay('Instant Mazes', 0);
    this.view.addAlgorithmDelay('Show Algorithm Steps', 5000);

    this.view.on(EVENT_DELAY_SELECTED, (algorithmDelay: number) => {
      this.model.algorithmDelay = algorithmDelay;
      this.view.setAlgorithmDelay(algorithmDelay);
    });
    this.view.setAlgorithmDelay(this.model.algorithmDelay);
  }

  private setupExitConfigs() {
    this.view.addExitConfiguration('No Entrance/Exit', EXITS_NONE);
    this.view.addExitConfiguration('Bottom to Top', EXITS_VERTICAL);
    this.view.addExitConfiguration('Left to Right', EXITS_HORIZONTAL);
    this.view.addExitConfiguration('Hardest Entrance/Exit', EXITS_HARDEST);

    this.view.on(EVENT_EXITS_SELECTED, (exitConfig: ExitConfig) => {
      this.view.setExitConfiguration(this.model.exitConfig = exitConfig);
    });
    this.view.setExitConfiguration(this.model.exitConfig);
  }


  private showEmptyGrid(deleteMaskedCells: any) {
    this.buildMazeUsingModel({algorithmDelay: 0, exitConfig: EXITS_NONE, algorithm: ALGORITHM_NONE, mask: deleteMaskedCells ? this.model.mask[this.getModelMaskKey() as string] : []})
      .then(() => this.model.maze.render());
  }

  private ifStateIs(stateMachine: State, ...states: any) {
    return {
      then(handler: any) {
        return (event: any) => {
          if (states.includes(stateMachine.state)) {
            handler(event);
          }
        };
      }
    }
  }

  private padNum(num: number) {
    return num < 10 ? '0' + num : num;
  }
  private formatTime(millis: number) {
    const hours = Math.floor(millis / (1000 * 60 * 60)),
      minutes = Math.floor((millis % (1000 * 60 * 60)) / (1000 * 60)),
      seconds = Math.floor((millis % (1000 * 60)) / 1000);

    return `${this.padNum(hours)}:${this.padNum(minutes)}:${this.padNum(seconds)}`;
  }

  private onMazeCompleted() {
    const timeMs = Date.now() - this.model.playState.startTime,
      time = this.formatTime(timeMs),
      {startCell, endCell} = this.model.playState;

    this.model.playState.finished = true;

    this.model.maze.findPathBetween(startCell.coords, endCell.coords);
    const optimalPathLength = this.model.maze.metadata[METADATA_PATH].length;
    delete this.model.maze.metadata[METADATA_PATH];

    let visitedCells = 0;
    this.model.maze.forEachCell((cell: Cell) => {
        if (cell.metadata[METADATA_PLAYER_VISITED]) {
            visitedCells++;
        }
    });

    const cellsPerSecond = visitedCells / (timeMs / 1000);
    this.model.maze.render();
    this.stateMachine.displaying();
    this.view.showInfo(`
        Finish Time: ${time}<br>
        Visited Cells: ${visitedCells}<br>
        Optimal Route: ${optimalPathLength}<br><br>
        Optimality: <em>${Math.floor(100 * optimalPathLength / visitedCells)}%</em><br>
        Cells per Second: <em>${Math.round(cellsPerSecond)}</em>
    `);
  }

  private navigate(direction: string, shift: any, alt: any) {
      while (true) {
        const currentCell = this.model.playState.currentCell;
        const targetCell = currentCell.neighbours[direction];
        const moveOk = targetCell && targetCell.isLinkedTo(currentCell);

        if (moveOk) {
          delete currentCell.metadata[METADATA_PLAYER_CURRENT];
          targetCell.metadata[METADATA_PLAYER_VISITED] = true;
          targetCell.metadata[METADATA_PLAYER_CURRENT] = true;
          this.model.playState.previousCell = currentCell;
          this.model.playState.currentCell = targetCell;

          if (targetCell.metadata[METADATA_END_CELL]) {
            this.onMazeCompleted();
          }

          if (this.model.playState.finished) {
            break;
          } else if (!shift) {
            break;
          } else if (alt) {
            const linkedDirections = targetCell.neighbours.linkedDirections();
            if (linkedDirections.length === 2) {
              direction = linkedDirections.find((neighbourDirection: any) => targetCell.neighbours[neighbourDirection] !== this.model.playState.previousCell);
            } else {
              break;
            }
          }

        } else {
          break;
        }
      }
  }
}
