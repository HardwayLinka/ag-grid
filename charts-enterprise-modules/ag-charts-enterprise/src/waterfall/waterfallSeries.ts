import {
    _ModuleSupport,
    _Scale,
    _Scene,
    _Util,
    AgCartesianSeriesLabelFormatterParams,
    AgTooltipRendererResult,
} from 'ag-charts-community';
import {
    AgWaterfallSeriesFormat,
    AgWaterfallSeriesLabelPlacement,
    AgWaterfallSeriesTooltipRendererParams,
    AgWaterfallSeriesFormatterParams,
} from './typings';

const {
    Validate,
    DataModel,
    Motion,
    SeriesNodePickMode,
    valueProperty,
    keyProperty,
    accumulativeValueProperty,
    trailingAccumulatedValueProperty,
    ChartAxisDirection,
    CartesianSeriesNodeClickEvent,
    CartesianSeriesNodeDoubleClickEvent,
    OPTIONAL,
    NUMBER,
    OPT_NUMBER,
    OPT_STRING,
    OPT_FUNCTION,
    OPT_COLOR_STRING,
    OPT_LINE_DASH,
} = _ModuleSupport;
const { toTooltipHtml, ContinuousScale, Rect } = _Scene;
const { sanitizeHtml, isNumber, checkDatum } = _Util;

const WATERFALL_LABEL_PLACEMENTS: AgWaterfallSeriesLabelPlacement[] = ['start', 'end', 'inside'];
const OPT_WATERFALL_LABEL_PLACEMENT: _ModuleSupport.ValidatePredicate = (v: any, ctx) =>
    OPTIONAL(v, ctx, (v: any) => WATERFALL_LABEL_PLACEMENTS.includes(v));

type WaterfallNodeLabelDatum = Readonly<_Scene.Point> & {
    readonly text: string;
    readonly textAlign: CanvasTextAlign;
    readonly textBaseline: CanvasTextBaseline;
};

interface WaterfallNodeDatum extends _ModuleSupport.CartesianSeriesNodeDatum, Readonly<_Scene.Point> {
    readonly index: number;
    readonly yValue: number;
    readonly cumulativeValue: number;
    readonly width: number;
    readonly height: number;
    readonly label: WaterfallNodeLabelDatum;
    readonly fill?: string;
    readonly stroke?: string;
    readonly strokeWidth: number;
}

class WaterfallSeriesNodeBaseClickEvent extends _ModuleSupport.CartesianSeriesNodeBaseClickEvent<any> {
    readonly labelKey?: string;

    constructor(
        labelKey: string | undefined,
        xKey: string,
        yKey: string,
        nativeEvent: MouseEvent,
        datum: WaterfallNodeDatum,
        series: WaterfallSeries
    ) {
        super(xKey, yKey, nativeEvent, datum, series);
        this.labelKey = labelKey;
    }
}

export class WaterfallSeriesNodeClickEvent extends WaterfallSeriesNodeBaseClickEvent {
    readonly type = 'nodeClick';
}

export class WaterfallSeriesNodeDoubleClickEvent extends WaterfallSeriesNodeBaseClickEvent {
    readonly type = 'nodeDoubleClick';
}

class WaterfallSeriesTooltip extends _ModuleSupport.SeriesTooltip {
    @Validate(OPT_FUNCTION)
    renderer?: (params: AgWaterfallSeriesTooltipRendererParams) => string | AgTooltipRendererResult = undefined;
}

class WaterfallSeriesLabel extends _Scene.Label {
    @Validate(OPT_FUNCTION)
    formatter?: (params: AgCartesianSeriesLabelFormatterParams) => string = undefined;

    @Validate(OPT_WATERFALL_LABEL_PLACEMENT)
    placement: AgWaterfallSeriesLabelPlacement = 'inside';

    @Validate(OPT_NUMBER(0))
    padding: number = 6;
}

class WaterfallSeriesItem {
    @Validate(OPT_STRING)
    name?: string = undefined;

    @Validate(OPT_COLOR_STRING)
    fill: string = '#c16068';

