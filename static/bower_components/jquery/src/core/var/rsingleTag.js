define( function() {
<<<<<<< HEAD
	"use strict";

	// Match a standalone tag
	return ( /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i );
=======

	// Match a standalone tag
	return ( /^<([\w-]+)\s*\/?>(?:<\/\1>|)$/ );
>>>>>>> develop
} );
