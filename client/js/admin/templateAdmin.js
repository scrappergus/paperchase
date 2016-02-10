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

// DOI Status
// ---------------
Template.piiFilter.onCreated(function () {
    this.filter = new ReactiveTable.Filter('piiFilter', ['paperchase.ids.pii']);
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
    $('#advance-table').sortable();
});

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
            console.log('update!');
            if($(e.toElement).hasClass('advance-drop-spot') == false && $(e.toElement).hasClass('drop-placeholder') == false) {
                $('#advance-modal').openModal({
                    dismissible: true,
                    ready: function() {
                        var newsort = [];
                        $('.article').each(function() {
                            newsort.push($(this).attr('data-article-id'));
                        });

                        Meteor.call('updateList', 'advance', newsort, function() {
                            var sorterOrder  = sorters.findOne({name:'advance'});
                            var output = Meteor.advance.groupArticles(sorterOrder.articles);
                            $('#advance-modal').closeModal();
                            Session.set('advance-admin',output);
                        });
                    }
                });
            }else {
                $('.drop-placeholder').empty();
            }
        }
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