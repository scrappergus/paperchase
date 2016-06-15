Meteor.articleFiles = {
    verifyXml: function(articleMongoId,files){
        // this will process the XML information for the form and XML upload verification
        // console.log('..verifyXml',articleMongoId,files);
        var s3Folder = 'xml';
        var reader = new FileReader;
        var file,
            xmlString;
        var journalInfo,
            assetBaseUrl,
            assetUrl,
            xmlFileName;

        if(!files || files.length == 0) {
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
                    }else if(xmlString){
                        Meteor.call('processXmlString',xmlString, function(error,result){
                            if(error){
                                console.error('process XML for DB', error);
                                Meteor.formActions.errorMessage('Could not process XML for verification');
                            }else if(result){
                                Meteor.formActions.closeModal();

                                Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                                    if(error){
                                        console.error('ERROR - preProcessArticle',error);
                                    } else if(result){
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
        } else {
            file = files[0];
            reader.onload = function(e) {
                xmlString = e.target.result;

                Meteor.call('processXmlString',xmlString, function(error,result){
                    if(error){
                        console.error('process XML for DB', error);
                        Meteor.formActions.errorMessage('Could not process XML for verification');
                    }else if(result){
                        Meteor.formActions.closeModal();

                        Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                            if(error){
                                console.error('ERROR - preProcessArticle',error);
                            }else if(result){
                                Session.set('xml-verify',true);
                                result._id = articleMongoId;
                                Session.set('article-form',result);
                                Meteor.formActions.closeModal();
                            }
                        });
                    }
                });
            }
            reader.readAsText(file);
        }
    },
    verifyNewXml: function(files){
        var s3Folder = 'xml';
        var file = files[0];
        var reader = new FileReader;
        var xmlString;

        reader.onload = function(e) {
            xmlString = e.target.result;

            Meteor.call('processXmlString',xmlString, function(error,processedXml){
                if(error){
                    console.error('process XML for DB', error);
                    Meteor.formActions.errorMessage('Could not process XML for verification');
                }else if(processedXml){
                    // check for duplicates
                    Meteor.call('articleExistenceCheck',null,processedXml,function(duplicateFound){
                        if(duplicateFound){
                            console.error('articleExistenceCheck',duplicateFound);
                            Meteor.formActions.errorMessage('Article Already Exists. Please upload XML via the article page.<br><a href="/admin/article/' + duplicateFound.details._id + '">' + duplicateFound.details.title + '</a>');
                        }else{
                            Meteor.formActions.closeModal();
                            Session.set('new-article',processedXml);
                        }
                    });
                }
            });
        }
        reader.readAsText(file);
    },
    uploadArticleFile: function(articleMongoId,s3Folder,files){
        // console.log('uploadArticleFile',files);
        // after XML has been verified by user, upload to s3
        // event action comes from the article form, after saving information to the db the XML is uploaded to S3
        if(files && files[0] && files[0].name)
        var file = files[0];
        var fileNameId = file.name.replace('.xml','').replace('.pdf','');
        var messageForXml = '';
        Meteor.s3.upload(files,s3Folder,function(error,res){
            if(error){
                console.error('Upload File Error', error);
                Meteor.formActions.errorMessage('File not uploaded');
            }else if(res){
                Meteor.call('renameArticleAsset', articleMongoId, s3Folder, res.file.name, function(error,newFileName){
                    if(error){
                        console.error('renameArticleAsset',error);
                    }else if(newFileName){
                        var updateAssetObj = {}
                        updateAssetObj['files.' + s3Folder + '.file'] = newFileName;
                        Meteor.call('updateArticle',articleMongoId,updateAssetObj, function(error,result){
                            if(error){
                                console.error('updateArticle',error);
                            }else if(result){
                                // clear files
                                S3.collection.remove({});

                                Meteor.formActions.successMessage(result + ' uploaded. Saved as ' + newFileName + messageForXml);

                                Session.set('xml-verify',null);
                                Session.set('article-form',null);

                                // the user probably does not need to be notified about below functions
                                // delete uploaded file, if not equal to MongoID
                                if(articleMongoId != fileNameId){
                                    S3.delete(s3Folder + '/' + file.name,function(error,result){
                                        if(error){
                                            console.error('Could not delete original file: ' + file.name);
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
    verifyFigure: function(originalFigId, newFigId){
        // if new figure, originalFigId = new
        var figures = Session.get('article').files.figures;
        var figsById = Meteor.articleFiles.figuresById(figures);
        if(originalFigId != newFigId && figsById[newFigId]){
            return false; // figure ID already exists for another figure
        }else{
            return true;
        }
    },
    maintainFilenameViaId: function(filesXml,filesDb,cb){
        // console.log('maintainFilenameViaId');
        // for maintaining the filename of the file
        // TODO filesDb is wrong
        var result = [];
        var filesDbById = Meteor.articleFiles.filesById(filesDb);
        filesXml.forEach(function(file){
            var joined = file;
            var fileId = file.id.toLowerCase();
            if(filesDbById[fileId] && filesDbById[fileId].file){
                joined.file = filesDbById[fileId].file;
            }
            result.push(joined);
        });
        cb(result);
    }
}

Meteor.processXml = {
    cleanAbstract: function(abstract){
        if(abstract){
            abstract = abstract.replace(/<\/p>/g,'');
            abstract = abstract.replace(/<p>/g,'');
            abstract = abstract.replace(/^[ ]+|[ ]+$/g,'');
            abstract = Meteor.clean.cleanString(abstract);
        }
        return abstract;
    }
}
