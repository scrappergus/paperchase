// Admin
// -------
Template.Admin.onRendered(function () {
    $('.collapsible').collapsible();
});

// Navigation
// -----------
Template.AdminNav.onRendered(function () {
    $('.button-collapse').sideNav();
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
Template.AdminArticleOverview.onRendered(function (){
    $('.lean-overlay').remove();
});
Template.AdminArticle.onRendered(function () {
    // scroll to anchor
    if(window.location.hash) {
        $('html, body').animate({
            scrollTop: $(window.location.hash).position().top
        }, 500);
    }
});

// Article Files
// ------------
Template.AdminUploadArticleXml.onDestroyed(function () {
    Session.set('new-article',null);
});
Template.AdminArticleFigures.onRendered(function () {
    $('.materialboxed').materialbox();
});
Template.AdminArticleFiguresXml.onRendered(function () {
    $('.figures-xml').collapsible({
        accordion : false
    });
});
Template.AdminArticleFilesUploader.onDestroyed(function () {
    Session.set('xml-verify',null);
    Session.set('article-form',null);
});

// Article Form
// ------------
Template.ArticleForm.onDestroyed(function() {
    Session.set('article-form',null);
});
Template.ArticleForm.onRendered(function () {
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

// Volume
// ------
Template.AdminVolumeIssue.onRendered(function () {
    $('#volume-issues-list').sortable();
});

// Issue
// ------
Template.IssueCoverUploader.onRendered(function () {
    $('.materialboxed').materialbox();
});
Template.AdminIssueForm.onRendered(function () {
    Meteor.adminIssue.readyIssueForm();
});
Template.AdminIssueDeleted.onRendered(function (){
    if(Session.get('articles-updated')){
        Meteor.formActions.successMessage('Issue Deleted');
    }
});


// News
// ------
Template.AdminNewsAdd.onRendered(function () {
    Session.set('newsData', null);
});
// Template.AdminNewsEdit.onDestroyed(function () {
//     Session.set('newsData', null);
// });
Template.AdminNewsForm.onRendered(function () {
    Meteor.adminNews.readyForm();
});

// Data Submissions
// --------------
Template.AdminDataSubmissions.onCreated(function () {
    var template = Template.instance();
    // Meteor.call('submitPubMedXmlSet', '8_2_2016_1472589750811.xml');

    template.processing = new ReactiveVar(false);
    template.queried = new ReactiveVar(); // used to determine whether to show no articles message
    template.articles = new ReactiveVar();
    template.queryType = new ReactiveVar();
    template.queryParams = new ReactiveVar();
    template.queryForDisplay = new ReactiveVar(); // used to show user what was searched (since there are 2 forms. For ex, possible they selected an issue but did not submit, so this clarifies what is displayed)
    template.invalidLink = new ReactiveVar();
    template.errorMessage = new ReactiveVar();

    template.autorun( function() {
        template.subscribe( 'submissionSet', template.queryType.get(), template.queryParams.get(), function() {
            Meteor.call('submissionSetDataProcess', articles.find().fetch(), function(error, articlesProcessedResult){
                if (error) {
                    console.error('submissionSetDataProcess', error);
                } else if(articlesProcessedResult) {
                    template.processing.set( false );
                }
            });
        });
    });
});
Template.AdminDataSubmissions.onRendered(function () {
    $('select').material_select();
    Session.set('submission_list',null);
});
Template.DataSubmissionsSearchFormIssue.onRendered(function () {
    $('select').material_select();
});
Template.AdminDataSubmissionsPast.onRendered(function () {
    Session.set('articleId',null);
    Session.set('article',null);
    $('ul.tabs').tabs();
});

// Editorial Board
// ---------------
Template.AdminEditorialBoardForm.onRendered(function () {
    Meteor.formActions.closeModal();
    Meteor.adminEdBoard.readyForm();
});

// Ethics
// ---------------
Template.AdminEthics.onDestroyed(function () {
    Session.set('sectionId',null);
});
Template.AdminEthics.onRendered(function () {
    $('.sections-list').sortable();
});
Template.AdminEthicsForm.onRendered(function () {
    // console.log('..AdminEditorialBoardForm onRendered');
    Meteor.adminEthics.readyForm();
});
Template.AdminEthicsForm.onDestroyed(function () {
    Session.set('sectionId',null);
});

// Home Page
// ---------------
Template.AdminHomePage.onDestroyed(function () {
    Session.set('sectionId',null);
});
Template.AdminHomePage.onRendered(function () {
    $('.sections-list').sortable();
});
Template.AdminHomePageForm.onRendered(function () {
    // console.log('..AdminEditorialBoardForm onRendered');
    Meteor.adminHomePage.readyForm();
});
Template.AdminHomePageForm.onDestroyed(function () {
    Session.set('sectionId',null);
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
// paperchase
Template.AdminAop.onRendered(function () {
    $('.advance-order').sortable();
});
// OJS
Template.AdminAdvanceArticlesSections.onRendered(function() {
    $('.collapsible').collapsible({
        accordion : false
    });
    $('.advance-sections').sortable();
});


// Sections
// -------
Template.AdminSections.onRendered(function() {
    Session.set('paperSectionId',null);
    Session.set('errorMessage',null);
    Session.set('savedMessage',null);
});
