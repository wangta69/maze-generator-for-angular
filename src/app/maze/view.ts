import {buildEventTarget} from './lib/utils';
import {Model} from './model';
import {State} from './stateMachine';
export const
  EVENT_MAZE_SHAPE_SELECTED = 'mazeShapeSelected',
  EVENT_SIZE_PARAMETER_CHANGED = 'mazeSizeParameterChanged',
  EVENT_DELAY_SELECTED = 'runModeSelected',
  EVENT_ALGORITHM_SELECTED = 'algorithmSelected',
  EVENT_GO_BUTTON_CLICKED = 'goButtonClicked',
  EVENT_SHOW_MAP_BUTTON_CLICKED = 'showDistanceMapButtonClicked',
  EVENT_CLEAR_MAP_BUTTON_CLICKED = 'clearDistanceMapButtonClicked',
  EVENT_CREATE_MASK_BUTTON_CLICKED = 'createMaskButtonClicked',
  EVENT_SAVE_MASK_BUTTON_CLICKED = 'saveMaskButtonClicked',
  EVENT_CLEAR_MASK_BUTTON_CLICKED = 'clearMaskButtonClicked',
  EVENT_FINISH_RUNNING_BUTTON_CLICKED = 'finishRunningButtonClicked',
  EVENT_CHANGE_PARAMS_BUTTON_CLICKED = 'changeParamsButtonClicked',
  EVENT_SOLVE_BUTTON_CLICKED = 'solveButtonClicked',
  EVENT_PLAY_BUTTON_CLICKED = 'playButtonClicked',
  EVENT_STOP_BUTTON_CLICKED = 'stopButtonClicked',
  EVENT_DOWNLOAD_CLICKED = 'downloadClicked',
  EVENT_KEY_PRESS = 'keyPress',
  EVENT_WINDOW_RESIZED = 'windowResized',
  EVENT_EXITS_SELECTED = 'exitsSelected';


export type View = {
  addShape: (shapeName: string) => void,
  setShape: (shapeName: string) => void,

  // Size
  clearSizeParameters: () => void,
  addSizeParameter: (name: string, minimumValue: number, maximumValue: number) => void,
  setSizeParameter: (name: string, value: number) => void,

  // Exits
  addExitConfiguration: (description: string, value: string) => void,
  setExitConfiguration: (exitConfiguration: string) => void,

  // Algorithm Delay
  addAlgorithmDelay: (description: string, value: number) => void,
  setAlgorithmDelay: (algorithmDelay: number) => void,

  // Algorithm
  clearAlgorithms: () => void,
  addAlgorithm: (description: string, algorithmId: string) => void,
  setAlgorithm: (algorithmId: string) => void,

  toggleSolveButtonCaption: (solve: boolean) => void,

  getSeed: () => any,

  getValidSizeParameters: () => any,

  inputErrorMessage: () => string,
  isMobileLayout: boolean,

  updateForNewState: (state: string) => void,

  updateMaskButtonCaption: (maskAvailable: any) => void,

  showSeedValue: () => void,
  showInfo: (msg: string) => void,
  setNavigationInstructions: (instructions: any) => void,

  on: (eventName: any, handler: any) => void,
}

import {STATE_INIT, STATE_DISPLAYING, STATE_PLAYING, STATE_MASKING, STATE_DISTANCE_MAPPING, STATE_RUNNING_ALGORITHM} from './stateMachine';

