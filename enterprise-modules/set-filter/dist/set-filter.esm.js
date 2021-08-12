/**
 * @ag-grid-enterprise/set-filter - Advanced Data Grid / Data Table supporting Javascript / React / AngularJS / Web Components * @version v26.0.0
 * @link http://www.ag-grid.com/
' * @license Commercial
 */

import { _, EventService, TextFilter, Constants, AgPromise, Autowired, RefSelector, PostConstruct, Component, PositionableFeature, KeyCode, Events, VirtualList, ProvidedFilter, ModuleNames } from '@ag-grid-community/core';
import { EnterpriseCoreModule } from '@ag-grid-enterprise/core';

var ClientSideValuesExtractor = /** @class */ (function () {
    function ClientSideValuesExtractor(rowModel, colDef, valueGetter) {
        this.rowModel = rowModel;
        this.colDef = colDef;
        this.valueGetter = valueGetter;
    }
    ClientSideValuesExtractor.prototype.extractUniqueValues = function (predicate) {
        var _this = this;
        var values = new Set();
        var keyCreator = this.colDef.keyCreator;
        this.rowModel.forEachLeafNode(function (node) {
            // only pull values from rows that have data. this means we skip filler group nodes.
            if (!node.data || !predicate(node)) {
                return;
            }
            var value = _this.valueGetter(node);
            if (keyCreator) {
                value = keyCreator({ value: value });
            }
            value = _.makeNull(value);
            if (value != null && Array.isArray(value)) {
                _.forEach(value, function (x) {
                    var formatted = _.toStringOrNull(_.makeNull(x));
                    values.add(formatted);
                });
            }
            else {
                values.add(_.toStringOrNull(value));
            }
        });
        return _.values(values);
    };
    return ClientSideValuesExtractor;
}());

