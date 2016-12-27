Meteor.methods({
    verifyImagesOptimized: function(mongoId, folder, figId){
        // For paper figures and covers.
        // AWS Lambda converts files to png and also resizes. Here we verify this happened.
        // only papers will have figId. Covers will not have figId.
        var journal = journalConfig.findOne({}).s3;
        var verifiedFolders = [];
        var optimizedFolders = journal.folders.optimized_sizes;
        var optmizedFiletype = journal.optimized_filetype;
        var convertedFile, filesPieces;
        var dbData, imageFile;


        if (folder === 'paper_figures') {
            dbData = articles.findOne(mongoId);
            if (dbData && dbData.files && dbData.files.figures) {
                dbData.files.figures.forEach(function(fig){
                    if(fig.id && fig.id == figId){
                        imageFile = fig.file;
                    }
                });
            }
        } else if (folder === 'covers') {
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

                    if (folder === 'paper_figures') {
                        filePath = journal.folders.article.figures_optimized + '/';
                    } else if (folder === 'covers') {
                        filePath = journal.folders.issues.covers_optimized + '/';
                    }

                    async.each(optimizedFolders, function (folder, cb) {
                        var optimizedPath = filePath + folder + '/' + convertedFile;
                        Meteor.call('getS3Object', optimizedPath, function(getErr, getRes){
                            if (getErr) {
                                console.error(getErr);
                                cb('Failed to verify ', optimizedPath);
                                // TODO: Email that size failed to verify
                            } else if (getRes) {
                                cb();
                                verifiedFolders.push(folder);
                            }
                        });
                    }, function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            if (folder === 'paper_figures') {
                                Meteor.call('updateDbArticleOptimized', mongoId, figId, verifiedFolders, convertedFile, function(dbErr, dbRes){
                                    if (dbErr) {
                                        // TODO: Email failed to update db but images exist
                                    }
                                });
                            } else if (folder === 'covers') {
                                Meteor.call('updateDbCoverOptimized', mongoId, verifiedFolders, convertedFile, function(dbErr, dbRes){
                                    if (dbErr) {
                                        // TODO: Email failed to update db but images exist
                                    }
                                });
                            }
                        }
                    });
                }, 3000);
            }
        }
    },
    getS3Object: function(objectPath) {
        var fut = new future();
        var bucket = journalConfig.findOne({}).s3.bucket;
        var s3Object = {Bucket: bucket, Key: objectPath };

        S3.aws.getObject(s3Object, function(getErr, getRes) {
            if (getErr) {
                fut.throw(getErr);
            } else if (getRes) {
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
