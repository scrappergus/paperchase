Template.AdminArticle.rendered = function(){
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

	// dates
	// Collection dates don't usually have dd. So using time of day to differentiate date objects that have days and those that don't
	// TIME OF DAY 00:00:00, had a day in the XML. Otherwise did NOT have a day. Just month and year.
	$('.datepicker').each(function(i){
		var datePlaceholderFormat = 'mmmm d, yyyy';
		var placeholder = $(this).attr('placeholder');
		//if placeholder has 3 pieces, then the date should be shown in the placeholder
		var placeholderPieces = placeholder.split(' ');
		if(placeholderPieces.length != 3){
			var datePlaceholderFormat = 'mmmm yyyy';
		}
		var pick = $(this).pickadate({
			format: datePlaceholderFormat
		});
		var picker = pick.pickadate('picker');
		picker.set('select', $(this).data('value'), { format: 'yyyy/mm/dd' });
	});

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
	$('#add-article-date').leanModal();
	$('#add-article-history').leanModal();
	$('#add-article-id').leanModal();
}
Template.adminArticleXmlIntake.rendered = function(){
	Session.set('fileNameXML','');
}
Template.AdminIssue.rendered = function(){
	var pick = $('#issue-date').pickadate();
	var picker = pick.pickadate('picker');
	picker.set('select', $('#issue-date').data('value'), { format: 'yyyy/mm/dd' })
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