// Type definitions for @ag-grid-community/core v26.2.0
// Project: http://www.ag-grid.com/
// Definitions by: Niall Crosby <https://github.com/ag-grid/>
import * as AriaUtils from './aria';
export declare const _: {
    utf8_encode(s: string | null): string;
    stringRepeat(str: string, len: number): string;
    padStart(str: string, totalLength: number, padStr: string): string;
    camelCaseToHyphen(str: string): string | null;
    hyphenToCamelCase(str: string): string | null;
    capitalise(str: string): string;
    escapeString(toEscape?: string | null | undefined): string | null;
    camelCaseToHumanText(camelCase: string | undefined): string | null;
    startsWith(str: string, matchStart: string): boolean;
    convertToSet<T>(list: T[]): Set<T>;
    sortRowNodesByOrder(rowNodes: import("../main").RowNode[], rowNodeOrder: {
        [id: string]: number;
    }): void;
    traverseNodesWithKey(nodes: import("../main").RowNode[] | null, callback: (node: import("../main").RowNode, key: string) => void): void;
    iterateObject<T_1>(object: {
        [p: string]: T_1;
    } | T_1[] | null | undefined, callback: (key: string, value: T_1) => void): void;
    cloneObject<T_2 extends {}>(object: T_2): T_2;
    deepCloneObject<T_3>(object: T_3): T_3;
    deepCloneDefinition<T_4>(object: T_4, keysToSkip?: string[] | undefined): T_4 | undefined;
    getProperty<T_5, K extends keyof T_5>(object: T_5, key: K): any;
    setProperty<T_6, K_1 extends keyof T_6>(object: T_6, key: K_1, value: any): void;
    copyPropertiesIfPresent<S, T_7 extends S, K_2 extends keyof S>(source: S, target: T_7, ...properties: K_2[]): void;
    copyPropertyIfPresent<S_1, T_8 extends S_1, K_3 extends keyof S_1>(source: S_1, target: T_8, property: K_3, transform?: ((value: S_1[K_3]) => any) | undefined): void;
    getAllKeysInObjects(objects: any[]): string[];
    getAllValuesInObject<T_9 extends Object>(obj: T_9): any[];
    mergeDeep(dest: any, source: any, copyUndefined?: boolean, makeCopyOfSimpleObjects?: boolean): void;
    assign<T_10, U>(target: T_10, source: U): T_10 & U;
    assign<T_11, U_1, V>(target: T_11, source1: U_1, source2: V): T_11 & U_1 & V;
    assign<T_12, U_2, V_1, W>(target: T_12, source1: U_2, source2: V_1, source3: W): T_12 & U_2 & V_1 & W;
    missingOrEmptyObject(value: any): boolean;
    get(source: any, expression: string, defaultValue: any): any;
    set(target: any, expression: string, value: any): void;
    deepFreeze(object: any): any;
    getValueUsingField(data: any, field: string, fieldContainsDots: boolean): any;
    removeAllReferences(obj: any, objectName: string): void;
    isNonNullObject(value: any): boolean;
    padStartWidthZeros(value: number, totalStringSize: number): string;
    createArrayOfNumbers(first: number, last: number): number[];
    isNumeric(value: any): boolean;
    getMaxSafeInteger(): number;
    cleanNumber(value: any): number | null;
    decToHex(number: number, bytes: number): string;
    formatNumberTwoDecimalPlacesAndCommas(value: number): string;
    formatNumberCommas(value: number): string;
    sum(values: number[] | null): number | null;
    normalizeWheel(event: any): any;
    isLeftClick(mouseEvent: MouseEvent): boolean;
    areEventsNear(e1: Touch | MouseEvent, e2: Touch | MouseEvent, pixelCount: number): boolean;
    convertToMap<K_4, V_2>(arr: [K_4, V_2][]): Map<K_4, V_2>;
    mapById<V_3>(arr: V_3[], callback: (obj: V_3) => string): Map<string, V_3>;
    keys<T_13>(map: Map<T_13, any>): T_13[];
    isKeyPressed(event: KeyboardEvent, keyToCheck: number): boolean;
    isEventFromPrintableCharacter(event: KeyboardEvent): boolean;
    isUserSuppressingKeyboardEvent(gridOptionsWrapper: import("../gridOptionsWrapper").GridOptionsWrapper, keyboardEvent: KeyboardEvent, rowNode: import("../main").RowNode, column: import("../main").Column, editing: boolean): boolean;
    isUserSuppressingHeaderKeyboardEvent(gridOptionsWrapper: import("../gridOptionsWrapper").GridOptionsWrapper, keyboardEvent: KeyboardEvent, headerRowIndex: number, column: import("../main").Column | import("../main").ColumnGroup): boolean;
    createIcon(iconName: string, gridOptionsWrapper: import("../gridOptionsWrapper").GridOptionsWrapper, column: import("../main").Column | null): HTMLElement;
    createIconNoSpan(iconName: string, gridOptionsWrapper: import("../gridOptionsWrapper").GridOptionsWrapper, column?: import("../main").Column | null | undefined, forceCreate?: boolean | undefined): HTMLElement | undefined;
    iconNameClassMap: {
        [key: string]: string;
    };
    makeNull<T_14 extends unknown>(value?: T_14 | undefined): T_14 | null;
    exists(value: string | null | undefined, allowEmptyString?: boolean | undefined): value is string;
    exists<T_15>(value: T_15): value is NonNullable<T_15>;
    missing<T_16>(value: T_16 | null | undefined): value is Exclude<undefined, T_16> | Exclude<null, T_16>;
    missingOrEmpty<T_17>(value?: string | T_17[] | null | undefined): boolean;
    toStringOrNull(value: any): string | null;
    attrToNumber(value?: string | number | null | undefined): number | null | undefined;
    attrToBoolean(value?: string | boolean | null | undefined): boolean | undefined;
    attrToString(value?: string | undefined): string | undefined;
    referenceCompare<T_18>(left: T_18, right: T_18): boolean;
    jsonEquals<T1, T2>(val1: T1, val2: T2): boolean;
    defaultComparator(valueA: any, valueB: any, accentedCompare?: boolean): number;
    find<T_19>(collection: {
        [id: string]: T_19;
    } | T_19[] | null, predicate: string | boolean | ((item: T_19) => boolean), value?: any): T_19 | null;
    values<T_20>(object: {
        [key: string]: T_20;
    } | Set<T_20> | Map<any, T_20>): T_20[];
    fuzzyCheckStrings(inputValues: string[], validValues: string[], allSuggestions: string[]): {
        [p: string]: string[];
    };
    fuzzySuggestions(inputValue: string, allSuggestions: string[], hideIrrelevant?: boolean | undefined, weighted?: boolean | undefined): string[];
    get_bigrams(from: string): any[];
    string_distances(str1: string, str2: string): number;
    string_weighted_distances(str1: string, str2: string): number;
    doOnce(func: () => void, key: string): void;
    getFunctionName(funcConstructor: any): any;
    getFunctionParameters(func: any): any;
    isFunction(val: any): boolean;
    executeInAWhile(funcs: Function[]): void;
    executeNextVMTurn(func: () => void): void;
    executeAfter(funcs: Function[], milliseconds?: number): void;
    debounce(func: (...args: any[]) => void, wait: number, immediate?: boolean): (...args: any[]) => void;
    waitUntil(condition: () => boolean, callback: () => void, timeout?: number, timeoutMessage?: string | undefined): void;
    compose(...fns: Function[]): (arg: any) => any;
    callIfPresent(func: Function): void;
    stopPropagationForAgGrid(event: Event): void;
    isStopPropagationForAgGrid(event: Event): boolean;
    getCtrlForEvent<T_21>(gridOptionsWrapper: import("../gridOptionsWrapper").GridOptionsWrapper, event: Event, type: string): T_21 | null;
    addChangeListener(element: HTMLElement, listener: EventListener): void;
    getTarget(event: Event): Element;
    isElementInEventPath(element: HTMLElement, event: Event): boolean;
    createEventPath(event: Event): EventTarget[];
    addAgGridEventPath(event: Event): void;
    getEventPath(event: Event): EventTarget[];
    addSafePassiveEventListener(frameworkOverrides: import("../main").IFrameworkOverrides, eElement: HTMLElement, event: string, listener: (event?: any) => void): void;
    isEventSupported: (eventName: any) => boolean;
    addCssClass(element: HTMLElement, className: string): HTMLElement | undefined;
    removeCssClass(element: HTMLElement, className: string): void;
    addOrRemoveCssClass(element: HTMLElement, className: string, addOrRemove: boolean): void;
    radioCssClass(element: HTMLElement, elementClass: string | null, otherElementClass?: string | null | undefined): void;
    containsClass(element: HTMLElement, className: string): boolean;
    isFocusableFormField(element: HTMLElement): boolean;
    setDisplayed(element: HTMLElement, displayed: boolean): void;
    setVisible(element: HTMLElement, visible: boolean): void;
    setDisabled(element: HTMLElement, disabled: boolean): void;
    isElementChildOfClass(element: HTMLElement | null, cls: string, maxNest?: number | undefined): boolean;
    getElementSize(el: HTMLElement): {
        height: number;
        width: number;
        paddingTop: number;
        paddingRight: number;
        paddingBottom: number;
        paddingLeft: number;
        marginTop: number;
        marginRight: number;
        marginBottom: number;
        marginLeft: number;
        boxSizing: string;
    };
    getInnerHeight(el: HTMLElement): number;
    getInnerWidth(el: HTMLElement): number;
    getAbsoluteHeight(el: HTMLElement): number;
    getAbsoluteWidth(el: HTMLElement): number;
    isRtlNegativeScroll(): boolean;
    getScrollLeft(element: HTMLElement, rtl: boolean): number;
    setScrollLeft(element: HTMLElement, value: number, rtl: boolean): void;
    clearElement(el: HTMLElement): void;
    removeElement(parent: HTMLElement, cssSelector: string): void;
    removeFromParent(node: Element | null): void;
    isVisible(element: HTMLElement): boolean;
    loadTemplate(template: string): HTMLElement;
    appendHtml(eContainer: HTMLElement, htmlTemplate: string): void;
    getElementAttribute(element: any, attributeName: string): string | null;
    offsetHeight(element: HTMLElement): number;
    offsetWidth(element: HTMLElement): number;
    ensureDomOrder(eContainer: HTMLElement, eChild: HTMLElement, eChildBefore?: HTMLElement | null | undefined): void;
    setDomChildOrder(eContainer: HTMLElement, orderedChildren: (HTMLElement | null)[]): void;
    insertWithDomOrder(eContainer: HTMLElement, eToInsert: HTMLElement, eChildBefore: HTMLElement | null): void;
    prependDC(parent: HTMLElement, documentFragment: DocumentFragment): void;
    addStylesToElement(eElement: any, styles: any): void;
    isHorizontalScrollShowing(element: HTMLElement): boolean;
    isVerticalScrollShowing(element: HTMLElement): boolean;
    setElementWidth(element: HTMLElement, width: string | number): void;
    setFixedWidth(element: HTMLElement, width: string | number): void;
    setElementHeight(element: HTMLElement, height: string | number): void;
    setFixedHeight(element: HTMLElement, height: string | number): void;
    formatSize(size: string | number): string;
    isNode(o: any): boolean;
    isElement(o: any): boolean;
    isNodeOrElement(o: any): boolean;
    copyNodeList(nodeList: NodeListOf<Node> | null): Node[];
    iterateNamedNodeMap(map: NamedNodeMap, callback: (key: string, value: string) => void): void;
    setCheckboxState(eCheckbox: HTMLInputElement, state: any): void;
    addOrRemoveAttribute(element: HTMLElement, name: string, value: any): void;
    nodeListForEach<T_22 extends Node>(nodeList: NodeListOf<T_22> | null, action: (value: T_22) => void): void;
    serialiseDate(date: Date | null, includeTime?: boolean, separator?: string): string | null;
    parseDateTimeFromString(value?: string | null | undefined): Date | null;
    stringToArray(strData: string, delimiter?: string): string[][];
    isBrowserIE(): boolean;
    isBrowserEdge(): boolean;
    isBrowserSafari(): boolean;
    isBrowserChrome(): boolean;
    isBrowserFirefox(): boolean;
    isIOSUserAgent(): boolean;
    getTabIndex(el: HTMLElement | null): string | null;
    getMaxDivHeight(): number;
    getScrollbarWidth(): number | null;
    isInvisibleScrollbar(): boolean;
    hasOverflowScrolling(): boolean;
    getBodyWidth(): number;
    getBodyHeight(): number;
    firstExistingValue<A>(...values: A[]): A | null;
    anyExists(values: any[]): boolean;
    existsAndNotEmpty<T_23>(value?: T_23[] | undefined): boolean;
    last<T_24>(arr: T_24[]): T_24;
    last<T_25 extends Node>(arr: NodeListOf<T_25>): T_25;
    areEqual<T_26>(a?: T_26[] | null | undefined, b?: T_26[] | null | undefined, comparator?: ((a: T_26, b: T_26) => boolean) | undefined): boolean;
    compareArrays(array1?: any[] | undefined, array2?: any[] | undefined): boolean;
    shallowCompare(arr1: any[], arr2: any[]): boolean;
    sortNumerically(array: number[]): number[];
    removeRepeatsFromArray<T_27>(array: T_27[], object: T_27): void;
    removeFromArray<T_28>(array: T_28[], object: T_28): void;
    removeAllFromArray<T_29>(array: T_29[], toRemove: T_29[]): void;
    insertIntoArray<T_30>(array: T_30[], object: T_30, toIndex: number): void;
    insertArrayIntoArray<T_31>(dest: T_31[], src: T_31[], toIndex: number): void;
    moveInArray<T_32>(array: T_32[], objectsToMove: T_32[], toIndex: number): void;
    includes<T_33>(array: T_33[], value: T_33): boolean;
    flatten(arrayOfArrays: any[]): any[];
    pushAll<T_34>(target: T_34[], source: T_34[]): void;
    toStrings<T_35>(array: T_35[]): (string | null)[] | null;
    findIndex<T_36>(collection: T_36[], predicate: (item: T_36, idx: number, collection: T_36[]) => boolean): number;
    fill(collection: any[], value?: any, start?: number, end?: number): any[];
    every<T_37>(list: T_37[], predicate: (value: T_37, index: number) => boolean): boolean;
    some<T_38>(list: T_38[], predicate: (value: T_38, index: number) => boolean): boolean;
    forEach<T_39>(list: T_39[], action: (value: T_39, index: number) => void): void;
    forEachReverse<T_40>(list: T_40[], action: (value: T_40, index: number) => void): void;
    map<T_41, V_4>(list: T_41[], process: (value: T_41, index: number) => V_4): V_4[] | null;
    filter<T_42>(list: T_42[], predicate: (value: T_42, index: number) => boolean): T_42[] | null;
    reduce<T_43, V_5>(list: T_43[], step: (acc: V_5, value: T_43, index: number) => V_5, initial: V_5): V_5 | null;
    forEachSnapshotFirst<T_44>(list: T_44[], callback: (item: T_44) => void): void;
    setAriaRole(element: HTMLElement, role?: string | null | undefined): void;
    getAriaSortState(column: import("../main").Column): AriaUtils.ColumnSortState;
    getAriaLevel(element: HTMLElement): number;
    getAriaPosInSet(element: HTMLElement): number;
    getAriaDescribedBy(element: HTMLElement): string;
    setAriaLabel(element: HTMLElement, label: string): void;
    setAriaLabelledBy(element: HTMLElement, labelledBy: string): void;
    setAriaDescribedBy(element: HTMLElement, describedby: string | undefined): void;
    setAriaLevel(element: HTMLElement, level: number): void;
    setAriaDisabled(element: HTMLElement, disabled: boolean): void;
    setAriaExpanded(element: HTMLElement, expanded: boolean): void;
    removeAriaExpanded(element: HTMLElement): void;
    setAriaSetSize(element: HTMLElement, setsize: number): void;
    setAriaPosInSet(element: HTMLElement, position: number): void;
    setAriaMultiSelectable(element: HTMLElement, multiSelectable: boolean): void;
    setAriaRowCount(element: HTMLElement, rowCount: number): void;
    setAriaRowIndex(element: HTMLElement, rowIndex: number): void;
    setAriaColCount(element: HTMLElement, colCount: number): void;
    setAriaColIndex(element: HTMLElement, colIndex: number): void;
    setAriaColSpan(element: HTMLElement, colSpan: number): void;
    setAriaSort(element: HTMLElement, sort: AriaUtils.ColumnSortState): void;
    removeAriaSort(element: HTMLElement): void;
    setAriaSelected(element: HTMLElement, selected: boolean | undefined): void;
    setAriaChecked(element: HTMLElement, checked?: boolean | undefined): void;
    getNameOfClass(theClass: any): string;
    findLineByLeastSquares(values: number[]): number[];
    cssStyleObjectToMarkup(stylesToUse: any): string;
    message(msg: string): void;
    bindCellRendererToHtmlElement(cellRendererPromise: import("./promise").AgPromise<import("../main").ICellRendererComp>, eTarget: HTMLElement): void;
};
