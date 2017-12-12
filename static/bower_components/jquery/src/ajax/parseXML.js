define( [
	"../core"
], function( jQuery ) {

<<<<<<< HEAD
"use strict";

=======
>>>>>>> develop
// Cross-browser xml parsing
jQuery.parseXML = function( data ) {
	var xml;
	if ( !data || typeof data !== "string" ) {
		return null;
	}

<<<<<<< HEAD
	// Support: IE 9 - 11 only
	// IE throws on parseFromString with invalid input.
=======
	// Support: IE9
>>>>>>> develop
	try {
		xml = ( new window.DOMParser() ).parseFromString( data, "text/xml" );
	} catch ( e ) {
		xml = undefined;
	}

	if ( !xml || xml.getElementsByTagName( "parsererror" ).length ) {
		jQuery.error( "Invalid XML: " + data );
	}
	return xml;
};

return jQuery.parseXML;

} );
