Template.AdminArticle.rendered = function(){
	$('.authors-list').sortable();
	$('.affiliations-list').sortable({
		update: function( event, ui ) {
			Meteor.adminArticle.updateAffiliationsOrder();
		}
	});

	$('.dropdown-button').dropdown({
	  	inDuration: 300,
	  	outDuration: 225,
	  	constrain_width: false, // Does not change width of dropdown to that of the activator
	  	gutter: 0, // Spacing from edge
	  	belowOrigin: false, // Displays dropdown below the button
	  	alignment: 'left' // Displays dropdown with edge aligned to the left of button
	}
  );
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


