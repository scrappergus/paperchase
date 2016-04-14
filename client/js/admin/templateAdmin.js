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
Template.AdminArticleForm.onDestroyed(function() {
    Session.set('article-form',null);
});
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
    Meteor.dates.initiateDatesInput();
});
Template.AdminIssueDeleted.onRendered(function (){
    if(Session.get('articles-updated')){
        Meteor.formActions.successMessage('Issue Deleted');
    }
});


// News
// ------
Template.AdminNewsEdit.onDestroyed(function () {
    Session.set('newsData',null);
});
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