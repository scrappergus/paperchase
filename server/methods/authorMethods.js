Meteor.methods({
    findAuthorByName: function(nameF, nameL){
        return authors.findOne({'name_first' : nameF, 'name_last' : nameL});
    },
    addAuthor: function(authorData){
        return authors.insert(authorData);
    },
    addAffiliationToAuthor: function(mongoId,affiliation){
        return authors.update({'_id' : mongoId, 'affiliations.affiliation' : {$ne: affiliation}}, {$push: {'affiliations':{affiliation: affiliation}}});
    },
    articleAuthorsCheck: function(authorsList,affiliationsList){
        // check if author doc exists in authors collection, if not then insert and include author mongo id in article doc.
        if(authorsList){
            return authorsList.map(function(authorUpdateObj){

                var authorResults,
                    authorDoc,
                    authorAffiliations;

                if(!authorUpdateObj.ids || Object.keys(authorUpdateObj.ids).length === 0){

                    authorUpdateObj.ids = {};

                    var authorQuery = {};
                    if(authorUpdateObj.name_first){
                        authorQuery.name_last = authorUpdateObj.name_first;
                    }
                    if(authorUpdateObj.name_last){
                        authorQuery.name_last = authorUpdateObj.name_last;
                    }

                    authorResults = authors.find(authorQuery).fetch();

                    if(authorResults && authorResults.length === 1){
                        authorDoc = authorResults[0];

                        authorUpdateObj.ids.mongo_id = authorDoc._id;

                        if(authorDoc.ids){
                            for(var idType in authorDoc.ids){
                                authorUpdateObj.ids[idType] = authorDoc.ids[idType];
                            }
                        }

                    }else{
                        // unable to match author because multiple records found.
                    }
                }else if(authorUpdateObj.ids && authorUpdateObj.ids.mongo_id){
                    authorDoc = authors.findOne({_id : authorUpdateObj.ids.mongo_id});
                }

                if(authorDoc){
                    // able to match article to existing record. add affiliation to author
                    if(authorUpdateObj.affiliations_numbers){
                        authorAffiliations = Meteor.adminArticle.authorAffiliationIndexToWords(authorUpdateObj.affiliations_numbers,affiliationsList);
                        authorAffiliations.forEach(function(affiliation){
                            Meteor.call('addAffiliationToAuthor',authorDoc._id , affiliation);
                        });
                    }

                }else if(authorResults && authorResults.length > 0){
                    // multiple author docs matched query
                }else{
                    // author not found in DB, so insert
                    var authorInsertObj = Meteor.admin.clone(authorUpdateObj);

                    if(authorInsertObj.affiliations_numbers){
                        authorAffiliations = Meteor.adminArticle.authorAffiliationIndexToWords(authorInsertObj.affiliations_numbers,affiliationsList);
                    }

                    if(authorAffiliations){
                        authorInsertObj.affiliations = authorAffiliations.map(function(aff){
                            return {
                                affiliation: aff
                            }
                        });
                    }

                    delete authorInsertObj.affiliations_numbers;

                    Meteor.call('addAuthor',authorInsertObj, function(error,result){
                        if(result){
                            authorUpdateObj.ids = {};
                            authorUpdateObj.ids.mongo_id = result;
                        }
                    });
                }

                return authorUpdateObj;
            });
        }else{
            console.log('articleAuthorsCheck, return none.',authorsList,affiliationsList);
            return [];
        }
    }
});