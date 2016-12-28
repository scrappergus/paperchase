Meteor.methods({
    fullTextXmlReal: function(url){
        var fut = new future();
        var xml;
        var figures = []; // just pass empty array, we are just wanting to check if the xml is real
        Meteor.http.get(url , function(error,result){
            if(error){
                // console.error('Asset Check Error: ',error);
                fut.return(false);
            }else if(result){
                // console.log(url + ' Exists');
                xml = result.content;
                // console.log(typeof xml);
                // console.log('result',result);
                Meteor.call('fullTextToJson',xml, figures, function(convertXmlError, convertedXml){
                    if(convertXmlError){
                        console.error('convertXmlError',convertXmlError);
                        fut.throw(convertXmlError);
                    }else if(convertedXml){
                        // console.log('convertedXml',convertedXml);
                        fut.return(convertedXml);
                    }else{
                        fut.return(false);// todo: handle when there is no xml
                    }

                });
            }
        });
        return fut.wait();
    },
    articlesWith: function(url,searchFor){
        // console.log('url',url);
        // console.log('searchFor',searchFor);
        var fut = new future();
        var xml;
        var figures = []; // just pass empty array, we are just wanting to check if the xml is real
        Meteor.http.get(url , function(error,result){
            if(error){
                // console.error('Asset Check Error: ',error);
                fut.return(false);
            }else if(result){
                // console.log(url + ' Exists');
                xml = result.content;
                if(xml.search(searchFor)!=-1){
                    // console.log(searchFor,xml.search(searchFor));
                    fut.return(true);
                }else{
                    fut.return(false);
                }
            }
        });
        return fut.wait();
    },
    assetExistsOnS3: function(url){
        var fut = new future();
        Meteor.http.get(url , function(error,result){
            if(error){
                // console.error('Asset Check Error: ',error);
                fut.return(false);
            }else if(result){
                if(result.headers['content-length'] == '15739'){
                    fut.return(false);
                    // these are not real PDFs, they failed to upload, so do not add these filenames to the article doc
                }else{
                    fut.return(true);
                }
            }
        });
        return fut.wait();
    },
    renameArticleFile: function(articleMongoId, folder, originalFileName){
        // PDF or XML
        // console.log('renameArticleFile',articleMongoId);
        var fut = new future();
        var newFileName = articleMongoId + '.' + folder;
        var source = folder + '/' + originalFileName;
        var dest = folder + '/' + newFileName;
        S3.knox.copyFile(source, dest, function(err, res){
            if(err){
                console.error('renameArticleAsset',err);
                // fut.throw(err);
            }else if(res){
                fut.return(newFileName);
            }
        });
        return fut.wait();
    },
    renameArticleAsset: function(articleMongoId, originalFileName, assetId, assetType){
        // console.log('renameArticleAsset', articleMongoId, originalFileName, assetId, assetType);
        // Now rename the asset if the name was not in standard format (articlemongoid_assetId)
        var fut = new future();
        var journal,
            assets,
            articleDbAssets,
            assetIdLowercase,
            originalFilePieces,
            fileType,
            newFileName,
            s3Folder,
            source,
            dest;

        journal = journalConfig.findOne();

        if(journal){
            s3Folder = journal.s3.folders.article[assetType];

            assetIdLowercase = assetId.toLowerCase();

            articleInfo = articles.findOne({_id : articleMongoId});
            articleDbAssets = articleInfo.files[assetType];

            originalFilePieces = originalFileName.split('.');
            fileType = originalFilePieces[parseInt(originalFilePieces.length - 1)];

            newFileName = articleMongoId + '_' + assetIdLowercase + '.' + fileType;
            source = s3Folder + '/' + originalFileName;
            dest = s3Folder + '/' + newFileName;

            S3.knox.copyFile(source, dest, function(err, res){
                if(err){
                    console.error('renameArticleAsset',err);
                    fut.throw(err);
                }
                else if(res){
                    // asset was renamed on S3
                    // now create Asset list with new info
                    articleDbAssets.forEach(function(asset){
                        if(asset.id && asset.id == assetId){
                            asset.file = newFileName;

                            if (asset.version) {
                                asset.version++;
                            } else {
                                asset.version = 1;
                            }
                        }
                    });
                    fut.return(articleDbAssets);
                }
            });
            return fut.wait();
        }
    },
    allArticlesFilesAudit: function(){
        var result = {};
        var allArticles = articles.find({},{_id : 1, files : 1}).fetch();
        var articlesWithoutPmc = articles.find({'ids.pmc' : {$exists:false}},{_id : 1}).fetch();
        var articlesWithoutPmid = articles.find({'ids.pmid' : {$exists:false}},{_id : 1}).fetch();
        var pdfList = articles.find({'files.pdf' : {$exists:true}},{_id : 1}).fetch();
        var xmlList = articles.find({'files.xml' : {$exists:true}},{_id : 1}).fetch();
        result.articles = allArticles.length;
        result.articles_without_pmc = articlesWithoutPmc.length;
        result.articles_without_pmid = articlesWithoutPmid.length;
        result.pdf = pdfList.length;
        result.xml = xmlList.length;
        return result;
    },
    updateArticleDbAssets: function(articleMongoId, assets, assetType){
        // console.log('..updateArticleDbAssets', articleMongoId, assets, assetType);
        var fut = new future();
        var filesToUpdateObj = {};
        var filesToUpdate = 'files.' + assetType;
        filesToUpdateObj[filesToUpdate] = assets;
        Meteor.call('updateArticle', articleMongoId, filesToUpdateObj, function(error, result){
            if(error){
                fut.throw(error);
            }
            else if(result){
                fut.return(result);
            }
        });
        return fut.wait();
    },
    updateArticleDbSupps: function(articleMongoId, suppMaterials){
        var fut = new future();
        Meteor.call('updateArticle', articleMongoId, {'files.supplemental' : suppMaterials}, function(error,result){
            if(error){
                fut.throw(error);
            }else if(result){
                fut.return(result);
            }
        });
        return fut.wait();
    },
    afterUploadArticleAsset: function(articleMongoId, originalFileName, assetId, assetType, userId){
        // console.log('..afterUploadArticleAsset', articleMongoId, originalFileName, assetId);
        // Article was already uploaded to S3. This needs to happen on the client.
        // Rename the uploaded file and update the database
        // Verify AWS Lambda optimized after upload
        var fut = new future();
        var fileNamePieces,
            articleInfo,
            assets;

        articleInfo = articles.findOne({_id : articleMongoId});
        assets = articleInfo.files[assetType];

        fileNamePieces = originalFileName.slice('_');
        Meteor.call('renameArticleAsset', articleMongoId, originalFileName, assetId, assetType, function(error, renamedResult){
            if(error){
                error.userMessage = 'File not uploaded. Please try again.';
                console.error('renameArticleAsset',error);
                fut.throw(error);// though it was actually uploaded, it was not renamed to standard convention. So this file cannot be used.
            } else if(renamedResult){
                Meteor.call('updateArticleDbAssets', articleMongoId, renamedResult, assetType, function(error, dbUpdateResult){
                    if(error){
                        error.userMessage = 'Asset uploaded, but could not update the database. Contact IT and request DB update.' ;
                        fut.throw(error);
                        console.error('updateArticleDbAssets',error);
                    } else if(dbUpdateResult){

                        if ( assetType === 'figures' ) {
                            Meteor.call('verifyImagesOptimized', articleMongoId, 'paper_figures', userId, assetId ); // no callback because user will get emailed if there was an error
                        }

                        fut.return(renamedResult);
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
    updateDbArticleOptimized: function(mongoId, figId, verifiedFolders, convertedFile, userId){
        // console.log('updateDbArticleOptimized', mongoId, figId, verifiedFolders, convertedFile, userId);
        var article = articles.findOne({_id : mongoId});
        var figures = [];
        var emailMessage = '';

        if (article && article.files && article.files && article.files.figures && verifiedFolders && verifiedFolders.length > 0){

            article.files.figures.forEach(function(fig){
                if(fig.id && fig.id == figId){
                    fig.optimized = true;
                    fig.optimized_file = convertedFile;
                    fig.optimized_sizes = {};
                    verifiedFolders.forEach(function(size){
                        fig.optimized_sizes[size] = true;
                    });
                }
                figures.push(fig);
            });
            Meteor.call('updateArticleDbAssets', mongoId, figures, 'figures', function(error, dbUpdateResult){
                if(error){
                    console.error('updateArticleDbAssets',error);
                    emailMessage = 'Image was optimized on S3 but failed to update database for article. Mongo ID. Mongo ID: '  + mongoId;
                    Meteor.call('optimizationFailedEmail', emailMessage, userId);
                }
            });
        } else {
            emailMessage = 'No optimized images on S3 so cannot update database for article. Mongo ID:'  + mongoId;
            Meteor.call('optimizationFailedEmail', emailMessage, userId);
        }
    }
});
