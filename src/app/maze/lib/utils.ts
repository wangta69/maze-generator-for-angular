
export function forEachContiguousPair(array: any[], fn:(arg1: number, arg2: number)=>{}) {
  "use strict";
  console.assert(array.length >= 2);
  for (let i=0; i<array.length-1; i++) {
    fn(array[i], array[i+1]);
  }
}

export function buildEventTarget(name: string) {
  "use strict";
  const eventTarget = new EventTarget(),
    handlers: any[] = [];

  return {
      trigger(eventName: any, eventData?: any) {
        const event: any = new Event(eventName);
        event.data = eventData;
        eventTarget.dispatchEvent(event);
        // console.log('EVENT', name, eventName, eventData);
      },
      on(eventName: any, handler: any) {
        const eventHandler = (event:any) => handler(event.data);
        handlers.push({eventName, eventHandler});
        eventTarget.addEventListener(eventName, eventHandler);
      },
      off(eventNameToRemove?: any) {
        let i = handlers.length;
        while (i--) {
          const {eventName, eventHandler} = handlers[i];
          if (!eventNameToRemove || eventName === eventNameToRemove) {
            eventTarget.removeEventListener(eventName, eventHandler);
            handlers.splice(i, 1);
          }
        }
      }
  };
}
