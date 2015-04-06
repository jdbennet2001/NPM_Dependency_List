var jf = require('jsonfile');
var traverse = require('traverse');
var util = require('util');
var fs = require('fs');
var shell = require('shelljs');
var fs = require('fs');

//Load both files
var feb = jf.readFileSync('./results/february.json');
var april = jf.readFileSync('./results/april.json');

for ( var item in april ){
	april[item].previous_version = '----';
}

for ( var item in feb ){
	if ( april[item] ){
		april[item].previous_version = feb[item].version;
	}
}
var output_file = process.cwd() + '/merged_list.json';
jf.writeFileSync(output_file , april );

//Dump it as csv for Excel
var csv_output = process.cwd() + '/merged_list.csv';
try {
	fs.unlinkSync(csv_output);
} catch (err) {
	console.log('Can not delete old csv file: ' + err.message);
}

for ( var item in april ){

	var entry = april[item];

	var license = entry.license || '----';
	if ( entry.license && entry.license.type ){
		license = entry.license.type;
	}

	var previous_version = entry.previous_version || '----';

	var line = entry.name + ', ' + entry.version + ', ' + previous_version + ', ' + license + ', ' + entry.repository + '\n';
	fs.appendFileSync(csv_output, line);
}



console.log( 'Complete...');


