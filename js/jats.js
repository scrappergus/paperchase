// pubTypeDateList, dateTypeDateList and pubIdTypeList: http://jats.nlm.nih.gov/archiving/tag-library/1.0/index.html
pubTypeDateList = {
	'collection': 'Collection',
	'epub': 'Electronic publication (usually web, but also includes eBook, CD-ROM, or other electronic-only distribution)',
	'ppub': 'Print publication',
	'epub-ppub': 'Both print and electronic publications',
	'epreprint': 'Electronic preprint dissemination',
	'ppreprint': 'Print preprint dissemination',
	'ecorrected': 'Corrected in electronic',
	'pcorrected': 'Corrected in print',
	'eretracted': 'Retracted in electronic',
	'pretracted': 'Retracted in print',
};
dateTypeDateList = {
	'accepted': 'The date a manuscript was accepted',
	'corrected': 'The date a manuscript was corrected',
	'pub' : 'The publication date (electronic or print)',
	'preprint':'Preprint dissemination date (electronic or print)',
	'retracted': 'The date a manuscript was retracted',
	'received':'The date a manuscript was received',
	'rev-recd':'The date a manuscript was received',
	'rev-request':'The date revisions were requested'
};
pubIdTypeList = {
	// 'aggregator': 'Identifier assigned by a data aggregator',
	// 'archive':'Identifier assigned by an archive or other repository',
	// 'art-access-id':'Generic article accession identifier for interchange and retrieval between archives',
	// 'arxiv':'arXiv archive of electronic preprints',
	// 'coden':'Obsolete PDB/CCDC identifier (may be present on older articles)',
	// 'doaj':'Directory of Open Access Journals',
	'doi':'Digital Object Identifier',
	// 'index':'Identifier assigned by an abstracting or indexing service',
	// 'isbn':'International Standard Book Number',
	'manuscript':'Identifier assigned to a manuscript',
	'medline':'NLM Medline identifier',
	'pii':'Publisher Item Identifier',
	'pmc':'PubMed Central identifier', //imported xml had this as the attribue
	// 'pmcid':'PubMed Central identifier', //jats says this, but just pmc is valid
	'pmid':'PubMed ID',
	// 'publisher-id':'Publisher’s identifier',
	// 'sici':'Serial Item and Contribution Identifier',
	// 'std-designation':'The official number of a standard, from a standards body such as ISO, NISO, IEEE, ASME'
}
articleTypeList = {
	'abstract' : 'The article itself is an abstract (of a paper or presentation) that usually has been presented or published separately.',
	'addendum' : 'A published work that adds additional information or clarification to another work (The somewhat similar value “correction” corrects an error in previously published material.)',
	'announcement': 'Material announced in the publication (may or may not be directly related to the publication)',
	'article-commentary': 'A work whose subject or focus is another article or articles; this article comments on the other article(s). (This value would be used when the editors of a publication invite an author with an opposing opinion to comment on a controversial article and then publish the two articles together. The somewhat similar value “editorial” is reserved for commentary written by an editor or other publication staff.)',
	'book-review': 'Review or analysis of one or more printed or online books (The similar value “product-review” is used for product analyses.)',
	'books-received' : 'Notification that items, for example, books or other works, have been received by a publication for review or other consideration',
	'brief-report' : 'A short and/or rapid announcement of research results',
	// 'calendar' : 'A list of events',
	'case-report': 'Case study, case report, or other description of a case',
	// 'collection' : 'Wrapper article for a series of sub-articles or responses; this value’s usage is restricted to articles whose intellectual content appears primarily in <sub-article> or <response>.',
	'correction' : 'A modification or correction of previously published material; this is sometimes called “errata” (The somewhat similar value “addendum” merely adds to previously published material.)',
	'discussion': 'Invited discussion related to a specific article or issue',
	// 'dissertation' : 'Thesis or dissertation written as part of the completion of a degree of study',
	'editorial' : 'Opinion piece, policy statement, or general commentary, typically written by staff of the publication (The similar value “article-commentary” is reserved for a commentary on a specific article or articles, which is written by an author with a contrasting position, not an editor or other publication staff.)',
	'in-brief' : 'Summary or teaser of items in the current issue',
	'introduction' : 'An introduction to a publication, or to a series of articles within a publication, etc., typically for a special section or issue',
	'letter' : 'Letter to a publication, typically commenting upon a published work',
	'meeting-report': 'Report of a conference, symposium, or meeting',
	'news' : 'News item, normally current but atypically historical',
	// 'obituary' : 'Announcement of a death, or the appreciation for a colleague who has recently died',
	// 'oration' : 'Reprint of a speech or oral presentation',
	'partial-retraction' : 'Retraction or disavowal of part(s) of previously published material',
	'product-review': 'Description, analysis, or review of a product or service, for example, a software package (The similar value “book-review” is used for analyses of books.)',
	'rapid-communication' : 'Fast-breaking research update or other news item',
	'reply' : 'Reply to a letter or commentary, typically by the original author commenting upon the comments',
	'reprint' : 'Reprint of a previously published article',
	'research-article' : 'Article reporting on primary research (The related value “review-article” describes a literature review, research summary, or state-of-the-art article.)',
	'retraction' : 'Retraction or disavowal of previously published material',
	'review-article': 'Review or state-of-the-art summary article (The related value “research-article” describes original research.)',
	// 'translation' : 'Translation of an article originally produced in a different language'
}