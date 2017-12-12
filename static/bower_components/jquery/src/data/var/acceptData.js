define( function() {

<<<<<<< HEAD
"use strict";

=======
>>>>>>> develop
/**
 * Determines whether an object can have data
 */
return function( owner ) {

	// Accepts only:
	//  - Node
	//    - Node.ELEMENT_NODE
	//    - Node.DOCUMENT_NODE
	//  - Object
	//    - Any
<<<<<<< HEAD
=======
	/* jshint -W018 */
>>>>>>> develop
	return owner.nodeType === 1 || owner.nodeType === 9 || !( +owner.nodeType );
};

} );
