sap.ui.define([
    "lu/uni/zpositionrequest/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "lu/uni/zpositionrequest//model/formatter",
    "sap/base/strings/formatMessage",
    "sap/ui/core/ValueState",
    "sap/viz/ui5/data/FlattenedDataset",
    "sap/viz/ui5/controls/common/feeds/FeedItem",
    "sap/m/MessageBox",
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",

],
    function (BaseController, JSONModel, formatter, formatMessage, ValueState, FlattenedDataset, FeedItem, MessageBox, MessageToast, Filter, FilterOperator) {
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

                // create table content
                var oTable = this.getView().byId("idTable");


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

                    /*******************************************************************************/
                    //Initial controls of Dates, retro etc...
                    /*******************************************************************************/
                    //this._getTimeConstraints();


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

                this._getTimeConstraints();
            },

            /**
          * Event handler for the save button 
          * @param {sap.ui.base.Event} oEvent the button Click event
          * @public
          */

            onSaveButtonPress: function (oEvent) {
                this._savePosRequestObject();
            },

            /**
          * Event handler for the button delete 
          * @param {sap.ui.base.Event} oEvent the button Click event
          * @public
          */
            onDeleteButtonPress: function (oEvent) {
                const that = this;
                const oView = this.getView();
                const oModel = oView.getModel();

                MessageBox.warning(this.getResourceBundle().getText("confirmDeletion"), {
                    title: this.getResourceBundle().getText("confirmDeletionTitle"),
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    initialFocus: MessageBox.Action.OK,
                    onClose: function (oAction) {
                        if (oAction === MessageBox.Action.OK) {
                            // set busy indicator during view binding
                            let oViewModel = that.getModel("detailView");
                            oViewModel.setProperty("/busy", true);
                            // delete the entry
                            oModel.remove(oView.getBindingContext().getPath(), {
                                success: function (oSuccess) {
                                    oViewModel.setProperty("/busy", false);
                                    MessageToast.show(that.getResourceBundle().getText("requestDeleted"));
                                    that.getRouter().navTo("RouteMaster", that);
                                    //  that.getRouter().getTargets().display("notFound");
                                }
                            });
                        } else { //Request cancelled
                            MessageToast.show(that.getResourceBundle().getText("deletionCancelled"));
                        }
                    }
                });
            },


            /**
            * Event handler for the onChange datePicker : startDate
            * @param {sap.ui.base.Event} oEvent the button OnChange event
            * @public
            */
            onStartDateChange: function (oEvent) {

                let
                    oStartDate = oEvent.getSource(),
                    valueStartDate = oEvent.getParameter("value"),
                    daysStartDate = valueStartDate.substring(0, 2);

                if (daysStartDate !== '01' && daysStartDate !== '15') {
                    oStartDate.setValueState(ValueState.Error);
                    oStartDate.setValueStateText("Only 01 or 15 of the month! - TODO : demander le message! ");
                } else {
                    oStartDate.setValueState(ValueState.None);
                }
                this._getTimeConstraints();

            },

            /**
            * Event handler for the onChange select : contractType
            * @param {sap.ui.base.Event} oEvent the button OnChange event
            * @public
            */
            onContractTypeChange: function (oEvent) {
                debugger;

                const sFullId = oEvent.getSource().getId();
                const sLocalId = sFullId.split("--").pop();

                this._getTimeConstraints();
                this._updateUiSettings(sLocalId, oEvent.getSource().getSelectedKey());

                let oPositionRequest = this.getBindingDetailObject();
                const oModel = this.getView().getModel();

                oModel.setProperty("Poscharac", "", this.getView().getBindingContext());
                this.getView().byId("justifCDI").setDescription("");


            },

            /**
               * Event handler for the onChange stepInput : Duration in months
               * @param {sap.ui.base.Event} oEvent the stepInput OnChange event
               * @public
               */
            onDurationMonthsChange: function (oEvent) {
                this._getTimeConstraints();
            },

            /**
              * Event handler for the onChange select : PosAllocPercentage
              * @param {sap.ui.base.Event} oEvent the button OnChange event
              * @public
              */
            onPosAllocPercentageChange: function (oEvent) {
                debugger;
                const view = this.getView();
                const workCapacityInput = view.byId("workCapacityApproved");
                const posAllocInput = oEvent.getSource();

                // get Values
                const posAllocValue = posAllocInput.getValue();
                const workCapacityValue = workCapacityInput.getValue();

                // Only if workCapacityValue = 0 and createMode 
                //TODO
                if (workCapacityValue === "0" && posAllocValue) {
                    workCapacityInput.setValue(posAllocValue);
                }
            },



            /*************************************************************************************************/
            /********************************  Begin Job management ******************************************/
            /*************************************************************************************************/
            /**
               * Event handler for the select event
               * @param {sap.ui.base.Event} oEvent JobArea
               * @public
               */
            onJobAreaChange: function (oEvent) {
                debugger;

                //empty job group/job/range/persk/persg
                let oPositionRequest = this.getBindingDetailObject();
                const oModel = this.getView().getModel();

                let job = oPositionRequest.Job;
                // if (job && job !== '') {
                oModel.setProperty("JobGroup", "", this.getView().getBindingContext());
                oModel.setProperty("Job", "", this.getView().getBindingContext());
                oModel.setProperty("Range", "", this.getView().getBindingContext());
                oModel.setProperty("Persg", "", this.getView().getBindingContext());
                oModel.setProperty("Persk", "", this.getView().getBindingContext());

                this.getView().byId("jobGroup").setDescription("");
                this.getView().byId("job").setDescription("");
                this.getView().byId("employeeGroup").setDescription("");
                this.getView().byId("employeeSubGroup").setDescription("");
                //  }

            },
            /**
               * Event handler for the ValueHelpPress event
               * @param {sap.ui.base.Event} oEvent t
               * @public
               */
            onJobGroupValueHelpPress: function (oEvent) {
                const oView = this.getView();
                if (!this.fragments._oJobGroupDialog) {
                    this.fragments._oJobGroupDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.JobGroupChoice", this);
                    this.getView().addDependent(this.fragments._oJobGroupDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oJobGroupDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel("i18n"), "i18n");
                }

                // Apply JobArea filter 
                this._applyFilterToJobGroupDialog();

                this.fragments._oJobGroupDialog.open();
            },

            /**
               * Event handler for the ValueHelpPress event
               * @param {sap.ui.base.Event} oEvent for Job
               * @public
               */
            onJobValueHelpPress: function (oEvent) {
                const oView = this.getView();
                if (!this.fragments._oJobDialog) {
                    this.fragments._oJobDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.JobChoice", this);
                    this.getView().addDependent(this.fragments._oJobDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oJobDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel("i18n"), "i18n");
                }

                // Apply JobArea filter 
                this._applyFilterToJobDialog();

                this.fragments._oJobDialog.open();
            },

            /**
               * Event handler for the select event
               * @param {sap.ui.base.Event} oEvent t
               * @public
               */

            onConfirmJobGroupSelectDialogPress: function (oEvent) {
                var oView = this.getView();
                var aContexts = oEvent.getParameter("selectedContexts");
                // get back the selected entry data
                if (aContexts && aContexts.length) {
                    // now set the returned values back into the view
                    oView.byId("jobGroup").setValue(
                        aContexts.map(function (oContext) {
                            return oContext.getObject().JobGroupId;
                        }).join(", "));

                    oView.byId("jobGroup").setDescription(
                        aContexts.map(function (oContext) {
                            return oContext.getObject().JobGroupStext;
                        }).join(", "));
                }
                // clear filters
                oEvent.getSource().getBinding("items").filter([]);
                // destroy the dialog
                if (this.fragments._oJobGroupDialog) {
                    this.fragments._oJobGroupDialog.destroy();
                    delete this.fragments._oJobGroupDialog;
                }

                //TODO! //Update Long description  
                debugger;

                //empty job group/job/range/persk/persg
                let oPositionRequest = this.getBindingDetailObject();
                const oModel = this.getView().getModel();

                let job = oPositionRequest.Job;
                // if (job && job !== '') {
                oModel.setProperty("Job", "", this.getView().getBindingContext());
                oModel.setProperty("Range", "", this.getView().getBindingContext());
                oModel.setProperty("Persg", "", this.getView().getBindingContext());
                oModel.setProperty("Persk", "", this.getView().getBindingContext());
                this.getView().byId("job").setDescription("");
                this.getView().byId("employeeGroup").setDescription("");
                this.getView().byId("employeeSubGroup").setDescription("");
            },

            /**
             * Event handler for the select event
             * @param {sap.ui.base.Event} oEvent t
             * @public
             */
            onConfirmJobSelectDialogPress: function (oEvent) {
                var oView = this.getView();
                var aContexts = oEvent.getParameter("selectedContexts");
                // get back the selected entry data
                if (aContexts && aContexts.length) {
                    // now set the returned values back into the view
                    oView.byId("job").setValue(
                        aContexts.map(function (oContext) {
                            return oContext.getObject().JobId;
                        }).join(", "));

                    oView.byId("job").setDescription(
                        aContexts.map(function (oContext) {
                            return oContext.getObject().JobStext;
                        }).join(", "));
                }
                // clear filters
                oEvent.getSource().getBinding("items").filter([]);
                // destroy the dialog
                if (this.fragments._oJobDialog) {
                    this.fragments._oJobDialog.destroy();
                    this.fragments._oJoBDialog = undefined;

                    delete this.fragments._oJobDialog;
                }

                //Get Job Infos
                this._updateJobInfos();
            },
            onSearchJobGroupSelectDialogPress: function (oEvent) {
                var sValue = oEvent.getParameter("value").toString();
                if (sValue !== "") {
                    var oFilter = new Filter("JobGroupId", sap.ui.model.FilterOperator.Contains, sValue);
                    var oBinding = oEvent.getSource().getBinding("items");
                    oBinding.filter([oFilter]);
                } else {
                    // clear filters
                    oEvent.getSource().getBinding("items").filter([]);
                }
            },

            getJobInfossSuccess: function (oModel, oSuccess) {
                debugger;
                oModel.setProperty("/busy", false);
                let oJobInfos = oSuccess.getJobInfos;

                //Visibility Range
                const oUiSettingsModel = this.getOwnerComponent().getModel("uiSettings");
                const isRangeVisible = oUiSettingsModel.getProperty("/rangeVisible");
                oUiSettingsModel.setProperty("/rangeVisible", oJobInfos.HasRange);


                const bindingContext = this.getView().getBindingContext();
                const path = bindingContext.getPath();
                const object = bindingContext.getModel().getProperty(path);

                if (oJobInfos.HasRange && object.Range === '')
                    oModel.setProperty("Range", oJobInfos.DefautRange, this.getView().getBindingContext());

                oModel.setProperty("Persg", oJobInfos.Persg, this.getView().getBindingContext());
                this.getView().byId("employeeGroup").setDescription(oJobInfos.PersgText);
                oModel.setProperty("Persk", oJobInfos.Persk, this.getView().getBindingContext());
                this.getView().byId("employeeSubGroup").setDescription(oJobInfos.PerskText);

/*                 let oDatesModel = new JSONModel(oDateSettings);
                this.getView().setModel(oDatesModel, 'datesModel');

                //  if (oDateSettings && oDateSettings.EndDate)
                if (this.byId("startDate").getValue() === '')
                    
                oModel.setProperty("EndDate", oDateSettings.EndDate, this.getView().getBindingContext()) */;
            },

            /*************************************************************************************************/
            /********************************  End Job management ********************************************/
            /*************************************************************************************************/


            /**********************************************************************************************************/
            /********************************  Begin Assignment management ********************************************/
            /**********************************************************************************************************/


            /**
             * Event handler for the ValueHelpPress event
             * @param {sap.ui.base.Event} oEvent for OrgUnit
             * @public
             */
            onOrgUnitValueHelpPress: function (oEvent) {
                const oView = this.getView();
                if (!this.fragments._oOrgUnitDialog) {
                    this.fragments._oOrgUnitDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.OrgUnitChoice", this);
                    this.getView().addDependent(this.fragments._oOrgUnitDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oOrgUnitDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel("i18n"), "i18n");
                }


                this.fragments._oOrgUnitDialog.open();
            },


            onSearchOrgUnitSelectDialog: function (oEvent) {
                debugger;
                const sValue = oEvent.getParameter("value").toString();
                if (sValue !== "") {
                    let oFilter = new Filter("ManagedBy", sap.ui.model.FilterOperator.Contains, sValue);
                    let oBinding = oEvent.getSource().getBinding("items");
                    oBinding.filter([oFilter]);
                } else {
                    // clear filters
                    oEvent.getSource().getBinding("items").filter([]);
                }
            },



            onConfirmOrgUnitSelectDialogPress: function (oEvent) {
                debugger;
                const oView = this.getView();
                const aContexts = oEvent.getParameter("selectedContexts");
                // get back the selected entry data
                if (aContexts && aContexts.length) {
                    let sOrgUnitName = aContexts.map(function (oContext) {
                        return oContext.getObject().OrgUnitName;
                    }).join(", ");
                    let sOrgUnitId = aContexts.map(function (oContext) {
                        return oContext.getObject().OrgUnitId;
                    }).join(", ");
                    // now set the returned values back into the view
                    oView.byId("assignedOrgUnit").setDescription(sOrgUnitName);
                    oView.byId("assignedOrgUnit").setValue(sOrgUnitId);
                }
                // clear filters
                oEvent.getSource().getBinding("items").filter([]);
                // destroy the dialog
                if (this.fragments._oOrgUnitDialog) {
                    this.fragments._oOrgUnitDialog.destroy();
                    delete this.fragments._oOrgUnitDialog;
                }
            },
            /**********************************************************************************************************/
            /********************************  End Assignment management ********************************************/
            /**********************************************************************************************************/

            /**********************************************************************************************************/
            /********************************  Begin PosCharac management ********************************************/
            /**********************************************************************************************************/

            /**
              * Event handler for the ValueHelpPress event
              * @param {sap.ui.base.Event} oEvent t
              * @public
              */
            onJustifCDIValueHelpPress: function (oEvent) {
                const oView = this.getView();
                if (!this.fragments._oJustifCDIDialog) {
                    this.fragments._oJustifCDIDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.JustifCDIChoice", this);
                    this.getView().addDependent(this.fragments._oJustifCDIDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oJustifCDIDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel());
                    //this._oPositionValueHelpDialog.setModel(oView.getModel("i18n"), "i18n");
                }

                // Apply dats filter
                this._applyFilterDatToJustifCDIDialog();

                this.fragments._oJustifCDIDialog.open();
            },



            onSearchJustifCDISelectDialogPress: function (oEvent) {
                var sValue = oEvent.getParameter("value").toString();
                if (sValue !== "") {
                    var oFilter = new Filter("Code", sap.ui.model.FilterOperator.Contains, sValue);
                    var oBinding = oEvent.getSource().getBinding("items");
                    oBinding.filter([oFilter]);
                } else {
                    // clear filters
                    oEvent.getSource().getBinding("items").filter([]);
                }
            },


            onConfirmJustifCDISelectDialogPress: function (oEvent) {

                const oView = this.getView();
                const aContexts = oEvent.getParameter("selectedContexts");
                // get back the selected entry data
                if (aContexts && aContexts.length) {
                    let sDescription = aContexts.map(function (oContext) {
                        return oContext.getObject().Description;
                    }).join(", ");
                    let sCode = aContexts.map(function (oContext) {
                        return oContext.getObject().Code;
                    }).join(", ");
                    // now set the returned values back into the view
                    oView.byId("justifCDI").setDescription(sDescription);
                    oView.byId("justifCDI").setValue(sCode);
                }
                // clear filters
                oEvent.getSource().getBinding("items").filter([]);
                // destroy the dialog
                if (this.fragments._oJustifCDIDialog) {
                    this.fragments._oJustifCDIDialog.destroy();
                    delete this.fragments._oJustifCDIDialog;
                }
            },
            /**********************************************************************************************************/
            /********************************  End PosCharac management ********************************************/
            /**********************************************************************************************************/


            /**********************************************************************************************************************************/
            /********************************  Begin PersonSearch(related and replaced) management ********************************************/
            /**********************************************************************************************************************************/

            /**
              * Event handler for the ValueHelpPress event
              * @param {sap.ui.base.Event} oEvent t
              * @public
              */
            onReplacedPernrValueHelpPress: function (oEvent) {
                debugger;
                const oView = this.getView();
                if (!this.fragments._oReplacedPernrDialog) {
                    this.fragments._oReplacedPernrDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.ReplacedPernrChoice", this);
                    this.getView().addDependent(this.fragments._oReplacedPernrDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oReplacedPernrDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                }

                // Apply type of pernr search filter
                const sFullId = oEvent.getSource().getId();
                const sLocalId = sFullId.split("--").pop();
                this._applyFilterPernrDialog(sLocalId);

                this.fragments._oReplacedPernrDialog.open();
            },


            /**
             * Event handler for the ValueHelpPress event
             * @param {sap.ui.base.Event} oEvent t
             * @public
             */
            onRelatedPernrValueHelpPress: function (oEvent) {
                debugger;
                const oView = this.getView();
                if (!this.fragments._oRelatedPernrDialog) {
                    this.fragments._oRelatedPernrDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.RelatedPernrChoice", this);
                    this.getView().addDependent(this.fragments._oRelatedPernrDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oRelatedPernrDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                }

                // Apply type of pernr search filter
                const sFullId = oEvent.getSource().getId();
                const sLocalId = sFullId.split("--").pop();
                this._applyFilterPernrDialog(sLocalId);

                this.fragments._oRelatedPernrDialog.open();
            },
            onSearchRelatedPernrSelectDialogPress: function (oEvent) {
                //TODO -> add filter type Person
                const sValue = oEvent.getParameter("value").toString();
                if (sValue !== "") {
                    const oFilterEname = new Filter("Ename", sap.ui.model.FilterOperator.Contains, sValue);


                    const oPositionRequest = this.getBindingDetailObject();
                    const oFilterDate = new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.EQ, oPositionRequest.StartDate);
                    const oFilterType = new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.EQ, "RelatedPernr");

                    const oCombinedFilter = new sap.ui.model.Filter({
                        filters: [oFilterDate, oFilterEname, oFilterType],
                        and: true
                    });



                    let oBinding = oEvent.getSource().getBinding("items");
                    oBinding.filter([oCombinedFilter]);
                } else {
                    // clear filters
                    oEvent.getSource().getBinding("items").filter([]);
                }
            },


            onSearchReplacedPernrSelectDialogPress: function (oEvent) {
                //TODO -> add filter type Person
                const sValue = oEvent.getParameter("value").toString();
                if (sValue !== "") {
                    const oFilterEname = new Filter("Ename", sap.ui.model.FilterOperator.Contains, sValue);


                    const oPositionRequest = this.getBindingDetailObject();
                    const oFilterDate = new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.EQ, oPositionRequest.StartDate);
                    const oFilterType = new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.EQ, "ReplacedPernr");

                    const oCombinedFilter = new sap.ui.model.Filter({
                        filters: [oFilterDate, oFilterEname, oFilterType],
                        and: true
                    });



                    let oBinding = oEvent.getSource().getBinding("items");
                    oBinding.filter([oCombinedFilter]);
                } else {
                    // clear filters
                    oEvent.getSource().getBinding("items").filter([]);
                }
            },


            onConfirmRelatedPernrSelectDialogPress: function (oEvent) {

                const oView = this.getView();
                const aContexts = oEvent.getParameter("selectedContexts");
                // get back the selected entry data
                if (aContexts && aContexts.length) {
                    let sDescription = aContexts.map(function (oContext) {
                        return oContext.getObject().Ename;
                    }).join(", ");
                    let sCode = aContexts.map(function (oContext) {
                        return oContext.getObject().Pernr;
                    }).join(", ");
                    // now set the returned values back into the view
                    oView.byId("relatedPernr").setDescription(sDescription);
                    oView.byId("relatedPernr").setValue(sCode);
                }
                // clear filters
                oEvent.getSource().getBinding("items").filter([]);
                // destroy the dialog
                if (this.fragments._oRelatedPernrDialog) {
                    this.fragments._oRelatedPernrDialog.destroy();
                    delete this.fragments._oRelatedPernrDialog;
                }
            },

            onConfirmReplacedPernrSelectDialogPress: function (oEvent) {

                const oView = this.getView();
                const aContexts = oEvent.getParameter("selectedContexts");
                // get back the selected entry data
                if (aContexts && aContexts.length) {
                    let sDescription = aContexts.map(function (oContext) {
                        return oContext.getObject().Ename;
                    }).join(", ");
                    let sCode = aContexts.map(function (oContext) {
                        return oContext.getObject().Pernr;
                    }).join(", ");
                    // now set the returned values back into the view
                    oView.byId("replacedPernr").setDescription(sDescription);
                    oView.byId("replacedPernr").setValue(sCode);
                }
                // clear filters
                oEvent.getSource().getBinding("items").filter([]);
                // destroy the dialog
                if (this.fragments._oReplacedPernrDialog) {
                    this.fragments._oReplacedPernrDialog.destroy();
                    delete this.fragments._oReplacedPernrDialog;
                }
            },
            /**********************************************************************************************************************************/
            /********************************  End   PersonSearch(related and replaced) management ********************************************/
            /**********************************************************************************************************************************/



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
             * Call a functionImport to get dates constraints
             * @function
             * @private
             */
            _getTimeConstraints: function () {
                /*  //Start Date 
                 --> Not in the past
                 --> Limit Year + 4 
                 --> Only '01' or '15' of the month */
                const oModel = this.getView().getModel();

                const bindingContext = this.getView().getBindingContext();
                const path = bindingContext.getPath();
                const object = bindingContext.getModel().getProperty(path);
                let oPositionRequest = bindingContext.getObject(); //getProperty("ReqFlow"); //bindingContext.getObject()
                let startDate = oPositionRequest.StartDate;
                let oUrlParam = {
                    "ReqType": oPositionRequest.ReqType,
                    "ReqFlow": oPositionRequest.ReqFlow,
                    //"StartDate": startDate,
                    "ContractType": oPositionRequest.ContractType,
                    "DurationInMonths": oPositionRequest.DurationInMonths

                };

                if (startDate) { oUrlParam.StartDate = startDate; }

                oModel.setProperty("/busy", true);

                oModel.callFunction("/getDateSettings", {
                    method: "GET",
                    urlParameters: oUrlParam,
                    success: function (oSuccess) {
                        oModel.setProperty("/busy", false);
                        let oDateSettings = oSuccess.getDateSettings;
                        let oDatesModel = new JSONModel(oDateSettings);
                        this.getView().setModel(oDatesModel, 'datesModel');

                        //  if (oDateSettings && oDateSettings.EndDate)
                        if (this.byId("startDate").getValue() === '')
                            oModel.setProperty("StartDate", oDateSettings.DateInitial, this.getView().getBindingContext());
                        oModel.setProperty("EndDate", oDateSettings.EndDate, this.getView().getBindingContext());

                        // oModel.refresh();
                    }.bind(this),
                    error: function (oError) {
                        oModel.setProperty("/busy", false);
                        var oFunctError = JSON.parse(oError.responseText);
                        MessageBox.error(oFunctError.error.message.value);
                    }
                });

            },

            /**
             * Binds the view to the object path. Makes sure that detail view displays
             * a busy indicator while data for the corresponding element binding is loaded.
             * @function
             * @param {string} sObjectPath path to the object to be bound to the view.
             * @private
             */
            _bindView: function (sObjectPath) {
                let that = this;
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
                            //that._getTimeConstraints();
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

            },

            _applyFilterToJobGroupDialog: function () {

                // Get filter value
                const bindingContext = this.getView().getBindingContext();
                const oPositionRequest = bindingContext.getObject();

                const oFilter = new sap.ui.model.Filter("JobAreaCode", sap.ui.model.FilterOperator.EQ, oPositionRequest.JobArea);

                // filter items binding
                const oBinding = sap.ui.getCore().byId("jobGroupSelectDialog").getBinding("items");
                if (oBinding) {
                    oBinding.filter([oFilter]);
                }
            },

            _applyFilterToJobDialog: function () {

                // Get filter value
                const bindingContext = this.getView().getBindingContext();
                const oPositionRequest = bindingContext.getObject();

                const oFilter = new sap.ui.model.Filter("JobGroupId", sap.ui.model.FilterOperator.EQ, oPositionRequest.JobGroup);

                // filter items binding
                const oBinding = sap.ui.getCore().byId("jobSelectDialog").getBinding("items");
                if (oBinding) {
                    oBinding.filter([oFilter]);
                }
            },


            _applyFilterDatToJustifCDIDialog: function () {

                // Get filter value
                const bindingContext = this.getView().getBindingContext();
                const oPositionRequest = bindingContext.getObject();

                const oFilter = new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.EQ, oPositionRequest.StartDate);

                // filter items binding
                const oBinding = sap.ui.getCore().byId("justifCDISelectDialog").getBinding("items");
                if (oBinding) {
                    oBinding.filter([oFilter]);
                }
            },


            _applyFilterPernrDialog: function (sTypePernr) {
                debugger;

                // Get filter value
                const bindingContext = this.getView().getBindingContext();
                const oPositionRequest = bindingContext.getObject();

                const oFilterDate = new sap.ui.model.Filter("Begda", sap.ui.model.FilterOperator.EQ, oPositionRequest.StartDate);
                const oFilterType = new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.EQ, sTypePernr);

                const oCombinedFilter = new sap.ui.model.Filter({
                    filters: [oFilterDate, oFilterType],
                    and: true
                });

                // filter items binding
                let sTypeDialog = (sTypePernr === "relatedPernr" ? "relatedPernrSelectDialog" : "replacedPernrSelectDialog");
                const oBinding = sap.ui.getCore().byId(sTypeDialog).getBinding("items");
                if (oBinding) {
                    oBinding.filter([oCombinedFilter]);
                }
            },




            _updateJobInfos: function () {

                debugger;
                const oModel = this.getView().getModel();

                const bindingContext = this.getView().getBindingContext();
                const path = bindingContext.getPath();
                const object = bindingContext.getModel().getProperty(path);
                let oPositionRequest = bindingContext.getObject(); //getProperty("ReqFlow"); //bindingContext.getObject()
                let startDate = oPositionRequest.StartDate;
                let oUrlParam = {
                    "Job": oPositionRequest.Job,
                    "Datum": startDate,
                };

                // if (startDate) { oUrlParam.StartDate = startDate; }

                oModel.setProperty("/busy", true);

                oModel.callFunction("/getJobInfos", {
                    method: "GET",
                    urlParameters: oUrlParam,
                    success: this.getJobInfossSuccess.bind(this, oModel),
                    error: this.fError.bind(this)
                    // success: function (oSuccess) {
                    //     oModel.setProperty("/busy", false);
                    //     /* let oDateSettings = oSuccess.getDateSettings;
                    //     let oDatesModel = new JSONModel(oDateSettings);
                    //     this.getView().setModel(oDatesModel, 'datesModel');

                    //     //  if (oDateSettings && oDateSettings.EndDate)
                    //     if (this.byId("startDate").getValue() === '')
                    //         oModel.setProperty("StartDate", oDateSettings.DateInitial, this.getView().getBindingContext());
                    //     oModel.setProperty("EndDate", oDateSettings.EndDate, this.getView().getBindingContext());

                    //     // oModel.refresh(); */
                    // }.bind(this),
                    // error: function (oError) {
                    //     oModel.setProperty("/busy", false);
                    //     var oFunctError = JSON.parse(oError.responseText);
                    //     MessageBox.error(oFunctError.error.message.value);
                    // }
                });
            },

            _updateUiSettings(oId, oValue) {
                const oUiSettingsModel = this.getOwnerComponent().getModel("uiSettings");

                if (oId === "contractType") {
                    if (oValue === 'CDI') {
                        // oUiSettingsModel.setProperty("/justifCDIVisible", true);
                        oUiSettingsModel.setProperty("/justifCDDVisible", false);
                    }

                    if (oValue === 'CDD') {
                        // oUiSettingsModel.setProperty("/justifCDIVisible", false);
                        oUiSettingsModel.setProperty("/justifCDDVisible", true);
                    }
                }

            },

            _savePosRequestObject: function () {
                const that = this;
                const oView = this.getView();
                const oModel = oView.getModel();
                const oResourceBundle = this.getResourceBundle();
                // set status to saved draft
                oView.byId("draftIndicator").showDraftSaving();

                if (oModel.hasPendingChanges()) {

                    // set busy indicator during view binding
                    var oViewModel = this.getModel("detailView");
                    oViewModel.setProperty("/busy", true);

                    oModel.submitChanges({
                        success: function (oBatchData) {
                            oViewModel.setProperty("/busy", false);
                            // error in $batch responses / payload ? > no ChangeResponses ?
                            if (!oBatchData.__batchResponses[0].__changeResponses) {
                                var oError = JSON.parse(oBatchData.__batchResponses[0].response.body);
                                MessageBox.error(oError.error.message.value.toString());
                                oModel.resetChanges();
                            } else {
                                // reset the message popover 
                                sap.ui.getCore().getMessageManager().removeAllMessages();
                                that._resetValidationChecks();
                                oView.byId("draftIndicator").showDraftSaved();
                            }
                        }
                    });
                } else {
                    //MessageBox.information(oResourceBundle.getText("noChangesToSubmit"));
                }
            }

        });
    });
