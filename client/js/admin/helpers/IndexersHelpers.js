// Data Submission
// ---------------

// Begin PubMed
Template.registerHelper('pubMedPpubOk', function(pub_status, submissions) {
  if(pub_status === 'ppub' && submissions[submissions.length - 1].pub_status === 'ppub' ){
      return false;
  } else{
      return true;
  }
});
Template.DataSubmissionsSearchFormIssue.helpers({
    volumes: function(){
        return Session.get('archive');
    }
});

Template.AdminDataSubmissions.helpers({
    articles: function(){
        var articlesProcessedResult = [];
        var articlesList = articles.find({},{sort : {page_start:1}}).fetch();
        articlesList.forEach(function(article){
            articlesProcessedResult.push(Meteor.article.readyData(article));
        });
        return articlesProcessedResult;
    },
    query: function(){
        return Template.instance().queryForDisplay.get();
    },
    // error: function(){
    //     return Session.get('error');
    // },
    piiNotFound: function(){
        if(Template.instance().queryType.get() === 'pii'){
            var piiNotFound = [];
            var articlesByPii = {};
            var articlesList = articles.find().fetch();
            articlesList.forEach(function(article){
                if(article.ids.pii){
                    articlesByPii[article.ids.pii] = true;
                }
            });
            Template.instance().queryParams.get().forEach(function(pii){
                if(!articlesByPii[pii]){
                    piiNotFound.push(pii);
                }
            });
            return piiNotFound;
        } else {
            return false;
        }
        // return Session.get('piiNotFound');
    },
    noneFound: function(){
        if(Template.instance().queried.get() && !Template.instance().processing.get() && articles.find().fetch().length === 0){
            return true;
        }
    },
    ppubAlreadySubmitted: function(){
        return Meteor.dataSubmissions.ppubAlreadySubmitted(Template.instance());
    },
    submitCount: function(){
        var okToSubmit = Meteor.dataSubmissions.articleOkToSubmit(Template.instance());
        if(okToSubmit){
            return okToSubmit.length;
        }
    },
    processing: function(){
        return Template.instance().processing.get();
    },
    volumes: function(){
        if (Session.get('archive') && Session.get('archive').length > 0){
            return Session.get('archive');
        } else{
            return null;
        }
    }
});
Template.AdminDataSubmissionsPast.helpers({
    submissionsSettings: function(){
        return {
            rowsPerPage: 10,
            showFilter: false,
            fields: [
                {
                    key: 'created_date',
                    label: 'Date',
                    fn: function(d){
                        return moment(d).format('MM/D/YYYY');
                    }
                },
                {
                    key: 'created_by',
                    label: 'Created By',
                    fn: function(uId){
                        var u = Meteor.users.findOne({'_id':uId},{'name_first': 1, 'name_last':1});
                        return u.name_first + ' ' + u.name_last;
                    }
                },
                {
                    key: 'file_name',
                    label: 'File'
                }
            ]
        };
    },
    articleSettings: function () {
        return {
            collection: articles.find().fetch(),
            rowsPerPage: 10,
            showFilter: false,
            fields: [
                {
                    key: 'title',
                    label: 'Title',
                    fn: function(title){
                            // var txt = document.createElement('textarea');
                            // txt.innerHTML = title.substring(0,40);
                            // if(title.length > 40){
                            //  txt.innerHTML += '...';
                            // }
                        var t = Meteor.admin.titleInTable(title);
                        return new Spacebars.SafeString(t);
                    }
                },
                {
                    key: 'ids.pii',
                    label: 'PII'
                },
                {
                    key: 'ids.pmid',
                    label: 'PubMed ID'
                },
                {
                    key: 'ids.pmc',
                    label: 'PMC ID'
                },
                {
                    key: 'pub_status',
                    label: 'Pub Status',
                    fn: function(value){
                        var stat = 'unknown';
                        if(pubStatusTranslate[parseInt(value - 1)]){
                            stat = pubStatusTranslate[parseInt(value - 1)].abbrev;
                        }
                        return stat;
                    }
                },
                {
                    key: 'submissions',
                    label: 'Last Submission',
                    fn: function(submissions){
                        if(submissions){
                            var d = submissions[submissions.length - 1].created_date;
                            d = moment(d).format('MM/D/YYYY');
                            return d;
                        }
                    }
                }
            ]
        };
    }
});
// End PubMed

// Begin CrossRef
Template.RegisterDoiSet.helpers({
    // missingPii: function(){
    //     return Session.get('missingPii');
    // },
});
// End CrossRef
