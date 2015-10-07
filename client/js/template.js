Template.AdminArticle.rendered = function(){
	$('.authors-list').sortable();
	$('.affiliations-list').sortable({
		start: function( event, ui ) {
			Session.set('affIndex',ui.item.index());
		},
		update: function( event, ui ) {
			var newIndex = ui.item.index();
			Meteor.adminArticle.updateAffiliationsOrder(newIndex);
		},
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