var SetFilterModelValuesType;
(function (SetFilterModelValuesType) {
    SetFilterModelValuesType[SetFilterModelValuesType["PROVIDED_LIST"] = 0] = "PROVIDED_LIST";
    SetFilterModelValuesType[SetFilterModelValuesType["PROVIDED_CALLBACK"] = 1] = "PROVIDED_CALLBACK";
    SetFilterModelValuesType[SetFilterModelValuesType["TAKEN_FROM_GRID_VALUES"] = 2] = "TAKEN_FROM_GRID_VALUES";
})(SetFilterModelValuesType || (SetFilterModelValuesType = {}));
var SetValueModel = /** @class */ (function () {
    function SetValueModel(filterParams, setIsLoading, valueFormatterService, translate) {
        var _this = this;
        this.filterParams = filterParams;
        this.setIsLoading = setIsLoading;
        this.valueFormatterService = valueFormatterService;
        this.translate = translate;
        this.localEventService = new EventService();
        this.miniFilterText = null;
        // The lookup for a set is much faster than the lookup for an array, especially when the length of the array is
        // thousands of records long, so where lookups are important we use a set.
        /** Values provided to the filter for use. */
        this.providedValues = null;
        /** All possible values for the filter, sorted if required. */
        this.allValues = [];
        /** Remaining values when filters from other columns have been applied. */
        this.availableValues = new Set();
        /** All values that are currently displayed, after the mini-filter has been applied. */
        this.displayedValues = [];
        /** Values that have been selected for this filter. */
        this.selectedValues = new Set();
        this.initialised = false;
        var column = filterParams.column, colDef = filterParams.colDef, textFormatter = filterParams.textFormatter, doesRowPassOtherFilter = filterParams.doesRowPassOtherFilter, suppressSorting = filterParams.suppressSorting, comparator = filterParams.comparator, rowModel = filterParams.rowModel, valueGetter = filterParams.valueGetter, values = filterParams.values;
        this.column = column;
        this.colDef = colDef;
        this.formatter = textFormatter || TextFilter.DEFAULT_FORMATTER;
        this.doesRowPassOtherFilters = doesRowPassOtherFilter;
        this.suppressSorting = suppressSorting || false;
        this.comparator = comparator || colDef.comparator || _.defaultComparator;
        if (rowModel.getType() === Constants.ROW_MODEL_TYPE_CLIENT_SIDE) {
            this.clientSideValuesExtractor = new ClientSideValuesExtractor(rowModel, colDef, valueGetter);
        }
        if (values == null) {
            this.valuesType = SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES;
        }
        else {
            this.valuesType = Array.isArray(values) ?
                SetFilterModelValuesType.PROVIDED_LIST :
                SetFilterModelValuesType.PROVIDED_CALLBACK;
            this.providedValues = values;
        }
        this.updateAllValues().then(function (updatedValues) { return _this.resetSelectionState(updatedValues || []); });
    }
    SetValueModel.prototype.addEventListener = function (eventType, listener, async) {
        this.localEventService.addEventListener(eventType, listener, async);
    };
    SetValueModel.prototype.removeEventListener = function (eventType, listener, async) {
        this.localEventService.removeEventListener(eventType, listener, async);
    };
    /**
     * Re-fetches the values used in the filter from the value source.
     * If keepSelection is false, the filter selection will be reset to everything selected,
     * otherwise the current selection will be preserved.
     */
    SetValueModel.prototype.refreshValues = function (keepSelection) {
        if (keepSelection === void 0) { keepSelection = true; }
        var currentModel = this.getModel();
        this.updateAllValues();
        // ensure model is updated for new values
        return this.setModel(keepSelection ? currentModel : null);
    };
    /**
     * Overrides the current values being used for the set filter.
     * If keepSelection is false, the filter selection will be reset to everything selected,
     * otherwise the current selection will be preserved.
     */
    SetValueModel.prototype.overrideValues = function (valuesToUse, keepSelection) {
        var _this = this;
        if (keepSelection === void 0) { keepSelection = true; }
        return new AgPromise(function (resolve) {
            // wait for any existing values to be populated before overriding
            _this.allValuesPromise.then(function () {
                _this.valuesType = SetFilterModelValuesType.PROVIDED_LIST;
                _this.providedValues = valuesToUse;
                _this.refreshValues(keepSelection).then(function () { return resolve(); });
            });
        });
    };
    SetValueModel.prototype.refreshAfterAnyFilterChanged = function () {
        var _this = this;
        return this.showAvailableOnly() ?
            this.allValuesPromise.then(function (values) { return _this.updateAvailableValues(values || []); }) :
            AgPromise.resolve();
    };
    SetValueModel.prototype.isInitialised = function () {
        return this.initialised;
    };
    SetValueModel.prototype.updateAllValues = function () {
        var _this = this;
        this.allValuesPromise = new AgPromise(function (resolve) {
            switch (_this.valuesType) {
                case SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES:
                case SetFilterModelValuesType.PROVIDED_LIST: {
                    var values = _this.valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES ?
                        _this.getValuesFromRows(false) : _.toStrings(_this.providedValues);
                    var sortedValues = _this.sortValues(values || []);
                    _this.allValues = sortedValues;
                    resolve(sortedValues);
                    break;
                }
                case SetFilterModelValuesType.PROVIDED_CALLBACK: {
                    _this.setIsLoading(true);
                    var callback_1 = _this.providedValues;
                    var params_1 = {
                        success: function (values) {
                            var processedValues = _.toStrings(values);
                            _this.setIsLoading(false);
                            var sortedValues = _this.sortValues(processedValues || []);
                            _this.allValues = sortedValues;
                            resolve(sortedValues);
                        },
                        colDef: _this.colDef
                    };
                    window.setTimeout(function () { return callback_1(params_1); }, 0);
                    break;
                }
                default:
                    throw new Error('Unrecognised valuesType');
            }
        });
        this.allValuesPromise.then(function (values) { return _this.updateAvailableValues(values || []); }).then(function () { return _this.initialised = true; });
        return this.allValuesPromise;
    };
    SetValueModel.prototype.setValuesType = function (value) {
        this.valuesType = value;
    };
    SetValueModel.prototype.getValuesType = function () {
        return this.valuesType;
    };
    SetValueModel.prototype.isValueAvailable = function (value) {
        return this.availableValues.has(value);
    };
    SetValueModel.prototype.showAvailableOnly = function () {
        return this.valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES &&
            !this.filterParams.suppressRemoveEntries;
    };
    SetValueModel.prototype.updateAvailableValues = function (allValues) {
        var availableValues = this.showAvailableOnly() ? this.sortValues(this.getValuesFromRows(true)) : allValues;
        this.availableValues = _.convertToSet(availableValues);
        this.localEventService.dispatchEvent({ type: SetValueModel.EVENT_AVAILABLE_VALUES_CHANGED });
        this.updateDisplayedValues();
    };
    SetValueModel.prototype.sortValues = function (values) {
        if (this.suppressSorting) {
            return values;
        }
        if (!this.filterParams.excelMode || values.indexOf(null) < 0) {
            return values.sort(this.comparator);
        }
        // ensure the blank value always appears last
        return _.filter(values, function (v) { return v != null; }).sort(this.comparator).concat(null);
    };
    SetValueModel.prototype.getValuesFromRows = function (removeUnavailableValues) {
        var _this = this;
        if (removeUnavailableValues === void 0) { removeUnavailableValues = false; }
        if (!this.clientSideValuesExtractor) {
            console.error('AG Grid: Set Filter cannot initialise because you are using a row model that does not contain all rows in the browser. Either use a different filter type, or configure Set Filter such that you provide it with values');
            return [];
        }
        var predicate = function (node) { return (!removeUnavailableValues || _this.doesRowPassOtherFilters(node)); };
        return this.clientSideValuesExtractor.extractUniqueValues(predicate);
    };
    /** Sets mini filter value. Returns true if it changed from last value, otherwise false. */
    SetValueModel.prototype.setMiniFilter = function (value) {
        value = _.makeNull(value);
        if (this.miniFilterText === value) {
            //do nothing if filter has not changed
            return false;
        }
        this.miniFilterText = value;
        this.updateDisplayedValues();
        return true;
    };
    SetValueModel.prototype.getMiniFilter = function () {
        return this.miniFilterText;
    };
    SetValueModel.prototype.updateDisplayedValues = function () {
        var _this = this;
        // if no filter, just display all available values
        if (this.miniFilterText == null) {
            this.displayedValues = _.values(this.availableValues);
            return;
        }
        // if filter present, we filter down the list
        this.displayedValues = [];
        // to allow for case insensitive searches, upper-case both filter text and value
        var formattedFilterText = (this.formatter(this.miniFilterText) || '').toUpperCase();
        var matchesFilter = function (valueToCheck) {
            return valueToCheck != null && valueToCheck.toUpperCase().indexOf(formattedFilterText) >= 0;
        };
        this.availableValues.forEach(function (value) {
            if (value == null) {
                if (_this.filterParams.excelMode && matchesFilter(_this.translate('blanks'))) {
                    _this.displayedValues.push(value);
                }
            }
            else {
                var textFormatterValue = _this.formatter(value);
                // TODO: should this be applying the text formatter *after* the value formatter?
                var valueFormatterValue = _this.valueFormatterService.formatValue(_this.column, null, null, textFormatterValue, _this.filterParams.valueFormatter, false);
                if (matchesFilter(textFormatterValue) || matchesFilter(valueFormatterValue)) {
                    _this.displayedValues.push(value);
                }
            }
        });
    };
    SetValueModel.prototype.getDisplayedValueCount = function () {
        return this.displayedValues.length;
    };
    SetValueModel.prototype.getDisplayedValue = function (index) {
        return this.displayedValues[index];
    };
    SetValueModel.prototype.hasSelections = function () {
        return this.filterParams.defaultToNothingSelected ?
            this.selectedValues.size > 0 :
            this.allValues.length !== this.selectedValues.size;
    };
    SetValueModel.prototype.getUniqueValueCount = function () {
        return this.allValues.length;
    };
    SetValueModel.prototype.getUniqueValue = function (index) {
        return this.allValues[index];
    };
    SetValueModel.prototype.getValues = function () {
        return this.allValues.slice();
    };
    SetValueModel.prototype.selectAllMatchingMiniFilter = function (clearExistingSelection) {
        var _this = this;
        if (clearExistingSelection === void 0) { clearExistingSelection = false; }
        if (this.miniFilterText == null) {
            // ensure everything is selected
            this.selectedValues = _.convertToSet(this.allValues);
        }
        else {
            // ensure everything that matches the mini filter is selected
            if (clearExistingSelection) {
                this.selectedValues.clear();
            }
            _.forEach(this.displayedValues, function (value) { return _this.selectedValues.add(value); });
        }
    };
    SetValueModel.prototype.deselectAllMatchingMiniFilter = function () {
        var _this = this;
        if (this.miniFilterText == null) {
            // ensure everything is deselected
            this.selectedValues.clear();
        }
        else {
            // ensure everything that matches the mini filter is deselected
            _.forEach(this.displayedValues, function (value) { return _this.selectedValues.delete(value); });
        }
    };
    SetValueModel.prototype.selectValue = function (value) {
        this.selectedValues.add(value);
    };
    SetValueModel.prototype.deselectValue = function (value) {
        if (this.filterParams.excelMode && this.isEverythingVisibleSelected()) {
            // ensure we're starting from the correct "everything selected" state
            this.resetSelectionState(this.displayedValues);
        }
        this.selectedValues.delete(value);
    };
    SetValueModel.prototype.isValueSelected = function (value) {
        return this.selectedValues.has(value);
    };
    SetValueModel.prototype.isEverythingVisibleSelected = function () {
        var _this = this;
        return _.filter(this.displayedValues, function (it) { return _this.isValueSelected(it); }).length === this.displayedValues.length;
    };
    SetValueModel.prototype.isNothingVisibleSelected = function () {
        var _this = this;
        return _.filter(this.displayedValues, function (it) { return _this.isValueSelected(it); }).length === 0;
    };
    SetValueModel.prototype.getModel = function () {
        return this.hasSelections() ? _.values(this.selectedValues) : null;
    };
    SetValueModel.prototype.setModel = function (model) {
        var _this = this;
        return this.allValuesPromise.then(function (values) {
            if (model == null) {
                _this.resetSelectionState(values || []);
            }
            else {
                // select all values from the model that exist in the filter
                _this.selectedValues.clear();
                var allValues_1 = _.convertToSet(values || []);
                _.forEach(model, function (value) {
                    if (allValues_1.has(value)) {
                        _this.selectedValues.add(value);
                    }
                });
            }
        });
    };
    SetValueModel.prototype.resetSelectionState = function (values) {
        if (this.filterParams.defaultToNothingSelected) {
            this.selectedValues.clear();
        }
        else {
            this.selectedValues = _.convertToSet(values || []);
        }
    };
    SetValueModel.EVENT_AVAILABLE_VALUES_CHANGED = 'availableValuesChanged';
    return SetValueModel;
}());

