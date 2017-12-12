'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "vm.",
      "nm."
    ],
    "DAY": [
      "Sondag",
      "Maandag",
      "Dinsdag",
      "Woensdag",
      "Donderdag",
      "Vrydag",
      "Saterdag"
    ],
    "ERANAMES": [
      "voor Christus",
      "na Christus"
    ],
    "ERAS": [
      "v.C.",
      "n.C."
    ],
    "FIRSTDAYOFWEEK": 6,
    "MONTH": [
      "Januarie",
      "Februarie",
      "Maart",
      "April",
      "Mei",
      "Junie",
      "Julie",
      "Augustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ],
    "SHORTDAY": [
<<<<<<< HEAD
      "So",
      "Ma",
      "Di",
      "Wo",
      "Do",
      "Vr",
      "Sa"
=======
      "So.",
      "Ma.",
      "Di.",
      "Wo.",
      "Do.",
      "Vr.",
      "Sa."
>>>>>>> develop
    ],
    "SHORTMONTH": [
      "Jan.",
      "Feb.",
      "Mrt.",
<<<<<<< HEAD
      "Apr",
      "Mei",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Okt",
      "Nov",
      "Des"
=======
      "Apr.",
      "Mei",
      "Jun.",
      "Jul.",
      "Aug.",
      "Sep.",
      "Okt.",
      "Nov.",
      "Des."
    ],
    "STANDALONEMONTH": [
      "Januarie",
      "Februarie",
      "Maart",
      "April",
      "Mei",
      "Junie",
      "Julie",
      "Augustus",
      "September",
      "Oktober",
      "November",
      "Desember"
>>>>>>> develop
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE, dd MMMM y",
    "longDate": "dd MMMM y",
<<<<<<< HEAD
    "medium": "dd MMM y h:mm:ss a",
    "mediumDate": "dd MMM y",
    "mediumTime": "h:mm:ss a",
    "short": "y-MM-dd h:mm a",
    "shortDate": "y-MM-dd",
    "shortTime": "h:mm a"
=======
    "medium": "dd MMM y HH:mm:ss",
    "mediumDate": "dd MMM y",
    "mediumTime": "HH:mm:ss",
    "short": "y-MM-dd HH:mm",
    "shortDate": "y-MM-dd",
    "shortTime": "HH:mm"
>>>>>>> develop
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "R",
    "DECIMAL_SEP": ",",
    "GROUP_SEP": "\u00a0",
    "PATTERNS": [
      {
        "gSize": 3,
        "lgSize": 3,
        "maxFrac": 3,
        "minFrac": 0,
        "minInt": 1,
        "negPre": "-",
        "negSuf": "",
        "posPre": "",
        "posSuf": ""
      },
      {
        "gSize": 3,
        "lgSize": 3,
        "maxFrac": 2,
        "minFrac": 2,
        "minInt": 1,
<<<<<<< HEAD
        "negPre": "\u00a4-",
=======
        "negPre": "-\u00a4",
>>>>>>> develop
        "negSuf": "",
        "posPre": "\u00a4",
        "posSuf": ""
      }
    ]
  },
  "id": "af",
<<<<<<< HEAD
=======
  "localeID": "af",
>>>>>>> develop
  "pluralCat": function(n, opt_precision) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
});
}]);
