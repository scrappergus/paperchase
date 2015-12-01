// Admin
// -----
// -------
Template.Admin.onRendered(function () {
	$('.button-collapse').sideNav();
	$('.collapsible').collapsible();
});
Template.AdminArticle.onRendered(function () {
	// scroll to anchor
	if(window.location.hash) {
		$('html, body').animate({
			scrollTop: $(window.location.hash).position().top
		}, 500);
	}
});

// Article Form
// ------------
Template.AdminArticleForm.onRendered(function () {
	Meteor.adminArticle.readyArticleForm();
});
Template.AdminDateInput.onRendered(function() {
	Meteor.adminArticle.initiateDates();
});
Template.AdminHistoryInput.onRendered(function() {
	Meteor.adminArticle.initiateDates();
});
Template.AdminArticleFormAuthors.onRendered(function() {
	Meteor.adminArticle.initiateAuthorsSortable();
});
Template.AdminArticleFormAffiliations.onRendered(function() {
	Meteor.adminArticle.initiateAffiliationsSortable();
});

// Advance
// -------
Template.AdminAdvanceArticles.onRendered(function() {
	$('#advance-table').sortable();
});

// XML Intake
// ----------
Template.adminArticleXmlIntake.onRendered(function () {
	Session.set('fileNameXML','');
});

// Admin Issue
// ------
Template.AdminIssue.onRendered(function () {
	var pick = $('#issue-date').pickadate();
	var picker = pick.pickadate('picker');
	picker.set('select', $('#issue-date').data('value'), { format: 'yyyy/mm/dd' })
});

// Data Submissions
// --------------
Template.AdminDataSubmissions.onRendered(function () {
	$('select').material_select();
	Session.set('submission_list',null);
});
Template.AdminDataSubmissionsPast.onRendered(function () {
	Session.set('article-id',null);
	Session.set('article',null);
	$('ul.tabs').tabs();
});

// Editorial Board
// ---------------
Template.AdminEditorialBoardForm.onRendered(function () {
	Meteor.adminEdBoard.readyForm();
});
