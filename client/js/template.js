//
Template.CustomLeftNav.replaces("LeftNav");
Template.CustomHome.replaces("Home");
Template.CustomHomePageEditorList.replaces("HomePageEditorList");
Template.CustomEdBoard.replaces("EdBoard");


// Global anchor scroll fix
function scroll_if_anchor(href) {
    href = typeof(href) == "string" ? href : $(this).attr("href");
    // If href missing, ignore
    if(!href) return;
    // You could easily calculate this dynamically if you prefer
    var fromTop = 80;
    // If our Href points to a valid, non-empty anchor, and is on the same page (e.g. #foo)
    // Legacy jQuery and IE7 may have issues: http://stackoverflow.com/q/1593174
    var $target = $(href);
    // Older browsers without pushState might flicker here, as they momentarily
    // jump to the wrong position (IE < 10)
    if($target.length) {
        $('html, body').animate({ scrollTop: $target.offset().top - fromTop });
        return false;
    }
}    

Template.onRendered(function() {
        scroll_if_anchor(window.location.hash);
        $("a[href^='#']").unbind("click", scroll_if_anchor);
        $("a[href^='#']").on("click", scroll_if_anchor);
    });


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


Template.ArticleFigureViewer.onRendered(function() {
        $('.figure img, .table img').wrap('<div class="container"></div>');
        var $panzoom = $('.figure img, .table img').panzoom({
                $zoomIn: $(".zoom-in"),
                $zoomOut: $(".zoom-out"),
                $zoomRange: $(".zoom-range"),
                $reset: $(".reset"),
                maxScale: 3,
                increment: 0.1
            }).panzoom('zoom', true);
    });
