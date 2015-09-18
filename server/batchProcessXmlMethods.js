var saved = [];
var failed = [];
var failedSavedDB = [];
Meteor.methods({
	getXMLFromPMC: function(){
		console.log('-getXMLFromPMC');
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi/?db=pmc&report=xml&id=';
		var pmidL = pmidAgingList.length;
		for(var i = 0; i < pmidL ; i++){
			//first get the pmc id, we cannot use the pmid to get the full xml
			console.log('.. '+pmidAgingList[i]);
			Meteor.call('getPmcIdFromPmid',pmidAgingList[i],function(err,pmcId){
				if(err){
					console.log('ERROR ' + err.message);
				}else{
					// console.log(res);
					if(pmcId){
						var req = requestURL + pmcId;
						// console.log(req);
						var res = Meteor.http.get(req);
						var filePath = process.env.PWD + '/uploads/pmc_xml/' + pmidAgingList[i] + '.xml';
						fs.writeFile(filePath, res.content, function (err) {
							if (err) return console.log(err);
							// console.log('--saved '+filePath);
						});						
					}else{
						console.log('--failed '+pmidAgingList[i]);
						failed.push(pmidAgingList[i]);
					}

				}
			});
			if(i == parseInt(pmidL - 1)){
				console.log(failed);
				return 'done saving xml';
			}
		}		
	},
	saveXMLFromPMC: function(){
		console.log('-saveXMLFromPMC');
		var pmidL = pmidAgingList.length;
		for(var i = 0; i < pmidL ; i++){
			var fileName = pmidAgingList[i] + '.xml';
			console.log('.. ' + i + ' / ' + fileName);
			Meteor.call('processXML',fileName,function(error,result){
                if(error){
                    console.log('ERROR:');
                    console.log(error);
                }else{
                    console.log('PROCESSED:');
					result['doc_updates'] = {};
					result['doc_updates']['created_date'] = new Date(); 
					result['doc_updates']['created_by'] = Meteor.userId();

					var articleIssue = issues.findOne({'volume' : result['volume'], 'issue': result['issue']}); 
	                if(articleIssue){
	                    result['issue_id'] = result['_id'];
	                }

                    Meteor.call('addArticle', result,function(e,r){
		                if(e){
		                	failedSavedDB.push(fileName);
		                    console.log(e);
		                }else{
		                	saved.push(fileName);
		                    return r;
		                }
            		});
				}
			});
			if(i == parseInt(pmidL - 1)){
				console.log(failedSavedDB);
				// console.log(saved);
			}
		}	
	}
})