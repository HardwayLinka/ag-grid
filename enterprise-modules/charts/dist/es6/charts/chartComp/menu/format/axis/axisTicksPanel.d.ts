import { Component } from "@ag-grid-community/core";
import { ChartOptionsService } from "../../../chartOptionsService";
export declare class AxisTicksPanel extends Component {
    private readonly chartOptionsService;
    static TEMPLATE: string;
    private axisTicksGroup;
    private axisTicksColorPicker;
    private axisTicksWidthSlider;
    private axisTicksSizeSlider;
    private chartTranslator;
    constructor(chartOptionsService: ChartOptionsService);
    private init;
    private initAxisTicks;
}
