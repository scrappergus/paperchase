Template.AdminArticle.rendered = function(){
	//title
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

	//dates
	$('.datepicker').pickadate({
		// format: 'YYYY/MM/DD'
	});
	//authors and affiliations
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