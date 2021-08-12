// ag-grid-react v26.0.0
"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ag_grid_community_1 = require("ag-grid-community");
var groupCellRenderer_1 = __importDefault(require("./cellRenderer/groupCellRenderer"));
var detailCellRenderer_1 = __importDefault(require("./cellRenderer/detailCellRenderer"));
var ReactFrameworkOverrides = /** @class */ (function (_super) {
    __extends(ReactFrameworkOverrides, _super);
    function ReactFrameworkOverrides() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.frameworkComponents = {
            agGroupCellRenderer: groupCellRenderer_1.default,
            agGroupRowRenderer: groupCellRenderer_1.default,
            agDetailCellRenderer: detailCellRenderer_1.default
        };
        return _this;
    }
    ReactFrameworkOverrides.prototype.frameworkComponent = function (name) {
        return this.frameworkComponents[name];
    };
    return ReactFrameworkOverrides;
}(ag_grid_community_1.VanillaFrameworkOverrides));
exports.ReactFrameworkOverrides = ReactFrameworkOverrides;
