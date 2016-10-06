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
    }
    else if(doc.doc_updates && !doc.doc_updates.updates){
        doc.doc_updates.updates = [];
    }

    if(userId){
        updatedBy.user = userId;
    }

    updatedBy.date = new Date();
    doc.doc_updates.updates.push(updatedBy);
});
articles.after.insert(function (userId, doc) {
    // Pages - Keep issue doc pages up to date
    if( doc.page_start || doc.page_end ){
        if( doc.issue_id ){
            Meteor.call('updateIssuePages', doc.issue_id, function(error, result){
                if(error){
                    console.error('updateIssuePages', error);
                }
            });
        }
    }
});
articles.before.update(function (userId, doc, fieldNames, modifier, options) {
    var volume,
        issue;

    // for when we want to skip things in the hook
    if(modifier.$set && modifier.$set.batch){
        delete modifier.$set.batch;
    }

    // maintain Files
    if(modifier.$set && modifier.$set.files){
        for(var fileType in doc.files){
            if(!modifier.$set.files[fileType]){
                modifier.$set.files[fileType] = doc.files[fileType];
            }
        }
    }

    modifier.$set.previous = articles.findOne({_id : doc._id});

    // maintain IDs
    // causes bug when removing an ID on purpose
    // if(modifier.$set && modifier.$set.ids){
    //     for(var idType in doc.ids){
    //         if(!modifier.$set.ids[idType]){
    //             modifier.$set.ids[idType] = doc.ids[idType];
    //         }
    //     }
    // }
    //
    //
    // // maintain Dates
    // causes bug when removing a date on purpose
    // if(modifier.$set && modifier.$set.dates){
    //     for(var dateType in doc.dates){
    //         if(!modifier.$set.dates[dateType]){
    //             modifier.$set.dates[dateType] = doc.dates[dateType];
    //         }
    //     }
    // }

    // maintain History
    // causes bug when removing a date on purpose
    // if(modifier.$set && modifier.$set.history){
    //     for(var historyType in doc.history){
    //         if(!modifier.$set.history[historyType]){
    //             modifier.$set.history[historyType] = doc.history[historyType];
    //         }
    //     }
    // }

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
            }
            else if(authorsList[i].affiliations_numbers){

            }
        }
    }

    if(modifier.$set && modifier.$set.issue_id && !modifier.$set.volume){
        issueData = issues.findOne({_id : modifier.$set.issue_id});
        if(issueData && issueData.volume && issueData.issue){
            modifier.$set.volume = issueData.volume;
            modifier.$set.issue = issueData.issue;
        }
    }
    else if(modifier.$set && modifier.$set.volume && modifier.$set.issue){
        volume = modifier.$set.volume;
        issue = modifier.$set.issue;
        modifier.$set.issue_id = Meteor.call('articleIssueVolume',volume,issue);
    }

    // authors
    if(modifier.$set && modifier.$set.authors && modifier.$set.authors.length === 0){
        console.log('MISSING AUTHORS: ' + doc._id);
    }

    if(modifier.$set){
        modifier.$set.doc_updates = Meteor.db.trackUpdates(userId, doc, fieldNames, modifier, options);

        if( modifier.$set.ojsUser){
            // we use this in trackUpdates
            delete modifier.$set.ojsUser;
        }

        //recording this for easy sorting
        modifier.$set.last_update = new Date();
    }
});

articles.after.update(function (userId, doc, fieldNames, modifier, options) {
    var journal = journalConfig.findOne();
    // Advance article. Update sorters collection.
    if(journal.journal.short_name != 'oncotarget'){
        if(doc.advance && !this.previous.advance){
            Meteor.call('sorterAddItem', 'advance', doc._id);
        }
        else if(!doc.advance  && this.previous.advance){
            Meteor.call('sorterRemoveItem', 'advance', doc._id);
        }
    }

    // Pages - Keep issue doc pages up to date
    if( doc.page_start || doc.page_end || this.previous.page_start || this.previous.page_end ){
        if( doc.page_start != this.previous.page_start || doc.page_end != this.previous.page_end || doc.issue_id != this.previous.issue_id || !doc.display && this.previous.display || doc.display && !this.previous.display ){
            // Update issue
            if( doc.issue_id ){
                Meteor.call('updateIssuePages', doc.issue_id, function(error, result){
                    if(error){
                        console.error('updateIssuePages', error);
                    }
                });
            }
            if( this.previous.issue_id && doc.issue_id && doc.issue_id != this.previous.issue_id ){
                // Article changed issues, update both issues page spans
                Meteor.call('updateIssuePages', this.previous.issue_id, function(error, result){
                    if(error){
                        console.error('updateIssuePages', error);
                    }
                });
            }
        }
    }
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
    // Current issue
    //------------
    if(modifier.$set && modifier.$set.current){
        // Update previously current issue, set as not current
        var previouslyCurrent = issues.findOne({current: true});
        if(previouslyCurrent && previouslyCurrent._id != doc._id){
            Meteor.call('updateIssue',previouslyCurrent._id, {current:false}, function(error,result){
                if(error){
                    console.error('changing current issue', error);
                }
            });
        }

        // remove all articles in the issue from advance
        var articlesInIssue = articles.find({ issue_id: doc._id }).fetch();
        articlesInIssue.forEach(function(article){
            Meteor.call('updateArticle', article._id, {advance: false}, function(error,result){
                if(error){
                    console.error('removing article from advance failed', aritcle._id, error);
                }
            });
        });
    }

    // track updates
    // -------------
    modifier.$set.doc_updates = Meteor.db.trackUpdates(userId, doc, fieldNames, modifier, options);
    if(modifier.$set.ojsUser){
        // we use this in trackUpdates
        delete modifier.$set.ojsUser;
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
    }
    else{
        Meteor.call('sorterRemoveItem','sections',doc._id);
    }
});

// Sorters
// -------
sorters.after.update(function (userId, doc, fieldNames, modifier, options){
    // if(modifier.$pull !== undefined) {
        // var article_id = modifier.$pull;
        // article_id = article_id.order;
        // if(article_id){
        //     articles.direct.update({_id:article_id}, {$set: {advance:false}});
        // }
    // }
    var advanceArray, duplicates;

    if(Meteor.settings.public && Meteor.settings.public.journal && Meteor.settings.public.journal.name && Meteor.settings.public.journal.name === 'Oncotarget'){
        advanceArray = sorters.findOne({ name : 'advance' }).order;
        if (advanceArray) {
            duplicates = Meteor.organize.arrayDuplicates(advanceArray);
            if (duplicates && duplicates.lengh > 0){

            }

            // duplicate found, notify via emails
            var message = 'Duplicate Mongo ID found for ' + Meteor.settings.public.journal.name + ' advance \n' + duplicates.toString();

            Email.send({
               to: Meteor.settings.it.email,
               from: Meteor.settings.it.email,
               subject: 'Duplicate Advance Mongo ID',
               text: message
            });
        }
    }
});
