Meteor.methods({
    fullTextXmlReal: function(url){
        var fut = new future();
        var xml;
        var figures = []; // just pass empty array, we are just wanting to check if the xml is real
        Meteor.http.get(url , function(error,result){
            if(error){
                // console.error('Asset Check Error: ',error);
                fut['return'](false);
            }else if(result){
                // console.log(url + ' Exists');
                xml = result.content;
                // console.log(typeof xml);
                // console.log('result',result);
                Meteor.call('fullTextToJson',xml, figures, function(convertXmlError, convertedXml){
                    if(convertXmlError){
                        console.error('convertXmlError',convertXmlError);
                        fut['throw'](convertXmlError);
                    }else if(convertedXml){
                        // console.log('convertedXml',convertedXml);
                        fut['return'](convertedXml);
                    }else{
                        fut['return'](false);// todo: handle when there is no xml
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
                fut['return'](false);
            }else if(result){
                // console.log(url + ' Exists');
                xml = result.content;
                if(xml.search(searchFor)!=-1){
                    console.log(searchFor,xml.search(searchFor));
                    fut['return'](true);
                }else{
                    fut['return'](false);
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
                fut['return'](false);
            }else if(result){
                if(result.headers['content-length'] == '15739'){
                    fut['return'](false);
                    // these are not real PDFs, they failed to upload, so do not add these filenames to the article doc
                }else{
                    fut['return'](true);
                }
            }
        });
        return fut.wait();
    },
    renameArticleAsset: function(articleMongoId, folder, originalFileName){
        // console.log('renameArticleAsset',articleMongoId);
        var fut = new future();
        var newFileName = articleMongoId + '.' + folder;
        var source = folder + '/' + originalFileName;
        var dest = folder + '/' + newFileName;
        S3.knox.copyFile(source, dest, function(err, res){
            if(err){
                console.error('renameArticleAsset',err);
                // fut['throw'](err);
            }else if(res){
                fut.return(newFileName);
            }
        });
        return fut.wait();
    },
    renameArticleFigure: function(articleMongoId, originalFileName, figureId){
        // console.log('renameArticleFigure',originalFileName, figureId, articleMongoId)
        var fut = new future();
        var originalFilePieces = originalFileName.split('.');
        var fileType = originalFilePieces[parseInt(originalFilePieces.length - 1)];
        // todo fig. 1b handing, letter in id
        var newFileName = articleMongoId + '_' + figureId + '.' + fileType;
        var source = 'paper_figures/' + originalFileName;
        var dest = 'paper_figures/' + newFileName;

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
    updateArticleDbFigures: function(articleMongoId, articleFigures){
        var fut = new future();
        Meteor.call('updateArticle', articleMongoId, {'files.figures' : articleFigures}, function(error,result){
            if(error){
                fut.throw(error);
            }else if(result){
                fut.return(result);
            }
        });
        return fut.wait();
    },
    updateArticleDbSupps: function(articleMongoId, suppMaterials){
        var fut = new future();
        Meteor.call('updateArticle', articleMongoId, {'files.supplementary' : suppMaterials}, function(error,result){
            if(error){
                fut.throw(error);
            }else if(result){
                fut.return(result);
            }
        });
        return fut.wait();
    },
    afterUploadArticleFig: function(articleMongoId, originalFileName, originalFigId, newFigId){
        // console.log('..afterUploadArticleFig',articleMongoId, originalFileName, originalFigId, newFigId);
        var fut = new future();
        var fileNamePieces = originalFileName.slice('_');
        // var figFound = false; // used to determine if new figure, or updating existing
        // Article was already uploaded to S3. This needs to happen on the client.
        // Now rename the figure if not in standard format (articlemongoid_figid)

        Meteor.call('renameArticleFigure', articleMongoId, originalFileName, newFigId, function(error,newFileName){
            if(error){
                error.userMessage = 'Figure not uploaded. Please try again.';
                console.error('renameArticleFigure',error);
                fut.throw(error);// though it was actually uploaded, it was not renamed to standard convention. So this file cannot be used.
            }else if(newFileName){

                fut.return(newFileName);

                // removed below. The only way the figures get updated in the DB is via uploading XML
                // var articleInfo = articles.findOne({_id : articleMongoId});
                // var articleFigures =articleInfo.files.figures;
                // If updating existing figure
                // articleFigures.forEach(function(fig){
                //     if(fig.id == originalFigId){
                //         fig.id = newFigId;
                //         fig.file = newFileName;
                //         figFound = true;
                //     }
                // });
                // If new figure
                // if(!figFound){
                //     articleFigures.push({
                //         id: newFigId,
                //         file: newFileName
                //     });
                // }
                // Meteor.call('updateArticleDbFigures', articleMongoId, articleFigures, function(error,result){
                //     if(error){
                //         error.userMessage = 'Figure ' + newFileName + ' uploaded, but could not update the database. Contact IT and request DB update.' ;
                //         fut.throw(error);
                //         console.error('updateArticleDbFigures',error);
                //     }else if(result){
                //         fut.return('Figure uploaded and database updated: ' + newFileName);
                //     }
                // });
            }
        });

        try {
            return fut.wait();
        }
        catch(err) {
            throw new Meteor.Error(err.userMessage);
        }
    },
    afterUploadXmlFilesCheck:function(articleMongoId, fileName){
        // console.log('..afterUploadXmlFilesCheck',articleMongoId, fileName);
        // not notifying user of these DB updates
        var journalInfo = journalConfig.findOne();
        var journalShortName = journalInfo.journal.short_name;
        var assetBaseUrl = journalInfo.assets + 'xml/';
        var assetUrl = assetBaseUrl + fileName;
        var articleInfo = articles.findOne({_id : articleMongoId});

        Meteor.call('getXml',assetUrl, function(error,xmlString){
            if(error){
                error.userMessage = 'Could not get XML to check for supps';
                fut.throw(error);
            }else if(xmlString){
                // SUPPLEMENTAL MATERIAL
                Meteor.xmlPmc.supplementaryMaterials(xmlString,function(supps){
                    if(supps){
                        if(articleInfo.files.supplementary){
                            // maintain filename, match via ID
                            Meteor.articleFiles.maintainFilenameViaId(supps, articleInfo.files.supplementary,function(suppRes){
                                if(suppRes){
                                    Meteor.call('updateArticleDbSupps',articleMongoId, suppRes, function(error,result){
                                        if(error){
                                            error.userMessage = 'Could not update article in the database with supplementary materials.';
                                            fut.throw(error);
                                        }else if(result){
                                            // fut.return(true);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
                // FIGURES
                Meteor.xmlPmc.figures(xmlString,function(figures){
                    if(supps){
                        if(articleInfo.files.figures){
                            // maintain filename, match via ID
                            Meteor.articleFiles.maintainFilenameViaId(figures, articleInfo.files.figures,function(figRes){
                                if(figRes){
                                    Meteor.call('updateArticleDbFigures',articleMongoId, figRes, function(error,result){
                                        if(error){
                                            error.userMessage = 'Could not update article in the database with figures.';
                                            fut.throw(error);
                                        }else if(result){
                                            // fut.return(true);
                                        }
                                    });
                                }
                            });
                        }

                    }
                });
            }
        });
    }
});