/*
 ADMIN ROUTES
*/

// Download
Router.route('/admin/doi_status_csv/',{
    name: 'doiStatusCsv',
    where: 'server',
    action: function(){
        var filename = journalConfig.findOne().journal.short_name + '_doi_status.csv';
        var csvData = 'PII,Registered,Deposited,Indexed, DOI Article Date, DOI Article Print Date,Article Date, DOI, PMC ID, PubMed ID' + '\n';
        Meteor.call('getAllArticlesDoiStatus',function(error,result){
            if(error){
                console.error('ERROR - get DOI status');
                console.error(error);
                throw new Meteor.Error(503, 'ERROR: DOI Registered Check', error);
            }else if(result){
                for(var i=0 ; i< result.length ; i++){
                    var epub = '',
                        registered = '',
                        deposited = '',
                        indexed = '',
                        crossRefEpub = '',
                        crossRefPrint = '',
                        doi = '',
                        pmc = '',
                        pmid = '',
                        pii = '';

                    if(result[i]['paperchase']['dates'] && result[i]['paperchase']['dates']['epub']){
                        epub = moment(result[i]['paperchase']['dates']['epub']).format('YYYY-MM-D');
                    }
                    if(result[i]['paperchase']['ids']['pmc']){
                        pmc = result[i]['paperchase']['ids']['pmc'];
                    }
                    if(result[i]['paperchase']['ids']['pmid']){
                        pmid = result[i]['paperchase']['ids']['pmid'];
                    }
                    if(result[i]['paperchase']['ids']['pii']){
                        pii = result[i]['paperchase']['ids']['pii'];
                    }
                    if(result[i]['deposited']['timestamp']){
                        deposited = moment(result[i]['deposited']['timestamp']).format('YYYY-MM-D');
                    }
                    if(result[i]['indexed_date']){
                        indexed = moment(result[i]['indexed_date']).format('YYYY-MM-D');
                    }
                    if(result[i]['crossref_epub_date']){
                        crossRefEpub = result[i]['crossref_epub_date'];
                    }
                    if(result[i]['crossref_print_date']){
                        crossRefPrint = result[i]['crossref_print_date'];
                    }
                    if(result[i]['doi']){
                        doi = result[i]['doi'];
                    }
                    if(result[i]['registered']){
                        registered = result[i]['registered'];
                    }

                    csvData += pii + ',' + registered + ',' + deposited + ',' + indexed + ',' + crossRefEpub + ',' + crossRefPrint + ',' + epub + ',' + doi + ',' + pmc + ',' + pmid + '\n';
                }
            }
        });
        this.response.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=' + filename
        });
        this.response.write(csvData);
        this.response.end();
    }
});

Router.route('/admin/article_dates_csv/:pii',{
    name: 'csvArticleDates',
    where: 'server',
    action: function(){
        var piiList = this.params.pii;

        var filename = journalConfig.findOne().journal.short_name + '_article_dates.csv';
        var csvData = 'PII, Submitted, Accepted, EPub ' + '\n'; // received = submitted

        Meteor.call('getArticlesDates', piiList, function(error,articlesList){
            if(error){
                console.error(error);
                throw new Meteor.Error('getArticlesDates', error);
            }else if(articlesList){
                for(var i=0; i< articlesList.length; i++){
                    var pii = '',
                        epub = '',
                        received = '',
                        accepted = '';

                    if(articlesList[i].ids && articlesList[i].ids.pii){
                        pii = articlesList[i].ids.pii
                    }

                    if(articlesList[i].history && articlesList[i].history.received){
                        received = articlesList[i].history.received
                    }

                    if(articlesList[i].history && articlesList[i].history.accepted){
                        accepted = articlesList[i].history.accepted
                    }

                    if(articlesList[i].dates && articlesList[i].dates.epub){
                        epub = articlesList[i].dates.epub
                    }

                    csvData += pii + ',' + received + ',' + accepted + ',' + epub + '\n';
                }
            }
        });
        this.response.writeHead(200, {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=' + filename
        });
        this.response.write(csvData);
        this.response.end();
    }
});
// Router.route('/admin/xml_audit/',{
//  name: 'xmlAudit',
//  where: 'server',
//  action: function(){
//      var filename = journalConfig.findOne().journal.short_name + '_xml_audit.csv';
//      var csvData = '' + '\n';
//      console.log('data', this.request.data);
//      csvData += this.request.data;

