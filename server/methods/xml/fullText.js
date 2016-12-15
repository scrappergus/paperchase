// methods used to create full text HTML from XML
Meteor.methods({
    getFilesForFullText: function(mongoId){
        var fut = new future();
        var result = {};
        var articleJson,
            articleInfo,
            xml,
            xmlUrl;
        articleInfo = articles.findOne({'_id' : mongoId});
        if(articleInfo){
            articleInfo = Meteor.article.readyData(articleInfo);

            if(articleInfo.files && articleInfo.files.xml && articleInfo.files.xml.url){
                xmlUrl = articleInfo.files.xml.url;
                // if(mongoId === 'MHpmpbTNuNqLnCN9g'){
                //     xmlUrl = 'https://s3-us-west-1.amazonaws.com/paperchase-aging/test/101047-p.xml';
                // }
                Meteor.http.get(xmlUrl, function(getXmlError, xmlRes){
                    if(getXmlError){
                        console.error('getXmlError',getXmlError);
                        fut.throw(getXmlError);
                    }else if(xmlRes){
                        xml = xmlRes.content;
                        Meteor.call('fullTextToJson', xml, articleInfo.files, mongoId, function(convertXmlError, convertedXml){
                            if (convertXmlError) {
                                console.error('..convertXmlError',convertXmlError);
                                fut.throw(convertXmlError);
                            } else {
                                convertedXml.mongo = mongoId;
                                result.convertedXml = convertedXml;
                                result.lastModified = xmlRes.headers['last-modified'];
                                fut.return(result);
                            }
                        });
                    }
                });
            } else {
                fut.return({});
            }
        }
        return fut.wait();
    },
    fullTextToJson: function(xml, files, mongoId){
        // Full XML processing. Content, and References
        xml = Meteor.clean.newLinesToSpace(xml);
        xml = Meteor.clean.removeExtraSpaces(xml);
        // console.log('---xml',xml);
        var fut = new future();
        var articleObject = {};
        var doc = new dom().parseFromString(xml);

        articleObject.sections = [];

        // Article Content
        // ---------------
        var sections = xpath.select('//body/sec | //body/p | //body/fig | //body/disp-quote | //body/table-wrap | //body/disp-formula', doc);
        if(sections[0]){
            for(var section = 0; section<sections.length; section++){
                var sectionObject = {},
                    sectionIdObject = {};
                if(sections[section].localName === 'sec'){
                    sectionObject = Meteor.fullText.sectionToJson(sections[section], files, mongoId);
                    sectionIdObject = Meteor.fullText.sectionId(sections[section], true);
                    if(sectionIdObject){
                        for(var idInfo in sectionIdObject){
                            sectionObject[idInfo] = sectionIdObject[idInfo];
                        }
                    }
                }else if(sections[section].localName === 'p'){
                    sectionObject.content = [];
                    sectionObject.content.push(Meteor.fullText.sectionPartsToJson(sections[section],files,mongoId));
                }else if(sections[section].localName === 'fig'){
                    var figure = Meteor.fullText.convertFigure(sections[section],files,mongoId);
                    sectionObject.content = [];
                    sectionObject.content.push({content: figure, contentType: 'figure'});
                }else if(sections[section].localName === 'disp-quote'){
                    var quote = Meteor.fullText.convertContent(sections[section]);
                    if(quote){
                        sectionObject.content = [];
                        sectionObject.content.push({content: quote, contentType: 'quote'});
                    }
                }else if(sections[section].localName === 'table-wrap'){
                    var tbl = Meteor.fullText.convertTableWrap( sections[section] , files );
                    if(tbl){
                        sectionObject.content = [];
                        tbl.contentType = 'table';
                        sectionObject.content.push(tbl);
                    }
                }else if(sections[section].localName === 'disp-formula'){
                    sectionObject.content = [];
                    var secAttr = Meteor.fullText.traverseAttributes(sections[section].attributes);
                    if(secAttr && secAttr.id){
                        sectionObject.id = secAttr.id;
                    }
                    sectionObject.content.push({
                        contentType: 'formula',
                        content: Meteor.fullText.convertFormula(sections[section].childNodes)
                    });
                }

                articleObject.sections.push(sectionObject);
            }
        }


        // Related Article
        // ---------
        var relatedArticles = xpath.select('//related-article', doc);
        if(relatedArticles[0]){
            articleObject.related = [];
            articleObject.related = [];
            relatedArticles.forEach(function(related){
                var relatedArticle = {},
                    relatedAttributes,
                    relatedTitle;

                // Attributes (vol, pages, type)
                // --------
                if(related.attributes){
                    relatedAttributes = Meteor.fullText.relatedArticleAttributes(related.attributes);
                    if(relatedAttributes){
                        for(var attr in relatedAttributes){
                            relatedArticle[attr] = relatedAttributes[attr];
                        }
                    }
                }

                // Title and Source
                // --------
                for(var i=0; i<related.childNodes.length; i++){
                    if(related.childNodes[i].localName === 'article-title'){
                        if(related.childNodes[i].childNodes && related.childNodes[i].childNodes[0].nodeValue){
                           relatedArticle.title =  Meteor.clean.cleanString(related.childNodes[i].childNodes[0].nodeValue);
                        }else{
                            relatedArticle.title =  Meteor.fullText.convertContent(related.childNodes[i]);
                        }
                    }
                    if(related.childNodes[i].localName === 'source'){
                        if(related.childNodes[i].childNodes && related.childNodes[i].childNodes[0].nodeValue){
                           relatedArticle.source =  Meteor.clean.cleanString(related.childNodes[i].childNodes[0].nodeValue);
                        }
                    }
                }

                if(Object.keys(relatedArticle).length != 0){
                    // console.log('relatedArticle',relatedArticle);
                    articleObject.related.push(relatedArticle);
                }
            });
        }

        // Acknowledgements
        // ---------
        var acks = xpath.select('//ack', doc);
        if(acks[0]){
            articleObject.acks = [];
            for(var ackIdx = 0 ; ackIdx < acks.length ; ackIdx++){
                ack = acks[ackIdx];

                var ackObj = Meteor.fullText.sectionToJson(ack);

                ackObj.title = 'Acknowledgements';

                articleObject.acks.push(ackObj);
            }
        }

        // Glossary
        // --------
        var glossary = xpath.select('//def-list', doc);
        if(glossary[0]){
            articleObject.glossary = [];
            for(var glossIdx in glossary[0].childNodes){
                if(typeof Number(glossIdx) == 'number' && glossary[0].childNodes[glossIdx].tagName == 'def-item') {
                    var term = {};
                    for(var i=0; i < glossary[0].childNodes[glossIdx].childNodes.length ; i++){
                        var glossParsed = Meteor.fullText.convertContent(glossary[0].childNodes[glossIdx].childNodes[i]);
                        if(glossParsed){
                            glossParsed = Meteor.fullText.removeParagraphTags(glossParsed);

                            if(glossParsed != ''){
                                term[glossary[0].childNodes[glossIdx].childNodes[i].tagName] = glossParsed;
                            }
                        }
                    }
                    if(Object.keys(term).length !=0 ){
                        articleObject.glossary.push(term);
                    }

                }
            }
        }

        // Footnotes
        // ----------
        var footnotes = xpath.select('//author-notes/fn | //back/fn-group/fn', doc);
        if(footnotes){
            articleObject.footnotes = [];

            var footnotesWithoutTitles = {};
            footnotesWithoutTitles.title = 'Footnote';
            footnotesWithoutTitles.content = [];

            for(var i=0; i<footnotes.length; i++){
                var footObj = {},
                    attributes;
                footObj.content = [];

                // Footnote title via fn-type attribute
                attributes = Meteor.fullText.traverseAttributes(footnotes[i].attributes);
                if(attributes && attributes['fn-type'] && attributes['fn-type'] === 'conflict'){
                    footObj.title = 'Conflicts of Interest';
                }else if(attributes && attributes['fn-type'] && attributes['fn-type'] === 'con'){
                    footObj.title = 'Author Contributions';
                }else if(attributes && attributes['fn-type'] && (attributes['fn-type'] === 'supported-by' || attributes['fn-type'] === 'financial-disclosure')){
                    footObj.title = 'Funding';
                }

                // Footnote content
                for(var c=0; c<footnotes[i].childNodes.length; c++){
                    var foot = Meteor.fullText.convertContent(footnotes[i].childNodes[c]);
                    if(foot){
                        if(footnotes[i].childNodes[c].localName === 'label'){
                            footObj.label = foot;
                        }
                        else if(footObj.title === 'Conflict of Interests Statement' && foot.match(/Conflict of interest(s)* statement/i)){
                            // do not want to add 'Conflict of interest statement' to footnote content because this will be added via attribute fn-type check above
                        }
                        else if(footObj.title === 'Author Contributions' && foot.match(/author(s\')*\scontributions/i)) {
                            // do not want to add 'Authors\' contributions' to footnote content because this will be added via attribute fn-type check above
                        }
                        else if(footObj.title === 'Funding' && foot.match(/^(\<b>)*Funding/)){
                            // do not want to add 'Funding' to footnote content because this will be added via attribute fn-type check above
                        }
                        else if(!footObj.title && foot.match(/^(\<b>)*Funding/)){
                            footObj.title = 'Funding';
                        }
                        else if(footObj.title){
                            footObj.content.push({content_part: foot});
                        }
                        else{
                            // Not title, group all these together within same header 'Footer'
                            footnotesWithoutTitles.content.push({label: footObj.label , content_part: foot});
                        }

                    }
                }

                if(Object.keys(footObj).length!=0 && footObj.title){
                    if(footObj.title == 'Author Contributions') {
                        articleObject.footnotes.unshift(footObj);
                    }
                    else {
                        articleObject.footnotes.push(footObj);
                    }
                }
            }

            if(footnotesWithoutTitles.content.length > 0){
                if(footnotesWithoutTitles.content.length > 1){
                    footnotesWithoutTitles.title = 'Footnotes';
                }
                articleObject.footnotes.push(footnotesWithoutTitles);
            }

        }

        // References
        // ----------
        // TODO: editorials have a different reference style
        // <ref><label><element-citation>
        // we want to search for //ref because that has the ID attribute. We do not want to rely on the index of the reference for the ID.
        var references = xpath.select('//ref', doc);
        if(references[0]){
            // console.log('referencesreferences', references[0]);
            articleObject.references = [];
            for(var referenceIdx = 0; referenceIdx < references.length ; referenceIdx++){
                var reference = references[referenceIdx];
                // console.log('... ref ' + referenceIdx);
                var refAttributes = reference.attributes;
                var referenceObj = {};

                var elementCitation = xpath.select("mixed-citation | element-citation", reference);

                // Reference content and type
                // --------------------------
                if(elementCitation){
                    elementCitation = elementCitation[0];
                    // Reference content
                    referenceObj = Meteor.fullText.convertReference(elementCitation);

                    // Reference type
                    var citationAttributes = elementCitation.attributes;
                    for(var cAttr=0; cAttr<citationAttributes.length; cAttr++){
                        if(citationAttributes[cAttr].localName == 'publication-type' && citationAttributes[cAttr].nodeValue){
                            referenceObj.type = citationAttributes[cAttr].nodeValue.replace('-','_');
                            if(referenceObj.type === 'ohter'){
                                // For when reference attribute has a typo in XML
                                referenceObj.type = 'other';
                            }
                        }
                    }
                }

                // Label
                var refLabel = xpath.select('label', reference);
                if(refLabel && refLabel[0] && refLabel[0].childNodes && refLabel[0].childNodes[0] && refLabel[0].childNodes[0].nodeValue){
                    referenceObj.label = refLabel[0].childNodes[0].nodeValue;
                }

                // Reference number
                // ------------------
                for(var refAttr = 0; refAttr < refAttributes.length; refAttr++){
                    if(refAttributes[refAttr].localName === 'id' && refAttributes[refAttr].nodeValue){
                        referenceObj.id = refAttributes[refAttr].nodeValue;
                        referenceObj.number = refAttributes[refAttr].nodeValue.replace('R','').replace('r',''); // for when no <label>
                    }
                }

                articleObject.references.push(referenceObj);
            }
        }

        if(articleObject){
            fut.return(articleObject);
        }
        return fut.wait();
    },
});

// for handling sections of XML, content, special elements like figures, references, tables
Meteor.fullText = {
    sectionToJson: function(section, files, mongoId){
        // XML processing of part of the content, <sec>
        // console.log('.sectionToJson');
        var sectionObject = {};
        sectionObject.content = [];
        for(var c = 0; c < section.childNodes.length; c++){
            var sec = section.childNodes[c];

            if(sec.localName !== null){
                // console.log(sec.localName);
                if(sec.localName === 'label'){
                    sectionObject.label = Meteor.fullText.convertContent(sec);
                } else if(sec.localName === 'title'){
                    sectionObject.title = Meteor.fullText.fixSectionTitle(Meteor.fullText.convertContent(sec));
                } else if(sec.localName === 'sec'){
                    var subSectionObject,
                        sectionIdObject;

                    subSectionObject = Meteor.fullText.sectionToJson(sec, files, mongoId);
                    if(subSectionObject){
                        subSectionObject.contentType = 'subsection';
                        sectionIdObject = Meteor.fullText.sectionId(sec, false);
                        if(sectionIdObject){
                            for(var idInfo in sectionIdObject){
                                subSectionObject[idInfo] = sectionIdObject[idInfo];
                            }
                        }
                        sectionObject.content.push(subSectionObject);
                    }
                } else{
                    subSectionObject = Meteor.fullText.sectionPartsToJson(sec, files, mongoId);
                    // Add the content object to the section object
                    if(subSectionObject){
                        sectionObject.content.push(subSectionObject);
                    }
                }
            }
        }
        // console.log('sectionObject',sectionObject);
        return sectionObject;
    },
    sectionId: function(section, primarySection){
        // console.log('..sectionId',primarySection);
        var sectionIdObject = {},
            sectAttr;

        sectAttr = Meteor.fullText.traverseAttributes(section.attributes);

        if(sectAttr && sectAttr['sec-type']){
            sectionIdObject.type = sectAttr['sec-type'].nodeValue;
        }
        else if(sectAttr && sectAttr.id){
            sectionIdObject.headerLevel = Meteor.fullText.headerLevelFromId(sectAttr.id);
            sectionIdObject.sectionId = sectAttr.id;
        }

        // Header Level
        if(primarySection){
            sectionIdObject.headerLevel = 1;
        }
        else if(sectAttr && sectAttr.id) {
            sectionIdObject.headerLevel = Meteor.fullText.headerLevelFromId(sectAttr.id);
        }
        else {
            sectionIdObject.headerLevel = 2;
        }

        if(!sectionIdObject.sectionId && section.parentNode && section.parentNode.localName && section.parentNode.localName === 'body'){
            sectionIdObject.headerLevel = 1;
        }

        return sectionIdObject;
    },
    sectionPartsToJson: function(sec, files, mongoId){
        // console.log('...sectionPartsToJson',sec.localName);
        var sectionPartObject = {};
        var content,
            contentType;
        var formulaInParagraph,
            inlineFormulaInParagraph;
        // Different processing for different node types
        if (sec.localName === 'table-wrap'){
            sectionPartObject = Meteor.fullText.convertTableWrap(sec, files);
        } else if (sec.localName === 'fig'){
            content = Meteor.fullText.convertFigure(sec,files,mongoId);
            contentType = 'figure';
        } else if (sec.localName === 'supplementary-material'){
            var suppConverted = Meteor.fullText.convertSupplement(sec, files, mongoId);
            if(suppConverted){
                sectionPartObject.contentType = 'supplement';
                sectionPartObject.supps = suppConverted;
            }
        } else if(sec.localName === 'disp-formula') {
            contentType = 'formula';
            var secAttr = Meteor.fullText.traverseAttributes(sec.attributes);
            if(secAttr && secAttr.id){
                sectionPartObject.id = secAttr.id;
            }
            content = Meteor.fullText.convertFormula(sec.childNodes);
        } else if (sec.localName === 'p') {
            formulaInParagraph = xpath.select('disp-formula', sec);
            inlineFormulaInParagraph = xpath.select('inline-formula', sec);
            if (formulaInParagraph && formulaInParagraph[0] && formulaInParagraph[0].localName === 'disp-formula') {
                // extyles puts equations in paragraph tags
                contentType = 'formula';
                var formulaAttr = Meteor.fullText.traverseAttributes(formulaInParagraph[0].attributes);
                if (formulaAttr && formulaAttr.id) {
                    sectionPartObject.id = formulaAttr.id;
                }
                content = Meteor.fullText.convertContent(sec);
            } else if (inlineFormulaInParagraph && inlineFormulaInParagraph[0] && inlineFormulaInParagraph[0].localName === 'inline-formula') {
                // inline formula
                content = Meteor.fullText.convertContent(sec);
                contentType = 'formula';
            } else {
                content = Meteor.fullText.convertContent(sec);
                contentType = 'p';
            }
        } else{
            content = Meteor.fullText.convertContent(sec);
            contentType = 'p';
        }

        if (content){
            content = Meteor.fullText.fixTags(content);
            sectionPartObject.content = content;
            sectionPartObject.contentType = contentType;
        }

        return sectionPartObject;
    },
    headerLevelFromId: function(sectionId){
        // section ids are in the format, s1, s1_1, s1_1_1
        var sectionIdPieces = sectionId.split('_');
        return sectionIdPieces.length;
    },
    listType: function(attributes, node) {
        var type = '';
        if( attributes && attributes['list-type'] && attributes['list-type']==='order' ){
            type = '<ol>';
        }else if( attributes && attributes['list-type'] && attributes['list-type']==='bullet' ){
            type = '<ul>';
        }else if( attributes && attributes['list-type'] && attributes['list-type']==='alpha-lower' ){
            type = '<ol type="a">';
        }else if( attributes && attributes['list-type'] && attributes['list-type']==='alpha-upper' ){
            type = '<ol type="A">';
        }else if( attributes && attributes['list-type'] && attributes['list-type']==='roman-lower' ){
            type = '<ol type="i">';
        }else if( attributes && attributes['list-type'] && attributes['list-type']==='roman-upper' ){
            type = '<ol type="I">';
        }else if( attributes && attributes['list-type'] && attributes['list-type']==='simple' ){
            type = '<ul list-style="none">';
        }else{
            type = '<ul>';
        }
        return type;
    },
    convertList: function(node) {
        // console.log('--convertList');
        var list = '';
        var attributes = Meteor.fullText.traverseAttributes(node.attributes);

        // Open ul tag
        list += Meteor.fullText.listType(attributes, node);


        //li tag
        //-------------

        if(node.childNodes){
            for(var li = 0; li< node.childNodes.length; li++){
                var liNode = node.childNodes[li];
                if(liNode){
                    var nodeAnchor = '',
                        nValue = '',
                        nAttr;
                    if(liNode.localName === 'list-item'){
                        list += '<li>';
                        //TODO: handle tables within <li> better, convertContentChild will just parse the <table> as a string, but we should use convertTableWrap, which returns an obj
                        list += Meteor.fullText.convertContent(liNode);
                        list += '</li>';
                    }
                }
            }
        }

        //Close ul tag
        //-------------
        if( attributes && attributes['list-type'] && attributes['list-type']==='order' || attributes['list-type']==='alpha-lower' || attributes['list-type']==='alpha-upper' || attributes['list-type']==='roman-lower' || attributes['list-type']==='roman-upper' ){
            list += '</ol>';
        }
        else if( attributes && attributes['list-type'] ){
            list += '</ul>';
        }

        return list;
    },
    convertContent: function(node){
        // need to include figures so that we can fill in src within the content
        var content = '';
        // console.log(node.localName);
        if(node.childNodes){
            // Section: Content
            // --------
            if( node.localName && node.localName === 'list' ){
                content += Meteor.fullText.convertList(node);
            } else{
                for(var cc = 0 ; cc < node.childNodes.length ; cc++){
                    var childNode = node.childNodes[cc];
                    if(childNode){
                        content += Meteor.fullText.convertContentChild(childNode);
                    }
                }
            }
        }

        content = Meteor.fullText.fixTags(content);

        if (content.length === 0){
            return;
        } else{
            return content;
        }
    },
    convertContentChild: function(node){
        var content = '',
            nAttr,
            convertedChildInChild;

        // get attributes
        if(node.attributes){
            nAttr = Meteor.fullText.traverseAttributes(node.attributes);
        }

        if( node.localName === 'xref' ){
            content += Meteor.fullText.linkXref(node);
        }
        else if( node.localName === 'ext-link' ){
            content += Meteor.fullText.linkExtLink(node);
        }
        else if( node.localName === 'disp-formula' ) {
            content += Meteor.fullText.convertFormula([node]); 
        }
        else if( node.localName === 'inline-formula' ) {
            content += Meteor.fullText.convertFormula([node]); 
        }
        else {
            //Open tag
            if(node.localName !== null){
                content += '<' + node.localName;

                if(node.localName === 'table'){
                    content += ' class="bordered" ';
                }

                content += '>';
            }

            //Tag content
            if(node.nodeType == 3 && node.nodeValue && node.nodeValue.replace(/^\s+|\s+$/g, '').length !== 0){
                //plain text or external link
                if(node.nodeValue && node.nodeValue.indexOf('http') != -1 || node.nodeValue.indexOf('https') != -1 ){
                    // console.log(node.nodeValue);
                    content += Meteor.general.findLink(node.nodeValue);
                    // content += '<a href="'+ node.nodeValue +'" target="_BLANK">' + node.nodeValue + '</a>';
                }
                else if(node.nodeValue){
                    content += node.nodeValue;
                }
            }
            else if(node.childNodes){
                convertedChildInChild = Meteor.fullText.convertContent(node);
                if(convertedChildInChild){
                    content += Meteor.fullText.convertContent(node);
                }
            }

            //Close tag
            if(node.localName !== null){
                content += '</' + node.localName + '>';
            }
        }
        return content;
    },
    convertFormula: function(nodes){
        var formula = '';
        for(var child = 0; child < nodes.length; child++){
            var childNode = nodes[child];
            if(childNode){
                var attributes;
                var attributesInclude = '';
                if(childNode.attributes){
                    attributes = Meteor.fullText.traverseAttributes(childNode.attributes);
                }

                // tag attributes
                if(attributes){
                    for(var attributeKey in attributes){
                        attributesInclude += ' ' + attributeKey + '="' + attributes[attributeKey] + '"';
                    }
                }

                if(childNode.nodeName != '#text'){
                    if(childNode.localName === 'math'){
                        attributesInclude += ' xmlns="http://www.w3.org/1998/Math/MathML"';
                    }
                    // start tag
                    formula += '<' + childNode.localName + attributesInclude + '>';

                    // tag content
                    if(childNode.childNodes){
                        formula += Meteor.fullText.convertFormula(childNode.childNodes);
                    }

                    // close tag
                    formula += '</' + childNode.localName + '>';
                } else{
                    // text
                    formula += childNode.nodeValue;
                }
            }
        }

        return formula;
    },
    linkXref: function(xrefNode){
        // console.log('linkXref',xrefNode.childNodes);
        // Determine - Reference or Figure or table-fn?
        var content = '',
            nodeAnchor = '';
        if(xrefNode.childNodes[0]){
            nValue = xrefNode.childNodes[0].nodeValue;
            if(nValue === null){
                // there is styling withing the xref, for ex <sup>a</sup>
                nValue = Meteor.fullText.convertContent(xrefNode);
            }
            var attributes = xrefNode.attributes;
            // tagName should be replace with figure or reference id. nodeValue would return F1C, but rid will return F1.
            for(var attr = 0 ; attr < attributes.length ; attr++){
                if(attributes[attr].nodeName === 'rid'){
                    nodeAnchor = attributes[attr].nodeValue;
                }
            }

            content += '<a href="#' + nodeAnchor + '"  class="anchor">';
            content += nValue;
            content += '</a>';
        }

        return content;
    },
    linkExtLink: function(linkNode){
        var content = '',
            attributes;
        if(linkNode.childNodes[0]){
            nValue = linkNode.childNodes[0].nodeValue;
            if(nValue === null){
              nValue = Meteor.fullText.convertContent(linkNode);
            }
            attributes = Meteor.fullText.traverseAttributes(linkNode.attributes);
            if(attributes && attributes.href){
                content += '<a href="' + attributes.href + '"  target="_BLANK">';
                content += nValue;
                content += '</a>';
            }
        }

        return content;
    },
    convertFigure: function(node, files, mongoId){
        // console.log('..convertFigure',node);
        var figObj;

        // get the figure id, label, title, caption
        //------------------
        Meteor.xmlPmc.figure(node, function(figInfo){
            if(figInfo){
                figObj = figInfo;
                // match to db file info
                if(files.figures)
                for(var f = 0; f<files.figures.length; f++){
                    if(files.figures[f].id.toLowerCase() === figObj.id.toLowerCase() && files.figures[f].url){
                        figObj.url = files.figures[f].url;
                    }
                }
            }
        });

        return figObj;
    },
    convertSupplement: function(node, files, mongoId){
        // console.log('..convertSupplement',files);
        var suppAssetsUrl = journalConfig.findOne().assets;
        var suppRes = [],
            mediaIds = [];

        var mediaCheck = xpath.select('media', node);


        // get the figure id, label, title, caption
        // match by ID of <supplemental-material>, or if there are multiple <media> then use last part in href to match
        // ------------------
        Meteor.xmlPmc.supplemental(node,function(suppInfo){
            if(suppInfo){
                if(mediaCheck.length > 1){
                    // multiple <media>
                    // ----------------
                    mediaCheck.forEach(function(suppMedia){
                        var suppMediaAttr,
                            suppMediaHrefPieces,
                            suppMediaIdPieces,
                            suppMediaId;
                        suppMediaAttr = Meteor.fullText.traverseAttributes(suppMedia.attributes);
                        if(suppMediaAttr && suppMediaAttr.href){
                            suppMediaHrefPieces = suppMediaAttr.href.split('-');
                            suppMediaIdPieces = suppMediaHrefPieces[suppMediaHrefPieces.length - 1].split('.');
                            suppMediaId = suppMediaIdPieces[0];
                            mediaIds.push(suppInfo.id.toLowerCase() + '_' + suppMediaId.toLowerCase());
                        }
                    });
                }

                // match to db file info
                if(files.supplemental) {
                    for(var f = 0; f <files.supplemental.length; f++){
                        // copy parent node data (lable, title, etc)
                        var suppObj = {};
                        for(var key in suppInfo){
                            suppObj[key] = suppInfo[key];
                        }

                        if(files.supplemental[f].label) {
                            suppObj.label = files.supplemental[f].label;
                        }
                        if(files.supplemental[f].title) {
                            suppObj.title = files.supplemental[f].title;
                        }
                        if(files.supplemental[f].caption) {
                            suppObj.caption = files.supplemental[f].caption;
                        }

                        if(files.supplemental[f].id.toLowerCase() === suppObj.id.toLowerCase() && files.supplemental[f].url){
                            // matched by <supplemental-material> id attribute
                            suppObj.url = files.supplemental[f].url;
                            suppRes.push(suppObj);
                        }
                        else if(mediaIds.indexOf(files.supplemental[f].id.toLowerCase()) != -1 && files.supplemental[f].url){
                            // matched by media href id parsing
                            suppObj.url = files.supplemental[f].url;
                            suppObj.id_alt = suppObj.id + '_' + files.supplemental[f].id.toLowerCase();
                            suppRes.push(suppObj);
                        }
                    }
                }
            }
        });

        return suppRes;
    },
    convertReference: function(reference){
        // console.log('...............convertReference');
        var referenceObj = {};
        referenceObj.authors = '';
        var first_author = true;

        referenceObj = {'textContent':[], citationType: reference.nodeName.replace("-", "_")};

        for(var r = 0; r < reference.childNodes.length; r++){

            if(reference.childNodes[r].childNodes){
                var referencePart,
                referencePartName;

                // Reference Title, Source, Pages, Year, Authors
                // -------
                if(reference.childNodes[r].localName){
                    referencePart = reference.childNodes[r];
                    referencePartName = reference.childNodes[r].localName.replace('-','_'); // cannot use dash in handlebars template variable

                    if(referencePartName == 'person_group'){
                        var attr = xpath.select('@person-group-type', referencePart);
                        if(attr.length && attr[0].value == 'editor') {
                            referenceObj.textContent.push({content:Meteor.fullText.traverseAuthors(referencePart, {addPunctuation: true}), type:'authorList'});
                        }
                        else {
                            referenceObj.textContent.push({content:Meteor.fullText.traverseAuthors(referencePart, {addPunctuation: true}), type:'authorList'});
                        }
                    }
                    else if(referencePartName == 'name' || referencePartName == 'string_name'){
                        if(referencePart.childNodes){
                            if(referenceObj.citationType == 'mixed_citation') {
                                referenceObj.textContent.push({content:referencePart.childNodes.toString().replace(/<(\/)?(surname|given-names)>/g, ''), type:'text'});
                            }
                            else {
                                var comma = '';
                                var period = '';
                                if(referencePart.previousSibling.previousSibling && referencePart.nextSibling.nextSibling) {
                                    if(referencePart.previousSibling.previousSibling.nodeName == 'name' && referencePart.nextSibling.nextSibling.nodeName != 'name') {
                                        comma = ' and ';
                                        period = ".";
                                    }
                                    else if(referencePart.previousSibling.previousSibling.nodeName == 'name') {
                                        comma = ', ';
                                    }
                                }

                                referenceObj.textContent.push({content:comma + referencePart.childNodes.toString().replace(/(\s)?<(\/)?(surname)>/g, '').replace(/<(\/)?(given-names)>(\s)?/g, '').trim() + period, type:'name'});
                            }
                        }
                    }
                    else if(referencePartName == 'pub_id'){
                        // make sure attribute has pmid
                        var pmid = false;
                        for(var attr=0; attr<referencePart.attributes.length; attr++){
                            if(referencePart.attributes[attr].nodeName == 'pub-id-type' && referencePart.attributes[attr].nodeValue == 'pmid'){
                                referenceObj.textContent.push({content:referencePart.childNodes[0].nodeValue, type:'pmid'});
                            }else if(referencePart.attributes[attr].nodeName == 'pub-id-type' && referencePart.attributes[attr].nodeValue == 'doi'){
                                referenceObj.textContent.push({content:referencePart.childNodes[0].nodeValue, type:'doi'});
                            }
                        }
                    }
                    else if(referencePartName == 'article_title'){
                        if(referencePart.childNodes){
                            var content = Meteor.fullText.convertContent(referencePart);
                            if(content.slice(-1) != '.') {
                                content += '.';
                            }
                            referenceObj.textContent.push({content:content, type:'title'});
                        }
                    }
                    else if(referencePartName == 'ext_link'){
                        if(referencePart.childNodes){
                            referenceObj.textContent.push({content:Meteor.fullText.convertContent(referencePart), type:'ext_link'});
                        }
                    }
                    else if(referencePartName == 'comment'){
                        if(referencePart.childNodes){
                            var comment = '';
                            for(var part=0; part<referencePart.childNodes.length; part++){
                                // console.log(referencePart.childNodes[part].localName);
                                if(referencePart.childNodes[part].nodeValue){
                                    comment += referencePart.childNodes[part].nodeValue;
                                }
                                else if(referencePart.childNodes[part].localName == 'ext-link') {
                                    var href = '';
                                    for(var attrIdx=0; attrIdx<referencePart.childNodes[part].attributes.length; attrIdx++) {
                                        var attr = referencePart.childNodes[part].attributes[attrIdx];
                                        if(attr.localName == 'href') {
                                            var href = attr.nodeValue;
                                        }
                                    }
                                    link_content = href || referencePart.childNodes[part].nodeValue;
                                    comment += '<a href="'+href+'" target="_BLANK">'+link_content+'</a>';

                                }
                                else if(referencePart.childNodes[part].localName == 'uri') {
                                    if(referencePart.childNodes[part].childNodes[0] && referencePart.childNodes[part].childNodes[0].nodeValue){
                                        var link = referencePart.childNodes[part].childNodes[0].nodeValue;
                                        link = Meteor.clean.removeSpaces(link);
                                        comment += '<a href="'+link+'" target="_BLANK">'+link+'</a>';
                                    }
                                }
                            }
                            referenceObj.textContent.push([{content:comment, type:'comment'}]);
                        }
                    }
                    else if(referencePartName){
                        // source, year, pages, issue, volume, chapter_title
                        var refTemp = '';
                        var type = referencePartName || 'text';
                        if(referencePart.childNodes){
                            for(var part = 0 ; part < referencePart.childNodes.length ; part++){
                                if(referencePart.childNodes[part].nodeValue){
                                    if (typeof referenceObj[referencePartName] === 'string' || referenceObj[referencePartName] instanceof String ) {
                                        if(referencePartName != 'fpage' && referencePartName != 'lpage'){
                                            refTemp += '. ' + referencePart.childNodes[part].nodeValue;
                                        }
                                    }
                                    else {
                                        refTemp = referencePart.childNodes[part].nodeValue;
                                    }
                                }
                            }

                            referenceObj.textContent.push({content: refTemp, type:type});
                        }
                    }
                }
            }
            else {
                var referencePart = reference.childNodes[r];
                if(referencePart.nodeValue.length > 1) {
                    referenceObj.textContent.push({content:referencePart.nodeValue, type:'text'});
                }
                else if((referencePart.previousSibling && referencePart.nextSibling) && (referencePart.previousSibling.nodeName != 'name' && referencePart.nextSibling.nodeName != 'name')) {
                    referenceObj.textContent.push({content:referencePart.nodeValue, type:'text'});
                }
                else if((referencePart.previousSibling && referencePart.nextSibling) && referencePart.nextSibling.nodeName == 'article-title'){
                    referenceObj.textContent.push({content:referencePart.nodeValue, type:'text'});
                }
                else {
                //    console.log("Missed this: -->"+referencePart.nodeValue+"<--");
                }
            }
        }

        if(referenceObj.textContent) {
            var prior = {};
            var result;
            referenceObj.textContent = referenceObj.textContent.map(function(cur) {
                    if(cur.content == ' ') {
                        if(['fpage', 'volume'].indexOf(prior.type) > -1){
                            result = null;
                        }
                        else {
                            result = cur;
                        }

                    }
                    else {
                        result = cur;
                    }

                    prior = cur;
                    return result;
                });

        }

        return referenceObj;
    },
    convertTableWrap: function(sec, files){
        // console.log('..convertTableWrap');
        var sectionPartObject = {};
        // get attributes
        var tblAttr,
            tblGraphicNode,
            tblGraphicAttr,
            tblParsed;

        contentType = 'table';
        sectionPartObject.contentType = contentType;

        tblAttr = Meteor.fullText.traverseAttributes(sec.attributes);
        if(tblAttr.id){
            sectionPartObject.id = tblAttr.id;
        }

        tblParsed = Meteor.fullText.traverseTable(sec);
        if(tblParsed){
            for(var key in tblParsed){
                sectionPartObject[key] = Meteor.fullText.fixTags(tblParsed[key]);
            }
        }

        // Table Graphic
        if(tblAttr.id){
            // do not do below via traversTable,
            // because traversTable will return 1 single string of a table,
            // here we want to get the table graphic
            tblGraphicNode = xpath.select('//graphic', sec);
            if(tblGraphicNode && tblGraphicNode[0] && tblGraphicNode[0].attributes){
                tblGraphicAttr = Meteor.fullText.traverseAttributes( tblGraphicNode[0].attributes );
                if(tblGraphicAttr && tblGraphicAttr.href && files && files.tables){
                    files.tables.forEach(function(tbl){
                        if(tbl.id && tbl.url && tbl.id === tblAttr.id.toLowerCase() && tbl.display){
                            sectionPartObject.tableGraphic = {
                                url: tbl.url
                            };
                        }
                    });
                }
            }
        }

        if(tblParsed.footer){
            sectionPartObject.footer = tblParsed.footer;
        }

        return sectionPartObject;
    },
    relatedArticleAttributes: function(relatedAttributes){
        var result = {},
            attributesInJson;
        attributesInJson = Meteor.fullText.traverseAttributes(relatedAttributes);

        for(var key in attributesInJson){
            if(key != 'ext-link-type' && key != 'href'){
                result[Meteor.clean.dashesToUnderscores(key)] = attributesInJson[key];
            }
        }

        if(attributesInJson && attributesInJson['ext-link-type'] === 'pubmed' && attributesInJson.href){
            result.pmid = attributesInJson.href;
        }

        if(attributesInJson && attributesInJson['ext-link-type'] === 'pmc' && attributesInJson.href){
            result.pmcid = attributesInJson.href;
        }

        return result;
    },
    traverseAttributes: function(attributes){
        var result = {};
        for(var attr=0; attr<attributes.length ; attr++){
           if(attributes[attr].localName,attributes[attr].nodeValue)
           result[attributes[attr].localName] = attributes[attr].nodeValue;
        }
        return result;
    },
    traverseAuthors: function(node, options){
        options = options || {};
        // console.log('..traverseNode');
        // first creating an array, so that we can ignore empty nodes
        // then using a string,
        // because there is some logic that is too complicated for handlebars. For ex, when 2 authors there is no comma and instead 'and' is used.
        var authors = [];
        var etal = '';
        if(node.childNodes){
            for(var c = 0 ; c < node.childNodes.length ; c++){
                var n = node.childNodes[c];

                if(n.tagName == 'etal') {
                    etal = ',<em> et al</em>';
                }
                else if(n.nodeValue !== ''){
                    var author = '';
                    // Get the author name
                    if(n.nodeType == 3){
                        author += n.nodeValue;
                    }else{
                        author += Meteor.fullText.traverseNode(n);
                    }

                    // trim author name
                    author = author.replace(/^\s+|\s+$/g, '');
                    if(author.length !== 0){
                        // if not empty node
                        authors.push(author);
                    }
                }
            }
        }

        // now join array
        if(authors.length == 2){
            authors = authors.join(' and ');
        }else if(authors.length > 2){
            authors = authors.join(', ');
        }else if(authors.length > 1){
            authors = authors.join('');
        }

        authors += etal;

        return authors;
    },
    traverseTable: function(node,footerFlag){
        // console.log('-----------------------traverseTable');
        // TODO: make this more general for traversing all nodes, not just table
        // TODO combine label and title
        // TODO: remove footerFlag. Used to add label to table footers.
        var tableString = '',
            tableHeading = '',
            tableFooter = '',
            tableLabel = '',
            tableTitle = '',
            tableCaption = '';
        for(var c = 0 ; c < node.childNodes.length ; c++){
            var elAttr;

            var n = node.childNodes[c];
            // Start table el tag
            var elType = n.localName;

            // console.log(elType);
            if(elType !== null){
                elType = Meteor.fullText.fixTableTags(elType);
            }
            if(elType !== null && elType != 'title' && elType != 'label' && elType != 'caption' && elType != 'table' && elType != 'table-wrap-foot' && elType != 'xref' && elType != 'graphic' && elType != 'break' && elType != 'list' ){
                // table tag added in sectionToJson()
                if(n.attributes){
                    elAttr = Meteor.fullText.traverseAttributes(n.attributes);
                }

                //Open tag
                // footnote tags, use td instead for HTML table
                if(elType === 'fn'){
                    elType = 'td';
                    if(!elAttr.colspan){
                        elAttr.colspan = '100';
                    }
                }
                tableString += '<' + elType;

                //Colspan
                if(elAttr && elAttr.colspan){
                    tableString += ' colspan="' + elAttr.colspan + '"';
                }

                //rowspan
                if(elAttr && elAttr.rowspan){
                    tableString += ' rowspan="' + elAttr.rowspan + '"';
                }

                //id
                if(elAttr && elAttr.id){
                    tableString += ' id="' + elAttr.id + '"';
                }

                tableString += '>';
                if(footerFlag && tableLabel){
                    tableString += tableLabel + ' '; //temporary. Would like to not handle table footer labels this way.
                }
            }
            // do not combine with elseif, because we need to still close tag via code below

            if(elType == 'label'){
                // Table Title - part one, or footer
                tableLabel = Meteor.fullText.traverseTable(n).table;
            }
            else if(elType == 'caption'){
                // Table Title - part three
                // do not use traversing functions. problem keeping title separate
                for(var cc = 0; cc < n.childNodes.length; cc++){
                    if(n.childNodes[cc].localName == 'title'){
                        tableTitle = Meteor.fullText.convertContent(n.childNodes[cc]);
                    }
                    else if(n.childNodes[cc].localName == 'p'){
                        tableCaption += Meteor.fullText.convertContent(n.childNodes[cc]);
                    }
                }
                if(tableLabel.indexOf('.') == -1){
                    tableLabel = tableLabel + '.';
                }
                tableHeading = '<h4>' + tableLabel + ' ' + tableTitle + '</h4>';
                if(tableCaption){
                    tableHeading += '<p>' + tableCaption + '</p>';
                }
                tableTitle = tableHeading;
            }
            else if(elType == 'table-wrap-foot'){
                tableFooter += Meteor.fullText.traverseTableFooter(n);
            }
            else if(elType == 'xref'){
                tableString += Meteor.fullText.linkXref(n);
            }
            else if(elType === 'list'){
                tableString += Meteor.fullText.convertList(n);
            }
            else if(elType != 'graphic'){
                // console.log(elType);
                // Table content
                if(n.nodeType == 3 && n.nodeValue && n.nodeValue.replace(/^\s+|\s+$/g, '').length != 0){
                    // text node, and make sure it is not just whitespace
                    var val = Meteor.fullText.fixTags(n.nodeValue);
                    if(val){
                        tableString += val;
                    }
                }
                else if(n.childNodes){
                    tableString += Meteor.fullText.traverseTable(n).table;
                }

                // Close table el tag
                if(elType != null && elType != 'title' && elType != 'label' && elType != 'caption' && elType != 'table' && elType != 'table-wrap-foot' && elType != 'break'){
                    tableString += '</' + elType + '>'
                }
                else if(elType === 'break'){
                    tableString += '<br/>';
                }
            }
        }

        return {table: tableString, title: tableTitle, footer: tableFooter};
    },
    traverseTableFooter: function(n){
        // console.log('..traverseTableFooter');
        var string = '';
        string += '<tfoot>';

        for(var c=0; c < n.childNodes.length ; c++){
            if(n.childNodes[c].nodeName == 'fn'){
                var elId;
                if(n.childNodes[c].attributes){
                    for(var attr in n.childNodes[c].attributes){
                        if(n.childNodes[c].attributes[attr].name === 'id'){
                            elId = n.childNodes[c].attributes[attr].nodeValue;
                        }
                    };
                }
                string += '<tr><td colspan="100"';
                if(elId){
                    string += ' id="'+elId+'"';
                }
                string += '>';
                // string += Meteor.fullText.traverseTable(n.childNodes[c],true).table;

                for(var cc=0; cc<n.childNodes[c].childNodes.length; cc++){
                    var foot;
                    if(n.childNodes[c].childNodes[cc].localName === 'label'){
                        string += '<sup>';
                    }
                    string += Meteor.fullText.removeParagraphTags(Meteor.fullText.convertContentChild(n.childNodes[c].childNodes[cc]));
                    if(n.childNodes[c].childNodes[cc].localName === 'label'){
                        string += '</sup> ';
                    }
                }

                string += '</td></tr>';
            }else if(n.childNodes[c].nodeName == 'p'){
                string += '<tr><td colspan="100">';
                string += Meteor.fullText.convertContent(n.childNodes[c]);
                string += '</td></tr>';
            }
        }
        string += '</tfoot>';
        return string;
    },
    traverseNode: function(node){
        var string = '';
        if(node.childNodes){
            for(var c = 0 ; c < node.childNodes.length ; c++){
                // console.log('..'+c);

                var n = node.childNodes[c];
                if(n.nodeType == 3 && n.nodeValue && n.nodeValue.replace(/^\s+|\s+$/g, '').length != 0){
                    // console.log(n.nodeValue);
                    string += n.nodeValue + ' ';
                }else{
                    string += Meteor.fullText.traverseNode(n);
                }
            }
        }

        return string;
    },
    fixTags: function(content){
        // console.log('...fixTags',content);
        // Either object or string.
        // Figures are the only one with content array containing objects instead of strings
        // using this function also in XML processing of keywords
        if(typeof content == 'string'){
            // style tags
            content = content.replace(/<italic>/g,'<i>');
            content = content.replace(/<\/italic>/g,'</i>');
            content = content.replace(/<bold>/g,'<b>');
            content = content.replace(/<\/bold>/g,'</b>');
            content = content.replace(/<break\/>/g,'<br/>');
            content = content.replace(/<underline>/g,'<u>');
            content = content.replace(/<\/underline>/g,'</u>');

            // remove deprecated
            content = content.replace(/<fn>/g,'');
            content = content.replace(/<\/fn>/g,'');
        }else{
            // figures
            if(content.label){
                var label = Meteor.fullText.fixTags(content.label);
                content.label = label;
            }
            if(content.title){
                var title = Meteor.fullText.fixTags(content.title);
                content.title = title;
            }
            if(content.caption){
                var cap = Meteor.fullText.fixTags(content.caption);
                content.caption = cap;
            }
        }
        return content;
    },
    fixTableTags: function(content){
        // console.log('...fixTableTags',content);
        // separate from fixTags because we will be passing the node name, not with <>, because we don't want to globally replace 'bold' in table or 'italic',
        // just in case they are actually within the text
        if(typeof content == 'string'){
            // style tags
            content = content.replace(/italic/g,'i');
            content = content.replace(/\/italic/g,'/i');
            content = content.replace(/bold/g,'b');
            content = content.replace(/\/bold/g,'/b');
            content = content.replace(/underline/g,'u');
            content = content.replace(/\/underline/g,'u');
        }
        return content;
    },
    fixSectionTitle: function(str) {
        var casePattern = /(INTRODUCTION|RESULTS|DISCUSSION|METHODS|CONCLUSION)/;
        var suppCasePattern = /(SUPPLEMENTAL|SUPPLEMENTARY|Supplementary|Supplemental|SUPPLEMETAL)/;
        if(str){
            if(str.match(/(MATERIALS AND METHODS)/)){
                str = 'Materials and Methods';
            }
            else if(str.match(casePattern)){
                str = str.toLowerCase();
                str = str.charAt(0).toUpperCase() + str.slice(1);
            }
            else if(str.match(suppCasePattern)){
                str = 'Supplementary Materials';
            }
            else if(str.match(/EXPERIMENTAL PROCEDURES/i)){
                str = 'Materials and Methods';
            }
            else if(str.match(/FUTURE PERSPECTIVES/)){
                str = 'Future Perspectives';
            }
        }
        return str;
    },
    removeParagraphTags: function(content){
        return content.replace(/<\/p>/g,'').replace(/<p>/g,'');
    }
}
