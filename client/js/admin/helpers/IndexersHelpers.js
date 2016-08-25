// Data Submission
// ---------------
Template.DataSubmissionsSearchForms.helpers({
    volumes: function(){
        // this helper is only used to determine whether or not to load DataSubmissionsSearchFormIssue
        // only want to load template when data available so that there are no timing problems initializing select dropdown
        if (Session.get('archive') && Session.get('archive').length > 0){
            return Session.get('archive');
        } else{
            return null;
        }
    }
});
Template.DataSubmissionsSearchFormIssue.helpers({
    volumes: function(){
        return Session.get('archive');
    }
});

Template.AdminDataSubmissions.helpers({
    articles: function(){
        return Session.get('queryResults');
    },
    query: function(){
        return Session.get('queryForDisplay');
    },
    // error: function(){
    //     return Session.get('error');
    // },
    piiNotFound: function(){
        return Session.get('piiNotFound');
    },
    processing: function(){
        return Session.get('processingQuery');
    },
    noneFound: function(){
        if(Session.get('queried') && !Session.get('processingQuery') && Session.get('queryResults').length === 0){
            return true;
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

Template.RegisterDoiSet.helpers({
    // missingPii: function(){
    //     return Session.get('missingPii');
    // },
});
