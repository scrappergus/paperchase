Meteor.methods({
    verifyImagesOptimized: function(mongoId, s3Folder, userId, figId){
        // console.log('... ', mongoId, figId);
        // For paper figures and covers.
        // AWS Lambda converts files to png and also resizes. Here we verify this happened.
        // only papers will have figId. Covers will not have figId.
        var journal = journalConfig.findOne({}).s3;
        var verifiedFolders = [];
        var optimizedFolders = journal.folders.optimized_sizes;
        var optmizedFiletype = journal.optimized_filetype;
        var convertedFile, filesPieces;
        var dbData, imageFile;


        if (s3Folder === 'paper_figures') {
            dbData = articles.findOne(mongoId);
            if (dbData && dbData.files && dbData.files.figures) {
                dbData.files.figures.forEach(function(fig){
                    if(fig.id && fig.id == figId){
                        imageFile = fig.file;
                    }
                });
            }
        } else if (s3Folder === 'covers') {
            dbData = issues.findOne(mongoId);
            if (dbData && dbData.cover) {
                imageFile = dbData.cover;
            }
        }


        if (imageFile){
            filePieces = imageFile.split('.');

            if (filePieces && filePieces[0]){
                convertedFile = filePieces[0] + optmizedFiletype;

                Meteor.setTimeout(function(){
                    var filePath = 'optimized/'; // a default path, not in use.

                    if (s3Folder === 'paper_figures') {
                        filePath = journal.folders.article.figures_optimized + '/';
                    } else if (s3Folder === 'covers') {
                        filePath = journal.folders.issues.covers_optimized + '/';
                    }

                    async.each(optimizedFolders, function (folder, cb) {
                        var optimizedPath = filePath + folder + '/' + convertedFile;
                        Meteor.call('getS3Object', optimizedPath, userId, function(getErr, getRes){
                            if (getErr) {
                                console.error(getErr);
                                cb('Failed to verify ', optimizedPath);
                                var emailMessage = 'Failed to optimize image: ' + convertedFile + '\r\n' + 'Size: ' + folder + '\r\n' + 'Mongo ID: '  + mongoId;
                                Meteor.call('optimizationFailedEmail', emailMessage, userId);
                            } else if (getRes) {
                                // console.log(optimizedPath);
                                cb();
                                verifiedFolders.push(folder);
                            }
                        });
                    }, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (s3Folder === 'paper_figures') {
                                Meteor.call('updateDbArticleOptimized', mongoId, figId, verifiedFolders, convertedFile, userId);
                            } else if (s3Folder === 'covers') {
                                Meteor.call('updateDbCoverOptimized', mongoId, verifiedFolders, convertedFile, userId);
                            }
                        }
                    });
                }, 180000);
            }
        }
    },
    optimizationFailedEmail: function(emailMessage, userId){
        // console.log('optimizationFailedEmail', emailMessage);
        var fromEmail = Meteor.settings.it && Meteor.settings.it.email ? Meteor.settings.it.email : '';
        var toEmails = '';

        if (Meteor.settings.it && Meteor.settings.it.email){
            toEmails += Meteor.settings.it.email;
        }

        var userData = Meteor.users.findOne({'_id':userId});

        if (userData && userData.emails && userData.emails[0] && userData.emails[0].address) {
            if (Roles.userIsInRole(userData, ['super-admin'])) {
                toEmails = userData.emails[0].address;
            } else {
                toEmails += ', ' + userData.emails[0].address;
            }
        }

        // Email.send({
        //    to: toEmails,
        //    from: fromEmail,
        //    subject: 'Paperchase Image Optimization Failed',
        //    text: emailMessage
        // });
    },
    getS3Object: function(objectPath, userId) {
        // console.log('..',objectPath);
        var fut = new future();
        var bucket = journalConfig.findOne({}).s3.bucket;
        var s3Object = {Bucket: bucket, Key: objectPath };
        var emailMessage = '';

        S3.aws.headObject(s3Object, function(getErr, getRes) {
            if (getErr) {
                console.error('failed to get', objectPath);
                fut.throw(getErr);
            } else if (getRes) {
                if (getRes.ContentLength == '0'){
                    console.error('0 Bytes');
                    console.error(s3Object.Key);
                    emailMessage = 'There was a problem with: ' + s3Object.Key + '. This was saved as 0 Bytes.';
                    Meteor.call('optimizationFailedEmail', emailMessage, userId, function(error, result){
                        if (error) {
                            console.error(error);
                        }
                    });
                }
                fut.return(true);
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err);
        }
    }
});