var __extends = (undefined && undefined.__extends) || (function () {
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
var __decorate = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SetFilterListItem = /** @class */ (function (_super) {
    __extends(SetFilterListItem, _super);
    function SetFilterListItem(value, params, translate, isSelected) {
        var _this = _super.call(this, SetFilterListItem.TEMPLATE) || this;
        _this.value = value;
        _this.params = params;
        _this.translate = translate;
        _this.isSelected = isSelected;
        return _this;
    }
    SetFilterListItem.prototype.init = function () {
        var _this = this;
        this.render();
        this.eCheckbox.setValue(this.isSelected, true);
        this.eCheckbox.onValueChange(function (value) {
            var parsedValue = value || false;
            _this.isSelected = parsedValue;
            var event = {
                type: SetFilterListItem.EVENT_SELECTION_CHANGED,
                isSelected: parsedValue,
            };
            _this.dispatchEvent(event);
        });
    };
    SetFilterListItem.prototype.toggleSelected = function () {
        this.isSelected = !this.isSelected;
        this.eCheckbox.setValue(this.isSelected);
    };
    SetFilterListItem.prototype.render = function () {
        var column = this.params.column;
        var value = this.value;
        var formattedValue = null;
        if (typeof value === 'function') {
            value = value();
        }
        else {
            formattedValue = this.getFormattedValue(this.params, column, value);
        }
        if (this.params.showTooltips) {
            var tooltipValue = formattedValue != null ? formattedValue : value;
            this.setTooltip(tooltipValue);
        }
        var params = {
            value: value,
            valueFormatted: formattedValue,
            api: this.gridOptionsWrapper.getApi(),
            context: this.gridOptionsWrapper.getContext()
        };
        this.renderCell(params);
    };
    SetFilterListItem.prototype.getTooltipParams = function () {
        var res = _super.prototype.getTooltipParams.call(this);
        res.location = 'setFilterValue';
        res.colDef = this.getComponentHolder();
        return res;
    };
    SetFilterListItem.prototype.getFormattedValue = function (filterParams, column, value) {
        var formatter = filterParams && filterParams.valueFormatter;
        return this.valueFormatterService.formatValue(column, null, null, value, formatter, false);
    };
    SetFilterListItem.prototype.renderCell = function (params) {
        var _this = this;
        var cellRendererPromise = this.userComponentFactory.newSetFilterCellRenderer(this.params, params);
        if (cellRendererPromise == null) {
            var valueToRender = params.valueFormatted == null ? params.value : params.valueFormatted;
            this.eCheckbox.setLabel(valueToRender == null ? this.translate('blanks') : valueToRender);
            return;
        }
        cellRendererPromise.then(function (component) {
            if (component) {
                _this.eCheckbox.setLabel(component.getGui());
                _this.addDestroyFunc(function () { return _this.destroyBean(component); });
            }
        });
    };
    SetFilterListItem.prototype.getComponentHolder = function () {
        return this.params.column.getColDef();
    };
    SetFilterListItem.EVENT_SELECTION_CHANGED = 'selectionChanged';
    SetFilterListItem.TEMPLATE = "\n        <div class=\"ag-set-filter-item\">\n            <ag-checkbox ref=\"eCheckbox\" class=\"ag-set-filter-item-checkbox\"></ag-checkbox>\n        </div>";
    __decorate([
        Autowired('valueFormatterService')
    ], SetFilterListItem.prototype, "valueFormatterService", void 0);
    __decorate([
        Autowired('userComponentFactory')
    ], SetFilterListItem.prototype, "userComponentFactory", void 0);
    __decorate([
        RefSelector('eCheckbox')
    ], SetFilterListItem.prototype, "eCheckbox", void 0);
    __decorate([
        PostConstruct
    ], SetFilterListItem.prototype, "init", null);
    return SetFilterListItem;
}(Component));

var DEFAULT_LOCALE_TEXT = {
    loadingOoo: 'Loading...',
    blanks: '(Blanks)',
    searchOoo: 'Search...',
    selectAll: '(Select All)',
    selectAllSearchResults: '(Select All Search Results)',
    noMatches: 'No matches.'
};

var __extends$1 = (undefined && undefined.__extends) || (function () {
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
var __decorate$1 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SetFilter = /** @class */ (function (_super) {
    __extends$1(SetFilter, _super);
    function SetFilter() {
        var _this = _super.call(this, 'setFilter') || this;
        _this.valueModel = null;
        _this.setFilterParams = null;
        _this.virtualList = null;
        // To make the filtering super fast, we store the values in an object, and check for the boolean value.
        // Although Set would be a more natural choice of data structure, its performance across browsers is
        // significantly worse than using an object: https://jsbench.me/hdk91jbw1h/
        _this.appliedModelValues = null;
        return _this;
    }
    SetFilter.prototype.postConstruct = function () {
        _super.prototype.postConstruct.call(this);
        this.positionableFeature = new PositionableFeature(this.eSetFilterList, { forcePopupParentAsOffsetParent: true });
        this.createBean(this.positionableFeature);
    };
    // unlike the simple filters, nothing in the set filter UI shows/hides.
    // maybe this method belongs in abstractSimpleFilter???
    SetFilter.prototype.updateUiVisibility = function () { };
    SetFilter.prototype.createBodyTemplate = function () {
        return /* html */ "\n            <div class=\"ag-set-filter\">\n                <div ref=\"eFilterLoading\" class=\"ag-filter-loading ag-hidden\">" + this.translateForSetFilter('loadingOoo') + "</div>\n                <ag-input-text-field class=\"ag-mini-filter\" ref=\"eMiniFilter\"></ag-input-text-field>\n                <div ref=\"eFilterNoMatches\" class=\"ag-filter-no-matches ag-hidden\">" + this.translateForSetFilter('noMatches') + "</div>\n                <div ref=\"eSetFilterList\" class=\"ag-set-filter-list\" role=\"presentation\"></div>\n            </div>";
    };
    SetFilter.prototype.handleKeyDown = function (e) {
        if (e.defaultPrevented) {
            return;
        }
        switch (e.which || e.keyCode) {
            case KeyCode.SPACE:
                this.handleKeySpace(e);
                break;
            case KeyCode.ENTER:
                this.handleKeyEnter(e);
                break;
        }
    };
    SetFilter.prototype.handleKeySpace = function (e) {
        if (!this.eSetFilterList.contains(document.activeElement) || !this.virtualList) {
            return;
        }
        var currentItem = this.virtualList.getLastFocusedRow();
        if (currentItem != null) {
            var component = this.virtualList.getComponentAt(currentItem);
            if (component) {
                e.preventDefault();
                component.toggleSelected();
            }
        }
    };
    SetFilter.prototype.handleKeyEnter = function (e) {
        if (!this.setFilterParams) {
            return;
        }
        if (this.setFilterParams.excelMode) {
            e.preventDefault();
            // in Excel Mode, hitting Enter is the same as pressing the Apply button
            this.onBtApply(false, false, e);
            if (this.setFilterParams.excelMode === 'mac') {
                // in Mac version, select all the input text
                this.eMiniFilter.getInputElement().select();
            }
        }
    };
    SetFilter.prototype.getCssIdentifier = function () {
        return 'set-filter';
    };
    SetFilter.prototype.setModelAndRefresh = function (values) {
        var _this = this;
        return this.valueModel ? this.valueModel.setModel(values).then(function () { return _this.refresh(); }) : AgPromise.resolve();
    };
    SetFilter.prototype.resetUiToDefaults = function () {
        this.setMiniFilter(null);
        return this.setModelAndRefresh(null);
    };
    SetFilter.prototype.setModelIntoUi = function (model) {
        this.setMiniFilter(null);
        if (model instanceof Array) {
            var message_1 = 'AG Grid: The Set Filter Model is no longer an array and models as arrays are ' +
                'deprecated. Please check the docs on what the set filter model looks like. Future versions of ' +
                'AG Grid will have the array version of the model removed.';
            _.doOnce(function () { return console.warn(message_1); }, 'setFilter.modelAsArray');
        }
        // also supporting old filter model for backwards compatibility
        var values = model == null ? null : (model instanceof Array ? model : model.values);
        return this.setModelAndRefresh(values);
    };
    SetFilter.prototype.getModelFromUi = function () {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var values = this.valueModel.getModel();
        if (!values) {
            return null;
        }
        if (this.gridOptionsWrapper.isEnableOldSetFilterModel()) {
            // this is a hack, it breaks casting rules, to apply with old model
            return values;
        }
        return { values: values, filterType: this.getFilterType() };
    };
    SetFilter.prototype.getModel = function () {
        return _super.prototype.getModel.call(this);
    };
    SetFilter.prototype.getFilterType = function () {
        return 'set';
    };
    SetFilter.prototype.getValueModel = function () {
        return this.valueModel;
    };
    SetFilter.prototype.areModelsEqual = function (a, b) {
        // both are missing
        if (a == null && b == null) {
            return true;
        }
        return a != null && b != null && _.areEqual(a.values, b.values);
    };
    SetFilter.prototype.setParams = function (params) {
        var _this = this;
        this.applyExcelModeOptions(params);
        _super.prototype.setParams.call(this, params);
        this.checkSetFilterDeprecatedParams(params);
        this.setFilterParams = params;
        this.valueModel = new SetValueModel(params, function (loading) { return _this.showOrHideLoadingScreen(loading); }, this.valueFormatterService, function (key) { return _this.translateForSetFilter(key); });
        this.initialiseFilterBodyUi();
        if (params.rowModel.getType() === Constants.ROW_MODEL_TYPE_CLIENT_SIDE &&
            !params.values &&
            !params.suppressSyncValuesAfterDataChange) {
            this.addEventListenersForDataChanges();
        }
    };
    SetFilter.prototype.applyExcelModeOptions = function (params) {
        // apply default options to match Excel behaviour, unless they have already been specified
        if (params.excelMode === 'windows') {
            if (!params.buttons) {
                params.buttons = ['apply', 'cancel'];
            }
            if (params.closeOnApply == null) {
                params.closeOnApply = true;
            }
        }
        else if (params.excelMode === 'mac') {
            if (!params.buttons) {
                params.buttons = ['reset'];
            }
            if (params.applyMiniFilterWhileTyping == null) {
                params.applyMiniFilterWhileTyping = true;
            }
            if (params.debounceMs == null) {
                params.debounceMs = 500;
            }
        }
    };
    SetFilter.prototype.checkSetFilterDeprecatedParams = function (params) {
        if (params.syncValuesLikeExcel) {
            var message_2 = 'AG Grid: since version 22.x, the Set Filter param syncValuesLikeExcel is no longer' +
                ' used as this is the default behaviour. To turn this default behaviour off, use the' +
                ' param suppressSyncValuesAfterDataChange';
            _.doOnce(function () { return console.warn(message_2); }, 'syncValuesLikeExcel deprecated');
        }
        if (params.selectAllOnMiniFilter) {
            var message_3 = 'AG Grid: since version 22.x, the Set Filter param selectAllOnMiniFilter is no longer' +
                ' used as this is the default behaviour.';
            _.doOnce(function () { return console.warn(message_3); }, 'selectAllOnMiniFilter deprecated');
        }
        if (params.suppressSyncValuesAfterDataChange) {
            var message_4 = 'AG Grid: since version 23.1, the Set Filter param suppressSyncValuesAfterDataChange has' +
                ' been deprecated and will be removed in a future major release.';
            _.doOnce(function () { return console.warn(message_4); }, 'suppressSyncValuesAfterDataChange deprecated');
        }
        if (params.suppressRemoveEntries) {
            var message_5 = 'AG Grid: since version 23.1, the Set Filter param suppressRemoveEntries has' +
                ' been deprecated and will be removed in a future major release.';
            _.doOnce(function () { return console.warn(message_5); }, 'suppressRemoveEntries deprecated');
        }
    };
    SetFilter.prototype.addEventListenersForDataChanges = function () {
        var _this = this;
        this.addManagedListener(this.eventService, Events.EVENT_ROW_DATA_UPDATED, function () { return _this.syncAfterDataChange(); });
        this.addManagedListener(this.eventService, Events.EVENT_CELL_VALUE_CHANGED, function (event) {
            // only interested in changes to do with this column
            if (_this.setFilterParams && event.column === _this.setFilterParams.column) {
                _this.syncAfterDataChange();
            }
        });
    };
    SetFilter.prototype.syncAfterDataChange = function (refreshValues, keepSelection) {
        var _this = this;
        if (refreshValues === void 0) { refreshValues = true; }
        if (keepSelection === void 0) { keepSelection = true; }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var promise = AgPromise.resolve();
        if (refreshValues) {
            promise = this.valueModel.refreshValues(keepSelection);
        }
        else if (!keepSelection) {
            promise = this.valueModel.setModel(null);
        }
        return promise.then(function () {
            _this.refresh();
            _this.onBtApply(false, true);
        });
    };
    /** @deprecated since version 23.2. The loading screen is displayed automatically when the set filter is retrieving values. */
    SetFilter.prototype.setLoading = function (loading) {
        var message = 'AG Grid: since version 23.2, setLoading has been deprecated. The loading screen is displayed automatically when the set filter is retrieving values.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.setLoading');
        this.showOrHideLoadingScreen(loading);
    };
    SetFilter.prototype.showOrHideLoadingScreen = function (isLoading) {
        _.setDisplayed(this.eFilterLoading, isLoading);
    };
    SetFilter.prototype.initialiseFilterBodyUi = function () {
        this.initVirtualList();
        this.initMiniFilter();
    };
    SetFilter.prototype.initVirtualList = function () {
        var _this = this;
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var virtualList = this.virtualList = this.createBean(new VirtualList('filter'));
        var eSetFilterList = this.getRefElement('eSetFilterList');
        if (eSetFilterList) {
            eSetFilterList.appendChild(virtualList.getGui());
        }
        var cellHeight = this.setFilterParams.cellHeight;
        if (cellHeight != null) {
            virtualList.setRowHeight(cellHeight);
        }
        virtualList.setComponentCreator(function (value) { return _this.createSetListItem(value); });
        var model;
        if (this.setFilterParams.suppressSelectAll) {
            model = new ModelWrapper(this.valueModel);
        }
        else {
            model = new ModelWrapperWithSelectAll(this.valueModel, function () { return _this.isSelectAllSelected(); });
        }
        virtualList.setModel(model);
    };
    SetFilter.prototype.getSelectAllLabel = function () {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var key = this.valueModel.getMiniFilter() == null || !this.setFilterParams.excelMode ?
            'selectAll' : 'selectAllSearchResults';
        return this.translateForSetFilter(key);
    };
    SetFilter.prototype.createSetListItem = function (value) {
        var _this = this;
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var listItem;
        if (value === SetFilter.SELECT_ALL_VALUE) {
            listItem = this.createBean(new SetFilterListItem(function () { return _this.getSelectAllLabel(); }, this.setFilterParams, function (key) { return _this.translateForSetFilter(key); }, this.isSelectAllSelected()));
            listItem.addEventListener(SetFilterListItem.EVENT_SELECTION_CHANGED, function (e) { return _this.onSelectAll(e.isSelected); });
            return listItem;
        }
        listItem = this.createBean(new SetFilterListItem(value, this.setFilterParams, function (key) { return _this.translateForSetFilter(key); }, this.valueModel.isValueSelected(value)));
        listItem.addEventListener(SetFilterListItem.EVENT_SELECTION_CHANGED, function (e) { return _this.onItemSelected(value, e.isSelected); });
        return listItem;
    };
    SetFilter.prototype.initMiniFilter = function () {
        var _this = this;
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var _a = this, eMiniFilter = _a.eMiniFilter, gridOptionsWrapper = _a.gridOptionsWrapper;
        var translate = gridOptionsWrapper.getLocaleTextFunc();
        _.setDisplayed(eMiniFilter.getGui(), !this.setFilterParams.suppressMiniFilter);
        eMiniFilter.setValue(this.valueModel.getMiniFilter());
        eMiniFilter.onValueChange(function () { return _this.onMiniFilterInput(); });
        eMiniFilter.setInputAriaLabel(translate('ariaSearchFilterValues', 'Search filter values'));
        this.addManagedListener(eMiniFilter.getInputElement(), 'keypress', function (e) { return _this.onMiniFilterKeyPress(e); });
    };
    // we need to have the GUI attached before we can draw the virtual rows, as the
    // virtual row logic needs info about the GUI state
    SetFilter.prototype.afterGuiAttached = function (params) {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        _super.prototype.afterGuiAttached.call(this, params);
        this.refreshVirtualList();
        if (this.setFilterParams.excelMode) {
            this.resetUiToActiveModel();
        }
        var eMiniFilter = this.eMiniFilter;
        eMiniFilter.setInputPlaceholder(this.translateForSetFilter('searchOoo'));
        if (!params || !params.suppressFocus) {
            eMiniFilter.getFocusableElement().focus();
        }
        var resizable = !!(params && params.container === 'floatingFilter');
        var resizableObject;
        if (this.gridOptionsWrapper.isEnableRtl()) {
            resizableObject = { bottom: true, bottomLeft: true, left: true };
        }
        else {
            resizableObject = { bottom: true, bottomRight: true, right: true };
        }
        if (resizable) {
            this.positionableFeature.restoreLastSize();
            this.positionableFeature.setResizable(resizableObject);
        }
        else {
            this.positionableFeature.removeSizeFromEl();
            this.positionableFeature.setResizable(false);
        }
    };
    SetFilter.prototype.applyModel = function () {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (this.setFilterParams.excelMode && this.valueModel.isEverythingVisibleSelected()) {
            // In Excel, if the filter is applied with all visible values selected, then any active filter on the
            // column is removed. This ensures the filter is removed in this situation.
            this.valueModel.selectAllMatchingMiniFilter();
        }
        var result = _super.prototype.applyModel.call(this);
        // keep appliedModelValues in sync with the applied model
        var appliedModel = this.getModel();
        if (appliedModel) {
            this.appliedModelValues = _.reduce(appliedModel.values, function (values, value) {
                values[String(value)] = true;
                return values;
            }, {});
        }
        else {
            this.appliedModelValues = null;
        }
        return result;
    };
    SetFilter.prototype.isModelValid = function (model) {
        return this.setFilterParams && this.setFilterParams.excelMode ? model == null || model.values.length > 0 : true;
    };
    SetFilter.prototype.doesFilterPass = function (params) {
        var _this = this;
        if (!this.setFilterParams || !this.valueModel || !this.appliedModelValues) {
            return true;
        }
        var _a = this.setFilterParams, valueGetter = _a.valueGetter, keyCreator = _a.colDef.keyCreator;
        var value = valueGetter(params.node);
        if (keyCreator) {
            value = keyCreator({ value: value });
        }
        value = _.makeNull(value);
        if (Array.isArray(value)) {
            return _.some(value, function (v) { return _this.appliedModelValues[_.makeNull(v)] === true; });
        }
        // Comparing against a value performs better than just checking for undefined
        // https://jsbench.me/hdk91jbw1h/
        return this.appliedModelValues[value] === true;
    };
    SetFilter.prototype.onNewRowsLoaded = function () {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var valuesType = this.valueModel.getValuesType();
        var keepSelection = this.isNewRowsActionKeep();
        this.syncAfterDataChange(valuesType === SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES, keepSelection);
    };
    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can change the value of the filter once
     * the filter has been already started
     * @param options The options to use.
     */
    SetFilter.prototype.setFilterValues = function (options) {
        var _this = this;
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.overrideValues(options, this.isNewRowsActionKeep()).then(function () {
            _this.refresh();
            _this.onUiChanged();
        });
    };
    //noinspection JSUnusedGlobalSymbols
    /**
     * Public method provided so the user can reset the values of the filter once that it has started.
     */
    SetFilter.prototype.resetFilterValues = function () {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.setValuesType(SetFilterModelValuesType.TAKEN_FROM_GRID_VALUES);
        this.syncAfterDataChange(true, this.isNewRowsActionKeep());
    };
    SetFilter.prototype.refreshFilterValues = function () {
        var _this = this;
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        // the model is still being initialised
        if (!this.valueModel.isInitialised()) {
            return;
        }
        this.valueModel.refreshValues().then(function () {
            _this.refresh();
            _this.onUiChanged();
        });
    };
    SetFilter.prototype.onAnyFilterChanged = function () {
        var _this = this;
        // don't block the current action when updating the values for this filter
        setTimeout(function () {
            if (!_this.isAlive()) {
                return;
            }
            if (!_this.valueModel) {
                throw new Error('Value model has not been created.');
            }
            _this.valueModel.refreshAfterAnyFilterChanged().then(function () { return _this.refresh(); });
        }, 0);
    };
    SetFilter.prototype.onMiniFilterInput = function () {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (this.valueModel.setMiniFilter(this.eMiniFilter.getValue())) {
            if (this.setFilterParams.applyMiniFilterWhileTyping) {
                this.filterOnAllVisibleValues(false);
            }
            else {
                this.updateUiAfterMiniFilterChange();
            }
        }
    };
    SetFilter.prototype.updateUiAfterMiniFilterChange = function () {
        if (!this.setFilterParams) {
            throw new Error('Set filter params have not been provided.');
        }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (this.setFilterParams.excelMode) {
            if (this.valueModel.getMiniFilter() == null) {
                this.resetUiToActiveModel();
            }
            else {
                this.valueModel.selectAllMatchingMiniFilter(true);
                this.refresh();
                this.onUiChanged();
            }
        }
        else {
            this.refresh();
        }
        this.showOrHideResults();
    };
    SetFilter.prototype.showOrHideResults = function () {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        var hideResults = this.valueModel.getMiniFilter() != null && this.valueModel.getDisplayedValueCount() < 1;
        _.setDisplayed(this.eNoMatches, hideResults);
        _.setDisplayed(this.eSetFilterList, !hideResults);
    };
    SetFilter.prototype.resetUiToActiveModel = function () {
        var _this = this;
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.eMiniFilter.setValue(null, true);
        this.valueModel.setMiniFilter(null);
        this.setModelIntoUi(this.getModel()).then(function () { return _this.onUiChanged(false, 'prevent'); });
    };
    SetFilter.prototype.onMiniFilterKeyPress = function (e) {
        if (_.isKeyPressed(e, KeyCode.ENTER) && (!this.setFilterParams || !this.setFilterParams.excelMode)) {
            this.filterOnAllVisibleValues();
        }
    };
    SetFilter.prototype.filterOnAllVisibleValues = function (applyImmediately) {
        if (applyImmediately === void 0) { applyImmediately = true; }
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.selectAllMatchingMiniFilter(true);
        this.refresh();
        this.onUiChanged(false, applyImmediately ? 'immediately' : 'debounce');
        this.showOrHideResults();
    };
    SetFilter.prototype.focusRowIfAlive = function (rowIndex) {
        var _this = this;
        if (rowIndex == null) {
            return;
        }
        window.setTimeout(function () {
            if (!_this.virtualList) {
                throw new Error('Virtual list has not been created.');
            }
            if (_this.isAlive()) {
                _this.virtualList.focusRow(rowIndex);
            }
        }, 0);
    };
    SetFilter.prototype.onSelectAll = function (isSelected) {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (!this.virtualList) {
            throw new Error('Virtual list has not been created.');
        }
        if (isSelected) {
            this.valueModel.selectAllMatchingMiniFilter();
        }
        else {
            this.valueModel.deselectAllMatchingMiniFilter();
        }
        var focusedRow = this.virtualList.getLastFocusedRow();
        this.refresh();
        this.onUiChanged();
        this.focusRowIfAlive(focusedRow);
    };
    SetFilter.prototype.onItemSelected = function (value, isSelected) {
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        if (!this.virtualList) {
            throw new Error('Virtual list has not been created.');
        }
        if (isSelected) {
            this.valueModel.selectValue(value);
        }
        else {
            this.valueModel.deselectValue(value);
        }
        var focusedRow = this.virtualList.getLastFocusedRow();
        this.refresh();
        this.onUiChanged();
        this.focusRowIfAlive(focusedRow);
    };
    SetFilter.prototype.setMiniFilter = function (newMiniFilter) {
        this.eMiniFilter.setValue(newMiniFilter);
        this.onMiniFilterInput();
    };
    SetFilter.prototype.getMiniFilter = function () {
        return this.valueModel ? this.valueModel.getMiniFilter() : null;
    };
    /** @deprecated since version 23.2. Please use setModel instead. */
    SetFilter.prototype.selectEverything = function () {
        var message = 'AG Grid: since version 23.2, selectEverything has been deprecated. Please use setModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.selectEverything');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.selectAllMatchingMiniFilter();
        this.refresh();
    };
    /** @deprecated since version 23.2. Please use setModel instead. */
    SetFilter.prototype.selectNothing = function () {
        var message = 'AG Grid: since version 23.2, selectNothing has been deprecated. Please use setModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.selectNothing');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.deselectAllMatchingMiniFilter();
        this.refresh();
    };
    /** @deprecated since version 23.2. Please use setModel instead. */
    SetFilter.prototype.unselectValue = function (value) {
        var message = 'AG Grid: since version 23.2, unselectValue has been deprecated. Please use setModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.unselectValue');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.deselectValue(value);
        this.refresh();
    };
    /** @deprecated since version 23.2. Please use setModel instead. */
    SetFilter.prototype.selectValue = function (value) {
        var message = 'AG Grid: since version 23.2, selectValue has been deprecated. Please use setModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.selectValue');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        this.valueModel.selectValue(value);
        this.refresh();
    };
    SetFilter.prototype.refresh = function () {
        if (!this.virtualList) {
            throw new Error('Virtual list has not been created.');
        }
        this.virtualList.refresh();
    };
    /** @deprecated since version 23.2. Please use getModel instead. */
    SetFilter.prototype.isValueSelected = function (value) {
        var message = 'AG Grid: since version 23.2, isValueSelected has been deprecated. Please use getModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.isValueSelected');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        return this.valueModel.isValueSelected(value);
    };
    /** @deprecated since version 23.2. Please use getModel instead. */
    SetFilter.prototype.isEverythingSelected = function () {
        var message = 'AG Grid: since version 23.2, isEverythingSelected has been deprecated. Please use getModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.isEverythingSelected');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        return this.valueModel.isEverythingVisibleSelected();
    };
    /** @deprecated since version 23.2. Please use getModel instead. */
    SetFilter.prototype.isNothingSelected = function () {
        var message = 'AG Grid: since version 23.2, isNothingSelected has been deprecated. Please use getModel instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.isNothingSelected');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        return this.valueModel.isNothingVisibleSelected();
    };
    /** @deprecated since version 23.2. Please use getValues instead. */
    SetFilter.prototype.getUniqueValueCount = function () {
        var message = 'AG Grid: since version 23.2, getUniqueValueCount has been deprecated. Please use getValues instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.getUniqueValueCount');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        return this.valueModel.getUniqueValueCount();
    };
    /** @deprecated since version 23.2. Please use getValues instead. */
    SetFilter.prototype.getUniqueValue = function (index) {
        var message = 'AG Grid: since version 23.2, getUniqueValue has been deprecated. Please use getValues instead.';
        _.doOnce(function () { return console.warn(message); }, 'setFilter.getUniqueValue');
        if (!this.valueModel) {
            throw new Error('Value model has not been created.');
        }
        return this.valueModel.getUniqueValue(index);
    };
    SetFilter.prototype.getValues = function () {
        return this.valueModel ? this.valueModel.getValues() : [];
    };
    SetFilter.prototype.refreshVirtualList = function () {
        if (this.setFilterParams && this.setFilterParams.refreshValuesOnOpen) {
            this.refreshFilterValues();
        }
        else {
            this.refresh();
        }
    };
    SetFilter.prototype.translateForSetFilter = function (key) {
        var translate = this.gridOptionsWrapper.getLocaleTextFunc();
        return translate(key, DEFAULT_LOCALE_TEXT[key]);
    };
    SetFilter.prototype.isSelectAllSelected = function () {
        if (!this.setFilterParams || !this.valueModel) {
            return false;
        }
        if (!this.setFilterParams.defaultToNothingSelected) {
            // everything selected by default
            if (this.valueModel.hasSelections() && this.valueModel.isNothingVisibleSelected()) {
                return false;
            }
            if (this.valueModel.isEverythingVisibleSelected()) {
                return true;
            }
        }
        else {
            // nothing selected by default
            if (this.valueModel.hasSelections() && this.valueModel.isEverythingVisibleSelected()) {
                return true;
            }
            if (this.valueModel.isNothingVisibleSelected()) {
                return false;
            }
        }
        // returning `undefined` means the checkbox status is indeterminate.
        return undefined;
    };
    SetFilter.prototype.destroy = function () {
        if (this.virtualList != null) {
            this.virtualList.destroy();
            this.virtualList = null;
        }
        _super.prototype.destroy.call(this);
    };
    SetFilter.SELECT_ALL_VALUE = '__AG_SELECT_ALL__';
    __decorate$1([
        RefSelector('eMiniFilter')
    ], SetFilter.prototype, "eMiniFilter", void 0);
    __decorate$1([
        RefSelector('eFilterLoading')
    ], SetFilter.prototype, "eFilterLoading", void 0);
    __decorate$1([
        RefSelector('eSetFilterList')
    ], SetFilter.prototype, "eSetFilterList", void 0);
    __decorate$1([
        RefSelector('eFilterNoMatches')
    ], SetFilter.prototype, "eNoMatches", void 0);
    __decorate$1([
        Autowired('valueFormatterService')
    ], SetFilter.prototype, "valueFormatterService", void 0);
    return SetFilter;
}(ProvidedFilter));
var ModelWrapper = /** @class */ (function () {
    function ModelWrapper(model) {
        this.model = model;
    }
    ModelWrapper.prototype.getRowCount = function () {
        return this.model.getDisplayedValueCount();
    };
    ModelWrapper.prototype.getRow = function (index) {
        return this.model.getDisplayedValue(index);
    };
    ModelWrapper.prototype.isRowSelected = function (index) {
        return this.model.isValueSelected(this.getRow(index));
    };
    return ModelWrapper;
}());
var ModelWrapperWithSelectAll = /** @class */ (function () {
    function ModelWrapperWithSelectAll(model, isSelectAllSelected) {
        this.model = model;
        this.isSelectAllSelected = isSelectAllSelected;
    }
    ModelWrapperWithSelectAll.prototype.getRowCount = function () {
        return this.model.getDisplayedValueCount() + 1;
    };
    ModelWrapperWithSelectAll.prototype.getRow = function (index) {
        return index === 0 ? SetFilter.SELECT_ALL_VALUE : this.model.getDisplayedValue(index - 1);
    };
    ModelWrapperWithSelectAll.prototype.isRowSelected = function (index) {
        return index === 0 ? this.isSelectAllSelected() : this.model.isValueSelected(this.getRow(index));
    };
    return ModelWrapperWithSelectAll;
}());

