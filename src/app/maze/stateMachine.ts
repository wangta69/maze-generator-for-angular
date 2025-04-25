import {buildEventTarget} from './lib/utils.js';

export type State = {
  state: string,
  init: () => void,
  masking: () => void,
  displaying: () => void,
  distanceMapping: () => void,
  playing: () => void,
  runningAlgorithm: () => void,
  onStateChange: (handler: any) => void,
};

export const STATE_INIT = 'Init',
  STATE_MASKING = 'Masking',
  STATE_DISPLAYING = 'Displaying',
  STATE_DISTANCE_MAPPING = 'Distance Mapping',
  STATE_RUNNING_ALGORITHM = 'Running Algorithm',
  STATE_PLAYING = 'Playing';

export function buildStateMachine() {
  const eventTarget = buildEventTarget('stateMachine');
  const EVENT_STATE_CHANGED = 'stateChanged';
  let state = STATE_INIT;

  function ifStateIsOneOf(...validStates: any) {
    return {
      thenChangeTo(newState: any) {
        if (validStates.includes(state)) {
          console.debug('State changed to', newState);
          state = newState;
          eventTarget.trigger(EVENT_STATE_CHANGED, newState);

        } else if (state === newState) {
          console.debug('Ignoring redundant state transition', state);

        } else {
          console.warn(`Unexpected state transition requested: ${state} -> ${newState}`);
        }
      }
    }
  }

  return {
      get state() {
        return state;  
      },
      init() {
        ifStateIsOneOf(STATE_DISPLAYING, STATE_MASKING, STATE_DISTANCE_MAPPING)
          .thenChangeTo(STATE_INIT);
      },
      masking() {
        ifStateIsOneOf(STATE_INIT, STATE_DISPLAYING)
          .thenChangeTo(STATE_MASKING);
      },
      displaying() {
        ifStateIsOneOf(STATE_INIT, STATE_MASKING, STATE_PLAYING, STATE_DISTANCE_MAPPING, STATE_RUNNING_ALGORITHM)
          .thenChangeTo(STATE_DISPLAYING);
      },
      distanceMapping() {
        ifStateIsOneOf(STATE_DISPLAYING)
          .thenChangeTo(STATE_DISTANCE_MAPPING);
      },
      playing() {
        ifStateIsOneOf(STATE_DISPLAYING)
          .thenChangeTo(STATE_PLAYING);
      },
      runningAlgorithm() {
        ifStateIsOneOf(STATE_INIT, STATE_DISPLAYING)
          .thenChangeTo(STATE_RUNNING_ALGORITHM);
      },
      onStateChange(handler: any) {
        eventTarget.on(EVENT_STATE_CHANGED, handler);
      }
  };

}