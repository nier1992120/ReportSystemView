'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "PG",
      "PTG"
    ],
    "DAY": [
      "Ahad",
      "Isnin",
      "Selasa",
      "Rabu",
      "Khamis",
      "Jumaat",
      "Sabtu"
    ],
<<<<<<< HEAD
=======
    "ERANAMES": [
      "S.M.",
      "TM"
    ],
    "ERAS": [
      "S.M.",
      "TM"
    ],
    "FIRSTDAYOFWEEK": 0,
>>>>>>> develop
    "MONTH": [
      "Januari",
      "Februari",
      "Mac",
      "April",
      "Mei",
      "Jun",
      "Julai",
      "Ogos",
      "September",
      "Oktober",
      "November",
      "Disember"
    ],
    "SHORTDAY": [
      "Ahd",
      "Isn",
      "Sel",
      "Rab",
      "Kha",
      "Jum",
      "Sab"
    ],
    "SHORTMONTH": [
      "Jan",
      "Feb",
      "Mac",
      "Apr",
      "Mei",
      "Jun",
      "Jul",
<<<<<<< HEAD
      "Ogos",
=======
      "Ogo",
>>>>>>> develop
      "Sep",
      "Okt",
      "Nov",
      "Dis"
    ],
<<<<<<< HEAD
    "fullDate": "dd MMMM y",
    "longDate": "d MMMM y",
    "medium": "dd/MM/yyyy h:mm:ss a",
    "mediumDate": "dd/MM/yyyy",
=======
    "STANDALONEMONTH": [
      "Januari",
      "Februari",
      "Mac",
      "April",
      "Mei",
      "Jun",
      "Julai",
      "Ogos",
      "September",
      "Oktober",
      "November",
      "Disember"
    ],
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "dd MMMM y",
    "longDate": "d MMMM y",
    "medium": "d MMM y h:mm:ss a",
    "mediumDate": "d MMM y",
>>>>>>> develop
    "mediumTime": "h:mm:ss a",
    "short": "d/MM/yy h:mm a",
    "shortDate": "d/MM/yy",
    "shortTime": "h:mm a"
  },
  "NUMBER_FORMATS": {
<<<<<<< HEAD
    "CURRENCY_SYM": "RM",
    "DECIMAL_SEP": ".",
    "GROUP_SEP": ",",
=======
    "CURRENCY_SYM": "$",
    "DECIMAL_SEP": ",",
    "GROUP_SEP": ".",
>>>>>>> develop
    "PATTERNS": [
      {
        "gSize": 3,
        "lgSize": 3,
<<<<<<< HEAD
        "macFrac": 0,
=======
>>>>>>> develop
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
<<<<<<< HEAD
        "macFrac": 0,
        "maxFrac": 2,
        "minFrac": 2,
        "minInt": 1,
        "negPre": "(\u00a4",
        "negSuf": ")",
        "posPre": "\u00a4",
=======
        "maxFrac": 2,
        "minFrac": 2,
        "minInt": 1,
        "negPre": "-\u00a4\u00a0",
        "negSuf": "",
        "posPre": "\u00a4\u00a0",
>>>>>>> develop
        "posSuf": ""
      }
    ]
  },
  "id": "ms-bn",
<<<<<<< HEAD
  "pluralCat": function (n) {  return PLURAL_CATEGORY.OTHER;}
});
}]);
=======
  "localeID": "ms_BN",
  "pluralCat": function(n, opt_precision) {  return PLURAL_CATEGORY.OTHER;}
});
}]);
>>>>>>> develop
