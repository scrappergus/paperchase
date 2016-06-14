Meteor.articleFiles = {
    verifyXml: function(articleMongoId,files){
        // console.log('..verifyXml');
        var s3Folder = 'xml';
        var file = files[0];
        var reader = new FileReader;
        var xmlString;

        if(files.length == 0) {
            var journalInfo = journalConfig.findOne();
            var journalShortName = journalInfo.journal.short_name;
            var assetBaseUrl = journalInfo.assets + 'xml/';
            var assetUrl = assetBaseUrl + articleMongoId+".xml";

            Meteor.call('getXml',assetUrl, function(error,xmlString){
                Meteor.call('processXmlString',xmlString, function(error,result){
                        if(error){
                            console.error('process XML for DB', error);
                            Meteor.formActions.errorMessage('Could not process XML for verification');
                        }else if(result){
                            Meteor.formActions.closeModal();
                            // Meteor.general.scrollTo('xml-verify');

                            Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                                if(error){
                                    console.log('ERROR - preProcessArticle');
                                    console.log(error);
                                }
                                if(result){
                                    Session.set('xml-verify',true);
                                    result._id = articleMongoId;
                                    Session.set('article-form',result);
                                    Meteor.formActions.closeModal();
                                }
                            });
                        }
                    });
                });

        } else {
            reader.onload = function(e) {
                xmlString = e.target.result;

                Meteor.call('processXmlString',xmlString, function(error,result){
                    if(error){
                        console.error('process XML for DB', error);
                        Meteor.formActions.errorMessage('Could not process XML for verification');
                    }else if(result){
                        Meteor.formActions.closeModal();
                        // Meteor.general.scrollTo('xml-verify');

                        Meteor.call('preProcessArticle',articleMongoId,result,function(error,result){
                            if(error){
                                console.log('ERROR - preProcessArticle');
                                console.log(error);
                            }
                            if(result){
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
                    Meteor.call('articleExistenceCheck',null,processedXml,function(error,result){
                        if(result){
                            Meteor.formActions.errorMessage('Article Already Exists. Please upload XML via the article page.<br><a href="/admin/article/' + result._id + '">' + result.title + '</a>');
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
        // console.log('uploadArticleFile',articleMongoId,s3Folder);
        // after XML has been verified by user, upload to s3
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


                                // notify user
                                if(s3Folder === 'xml'){
                                    messageForXml = '<br><b>Save form to update the article record in the database.</b>';
                                }
                                Meteor.formActions.successMessage(result + ' uploaded. Saved as ' + newFileName + messageForXml);
                                // Session.set('xml-verify',null); // do not clear form, still want the form visible so that they can update the database.

                                // the user probably does not need to be notified about below functions
                                // delete uploaded file, if not equal to MongoID
                                if(articleMongoId != fileNameId){
                                    S3.delete(s3Folder + '/' + file.name,function(error,result){
                                        if(error){
                                            console.error('Could not delete original file: ' + file.name);
                                        }
                                    });
                                }
                                if(s3Folder === 'xml'){
                                    // check for figures and supplementary files after upload. This will not be in the article form because users cannot update this in the database, must match the XML
                                    Meteor.call('afterUploadXmlFilesCheck',articleMongoId , newFileName, function(error,result){
                                        if(error){
                                            console.error('xmlCheckFiguresAndSupps',error);
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
