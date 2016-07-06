Meteor.methods({
    archive: function(articleIssueId){
        //combine vol and issue collections
        var journal,
            assetUrl,
            issuesList,
            volumesList;
        var issuesObj = {};

        journal = journalConfig.findOne({}).journal.short_name;
        assetUrl =  journalConfig.findOne().assets;
        issuesList = issues.find({},{}).fetch();
        volumesList = volumes.find({},{sort : {volume:-1}}).fetch();

        for(var i=0 ; i<issuesList.length ; i++){
            issuesObj[issuesList[i]._id] = issuesList[i];
        }

        for(var v=0 ; v < volumesList.length ; v++){
            volumesList[v].issues_data = [];
            var volumeIssues = volumesList[v].issues;
            if(volumeIssues !== undefined) {
                for(var vi=0 ; vi < volumeIssues.length ; vi++){
                    var issueMongoId = volumeIssues[vi];
                    // add cover path to issue
                    if(articleIssueId && issueMongoId == articleIssueId){
                        // For providing all available issues on the article form
                        issuesObj[issueMongoId].selected = true;
                    }
                    if(issuesObj[issueMongoId] && issuesObj[issueMongoId].cover){
                        issuesObj[issueMongoId].coverPath = Meteor.issue.coverPath(assetUrl,issuesObj[issueMongoId].cover);
                    }
                    if(issuesObj[issueMongoId]){
                        issuesObj[issueMongoId].vi = Meteor.issue.createIssueParam(issuesObj[issueMongoId].volume , issuesObj[issueMongoId].issue);
                    }
                    if(issuesObj[issueMongoId]){
                        volumesList[v].issues_data.push(issuesObj[issueMongoId]);
                    }
                }
            }
        }
        // console.log('volumesList',volumesList);
        return volumesList;
    },
    getVolume: function(volume){
        // will return all issues and issue data. No articles.
        var vol = volumes.findOne({volume : parseInt(volume)});
        if(vol){
            vol.issues_data = [];
            var issueIds = vol.issues;
            for(var i=0 ; i<issueIds.length ; i++){
                var issue = issues.findOne({_id : issueIds[i]});
                vol.issues_data.push(issue);
            }
            return vol;
        }
        return;
    },
    updateVolume: function(volumeId, updateObj){
        return volumes.update({_id :volumeId },updateObj);
    },
    addIssue: function(issueData){
        var fut = new future();
        // console.log('..addIssue', issueData);
        //check if volume exists, if not add
        var vol,
            iss,
            issueId;

        issueData.volume = parseInt(issueData.volume);

        if(!issueData.issue_linkable){
            issueData.issue_linkable = Meteor.issue.linkeableIssue(issueData.issue);
        }

        //double check that issue does not exist
        iss = issues.findOne({'volume': issueData.volume, 'issue': issueData.issue});

        if( !iss ){
            issueId = issues.insert(issueData);
            // console.log(' issue created', issueId);
        }
        else{
            issueId = iss._id;
        }

        // If Vol does not exist, then create
        vol = volumes.findOne({'volume': issueData.volume});
        if( !vol ){
            Meteor.call('addVolume', issueData.volume, issueId, function(error,_id){
                if(error){
                    console.error('ERROR: ' + error.message);
                }
                else{
                    fut.return(issueId);
                }
            });
        }
        else{
            // Add issue to issue array, append to end
            Meteor.call('addIssueToVolume',issueData['volume'],issueId, function(error,_id){
                if(error){
                    console.error('ERROR: ' + error.message);
                }
                else{
                    fut.return(issueId);
                }
            });
        }

        try {
            return fut.wait();
        } catch(err) {
            throw new Meteor.Error(err);
        }
    },
    updateIssue: function(mongoId, update){
        // console.log('..updateIssue',update);
        var fut = new future();
        if(!mongoId){
            Meteor.call('addIssue',update,function(error,result){
                if(error){
                    console.error('addIssue',error);
                }
                else if(result){
                    fut.return(result);
                }
            });
        }
        else{
            fut.return(issues.update({'_id':mongoId},{$set:update}));
        }

        try {
            return fut.wait();
        } catch(err) {
            throw new Meteor.Error(err);
        }
    },
    findIssue: function(where){
        return issues.findOne(where);
    },
    addVolume: function(volume,issue){
        // console.log('..addVolume',volume,issue);
        var insertObj = {'volume':volume};
        if(issue){
            insertObj.issues = [];
        }
        insertObj.issues.push(issue);
        return volumes.insert(insertObj);
    },
    addIssueToVolume: function(volume,newIssueMongoId){
        // console.log('..addIssueToVolume: ' + newIssueMongoId);
        return volumes.update({volume : volume}, {$addToSet : {'issues' : newIssueMongoId}});
    },
    findIssueByVolIssue: function(vol, iss){
        return issues.findOne({'volume' : vol, 'issue': iss});
    },
    getAllArticlesByIssueId: function(issueId){
        var issueArticles = articles.find({'issue_id' : issueId},{sort : {page_start:1}}).fetch();
        issueArticles = Meteor.organize.groupArticles(issueArticles);
        return issueArticles;
    },
    getDisplayArticlesByIssueId: function(issueId){
        var issueArticles = articles.find({'issue_id' : issueId, display: true},{sort : {page_start:1}}).fetch();
        issueArticles = Meteor.organize.groupArticles(issueArticles);
        return issueArticles;
    },
    getIssueAndFiles: function(volume, issue, admin){
        // console.log('...getIssueAndFiles v = ' + volume + ', i = ' + issue);
        var fut = new future();
        var journal,
            assetUrl,
            issueData;
        var articlesToGet = 'getDisplayArticlesByIssueId';

        if(admin){
            articlesToGet = 'getAllArticlesByIssueId';
        }
        journal = journalConfig.findOne({}).journal.short_name;
        assetUrl =  journalConfig.findOne().assets;
        issueData = issues.findOne({'issue_linkable': issue, 'volume': parseInt(volume)});

        if(issueData){
            if(issueData.cover){
                issueData.coverPath = Meteor.issue.coverPath(assetUrl,issueData.cover);
            }

            issueData.vi = Meteor.issue.createIssueParam( issueData.volume, issueData.issue );

            Meteor.call(articlesToGet,issueData._id, function(error,issueArticles){
                if(error){
                    console.error(error);
                    fut.throw(error);
                }else if(issueArticles){
                    for(var i=0 ; i< issueArticles.length ; i++){
                        if(issueArticles[i].files){
                            issueArticles[i].files = Meteor.article.linkFiles(issueArticles[i].files,issueArticles[i]._id);
                        }
                    }
                    issueData.articles = issueArticles;

                    Meteor.call('getPrevAndNextIssue', volume, issue, admin, function(error, result){
                        if(error){
                            console.error(error);
                            fut.throw(error);
                        }else if(result){
                            if(result.prev){
                                result.prev.vi = 'v' + result.prev.volume + 'i' + result.prev.issue;
                                issueData.prevIssue = result.prev;
                            }
                            if(result.next){
                                result.next.vi = 'v' + result.next.volume + 'i' + result.next.issue;
                                issueData.nextIssue = result.next;
                            }
                            fut.return(issueData);
                        }
                    });
                }
            });

        }else{
            fut.return();
        }

        return fut.wait();
    },
    getPrevAndNextIssue: function(volume,issue,admin){
        var result = {},
            pieces,
            volumeData,
            issueData,
            issueIndex,
            prevIssueId,
            prevIssueData,
            nextIssueId,
            nextIssueData,
            prevVolume,
            prevVolumeData,
            nextVolume,
            nextVolumeData;

        if(volume && issue){
            volumeData = volumes.findOne({volume : parseInt(volume)});
            issueData = issues.findOne({volume : parseInt(volume), issue: issue});
        }

        if(volumeData && issueData){
            issueIndex = volumeData.issues.indexOf(issueData._id);

            prevIssueId = volumeData.issues[parseInt(issueIndex - 1)];
            nextIssueId = volumeData.issues[parseInt(issueIndex + 1)];

            if(!prevIssueId){
                // check previous volume
                prevVolume = parseInt(volume) - 1;
                prevVolumeData = volumes.findOne({volume : prevVolume });
                if(prevVolumeData && prevVolumeData.issues && prevVolumeData.issues.length > 0){
                    prevIssueId = prevVolumeData.issues[prevVolumeData.issues.length - 1]
                }
            }

            if(!nextIssueId){
                // check next volume
                nextVolume = parseInt(volume) + 1;
                nextVolumeData = volumes.findOne({volume : nextVolume});
                if(nextVolumeData && nextVolumeData.issues && nextVolumeData.issues.length > 0){
                    nextIssueId = nextVolumeData.issues[0]
                }
            }
        }

        // make sure issues should be displayed and get issue data
        if(prevIssueId){
            prevIssueData = issues.findOne({_id : prevIssueId});
            if(!admin && prevIssueData && prevIssueData.display === true){
                result.prev = prevIssueData;
            }else if(prevIssueData){
                result.prev = prevIssueData;
            }
        }
        if(nextIssueId){
            nextIssueData = issues.findOne({_id : nextIssueId});
            if(!admin && nextIssueData && nextIssueData.display === true){
                result.next = nextIssueData;
            }else if(nextIssueData){
                result.next = nextIssueData;
            }
        }

        return result;
    },
    getAllIssues: function(){
        return issues.find().fetch();
    },
    getAllVolumes: function(){
        return volumes.find().fetch();
    },
    checkIssueInputs: function(issueData){
        // will check for all required fields in form
        // will return all invalid inputs
        var invalid = [];
        var clear = '<div class="clearfix"></div>';

        // Volume
        if(!issueData.volume){
            invalid.push({
                'fieldset_id' : 'volume-and-issue',
                'message' : clear + 'Volume is required'
            });
        }

        // Issue
        if(!issueData.volume){
            invalid.push({
                'fieldset_id' : 'volume-and-issue',
                'message' : clear + 'Issue is required'
            });
        }

        // Date
        if(!issueData.pub_date){
            invalid.push({
                'fieldset_id' : 'issue-date',
                'message' : clear + 'Date is required'
            });
        }

        // Current/Display
        if(issueData.current && !issueData.display){
            invalid.push({
                'fieldset_id' : 'issue-display-setting',
                'message' : clear + 'Current issue must be set to display'
            });
        }

        // console.log('invalid',invalid);
        return invalid;
    },
    renameCover: function(issueMongoId, originalFileName){
        // console.log('renameCover',issueMongoId, originalFileName);
        var fut = new future();
        var originalFilePieces = originalFileName.split('.');
        var fileType = originalFilePieces[parseInt(originalFilePieces.length - 1)];
        var newFileName = issueMongoId + '.' + fileType;
        var source = 'covers/' + originalFileName;
        var dest = 'covers/' + newFileName;

        S3.knox.copyFile(source, dest, function(err, res){
            if(err){
                console.error('renameArticleAsset',err);
                fut.throw(err);
            }else if(res){
                fut.return(newFileName);
            }
        });
        return fut.wait();
    },
    afterUploadCover: function(issueMongoId, originalFileName){
        // console.log('afterUploadCover',issueMongoId, originalFileName);
        var fut = new future();
        // will rename the figure to issuemongoid and update the database with filenmae
        Meteor.call('renameCover', issueMongoId, originalFileName, function(error,newFileName){
            if(error){
                error.userMessage = 'Cover not uploaded. Please try again.';
                console.error('renameCover',error);
                fut.throw(error);// though it was actually uploaded, it was not renamed to standard convention. So this file cannot be used.
            }else if(newFileName){

                Meteor.call('updateIssue', issueMongoId, {cover : newFileName}, function(error,result){
                    if(error){
                        error.userMessage = 'Cover ' + newFileName + ' uploaded, but could not update the database. Contact IT and request DB update.' ;
                        fut.throw(error);
                        console.error('updateIssue after cover',error);
                    }else if(result){
                        fut.return('Cover uploaded and database updated: ' + newFileName);
                    }
                });
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err.userMessage);
        }
    },
    validateIssue: function(issueMongoId, issueData){
        // console.log('validateIssue',issueMongoId, issueData);
        var fut = new future();
        var invalid = [];
        var result = {};
        // will check all required inputs are valid and check for duplicate issues by volume/issue
        // will either return doc of duplicate issue, invalid array, or boolean if issue was updated

        Meteor.call('checkIssueInputs', issueData, function(error,issueInvalid){
            if(error){
                fut.throw(error);
            }
            else if(issueInvalid && issueInvalid.length > 0){
                result.invalid = true;
                result.invalid_list = issueInvalid;
                fut.return(result);
            }
            else{
                Meteor.call('findIssueByVolIssue', issueData.volume, issueData.issue, function(error, issueExists){
                    if(error){
                        fut.throw(error);
                    }
                    else if(issueExists && issueExists._id != issueMongoId){
                        result = issueExists;
                        result.duplicate = true;
                        fut.return(issueExists);
                    }
                    else{
                        // no duplicates and all valid. Now update/insert
                        Meteor.call('updateIssue', issueMongoId, issueData, function(error, issueSaved){
                            if(error){
                                fut.throw(error);
                            }
                            else if(issueSaved){
                                // hide or display issue articles based on issueData.display
                                Meteor.call('updateArticleBy',{issue_id : issueMongoId}, {display : issueData.display}, function(error, articlesUpdated){
                                    if(error){
                                        fut.throw(error);
                                    }
                                    else if(articlesUpdated){
                                        result.issue_id = issueMongoId;
                                        result.saved = true;
                                        fut.return(result);
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        return fut.wait();
    },
    deleteIssueDatabase: function(issueMongoId){
        var fut = new future();

        issueDoc = issues.findOne({_id : issueMongoId});
        issueDoc.date_delete = new Date();
        var copied = issuesDeleted.insert(issueDoc);
        var deleted = issues.remove({_id : issueMongoId});
        if(copied && deleted){
            fut.return(true);
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(errorMessage);
        }
    },
    deleteIssue: function(issueMongoId, userInput){
        var fut = new future();
        var errorMessage;
        var issueDoc;

        if(userInput === 'DELETE'){
            Meteor.call('deleteIssueDatabase', issueMongoId, function(error,result){
                if(error){
                    fut.throw(error);
                    console.error('deleteIssueDatabase',error);
                }else if(result){
                    Meteor.call('removeArticlesFromIssue', issueMongoId, function(error,articlesUpdated){
                        if(error){
                            fut.throw(error);
                            console.error('removeArticlesFromIssue',error);
                        }else if(articlesUpdated){
                            fut.return(articlesUpdated);
                        }
                    });
                }
            });
        }else{
            // user did not input correcty
            errorMessage = 'Type DELETE in all caps to confirm issue deletion';
            fut.throw(errorMessage);
        }

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(errorMessage);
        }
    },
    updateIssuePages: function(issueId){
        var fut = new future();
        var issuePages,
            issueData;
        Meteor.call('getDisplayArticlesByIssueId', issueId, function(error, result){
            if(error){
                console.error('getDisplayArticlesByIssueId', error);
            }
            else if(result){
                issuePages = Meteor.issue.pages(result);
                if(issuePages){
                    Meteor.call('updateIssue', issueId, {pages : issuePages}, function(error, result){
                        if(error){
                            console.error('updateIssue', error);
                        }
                        else if(result){
                            fut.return(issuePages);
                        }
                    });
                }
            }
        });
        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(error);
        }
    }
});
