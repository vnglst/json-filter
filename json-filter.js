// Loads the IATE json terminology file (parameter 1)
// Parses the first x objects it can find (parameter 2)
// And logs the list of termEntries to the console
//
// How to use
// node json-filter.js ../data/IATE-2015.json > jq "." > IATE-nl-de.json
//
// # for testing:
// node json-filter.js ../data/IATE-2015.json 100 | jq "."

var fs = require('fs'),
	JSONStream = require('JSONStream'),
	stream = fs.createReadStream(process.argv[2], {
		encoding: 'utf8'
	}),
	parser = JSONStream.parse(),
	counter = 0,
	maxTerms = Number(process.argv[3]) || Number.POSITIVE_INFINITY; // default = all terms

stream.pipe(parser);

// Converts "123, 345" to [123, 345]
function stringOfNumsToArr(subjectFieldNrs) {
	var arr = subjectFieldNrs.split(", ");
	// console.log(arr);
	if (arr[0] === '') {
		return ''; // empty string, no sf specified
	} else {
		return arr.map(function(n, i, a) {
			return +n;
		});
	}
}

// tests
// console.log(stringOfNumsToArr("123, 456, 678"));
// console.log(stringOfNumsToArr(""));
// console.log(stringOfNumsToArr("0"));


parser.on('root', function(obj) {
	var terms = [];
	var hasDutchTerms = false;
	// obj.langSet can be an array of object terms or just one term object
	// if langSet is an array of term objects
	if (obj.langSet.constructor === Array) {
		// Filter out the terms that have Dutch and German translations
		// Returns an empty array if empty
		terms = obj.langSet.filter(function(element) {
			// we only want entries with Dutch translations in them
			if (element['xml:lang'] === 'nl') hasDutchTerms = true;
			return element['xml:lang'] === 'nl' || element['xml:lang'] === 'de';
		});
	} // If it's not an array, it's just one object and we're currently not saving that
	else {
		// If it's a Dutch or German term...
		// if (obj.langSet['xml:lang'] === 'nl' ||
		// 	obj.langSet['xml:lang'] === 'de') {
		// 	terms.push(obj.langSet);
		// }
	}

	// if an nlTerm was found it will be an array with one or more synonyms
	// if nothing was found, it will be an empty array
	if (hasDutchTerms && terms.length > 0 && counter < maxTerms) {

		if (counter === 0) {
			console.log('[');
		} else {
			// add a comma before next object
			console.log(',');
		}

		var termEntry = {};
		termEntry.id = obj.id;

		// subjectfield is a string of comma seperated numbers
		var subjectFieldStr = obj.descripGrp.descrip._ || '';
		// this should become an array of numbers
		termEntry.subjectField = stringOfNumsToArr(subjectFieldStr);

		termEntry.note = obj.descripGrp.note || ''; // empty string if no note
		termEntry.langSet = [];

		// Add all Dutch + German terms
		terms.forEach(function(element, index, array) {
			// If mutiple [{term}s] i.e. synonyms
			if (element.tig.constructor === Array) {
				// Then create a termObject for each
				element.tig.forEach(function(termObj, index2, array2) {
					var someTerm = {};
					someTerm.lang = element['xml:lang'];
					someTerm.termStr = termObj.term;
					someTerm.termNote = termObj.termNote._;
					someTerm.relCode = termObj.descrip._;
					// And add it to the langSet array
					termEntry.langSet.push(someTerm);
				});
			} else {
				// If it's just one {term}
				var someTerm = {};
				someTerm.lang = element['xml:lang'];
				someTerm.termStr = element.tig.term;
				someTerm.termNote = element.tig.termNote._;
				someTerm.relCode = element.tig.descrip_;
				// Then add that term to the langSet array
				termEntry.langSet.push(someTerm);
			}
		});

		// Log the termEntry object to the console
		console.log(JSON.stringify(termEntry));

		counter++; // add on term to counter
		if (counter === maxTerms) {
			// close input stream if counter reaches maxTerms
			stream.close();
		}
	}
});

stream.on('close', function() {
	console.log(']');
});
