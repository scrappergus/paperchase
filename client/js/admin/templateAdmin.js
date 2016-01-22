// Admin
// -------
Template.Admin.onRendered(function () {
	$('.button-collapse').sideNav();
	$('.collapsible').collapsible();
});

// Navigation
// -----------
Template.AdminNav.onRendered(function () {
	$('.collapsible-nav').collapsible();
});

// Site Control
// ------------
Template.AdminSiteControl.onRendered(function () {
	$('.side-nav-options').sortable();
});

// Article
// ------------
Template.AdminArticle.onRendered(function () {
	// scroll to anchor
	if(window.location.hash) {
		$('html, body').animate({
			scrollTop: $(window.location.hash).position().top
		}, 500);
	}
});
// Article Form
Template.AdminArticleForm.onRendered(function () {
	Meteor.adminArticle.readyArticleForm();
});
Template.AdminDateInput.onRendered(function() {
	Meteor.dates.initiateDatesInput();
});
Template.AdminHistoryInput.onRendered(function() {
	Meteor.dates.initiateDatesInput();
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

// XML Upload
// ----------
Template.AdminArticleXmlUpload.onRendered(function () {
	Session.set('fileNameXML','');
    Session.set('article',null);
    Session.set('xml-uploaded',false);
});


// Volume
// ------
Template.AdminVolumeIssue.onRendered(function () {
    $('#volume-issues-list').sortable();
});

// Issue
// ------
Template.AdminIssue.onRendered(function () {
    Meteor.dates.initiateDatesInput();
});


// News
// ------
Template.AdminNewsForm.onRendered(function () {
	Meteor.adminNews.readyForm();
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

// For Authors
// ---------------
Template.AdminForAuthors.onDestroyed(function () {
	Session.set('sectionId',null);
});
Template.AdminForAuthors.onRendered(function () {
	$('.sections-list').sortable();
});
Template.AdminForAuthorsForm.onRendered(function () {
	// console.log('..AdminEditorialBoardForm onRendered');
	Meteor.adminForAuthors.readyForm();
});
Template.AdminForAuthorsForm.onDestroyed(function () {
	Session.set('sectionId',null);
});

// About
// ---------------
Template.AdminAbout.onDestroyed(function () {
	Session.set('aboutSectionId',null);
});
Template.AdminAbout.onRendered(function () {
	$('.sections-list').sortable();
});
Template.AdminAboutForm.onRendered(function () {
	Meteor.adminAbout.readyForm();
});
Template.AdminForAuthorsForm.onDestroyed(function () {
	Session.set('aboutSectionId',null);
});


// Advance
// -------
Template.AdminAdvanceArticles.onRendered(function() {
        $('.lean-overlay').remove();

        $('body').prepend($('.advance-drop-spot-box').detach());

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
                                var recent = true;
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
                    }
                }
            });

        $('.delete-article').click(function() {
                $('#modal1').openModal();
                var id = $(this).attr('data-delete-id');
                Meteor.call('sorterRemoveItem', 'advance', id, function() {
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

        $('.sort-section-dates').click(function(e) {
                var newsort = [];
                var section = [];
                var prev = {};
                $('.article').each(function(a,b,c) {
                        var article = articles.findOne({'_id': $(this).attr('data-article-id')});

                        if(article.section_id != prev.section_id) {
                            if(section.length > 0) {
                                newsort.push({
                                        section_id: prev.section_id,
                                        section: section
                                    });
                                section = [];
                            }
                        }


                        if(article.dates !== undefined && article.dates.epub !== undefined) {
                            var date = article.dates.epub
                        }
                        else {
                            var date = null;
                        }

                        section.push({
                                id: article['_id'],
                                date: date
                            });

                        prev = article;
                    });
                newsort.push({
                        section_id: article.section_id,
                        section: section
                    });


                var sort_section_id = $(this).attr('data-section-id');
                var out = [];
                $.each(newsort, function(k,v) {
                        if(v.section_id == sort_section_id) {
                            newsort[k].section.sort(function(a,b){
                                    var c = new Date(a.date);
                                    var d = new Date(b.date);
                                    return d-c;
                                });
                        }
                        $.each(v.section, function(key, article) {
                                out.push(article.id);
                            });
                    });



                        Meteor.call('updateList', 'advance', out, function(a,b,c) {
                                var sorted  = sorters.findOne({name:'advance'});
                                var output = [];
                                var last_article = {};
                                var recent = true;
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

//                                $('#modal1').closeModal();
                                $('.admin-content-area').empty();

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
                Meteor.call('sorterRemoveItem', 'advance', id);
            });
    });

Template.AdminSections.onRendered(function() {
    Session.set('paperSectionId',null);
});