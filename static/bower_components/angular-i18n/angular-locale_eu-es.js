'use strict';
angular.module("ngLocale", [], ["$provide", function($provide) {
var PLURAL_CATEGORY = {ZERO: "zero", ONE: "one", TWO: "two", FEW: "few", MANY: "many", OTHER: "other"};
$provide.value("$locale", {
  "DATETIME_FORMATS": {
    "AMPMS": [
      "AM",
      "PM"
    ],
    "DAY": [
      "igandea",
      "astelehena",
      "asteartea",
      "asteazkena",
      "osteguna",
      "ostirala",
      "larunbata"
    ],
    "ERANAMES": [
      "K.a.",
<<<<<<< HEAD
      "K.o."
=======
      "Kristo ondoren"
>>>>>>> develop
    ],
    "ERAS": [
      "K.a.",
      "K.o."
    ],
    "FIRSTDAYOFWEEK": 0,
    "MONTH": [
<<<<<<< HEAD
      "urtarrilak",
      "otsailak",
      "martxoak",
      "apirilak",
      "maiatzak",
      "ekainak",
      "uztailak",
      "abuztuak",
      "irailak",
      "urriak",
      "azaroak",
      "abenduak"
=======
      "urtarrila",
      "otsaila",
      "martxoa",
      "apirila",
      "maiatza",
      "ekaina",
      "uztaila",
      "abuztua",
      "iraila",
      "urria",
      "azaroa",
      "abendua"
>>>>>>> develop
    ],
    "SHORTDAY": [
      "ig.",
      "al.",
      "ar.",
      "az.",
      "og.",
      "or.",
      "lr."
    ],
    "SHORTMONTH": [
      "urt.",
      "ots.",
      "mar.",
      "api.",
      "mai.",
      "eka.",
      "uzt.",
      "abu.",
      "ira.",
      "urr.",
      "aza.",
      "abe."
    ],
<<<<<<< HEAD
=======
    "STANDALONEMONTH": [
      "urtarrila",
      "Otsaila",
      "Martxoa",
      "Apirila",
      "Maiatza",
      "Ekaina",
      "Uztaila",
      "Abuztua",
      "Iraila",
      "Urria",
      "Azaroa",
      "Abendua"
    ],
>>>>>>> develop
    "WEEKENDRANGE": [
      5,
      6
    ],
    "fullDate": "y('e')'ko' MMMM d, EEEE",
    "longDate": "y('e')'ko' MMMM d",
    "medium": "y MMM d HH:mm:ss",
    "mediumDate": "y MMM d",
    "mediumTime": "HH:mm:ss",
<<<<<<< HEAD
    "short": "y/MM/dd HH:mm",
    "shortDate": "y/MM/dd",
=======
    "short": "yy/M/d HH:mm",
    "shortDate": "yy/M/d",
>>>>>>> develop
    "shortTime": "HH:mm"
  },
  "NUMBER_FORMATS": {
    "CURRENCY_SYM": "\u20ac",
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
  "id": "eu-es",
<<<<<<< HEAD
=======
  "localeID": "eu_ES",
>>>>>>> develop
  "pluralCat": function(n, opt_precision) {  if (n == 1) {    return PLURAL_CATEGORY.ONE;  }  return PLURAL_CATEGORY.OTHER;}
});
}]);
