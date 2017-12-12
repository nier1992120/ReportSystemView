define( function() {
<<<<<<< HEAD
	"use strict";

	return function( elem ) {

		// Support: IE <=11 only, Firefox <=30 (#15098, #14150)
=======
	return function( elem ) {

		// Support: IE<=11+, Firefox<=30+ (#15098, #14150)
>>>>>>> develop
		// IE throws on elements created in popups
		// FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
		var view = elem.ownerDocument.defaultView;

		if ( !view || !view.opener ) {
			view = window;
		}

		return view.getComputedStyle( elem );
	};
} );
