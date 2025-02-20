sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "sap/ui/Device"
],
    function (JSONModel, Device) {
        "use strict";

        return {
            /**
             * Provides runtime info for the device the UI5 app is running on as JSONModel
             */
            createDeviceModel: function () {
                var oModel = new JSONModel(Device);
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            },

            createFLPModel: function () {
                var fnGetuser = jQuery.sap.getObject("sap.ushell.Container.getUser"),
                    bIsShareInJamActive = fnGetuser ? fnGetuser().isJamActive() : false,
                    oModel = new JSONModel({
                        isShareInJamActive: bIsShareInJamActive
                    });
                oModel.setDefaultBindingMode("OneWay");
                return oModel;
            }
        };

    });