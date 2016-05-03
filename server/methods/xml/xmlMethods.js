// Shared methods for all DTD types
// -------------
Meteor.methods({
    getXml: function(url){
        // console.log('getXml',url);
        var fut = new future();
        Meteor.http.get(url,function(getXmlError, xmlRes){
            if(getXmlError){
                console.error('getXmlError',getXmlError);
                fut.throw(getXmlError);
            }else if(xmlRes){
                xml = xmlRes.content;
                fut.return(xml);
                // console.log('xml',xml);
            }
        });
        return fut.wait();
    },
    xmlDtd: function(xmlString){
        // console.log('xmlDtd',xmlString);
        // TODO: use regex for dtd
        var aopSearchPattern = '<!DOCTYPE ArticleSet PUBLIC "-\/\/NLM\/\/DTD PubMed 2.0\/\/EN" "http:\/\/www.ncbi.nlm.nih.gov:80\/entrez\/query\/static\/PubMed.dtd">';
        var pmcSearchPattern = '<!DOCTYPE pmc-articleset PUBLIC "-\/\/NLM\/\/DTD ARTICLE SET 2.0\/\/EN" "http:\/\/dtd.nlm.nih.gov\/ncbi\/pmc\/articleset\/nlm-articleset-2.0.dtd">'
        var aopRes = xmlString.search(aopSearchPattern);
        var pmcRes = xmlString.search(pmcSearchPattern);
        if(aopRes != -1){
            return 'AOP';
        }else if(pmcRes != -1){
            return 'PMC';
        }else{
            return false;
        }
    },
    processXmlString: function(xml){
        // console.log('..processXmlString');
        var fut = new future();
        Meteor.call('xmlDtd',xml, function(error,dtd){
            if(error){
                console.error('DTD',error);
            }else if(dtd && dtd === 'PMC'){
                Meteor.call('processPmcXml',xml, function(error,result){
                    if(error){
                        console.error('processPmcXml',error);
                    }else if(result){
                        // console.log('processXmlString',result.dates);
                        fut.return(result);
                    }
                });
            }else if(dtd && dtd === 'AOP'){
                Meteor.call('processAopXml',xml, function(error,result){
                    if(error){
                        console.error('processAopXml',error);
                    }else if(result){
                        // console.log('processXmlString',result.dates);
                        fut.return(result);
                    }
                });
            }else{
                fut.throw('Could not process XML.');
            }
        });

        return fut.wait();
    },
    parseXmltoJson: function(xml){
        // console.log('..parseXmltoJson');
        var fut = new future();
        parseString(xml, function (error, articleJson) {
            if(error){
                console.error('ERROR');
                console.error(error);
                return 'ERROR';
            }else{
                fut.return(articleJson);
            }
        });
        return fut.wait();
    }
});

// Methods to compare XML with DB
// -------------
var ignoreConflicts = ['_id','doc_updates','issue_id','batch', 'files', 'display','mongo_id','advance','feature','publisher'];
var ignoreConflictsViaXml = ['files','publisher','issue_id']; // want this separate because we actually want to include them from the XML, but do not want to compare with DB values

Meteor.methods({
    compareProcessedXmlWithDb: function(xmlArticle, dbArticle){

        dbArticle = Meteor.generalClean.pruneEmpty(dbArticle);
        xmlArticle = Meteor.generalClean.pruneEmpty(xmlArticle);

        var result = {};
        result.conflicts = [];

        for(var keyXml in xmlArticle){
            result[keyXml] = xmlArticle[keyXml];
        }

        // Database
        for(var keyDb in dbArticle){
            if(!result[keyDb]){
                result[keyDb] = dbArticle[keyDb]; // XML did not have key, add to result from DB.
            }

            if(ignoreConflicts.indexOf(keyDb) == -1){
                Meteor.xmlDbConflicts.compare(keyDb, xmlArticle[keyDb], dbArticle[keyDb], function(compareRes){
                    if(compareRes && compareRes.conflicts && compareRes.conflicts.length>0){
                        compareRes.conflicts.forEach(function(conflict){
                            result.conflicts.push(conflict);
                        });
                    }
                    if(compareRes && compareRes.merged){
                        result[keyDb] = compareRes.merged;
                    }
                });
            }
        }

        // XML
        for(var keyXml in xmlArticle){
            if(!dbArticle[keyXml] && ignoreConflictsViaXml.indexOf(keyXml) == -1 ){
                Meteor.xmlDbConflicts.compare(keyXml, xmlArticle[keyXml], null, function(compareRes){
                    if(compareRes && compareRes.conflicts && compareRes.conflicts.length>0){
                        compareRes.conflicts.forEach(function(conflict){
                            result.conflicts.push(conflict);
                        });
                    }
                });
                result[keyXml] = xmlArticle[keyXml];
            }
        }

        return result;
    }
});

