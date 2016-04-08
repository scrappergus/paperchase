Meteor.methods({
    archive: function(articleIssueId){
        //combine vol and issue collections
        var issuesList = issues.find({},{}).fetch();
        var volumesList = volumes.find({},{sort : {volume:-1}}).fetch();
        var issuesObj = {};
        for(var i=0 ; i<issuesList.length ; i++){
            issuesObj[issuesList[i]['_id']] = issuesList[i];
        }

        for(var v=0 ; v < volumesList.length ; v++){
            volumesList[v]['issues_data'] = [];
            var volumeIssues = volumesList[v]['issues'];
            if(volumeIssues !== undefined) {
                for(var vi=0 ; vi < volumeIssues.length ; vi++){
                    var volumeIssuesId = volumeIssues[vi];
                    // add cover path to issue
                    if(articleIssueId && volumeIssuesId == articleIssueId){
                        // For providing all available issues on the article form
                        issuesObj[volumeIssuesId]['selected'] = true;
                    }
                    if(issuesObj[volumeIssuesId]){
                        issuesObj[volumeIssuesId]['cover'] = Meteor.issue.coverPath(issuesObj[volumeIssuesId]['volume'],issuesObj[volumeIssuesId]['issue']);
                        volumesList[v]['issues_data'].push(issuesObj[volumeIssuesId]);
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
    getIssueAndFiles: function(volume, issue){
        // console.log('...getIssueAndFiles v = ' + volume + ', i = ' + issue);
        var fut = new future();
        var journal = journalConfig.findOne({}).journal.short_name;
        var issueData = issues.findOne({'issue_linkable': issue, 'volume': parseInt(volume)});

        if(issueData){
            issueData.cover = Meteor.issue.coverPath(volume,issue);

            var issueArticles = Meteor.organize.getIssueArticlesByID(issueData['_id']);
            for(var i=0 ; i< issueArticles.length ; i++){
                if(issueArticles[i].files){
                    issueArticles[i].files = Meteor.article.linkFiles(issueArticles[i].files,issueArticles[i]._id);
                }
            }
            issueData.articles = issueArticles;
            fut['return'](issueData);
        }else{
            fut['return']();
        }

        return fut.wait();
    },
    getAllIssues: function(){
        return issues.find().fetch();
    },
    getAllVolumes: function(){
        return volumes.find().fetch();
    },
});
