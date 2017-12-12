'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "a.m.",
      "p.m."
    ],
    "DAY": [
      "s\u00f8ndag",
      "mandag",
      "tirsdag",
      "onsdag",
      "torsdag",
      "fredag",
      "l\u00f8rdag"
    ],
    "ERANAMES": [
<<<<<<< HEAD
      "f.Kr.",
      "e.Kr."
=======
      "f\u00f8r Kristus",
      "etter Kristus"
>>>>>>> develop
    ],
    "ERAS": [
      "f.Kr.",
      "e.Kr."
    ],
    "FIRSTDAYOFWEEK": 0,
    "MONTH": [
      "januar",
      "februar",
      "mars",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "desember"
    ],
    "SHORTDAY": [
      "s\u00f8n.",
      "man.",
      "tir.",
      "ons.",
      "tor.",
      "fre.",
      "l\u00f8r."
    ],
    "SHORTMONTH": [
      "jan.",
      "feb.",
      "mar.",
      "apr.",
      "mai",
      "jun.",
      "jul.",
      "aug.",
      "sep.",
      "okt.",
      "nov.",
      "des."
    ],
<<<<<<< HEAD
=======
    "STANDALONEMONTH": [
      "januar",
      "februar",
      "mars",
      "april",
      "mai",
      "juni",
      "juli",
      "august",
      "september",
      "oktober",
      "november",
      "desember"
    ],
>>>>>>> develop
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE d. MMMM y",
    "longDate": "d. MMMM y",
<<<<<<< HEAD
    "medium": "d. MMM y HH.mm.ss",
    "mediumDate": "d. MMM y",
    "mediumTime": "HH.mm.ss",
    "short": "dd.MM.y HH.mm",
    "shortDate": "dd.MM.y",
    "shortTime": "HH.mm"
=======
    "medium": "d. MMM y HH:mm:ss",
    "mediumDate": "d. MMM y",
    "mediumTime": "HH:mm:ss",
    "short": "dd.MM.y HH:mm",
    "shortDate": "dd.MM.y",
    "shortTime": "HH:mm"
>>>>>>> develop
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "kr",
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
        "negPre": "\u00a4\u00a0-",
=======
        "negPre": "-\u00a4\u00a0",
>>>>>>> develop
        "negSuf": "",
        "posPre": "\u00a4\u00a0",
        "posSuf": ""
      }
    ]
  },
  "id": "nb-sj",
<<<<<<< HEAD
=======
  "localeID": "nb_SJ",
>>>>>>> develop
  "pluralCat": function(n, opt_precision) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
});
}]);