var __extends$2 = (undefined && undefined.__extends) || (function () {
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
var __decorate$2 = (undefined && undefined.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SetFloatingFilterComp = /** @class */ (function (_super) {
    __extends$2(SetFloatingFilterComp, _super);
    function SetFloatingFilterComp() {
        var _this = _super.call(this, /* html */ "\n            <div class=\"ag-floating-filter-input\" role=\"presentation\">\n                <ag-input-text-field ref=\"eFloatingFilterText\"></ag-input-text-field>\n            </div>") || this;
        _this.availableValuesListenerAdded = false;
        return _this;
    }
    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    SetFloatingFilterComp.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
    };
    SetFloatingFilterComp.prototype.init = function (params) {
        var displayName = this.columnModel.getDisplayNameForColumn(params.column, 'header', true);
        var translate = this.gridOptionsWrapper.getLocaleTextFunc();
        this.eFloatingFilterText
            .setDisabled(true)
            .setInputAriaLabel(displayName + " " + translate('ariaFilterInput', 'Filter Input'))
            .addGuiEventListener('click', function () { return params.showParentFilter(); });
        this.params = params;
    };
    SetFloatingFilterComp.prototype.onParentModelChanged = function (parentModel) {
        this.lastKnownModel = parentModel;
        this.updateFloatingFilterText();
    };
    SetFloatingFilterComp.prototype.addAvailableValuesListener = function () {
        var _this = this;
        this.params.parentFilterInstance(function (setFilter) {
            var setValueModel = setFilter.getValueModel();
            if (!setValueModel) {
                return;
            }
            // unlike other filters, what we show in the floating filter can be different, even
            // if another filter changes. this is due to how set filter restricts its values based
            // on selections in other filters, e.g. if you filter Language to English, then the set filter
            // on Country will only show English speaking countries. Thus the list of items to show
            // in the floating filter can change.
            _this.addManagedListener(setValueModel, SetValueModel.EVENT_AVAILABLE_VALUES_CHANGED, function () { return _this.updateFloatingFilterText(); });
        });
        this.availableValuesListenerAdded = true;
    };
    SetFloatingFilterComp.prototype.updateFloatingFilterText = function () {
        var _this = this;
        if (!this.lastKnownModel) {
            this.eFloatingFilterText.setValue('');
            return;
        }
        if (!this.availableValuesListenerAdded) {
            this.addAvailableValuesListener();
        }
        // also supporting old filter model for backwards compatibility
        var values = this.lastKnownModel instanceof Array ? this.lastKnownModel : this.lastKnownModel.values;
        if (!values) {
            this.eFloatingFilterText.setValue('');
            return;
        }
        this.params.parentFilterInstance(function (setFilter) {
            var valueModel = setFilter.getValueModel();
            if (!valueModel) {
                return;
            }
            var availableValues = _.filter(values, function (v) { return valueModel.isValueAvailable(v); });
            var localeTextFunc = _this.gridOptionsWrapper.getLocaleTextFunc();
            // format all the values, if a formatter is provided
            var formattedValues = _.map(availableValues, function (value) {
                var _a = _this.params, column = _a.column, filterParams = _a.filterParams;
                var formattedValue = _this.valueFormatterService.formatValue(column, null, null, value, filterParams.valueFormatter, false);
                var valueToRender = formattedValue != null ? formattedValue : value;
                return valueToRender == null ? localeTextFunc('blanks', DEFAULT_LOCALE_TEXT.blanks) : valueToRender;
            });
            var arrayToDisplay = formattedValues.length > 10 ? formattedValues.slice(0, 10).concat('...') : formattedValues;
            var valuesString = "(" + formattedValues.length + ") " + arrayToDisplay.join(',');
            _this.eFloatingFilterText.setValue(valuesString);
        });
    };
    __decorate$2([
        RefSelector('eFloatingFilterText')
    ], SetFloatingFilterComp.prototype, "eFloatingFilterText", void 0);
    __decorate$2([
        Autowired('valueFormatterService')
    ], SetFloatingFilterComp.prototype, "valueFormatterService", void 0);
    __decorate$2([
        Autowired('columnModel')
    ], SetFloatingFilterComp.prototype, "columnModel", void 0);
    return SetFloatingFilterComp;
}(Component));

var SetFilterModule = {
    moduleName: ModuleNames.SetFilterModule,
    beans: [],
    userComponents: [
        { componentName: 'agSetColumnFilter', componentClass: SetFilter },
        { componentName: 'agSetColumnFloatingFilter', componentClass: SetFloatingFilterComp },
    ],
    dependantModules: [
        EnterpriseCoreModule
    ]
};

export { SetFilter, SetFilterModule };
