Template.AdminArticle.rendered = function(){
	$('.authors-list').sortable();
	$('.affiliations-list').sortable({
		update: function( event, ui ) {
			Meteor.adminArticle.updateAffiliationsOrder();
		}
	});
}
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
	Session.set('submission_list',null);
}
Template.AdminDataSubmissionsPast.rendered = function(){
	$('ul.tabs').tabs();
}
Template.Subscribe.rendered = function(){
	$('select').material_select();
}


