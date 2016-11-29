// ADMIN HELPERS

Template.AdminDashboard.helpers({
    processingPii: function(){
        return Session.get('processing-pii');
    },
    journal: function(){
        if(Session.get('journal')){
            return Session.get('journal').journal;
        }
    }
});

Template.AdminNav.helpers({
    mainColor: function(){
        return Meteor.settings.public.journal.site.spec.color.main_rgb;
    },
    bannerLogo: function(){
        return Meteor.settings.public.journal.logo.banner;
    }
});


Template.AdminNavLinksCollapse.helpers({
    ojs: function(){
        return Meteor.settings.public.journal.name === 'Oncotarget';
    }
});

// Site Control
// ---------------
Template.AdminSiteControl.helpers({
    sideNav: function(){
        if(Session.get('journal')){
            return Session.get('journal').site.side_nav;
        }
    }
});


// DOI Status
// ---------------
Template.AdminDoiStatus.helpers({
    articlesList: function(){
        return Session.get('articles-doi-status');
    },
    settings: function(){
        return {
            rowsPerPage: 50,
            filters: ['piiFilter'],
            fields: [
                {
                    key: 'paperchase.ids.pii',
                    label: 'PII',
                    fn: function(pii){
                        return pii;
                    }
                },
                {
                    key: 'doi',
                    label: 'DOI'
                },
                {
                    key: 'deposited',
                    label: 'Deposited',
                    fn: function(deposited){
                        if(deposited){
                            return Meteor.dates.wordDate(deposited.timestamp);
                        }
                    }
                },
                {
                    key: 'indexed_date',
                    label: 'Indexed',
                    fn: function(indexed_date){
                        if(indexed_date){
                            return Meteor.dates.wordDate(indexed_date);
                        }
                    }
                },
                {
                    key: 'registered',
                    label: 'Registered'
                },
                {
                    key: 'paperchase',
                    label: '',
                    fn: function(paperchase){
                        if(paperchase.ids.pii && paperchase.dates &&  paperchase.dates.epub){
                            var epubTimestamp = paperchase.dates.epub;
                                epubTimestamp = new Date(epubTimestamp);
                                epubTimestamp = epubTimestamp.getTime();
                            return new Spacebars.SafeString('<a class="btn btn-sm" href="' + paperchase.doiRegisterUrl + paperchase.ids.pii + '?epub=' + epubTimestamp + '">Register</a>');
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: 'crossref_print_date',
                    label: 'DOI: Print',
                    fn: function(date){
                        if(date){
                            return Meteor.dates.dashedToWord(date);
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: 'crossref_epub_date',
                    label: 'DOI: EPub',
                    fn: function(date){
                        if(date){
                            return Meteor.dates.dashedToWord(date);
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: 'paperchase',
                    label: 'EPub',
                    fn: function(paperchase){
                        if(paperchase.dates &&  paperchase.dates.epub){
                            return Meteor.dates.article(paperchase.dates.epub);
                        }else{
                            return '';
                        }
                    },
                    cellClass: function (value, object) {
                        if(object.crossref_epub_date){
                            if(object.paperchase.dates && object.paperchase.dates.epub){
                                if(Meteor.dates.dashedToWord(object.crossref_epub_date)  !=  Meteor.dates.article(object.paperchase.dates.epub)){
                                    return 'article-date-conflict';
                                }
                            }
                        }
                    }
                },
                {
                    key: 'paperchase',
                    label: 'PMC',
                    fn: function(paperchase){
                        if(paperchase.ids &&  paperchase.ids.pmc){
                            return new Spacebars.SafeString('<a target="_BLANK" href="http://www.ncbi.nlm.nih.gov/pmc/' + paperchase.ids.pmc + '">PMC</a>');
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: 'paperchase',
                    label: 'PubMed',
                    fn: function(paperchase){
                        if(paperchase.ids &&  paperchase.ids.pmid){
                            return new Spacebars.SafeString('<a target="_BLANK" href="http://www.ncbi.nlm.nih.gov/pubmed/' + paperchase.ids.pmid + '">PubMed</a>');
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: 'paperchase',
                    label: '',
                    fn: function(paperchase){
                        return new Spacebars.SafeString('<a href="/admin/article/' + paperchase._id + '">View</a>');
                    }
                }
            ]
        };
    }
});

// Articles
// ---------------
Template.AdminArticlesDashboard.helpers({
    MissingDoiCount : function(){
        return articles.find({'ids.doi' : {$exists : false}}).fetch().length;
    }
});

Template.AdminArticlesDashboard.helpers({
    MissingDoiList : function(){
        return articles.find({'ids.doi' : {$exists : false}}, {fields: {ids: 1}}).fetch();
    }
});


// Article
// ---------------
Template.AdminArticleButtons.helpers({
    journal: function(){
        return Session.get('journal');
    }
});
Template.ArticleDoiRegisterButton.helpers({
    journalShort: function(){
        if(Session.get('journal')){
            return Session.get('journal').journal.short_name;
        }
    },
    doiLink: function(){
        if(Session.get('journal')){
            return Session.get('journal').api.doi;
        }
        // return 'http://localhost:3003/';
    }
});
Template.AdminArticleOverview.helpers({
    article : function(){
        return Session.get('article');
    }
});
//Figures
Template.AdminArticleFigures.helpers({
    article : function(){
        return Session.get('article');
    },
    xmlFigures : function(){
        return Session.get('xml-figures');
    }
});
Template.AdminArticleFiguresXml.helpers({
    xmlFigures : function(){
        return Session.get('xml-figures');
    }
});
//Supplemental
Template.AdminArticleSupplemental.helpers({
    article : function(){
        return Session.get('article');
    },
    xmlSupplemental : function(){
        return Session.get('xml-supplemental');
    }
});
Template.AdminArticleSupplementalXml.helpers({
    xmlSupplemental : function(){
        return Session.get('xml-supplemental');
    }
});
//Files - PDF/XML
Template.AdminArticleFiles.helpers({
    article : function(){
        return Session.get('article');
    }
});
Template.AdminArticleFilesUploader.helpers({
    article : function(){
        return Session.get('article');
    },
    verify: function(){
        return Session.get('xml-verify');
    }
});
Template.AdminArticleXmlReprocess.helpers({
    article : function(){
        return Session.get('article');
    },
    verify: function(){
        return Session.get('xml-verify');
    }
});
Template.AdminArticleXmlVerify.helpers({
    article : function(){
        return Session.get('article-form');
    }
});
Template.s3ArticleFilesUpload.helpers({
    files: function(){
        return S3.collection.find();
    },
    verify: function(){
        return Session.get('xml-verify');
    }
});
Template.AdminArticle.helpers({
    article : function(){
        return Session.get('article');
    },
    articleProcessed: function(){
        // session default for article is null. If new article, empty object.
        if(Session.get('article-form') === null){
            return false;
        }else{
            return true;
        }
    }
});
Template.ArticleForm.helpers({
    article : function(){
        var articleForm = Session.get('article-form');
        if( articleForm && Session.get('journal') && Session.get('journal').journal.short_name){
            articleForm.journal_short_name = Session.get('journal').journal.short_name;
        }
        return articleForm;
    }
});
Template.AddArticleDate.helpers({
    dates: function(){
        return Meteor.adminArticle.articleListOptions('dates');
    }
});
Template.AddArticleHistory.helpers({
    history: function(){
        return Meteor.adminArticle.articleListOptions('history');
    }
});
Template.AddArticleId.helpers({
    ids: function(){
        return Meteor.adminArticle.articleListOptions('ids');
    }
});
// Article Legacy Intake

Template.AdminArticleLegacyIntake.helpers({
    article : function(){
        return Session.get('article-legacy');
    },
    error : function(){
        return Session.get('article-legacy-error');
    }
});

// Articles
//
Template.AdminArticlesList.helpers({
    settings: function(){
        return {
            rowsPerPage: 10,
            showFilter: false,
            fields: [
                {
                    key: 'title',
                    label: 'Title',
                    fn: function(title){
                        var t = Meteor.admin.titleInTable(title);
                        return new Spacebars.SafeString(t);
                    }
                },
                {
                    key: 'volume',
                    label: 'Volume'
                },
                {
                    key: 'issue',
                    label: 'Issue'
                },
                {
                    key: 'ids.pii',
                    label: 'PII'
                },
                {
                    key: 'dates.epub',
                    label: 'EPub',
                    fn: function(date){
                        if(date){
                            return Meteor.dates.article(date);
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: '_id',
                    label: '',
                    sortable: false,
                    fn: function(value){
                        return new Spacebars.SafeString('<a href="/admin/article/' + value + '">View</a>');
                    }
                }
            ]
        };
    }
});
Template.AdminAop.helpers({
    settings: function(){
        return {
            rowsPerPage: 10,
            showFilter: false,
            fields: [
                {
                    key: 'title',
                    label: 'Title',
                    fn: function(title){
                        var t = Meteor.admin.titleInTable(title);
                        return new Spacebars.SafeString(t);
                    }
                },
                {
                    key: 'ids.pii',
                    label: 'PII'
                },
                {
                    key: 'dates.epub',
                    label: 'EPub',
                    fn: function(date){
                        if(date){
                            return Meteor.dates.article(date);
                        }else{
                            return '';
                        }
                    }
                },
                {
                    key: '_id',
                    label: '',
                    sortable: false,
                    fn: function(value){
                        return new Spacebars.SafeString('<a href="/admin/article/' + value + '">View</a>');
                    }
                }
            ]
        };
    }
});


// New Article
// ---------------
Template.AdminArticleAdd.helpers({
    articleProcessed: function(){
        // session default for article is null. If new article, empty object.
        if(Session.get('article-form') === null){
            return false;
        }else{
            return true;
        }
    }
});
Template.AdminUploadArticleXml.helpers({
    article: function(){
        return Session.get('new-article');
    }
});

// Institution
// ---------------
Template.AdminInstitutionForm.helpers({
    'showIPFields' : function(){
        return Template.instance().showIPFields.get();
    }
});
// Recommendation
// ---------------
Template.AdminRecommendationUpdate.helpers({
    'recommendation' : function(){
        return Session.get('recommendation');
    }
});

// Authors
// ---------------
Template.AdminAuthors.helpers({
    settings: function () {
        return {
            collection: authors.find().fetch(),
            rowsPerPage: 10,
            showFilter: false,
            fields: [
                {
                    key: 'name_first',
                    label: 'First Name'
                },
                {
                    key: 'name_middle',
                    label: 'Middle Name'
                },
                {
                    key: 'name_last',
                    label: 'Last Name'
                },
                {
                    key: '_id',
                    label: '',
                    sortable: false,
                    fn: function(value){
                        return new Spacebars.SafeString('<a class="btn btn-sm" href="/admin/author/' + value + '">Profile</a>');
                    }
                }
            ]
        };
    }
});


// Ethics
// ---------------
Template.AdminEthics.helpers({
    'showForm' : function(){
        return Session.get('showForm');
    }
});
Template.AdminEthicsForm.helpers({
    'section' : function(){
        var section = {};
        if(Session.get('sectionId')){
            section = ethics.findOne({_id : Session.get('sectionId')});
        }
        return section;
    }
});

// Home Page
// ---------------
Template.AdminHomePage.helpers({
    'showForm' : function(){
        return Session.get('showForm');
    }
});
Template.AdminHomePageForm.helpers({
    'section' : function(){
        var section = {};
        if(Session.get('sectionId')){
            section = homePage.findOne({_id : Session.get('sectionId')});
        }
        return section;
    }
});


// For Authors
// ---------------
Template.AdminForAuthors.helpers({
    'showForm' : function(){
        return Session.get('showForm');
    }
});
Template.AdminForAuthorsForm.helpers({
    'section' : function(){
        var section = {};
        if(Session.get('sectionId')){
            section = forAuthors.findOne({_id : Session.get('sectionId')});
        }
        return section;
    }
});

// About
// ---------------
Template.AdminAbout.helpers({
    'sections' : function(){
        return Session.get('adminAboutSections');
    },
    'showAboutForm' : function(){
        return Session.get('showAboutForm');
    }
});
Template.AdminAboutForm.helpers({
    'section' : function(){
        var section = {};
        if(Session.get('aboutSectionId')){
            section = about.findOne({_id : Session.get('aboutSectionId')});
        }
        return section;
    }
});

// Upload
// ---------------
Template.s3Upload.helpers({
    'files': function(){
        // console.log(S3.collection.find());
        return S3.collection.find();
    }
});
Template.s3ArticleAssetsUpload.helpers({
    'files': function(){
        // console.log(S3.collection.find());
        return S3.collection.find();
    }
});

// News
// ---------------
Template.AdminNews.helpers({
    news: function() {
        return newsList.find({},{sort:{date:-1}});
    }
});
Template.AdminNewsEdit.helpers({
    news: function() {
        return Session.get('newsData');
    }
});
Template.AdminNewsOverview.helpers({
    news: function() {
        return Session.get('newsData');
    }
});
Template.AdminNewsForm.helpers({
    news: function() {
        var news = {}; // if undefined, the template form will not load. So we need an empty object.
        if(Session.get('newsData')){
            news = Session.get('newsData');
        }
        return news;
    }
});

// Users
// ---------------
Template.AdminUser.helpers({
    user: function(){
        return Session.get('admin-user');
    }
});
Template.AdminUserEdit.helpers({
    user: function(){
        return Session.get('admin-user');
    }
});
Template.AdminUserForm.helpers({
    user: function(){
        return Session.get('admin-user');
    }
});
Template.AdminUserSubs.helpers({
    user: function(){
        return Session.get('admin-user');
    },
    volumes: function(){
        return Session.get('archive');
    }
});

// Archive
// ---------------
Template.AdminArchive.helpers({
    volumes: function(){
        return Session.get('archive');
    }
});

// Volume
// ---------------
Template.AdminVolume.helpers({
    volume: function(){
        return Session.get('volume');
    }
});

// Issue
// ---------------
Template.AdminIssue.helpers({
    issueData: function(){
        return Session.get('issue');
    }
});
Template.AdminIssueEdit.helpers({
    issueData: function(){
        return Session.get('issue');
    }
});
Template.AdminIssueDeleted.helpers({
    articles: function(){
        return Session.get('articles-updated');
    }
});
Template.AdminIssueButtons.helpers({
    journal: function(){
        return Session.get('journal');
    }
});

// General
// ---------------
Template.StatusModal.helpers({
    action: function(){
        return  Session.get('statusModalAction');
    },
    details: function(){
        return Session.get('statusModalDetails');
    },
});


// Sections
// ---------------
Template.AdminSections.helpers({
    sections: function(){
        return sections.find({},{sort : {name:1}}).fetch();
    }
});
Template.AdminSectionsForm.helpers({
    section: function() {
        var section = {}; // if undefined, the template form will not load. So we need an empty object.
        if(Session.get('paperSectionId')){
            section = sections.findOne({_id : Session.get('paperSectionId')});
        }
        return section;
    }
});
Template.AdminSectionPapers.helpers({
    section: function(){
        return sections.findOne({_id : Session.get('paperSectionId')});
    },
    papers: function() {
        return articles.find().fetch(); // subscription is limited to just these section papers, so we can return the whole collection
    }
});

// Audit
// ---------------
Template.AdminArticlesAudit.helpers({
    duplicates: function(){
        return  Session.get('articles-duplicate');
    }
});
Template.AdminArticlesAuditContent.helpers({
    paperchaseAudit: function(){
        return  Session.get('articles-files-audit');
    },
    ncbiAudit: function(){
        return  Session.get('articles-ncbi-audit');
    }
});

// Advance
// ---------------
Template.AdminAdvanceArticles.helpers({
    statusAction: function(){
        return Session.get('statusModalAction');
    },
    modalMessage: function(){
        return  Session.get('modalMessage');
    },
    savingOrder: function(){
        return  Session.get('savingOrder');
    }
});
// Template.AdminAdvanceArticlesTypes.helpers({
//  types: function(){
//      return  Session.get('advanceAdmin');
//  }
// });
Template.AdminAdvanceArticles.helpers({
    sections: function(){
        return Session.get('advanceAdmin');
    }
});
Template.AdminAdvanceArticlesDiff.helpers({
    advanceDiff: function(){
        return Session.get('advanceDiff');
    }
});
Template.AdminAdvanceArticlesRemove.helpers({
    articles: function() {
        return Session.get('advanceArticles');
    }
});
Template.AdminAdvanceArticlesResearch.helpers({
    articles: function() {
        return Session.get('ojsAdvanceResearch');
    },
    saving: function() {
        return Session.get('saving');
    }
});
