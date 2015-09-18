Template.adminArticleXmlIntake.rendered = function(){
    Session.set('fileNameXML','');
}
Template.adminIssue.rendered = function(){
	$('.datepicker').pickadate({
    	selectMonths: true,
		selectYears: 1
  	});	
}