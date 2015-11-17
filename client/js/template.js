Template.CustomHome.replaces("Home");
Template.CustomHomePageEditorList.replaces("HomePageEditorList");
Template.CustomEdBoard.replaces("EdBoard");

// Admin
// -----
// -------
Template.Admin.onRendered(function () {
	$('.button-collapse').sideNav();
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
        $('.lean-overlay').remove();

        $('body').prepend($('.advance-drop-spot-box').detach());


//        $('.advance-drop-spot').droppable({
//                accept: '.article'
//                ,drop: function(e,ui) {
//                    var article = ui.draggable;
//                    var field = $(article); // assuming there is but 1
//                    var html = field.wrap("<div>").parent().html();
//                    field.unwrap();
//
//                    $(this).append(html);
//
//                    $('.advance-drop-spot').children().draggable();
//                }
//            });

//        $('.articles, .article-sections').droppable({
//                accept: '.article'
//                ,drop: function(e,ui) {
//                    console.log('hellllllo');
//                    var article = ui.draggable;
//                    var field = $(article); // assuming there is but 1
//                    var html = field.wrap("<div>").parent().html();
//                    field.unwrap();
//
//                    $(this).append(html);
//                }
//            });



        $('.articles, .article-sections, .advance-drop-spot').sortable({
                connectWith: '.articles, .advance-drop-spot',
                cursor: 'move',
                handle: '.handle',
                zIndex: 9999,
                start: function(e,ui) {
                    $(ui.item).css('z-index', 12000);
                },
                update: function(e, ui) {

                    if($(e.toElement).hasClass('advance-drop-spot') == false && $(e.toElement).hasClass('drop-placeholder') == false) {
                        $('#modal1').openModal({
                                dismissible: true,
                                complete: function() {
                                    $('.lean-overlay').remove();
                                }
                            });


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
                                        section_name = article.section_name;
                                        if(section_name == 'Research Papers' && recent === true) {
                                            recent = false;
                                            section_name = 'Recent Research Papers'; 
                                        }

                                        output.push({
                                                articles:[],
                                                section_name:section_name
                                            });
                                    }
                                    output[output.length-1]['articles'].push(article);
                                }

                                $('#modal1').closeModal();
                                $('.admin-content-area').empty();

                                Blaze.renderWithData(Template.AdminAdvanceArticles, {sections: output}, $('.admin-content-area').get()[0]);
                            });
                    }
                    else {
                        $('.drop-placeholder').empty();
//                        $('.advance-drop-spot').children().css('z-index', 12000);
                    }
                }
            });

        $('.delete-article').click(function() {
                $('#modal1').openModal();
                var id = $(this).attr('data-delete-id');
                Meteor.call('sorterRemoveArticle', 'advance', id, function() {
                            $('.admin-content-area').empty();


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


                            $('#modal1').closeModal();
                            Blaze.renderWithData(Template.AdminAdvanceArticles, {sections: output}, $('.admin-content-area').get()[0]);
                    });
            });


        $('.publish-advanced').click(function(e) {
                e.preventDefault();

                newsort = [];
                $('.article').each(function(a,b,c) {
                        newsort.push({
                              'article_id':  $(this).attr('data-article-id')
                        })
                    });

                $('#modal1').openModal({
                        dismissible: true,
                        complete: function() {
                            $('.lean-overlay').remove();
                        }
                    });

                Meteor.call('advancePublish', newsort, function() {
                        $('#modal1').closeModal({
                            });
                    });
            });
});



Template.AdminAdvanceArticlesDiff.onRendered(function() {
        $('.delete-article').click(function() {
                var id = $(this).attr('data-delete-id');
                Meteor.call('sorterRemoveArticle', 'advance', id);
            });
    });


// XML Intake
// ----------
Template.adminArticleXmlIntake.onRendered(function () {
	Session.set('fileNameXML','');
});

// Issue
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


// Visitor
// -------
Template.Visitor.onRendered(function () {
	$('.button-collapse').sideNav();
});

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
	$('.materialboxed').materialbox(); // popup image
});
Template.ArticleFullText.onDestroyed(function () {
	Session.set('article-text',null)
});
Template.ArticleSectionsList.onRendered(function() {
	// console.log('..ArticleSectionsList');
	var navTop = Meteor.general.navHeight();
	$('.section-nav').sticky({topSpacing: navTop});
});
