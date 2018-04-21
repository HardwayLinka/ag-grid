import {Autowired, Component, Events, EventService, GridOptionsWrapper, GridPanel, PostConstruct} from "ag-grid/main";
import {ToolPanelColumnComp} from "./toolPanelColumnComp";

export class ToolPanelSelectComp extends Component {

    private columnPanel: ToolPanelColumnComp;

    @Autowired("gridOptionsWrapper") private gridOptionsWrapper: GridOptionsWrapper;
    @Autowired("eventService") private eventService: EventService;

    private gridPanel: GridPanel;

    constructor(columnPanel: ToolPanelColumnComp) {
        super(`<div class="ag-side-buttons"></div>`);
        this.columnPanel = columnPanel;
    }

    public registerGridComp(gridPanel: GridPanel): void {
        this.gridPanel = gridPanel;
    }

    @PostConstruct
    private postConstruct(): void {
        let translate = this.gridOptionsWrapper.getLocaleTextFunc();
        this.getGui().innerHTML = `<button type="button" ref="toggle-button">${translate('columns', 'Columns')}</button>`;
        let btShow = this.getRefElement("toggle-button");
        this.addDestroyableEventListener(btShow, 'click', () => {
            this.columnPanel.setVisible(!this.columnPanel.isVisible());
            // this gets grid to resize immediately, rather than waiting
            // for next 500ms
            this.gridPanel.checkViewportAndScrolls();
        });

        let showButtons = !this.gridOptionsWrapper.isToolPanelSuppressSideButtons();
        this.setVisible(showButtons);
    }

}
