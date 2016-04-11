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
                    var volumeIssuesId = volumeIssues[vi];
                    // add cover path to issue
                    if(articleIssueId && volumeIssuesId == articleIssueId){
                        // For providing all available issues on the article form
                        issuesObj[volumeIssuesId].selected = true;
                    }
                    if(issuesObj[volumeIssuesId] && issuesObj[volumeIssuesId].cover){
                        issuesObj[volumeIssuesId].coverPath = Meteor.issue.coverPath(assetUrl,issuesObj[volumeIssuesId].cover);
                    }
                    if(issuesObj[volumeIssuesId]){
                        volumesList[v].issues_data.push(issuesObj[volumeIssuesId]);
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
        vol.issues_data = [];
        var issueIds = vol.issues;
        for(var i=0 ; i<issueIds.length ; i++){
            var issue = issues.findOne({_id : issueIds[i]});
            vol.issues_data.push(issue);
        }
        return vol;
    },
    updateVolume: function(volumeId, updateObj){
        return volumes.update({_id :volumeId },updateObj);
    },
    addIssue: function(issueData){
        //check if volume exists, if not add
        var vol,
            iss,
            issueId;
        issueData['issue'] = issueData['issue'];
        issueData['volume'] = parseInt(issueData['volume']);
        if(!issueData.issue_linkable){
            issueData.issue_linkable = Meteor.issue.linkeableIssue(issueData.issue);
        }
        vol = volumes.findOne({'volume':issueData['volume']});
        //double check that issue does not exist
        iss = issues.findOne({'volume':issueData['volume'],'issue':issueData['issue']});

        if(!iss){
            issueId = issues.insert(issueData);
        }else{
            issueId = iss['_id'];
        }
        if(!vol){
            Meteor.call('addVolume',issueData['volume'],issueId, function(error,_id){
                if(error){
                    console.log('ERROR: ' + error.message);
                }
            });
        }else{
            // Add issue to issue array, append to end
            Meteor.call('addIssueToVolume',issueData['volume'],issueId, function(error,_id){
                if(error){
                    console.log('ERROR: ' + error.message);
                }
            });
        }
        return issueId;
    },
    updateIssue: function(mongoId, update){
        if(!mongoId){
            Meteor.call('addIssue',update,function(error,result){
                if(error){
                    console.error('addIssue',error);
                }else if(result){
                    return result;
                }
            })
        }else{
            return issues.update({'_id':mongoId},{$set:update});
        }
    },
    addVolume: function(volume,issue){
        var insertObj = {'volume':volume};
        if(issue){
            insertObj['issues'] = [issue];
        }
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
                    fut.return(issueData);
                }
            });

        }else{
            fut.return();
        }

        return fut.wait();
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
                fut['throw'](error);
            }else if(issueInvalid && issueInvalid.length > 0){
                result.invalid = true;
                result.invalid_list = issueInvalid;
                fut['return'](result);
            }else{
                Meteor.call('findIssueByVolIssue',issueData.volume, issueData.issue, function(error,issueExists){
                    if(error){
                        fut.throw(error);
                    }else if(issueExists && issueExists._id != issueMongoId){
                        result = issueExists;
                        result.duplicate = true;
                        fut.return(issueExists);
                    }else{
                        // no duplicates and all valid. Now update/insert
                        Meteor.call('updateIssue',issueMongoId, issueData, function(error,issueSaved){
                            if(error){
                                fut.throw(error);
                            }else if(issueSaved){
                                // hide or display issue articles based on issueData.display
                                Meteor.call('updateArticleBy',{issue_id : issueMongoId}, {display : issueData.display}, function(error, articlesUpdated){
                                    if(error){
                                        fut.throw(error);
                                    }else if(articlesUpdated){
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
    }
});
