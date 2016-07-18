Meteor.articleFiles = {
    verifyXml: function(articleMongoId,files){
        // this will process the XML information for the form and XML upload verification
        // console.log('..verifyXml',articleMongoId,files);
        var s3Folder = 'xml';
        var reader = new FileReader();
        var file,
            xmlString;
        var journalInfo,
            assetBaseUrl,
            assetUrl,
            xmlFileName;

        if(!files || files.length === 0) {
            // only for when reprocessing XML already on S3
            journalInfo = journalConfig.findOne();
            if(journalInfo)
            assetBaseUrl = journalInfo.assets + 'xml/';
            xmlFile = articles.findOne({_id : articleMongoId}).files.xml.file;
            if(assetBaseUrl && xmlFile){
                assetUrl = assetBaseUrl + xmlFile;
                Meteor.call('getXml',assetUrl, function(xmlError,xmlString){
                    if(xmlError){
                        console.error('xmlError',xmlError);
                    }
                    else if(xmlString){
                        Meteor.call('processXmlString',xmlString, function(error,result){
                            if(error){
                                console.error('process XML for DB', error);
                                Meteor.formActions.errorMessage('Could not process XML for verification');
                            }
                            else if(result){
                                Meteor.formActions.closeModal();

                                Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                                    if(error){
                                        console.error('ERROR - preProcessArticle',error);
                                    }
                                    else if(result){
                                        Session.set('xml-verify',true);
                                        result._id = articleMongoId;
                                        Session.set('article-form',result);
                                        Meteor.formActions.closeModal();
                                    }
                                });
                            }
                        });
                    }
                });
            }
        }
        else {
            file = files[0];
            reader.onload = function(e) {
                xmlString = e.target.result;

                Meteor.call('processXmlString',xmlString, function(error,result){
                    if(error){
                        console.error('process XML for DB', error);
                        Meteor.formActions.errorMessage('Could not process XML for verification');
                    }
                    else if(result){
                        Meteor.formActions.closeModal();

                        Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                            if(error){
                                console.error('ERROR - preProcessArticle',error);
                            }
                            else if(result){
                                Session.set('xml-verify',true);
                                result._id = articleMongoId;
                                Session.set('article-form',result);
                                Meteor.formActions.closeModal();
                            }
                        });
                    }
                });
            };
            reader.readAsText(file);
        }
    },
    verifyNewXml: function(files){
        var s3Folder = 'xml';
        var file = files[0];
        var reader = new FileReader();
        var xmlString;

        reader.onload = function(e) {
            xmlString = e.target.result;

            Meteor.call('processXmlString',xmlString, function(error,processedXml){
                if(error){
                    console.error('process XML for DB', error);
                    Meteor.formActions.errorMessage('Could not process XML for verification');
                }
                else if(processedXml){
                    // check for duplicates
                    Meteor.call('articleExistenceCheck',null,processedXml,function(duplicateFound){
                        if(duplicateFound){
                            console.error('articleExistenceCheck',duplicateFound);
                            Meteor.formActions.errorMessage('Article Already Exists. Please upload XML via the article page.<br><a href="/admin/article/' + duplicateFound.details._id + '">' + duplicateFound.details.title + '</a>');
                        }
                        else{
                            Meteor.formActions.closeModal();
                            Session.set('new-article',processedXml);
                        }
                    });
                }
            });
        };
        reader.readAsText(file);
    },
    uploadArticleFile: function(articleMongoId, s3Folder,files){
        // console.log('uploadArticleFile',files);
        // after XML has been verified by user, upload to s3
        // event action comes from the article form, after saving information to the db the XML is uploaded to S3
        if(files && files[0] && files[0].name)
        // var file = files[0];
        var fileNameId = files[0].name.replace('.xml','').replace('.pdf','');
        var messageForXml = '';
        Meteor.s3.upload(files, s3Folder,function(error,res){
            if(error){
                console.error('Upload File Error', error);
                Meteor.formActions.errorMessage('File not uploaded');
            }
            else if(res){
                Meteor.call('renameArticleFile', articleMongoId, s3Folder, res.file.name, function(error,newFileName){
                    if(error){
                        console.error('renameArticleFile',error);
                    }
                    else if(newFileName){
                        var updateAssetObj = {};
                        updateAssetObj['files.' + s3Folder + '.file'] = newFileName;
                        Meteor.call('updateArticle',articleMongoId,updateAssetObj, function(error,result){
                            if(error){
                                console.error('updateArticle',error);
                            }
                            else if(result){
                                // clear files
                                S3.collection.remove({});

                                Meteor.formActions.successMessage(result + ' uploaded. Saved as ' + newFileName + messageForXml);

                                Session.set('xml-verify',null);
                                Session.set('article-form',null);

                                // the user probably does not need to be notified about below functions
                                // delete uploaded file, if not equal to MongoID
                                if(articleMongoId != fileNameId){
                                    S3.delete(s3Folder + '/' + res.file.name,function(error,result){
                                        if(error){
                                            console.error('Could not delete original file: ' + res.file.name);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    },
    figuresById: function(figures){
        var figsById = {};

        figures.forEach(function(fig){
            figsById[fig.id] = fig;
        });

        return figsById;
    },
    filesById: function(files){
        var filesById = {};

        if(files)

        files.forEach(function(file){
            filesById[file.id.toLowerCase()] = file;
        });

        return filesById;
    },
    verifyUploadedFilename: function(assetId, uploadedFilename, assetType, cb){
        // console.log('verifyUploadedFilename', assetId, uploadedFilename, assetType);
        // Verify that filename does not already exist, because we will delete uploaded image and rename.
        // if the uploaded image has the same name as another image, then we will be accidently deleting an image
        var assets = Session.get('article').files[assetType];
        var verified = true;
        // Filename check
        assets.forEach(function(asset){
            if(asset.file && asset.file === uploadedFilename && asset.id != assetId){
                verified = false;
            }
        });
        cb(verified);
    },
    maintainFilenameViaId: function(filesXml,filesDb,cb){
        // console.log('maintainFilenameViaId');
        // for maintaining the filename of the file
        // TODO filesDb is wrong
        var result = [];
        var filesDbById = Meteor.articleFiles.filesById(filesDb);
        if(filesXml) {
            filesXml.forEach(function(file){
                var joined = file;
                var fileId = file.id.toLowerCase();
                if(filesDbById[fileId] && filesDbById[fileId].file){
                    joined.file = filesDbById[fileId].file;
                }
                result.push(joined);
            });
        }
        cb(result);
    },
    deleteAsset:  function(filename, folder){
        S3.delete(folder + '/' + filename, function(error,result){
            if(error){
                console.error('Could not delete original file: ' + filename);
            }
        });
    },
    editAsset: function(assetId, assetType, editing){
        // used to set editing, or to cancel editing
        var article,
            assets;

        article = Session.get('article');
        assets = article.files[assetType];

        assets.forEach(function(asset){
            if(asset.id == assetId){
                asset.editing = editing;
            }
        });

        article.files[assetType] = assets;

        Session.set('article',article);
    }
};

// these handle the actual uploading to S3
Meteor.upload = {
    articleAsset: function(articleMongoId, files, uploadedFilename, assetId, assetType){
        // console.log('articleAsset', articleMongoId, files, uploadedFilename, assetId, assetType);
        // Figures and supplemental, todo: tables
        var s3Folder,
            filenamePieces,
            fileNameLastPiecePieces,
            filenameLastPieceWithoutType;

        if(Session.get('journal')){
            s3Folder = Session.get('journal').s3.folders.article[assetType];
        }

        Meteor.s3.upload(files, s3Folder, function(error,result){
            if(error){
                Meteor.formActions.errorMessage('File not upload.');
            }
            else if(result){
                // filenamePieces = for testing if we need to rename the uploaded image, if standard naming convention then do not delete
                filenamePieces = uploadedFilename.split('_');
                filenameLastPiecePieces = filenamePieces[filenamePieces.length - 1].split('.'); // to remove .jpg etc
                filenameLastPieceWithoutType = filenameLastPiecePieces[0].toLowerCase();

                Meteor.call('afterUploadArticleAsset', articleMongoId, uploadedFilename, assetId, assetType, function(error,result){
                    // if result, then the file got renamed to the standard naming convention and the DB got updated with this name
                    // now delete original poorly named file, which needs to happen on client, happens below via deletAsset()
                    if(error){
                        Meteor.formActions.errorMessage(error.error);
                    }
                    else if(result){

                        S3.collection.remove({});

                        Meteor.articleFiles.editAsset(assetId, assetType); // hide uploader

                        Meteor.formActions.successMessage('File uploaded!');

                        // Delete uploaded file
                        // if filename uploaded does not match naming convention, delete it
                        assetId = assetId.toLowerCase(); // filename convention is lowercase for ID part
                        if(uploadedFilename != result.renamedFile && articleMongoId != filenamePieces[0] || assetId != filenameLastPieceWithoutType ){
                            Meteor.articleFiles.deleteAsset(uploadedFilename, s3Folder);
                        }
                    }
                });
            }
        });
    }
};

Meteor.processXml = {
    cleanAbstract: function(abstract){
        if(abstract){
            // abstract = abstract.replace(/<\/p>/g,'');
            // abstract = abstract.replace(/<p>/g,'');
            abstract = abstract.replace(/<sec>/g,'');
            abstract = abstract.replace(/<\/sec>/g,'');
            abstract = abstract.replace(/<title>/g,'<p><b>');
            abstract = abstract.replace(/<\/title>/g,'<\/b></p>');
            abstract = abstract.replace(/^[ ]+|[ ]+$/g,'');
            abstract = Meteor.clean.cleanString(abstract);
        }
        return abstract;
    }
};
