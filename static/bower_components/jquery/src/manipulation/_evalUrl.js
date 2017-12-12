define( [
	"../ajax"
], function( jQuery ) {

<<<<<<< HEAD
"use strict";

=======
>>>>>>> develop
jQuery._evalUrl = function( url ) {
	return jQuery.ajax( {
		url: url,

		// Make this explicit, since user can override this through ajaxSetup (#11264)
		type: "GET",
		dataType: "script",
<<<<<<< HEAD
		cache: true,
=======
>>>>>>> develop
		async: false,
		global: false,
		"throws": true
	} );
};

return jQuery._evalUrl;

} );
