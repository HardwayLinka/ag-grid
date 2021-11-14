import { AgChartThemeOverrides, ChartType } from "@ag-grid-community/core";
import { AgChartTheme, Chart, ChartTheme } from "ag-charts-community";
import { CrossFilteringContext } from "../../chartService";
import { ChartThemeOverrideObjectName } from "../chartThemeOverridesMapper";
export interface ChartProxyParams {
    chartType: ChartType;
    customChartThemes?: {
        [name: string]: AgChartTheme;
    };
    parentElement: HTMLElement;
    grouping: boolean;
    getChartThemeName: () => string;
    getChartThemes: () => string[];
    getGridOptionsChartThemeOverrides: () => AgChartThemeOverrides | undefined;
    apiChartThemeOverrides?: AgChartThemeOverrides;
    crossFiltering: boolean;
    crossFilterCallback: (event: any, reset?: boolean) => void;
    chartOptionsToRestore?: AgChartThemeOverrides;
}
export interface FieldDefinition {
    colId: string;
    displayName: string | null;
}
export interface UpdateChartParams {
    data: any[];
    grouping: boolean;
    category: {
        id: string;
        name: string;
        chartDataType?: string;
    };
    fields: FieldDefinition[];
    chartId?: string;
    getCrossFilteringContext: () => CrossFilteringContext;
}
export declare abstract class ChartProxy {
    protected readonly chartProxyParams: ChartProxyParams;
    protected readonly chartType: ChartType;
    protected readonly standaloneChartType: ChartThemeOverrideObjectName;
    protected chart: Chart;
    protected chartOptions: AgChartThemeOverrides;
    protected chartTheme: ChartTheme;
    protected crossFiltering: boolean;
    protected crossFilterCallback: (event: any, reset?: boolean) => void;
    protected constructor(chartProxyParams: ChartProxyParams);
    protected abstract create(): Chart;
    abstract update(params: UpdateChartParams): void;
    createChart(): void;
    private createChartTheme;
    isStockTheme(themeName: string): boolean;
    private getSelectedTheme;
    lookupCustomChartTheme(name: string): AgChartTheme;
    private static mergeThemeOverrides;
    downloadChart(): void;
    getChartImageDataURL(type?: string): string;
    getChartOptions(): AgChartThemeOverrides;
    getChart(): Chart;
    protected transformData(data: any[], categoryKey: string): any[];
    private convertConfigToOverrides;
    destroy(): void;
    protected destroyChart(): void;
}
