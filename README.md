**Paperchase Documentation**
========================
An academic journal platform.

Visitor Site
============

 - LoadingConfig template only used while config collection loads
 - config collection contains journal specific variables - main color, journal
   name, submit link etc.
 - Template variable `configLoaded` is used to show/hide visitor layout until collection is loaded.

Navigation
----------
In nav.html, the main side nav and the mobile collapsible nav will list only section links that are set to display:true and these links are listed in the order saved on Site Control

----------


Admin Site
==========

Site Control
------------
/admin/site-control
Admin control of side navigation (main page navigation and section page navigation). Options are stored as objects in an array in the config doc in DB.  Order of objects in array determines order of links listed.

    "site" : {
	    "side_nav" : [
	    {
		    "route_name" : "advance",
		    "name" : "Advance",
		    "display" : true
	    }
	}

**Display & Order**
Main page nav - display and order is stored in config collection.
Section side nav - display stored in sections collection. order stored in sorters collection.

News
----
Stored in the news collection. Doc contains - title, content, date, display, and also updates by users are tracked (just user id and date).
Session variable `newsId` used in news form helper.

**Database Publications**
newsListAll: For admin only. doesn't limit news items not displayed to public
newsListDisplay: Only news items to display to public
newsItem: Publication by Mongo ID

Section Pages
-------------

**Admin Control**
Create new sections, assign articles to sections, display section links in side nav, order of links in side nav.

**Updating**
Section Name & Display
Whenever the section doc is updated, the doc for the order of sections also gets updated.

**Section Papers Page**
List of articles comes from session variable article-list.
Session variable article-list is set in the router, onBeforeAction. Preprocessing of the list occurs in the server method preprocessSectionArticles to retrieve URLs of assets (PDFs, Figures, etc) for showing buttons.

**Add New Section**
/admin/sections-add

**All Sections**
/admin/sections
A table with: Section Name, Hidden/Display, Papers (link to papers table), Edit
Can edit 1 section at a time on this page (same form as add new section)
List sorted alphabetically (though sorters collection is used on side nav, so we can change this based on section order)

**Sections Link Order**
/admin/site-control
Order saved in sorters collection. List name = sections
Hidden links not listed
Can also hide sections from this page (but cannot display)

**Assign Section to Article**
On article form, in meta section

Article Form
----------------

This form is used in multiple places (Add Article, Edit Article, Verify XML).

**Data**
The data for the form comes from the session variable `article-form` and is not reactive.  The database data needs to be preprocessed to include all issues, all paper types etc so that the dropdown menus and buttons options (for ex, article type buttons) in the form are complete. Another session variable `article` is used to show the article nav and header. This variable is set in the router. Don't use the session variable for `article-form` because that contains extra information not needed for the nav/header, and also we can show the header while the form is still processing.

**Saving**
Whether using the form to create a new article doc, or updating an existing article doc, the article information is passed to validateArticle(mongoId, articleData) in /client/js/admin/article/articleMethods.js. This function will first check for duplicate articles. Duplicate articles are found using articleExistenceCheck(mongoId, articleData), which will query for title and IDs. If an article is found and the _id of the doc does not match the provided mongoId then validation is stopped and the user is notified. If no duplicate found, then the inputs are validated. Currently, only title is required and the only requirement is that it is not empty. validateArticle() will return an object, which has three flags checked on the event handler: duplicate, invalid, saved. If result.duplicate then the returned object is the duplicate article. If result.invalid, then the returned result contains all the invalid input IDs with messages for each. If result.saved then article was saved (updated or inserted). If saving the data, articleUpdate() is used. This will also insert and return _id if inserted.


Article Files Uploader
--------------------------
**XML**

 - Can upload PMC or AOP (PubMed) XML
 - Only PMC XML is uploaded to S3, which is full text XML
 - AOP XML is used only to update the DB.
 - Since the same form is used for AOP and PMC XML, there's a flag in the session variable `article-form.aop` and if set to true, the upload button is hidden but the form is still displayed.
 - xmlMethods.js: This file contains functions to parse XML to JSON, and to get that JSON in the schema for the DB. Also contains functions for comparing XML JSON with DB JSON
 - Issue handling: if volume and issue in XML, but no record in the issues collection, then insert. This happens on processing, so before the article form gets saved. The reason is because issues can be deleted/hidden easily (still a todo).

----------


Article Files
-------------
**XML**

 - File naming: articleMongId.xml
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the xml folder

XML files are versioned, so consistent naming is essential. In the Paperchase DB, this record is stored in the article doc (in the articles collection), within ‘files’

**PDF**

 - File naming: articleMongId.pdf
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the pdf folder

PDF files are versioned, so consistent naming is essential. In the Paperchase DB, this record is stored in the article doc (in the articles collection), within ‘files’

**Figures**
 - File naming: articleMongId_figureId.xml
 - File storage: on AWS S3 in journal bucket (paperchase-journalshortname) in the paper_figures folder




