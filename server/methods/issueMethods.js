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
        issuesList = issues.find({display:true},{}).fetch();
        volumesList = volumes.find({},{sort : {volume:-1}}).fetch();

        for(var i=0; i<issuesList.length; i++){
            issuesObj[issuesList[i]._id] = issuesList[i];
        }

        for(var v=0; v < volumesList.length; v++){
            volumesList[v].issues_data = [];
            var volumeIssues = volumesList[v].issues;
            if(volumeIssues !== undefined) {
                for(var vi=0; vi < volumeIssues.length; vi++){
                    var issueMongoId = volumeIssues[vi];
                    if(issuesObj[issueMongoId]){
                        // add cover path to issue
                        if(issuesObj[issueMongoId].cover){
                            // console.log(issueMongoId);
                            issuesObj[issueMongoId].coverPath = Meteor.issue.coverPath(assetUrl,issuesObj[issueMongoId].cover);
                        }

                        volumesList[v].issues_data.push(issuesObj[issueMongoId]);
                    }
                }
            }
        }
        // console.log('volumesList',volumesList);
        return volumesList;
    },
    getDisplayArticlesByIssueId: function(issueId){
        var issueArticles = articles.find({'issue_id' : issueId, display: true},{sort : {page_start:1}}).fetch();
        issueArticles = Meteor.organize.groupArticles(issueArticles);
        return issueArticles;
    },
    getIssueAndFiles: function(volume, issue, admin){
        // console.log('...getIssueAndFiles v = ' + volume + ', i = ' + issue);
        // To Do: move to shared repo
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
            }
            else if(prevIssueData && prevIssueData.display === true){
                result.prev = prevIssueData;
            }
        }
        if(nextIssueId){
            nextIssueData = issues.findOne({_id : nextIssueId});
            if(!admin && nextIssueData && nextIssueData.display === true){
                result.next = nextIssueData;
            }
            else if(nextIssueData && nextIssueData.display === true){
                result.next = nextIssueData;
            }
        }

        return result;
    },
    getIssueMeta: function(volume, issue){
        var issue,
            journal,
            assetUrl;

        journal = journalConfig.findOne({}).journal.short_name;
        assetUrl =  journalConfig.findOne().assets;

        issue = issues.findOne({'issue_linkable': issue, 'volume': parseInt(volume)});
        if(issue && issue.cover){
            issue.coverPath = Meteor.issue.coverPath(assetUrl,issue.cover);
            if(issue.volume == 8) {
                issue.largeCover = true;
            }
        }
        
        return issue;
    }
});
