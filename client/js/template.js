//
Template.CustomLeftNav.replaces("LeftNav");
Template.CustomHome.replaces("Home");
Template.CustomHomePageEditorList.replaces("HomePageEditorList");
Template.CustomEdBoard.replaces("EdBoard");


// Admin
Template.AdminArticle.onRendered(function () {
	// scroll to anchor
	if(window.location.hash) {
		$('html, body').animate({
			scrollTop: $(window.location.hash).position().top
		}, 500);
	}
});
Template.AdminArticleForm.onRendered(function () {
	// title
	$('.article-title').summernote({
		styleWithSpan: false,
		onPaste: function(e){
			e.preventDefault();
			//remove styling. paste as plain text. avoid problems when pasting from word or with font sizes.
			var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
			document.execCommand('insertText', false, bufferText);
		},
		toolbar: [
			['font', ['bold', 'italic', 'underline', 'clear', 'superscript', 'subscript']],
			['view', ['codeview']]
		]
	});

	// abstract
	$('.article-abstract').summernote({
		styleWithSpan: false,
		onPaste: function(e){
			e.preventDefault();
			//remove styling. paste as plain text. avoid problems when pasting from word or with font sizes.
			var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
			document.execCommand('insertText', false, bufferText);
		},
		toolbar: [
			['font', ['bold', 'italic', 'underline', 'clear', 'superscript', 'subscript']],
			['view', ['codeview']]
		]
	});

	// dates - handled in template helper, article. uses function to loop through dates and initiate
	Meteor.adminArticle.initiateDates();

	// authors and affiliations
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

	// issue, article type
	// selects
	$('#article-issue').material_select();
	$('#article-type').material_select();;
	$('#article-pub-status').material_select();

	// modals
	$('#success-modal').leanModal();
	// $('#add-article-dates').leanModal();
	// $('#add-article-history').leanModal();
	// $('#add-article-id').leanModal();
});
Template.AdminDateInput.onRendered(function() {
	Meteor.adminArticle.initiateDates();
});
Template.AdminHistoryInput.onRendered(function() {
	Meteor.adminArticle.initiateDates();
});

Template.AdminAdvanceArticles.onRendered(function() {
	$('#advance-table').sortable();
});


Template.adminArticleXmlIntake.onRendered(function () {
	Session.set('fileNameXML','');
});

Template.AdminIssue.onRendered(function () {
	var pick = $('#issue-date').pickadate();
	var picker = pick.pickadate('picker');
	picker.set('select', $('#issue-date').data('value'), { format: 'yyyy/mm/dd' })
});

Template.AdminDataSubmissions.onRendered(function () {
	$('select').material_select();
	Session.set('submission_list',null);
});

Template.AdminDataSubmissionsPast.onRendered(function () {
	Session.set('article-id',null);
	Session.set('article',null);
	$('ul.tabs').tabs();
});


// Visitor
// -------
Template.Subscribe.onRendered(function () {
	$('select').material_select();
});
Template.Home.onRendered(function () {
	$('.edboard-name').click(function() {
		$(this).next().toggle();
	});

	$('.collapsible').collapsible({
		accordion : false // A setting that changes the collapsible behavior to expandable instead of the default accordion style
	});
});
// Article
Template.ArticleFigures.onRendered(function() {
	$('.materialboxed').materialbox();
	$('.owl-carousel').owlCarousel();
});
Template.ArticleText.onRendered(function() {
	$('.materialboxed').materialbox();
});
Template.ArticleFullText.onRendered(function() {
	$('.materialboxed').materialbox();
});