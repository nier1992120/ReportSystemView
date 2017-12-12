define( [
	"../core",
	"../selector",
	"../effects"
], function( jQuery ) {

<<<<<<< HEAD
"use strict";

jQuery.expr.pseudos.animated = function( elem ) {
=======
jQuery.expr.filters.animated = function( elem ) {
>>>>>>> develop
	return jQuery.grep( jQuery.timers, function( fn ) {
		return elem === fn.elem;
	} ).length;
};

} );
