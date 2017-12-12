'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
function getDecimals(n) {
  n = n + '';
  var i = n.indexOf('.');
  return (i == -1) ? 0 : n.length - i - 1;
}

function getVF(n, opt_precision) {
  var v = opt_precision;

  if (undefined === v) {
    v = Math.min(getDecimals(n), 3);
  }

  var base = Math.pow(10, v);
  var f = ((n * base) | 0) % base;
  return {v: v, f: f};
}

$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
<<<<<<< HEAD
      "prije podne",
=======
      "prijepodne",
>>>>>>> develop
      "popodne"
    ],
    "DAY": [
      "nedjelja",
      "ponedjeljak",
      "utorak",
      "srijeda",
      "\u010detvrtak",
      "petak",
      "subota"
    ],
    "ERANAMES": [
<<<<<<< HEAD
      "Prije nove ere",
      "Nove ere"
=======
      "prije nove ere",
      "nove ere"
>>>>>>> develop
    ],
    "ERAS": [
      "p. n. e.",
      "n. e."
    ],
    "FIRSTDAYOFWEEK": 0,
    "MONTH": [
      "januar",
      "februar",
      "mart",
      "april",
      "maj",
      "juni",
      "juli",
<<<<<<< HEAD
      "august",
=======
      "avgust",
>>>>>>> develop
      "septembar",
      "oktobar",
      "novembar",
      "decembar"
    ],
    "SHORTDAY": [
      "ned",
      "pon",
      "uto",
      "sri",
      "\u010det",
      "pet",
      "sub"
    ],
    "SHORTMONTH": [
      "jan",
      "feb",
      "mar",
      "apr",
      "maj",
      "jun",
      "jul",
<<<<<<< HEAD
      "aug",
=======
      "avg",
>>>>>>> develop
      "sep",
      "okt",
      "nov",
      "dec"
    ],
<<<<<<< HEAD
=======
    "STANDALONEMONTH": [
      "januar",
      "februar",
      "mart",
      "april",
      "maj",
      "juni",
      "juli",
      "avgust",
      "septembar",
      "oktobar",
      "novembar",
      "decembar"
    ],
>>>>>>> develop
    "WEEKENDRANGE": [
      5,
      6
    ],
<<<<<<< HEAD
    "fullDate": "EEEE, dd. MMMM y.",
    "longDate": "dd. MMMM y.",
    "medium": "dd. MMM. y. HH:mm:ss",
    "mediumDate": "dd. MMM. y.",
    "mediumTime": "HH:mm:ss",
    "short": "dd.MM.yy. HH:mm",
    "shortDate": "dd.MM.yy.",
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "\u20ac",
=======
    "fullDate": "EEEE, d. MMMM y.",
    "longDate": "d. MMMM y.",
    "medium": "d. MMM. y. HH:mm:ss",
    "mediumDate": "d. MMM. y.",
    "mediumTime": "HH:mm:ss",
    "short": "d.M.yy. HH:mm",
    "shortDate": "d.M.yy.",
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "KM",
>>>>>>> develop
    "DECIMAL_SEP": ",",
    "GROUP_SEP": ".",
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
        "negPre": "-",
        "negSuf": "\u00a0\u00a4",
        "posPre": "",
        "posSuf": "\u00a0\u00a4"
      }
    ]
  },
  "id": "bs-latn",
<<<<<<< HEAD
  "pluralCat": function(n, opt_precision) {  var i = n | 0;  var vf = getVF(n, opt_precision);  if (i == 1 && vf.v == 0) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
=======
  "localeID": "bs_Latn",
  "pluralCat": function(n, opt_precision) {  var i = n | 0;  var vf = getVF(n, opt_precision);  if (vf.v == 0 && i % 10 == 1 && i % 100 != 11 || vf.f % 10 == 1 && vf.f % 100 != 11) {    return PLURAL_CATEGORY.ONE;  }  if (vf.v == 0 && i % 10 >= 2 && i % 10 <= 4 && (i % 100 < 12 || i % 100 > 14) || vf.f % 10 >= 2 && vf.f % 10 <= 4 && (vf.f % 100 < 12 || vf.f % 100 > 14)) {    return PLURAL_CATEGORY.FEW;  }  return PLURAL_CATEGORY.OTHER;}
>>>>>>> develop
});
}]);
