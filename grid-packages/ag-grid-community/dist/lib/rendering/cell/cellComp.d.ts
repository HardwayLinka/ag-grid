import { Beans } from "./../beans";
import { Component } from "../../widgets/component";
import { ICellEditorComp } from "../../interfaces/iCellEditor";
import { ICellRendererComp } from "./../cellRenderers/iCellRenderer";
import { RowCtrl } from "./../row/rowCtrl";
import { TooltipParentComp } from "../../widgets/customTooltipFeature";
import { CellCtrl } from "./cellCtrl";
export declare class CellComp extends Component implements TooltipParentComp {
    private eCellWrapper;
    private eCellValue;
    private beans;
    private column;
    private rowNode;
    private eRow;
    private includeSelection;
    private includeRowDrag;
    private includeDndSource;
    private forceWrapper;
    private checkboxSelectionComp;
    private dndSourceComp;
    private rowDraggingComp;
    private hideEditorPopup;
    private cellEditorPopupWrapper;
    private cellEditor;
    private cellEditorGui;
    private cellRenderer;
    private cellRendererGui;
    private cellRendererClass;
    private autoHeightCell;
    private rowCtrl;
    private scope;
    private cellCtrl;
    private firstRender;
    private angularCompiledElement;
    private rendererVersion;
    private editorVersion;
    constructor(scope: any, beans: Beans, cellCtrl: CellCtrl, autoHeightCell: boolean, printLayout: boolean, eRow: HTMLElement, editingRow: boolean);
    private setRenderDetails;
    private setEditDetails;
    private removeControlsWrapper;
    private setupControlsWrapper;
    private addControlsWrapper;
    private createCellEditorInstance;
    private insertValueWithoutCellRenderer;
    private insertValueUsingAngular1Template;
    private destroyEditorAndRenderer;
    private destroyRenderer;
    private destroyEditor;
    private refreshCellRenderer;
    private createCellRendererInstance;
    private isUsingAngular1Template;
    getCtrl(): CellCtrl;
    getRowCtrl(): RowCtrl | null;
    getCellRenderer(): ICellRendererComp | null | undefined;
    getCellEditor(): ICellEditorComp | null | undefined;
    private afterCellRendererCreated;
    private afterCellEditorCreated;
    private addInCellEditor;
    private addPopupCellEditor;
    detach(): void;
    destroy(): void;
    private clearCellElement;
    private updateAngular1ScopeAndCompile;
}
