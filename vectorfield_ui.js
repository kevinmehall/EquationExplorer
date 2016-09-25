/* (C)2016 Kevin Mehall (http://kevinmehall.net) and Keegan Mehall
 * Licensed under the terms of the GNU GPLv2 or greater
 * This file is part of EquationExplorer (http://labs.kevinmehall.net/equationexplorer/)
 */

/* EquationExplorer user interface */

/*Redirect to the same graph on main page:*/

var translate = function(oldHash){
	var vOld = oldHash.split('|');
		var newState = vOld[vOld.length - 1];
		for(var i = 0; i<vOld.length-1; i++){
			newState += '&';
			newState += 'v' + '|' + vOld[i] + '|' + '0.1';
		}
		return newState;
}

if(window.location.hash){
	window.location.href = 'index.html#'+ translate(decodeURI(window.location.hash.slice(1)));
} else{
	window.location.href = 'index.html#[-10,10,-10,10]&v|xi+yj|0.1';
}


function analytics(){
	var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
	$(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E")).appendTo($('body'))
	setTimeout(
	function(){
	var pageTracker = _gat._getTracker("UA-7069941-3");
	pageTracker._trackPageview();
	}, 4000)
}