// Shared functions for all DTD types
Meteor.xmlParse = {
    traverseJson: function(data){
        // console.log('data',data);
        // for when node value has style, but we do not want the style
        var string = '';
        for(var k in data){
            if(typeof data[k] == 'string'){
                string += data[k];
            }
        }
        return string;
    }
}

Meteor.xmlDbConflicts = {
    compare: function(key,xmlValue,dbValue,cb){
        // console.log('   compare');
        // console.log('? ' + key + ' : ' + xmlValue + ' =? ' + dbValue);

        var result = {};
        result.conflicts = [];
        result.merged;

        var mergedArray = []; // only used for items that are arrays

        // Just DB
        // ---------
        if(!Meteor.xmlDbConflicts.valueExists(xmlValue)){
            result.conflicts.push(Meteor.xmlDbConflicts.conflict(key, 'Missing in XML', null, Meteor.xmlDbConflicts.prettyValue(key,dbValue)));
        }

        // Just XML
        // ---------
        if(!Meteor.xmlDbConflicts.valueExists(dbValue)){
            result.conflicts.push(Meteor.xmlDbConflicts.conflict(key, 'Missing in Database', Meteor.xmlDbConflicts.prettyValue(key,xmlValue), null));
        }

        // Both DB and XML
        // ---------
        if(xmlValue && dbValue){
            if(typeof xmlValue == 'string' || typeof xmlValue == 'boolean' || typeof xmlValue == 'number' || typeof xmlValue.getMonth === 'function'){
                if(xmlValue != dbValue){
                    result.conflicts.push(Meteor.xmlDbConflicts.conflict(key, 'XML != Database', xmlValue, dbValue));
                }
            }else if(typeof xmlValue == 'object' && !Array.isArray(xmlValue)){
                Meteor.xmlDbConflicts.compareObject(key, xmlValue, dbValue, function(objCompared){
                    if(objCompared && objCompared.conflicts && objCompared.conflicts.length >0){
                        objCompared.conflicts.forEach(function(conflict){
                            result.conflicts.push(conflict);
                        });
                    }
                    if(objCompared && objCompared.merged){
                        result.merged = objCompared.merged;
                    }
                });
            }else if(typeof xmlValue == 'object' && Array.isArray(xmlValue)){
                // order matters for authors and keywords in array. so we can use the index of one array to directly compare the other.
                for(var arrIdx=0 ; arrIdx<xmlValue.length ; arrIdx++){
                    if(typeof xmlValue[arrIdx] == 'object'){
                        Meteor.xmlDbConflicts.compareObject(key, xmlValue[arrIdx], dbValue[arrIdx], function(objCompared){
                            if(objCompared && objCompared.conflicts && objCompared.conflicts.length >0){
                                objCompared.conflicts.forEach(function(conflict){
                                    conflict.conflict = conflict.conflict + ' (#' + parseInt(arrIdx + 1) + ')';
                                    result.conflicts.push(conflict);
                                });
                            }
                            if(objCompared && objCompared.merged){
                                mergedArray.push(objCompared.merged);
                            }
                        });
                    }else{
                        Meteor.xmlDbConflicts.compare(key, xmlValue[arrIdx], dbValue[arrIdx], function(objCompared){
                            if(objCompared && objCompared.conflicts && objCompared.conflicts.length>0){
                                objCompared.conflicts.forEach(function(conflict){
                                    conflict.conflict = conflict.conflict + ' (#' + parseInt(arrIdx + 1) + ')';
                                    result.conflicts.push(conflict);
                                });
                            }
                        });
                    }
                }

                if(mergedArray.length > 0){
                    result.merged = mergedArray;
                }

            }else{
                console.log('ELSE',key);
            }
        }
        cb(result);
    },
    compareObject: function(parentKey,xmlObj,dbObj,cb){
        var result = {};
        result.conflicts = [];
        result.merged = {};// using merged for form data. For ex, for when XML does not have PII but DB does (IDs are an object).

        var xmlKeyCount = Object.keys(xmlObj).length;
        var dbKeyCount = Object.keys(dbObj).length;

        // Number of items comparison
        if(xmlKeyCount != dbKeyCount && parentKey != 'authors'){
            // do not count author keys because there are additional items stored in the database and names just need to be compared with XML
            result.conflicts.push(Meteor.xmlDbConflicts.conflict(parentKey, 'XML has ' + xmlKeyCount + ' items. Database has ' + dbKeyCount + ' items.',null,null));
        }

        // Database
        for(var key in dbObj){

            if(parentKey === 'authors' && key === 'ids'){
            }else{
                var dbVal = null;
                var xmlVal = null;

                dbVal = dbObj[key];

                if(xmlObj[key]){
                    xmlVal = xmlObj[key];
                    result.merged[key] = xmlVal; // default is always XML
                }else{
                    result.merged[key] = dbVal; // although the number of keys matches, the DB has a key that the XML does not.
                }

                // Date handling
                if(parentKey === 'dates' || parentKey === 'history'){
                    if(xmlVal){
                        xmlVal = Meteor.dates.article(xmlVal);
                    }
                    dbVal = Meteor.dates.article(dbVal);
                }

                Meteor.xmlDbConflicts.compare(key, xmlVal, dbVal, function(objCompared){
                    if(objCompared && objCompared.conflicts && objCompared.conflicts.length>0){
                        objCompared.conflicts.forEach(function(conflict){
                            result.conflicts.push(conflict);
                        });
                    }
                });
            }
        }

        // XML
        // if merged does not have XML key, then the DB is missing the key.
        for(var key in xmlObj){
            if(!result.merged[key]){
                Meteor.xmlDbConflicts.compare(key, xmlObj[key], null, function(objCompared){
                    if(objCompared && objCompared.conflicts && objCompared.conflicts.length>0){
                        objCompared.conflicts.forEach(function(conflict){
                            result.conflicts.push(conflict);
                        });
                    }
                });
                result.merged[key] = xmlObj[key];
            }
        }


        // Paper Type
        // Check if in database
        // AOP XML will only have the name. PMC XML will have short name and name.
        if(parentKey === 'article_type' && xmlObj.name){
            var articleTypeFound = articleTypes.findOne({'name' : xmlObj.name});
            if(!articleTypeFound){
                result.conflicts.push(Meteor.xmlDbConflicts.conflict(parentKey, 'Not found in available types. Contact IT to add new type. Form defaulting to database value.',xmlObj.name,null));
                result.merged[parentKey] = dbObj;
            }
        }

        cb(result);
    },
    conflict: function(key,conflict,xml,db){
        if(key === 'affiliations_numbers'){
            key = 'author affiliations';
        }else if(key === 'name_first'){
            key = 'author first name';
        }else if(key === 'name_middle'){
            key = 'author middle name';
        }else if(key === 'name_last'){
            key = 'author last name';
        }

        return {
            what: key,
            conflict: conflict,
            xml: xml,
            db: db
        }
    },
    prettyValue: function(key,value){
        var result = '';

        // DB stores affiliation numbers 0 based, but to humans they are 1 based.
        if(key === 'affiliations_numbers' && value === parseInt(value)){
            value = parseInt(value + 1);
        }

        if(typeof value === 'object'&& !Array.isArray(value)){
            for(var key in value){
                var v = value[key];
                if(typeof v.getMonth === 'function'){
                    v =  Meteor.dates.article(v);
                }
                result += '<div class="clearfix"></div><label>' + key + '</label> ' +  v;
            }
        }else if(typeof value === 'object' && Array.isArray(value)){
            for(var i=0 ; i < value.length ; i++){
               result +=  '<div class="clearfix"></div>' + Meteor.xmlDbConflicts.prettyValue(key,value[i]);
            }
        }else{
            result = value;
        }
        return result;
    },
    valueExists: function(value){
        if(!value && value != 0){
            return false;
        }
        return true;
    }
}