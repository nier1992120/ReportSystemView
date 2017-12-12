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
      "a.m.",
      "p.m."
    ],
    "DAY": [
<<<<<<< HEAD
      "De Sul",
      "De Lun",
      "De Merth",
      "De Merher",
      "De Yow",
      "De Gwener",
      "De Sadorn"
=======
      "dy Sul",
      "dy Lun",
      "dy Meurth",
      "dy Merher",
      "dy Yow",
      "dy Gwener",
      "dy Sadorn"
>>>>>>> develop
    ],
    "ERANAMES": [
      "RC",
      "AD"
    ],
    "ERAS": [
      "RC",
      "AD"
    ],
    "FIRSTDAYOFWEEK": 0,
    "MONTH": [
<<<<<<< HEAD
      "Mys Genver",
      "Mys Whevrel",
      "Mys Merth",
      "Mys Ebrel",
      "Mys Me",
      "Mys Efan",
      "Mys Gortheren",
      "Mye Est",
      "Mys Gwyngala",
      "Mys Hedra",
      "Mys Du",
      "Mys Kevardhu"
=======
      "mis Genver",
      "mis Hwevrer",
      "mis Meurth",
      "mis Ebrel",
      "mis Me",
      "mis Metheven",
      "mis Gortheren",
      "mis Est",
      "mis Gwynngala",
      "mis Hedra",
      "mis Du",
      "mis Kevardhu"
>>>>>>> develop
    ],
    "SHORTDAY": [
      "Sul",
      "Lun",
      "Mth",
      "Mhr",
      "Yow",
      "Gwe",
      "Sad"
    ],
    "SHORTMONTH": [
      "Gen",
<<<<<<< HEAD
      "Whe",
      "Mer",
      "Ebr",
      "Me",
      "Efn",
=======
      "Hwe",
      "Meu",
      "Ebr",
      "Me",
      "Met",
>>>>>>> develop
      "Gor",
      "Est",
      "Gwn",
      "Hed",
      "Du",
      "Kev"
    ],
<<<<<<< HEAD
=======
    "STANDALONEMONTH": [
      "mis Genver",
      "mis Hwevrer",
      "mis Meurth",
      "mis Ebrel",
      "mis Me",
      "mis Metheven",
      "mis Gortheren",
      "mis Est",
      "mis Gwynngala",
      "mis Hedra",
      "mis Du",
      "mis Kevardhu"
    ],
>>>>>>> develop
    "WEEKENDRANGE": [
      5,
      6
    ],
<<<<<<< HEAD
    "fullDate": "EEEE d MMMM y",
    "longDate": "d MMMM y",
    "medium": "d MMM y HH:mm:ss",
    "mediumDate": "d MMM y",
    "mediumTime": "HH:mm:ss",
    "short": "dd/MM/y HH:mm",
    "shortDate": "dd/MM/y",
=======
    "fullDate": "y MMMM d, EEEE",
    "longDate": "y MMMM d",
    "medium": "y MMM d HH:mm:ss",
    "mediumDate": "y MMM d",
    "mediumTime": "HH:mm:ss",
    "short": "y-MM-dd HH:mm",
    "shortDate": "y-MM-dd",
>>>>>>> develop
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "\u00a3",
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
  "id": "kw-gb",
<<<<<<< HEAD
=======
  "localeID": "kw_GB",
>>>>>>> develop
  "pluralCat": function(n, opt_precision) {  var i = n | 0;  var vf = getVF(n, opt_precision);  if (i == 1 && vf.v == 0) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
});
}]);
