"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@ag-grid-community/core");
var NULL_SUBSTITUTE = '__<ag-grid-pseudo-null>__';
var ClientSideValuesExtractor = /** @class */ (function () {
    function ClientSideValuesExtractor(rowModel, filterParams, caseFormat) {
        this.rowModel = rowModel;
        this.filterParams = filterParams;
        this.caseFormat = caseFormat;
    }
    ClientSideValuesExtractor.prototype.extractUniqueValues = function (predicate) {
        var _this = this;
        var values = {};
        var keyCreator = this.filterParams.colDef.keyCreator;
        var addValue = function (value) {
            // NOTE: We don't care about the keys later on (only values in the dictionary are
            // returned), so as long as we use a non-conflicting key for the `null` value this
            // will behave correctly.
            var valueKey = value != null ? _this.caseFormat(value) : NULL_SUBSTITUTE;
            if (valueKey && values[valueKey] == null) {
                values[valueKey] = value;
            }
        };
        this.rowModel.forEachLeafNode(function (node) {
            // only pull values from rows that have data. this means we skip filler group nodes.
            if (!node.data || !predicate(node)) {
                return;
            }
            var value = _this.filterParams.valueGetter(node);
            if (keyCreator) {
                var params = {
                    value: value,
                    colDef: _this.filterParams.colDef,
                    column: _this.filterParams.column,
                    node: node,
                    data: node.data,
                    api: _this.filterParams.api,
                    columnApi: _this.filterParams.columnApi,
                    context: _this.filterParams.context
                };
                value = keyCreator(params);
            }
            value = core_1._.makeNull(value);
            if (value != null && Array.isArray(value)) {
                core_1._.forEach(value, function (x) {
                    var formatted = core_1._.toStringOrNull(core_1._.makeNull(x));
                    addValue(formatted);
                });
            }
            else {
                addValue(core_1._.toStringOrNull(value));
            }
        });
        return core_1._.values(values);
    };
    return ClientSideValuesExtractor;
}());
exports.ClientSideValuesExtractor = ClientSideValuesExtractor;
//# sourceMappingURL=clientSideValueExtractor.js.map