var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { _, Autowired, BeanStub, ChartType, Events, PostConstruct, } from "@ag-grid-community/core";
import { ChartDataModel } from "./chartDataModel";
import { getChartTheme } from "ag-charts-community";
var ChartController = /** @class */ (function (_super) {
    __extends(ChartController, _super);
    function ChartController(model) {
        var _this = _super.call(this) || this;
        _this.model = model;
        return _this;
    }
    ChartController.prototype.init = function () {
        var _this = this;
        this.setChartRange();
        this.addManagedListener(this.eventService, Events.EVENT_RANGE_SELECTION_CHANGED, function (event) {
            if (event.id && event.id === _this.model.getChartId()) {
                _this.updateForRangeChange();
            }
        });
        if (this.model.isUnlinked()) {
            if (this.rangeService) {
                this.rangeService.setCellRanges([]);
            }
        }
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_MOVED, this.updateForGridChange.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_PINNED, this.updateForGridChange.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_VISIBLE, this.updateForGridChange.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_COLUMN_ROW_GROUP_CHANGED, this.updateForGridChange.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_MODEL_UPDATED, this.updateForGridChange.bind(this));
        this.addManagedListener(this.eventService, Events.EVENT_CELL_VALUE_CHANGED, this.updateForDataChange.bind(this));
    };
    ChartController.prototype.updateForGridChange = function () {
        if (this.model.isUnlinked()) {
            return;
        }
        this.model.updateCellRanges();
        this.setChartRange();
    };
    ChartController.prototype.updateForDataChange = function () {
        if (this.model.isUnlinked()) {
            return;
        }
        this.model.updateData();
        this.raiseChartUpdatedEvent();
    };
    ChartController.prototype.updateForRangeChange = function () {
        this.updateForGridChange();
        this.raiseChartRangeSelectionChangedEvent();
    };
    ChartController.prototype.updateForPanelChange = function (updatedCol) {
        this.model.updateCellRanges(updatedCol);
        this.setChartRange();
        this.raiseChartRangeSelectionChangedEvent();
    };
    ChartController.prototype.getChartModel = function () {
        var modelType = this.model.isPivotChart() ? 'pivot' : 'range';
        return {
            modelType: modelType,
            chartId: this.model.getChartId(),
            chartType: this.model.getChartType(),
            chartThemeName: this.getThemeName(),
            chartOptions: this.chartProxy.getChartOptions(),
            cellRange: this.model.getCellRangeParams(),
            suppressChartRanges: this.model.isSuppressChartRanges(),
            aggFunc: this.model.getAggFunc(),
            unlinkChart: this.model.isUnlinked(),
        };
    };
    ChartController.prototype.getChartType = function () {
        return this.model.getChartType();
    };
    ChartController.prototype.isPivotChart = function () {
        return this.model.isPivotChart();
    };
    ChartController.prototype.isGrouping = function () {
        return this.model.isGrouping();
    };
    ChartController.prototype.getThemeName = function () {
        return this.model.getChartThemeName();
    };
    ChartController.prototype.getThemes = function () {
        return this.gridOptionsWrapper.getChartThemes();
    };
    ChartController.prototype.getPalettes = function () {
        var _this = this;
        var themeNames = this.gridOptionsWrapper.getChartThemes();
        return themeNames.map(function (themeName) {
            var stockTheme = _this.chartProxy.isStockTheme(themeName);
            var theme = stockTheme ? themeName : _this.chartProxy.lookupCustomChartTheme(themeName);
            return getChartTheme(theme).palette;
        });
    };
    ChartController.prototype.setChartType = function (chartType) {
        this.model.setChartType(chartType);
        this.raiseChartUpdatedEvent();
        this.raiseChartOptionsChangedEvent();
    };
    ChartController.prototype.setChartThemeName = function (chartThemeName) {
        this.model.setChartThemeName(chartThemeName);
        this.raiseChartUpdatedEvent();
        this.raiseChartOptionsChangedEvent();
    };
    ChartController.prototype.getColStateForMenu = function () {
        return { dimensionCols: this.model.getDimensionColState(), valueCols: this.model.getValueColState() };
    };
    ChartController.prototype.isDefaultCategorySelected = function () {
        return this.model.getSelectedDimension().colId === ChartDataModel.DEFAULT_CATEGORY;
    };
    ChartController.prototype.setChartRange = function (silent) {
        if (silent === void 0) { silent = false; }
        if (this.rangeService && !this.model.isSuppressChartRanges() && !this.model.isUnlinked()) {
            this.rangeService.setCellRanges(this.model.getCellRanges());
        }
        if (!silent) {
            this.raiseChartUpdatedEvent();
        }
    };
    ChartController.prototype.detachChartRange = function () {
        // when chart is detached it won't listen to changes from the grid
        this.model.toggleUnlinked();
        if (this.model.isUnlinked()) {
            // remove range from grid
            if (this.rangeService) {
                this.rangeService.setCellRanges([]);
            }
        }
        else {
            // update chart data may have changed
            this.updateForGridChange();
        }
    };
    ChartController.prototype.setChartProxy = function (chartProxy) {
        this.chartProxy = chartProxy;
    };
    ChartController.prototype.getChartProxy = function () {
        return this.chartProxy;
    };
    ChartController.prototype.isActiveXYChart = function () {
        return _.includes([ChartType.Scatter, ChartType.Bubble], this.getChartType());
    };
    ChartController.prototype.isChartLinked = function () {
        return !this.model.isUnlinked();
    };
    ChartController.prototype.raiseChartUpdatedEvent = function () {
        var event = Object.freeze({
            type: ChartController.EVENT_CHART_UPDATED
        });
        this.dispatchEvent(event);
    };
    ChartController.prototype.raiseChartOptionsChangedEvent = function () {
        var _a = this.getChartModel(), chartId = _a.chartId, chartType = _a.chartType;
        var event = Object.freeze({
            type: Events.EVENT_CHART_OPTIONS_CHANGED,
            chartId: chartId,
            chartType: chartType,
            chartThemeName: this.getThemeName(),
            chartOptions: this.chartProxy.getChartOptions(),
            api: this.gridApi,
            columnApi: this.columnApi,
        });
        this.eventService.dispatchEvent(event);
    };
    ChartController.prototype.raiseChartRangeSelectionChangedEvent = function () {
        var event = Object.freeze({
            type: Events.EVENT_CHART_RANGE_SELECTION_CHANGED,
            id: this.model.getChartId(),
            chartId: this.model.getChartId(),
            cellRange: this.model.getCellRangeParams(),
            api: this.gridApi,
            columnApi: this.columnApi,
        });
        this.eventService.dispatchEvent(event);
    };
    ChartController.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        if (this.rangeService) {
            this.rangeService.setCellRanges([]);
        }
    };
    ChartController.EVENT_CHART_UPDATED = 'chartUpdated';
    __decorate([
        Autowired('rangeService')
    ], ChartController.prototype, "rangeService", void 0);
    __decorate([
        Autowired('gridApi')
    ], ChartController.prototype, "gridApi", void 0);
    __decorate([
        Autowired('columnApi')
    ], ChartController.prototype, "columnApi", void 0);
    __decorate([
        PostConstruct
    ], ChartController.prototype, "init", null);
    return ChartController;
}(BeanStub));
export { ChartController };