//      this.response.writeHead(200, {
//        'Content-Type': 'text/csv',
//        'Content-Disposition': 'attachment; filename=' + filename
//      });
//      this.response.write(csvData);
//      this.response.end();
//  }
// });

if (Meteor.isClient) {
    // Variables
    // ----------
    Session.setDefault('admin-not-found',false);
    // Dashboard
    Session.setDefault('processing-pii',null);
    // For Authors
    Session.setDefault('showForm',false);
    Session.setDefault('sectionId',null);
    // About
    Session.setDefault('adminAboutSections',null);
    Session.setDefault('showAboutForm',false);
    Session.setDefault('aboutSectionId', null);
    // News
    // Session.setDefault('newsId',null);
    Session.setDefault('newsData',null);
    // Paper sections
    Session.setDefault('paperSectionId',null);
    // DOI Status, articles list
    Session.setDefault('articles-doi-status',null);
    // Batch page
    Session.setDefault('articles-files-audit',null);
    Session.setDefault('articles-ncbi-audit',null);
    // Articles audit
    Session.setDefault('articles-duplicate', null);
    // Advance
    Session.setDefault('advanceAdmin',null);
    Session.setDefault('savingOrder',false);
    Session.setDefault('advanceDiff',null);
    Session.setDefault('advanceLegacy',null);
    // forms
    Session.setDefault('savedMessage',null);
    Session.setDefault('errorMessage',null);
    Session.setDefault('statusModalAction',null);
    Session.setDefault('statusModalDetails',null);
    // Article
    Session.setDefault('article',null);
    Session.setDefault('xml-verify',null);
    Session.setDefault('xml-file',null);
    Session.setDefault('xml-figures',null);
    Session.setDefault('article-form',null);
    Session.setDefault('new-article',null); // only for when uploading XML, this is the data parsed out
    Session.setDefault('articles-updated',null); //right now just for when deleting an issue, removing issue info from docs
    Session.setDefault('article-legacy',null); // for legacy ojs intake
    Session.setDefault('article-legacy-error',null); // for legacy ojs intake
    // User
    Session.setDefault('admin-user',null);
    // Institutions
    Session.setDefault('recommendation',null);


    Router.route('/admin', {
        name: 'AdminDashboard',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Home ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articlesRecentFive'),
                Meteor.subscribe('articlesWithoutDates'),
            ]
        },
        data: function(){
            if(this.ready()){
                var articlesListRecent = articles.find({},{sort:{'_id':1},limit : 5}).fetch();
                var articlesListAll = articles.find().fetch();
                return {
                    articles: articlesListRecent,
                    withoutDates: articlesListAll.length - 5
                };
            }
        }
    });

    // About
    Router.route('/admin/about', {
        name: 'AdminAbout',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | About ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('about'),
                Meteor.subscribe('sortedList','about')
            ]
        },
        onBeforeAction: function(){
            Meteor.call('getListWithData', 'about', function(error,result){
                if(error){
                    console.error('getListWithData',error);
                }else if(result){
                    Session.set('adminAboutSections',result);
                }
            });
            this.next();
        }
    });

    // Site control
    Router.route('/admin/site-control', {
        name: 'AdminSiteControl',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Site Control ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('sectionsAll'),
                Meteor.subscribe('sortedList','sections')
            ]
        },
        data: function(){
            if(this.ready()){
                var sorted  = sorters.findOne();
                // more data set is AdminHelpers.js (main side nav)
                return {
                    sectionSideNav : sorted['ordered']
                };
            }
        }
    });

    // News
    Router.route('/admin/news',{
        name: 'AdminNews',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | News ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return [
                Meteor.subscribe('newsListAll')
            ]
        }
    });
    Router.route('/admin/news-add',{
        name: 'AdminNewsAdd',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Add News ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return [
                // Meteor.subscribe('news')
            ]
        }
    });
    Router.route('/admin/news-edit/:_id',{
        name: 'AdminNewsEdit',
        title: function() {
            var pageTitle = 'Admin | Edit News ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return [
                Meteor.subscribe('newsItem', this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var newsFound = newsList.findOne({_id : this.params._id});
                if(newsFound){
                    Session.set('newsData',newsFound);
                }else{
                    Session.set('admin-not-found',true);
                }
            }
        }
    });

    // Recommendations
    Router.route('/admin/recommendations',{
        name: 'AdminRecommendations',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Recommendations ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return [
                Meteor.subscribe('recommendations')
            ]
        },
        data: function(){
            if(this.ready()){
                return{
                    recommendations: recommendations.find().fetch()
                }
            }
        }
    });
    Router.route('/admin/recommendation/:_id',{
        name: 'AdminRecommendationUpdate',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Recommendations ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return [
                Meteor.subscribe('recommendationData',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var recommendationFound = recommendations.findOne({'_id':this.params._id});
                if(recommendationFound){
                    Session.set('recommendation',recommendationFound);
                }else{
                    Session.set('admin-not-found',true);
                }
            }
        }
    });

    // Data submissions
    Router.route('/admin/data_submissions',{
        name: 'AdminDataSubmissions',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Data Submissions ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.call('archive',function(error,result){
                if(error){
                    console.error('Archive Error', error);
                }else if(result){
                    Session.set('archive',result);
                }
            });
            Session.set('submission_list',null);
            Session.set('error',false);
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleTypes')
            ]
        }
    });
    Router.route('/admin/data_submissions/past',{
        name: 'AdminDataSubmissionsPast',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Past Data Submissions ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('adminUsers'),
                Meteor.subscribe('submissions'),
                Meteor.subscribe('articles')
            ]
        },
        data: function(){
            if(this.ready()){
                return{
                    articles: articles.find({},{submissions:1}).fetch(),
                    submissions: submissions.find().fetch()
                }
            };
        }
    });

    // Intake
    // xml uploading
    Router.route('/admin/upload/xml',{
        name: 'AdminArticleXmlUpload',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | XML Upload ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
    });

    // Articles List
    Router.route('/admin/articles',{
        name: 'AdminArticlesDashboard',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Articles Dashboard';
            if(Session.get('journal')){
                pageTitle += ' : ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articles'),
                Meteor.subscribe('feature'),
                Meteor.subscribe('advance'),
                Meteor.subscribe('sortedList','advance')
            ]
        },
        data: function(){
            if(this.ready()){
                var journal;
                var featureList = articles.find({'feature':true},{sort:{'_id':1}}).fetch();
                var sorted  = sorters.findOne();
                var sortedArticles;
                // var journalSettings = journalConfig.findOne();
                if(Session.get('journal')){
                    journal = Session.get('journal').journal;
                }

                if(sorted && sorted['articles']){
                    sortedArticles = sorted['articles'];
                }
                return {
                    feature : featureList,
                    advance : sortedArticles,
                    journal : journal
                }
            }
        }
    });
    Router.route('/admin/articles/list',{
        name: 'AdminArticlesList',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Articles List';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articles')
            ]
        },
        data: function(){
            return {
                articles : articles.find().fetch()
            }
        }
    });
    Router.route('/admin/articles/audit',{
        name: 'AdminArticlesAudit',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Articles Audit';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.call('allArticlesFilesAudit',function(error,result){
                if(error){
                    throw new Meteor.Error(error);
                }else{
                    Session.set('articles-files-audit',result);
                };
            });
            Meteor.call('pubMedAndPmcAudit',function(error,result){
                if(error){
                    throw new Meteor.Error(error);
                }else{
                    Session.set('articles-ncbi-audit',result);
                };
            });
            Meteor.call('duplicateArticles',function(error,result){
                if(error){
                    throw new Meteor.Error(error);
                }else{
                    Session.set('articles-duplicate',result);
                };
            });
            this.next();
        }

    });

    // Single Article
    Router.route('/admin/article_intake/',{
        name: 'AdminArticleLegacyIntake',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Article Intake ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminDashboard');
            }else{
                Meteor.call('legacyArticleReadyForIntake', this.params.query, function(error, result) {
                    if(error){
                        console.error('preProcessArticle',error);
                        $('#status-modal').openModal({
                            dismissible: true
                        });
                        Session.set('article-legacy-error',true);
                        Meteor.formActions.errorMessage(error.error);
                    }else if(result){
                        Session.set('article-legacy',result);
                    }
                });
                this.next();
            }
        },
        data: function(){
            // if(this.ready()){
            //     var article = articles.findOne();
            //     if(article && article._id == this.params._id){ // hack for timing problem when subscried to articles already
            //         if(!article.volume && article.issue_id){
            //             // for display purposes
            //             var issueInfo = issues.findOne();
            //             article.volume = issueInfo.volume;
            //             article.issue = issueInfo.issue;
            //         }
            //         Session.set('article',article);
            //     }
            // }
        }
    });
    Router.route('/admin/article/:_id',{
        name: 'AdminArticleOverview',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Article ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.adminArticle.urlViaPiiOrMongo(this.params._id,'AdminArticleOverview');
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id),
                Meteor.subscribe('articleIssue',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var article = articles.findOne();
                if(article && article._id == this.params._id){ // hack for timing problem when subscried to articles already
                    if(!article.volume && article.issue_id){
                        // for display purposes
                        var issueInfo = issues.findOne();
                        article.volume = issueInfo.volume;
                        article.issue = issueInfo.issue;
                    }
                    if(article.volume && article.issue){
                        article.volume_and_issue = Meteor.issue.createIssueParam(article.volume,article.issue);
                    }
                    Session.set('article',article);
                }
            }
        }
    });
    Router.route('/admin/article/:_id/figures',{
        name: 'AdminArticleFigures',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Article Figures ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminArticleOverview', {_id : this.params._id});
            }else{
                Meteor.adminArticle.urlViaPiiOrMongo(this.params._id,'AdminArticleFigures');
                Meteor.call('pmcFiguresInXml',this.params._id,function(error,result){
                    if(error){

                    }else if(result){
                        Session.set('xml-figures',result);
                    }
                });
                this.next();
            }
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id),
                Meteor.subscribe('articleIssue',this.params._id),
                Meteor.subscribe('journalConfig')
            ]
        },
        data: function(){
            if(this.ready()){
                var article = articles.findOne({'_id': this.params._id});
                if(article){
                    article = Meteor.article.readyData(article);
                    Session.set('article',article);
                }
            }
        }
    });
    Router.route('/admin/article/:_id/files',{
        name: 'AdminArticleFiles',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Article PDF and XML Setting';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminArticleOverview', {_id : this.params._id});
            }else{
                Meteor.adminArticle.urlViaPiiOrMongo(this.params._id,'AdminArticleFiles');
                this.next();
            }
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id),
                Meteor.subscribe('articleIssue',this.params._id),
                Meteor.subscribe('journalConfig')
            ]
        },
        data: function(){
            if(this.ready()){
                var article = articles.findOne({'_id': this.params._id});
                if(article){
                    article = Meteor.article.readyData(article);
                    Session.set('article',article);
                }
            }
        }
    });
    Router.route('/admin/article/:_id/uploader',{
        name: 'AdminArticleFilesUploader',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Article PDF and XML Uploader';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminArticleOverview', {_id : this.params._id});
            }else{
                Meteor.adminArticle.urlViaPiiOrMongo(this.params._id,'AdminArticleFilesUploader');
                this.next();
            }
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id),
                Meteor.subscribe('articleIssue',this.params._id),
                Meteor.subscribe('journalConfig')
            ]
        },
        data: function(){
            if(this.ready()){
                var article = articles.findOne({'_id': this.params._id});
                if(article){
                    article = Meteor.article.readyData(article);
                    Session.set('article',article);
                }
            }
        }
    });
    Router.route('/admin/article/:_id/edit',{
        name: 'AdminArticle',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Edit Article ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminArticleOverview', {_id : this.params._id});
            }else{
                Meteor.adminArticle.urlViaPiiOrMongo(this.params._id,'AdminArticle');

                Meteor.call('preProcessArticle',this.params._id,function(error,result){
                    if(error){
                        console.error('preProcessArticle',error);
                    }else if(result){
                        Session.set('article-form',result);
                    }
                });
                this.next();
            }
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleInfo',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                Session.set('article-id',this.params._id);
            }
        }
    });
    Router.route('/admin/add_article/',{
        name: 'AdminArticleAdd',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Add Article ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminDashboard');
            }else{
                Session.set('article',null);
                Meteor.call('preProcessArticle',function(error,result){
                    if(error){
                        console.log('ERROR - preProcessArticle');
                        console.log(error);
                    }
                    if(result){
                        Session.set('article-form',result);
                    }
                });
                this.next();
            }
        },
    });
    Router.route('/admin/upload_xml/',{
        name: 'AdminUploadArticleXml',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Upload Article XML ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            if(!Roles.userIsInRole(Meteor.userId(), ['edit','super-admin'],'article')){
                Router.go('AdminDashboard');
            }else{
                this.next();
            }
        },
    });

    // Article Types
    Router.route('/admin/article_types',{
        name: 'AdminArticleTypes',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Article Types';
            if(Session.get('journal')){
                pageTitle += ' : ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('articleTypes')
            ]
        },
        data: function(){
            if(this.ready()){
                return {
                    types : articleTypes.find({},{sort:{name:1}}).fetch()
                }
            }
        }
    });

    // DOI
    Router.route('/admin/doi_status', {
        name: 'AdminDoiStatus',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | DOI Status ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.call('getAllArticlesDoiStatus',function(error,result){
                if(error){
                    console.error('ERROR - get DOI status');
                    console.error(error);
                    throw new Meteor.Error(503, 'ERROR: DOI Registered Check', error);
                }
                if(result){
                    Session.set('articles-doi-status',result);
                }
            });
            this.next();
        }
    });


    // Advance articles
    Router.route('/admin/articles/aop',{
        name: 'AdminAop',
        title: function() {
            var pageTitle = 'Admin | AOP ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('aop')
            ]
        },
        data: function(){
            if(this.ready()){

                return{
                    articles: articles.find().fetch()
                }
            }
        }
    });
    Router.route('/admin/articles/advance',{
        name: 'AdminAdvanceArticles',
        title: function() {
            var pageTitle = 'Admin | Advance Articles ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('publish'),
                Meteor.subscribe('sections'),
                Meteor.subscribe('advance'),
                Meteor.subscribe('sortedList','advance')
            ]
        },
        data: function(){
            if(this.ready()){
                var sorted  = sorters.findOne({name:'advance'});
                var advance = publish.findOne({name: 'advance'}, {sort:{'pubtime':-1}});

                var sections = Meteor.advance.dataForSectionsPage(sorted.articles);
                Session.set('advanceAdmin',sections);

                return{
                    pubdate: advance.pubtime.toLocaleDateString(),
                    pubtime: advance.pubtime.toLocaleTimeString(),
                    total: sorted.articles.length
                }
            }
        }
    });
    Router.route('/admin/articles/advance/research',{
        name: 'AdminAdvanceArticlesResearch',
        title: function() {
            var pageTitle = 'Admin | Advance Reseach Papers';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('publish'),
                Meteor.subscribe('sections'),
                Meteor.subscribe('advance'),
                Meteor.subscribe('sortedList','advance')
            ]
        },
        data: function(){
            if(this.ready()){
                var sorted  = sorters.findOne({name:'advance'});
                var advanceSections = Meteor.advance.articlesBySection(sorted.articles);
                var res;

                if(advanceSections['Recent Research Papers']){
                    res = advanceSections['Recent Research Papers'];
                    res = res.concat(advanceSections['Research Papers']);
                }else{
                    res = advanceSections['Research Papers'];
                }

                return{
                    articles: res
                }
            }
        }
    });
    Router.route('/admin/articles/advance-diff',{
        name: 'AdminAdvanceArticlesDiff',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Advance Articles Difference ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.call('ojsGetAdvanceArticles', function(error,ojsArticles){
                if(ojsArticles){
                    Session.set('advanceLegacy',ojsArticles)
                    Meteor.call('compareWithLegacy', ojsArticles, function(error,result){
                        if(result){
                            Session.set('advanceDiff',result)
                        }
                    });
                }
            });
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('advance'),
                Meteor.subscribe('sortedList','advance')
            ]
        }
    });
    Router.route('/admin/articles/advance/remove',{
        name: 'AdminAdvanceArticlesRemove',
        title: function() {
            var pageTitle = 'Admin | Advance Remove';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('advance'),
                Meteor.subscribe('sortedList','advance')
            ]
        },
        data: function(){
            if(this.ready()){
                var sorted  = sorters.findOne({name:'advance'});
                // console.log(sorted.articles);
                return{
                    articles: sorted.articles
                }
            }
        }
    });

    // Sections
    Router.route('/admin/sections', {
        name: 'AdminSections',
        title: function() {
            var pageTitle = 'Admin | Sections ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('sectionsAll')
            ]
        }
    });
    Router.route('/admin/sections-add', {
        name: 'AdminSectionsAdd',
        title: function() {
            var pageTitle = 'Admin | Add Section ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                // sections
            ]
        }
    });
    Router.route('/admin/sections/:_id',{
        name: 'AdminSectionPapers',
        title: function() {
            var pageTitle = 'Admin | Section Papers ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Session.set('paperSectionId',this.params._id);
            this.next();
        },
        waitOn: function(){
            return [
                Meteor.subscribe('sectionPapers', this.params._id)
            ]
        }
    });
    Router.route('/admin/sections-edit/:_id',{
        name: 'AdminSectionsEdit',
        title: function() {
            var pageTitle = 'Admin | Edit Section ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return [
                Meteor.subscribe('sectionById', this.params._id)
            ]
        }
    });

    // Archive
    Router.route('/admin/archive', {
        name: 'AdminArchive',
        title: function() {
            var pageTitle = 'Admin | Archive ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Meteor.call('archive',function(error,result){
                if(error){
                    console.error('Archive Error', error);
                }else if(result){
                    Session.set('archive',result);
                }
            });
            this.next();
        }
    });

    // Issue
    Router.route('/admin/issue/:vi', {
        name: 'AdminIssue',
        title: function() {
            var pageTitle = 'Admin | Issue ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Session.set('issue',null);
            if(this.params.vi){
                var pieces = Meteor.issue.urlPieces(this.params.vi);
                if(pieces && pieces.volume && pieces.issue){
                    Meteor.call('getIssueAndFiles', pieces.volume, pieces.issue, true, function(error,result){
                        if(error){
                            console.error('ERROR - getIssueAndFiles',error);
                        }else if(result){
                            Session.set('issue',result);
                        }else{
                            Session.set('admin-not-found',true);
                        }
                    });
                }else{
                    Session.set('admin-not-found',true);
                }
            }else{
                Session.set('admin-not-found',true);
            }

            this.next();
        }
    });
    Router.route('/admin/issue_deleted', {
        name: 'AdminIssueDeleted',
        title: function() {
            var pageTitle = 'Admin | Issue Deleted ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin'
    });
    Router.route('/admin/add_issue/', {
        name: 'AdminAddIssue',
        title: function() {
            var pageTitle = 'Admin | Add Issue ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
    });

    // Volume
    Router.route('/admin/volume/:v', {
        name: 'AdminVolume',
        title: function() {
            var pageTitle = 'Admin | Volume ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Session.set('volume',null);
            console.log( this.params.v);
            if(parseInt( this.params.v ) !=  this.params.v){
                Session.set('admin-not-found',true);
            }else{
                Meteor.call('getVolume', this.params.v, function(error,result){
                    if(error){
                        console.log('ERROR - getVolume');
                        console.log(error);
                    }else if(result){
                        Session.set('volume',result);
                    }else{
                        Session.set('admin-not-found',true);
                    }
                });
            }

            this.next();
        }
    });

    // Users
    Router.route('/admin/users', {
        name: 'AdminUsers',
        title: function() {
            var pageTitle = 'Admin | Users ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
            Meteor.subscribe('allUsers')
            ]
        },
        data: function(){
            if(this.ready()){
                var users = Meteor.users.find().fetch();
                return {
                    users: users
                };
            }
        }
    });
    // User
    Router.route('/admin/user/:_id', {
        name: 'AdminUser',
        title: function() {
            var pageTitle = 'Admin | User ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('userData',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var userFound = Meteor.users.findOne({'_id':this.params._id});
                if(userFound){
                    Session.set('admin-user',userFound);
                }else{
                    Session.set('admin-not-found',true);
                }
            }
        }
    });
    Router.route('/admin/user/:_id/edit', {
        name: 'AdminUserEdit',
        title: function() {
            var pageTitle = 'Admin | Edit User ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Session.set('admin-user',null);

            Meteor.call('readyUserFormData', this.params._id, function(error,result){
                if(error){
                    console.error('readyUserFormData',error);
                }else if(result){
                    Session.set('admin-user',result);
                }else{
                   Session.set('admin-not-found',true);
                }
            });

            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('userData',this.params._id)
            ]
        }
    });
    Router.route('/admin/user/:_id/subs', {
        name: 'AdminUserSubs',
        title: function() {
            var pageTitle = 'Admin | User ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Meteor.call('archive',function(error,result){
                if(error){
                    console.error('Archive Error', error);
                }else if(result){
                    Session.set('archive',result);
                }
            });
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('userData',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var id = this.params._id;
                var u = Meteor.users.findOne({'_id':id});
                if(u){
                    Session.set('admin-user',u);
                }else{
                    Session.set('admin-not-found',true);
                }
            }
        }
    });
    Router.route('/admin/adduser', {
        name: 'AdminAddUser',
        title: function() {
            var pageTitle = 'Admin | Add User ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            Session.set('admin-user',null);

            Meteor.call('readyUserFormData', null, function(error,result){
                if(error){
                    console.error('readyUserFormData',error);
                }else if(result){
                    Session.set('admin-user',result);
                }else{
                    Router.go('AdminAddUser');
                }
            });

            this.next();
        },
    });

    // Authors
    Router.route('/admin/authors', {
        name: 'AdminAuthors',
        title: function() {
            var pageTitle = 'Admin | Authors ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('authorsList'),
            ]
        },
        data: function(){
            if(this.ready()){
                var authorsList = authors.find().fetch();
                return {
                    authors : authorsList
                };
            }
        }
    });
    Router.route('/admin/author/:_id', {
        name: 'AdminAuthor',
        title: function() {
            var pageTitle = 'Admin | Author ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
            Meteor.subscribe('articles'),
            Meteor.subscribe('authorData',this.params._id)
            ]
        },
        data: function(){
            if(this.ready()){
                var mongoId = this.params._id;
                var authorsData = authors.findOne({'_id':mongoId});
                if(authorsData){
                    var authorArticlesList = articles.find({ 'authors' : { '$elemMatch' : { 'ids.mongo_id' :  mongoId } } });
                    if(authorArticlesList){
                        authorsData.articles = authorArticlesList;
                    }
                    return {
                        author : authorsData
                    };
                }else{
                    Session.set('admin-not-found',true);
                }
            }
        }
    });

    // Editorial Board
    Router.route('/admin/editorial-board', {
        name: 'AdminEditorialBoard',
        title: function() {
            var pageTitle = 'Admin | Editorial Board ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('entireBoard'),
            ]
        },
        data: function(){
            if(this.ready()){
                var edboardList = edboard.find().fetch();
                // console.log(edboardList);
                return {
                    edboard : edboardList
                };
            }
        }
    });
    Router.route('/admin/editorial-board/add', {
        name: 'AdminEditorialBoardAdd',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Add Editorial Board ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        data: function(){
            if(this.ready()){
                return {
                    member : Meteor.adminEdBoard.formPrepareData()
                };
            }
        }
    });
    Router.route('/admin/editorial-board/edit/:_id', {
        name: 'AdminEditorialBoardEdit',
        title: function() {
            var pageTitle = 'Admin | Edit Editorial Board ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        onBeforeAction: function(){
            // TODO
            // Redirect if no member
            this.next();
        },
        waitOn: function(){
            return[
                Meteor.subscribe('edBoardMember',this.params._id),
            ]
        },
        data: function(){
            if(this.ready()){
                var found = edboard.findOne({_id : this.params._id});
                if(found){
                    return {
                        member : Meteor.adminEdBoard.formPrepareData(this.params._id)
                    };
                }else{
                    Session.set('admin-not-found',true);
                }
            }
        }
    });

    // For Authors
    Router.route('/admin/for-authors', {
        name: 'AdminForAuthors',
        title: function() {
            var pageTitle = 'Admin | For Authors ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('forAuthors'),
                Meteor.subscribe('sortedList','forAuthors')
            ]
        },
        data: function(){
            // Keep data declarations here
            // when adding data via template helper, the array shows as an object and there is an error:
            // {#each}} currently only accepts arrays, cursors or falsey values.
            if(this.ready()){
                var sections = forAuthors.find().fetch();
                var sorted  = sorters.findOne();
                return {
                    sections : sorted['ordered']
                };
            }
        }
    });

    // For Authors
    Router.route('/admin/ethics', {
        name: 'AdminEthics',
        title: function() {
            var pageTitle = 'Admin | Ethics ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        layoutTemplate: 'Admin',
        waitOn: function(){
            return[
                Meteor.subscribe('ethics'),
                Meteor.subscribe('sortedList','ethics')
            ]
        },
        data: function(){
            // Keep data declarations here
            // when adding data via template helper, the array shows as an object and there is an error:
            // {#each}} currently only accepts arrays, cursors or falsey values.
            if(this.ready()){
                var sections = ethics.find().fetch();
                var sorted  = sorters.findOne();
                return {
                    sections : sorted['ordered']
                };
            }
        }
    });

    // Institutions
    Router.route('/admin/institution', {
        name: 'AdminInstitution',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Institutions ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
                Meteor.subscribe('institutions')
            ]
        },
        data: function () {
            return {
                institutions: institutions.find({})
            };
        }
    });
    Router.route('/admin/institution/add', {
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Add Institution ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        name: 'AdminInstitutionAdd',
        data: function(){
            return {
                insertForm: true
            }
        }
    });
    Router.route('/admin/institution/edit/:_id', {
        layoutTemplate: 'Admin',
        name: 'AdminInstitutionForm',
        title: function() {
            var pageTitle = 'Admin | Edit Institution ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        waitOn: function(){
            return[
            Meteor.subscribe('institution',this.params._id)
            ]
        },
        data: function(){
            return {
                institution: institutions.findOne({"_id":this.params._id}),
                updateForm: true
            }
        }
    });

    // Crawl
    Router.route('/admin/crawl',{
        name: 'adminCrawl',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Crawl ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        data: function(){
            if(this.ready()){
                var journal;
                if(Session.get('journal')){
                    journal = Session.get('journal').journal;
                }
                return {
                    journal : journal
                }
            }
        }
    });

    //this route is used to query pmc for all xml.. don't go here.
    Router.route('/admin/batch_process', {
        name: 'AdminBatch',
        layoutTemplate: 'Admin',
        title: function() {
            var pageTitle = 'Admin | Batch Process ';
            if(Session.get('journal')){
                pageTitle += ': ' + Session.get('journal').journal.name;
            }
            return pageTitle;
        },
        onBeforeAction: function(){
            Meteor.call('allArticlesFilesAudit',function(error,result){
                if(error){
                    throw new Meteor.Error(error);
                }else{
                    Session.set('articles-files-audit',result);
                };
            });
            Meteor.call('pubMedAndPmcAudit',function(error,result){
                if(error){
                    throw new Meteor.Error(error);
                }else{
                    Session.set('articles-ncbi-audit',result);
                };
            });
            this.next();
        }
    });
}
