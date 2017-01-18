Meteor.methods({
    archive: function(articleIssueId){
        //combine vol and issue collections
        var journalData,
            journal,
            assetUrl,
            issuesList,
            volumesList;
        var issuesObj = {};

        journalData = journalConfig.findOne({});
        journal = journalData.journal.short_name;
        assetUrl =  journalData.assets;
        issuesList = issues.find({display:true},{}).fetch();
        volumesList = volumes.find({},{sort : {volume:-1}}).fetch();

        if (journalData.s3 && journalData.s3.domain && journalData.s3.bucket + journalData.s3.folders && journalData.s3.folders.issues && journalData.s3.folders.issues.covers_optimized) {
            optimizedUrlPath = journalData.s3.domain + journalData.s3.bucket  + '/' + journalData.s3.folders.issues.covers_optimized + '/';
        } else {
            console.error('S3 optimized path not in the database.');
        }

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


                        if (issuesObj[issueMongoId].optimized && issuesObj[issueMongoId].optimized_file && issuesObj[issueMongoId].optimized_sizes){
                            issuesObj[issueMongoId].optimized_urls = {};
                            for (var size in issuesObj[issueMongoId].optimized_sizes) {
                                issuesObj[issueMongoId].optimized_urls[size] = optimizedUrlPath + size + '/' + issuesObj[issueMongoId].optimized_file ;
                            }
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
        var fut = new future();
        var issueArticles = articles.find({'issue_id' : issueId, display: true},{sort : {page_start:1}}).fetch();
        issueArticles = Meteor.organize.groupArticles(issueArticles);

        fut.return(issueArticles);

        try {
            return fut.wait();
        }
        catch(error) {
            throw new Meteor.Error(error);
        }
    },
    getCurrentIssueCover: function(){
        var fut = new future();
        var journalData,
            journal,
            assetUrl,
            issueData;
        var optimizedUrlPath = '';
        journalData = journalConfig.findOne({});
        journal = journalData.journal.short_name;
        assetUrl =  journalData.assets;
        issueData = issues.findOne({'current': true});

        if (journalData.s3 && journalData.s3.domain && journalData.s3.bucket + journalData.s3.folders && journalData.s3.folders.issues && journalData.s3.folders.issues.covers_optimized) {
            optimizedUrlPath = journalData.s3.domain + journalData.s3.bucket  + '/' + journalData.s3.folders.issues.covers_optimized + '/';
        } else {
            console.error('S3 optimized path not in the database.');
        }

        if (issueData) {
            if(issueData.cover){
                issueData.coverPath = Meteor.issue.coverPath(assetUrl,issueData.cover);
            }

            if (issueData.optimized && issueData.optimized_file && issueData.optimized_sizes){
                issueData.optimized_urls = {};
                for (var size in issueData.optimized_sizes) {
                    issueData.optimized_urls[size] = optimizedUrlPath + size + '/' + issueData.optimized_file;
                }
            }

            fut.return(issueData);

        } else {
            fut.return();
        }


        try {
            return fut.wait();
        }
        catch(error) {
            throw new Meteor.Error(error);
        }
    },
    getIssueAndFiles: function(volume, issue, admin){
        // console.log('...getIssueAndFiles v = ' + volume + ', i = ' + issue);
        // To Do: move to shared repo
        var fut = new future();
        var journalData,
            journal,
            assetUrl,
            issueData;
        var optimizedUrlPath = '';
        var articlesToGet = 'getDisplayArticlesByIssueId';

        if(admin){
            articlesToGet = 'getAllArticlesByIssueId';
        }
        journalData = journalConfig.findOne({});
        journal = journalData.journal.short_name;
        assetUrl =  journalData.assets;
        issueData = issues.findOne({'issue_linkable': issue, 'volume': parseInt(volume)});

        if (journalData.s3 && journalData.s3.domain && journalData.s3.bucket + journalData.s3.folders && journalData.s3.folders.issues && journalData.s3.folders.issues.covers_optimized) {
            optimizedUrlPath = journalData.s3.domain + journalData.s3.bucket  + '/' + journalData.s3.folders.issues.covers_optimized + '/';
        } else {
            console.error('S3 optimized path not in the database.');
        }

        if(issueData){
            if(issueData.cover){
                issueData.coverPath = Meteor.issue.coverPath(assetUrl,issueData.cover);
            }

            if (issueData.optimized && issueData.optimized_file && issueData.optimized_sizes){
                issueData.optimized_urls = {};
                for (var size in issueData.optimized_sizes) {
                    issueData.optimized_urls[size] = optimizedUrlPath + size + '/' + issueData.optimized_file;
                }
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
                    prevIssueId = prevVolumeData.issues[prevVolumeData.issues.length - 1];
                }
            }

            if(!nextIssueId){
                // check next volume
                nextVolume = parseInt(volume) + 1;
                nextVolumeData = volumes.findOne({volume : nextVolume});
                if(nextVolumeData && nextVolumeData.issues && nextVolumeData.issues.length > 0){
                    nextIssueId = nextVolumeData.issues[0];
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
        var journalData,
            journal,
            assetUrl;
        var optimizedUrlPath = '';
        journalData = journalConfig.findOne({});
        journal = journalData.journal.short_name;
        assetUrl =  journalData.assets;

        issue = issues.findOne({'issue_linkable': issue, 'volume': parseInt(volume)});

        if (journalData.s3 && journalData.s3.domain && journalData.s3.bucket + journalData.s3.folders && journalData.s3.folders.issues && journalData.s3.folders.issues.covers_optimized) {
            optimizedUrlPath = journalData.s3.domain + journalData.s3.bucket  + '/' + journalData.s3.folders.issues.covers_optimized + '/';
        } else {
            console.error('S3 optimized path not in the database.');
        }

        if(issue && issue.cover){
            issue.coverPath = Meteor.issue.coverPath(assetUrl,issue.cover);
            if(issue.volume == 8) {
                issue.largeCover = true;
            }

            if (issue.optimized && issue.optimized_file && issue.optimized_sizes){
                issue.optimized_urls = {};
                for (var size in issue.optimized_sizes) {
                    issue.optimized_urls[size] = optimizedUrlPath + size + '/' + issue.optimized_file ;
                }
            }
        }

        return issue;
    }
});
