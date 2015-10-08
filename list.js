var path 			= require('path');
var fs   			= require('fs');
var child_process 	= require('child_process');
var Promise 		= require('Promise');
var traverse 		= require('traverse');
var jf = require('jsonfile');

var project_root = '/Users/jonbennett/projects/uService';
var projects = get_directories( project_root );

/*
 Scan output...
 */
var packages = {};

get_all_packages( projects ).then( function(result){

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

	console.log( "Done...");
	process.exit(0);

});

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

function get_all_packages( directories ){
		
	var p = directories.reduce( 
		function( previous, next ){
				return previous.then( function(result ){
					return  scan_directory( next );
				});
				
		}, Promise.resolve() );
		
	return p;

}

function scan_directory( location ){
	var command = 'npm';
	var options = ['ll',  '-json'];
	var environment = {cwd: location};
	console.log( 'Scanning: ' + location);
	var p = execute_async( command, options, environment );
	p.then( function(result){
		var object = JSON.parse(result);
		traverse_json(object);
	});
	return p;
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
		};

		//Anything without a git repo is one of ours..
		if ( description.repository == '---' ){
			return;
		}
		//Handle complex license fields
		description.license = (description.license === '[object Object]') ? 'undefined' : description.license;

		packages[description.name] = description;

	}
}

function execute_async( command, options, environment ){

	console.log( 'Executing: ' + command + ' : ' + options.toString() );

	var cf_promise = new Promise(function (resolve, reject){

	var output = "";

	var cf_result = child_process.spawn( command, options, environment );

	    cf_result.stdout.on('data', function(data) { 
	    	output = output + data.toString();
	    	console.log( '\t' + data.toString()); 
	    });

	    cf_result.on('exit', function(code) {

    		console.log( '..command complete (' + command + ' : ' + options + ') code is: ' + code );
    		if ( code === 0 ){
	    		resolve(output);
    		}
	    	else{

	    		reject(code);
	    	}

	    });

	});

	return cf_promise;
}