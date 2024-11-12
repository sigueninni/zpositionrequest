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
        },
        flowText: function (iFlow) {
            if (iFlow) {
                switch (iFlow) {
                    case 'c':
                        return "Create";
                    case 'u':
                        return "Update";
                    default:
                        return "None";
                }
            } else {
                return "None";
            }

        },

        typeText: function (iType) {
            if (iType) {
                switch (iType) {
                    case '01':
                        return "position creation";
                    case '02':
                        return "position creation(temporary leave)";
                    case '21':
                        return "trigger recruitment";
                    case '22':
                        return "position extension";
                    case '23':
                        return "working time change";
                    case '24':
                        return "type of contract change";
                    case '25':
                        return "job/level change";
                    case '26':
                        return "range change";
                    case '27':
                        return "assignment change";
                    case '28':
                        return "on hold";
                    case '29':
                        return "otp change";
                    default:
                        return "None";
                }
            } else {
                return "None";
            }

        },
        formatTime: function (oTime) {
            if (oTime) {
                var oDate = new Date(oTime.ms);
                var sTimeinMilliseconds = oDate.getTime();
                var oTimeFormat = sap.ui.core.format.DateFormat.getTimeInstance({
                    pattern: "HH:mm"
                });
                var TZOffsetMs = new Date(0).getTimezoneOffset() * 60 * 1000;
                var sTime = oTimeFormat.format(new Date(sTimeinMilliseconds + TZOffsetMs));
                return sTime;
            }
            return null;
        },


    };



})