//these were used to batch process and save XML from pmc
var piiFail = [];
pubStatusTranslate = {
	1: {
		'abbrev': 'received',
		'message' : 'Manuscript received for review'
	},
	2: {
		'abbrev' : 'accepted',
		'message' : 'Accepted for publication'
	},
	3:{
		'abbrev' : 'epublish',
		'message' : 'Published electronically'
	},
	4:{
		'abbrev' : 'ppublish',
		'message' : 'Published in print'
	},
	5:{
		'abbrev' : 'revised',
		'message' : 'Article revised by publisher/author'
	},
	6:{
		'abbrev' : 'pmc',
		'message' : 'Article first appeared in PubMed Central'
	},
	7:{
		'abbrev' : 'pmcr',
		'message' : 'Article revision in PubMed Central'
	},
	8:{
		'abbrev' : 'pubmed',
		'message' : 'Article citation first appeared in PubMed'
	},
	9:{
		'abbrev' : 'pubmedr',
		'message' : 'Article citation revision in PubMed'
	},
	10:{
		'abbrev' : 'aheadofprint',
		'message' : 'epublish, but will be followed by print'
	},
	11:{
		'abbrev' : 'premedline',
		'message' : 'Date into PreMedline status'
	},
	12:{
		'abbrev' : 'medline',
		'message' : 'Date made a MEDLINE record'
	},
	255:{
		'abbrev' : 'other',
		'message' : 'other'
	}
}

Meteor.methods({
	getPmcIdFromPmid: function(articlePMID){
		var pmcId;
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
		var res;
		res = Meteor.http.get(requestURL);
		
		if(res){
			var articleIdList = res.data.result[articlePMID]['articleids'];
			var articleIdListL = articleIdList.length;
			for(var i = 0 ; i < articleIdListL ; i ++){
				if(articleIdList[i]['idtype'] === 'pmc'){
					// console.log(articleIdList[i]['value']);
					pmcId = articleIdList[i]['value'];
				}
			}	
		}
		return pmcId;
	},
	getPiiFromPmid: function(articlePMID){
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + articlePMID;
		var res;
		res = Meteor.http.get(requestURL);
		
		if(res){
			var articleIdList = res.data.result[articlePMID]['articleids'];
			var articleIdListL = articleIdList.length;
			for(var i = 0 ; i < articleIdListL ; i ++){
				if(articleIdList[i]['idtype'] === 'pii'){
					return articleIdList[i]['value'];
				}
			}	
		}
	},
	getPubStatusFromPmid: function(pmid){
		// console.log('--getPubStatusFromPmid');
		var requestURL = 'http://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=' + pmid;
		var res;
		res = Meteor.http.get(requestURL);
		
		if(res){
			var articlePubStatus = res.data.result[pmid]['pubstatus'];
			return articlePubStatus;
		}		
	}
})