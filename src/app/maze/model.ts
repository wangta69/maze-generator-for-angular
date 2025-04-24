import {Shape} from './config';
export type Model = {
    shape: Shape,
    size: any,
    mask: any,
    algorithmDelay: number,
    exitConfig: string,
    algorithm?: string,
    maze?: any, // () =>{}
    randomSeed?: number,
    playState?: any,
    runningAlgorithm?: any
}
export function buildModel() {
   const model: Model = {
       shape: 'square',
       size: {},
       mask: {},
       algorithmDelay: 0,
       exitConfig: 'vertical',
   };

    return model;
}