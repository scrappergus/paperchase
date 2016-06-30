// Articles
// --------
articles.before.insert(function (userId, doc) {
    // console.log('..articles before insert');
    var updatedBy = {};
    // Volume, Issue
    if(doc.volume && doc.issue){
        volume = doc.volume;
        issue = doc.issue;
        doc.issue_id = Meteor.call('articleIssueVolume',volume,issue);
    }
    // console.log(doc.issue_id);
    // track updates
    if(!doc.doc_updates){
        doc.doc_updates = {};
        doc.doc_updates.updates = [];
    }else if(doc.doc_updates && !doc.doc_updates.updates){
        doc.doc_updates.updates = [];
    }

    if(userId){
        updatedBy.user = userId;
    }

    updatedBy.date = new Date();
    doc.doc_updates.updates.push(updatedBy);
});
articles.after.insert(function (userId, doc) {
});
articles.before.update(function (userId, doc, fieldNames, modifier, options) {
    var volume,
        issue,
        updatedBy = {};
    // Advance article. Update sorters colleciton.
    // if(modifier.$set){
    //   if(modifier.$set['advance']){
    //     Meteor.call('sorterAddItem','advance',doc._id);
    //   }else{
    //     Meteor.call('sorterRemoveItem','advance',doc._id);
    //   }
    // }

    // for when we want to skip things in the hook
    if(modifier.$set && modifier.$set.batch){
        delete modifier.$set.batch;
    }

    // maintain IDs
    if(modifier.$set && modifier.$set.ids){
        for(var idType in doc.ids){
            if(!modifier.$set.ids[idType]){
                modifier.$set.ids[idType] = doc.ids[idType];
            }
        }
    }


    // maintain Files
    if(modifier.$set && modifier.$set.files){
        for(var fileType in doc.files){
            if(!modifier.$set.files[fileType]){
                modifier.$set.files[fileType] = doc.files[fileType];
            }
        }
    }

    // maintain Dates
    if(modifier.$set && modifier.$set.dates){
        for(var dateType in doc.dates){
            if(!modifier.$set.dates[dateType]){
                modifier.$set.dates[dateType] = doc.dates[dateType];
            }
        }
    }
    // maintain History
    if(modifier.$set && modifier.$set.history){
        for(var historyType in doc.history){
            if(!modifier.$set.history[historyType]){
                modifier.$set.history[historyType] = doc.history[historyType];
            }
        }
    }


    // Affiliations
    //add affiliation number to author
    //might need to adjust this as article updates get added
    if(fieldNames.indexOf('authors') != -1){
        var authorsList = modifier.$set.authors;
        var affiliationsList = doc.affiliations;
        // console.log('affiliationsList');console.log(affiliationsList);
        for(var i = 0 ; i < authorsList.length ; i++){
            if(authorsList[i].affiliations_names && affiliationsList){
                //article update from a batch import of author affiliations
                //affiliations_names is only used to find index of affiliation after batch import
                authorsList[i].affiliations_numbers = [];
                for(var a = 0 ; a < authorsList[i].affiliations_names.length ; a++){
                    var affiliationIndex = affiliationsList.indexOf(authorsList[i].affiliations_names[a]);
                    authorsList[i].affiliations_numbers.push(parseInt(affiliationIndex));
                }
            }else if(authorsList[i].affiliations_numbers){

            }
        }
    }

    if(modifier.$set && modifier.$set.issue_id && !modifier.$set.volume){
        issueData = issues.findOne({_id : modifier.$set.issue_id})
        if(issueData && issueData.volume && issueData.issue){
            modifier.$set.volume = issueData.volume;
            modifier.$set.issue = issueData.issue;
        }
    }else if(modifier.$set && modifier.$set.volume && modifier.$set.issue){
        volume = modifier.$set.volume;
        issue = modifier.$set.issue;
        modifier.$set.issue_id = Meteor.call('articleIssueVolume',volume,issue);
    }

    // authors
     if(modifier.$set && modifier.$set.authors && modifier.$set.authors.length === 0){
        console.log('MISSING AUTHORS: ' + doc._id);
     }

    // track updates
    if(!doc.doc_updates){
        modifier.$set.doc_updates = {};
        modifier.$set.doc_updates.updates = [];
    }else if(doc.doc_updates && !doc.doc_updates.updates){
        modifier.$set.doc_updates = doc.doc_updates;
        modifier.$set.doc_updates.updates = [];
    }else{
        modifier.$set.doc_updates = doc.doc_updates;
    }

    if(userId){
        updatedBy.user = userId;
    }else if(modifier.$set.ojsUser){
        updatedBy.ojs_user = modifier.$set.ojsUser;
        delete modifier.$set.ojsUser;
    }

    updatedBy.date = new Date();
    modifier.$set.doc_updates.updates.push(updatedBy);

    //recording this for easy sorting
    modifier.$set.last_update = updatedBy.date;
});

// Issues
// -----
issues.after.insert(function (userId, doc) {
    // console.log('..before insert issues');
    var issueData = {};
    issueData.doc_updates = {};
    issueData.doc_updates.created_date = new Date();
    issueData.doc_updates.created_by = userId;
});
issues.before.update(function (userId, doc, fieldNames, modifier, options) {

    if(modifier.$set && modifier.$set.current){
        var previouslyCurrent = issues.findOne({current: true});
        if(previouslyCurrent && previouslyCurrent._id != doc._id){
            Meteor.call('updateIssue',previouslyCurrent._id, {current:false}, function(error,result){
                if(error){
                    console.error('changing current issue', error);
                }
            });
        }
    }
});


// News
// -----
newsList.after.insert(function (userId, doc) {
    var updateObj = {};
    updateObj.doc_updates = {};
    updateObj.doc_updates.created = {};
    updateObj.doc_updates.created.date = new Date();
    updateObj.doc_updates.created.user = userId;
    newsList.update({_id: doc._id},{$set:updateObj});
});

newsList.after.update(function (userId, doc, fieldNames, modifier, options) {
    // console.log('..after update news');console.log(modifier);
    var updateObj = {};
    updateObj.date = new Date();
    updateObj.user = userId;
    newsList.direct.update({_id : doc._id}, {$addToSet : {'doc_updates.updates' : updateObj}}); // MUST use direct.update, otherwise will be stuck in an update loop
});

// Papers Sections
// ----------------
sections.after.insert(function (userId, doc) {
    // append to sorters collection if displaying
    if(doc.display){
        Meteor.call('sorterAddItem','sections',doc._id);
    }
});
sections.after.update(function (userId, doc, fieldNames, modifier, options){
    if(modifier.$set.display) {
        Meteor.call('sorterAddItem','sections',doc._id);
    }else{
        Meteor.call('sorterRemoveItem','sections',doc._id);
    }
});

// Sorters
// -------
sorters.after.update(function (userId, doc, fieldNames, modifier, options){
    if(modifier.$pull !== undefined) {
        var article_id = modifier.$pull;
        article_id = article_id.order;
        if(article_id){
            articles.direct.update({_id:article_id}, {$set: {advance:false}});
        }
    }
});
