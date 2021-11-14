// Type definitions for @ag-grid-community/core v26.2.0
// Project: http://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import { AgPromise } from "../utils";
export interface SimpleHttpRequestParams {
    url: string;
}
export declare function simpleHttpRequest(params: SimpleHttpRequestParams): AgPromise<any>;
