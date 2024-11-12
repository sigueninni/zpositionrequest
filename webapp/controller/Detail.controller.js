sap.ui.define([
    "lu/uni/zpositionrequest/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "lu/uni/zpositionrequest//model/formatter",
    "sap/base/strings/formatMessage",
    "sap/ui/core/ValueState",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem"

],
    function (BaseController, JSONModel, formatter, formatMessage, ValueState, FlattenedDataset, FeedItem) {
        "use strict";

        return BaseController.extend("lu.uni.zpositionrequest.controller.Detail", {

            formatter: formatter,
            formatMessage: formatMessage,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            onInit: function () {

                const oCore = sap.ui.getCore();
                const oView = this.getView();

                // Model used to manipulate control states. The chosen values make sure,
                // detail page is busy indication immediately so there is no break in
                // between the busy indication for loading the view's meta data
                var oViewModel = new JSONModel({
                    busy: false,
                    delay: 0,
                    isMandatory: true,
                    isVoluntary: false,
                    mimePath: this._sMIMESpath
                });
                this.setModel(oViewModel, "detailView");

                // attach navigation route pattern event
                this.getRouter().getRoute("RouteDetail").attachPatternMatched(this._onObjectMatched, this);

                // attach validation events
                oCore.attachValidationError(function (oEvent) {
                    oEvent.getParameter("element").setValueState(sap.ui.core.ValueState.Error);
                });
                oCore.attachValidationSuccess(function (oEvent) {
                    oEvent.getParameter("element").setValueState(sap.ui.core.ValueState.None);
                });

                // set message model
                var oMessageManager = sap.ui.getCore().getMessageManager();
                oView.setModel(oMessageManager.getMessageModel(), "message");
                oMessageManager.removeAllMessages();
                oMessageManager.registerObject(oView, true);

                this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

                /*******************************************************************************/
                //TO_REPLACE wth real TimeLine data
                /*******************************************************************************/
                /*this below code for get the JSON Model form Manifest.json file*/
                const commentsDataModel = this.getOwnerComponent().getModel("commentData");
                console.log({ commentsDataModel });
                this.getView().setModel(commentsDataModel, "commentsModel");

                /*******************************************************************************/
                //TO_REPLACE with real Cost Simulation data
                /*******************************************************************************/
                var data = [{
                    "Year": "2024",
                    "Cost": 10000
                }, {
                    "Year": "2025",
                    "Cost": 20000
                }, {
                    "Year": "2026",
                    "Cost": 20000
                }, {
                    "Year": "2027",
                    "Cost": 40000
                }, {
                    "Year": "2028",
                    "Cost": 20000
                }];
                // Load local JSON data
                const oDataModel = new sap.ui.model.json.JSONModel(data);
                // Use this line in case you are loading from external OData url
                // oDataModel.loadData(data);
                // Get the VizFrame control
                const oChartContainer = this.getView().byId("chartContainer");
                // Set the data model to the VizFrame
                oChartContainer.setModel(oDataModel);
                // Create a FlattenedDataset
                let oDataset = new FlattenedDataset({
                    dimensions: [{
                        name: "Year",
                        value: "{Year}"
                    }],
                    measures: [{
                        name: "Cost",
                        value: "{Cost}"
                    }],
                    data: {
                        path: "/"
                    }
                });
                // Add the dataset to the VizFrame
                oChartContainer.setDataset(oDataset);
                // Create a FeedItem for Category dimension
                let oCategoryFeed = new FeedItem({
                    uid: "categoryAxis",
                    type: "Dimension",
                    values: ["Year"]
                });
                // Create a FeedItem for Revenue measure
                let oRevenueFeed = new FeedItem({
                    uid: "valueAxis",
                    type: "Measure",
                    values: ["Cost"]
                });
                // Add the FeedItems to the VizFrame
                oChartContainer.addFeed(oCategoryFeed);
                oChartContainer.addFeed(oRevenueFeed);

            },


            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            /**
             * Binds the view to the object path and expands the aggregated line items.
             * @function
             * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
             * @private
             */
            _onObjectMatched: function (oEvent) {
                var oView = this.getView();
                var oModel = oView.getModel();
                var sObjectId = oEvent.getParameter("arguments").positionRequestId;

                this.getModel().metadataLoaded().then(function () {
                    // first reset all changes if any
                    if (oModel.hasPendingChanges()) {
                        oModel.resetChanges();
                    }


                    //TODO -> Validation checks
                    //   this._resetValidationChecks();

                    // set minimum dates
                    /*                     var oMinDate = new Date();
                                        oMinDate.setMonth(oMinDate.getMonth() + 1);
                                        oMinDate.setDate(oMinDate.getDate() - 2);
                                        oView.byId("foreseenStartDate").setMinDate(oMinDate);
                    
                                        oMinDate = new Date();
                                        // oMinDate.setMonth(oMinDate.getMonth() + 3);
                                        // oMinDate.setDate(oMinDate.getDate() - 4);
                                        oMinDate.setMonth(oMinDate.getMonth() + 1);
                                        oMinDate.setDate(oMinDate.getDate() - 2);
                                        oView.byId("endDate").setMinDate(oMinDate); */

                    const sObjectPath = this.getModel().createKey("PositionRequestSet", {
                        Guid: sObjectId
                    });
                    this._bindView("/" + sObjectPath);
                }.bind(this));
            },

            _onBindingChange: function () {
                const oView = this.getView(),
                    oElementBinding = oView.getElementBinding();

                // No data for the binding
                if (!oElementBinding.getBoundContext()) {
                    this.getRouter().getTargets().display("detailObjectNotFound");
                    // if object could not be found, the selection in the master list
                    // does not make sense anymore.
                    this.getOwnerComponent().oListSelector.clearMasterListSelection();
                    return;
                }

                let sPath = oElementBinding.getPath(),
                    oResourceBundle = this.getResourceBundle(),
                    oObject = oView.getModel().getObject(sPath),
                    sObjectId = oObject.Guid,
                    sObjectName = oObject.Title,
                    oViewModel = this.getModel("detailView");

                this.getOwnerComponent().oListSelector.selectAListItem(sPath);

                oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
                oViewModel.setProperty("/shareOnJamTitle", sObjectName);
                oViewModel.setProperty("/shareSendEmailSubject",
                    oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
                oViewModel.setProperty("/shareSendEmailMessage",
                    oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));

                // this._filterPersonnelSubareaValues();
            },

            /* =========================================================== */
            /* Internal methods                                     */
            /* =========================================================== */

            _onMetadataLoaded: function () {
                // Store original busy indicator delay for the detail view
                const iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
                    oViewModel = this.getModel("detailView");

                // Make sure busy indicator is displayed immediately when
                // detail view is displayed for the first time
                oViewModel.setProperty("/delay", 0);

                // Binding the view will set it to not busy - so the view is always busy if it is not bound
                oViewModel.setProperty("/busy", true);
                // Restore original busy indicator delay for the detail view
                oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
            },


            /**
             * Binds the view to the object path. Makes sure that detail view displays
             * a busy indicator while data for the corresponding element binding is loaded.
             * @function
             * @param {string} sObjectPath path to the object to be bound to the view.
             * @private
             */
            _bindView: function (sObjectPath) {
                const oView = this.getView();
                // Set busy indicator during view binding
                let oViewModel = this.getModel("detailView");

                // If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
                oViewModel.setProperty("/busy", false);
                this.getView().bindElement({
                    path: sObjectPath,
                    events: {
                        change: this._onBindingChange.bind(this),
                        dataRequested: function () {
                            oViewModel.setProperty("/busy", true);
                        },
                        dataReceived: function () {
                            oViewModel.setProperty("/busy", false);
                        }
                    }
                });
            },

            /**
             * Binds the vizChart model to display cost simulation by Year
             * @function
             * @param {string} sObjectPath path to the object to be bound to the view.
             * @private
             */
            _bindCostSimulationChart: function () {

            }

        });
    });
