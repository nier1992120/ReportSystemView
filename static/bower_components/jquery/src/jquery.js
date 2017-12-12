define( [
	"./core",
	"./selector",
	"./traversing",
	"./callbacks",
	"./deferred",
<<<<<<< HEAD
	"./deferred/exceptionHook",
=======
>>>>>>> develop
	"./core/ready",
	"./data",
	"./queue",
	"./queue/delay",
	"./attributes",
	"./event",
	"./event/alias",
	"./event/focusin",
	"./manipulation",
	"./manipulation/_evalUrl",
	"./wrap",
	"./css",
	"./css/hiddenVisibleSelectors",
	"./serialize",
	"./ajax",
	"./ajax/xhr",
	"./ajax/script",
	"./ajax/jsonp",
	"./ajax/load",
	"./event/ajax",
	"./effects",
	"./effects/animatedSelector",
	"./offset",
	"./dimensions",
	"./deprecated",
<<<<<<< HEAD
	"./exports/amd",
	"./exports/global"
], function( jQuery ) {

"use strict";

return jQuery;
=======
	"./exports/amd"
], function( jQuery ) {

return ( window.jQuery = window.$ = jQuery );
>>>>>>> develop

} );
