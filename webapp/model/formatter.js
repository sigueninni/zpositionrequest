sap.ui.define([], function () {
    "use strict";
    return {

        statusText: function (iStatus) {
            if (iStatus) {
                switch (iStatus) {
                    case 1:
                        return "Draft";
                    case 2:
                        return "Saved as draft";
                    case 3:
                        return "Submitted";
                    case 4:
                        return "In process";
                    case 5:
                        return "Rejected";
                    case 6:
                        return "Approved";
                    case 7:
                        return "Completed";
                    default:
                        return "";
                }
            } else {
                return "";
            }
        },

        statusStateText: function (iStatus) {
            if (iStatus) {
                switch (iStatus) {
                    case 1:
                        return "None";
                    case 2:
                        return "None";
                    case 3:
                        return "Success";
                    case 4:
                        return "Warning";
                    case 5:
                        return "Error";
                    case 7:
                        return "None";
                    default:
                        return "None";
                }
            } else {
                return "None";
            }
        }


    };



})