export function buildView(model: Model, stateMachine: State) {
  const eventTarget = buildEventTarget('view'),
    elCanvas: HTMLCanvasElement = document.getElementById('maze') as HTMLCanvasElement,
    elMazeContainer: HTMLElement | null = document.getElementById('mazeContainer'),
    elGoButton: HTMLElement | null = document.getElementById('go'),
    elShowDistanceMapButton: HTMLElement | null = document.getElementById('showDistanceMap'),
    elClearDistanceMapButton: HTMLElement | null = document.getElementById('clearDistanceMap'),
    elCreateMaskButton: HTMLElement | null = document.getElementById('createMask'),
    elSaveMaskButton: HTMLElement | null = document.getElementById('saveMask'),
    elClearMaskButton: HTMLElement | null = document.getElementById('clearMask'),
    elFinishRunningButton: HTMLElement | null = document.getElementById('finishRunning'),
    elSolveButton: HTMLElement | null = document.getElementById('solve'),
    elPlayButton: HTMLElement | null = document.getElementById('play'),
    elStopButton: HTMLElement | null = document.getElementById('stop'),
    elChangeParamsButton: HTMLElement | null = document.getElementById('changeParams'),
    elDownloadButton: HTMLElement | null = document.getElementById('download'),
    elInfo: HTMLElement | null = document.getElementById('info'),
    elSeedInput: HTMLInputElement = document.getElementById('seedInput') as HTMLInputElement,
    elSizeParameterList: HTMLElement | null = document.getElementById('sizeParameters'),
    elSeedParameterList: HTMLElement | null = document.getElementById('seedParameters'),
    elMazeShapeList: HTMLElement | null = document.getElementById('shapeSelector'),
    elMazeAlgorithmList: HTMLElement | null = document.getElementById('algorithmSelector'),
    elAlgorithmDelayList: HTMLElement | null = document.getElementById('delaySelector'),
    elExitsList: HTMLElement | null = document.getElementById('exitSelector'),
    elMobileTitle: HTMLElement | null = document.getElementById('mobileTitle'),

    isMobileLayout = !! elMobileTitle?.offsetParent;


  elGoButton ? elGoButton.onclick = () => eventTarget.trigger(EVENT_GO_BUTTON_CLICKED): null;
  elShowDistanceMapButton ? elShowDistanceMapButton.onclick = () => eventTarget.trigger(EVENT_SHOW_MAP_BUTTON_CLICKED): null;
  elClearDistanceMapButton ? elClearDistanceMapButton.onclick = () => eventTarget.trigger(EVENT_CLEAR_MAP_BUTTON_CLICKED): null;
  elCreateMaskButton ? elCreateMaskButton.onclick = () => eventTarget.trigger(EVENT_CREATE_MASK_BUTTON_CLICKED): null;
  elSaveMaskButton ? elSaveMaskButton.onclick = () => eventTarget.trigger(EVENT_SAVE_MASK_BUTTON_CLICKED): null;
  elClearMaskButton ? elClearMaskButton.onclick = () => eventTarget.trigger(EVENT_CLEAR_MASK_BUTTON_CLICKED): null;
  elFinishRunningButton ? elFinishRunningButton.onclick = () => eventTarget.trigger(EVENT_FINISH_RUNNING_BUTTON_CLICKED): null;
  elChangeParamsButton ? elChangeParamsButton.onclick = () => eventTarget.trigger(EVENT_CHANGE_PARAMS_BUTTON_CLICKED): null;
  elSolveButton ? elSolveButton.onclick = () => eventTarget.trigger(EVENT_SOLVE_BUTTON_CLICKED): null;
  elPlayButton ? elPlayButton.onclick = () => eventTarget.trigger(EVENT_PLAY_BUTTON_CLICKED): null;
  elStopButton ? elStopButton.onclick = () => eventTarget.trigger(EVENT_STOP_BUTTON_CLICKED): null;
  elDownloadButton ? elDownloadButton.onclick = () => eventTarget.trigger(EVENT_DOWNLOAD_CLICKED): null;

  window.onkeydown = event => eventTarget.trigger(EVENT_KEY_PRESS, {keyCode: event.keyCode, alt: event.altKey, shift: event.shiftKey});

  function fitCanvasToContainer() {
    if (isMobileLayout && elMazeContainer) {
      elMazeContainer.style.height = `${elMazeContainer.clientWidth}px`;
    }

    elCanvas && elMazeContainer ? elCanvas.width = elMazeContainer.clientWidth: null;
    elCanvas && elMazeContainer? elCanvas.height = elMazeContainer.clientHeight: null;
  }
  window.onresize = () => {
    fitCanvasToContainer();
    eventTarget.trigger(EVENT_WINDOW_RESIZED);
  };
  fitCanvasToContainer();

  function toggleElementVisibility(el: any, display: boolean | string) {
    el.style.display = display ? 'block' : 'none';
  }

  return {
    // Shape
    addShape(shapeName: string) {
      const elMazeShapeItem = document.createElement('li');
      elMazeShapeItem.innerHTML = shapeName;
      elMazeShapeItem.onclick = () => eventTarget.trigger(EVENT_MAZE_SHAPE_SELECTED, shapeName);
      elMazeShapeList ? elMazeShapeList.appendChild(elMazeShapeItem): null;
      elMazeShapeItem.dataset['value'] = shapeName;
    },
    setShape(shapeName: string) {
      if(elMazeShapeList) {
        [...elMazeShapeList.querySelectorAll('li')].forEach(el => {
          el.classList.toggle('selected', el.dataset['value'] === shapeName);
        });
      }
    },

    // Size
    clearSizeParameters() {
      elSizeParameterList ? elSizeParameterList.innerHTML = '': null;
    },
    addSizeParameter(name: string, minimumValue: number, maximumValue: number) {
      const elParameterItem = document.createElement('li'),
      elParameterName = document.createElement('label'),
      elParameterValue = document.createElement('input');

      elParameterName.innerHTML = name;

      elParameterValue.setAttribute('type', 'number');
      elParameterValue.setAttribute('required', 'required');
      elParameterValue.setAttribute('min', minimumValue.toString());
      elParameterValue.setAttribute('max', maximumValue.toString());
      elParameterValue.oninput = () => eventTarget.trigger(EVENT_SIZE_PARAMETER_CHANGED, {
        name,
        value: Number(elParameterValue.value)
      });
      elParameterValue.dataset['value'] = name;

      elParameterItem.appendChild(elParameterName);
      elParameterItem.appendChild(elParameterValue);
      elSizeParameterList ? elSizeParameterList.appendChild(elParameterItem): null;
    },
    setSizeParameter(name: string, value: number) {
      if(elSizeParameterList) {
        const elParamInput = [...elSizeParameterList.querySelectorAll('input')].find(el => el.dataset['value'] === name);
        elParamInput ? elParamInput.value = value.toString(): null;
      }
    },

    // Exits
    addExitConfiguration(description: string, value: string) {
      const elExitsItem = document.createElement('li');
      elExitsItem.innerHTML = description;
      elExitsItem.onclick = () => eventTarget.trigger(EVENT_EXITS_SELECTED, value);
      elExitsList ? elExitsList.appendChild(elExitsItem): null;
      elExitsItem.dataset['value'] = value.toString();
    },
    setExitConfiguration(exitConfiguration: string) {
      if(elExitsList) {
        [...elExitsList.querySelectorAll('li')].forEach(el => {
          el.classList.toggle('selected', el.dataset['value'] === exitConfiguration);
        });
      }
    },

    // Algorithm Delay
    addAlgorithmDelay(description: string, value: number) {
      const elDelayItem = document.createElement('li');
      elDelayItem.innerHTML = description;
      elDelayItem.onclick = () => eventTarget.trigger(EVENT_DELAY_SELECTED, value);
      elAlgorithmDelayList ? elAlgorithmDelayList.appendChild(elDelayItem): null;
      elDelayItem.dataset['value'] = value.toString();
    },
    setAlgorithmDelay(algorithmDelay: number) {
      if(elAlgorithmDelayList) {
        [...elAlgorithmDelayList.querySelectorAll('li')].forEach(el => {
          el.classList.toggle('selected', Number(el.dataset['value']) === algorithmDelay);
        });
      }
    },

    // Algorithm
    clearAlgorithms() {
      elMazeAlgorithmList ? elMazeAlgorithmList.innerHTML = '': null;
    },
    addAlgorithm(description: string, algorithmId: string) {
      const elAlgorithmItem = document.createElement('li');
      elAlgorithmItem.innerHTML = description;
      elAlgorithmItem.onclick = () => eventTarget.trigger(EVENT_ALGORITHM_SELECTED, algorithmId);
      elMazeAlgorithmList ? elMazeAlgorithmList.appendChild(elAlgorithmItem): null;
      elAlgorithmItem.dataset['value'] = algorithmId;
    },
    setAlgorithm(algorithmId: string) {
      if(elMazeAlgorithmList) {
        [...elMazeAlgorithmList.querySelectorAll('li')].forEach(el => {
          el.classList.toggle('selected', el.dataset['value'] === algorithmId);
        });
      }
    },

    toggleSolveButtonCaption(solve: boolean) {
      elSolveButton!.innerHTML = solve ? 'Solve' : 'Clear Solution';
    },

    getSeed() {
      return elSeedInput ? elSeedInput.value: null;
    },

    getValidSizeParameters() {
      // return elSizeParameterList ? [...elSizeParameterList.querySelectorAll('input')].filter(elInput => elInput.checkValidity()).map(el => el.dataset['value']): null;
      return [...elSizeParameterList!.querySelectorAll('input')].filter(elInput => elInput.checkValidity()).map(el => el.dataset['value']);
    },

    inputErrorMessage() {
      const errors = [];
      if(elSizeParameterList) {
        [...elSizeParameterList.querySelectorAll('input')].forEach(elInput => {
          if (!elInput.checkValidity()) {
            errors.push(`Enter a number between ${elInput.min} and ${elInput.max} for ${elInput.dataset['value']}`);
          }
        });

      }

      if (!elSeedInput.checkValidity()) {
        errors.push('Enter between 1 and 9 digits for the Seed');
      }

      return errors.join('\n');
    },
    isMobileLayout,

    updateForNewState(state: string) {
      toggleElementVisibility(elMazeShapeList,      [STATE_INIT].includes(state));
      toggleElementVisibility(elMazeAlgorithmList,  [STATE_INIT].includes(state));
      toggleElementVisibility(elSizeParameterList,  [STATE_INIT].includes(state));
      toggleElementVisibility(elSeedParameterList,  [STATE_INIT].includes(state));
      toggleElementVisibility(elExitsList,          [STATE_INIT].includes(state));
      toggleElementVisibility(elAlgorithmDelayList, [STATE_INIT].includes(state));
      toggleElementVisibility(elCreateMaskButton,   [STATE_INIT].includes(state));

      toggleElementVisibility(elGoButton,           [STATE_INIT, STATE_DISPLAYING].includes(state));
      toggleElementVisibility(elDownloadButton,     [STATE_DISPLAYING, STATE_DISTANCE_MAPPING].includes(state));

      toggleElementVisibility(elChangeParamsButton,    [STATE_DISPLAYING].includes(state));
      toggleElementVisibility(elShowDistanceMapButton, [STATE_DISPLAYING].includes(state));
      toggleElementVisibility(elSolveButton,           [STATE_DISPLAYING].includes(state));
      toggleElementVisibility(elPlayButton,            [STATE_DISPLAYING].includes(state));
      toggleElementVisibility(elStopButton,            [STATE_PLAYING].includes(state));

      toggleElementVisibility(elClearDistanceMapButton, [STATE_DISTANCE_MAPPING].includes(state));

      toggleElementVisibility(elSaveMaskButton, [STATE_MASKING].includes(state));
      toggleElementVisibility(elClearMaskButton, [STATE_MASKING].includes(state));
      toggleElementVisibility(elFinishRunningButton, [STATE_RUNNING_ALGORITHM].includes(state));

      switch(state) {
        case STATE_INIT:
          this.showInfo('Select parameters for your maze and then click <b>New Maze</b>');
          break;
        case STATE_DISPLAYING:
          this.showSeedValue();
          this.toggleSolveButtonCaption(true);
          break;
        case STATE_DISTANCE_MAPPING:
          this.showInfo('Click somewhere in the maze to generate a distance map for that location.<br><br>Cells are coloured according to how difficult they are to reach from your chosen point.');
          break;
        case STATE_PLAYING:
          this.showInfo('');
          break;
        case STATE_RUNNING_ALGORITHM:
          this.showInfo('The maze generation algorithm has been slowed down.<br><br>Click FINISH to skip to the end.');
          break;
        case STATE_MASKING:
          this.showInfo('Define a mask by selecting cells from the grid.<br><br>Masked cells will not be included in your maze');
          break;
        default:
          console.assert(false, 'unexpected state value: ' + state);
      }
    },

    updateMaskButtonCaption(maskAvailable: any) {
      elCreateMaskButton ? elCreateMaskButton.innerHTML = maskAvailable ? 'Edit Mask' : 'Create Mask': null;
    },

    showSeedValue() {
      this.showInfo(`Seed Value:<br><b>${model.randomSeed}</b>`);
    },
    showInfo(msg: string) {
      toggleElementVisibility(elInfo, msg);
      elInfo ? elInfo.innerHTML = msg: null;
    },
    setNavigationInstructions(instructions: any) {
      this.showInfo(instructions);
    },

    on(eventName: any, handler: any) {
      eventTarget.on(eventName, handler);
    }
  };
}