Template.adminArticleXmlIntake.rendered = function(){
    Session.set('fileNameXML','');
}
Template.adminIssue.rendered = function(){
	$('.datepicker').pickadate({
    	selectMonths: true,
		selectYears: 1
  	});	
}
Template.AdminDataSubmissions.rendered = function(){
	$('select').material_select();
	Session.set('data-submission-type','');
	Session.set('data-submission-data','');
}

