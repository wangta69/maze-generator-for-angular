import {buildEventTarget} from './utils';

export const EVENT_CLICK = 'click';

export const drawingSurfaces: any = {
    canvas(config: any) {
        const eventTarget = buildEventTarget('drawingSurfaces.canvas'),
            {el} = config,
            ctx = el.getContext('2d');


        function onClick(event: any) {
            eventTarget.trigger(EVENT_CLICK, {
                x: invXCoord(event.offsetX),
                y: invYCoord(event.offsetY),
                rawX: event.offsetX,
                rawY: event.offsetY,
                shift: event.shiftKey,
                alt: event.altKey
            });
        }
        el.addEventListener(EVENT_CLICK, onClick);

        let magnification = 1, xOffset:number, yOffset: number;
        function xCoord(x: number) {
            return xOffset + x * magnification;
        }
        function invXCoord(x: number) {
            return (x - xOffset) / magnification;
        }
        function yCoord(y: number) {
            return yOffset + y * magnification;
        }
        function invYCoord(y: number) {
            return (y - yOffset) / magnification;
        }
        function distance(d: number) {
            return d * magnification;
        }

        return {
            clear() {
                ctx.clearRect(0, 0, el.width, el.height);
            },
            setSpaceRequirements(requiredWidth: number, requiredHeight: number, shapeSpecificLineWidthAdjustment = 1) {
                const {width,height} = el,
                    GLOBAL_LINE_WIDTH_ADJUSTMENT = 0.1,
                    verticalLineWidth = height * GLOBAL_LINE_WIDTH_ADJUSTMENT * shapeSpecificLineWidthAdjustment / requiredHeight,
                    horizontalLineWidth = width * GLOBAL_LINE_WIDTH_ADJUSTMENT * shapeSpecificLineWidthAdjustment / requiredWidth,
                    lineWidth = Math.min(verticalLineWidth, horizontalLineWidth);

                magnification = Math.min((width - lineWidth)/requiredWidth, (height - lineWidth)/requiredHeight);
                ctx.lineWidth = lineWidth;
                ctx.lineCap = 'round';
                xOffset = lineWidth / 2;
                yOffset = lineWidth / 2;
            },
            setColour(colour: string) {
                ctx.strokeStyle = colour;
                ctx.fillStyle = colour;
            },
            line(x1: number, y1: number, x2: number, y2: number, existingPath = false) {
                existingPath || ctx.beginPath();
                ctx.moveTo(xCoord(x1), yCoord(y1));
                ctx.lineTo(xCoord(x2), yCoord(y2));
                existingPath || ctx.stroke();
            },
            arc(cx: number, cy: number, r: number, startAngle: number, endAngle: number, counterclockwise = false, existingPath = false) {
                existingPath || ctx.beginPath();
                ctx.arc(xCoord(cx), yCoord(cy), distance(r), startAngle - Math.PI / 2, endAngle - Math.PI / 2, counterclockwise);
                existingPath || ctx.stroke();
            },
            fillPolygon(...xyPoints: {x:number, y:number}[]) {
                ctx.beginPath();
                xyPoints.forEach(({x,y}, i) => {
                    if (i) {
                        ctx.lineTo(xCoord(x), yCoord(y));
                    } else {
                        ctx.moveTo(xCoord(x), yCoord(y));
                    }
                });
                ctx.closePath();
                ctx.fill();
            },
            fillSegment(cx: number, cy: number, smallR: number, bigR: number, startAngle: number, endAngle: number) {
                const
                    innerStartX = cx + smallR * Math.sin(startAngle),
                    innerStartY = cy - smallR * Math.cos(startAngle),
                    innerEndX = cx + smallR * Math.sin(endAngle),
                    innerEndY = cy - smallR * Math.cos(endAngle),
                    outerStartX = cx + bigR * Math.sin(startAngle),
                    outerStartY = cy - bigR * Math.cos(startAngle),
                    outerEndX = cx + bigR * Math.sin(endAngle),
                    outerEndY = cy - bigR * Math.cos(endAngle);
                ctx.beginPath();
                this.line(innerStartX, innerStartY, outerStartX, outerStartY, true);
                this.arc(cx, cy, bigR, startAngle, endAngle, false, true);
                this.line(outerEndX, outerEndY, innerEndX, innerEndY, true);
                this.arc(cx, cy, smallR, endAngle, startAngle, true, true);
                ctx.closePath();
                ctx.fill();
            },
            convertCoords(x: number, y: number) {
                return [xCoord(x), yCoord(y)];
            },
            on(eventName:string, handler: any) {
                eventTarget.on(eventName, handler);
            },
            dispose() {
                eventTarget.off();
                el.removeEventListener(EVENT_CLICK, onClick);
            }
        };
    },
    svg(config: any) {
        const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
        const eventTarget = buildEventTarget('drawingSurfaces.svg'),
            {el} = config,
            width = Number(el.getAttribute('width')),
            height = Number(el.getAttribute('height'));

        el.addEventListener(EVENT_CLICK, (event: any) => {
            eventTarget.trigger(EVENT_CLICK, {
                x: invXCoord(event.offsetX),
                y: invYCoord(event.offsetY),
                shift: event.shiftKey,
                alt: event.altKey
            });
        });

        let magnification = 1, colour='black', lineWidth: number, xOffset: number, yOffset: number;
        function xCoord(x: number) {
            return xOffset + x * magnification;
        }
        function invXCoord(x: number) {
            return (x - xOffset) / magnification;
        }
        function yCoord(y: number) {
            return yOffset + y * magnification;
        }
        function invYCoord(y: number) {
            return (y - yOffset) / magnification;
        }
        function distance(d: number) {
            return d * magnification;
        }

        function polarToXy(cx: number, cy: number, d: number, angle: number) {
            return [xCoord(cx + d * Math.sin(angle)), yCoord(cy - d * Math.cos(angle))];
        }

        return {
            clear() {
                el.innerHTML = '';
            },
            setSpaceRequirements(requiredWidth: number, requiredHeight: number, shapeSpecificLineWidthAdjustment = 1) {
                const GLOBAL_LINE_WIDTH_ADJUSTMENT = 0.1,
                    verticalLineWidth = height * GLOBAL_LINE_WIDTH_ADJUSTMENT * shapeSpecificLineWidthAdjustment / requiredHeight,
                    horizontalLineWidth = width * GLOBAL_LINE_WIDTH_ADJUSTMENT * shapeSpecificLineWidthAdjustment / requiredWidth;

                lineWidth = Math.min(verticalLineWidth, horizontalLineWidth);
                magnification = Math.min((width - lineWidth)/requiredWidth, (height - lineWidth)/requiredHeight);
                xOffset = lineWidth / 2;
                yOffset = lineWidth / 2;

            },
            setColour(newColour: string) {
                colour = newColour;
            },
            line(x1: number, y1: number, x2: number, y2: number) {
                const elLine = document.createElementNS(SVG_NAMESPACE, 'line');
                elLine.setAttribute('x1', xCoord(x1).toString());
                elLine.setAttribute('y1', yCoord(y1).toString());
                elLine.setAttribute('x2', xCoord(x2).toString());
                elLine.setAttribute('y2', yCoord(y2).toString());
                elLine.setAttribute('stroke', colour);
                elLine.setAttribute('stroke-width', lineWidth.toString());
                elLine.setAttribute('stroke-linecap', 'round');
                el.appendChild(elLine);
            },
            fillPolygon(...xyPoints:{x:number, y: number}[]) {
                const elLine = document.createElementNS(SVG_NAMESPACE, 'polygon'),
                    coordPairs: any[] = [];
                xyPoints.forEach(({x,y}, i) => {
                    coordPairs.push(`${xCoord(x)},${yCoord(y)}`);
                });
                elLine.setAttribute('points', coordPairs.join(' '));
                elLine.setAttribute('fill', colour);
                el.appendChild(elLine);
            },
            fillSegment(cx: number, cy: number, smallR: number, bigR: number, startAngle: number, endAngle: number) {
                const isCircle = (endAngle - startAngle === Math.PI * 2);

                if (isCircle) {
                    const elCircle = document.createElementNS(SVG_NAMESPACE, 'circle');
                    elCircle.setAttribute('cx', xCoord(cx).toString());
                    elCircle.setAttribute('cy', yCoord(cy).toString());
                    elCircle.setAttribute('r', distance(bigR - smallR).toString());
                    elCircle.setAttribute('fill', colour);
                    el.appendChild(elCircle);

                } else {
                    const
                        innerStartX = xCoord(cx + smallR * Math.sin(startAngle)),
                        innerStartY = yCoord(cy - smallR * Math.cos(startAngle)),
                        innerEndX = xCoord(cx + smallR * Math.sin(endAngle)),
                        innerEndY = yCoord(cy - smallR * Math.cos(endAngle)),
                        outerStartX = xCoord(cx + bigR * Math.sin(startAngle)),
                        outerStartY = yCoord(cy - bigR * Math.cos(startAngle)),
                        outerEndX = xCoord(cx + bigR * Math.sin(endAngle)),
                        outerEndY = yCoord(cy - bigR * Math.cos(endAngle)),
                        isLargeArc = endAngle - startAngle > Math.PI / 2,
                        elPath = document.createElementNS(SVG_NAMESPACE, 'path'),
                        d = `        
                            M ${innerStartX} ${innerStartY} ${outerStartX} ${outerStartY}
                            A ${distance(bigR)} ${distance(bigR)} 0 ${isLargeArc ? "1" : "0"} 1 ${outerEndX} ${outerEndY}
                            L ${innerEndX} ${innerEndY}
                            A ${distance(smallR)} ${distance(smallR)} 0 ${isLargeArc ? "1" : "0"} 0 ${innerStartX} ${innerStartY}
                        `;
                    elPath.setAttribute('fill', colour);
                    elPath.setAttribute('d', d);
                    el.appendChild(elPath);
                }
            },
            arc(cx:number, cy:number, r:number, startAngle:number, endAngle:number) {
                const [startX, startY] = polarToXy(cx, cy, r, startAngle),
                    [endX, endY] = polarToXy(cx, cy, r, endAngle),
                    radius = distance(r),
                    isLargeArc = endAngle - startAngle > Math.PI/2,
                    d = `M ${startX} ${startY} A ${radius} ${radius} 0 ${isLargeArc ? "1" : "0"} 1 ${endX} ${endY}`,
                    elPath = document.createElementNS(SVG_NAMESPACE, 'path');
                elPath.setAttribute('d', d);
                elPath.setAttribute('fill', 'none');
                elPath.setAttribute('stroke', colour);
                elPath.setAttribute('stroke-width', lineWidth.toString());
                elPath.setAttribute('stroke-linecap', 'round');
                el.appendChild(elPath);
            },
            convertCoords(x:number, y:number) {
                return [xCoord(x), yCoord(y)];
            },
            on(eventName: string, handler: any) {
                eventTarget.on(eventName, handler);
            },
            dispose() {
                eventTarget.off();
            }
        };
    }
}