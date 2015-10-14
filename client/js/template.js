Template.AdminArticle.onRendered(function () {
	// scroll to anchor
	if(window.location.hash) {
		$('html, body').animate({
			scrollTop: $(window.location.hash).position().top
		}, 500);
	}

	// title
	$('.article-title').summernote({
		onPaste: function(e){
			e.preventDefault();
			console.log('paste');
			//remove styling. paste as plain text. avoid problems when pasting from word or with font sizes.
			var bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
			document.execCommand('insertText', false, bufferText);
		},
		toolbar: [
			['font', ['bold', 'italic', 'underline', 'clear', 'superscript', 'subscript']]
		]
	});

	// abstract
	$('.article-abstract').summernote({
		onPaste: function(e){
			e.preventDefault();
			console.log('paste');
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
	// dropdowns
	$('#article-issue').material_select();
	$('#article-type').material_select();

	// modals
	$('#success-modal').leanModal();
	$('#add-article-dates').leanModal();
	$('#add-article-history').leanModal();
	$('#add-article-id').leanModal();
});
Template.AdminDateInput.onRendered(function() {
	Meteor.adminArticle.initiateDates();
});
Template.AdminHistoryInput.onRendered(function() {
	Meteor.adminArticle.initiateDates();
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
	$('ul.tabs').tabs();
});

Template.Subscribe.onRendered(function () {
	$('select').material_select();
});