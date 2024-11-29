/**    **********************************************************************-->
<!--* Projet           :  UNI			          							*-->
<!--* Module           :  Position Request			             		    *-->
<!--* Auteur           :  Saad Igueninni                            		*-->
<!--* Societe      	   :  KYWAN                                          	*-->
<!--* Date de creation :  20/11/2024                                		*-->
<!--* Version	       :  Initial											*-->
<!--* Description  	   :  Master(Dashboard) Controller for Position         *-->
<!--*                     Request App                                       *-->
<!--*********************************************************************   ***/

sap.ui.define([
    "lu/uni/zpositionrequest/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "lu/uni/zpositionrequest/model/formatter",
    "sap/ui/Device",
],
    function (BaseController, JSONModel, formatter, Device) {
        "use strict";

        return BaseController.extend("lu.uni.zpositionrequest.controller.Dashboard", {

            formatter: formatter,

            /* =========================================================== */
            /* lifecycle methods                                           */
            /* =========================================================== */
            onInit: function () {

                let oList = this.byId("list"),
                    oViewModel = this._createViewModel(),
                    iOriginalBusyDelay = oList.getBusyIndicatorDelay();

                //TODO : ajouter le groupSortState    
                // this._oGroupSortState = new GroupSortState(oViewModel, grouper.groupUnitNumber(this.getResourceBundle()));

                this._oList = oList;
                this.setModel(oViewModel, "masterView");
                // Make sure, busy indication is showing immediately so there is no
                // break after the busy indication for loading the view's meta data is
                // ended (see promise 'oWhenMetadataIsLoaded' in AppController)
                oList.attachEventOnce("updateFinished", function () {
                    // Restore original busy indicator delay for the list
                    oViewModel.setProperty("/delay", iOriginalBusyDelay);
                });

                this.getView().addEventDelegate({
                    onBeforeFirstShow: function () {
                        this.getOwnerComponent().oListSelector.setBoundMasterList(oList);
                    }.bind(this)
                });
                this.getRouter().getRoute("RouteMaster").attachPatternMatched(this._onMasterMatched, this);
                this.getRouter().attachBypassed(this.onBypassed, this);

            },


            /* =========================================================== */
            /* event handlers                                              */
            /* =========================================================== */

            /**
             * Event handler for the bypassed event, which is fired when no routing pattern matched.
             * If there was an object selected in the master list, that selection is removed.
             * @public
             */
            onBypassed: function () {
                this._oList.removeSelections(true);
            },
            /**
             * Event handler for the list selection event
             * @param {sap.ui.base.Event} oEvent the list selectionChange event
             * @public
             */
            onSelectionChange: function (oEvent) {
                // get the list item, either from the listItem parameter or from the event's source itself (will depend on the device-dependent mode).
                this._showDetail(oEvent.getParameter("listItem") || oEvent.getSource());
            },

            /**
             * Event handler for the button create
             * @param {sap.ui.base.Event} oEvent  the button Click event
             * @public
             */
            onCreateButtonPress: function (oEvent) {

                if (!this.fragments._oTypeFlowDialog) {
                    this.fragments._oTypeFlowDialog = sap.ui.xmlfragment("lu.uni.zpositionrequest.fragment.TypeFlowChoice", this);
                    this.getView().addDependent(this.fragments._oTypeFlowDialog);
                    // forward compact/cozy style into Dialog
                    this.fragments._oTypeFlowDialog.addStyleClass(this.getOwnerComponent().getContentDensityClass());
                }
                this.fragments._oTypeFlowDialog.open();

            },

            /**
             * Event handler for the button create in TypeFlowChoice.fragment
             * @param {sap.ui.base.Event} oEvent the button Click event
             * @public
             */
            onConfirmTypeFlowButtonPress: function (oEvent) {
                const sGroupId = "positionRequest" + (new Date().getUTCMilliseconds());
                const oRouter = this.getRouter();
                const oModel = this.getView().getModel();
                let aDeferredGroups = oModel.getDeferredGroups();
                // set this subset to deferred
                aDeferredGroups = aDeferredGroups.concat([sGroupId]);
                oModel.setDeferredGroups(aDeferredGroups);


                //Get type Flow
                debugger;
                let reqFlow = sap.ui.getCore().byId("rgbFlowType").getSelectedButton().getId();

                // set busy indicator during view binding
                let oViewModel = this.getModel("masterView");
                oViewModel.setProperty("/busy", true);
                //sap.ui.core.BusyIndicator.show();

                // create a new entry in model
                oModel.createEntry("/PositionRequestSet", {
                    groupId: sGroupId,
                    properties: {
                        "Version": 1,
                        "Status": 1,
                        "ReqFlow": reqFlow,
                        "Title": this.getResourceBundle().getText("newPositionRequestTitle"),
                        "CreatedOn": new Date()
                    }
                });

                // initialize the request in backend and then navigate to object page for binding
                oModel.submitChanges({
                    groupId: sGroupId,
                    success: function (oSuccess) {
                        let oResponse = oSuccess.__batchResponses[0];
                        if (oResponse.__changeResponses) {
                            let oNewEntry = oResponse.__changeResponses[0].data;
                            oViewModel.setProperty("/busy", false);
                            oRouter.navTo("RouteDetail", {
                                positionRequestId: oNewEntry.Guid
                            }, true);
                            // setTimeout(function() { 
                            // 	oViewModel.setProperty("/busy", false);
                            // 	//sap.ui.core.BusyIndicator.hide();
                            // 	oRouter.navTo("object", {
                            // 		"objectId": oNewEntry.Id //object key
                            // 	});
                            // }, 1500);
                        } else {
                            oViewModel.setProperty("/busy", false);
                            //sap.ui.core.BusyIndicator.hide();
                        }

                        this.fragments._oTypeFlowDialog.close();
                        this.fragments._oTypeFlowDialog.destroy();
                        delete this.fragments._oTypeFlowDialog;

                    }.bind(this)
                });
            },

            /**
             * Event handler for the button Cancel in TypeFlowChoice.fragment
             * @param {sap.ui.base.Event} oEvent the button Click event
             * @public
             */
            onCancelTypeFlowButtonPres: function (oEvent) {
                this._oTypeFlowDialog.close();
                this._oTypeFlowDialog.destroy();
                delete this._oTypeFlowDialog;
            },

            /**
             * Event handler for the select event TypeFlowChoice.fragment
             * @param {sap.ui.base.Event} oEvent the select event
             * @public
             */
            setFlowTypeAtCreation: function (oEvent) {
                debugger;
                console.log(oEvent.getParameter("selectedIndex"));
            },


            /* =========================================================== */
            /*  internal methods                                     */
            /* =========================================================== */

            _createViewModel: function () {
                return new JSONModel({
                    isFilterBarVisible: false,
                    filterBarLabel: "",
                    delay: 0,
                    title: this.getResourceBundle().getText("masterTitleCount", [0]),
                    noDataText: this.getResourceBundle().getText("masterListNoDataText"),
                    sortBy: "Title",
                    groupBy: "None"
                });
            },

            /**
             * Shows the selected item on the detail page
             * On phones a additional history entry is created
             * @param {sap.m.ObjectListItem} oItem selected Item
             * @private
             */
            _showDetail: function (oItem) {
                const bReplace = !Device.system.phone;
                this.getRouter().navTo("RouteDetail", {
                    positionRequestId: oItem.getBindingContext().getProperty("Guid")
                }, bReplace);


            },

            /**
             * If the master route was hit (empty hash) we have to set
             * the hash to to the first item in the list as soon as the
             * listLoading is done and the first item in the list is known
             * @private
             */
            _onMasterMatched: function () {
                // debugger;
                /*           if (this.getOwnerComponent().getComponentData() && this.getOwnerComponent().getComponentData().startupParameters) {
          
                              //TODO check why not working in FLP mode and why undefined in noFlp
                              const startupParams = this.getOwnerComponent().getComponentData().startupParameters; // get Startup params from Owner Component
                              if ((startupParams.objectId && startupParams.objectId[0])) {
          
                                  this._oList.removeAllItems();
                                  this.getRouter().navTo("object", {
                                      objectId: startupParams.objectId[0]  // read Supplier ID. Every parameter is placed in an array therefore [0] holds the value
                                  }, true);
                              }
          
                          }
                          else { */
                this.getOwnerComponent().oListSelector.oWhenListLoadingIsDone.then(

                    function (mParams) {
                        console.log('done');
                        if (mParams.list.getMode() === "None") {
                            return;
                        }

                        let sObjectId = mParams.firstListitem.getBindingContext().getProperty("Guid");
                        console.log({ sObjectId });
                        this.getRouter().navTo("RouteDetail", {
                            positionRequestId: sObjectId
                        }, true);
                    }.bind(this),
                    function (mParams) {
                        if (mParams.error) {
                            console.log(mParams.error)
                            return;
                        }
                        this.getRouter().getTargets().display("detailNoObjectsAvailable");
                    }.bind(this)
                );
                //  }
            },



        });
    });