    @Validate(OPT_COLOR_STRING)
    stroke: string = '#c16068';

    @Validate(NUMBER(0, 1))
    fillOpacity = 1;

    @Validate(NUMBER(0, 1))
    strokeOpacity = 1;

    @Validate(OPT_LINE_DASH)
    lineDash?: number[] = [0];

    @Validate(NUMBER(0))
    lineDashOffset: number = 0;

    @Validate(NUMBER(0))
    strokeWidth: number = 1;
}

type SeriesItemType = 'positive' | 'negative';
type Bounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export class WaterfallSeries extends _ModuleSupport.CartesianSeries<
    _ModuleSupport.SeriesNodeDataContext<any>,
    _Scene.Rect
> {
    static className = 'WaterfallSeries';
    static type: 'waterfallBar' | 'waterfallColumn' = 'waterfallColumn' as const;

    readonly label = new WaterfallSeriesLabel();
    readonly positiveItem = new WaterfallSeriesItem();
    readonly negativeItem = new WaterfallSeriesItem();

    tooltip: WaterfallSeriesTooltip = new WaterfallSeriesTooltip();

    set data(input: any[] | undefined) {
        this._data = input;
        this.setSeriesItemEnabled();
    }
    get data() {
        return this._data;
    }

    @Validate(OPT_FUNCTION)
    formatter?: (params: AgWaterfallSeriesFormatterParams<any>) => AgWaterfallSeriesFormat = undefined;

    constructor() {
        super({
            pickModes: [SeriesNodePickMode.EXACT_SHAPE_MATCH],
            pathsPerSeries: 0,
            directionKeys: {
                [ChartAxisDirection.X]: ['xKey'],
                [ChartAxisDirection.Y]: ['yKey'],
            },
        });

        this.label.enabled = false;
    }

    protected resolveKeyDirection(direction: _ModuleSupport.ChartAxisDirection) {
        if (this.getBarDirection() === ChartAxisDirection.X) {
            if (direction === ChartAxisDirection.X) {
                return ChartAxisDirection.Y;
            }
            return ChartAxisDirection.X;
        }
        return direction;
    }

    @Validate(OPT_STRING)
    protected _xKey?: string = undefined;
    set xKey(value: string | undefined) {
        this._xKey = value;
        this.processedData = undefined;
    }
    get xKey(): string | undefined {
        return this._xKey;
    }

    @Validate(OPT_STRING)
    xName?: string = undefined;

    @Validate(OPT_STRING)
    protected _yKey?: string = undefined;
    set yKey(value: string | undefined) {
        this._yKey = value;
        this.processedData = undefined;
    }
    get yKey(): string | undefined {
        return this._yKey;
    }

    @Validate(OPT_STRING)
    yName?: string = undefined;

    shadow?: _Scene.DropShadow = undefined;

    private seriesItemTypes: SeriesItemType[] = ['positive', 'negative'];

    protected readonly seriesItemEnabled = new Map<SeriesItemType, boolean>();
    private setSeriesItemEnabled() {
        const { visible, seriesItemEnabled, seriesItemTypes } = this;
        seriesItemEnabled.clear();
        seriesItemTypes.forEach((item) => seriesItemEnabled.set(item, visible));
    }

    visibleChanged() {
        this.setSeriesItemEnabled();
    }

    async processData() {
        const { xKey, yKey, seriesItemEnabled, data = [] } = this;

        if (!yKey) return;

        const isContinuousX = this.getCategoryAxis()?.scale instanceof ContinuousScale;

        const positivesActive = !!seriesItemEnabled.get('positive');
        const negativesActive = !!seriesItemEnabled.get('negative');

        const isActive = (v: any) => (v >= 0 && positivesActive) || (v < 0 && negativesActive);
        const validation = (v: any) => checkDatum(v, true) != null && isActive(v);

        this.dataModel = new DataModel<any, any, true>({
            props: [
                keyProperty(xKey, isContinuousX),
                accumulativeValueProperty(yKey, true, { id: `yCurrent`, validation, invalidValue: 0 }),
                trailingAccumulatedValueProperty(yKey, true, { id: `yPrevious`, validation, invalidValue: 0 }),
                valueProperty(yKey, true, { id: `yRaw` }), // Raw value pass-through.
            ],
            dataVisible: this.visible,
        });

        this.processedData = this.dataModel.processData(data);
    }

    getDomain(direction: _ModuleSupport.ChartAxisDirection): any[] {
        const { processedData } = this;
        if (!processedData) return [];

        const {
            domain: {
                keys: [keys],
                values: [yExtent],
            },
        } = processedData;

        if (direction === this.getCategoryDirection()) {
            return keys;
        } else {
            const extent = this.fixNumericExtent(yExtent as any);
            const min = extent[0];
            return [min > 0 ? 0 : min, extent[1]];
        }
    }

    protected getNodeClickEvent(
        event: MouseEvent,
        datum: WaterfallNodeDatum
    ): _ModuleSupport.CartesianSeriesNodeClickEvent<any> {
        return new CartesianSeriesNodeClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    protected getNodeDoubleClickEvent(
        event: MouseEvent,
        datum: WaterfallNodeDatum
    ): _ModuleSupport.CartesianSeriesNodeDoubleClickEvent<any> {
        return new CartesianSeriesNodeDoubleClickEvent(this.xKey ?? '', datum.yKey, event, datum, this);
    }

    private getCategoryAxis(): _ModuleSupport.ChartAxis<_Scene.Scale<any, number>> | undefined {
        return this.getCategoryDirection() === ChartAxisDirection.Y ? this.yAxis : this.xAxis;
    }

    private getValueAxis(): _ModuleSupport.ChartAxis<_Scene.Scale<any, number>> | undefined {
        return this.getBarDirection() === ChartAxisDirection.Y ? this.yAxis : this.xAxis;
    }

    async createNodeData() {
        const { data, dataModel, visible } = this;
        const xAxis = this.getCategoryAxis();
        const yAxis = this.getValueAxis();

        if (!(data && visible && xAxis && yAxis && dataModel)) {
            return [];
        }

        const xScale = xAxis.scale;
        const yScale = yAxis.scale;

        const barWidth = xScale.bandwidth || 10;

        const { yKey = '', xKey = '', positiveItem, negativeItem, processedData } = this;

        const nodeData: WaterfallNodeDatum[] = [];

        const yIndex = processedData?.indices.values[yKey] ?? -1;
        const xIndex = processedData?.indices.keys[xKey] ?? -1;
        const yCurrIndex = dataModel.resolveProcessedDataIndexById('yCurrent')?.index ?? -1;
        const yPrevIndex = dataModel.resolveProcessedDataIndexById('yPrevious')?.index ?? -1;

        processedData?.data.forEach(({ keys, datum, values }, dataIndex) => {
            const x = xScale.convert(keys[xIndex]);

            const rawValue = values[yIndex];
            const cumulativeValue = values[yCurrIndex];
            const trailingValue = values[yPrevIndex];

            const currY = yScale.convert(cumulativeValue, { strict: false });
            const prevY = yScale.convert(trailingValue, { strict: false });

            const isPositive = rawValue > 0;
            const y = isPositive ? currY : prevY;
            const bottomY = isPositive ? prevY : currY;

            const rect = {
                x,
                y,
                width: barWidth,
                height: Math.abs(bottomY - y),
            };

            const nodeMidPoint = {
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
            };

            const { fill, stroke, strokeWidth } = isPositive ? positiveItem : negativeItem;

            const nodeDatum: WaterfallNodeDatum = {
                index: dataIndex,
                series: this,
                itemId: yKey,
                datum,
                cumulativeValue,
                yValue: rawValue,
                yKey,
                xKey,
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                nodeMidPoint,
                fill: fill,
                stroke: stroke,
                strokeWidth,
                label: this.createLabelData(isPositive, rawValue, rect),
            };

            nodeData.push(nodeDatum);
        });

        return [{ itemId: this.yKey ?? this.id, nodeData, labelData: nodeData }];
    }

    private createLabelData(isPositive: boolean, rawValue: any, rect: Bounds): WaterfallNodeLabelDatum {
        const { formatter, placement, padding } = this.label;
        let labelText: string;
        if (formatter) {
            labelText = formatter({
                value: isNumber(rawValue) ? rawValue : undefined,
                seriesId: this.id,
            });
        } else {
            labelText = isNumber(rawValue) ? rawValue.toFixed(2) : '';
        }

        const labelX = rect.x + rect.width / 2;
        let labelY = rect.y + rect.height / 2;

        const labelTextAlign: CanvasTextAlign = 'center';
        let labelTextBaseline: CanvasTextBaseline;

        switch (placement) {
            case 'start': {
                labelY = isPositive ? rect.y + rect.height + padding : rect.y - padding;
                labelTextBaseline = isPositive ? 'top' : 'bottom';
                break;
            }
            case 'end': {
                labelY = isPositive ? rect.y - padding : rect.y + rect.height + padding;
                labelTextBaseline = isPositive ? 'bottom' : 'top';
                break;
            }
            case 'inside':
            default: {
                labelTextBaseline = 'middle';
                break;
            }
        }

        return {
            text: labelText,
            textAlign: labelTextAlign,
            textBaseline: labelTextBaseline,
            x: labelX,
            y: labelY,
        };
    }

    protected nodeFactory() {
        return new Rect();
    }

    protected async updateDatumSelection(opts: {
        nodeData: WaterfallNodeDatum[];
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
    }) {
        const { nodeData, datumSelection } = opts;
        const data = nodeData ?? [];
        return datumSelection.update(data);
    }

    protected async updateDatumNodes(opts: {
        datumSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>;
        isHighlight: boolean;
    }) {
        const { datumSelection, isHighlight: isDatumHighlighted } = opts;
        const {
            seriesItemEnabled,
            positiveItem,
            negativeItem,
            shadow,
            formatter,
            xKey = '',
            highlightStyle: {
                item: {
                    fill: highlightedFill,
                    fillOpacity: highlightFillOpacity,
                    stroke: highlightedStroke,
                    strokeWidth: highlightedDatumStrokeWidth,
                },
            },
            id: seriesId,
        } = this;

        const [visibleMin, visibleMax] = this.xAxis?.visibleRange ?? [];
        const isZoomed = visibleMin !== 0 || visibleMax !== 1;
        const crisp = !isZoomed;
        const positivesActive = !!seriesItemEnabled.get('positive');
        const negativesActive = !!seriesItemEnabled.get('negative');

        datumSelection.each((rect, datum) => {
            const isPositive = datum.yValue >= 0;
            const isActive = (datum.yValue >= 0 && positivesActive) || (datum.yValue < 0 && negativesActive);
            const {
                fillOpacity: itemFillOpacity,
                strokeOpacity: itemStrokeOpacity,
                strokeWidth: itemStrokeWidth,
                lineDash: itemLineDash,
                lineDashOffset: itemLineDashOffset,
            } = isPositive ? positiveItem : negativeItem;
            const fill = isDatumHighlighted && highlightedFill !== undefined ? highlightedFill : datum.fill;
            const stroke = isDatumHighlighted && highlightedStroke !== undefined ? highlightedStroke : datum.stroke;
            const strokeWidth =
                isDatumHighlighted && highlightedDatumStrokeWidth !== undefined
                    ? highlightedDatumStrokeWidth
                    : this.getStrokeWidth(itemStrokeWidth, datum);
            const fillOpacity = isDatumHighlighted ? highlightFillOpacity ?? itemFillOpacity : itemFillOpacity;

            let format: AgWaterfallSeriesFormat | undefined = undefined;
            if (formatter) {
                format = formatter({
                    datum: datum.datum,
                    fill,
                    stroke,
                    strokeWidth,
                    highlighted: isDatumHighlighted,
                    xKey,
                    yKey: datum.yKey,
                    seriesId,
                });
            }
            rect.crisp = crisp;
            rect.fill = format?.fill ?? fill;
            rect.stroke = format?.stroke ?? stroke;
            rect.strokeWidth = format?.strokeWidth ?? strokeWidth;
            rect.fillOpacity = fillOpacity;
            rect.strokeOpacity = itemStrokeOpacity;
            rect.lineDash = itemLineDash;
            rect.lineDashOffset = itemLineDashOffset;
            rect.fillShadow = shadow;
            // Prevent stroke from rendering for zero height columns and zero width bars.
            rect.visible =
                this.getCategoryDirection() === ChartAxisDirection.X ? datum.width > 0 : datum.height > 0 && isActive;
        });
    }

    protected async updateLabelSelection(opts: {
        labelData: WaterfallNodeDatum[];
        labelSelection: _Scene.Selection<_Scene.Text, WaterfallNodeDatum>;
    }) {
        const { labelData, labelSelection } = opts;
        const { enabled } = this.label;
        const data = enabled ? labelData : [];

        return labelSelection.update(data);
    }

    protected async updateLabelNodes(opts: { labelSelection: _Scene.Selection<_Scene.Text, any> }) {
        const { labelSelection } = opts;
        const {
            seriesItemEnabled,
            label: { enabled: labelEnabled, fontStyle, fontWeight, fontSize, fontFamily, color },
        } = this;

        const positivesActive = !!seriesItemEnabled.get('positive');
        const negativesActive = !!seriesItemEnabled.get('negative');

        labelSelection.each((text, datum) => {
            const label = datum.label;

            const isActive = (datum.yValue >= 0 && positivesActive) || (datum.yValue < 0 && negativesActive);
            if (label && labelEnabled) {
                text.fontStyle = fontStyle;
                text.fontWeight = fontWeight;
                text.fontSize = fontSize;
                text.fontFamily = fontFamily;
                text.textAlign = label.textAlign;
                text.textBaseline = label.textBaseline;
                text.text = label.text;
                text.x = label.x;
                text.y = label.y;
                text.fill = color;
                text.visible = isActive;
            } else {
                text.visible = false;
            }
        });
    }

    getTooltipHtml(nodeDatum: WaterfallNodeDatum): string {
        const { xKey, yKey, xAxis, yAxis } = this;

        if (!xKey || !yKey || !xAxis || !yAxis) {
            return '';
        }

        const { formatter, tooltip, xName, yName, id: seriesId, positiveItem, negativeItem } = this;

        const datum = nodeDatum.datum;
        const xValue = datum[xKey];
        const yValue = datum[yKey];

        let format: any | undefined = undefined;

        const isPositive = yValue > 0;
        const { fill, strokeWidth, name } = isPositive ? positiveItem : negativeItem;

        const color = format?.fill ?? fill ?? 'gray';

        if (formatter) {
            format = formatter({
                datum: nodeDatum,
                xKey,
                yKey,
                fill,
                strokeWidth,
                highlighted: false,
                seriesId,
            });
        }

        const xString = sanitizeHtml(xAxis.formatDatum(xValue));
        const yString = sanitizeHtml(yAxis.formatDatum(yValue));

        const title = sanitizeHtml(yName);
        const content =
            `<b>${sanitizeHtml(name ?? xName ?? xKey)}</b>: ${xString}<br>` +
            `<b>${sanitizeHtml(name ?? yName ?? yKey)}</b>: ${yString}`;

        const defaults: AgTooltipRendererResult = {
            title,
            content,
            backgroundColor: color,
        };

        const { renderer: tooltipRenderer } = tooltip;

        if (tooltipRenderer) {
            return toTooltipHtml(
                tooltipRenderer({
                    datum,
                    xKey,
                    xValue,
                    xName,
                    yKey,
                    yValue,
                    yName,
                    color,
                    seriesId,
                }),
                defaults
            );
        }

        return toTooltipHtml(defaults);
    }

    getLegendData(): _ModuleSupport.CategoryLegendDatum[] {
        const { id, seriesItemTypes, seriesItemEnabled, yKey, yName, positiveItem, negativeItem } = this;

        const legendData: _ModuleSupport.CategoryLegendDatum[] = [];
        for (let index = 0; index < seriesItemTypes.length; index++) {
            const item = seriesItemTypes[index];
            const { fill, stroke, fillOpacity, strokeOpacity, name } =
                item === 'positive' ? positiveItem : negativeItem;
            legendData.push({
                legendType: 'category',
                id,
                itemId: item,
                seriesId: id,
                enabled: !!seriesItemEnabled.get(item),
                label: {
                    text: `${name ?? yName ?? yKey}`,
                },
                marker: {
                    fill,
                    stroke,
                    fillOpacity: fillOpacity,
                    strokeOpacity: strokeOpacity,
                },
            });
        }

        return legendData;
    }

    // TODO: fix legend
    onLegendItemClick(event: _ModuleSupport.LegendItemClickChartEvent) {
        const { enabled, itemId, series } = event;

        if (series.id !== this.id) {
            return;
        }
        this.toggleSeriesItem(itemId, enabled);
    }

    protected toggleSeriesItem(itemId: SeriesItemType, enabled: boolean): void {
        this.seriesItemEnabled.set(itemId, enabled);
        this.nodeDataRefresh = true;
    }

    animateEmptyUpdateReady({
        datumSelections,
        labelSelections,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
        labelSelections: Array<_Scene.Selection<_Scene.Text, WaterfallNodeDatum>>;
    }) {
        const duration = 1000;

        datumSelections.forEach((datumSelection) => {
            datumSelection.each((rect, datum, index) => {
                const yTransition = {
                    from: 0,
                    to: 0,
                };
                if (datum.yValue >= 0) {
                    yTransition.from = datum.y + datum.height;
                    yTransition.to = datum.y;
                } else {
                    yTransition.from = datum.y;
                    yTransition.to = datum.y;
                }
                this.animationManager?.animateMany(
                    `${this.id}_empty-update-ready_${rect.id}`,
                    [yTransition, { from: 0, to: datum.height }],
                    {
                        disableInteractions: true,
                        duration,
                        delay: 200 * index,
                        ease: Motion.linear,
                        repeat: 0,
                        onUpdate([y, height]) {
                            rect.y = y;
                            rect.height = height;

                            rect.x = datum.x;
                            rect.width = datum.width;
                        },
                    }
                );
            });
        });

        labelSelections.forEach((labelSelection) => {
            labelSelection.each((label, _, index) => {
                this.animationManager?.animate(`${this.id}_empty-update-ready_${label.id}`, {
                    from: 0,
                    to: 1,
                    delay: duration - duration / 10 + 200 * index,
                    duration: duration / 10,
                    ease: Motion.linear,
                    repeat: 0,
                    onUpdate: (opacity) => {
                        label.opacity = opacity;
                    },
                });
            });
        });
    }

    animateReadyUpdate({
        datumSelections,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
    }) {
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    animateReadyHighlight(highlightSelection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>) {
        this.resetSelectionRects(highlightSelection);
    }

    animateReadyResize({
        datumSelections,
    }: {
        datumSelections: Array<_Scene.Selection<_Scene.Rect, WaterfallNodeDatum>>;
    }) {
        this.animationManager?.stop();
        datumSelections.forEach((datumSelection) => {
            this.resetSelectionRects(datumSelection);
        });
    }

    resetSelectionRects(selection: _Scene.Selection<_Scene.Rect, WaterfallNodeDatum>) {
        selection.each((rect, datum) => {
            rect.x = datum.x;
            rect.y = datum.y;
            rect.width = datum.width;
            rect.height = datum.height;
        });
    }

    protected isLabelEnabled() {
        return this.label.enabled;
    }

    protected getBarDirection() {
        return ChartAxisDirection.Y;
    }

    protected getCategoryDirection() {
        return _ModuleSupport.ChartAxisDirection.X;
    }

    getBandScalePadding() {
        return { inner: 0.2, outer: 0.3 };
    }
}
