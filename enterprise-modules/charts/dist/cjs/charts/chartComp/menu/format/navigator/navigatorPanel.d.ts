import { Component } from "@ag-grid-community/core";
import { ChartOptionsService } from "../../../chartOptionsService";
export declare class NavigatorPanel extends Component {
    private readonly chartOptionsService;
    static TEMPLATE: string;
    private navigatorGroup;
    private navigatorHeightSlider;
    private chartTranslator;
    constructor(chartOptionsService: ChartOptionsService);
    private init;
    private initNavigator;
    protected destroy(): void;
}
