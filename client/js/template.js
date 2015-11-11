//Template swapping
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
//        $('.articles').sortable({
//                update: function(e, ui) {
//                    var newsort = [];
//                    $('.article').each(function(a,b,c) {
//                            d = Blaze.getData(b);
//                            newsort.push(d._id);
//                        });
//
//Meteor.call('updateList', 'advance', newsort, function() {
//                            var sorted  = sorters.findOne({name:'advance'});
//                            var output = [];
//                            var last_article = {};
//                            for (var i = 0; i < sorted.articles.length; i++){
//                                article = sorted.articles[i];
//
//                                //make a copy of the next article for comparison
//                                next_article = sorted.articles[i+1] || false;
//
//                                //things that happen on the first entry
//                                if(i==0) {
//                                    article['first'] = true;
//                                    article['section_start'] = true;
//                                }
//
//                                //mark the rest as not being first
//                                first = false;
//
//
//
//                                //things that happen if we're starting a new section
//                                if(article.section_name != last_article.section_name) {
//                                    article['section_start'] = true;
//                                }
//
//
//                                //things that happen if we're ending a section
//                                if(article.section_name != next_article.section_name) {
//                                    article['section_end'] = true;
//                                }
//
//                                //record this entry for comparison on the next
//                                last_article = article;
//                                //record changes to actual article entry
//                                if(article.section_start) {
//                                    output.push({
//                                            articles:[],
//                                            section_name:article.section_name
//                                        });
//                                }
//                                output[output.length-1]['articles'].push(article);
//                            }
//
//                            $('.admin-content-area').empty(); 
//                            Blaze.renderWithData(Template.AdminAdvanceArticles, {sections: output}, $('.admin-content-area').get()[0]);
//
//})
//
//                }
//            });

        $('.articles, .article-sections').sortable({
                connectWith: '.articles',
                update: function(e, ui) {

                    var newsort = [];
                    $('.article').each(function(a,b,c) {
                            newsort.push($(this).attr('data-article-id'));
                        });

                    Meteor.call('updateList', 'advance', newsort, function(a,b,c) {
                            var sorted  = sorters.findOne({name:'advance'});
                            var output = [];
                            var last_article = {};
                            for (var i = 0; i < sorted.articles.length; i++){
                                article = sorted.articles[i];

                                //make a copy of the next article for comparison
                                next_article = sorted.articles[i+1] || false;

                                //things that happen on the first entry
                                if(i==0) {
                                    article['first'] = true;
                                    article['section_start'] = true;
                                }

                                //mark the rest as not being first
                                first = false;



                                //things that happen if we're starting a new section
                                if(article.section_name != last_article.section_name) {
                                    article['section_start'] = true;
                                }


                                //things that happen if we're ending a section
                                if(article.section_name != next_article.section_name) {
                                    article['section_end'] = true;
                                }

                                //record this entry for comparison on the next
                                last_article = article;
                                //record changes to actual article entry
                                if(article.section_start) {
                                    output.push({
                                            articles:[],
                                            section_name:article.section_name
                                        });
                                }
                                output[output.length-1]['articles'].push(article);
                            }

                            $('.admin-content-area').empty(); 
                            Blaze.renderWithData(Template.AdminAdvanceArticles, {sections: output}, $('.admin-content-area').get()[0]);
                        });
                }
            });

        $('.delete-article').click(function() {
                var id = $(this).attr('data-delete-id');
                Meteor.call('sorterRemoveArticle', 'advance', id);
            });
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
