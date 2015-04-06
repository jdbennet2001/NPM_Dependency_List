var jf = require('jsonfile');
var traverse = require('traverse');
var util = require('util');
var fs = require('fs');
var shell = require('shelljs');

debugger;

//Load both files
var feb = jf.readFileSync('./results/february.json');
var april = jf.readFileSync('./results/april.json');

var packages = {};
//var project_root = "/Users/jdbennet/projects/micro-service";
var project_root = "/Users/jdbennet/projects/uServices";

var projects = get_directories( project_root );

//Generate the dependency list for each package
var root = process.cwd();
projects.forEach( function( project ){
	generate_ll_json_list( root, project );
});


//Read the list of json files
projects.forEach( function( project ){
	var file = project + '/ll.json';
	var contents = jf.readFileSync(file);
	traverse_json( contents );
});

//Dump output
debugger;
var output_file = process.cwd() + '/license_list.json';
jf.writeFileSync(output_file , packages );

//Dump it as csv for Excel
var csv_output = process.cwd() + '/license_list.csv';
var package_names = [];
for ( var i in packages ){
	var entry = packages[i];
	package_names.push( entry.name );
}
package_names = package_names.sort();


package_names.forEach( function( package_name ) {
	var entry = packages[package_name];
	var line = entry.name + ', ' + entry.version + ', ' + entry.license + ', ' + entry.repository + '\n';
	fs.appendFileSync(csv_output, line);

});


console.log( 'Complete...');

function walk_json( object ){

	for ( var i in object ){
		
		if ( i ==  'dependencies'){
			process_dependencies(object.dependencies);
		}
		
		walk_json( object[i] );
	}
}

function traverse_json( object ){

	traverse(object).forEach(function (x) {
		if ( x.dependencies ){
			process_dependencies(x.dependencies);
		}
	});
}

function process_dependencies( object ){

	for ( var i in object ){

		console.log ( 'Processing: ' + object[i].name );

		var description = {
			name : object[i].name,
			version : object[i].version,
			license : object[i].license,
			repository : object[i].repository ? object[i].repository.url :  '---'
		}

		//Anything without a git repo is one of ours..
		if ( description.repository == '---' ){
			return;
		}
		//Handle complex license fields
		description.license = (description.license === '[object Object]') ? 'undefined' : description.license;

		packages[description.name] = description;

	}
}

function generate_ll_json_list( root, project ){

	shell.cd( project );
	shell.exec('npm ll -json | tee ll.json');
	shell.cd (root);
}

/** 
 Find all projects in a given directory
 **/
function get_directories( path ){

	var files = fs.readdirSync(path);
	var directories = [];

	files.forEach( function(entry){

		var filepath = path + "/" + entry;
		var stat = fs.statSync(filepath);
		if ( stat.isDirectory() ){
			directories.push( filepath);
		}

	});

	return directories;
}

