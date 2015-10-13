publisherArticleTypes = {
	'BioEssay' : 'article-commentary',
	'Brief Research Paper' : 'brief-report',
	'Clinical Research Paper' : 'research-article',
	'Commentary' : 'article-commentary',
	// 'Commentaries & Editorials' : 'editorial', //updated all in the db to Commentaries and Editorials
	'Commentaries and Editorials' : 'editorial',
	'Discussion' : 'discussion',
	'Editorial' : 'editorial',
	'Editorial Comment' : 'article-commentary',
	'Editorial Interview' : 'editorial',
	'Erratum' : 'correction',
	'Essays' : 'other',
	'Essays and Commentaries' : 'other',
	'Hypothesis' : 'research-article',
	'Letter to the Editor' : 'letter',
	'Meeting Report' : 'meeting-report',
	'News' : 'research-article', // there is only one article with this, pmid 20436227. it should be short_name = news
	'Opinions in Science and Society' : 'research-article', //only 1 article, pmid 22915707. seems like this should be commentary not article'Perspective' : 'research-article',
	'Preview' : 'research-article',
	'Priority Research Paper' : 'research-article',
	'Research Article' : 'research-article',
	'Research Paper' : 'research-article',
	// 'Research Papers' : 'research-article', //updated all these in the db to Research Papers
	'Research Perspective' : 'research-article',
	'Review' : 'review-article',
	'Theory Article' : 'research-article'
}


//DISCREPENCIES
//pmid = 21212463, has type = Preview. but short_name = article-commentary. whereas, all others are research-article
//pmid = 21084726, has type = Commentary and short_name = other, but others are short_name = article-commentary
//pmid = 24389041, has type Review, but short_name other
//pmid = 22166724 and 22246147  and 22170754 are Hypothesis but have short_name other
//pmid = 22915706, 22728569, 21808096, 21685511, have Editorial Comment but short name editorial