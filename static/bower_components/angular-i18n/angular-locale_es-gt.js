'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
<<<<<<< HEAD
      "a.\u00a0m.",
      "p.\u00a0m."
=======
      "a. m.",
      "p. m."
>>>>>>> develop
    ],
    "DAY": [
      "domingo",
      "lunes",
      "martes",
      "mi\u00e9rcoles",
      "jueves",
      "viernes",
      "s\u00e1bado"
    ],
    "ERANAMES": [
      "antes de Cristo",
      "despu\u00e9s de Cristo"
    ],
    "ERAS": [
      "a. C.",
      "d. C."
    ],
    "FIRSTDAYOFWEEK": 6,
    "MONTH": [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
<<<<<<< HEAD
      "setiembre",
=======
      "septiembre",
>>>>>>> develop
      "octubre",
      "noviembre",
      "diciembre"
    ],
    "SHORTDAY": [
      "dom.",
      "lun.",
      "mar.",
      "mi\u00e9.",
      "jue.",
      "vie.",
      "s\u00e1b."
    ],
    "SHORTMONTH": [
      "ene.",
      "feb.",
      "mar.",
      "abr.",
      "may.",
      "jun.",
      "jul.",
      "ago.",
<<<<<<< HEAD
      "set.",
=======
      "sep.",
>>>>>>> develop
      "oct.",
      "nov.",
      "dic."
    ],
<<<<<<< HEAD
=======
    "STANDALONEMONTH": [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre"
    ],
>>>>>>> develop
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "EEEE, d 'de' MMMM 'de' y",
    "longDate": "d 'de' MMMM 'de' y",
<<<<<<< HEAD
    "medium": "d/MM/y h:mm:ss a",
    "mediumDate": "d/MM/y",
    "mediumTime": "h:mm:ss a",
    "short": "d/MM/yy h:mm a",
    "shortDate": "d/MM/yy",
    "shortTime": "h:mm a"
=======
    "medium": "d/MM/y HH:mm:ss",
    "mediumDate": "d/MM/y",
    "mediumTime": "HH:mm:ss",
    "short": "d/MM/yy HH:mm",
    "shortDate": "d/MM/yy",
    "shortTime": "HH:mm"
>>>>>>> develop
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "Q",
    "DECIMAL_SEP": ".",
    "GROUP_SEP": ",",
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
  "id": "es-gt",
<<<<<<< HEAD
=======
  "localeID": "es_GT",
>>>>>>> develop
  "pluralCat": function(n, opt_precision) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
});
}]);
