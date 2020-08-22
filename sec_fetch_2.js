var module_path = "C:\\Users\\E\\AppData\\Roaming\\npm\\node_modules\\";
const fs = require('fs');
var request = require(module_path+'request');


//var url = "https://www.adviserinfo.sec.gov/IAPD/content/ViewForm/crd_iapd_stream_pdf.aspx?ORG_PK=168026";
var pdfurlglobal = "https://www.adviserinfo.sec.gov/IAPD/content/ViewForm/crd_iapd_stream_pdf.aspx?ORG_PK=168026";
var pdfUrlglobal = pdfurlglobal;
//var dest = "C:\\reposit\\secfetchadv\\something.pdf";

//====================================================================

var events = require('events');
var eventEmitter = new events.EventEmitter();

/*
//Create an event handler:
var myEventHandler = function () {
  console.log('I hear a scream!');
}

//Assign the event handler to an event:
eventEmitter.on('scream', myEventHandler);

//Fire the 'scream' event:
eventEmitter.emit('scream');
*/

//====================================================================

//var pdfParser = require(module_path+'pdf2json');
var PDFParser = require(module_path+"pdf2json/PDFParser");
//var pdfUrl = 'somepdf.pdf'
var pdfParser = new PDFParser();  //PREVIOUS

//var pdfPipe = new events.EventEmitter();


//=====================================================================

//  EDIT THESE VALUES AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
//    EDIT HERE FOR NEW AREAAAAAAA!!!!!!!!!!!!!

var outputPath = "C:\\reposit\\secfetchadv\\ohio\\";
var OUTPUT_FILENAME = "FINAL_OHIO_FIRMSOBJ.json";
//var INTAKE_FILE = "ohio_firms_for_search.json";
var INTAKE_FILE = OUTPUT_FILENAME;  //ONLY USE IF the original process gets inturrupted. COMMENT OUT THE ABOVE LINE IF SO. 

//==============================================

//var origFirmData = fs.readFileSync(outputPath+OUTPUT_FILENAME, "utf8");   //AFTER INITIAL
var origFirmData = fs.readFileSync(outputPath+INTAKE_FILE, "utf8");  //INITIAL 
var firmsObj = JSON.parse(origFirmData);
//console.log(firmsObj);

//==================================================================

var globalNodeList = [];
var globalNodeCounter = 0;  //start
var GLOBAL_LIMITER = 5;   //end??? not used in the code

for (node in firmsObj) {
    if (firmsObj[node]["Telephone"] == undefined) {
        var crd = firmsObj[node]["CRD"];
        var pdf_url = "https://www.adviserinfo.sec.gov/IAPD/content/ViewForm/crd_iapd_stream_pdf.aspx?ORG_PK="+crd;
        firmsObj[node]["ADV_URL"] = pdf_url;
        globalNodeList.push([node, crd, pdf_url]);
    }
}

//[name-in-object], [crd number (string)], [pdf_url]

//fs.writeFile(outputPath+"globalArray.json", JSON.stringify({globalNodeList},null,2));

function getCurrNode() {
    return(globalNodeList[globalNodeCounter][0]);
}

function loadTheNextPdf(starting) {
    if (!starting) globalNodeCounter++;
    if (globalNodeCounter >= globalNodeList.length) {
        fs.writeFileSync(outputPath+OUTPUT_FILENAME, JSON.stringify(firmsObj,null,2));
        return(false);
    }
    console.log("=========================================");
    console.log("About to load Node "+globalNodeCounter+" out of "+globalNodeList.length);
    var node1 = globalNodeList[globalNodeCounter][0];
    console.log("NAME:   "+firmsObj[node1]["name"]);
    console.log("CRD:   "+firmsObj[node1]["CRD"]);
    var pdfurl = globalNodeList[globalNodeCounter][2];
    console.log(pdfurl);

    fs.writeFileSync(outputPath+OUTPUT_FILENAME, JSON.stringify(firmsObj,null,2));
    //pdfParser.loadPDF(pdfurl + "");
    doThePDFLoadStuff(pdfurl);    

    console.log("Just called to load the pdf...");
    return(true);
}


//Create an event handler:
var myEventHandler = function () {
  console.log('This is event handler: moving onto next one.');
  //loadTheNextPdf(false);
  setTimeout(loadTheNextPdf,100,false);
  console.log('end of event handler');
}

//Assign the event handler to an event:
eventEmitter.on('NEXT_ONE', myEventHandler);
//Fire the event:
//eventEmitter.emit('NEXT_ONE');


//START THE ENGINES....
loadTheNextPdf(true);

//====================================================================





//doThePDFLoadStuff(pdfurlglobal);

/*
function(query, callback) {
  myApi.exec('SomeCommand', function(response) {
    // other stuff here...
    // bla bla..
    callback(response); // this will "return" your value to the original caller
  });
}
*/

function doThePDFLoadStuff(pdfUrl) {
    console.log("beginning of the pdfload function");
    pdfParser = new PDFParser();
    pdfPipe = request({url: pdfUrl, encoding:null}).pipe(pdfParser);

    pdfPipe.on("pdfParser_dataError", function(err) {
        console.error("PDF PARSER DATA ERROR THROW: ");
        console.error(err);
    });
    pdfPipe.on("pdfParser_dataReady", function(pdf) {
        console.log("pdf data ready! :DDD");
        //let pdf = pdfParser.getMergedTextBlocksIfNeeded();
        //console.log(pdfParser.getAllFieldsTypes());
        //fs.writeFile("something.json", JSON.stringify(pdf,null,2));
        //console.log(pdfParser.getRawTextContent());
        //fs.writeFile("sometext.txt", pdfParser.getRawTextContent());

        //0) make sure it worked and that this PDF object is legit
        try {
            var booty = pdf["formImage"]["Pages"].length;
            console.log("Verifying the page length: "+booty);
        } catch (err) {
            console.log(err);
            console.log("ERROR? Couldn't get page length. ");
        }

        //1) clean the object
        pdf = cleanThePdfObj(pdf);
        console.log("pdf cleaned.");
        //2) extract info from the pdf object into the global firm object
        extractInfoFromPages(pdf);
        //3) save the pdf object to file
        savePDFObjectToFile(pdf);
        console.log("pdf now saved to file.");
        //4) go to the next one!
        console.log("step 4: about to call callback.");
        //eventEmitter.emit('NEXT_ONE');
        //console.log(callback);
        //callback();
        eventEmitter.emit('NEXT_ONE');
        console.log("finished step 4: AFTER calling callback.");
        return(true);
    });
    
    console.log("END of the pdfload function");
}

//var pdfPipe = request({url: pdfUrl, encoding:null}).pipe(pdfParser);  
//ABOVE LINE: PREVIOUS

/*
pdfPipe.on("pdfParser_dataError", err => console.error(err) );
pdfPipe.on("pdfParser_dataReady", pdf => {
	let usedFieldsInTheDocument = pdfParser.getAllFieldsTypes();
	console.log(usedFieldsInTheDocument)
});
*/


/*
pdfPipe.on("pdfParser_dataError", err => console.error(err) );
pdfPipe.on("pdfParser_dataReady", pdf => {
    console.log("pdf data ready! :DDD");
    //let pdf = pdfParser.getMergedTextBlocksIfNeeded();
    //console.log(pdfParser.getAllFieldsTypes());
    //fs.writeFile("something.json", JSON.stringify(pdf,null,2));
    //console.log(pdfParser.getRawTextContent());
    //fs.writeFile("sometext.txt", pdfParser.getRawTextContent());

    //0) make sure it worked and that this PDF object is legit
    try {
        var booty = pdf["formImage"]["Pages"].length;
        console.log("Verifying the page length: "+booty);
    } catch (err) {
        console.log(err);
        console.log("ERROR? Couldn't get page length. ");
    }

    //1) clean the object
    pdf = cleanThePdfObj(pdf);
    console.log("pdf cleaned.");
    //2) extract info from the pdf object into the global firm object
    //
    //3) save the pdf object to file
    savePDFObjectToFile(pdf);
    console.log("pdf now saved to file.");
    //4) go to the next one!
    loadTheNextPdf(false);
});
*/

//pdfParser.loadPDF(pdfurl + "");

//====================================================================
/*
    - load pdf file
    - clean it
    - extract info => add info to global firm object
    - load the next pdf file
    - if no more to load, execute end-of-script write-to-file functions

*/


/*
1) narrow down the firms from existing list
	- only IAs without SEC numbers, and less than 10 branches
2) run the pdf2json code to fetch the pdf from internet
2a) clean the JSON
3) extract what is needed from the JSON, add it to the main JSON objects
4) SAVE the JSON (with CRD number in file name)
5) move onto the next one...

End) stringify and write the updated firm-object to file
End) compile that firm-object to a CSV file. 

*/


//====================================================================
function convertPageToString(obj, page) {
    if ((page >= 0) && (page < obj["formImage"]["Pages"].length)) {
        var tempString = "";
        var pageString = "";
        for (j = 0; j < obj["formImage"]["Pages"][page]["Texts"].length; j++) {
            tempString = obj["formImage"]["Pages"][page]["Texts"][j]["R"];
            tempString = tempString.trim();
            pageString = pageString+tempString+" ";
        }
        return(pageString);
    } else {
        return("");
    }
}

function givenArrayFindString(array, str, method) { //"cumulative" or "one-line"
    //given array and string, find the line at which the string exists. 
    //"one-line" means the string should be on one line ONLY. "cumulative" means the string might be spread across 1+ lines
    //string finding always determines whether the string is WITHIN, not checking for exact equivalence. 
    var totalString = "";
    for (var i = 0; i < array.length; i++) {
        if (method == "cumulative") {
            totalString = totalString+" "+array[i];
        } else {
            totalString = array[i];
        }
        if (totalString.indexOf(str) != -1) {
            return(i);
        }
    }
    return(0);
}

function extractMainContact(ary) {  //return object of information for the CRD number
    //find main contact
    console.log("Start extraction for Main Contact.");
    var start_1 = givenArrayFindString(ary, "STATE-REGISTERED INVESTMENT ADVISER EXECUTION PAGE", "one-line");
    var start_2 = givenArrayFindString(ary, "Execution Pages", "one-line");
    var start = Math.max(start_1, start_2);
    start = start_2;
    //console.log(ary.length);
    //console.log(start);
    ary = ary.slice(start);
    //console.log(ary.length);
    var start2 = givenArrayFindString(ary, "Printed Name:", "one-line");
    //console.log(start2);
    var count = 1;
    if (ary[start2+count] == undefined) {
        return({"MainContact":"UN_DEFINED"});
    } else if (ary[start2+count].indexOf("Title") != -1) {
        //start2 = givenArrayFindString(ary.slice(start_1), "Printed Name:", "one-line");
    }
    while (ary[start2+count].indexOf("Printed Name") != -1) { count = count+1; }
    //console.log(ary[start2+count]);
    console.log("End of Main Contact function.")
    return(ary[start2+count]);
}

function extractOldestDate(ary) {
    //
    //"Direct Owners and Executive Officers"
    //then all "12/4567" matches
    //choose oldest date based on year, get their {fullName} and {title}
    console.log("Start extraction for Oldest Owner/Officer: ");
    var start_2 = givenArrayFindString(ary, "Direct Owners and Executive Officers", "one-line");
    //"Acquired MM/YYYY"
    //var start_2 = givenArrayFindString(ary, "Acquired MM/YYYY", "one-line");  //THIS IS AN UNRELIABLE REFERENCE, MAY BE ON MULTIPLE LINES
    //if (start_2 < start_1) start_2 = start_1;  //use the other reference instead if this happens. 

    //attempt to set an end-index goal. 
    var end_index = givenArrayFindString(ary, "Complete Schedule B only", "one-line");
    if (end_index < start_2) end_index = start_2 + 100;

    //search for all lines matching things that look like dates 
    var counter1 = 1;
    var dates = []; 
    var oldestYear = -10;
    while (counter1 < (end_index - start_2)) {
        var line = ary[start_2+counter1];
        if ((line.length == 7) && (line.charAt(2) == "/")) {  //this is a date. 
            var yearNumber = parseInt(line.substring(3));
            if (yearNumber > oldestYear) { oldestYear = yearNumber; }
            dates.push([line, yearNumber, start_2+counter1]);   //[string, yearAsNumber, indexInAry]
        }
        counter1 = counter1 + 1;
    }

    //dates have now been collected into {dates}. determine the oldest date. then get the corresponding {fullName} and {title}
    //return an object of this information. 
    for (var d = 0; d < dates.length; d++) {
        if (dates[d][1] == oldestYear) {
            //get {fullName} (3 before) and {title} (1 before)
            var indexRef = dates[d][2];
            var title = ary[indexRef-1];
            var fullName = ary[indexRef-3];
            return({"Name": fullName, "Title": title, "DateString": dates[d][0], "YearNumeric": dates[d][1]});
        }
    }

    return("null_3");
}


function extractInfoFromPages(obj) {
    //0) execute the extractMainContact function. 
    //1) get the telephone number
    //2) get the AUM number
    var thenode = getCurrNode();
    var done = 0;
    var i = 0;

    var textArray = [];

    for (i = 0; i < obj["formImage"]["Pages"].length; i++) {
        for (j = 0; j < obj["formImage"]["Pages"][i]["Texts"].length; j++) {
            textArray.push(obj["formImage"]["Pages"][i]["Texts"][j]["R"]);
        }
    }

    //main contact find.
    firmsObj[thenode]["MainContact"] = extractMainContact(textArray);
    console.log("Main Contact: "+firmsObj[thenode]["MainContact"]);

    //date find
    firmsObj[thenode]["OldestOfficer"] = extractOldestDate(textArray);
    console.log("Numeric Year: "+firmsObj[thenode]["OldestOfficer"]["YearNumeric"]);

    //how far do you reach into the future? (+2) 
    //so subtract that from the following length of this for loop
    for (i = 0; i < textArray.length-3; i++) {
        var curr = textArray[i];
        var next = textArray[i+1];
        if (curr.indexOf("Telephone number at this location") != -1) {
            //found the telly
            firmsObj[thenode]["Telephone"] = next;
            console.log("TELEPHONE NUMBER: "+firmsObj[thenode]["Telephone"]);
            done++;
        }
        if (curr.indexOf("Total:") != -1) {
            if (next.indexOf("(c)") != -1) {
                firmsObj[thenode]["AUM"] = textArray[i+2];
                console.log("AUM: "+firmsObj[thenode]["AUM"]);
                done++;
            }
        }
        if (done >= 2) return(true);
    }


    /*
    //for each page (i): loop through all text nodes (j)
    for (i = 0; i < obj["formImage"]["Pages"].length; i++) {
        for (j = 0; j < obj["formImage"]["Pages"][i]["Texts"].length-3; j++) {
            var curr = obj["formImage"]["Pages"][i]["Texts"][j]["R"];
            var next = obj["formImage"]["Pages"][i]["Texts"][j+1]["R"];
            if (curr.indexOf("Telephone number at this location") != -1) {
                //found the telly
                firmsObj[thenode]["Telephone"] = next;
                console.log("TELEPHONE NUMBER: "+firmsObj[thenode]["Telephone"]);
                done++;
            }
            if (curr.indexOf("Total:") != -1) {
                if (next.indexOf("(c)") != -1) {
                    firmsObj[thenode]["AUM"] = obj["formImage"]["Pages"][i]["Texts"][j+2]["R"];
                    console.log("AUM: "+firmsObj[thenode]["AUM"]);
                    done++;
                }
            }
            if (done >= 2) return(true);
        }
    }
    */
}




//====================================================================
//for the main, global, aggregate firm-object
function writeFirmObjectToFile(object, filename) {
    fs.writeFile(outputPath+filename, JSON.stringify(object,null,2));
}

//for the JSONs of each individual firm's pdf
function savePDFObjectToFile(object) {
    //compile a name for the current node 
    var filename = "adv_"+globalNodeList[globalNodeCounter][1]+".json";
    fs.writeFile(outputPath+filename, JSON.stringify(object,null,2));
}


//====================================================================
function cleanThePdfObj(obj) {
    //delete unnecessary stuff. 
    for (i = 0; i < obj["formImage"]["Pages"].length; i++) {
        delete obj["formImage"]["Pages"][i]["Fills"];
        obj["formImage"]["Pages"][i]["Height"] = "Page "+(i+1);

        for (j = 0; j < obj["formImage"]["Pages"][i]["Texts"].length; j++) {
            delete obj["formImage"]["Pages"][i]["Texts"][j]["x"];
            delete obj["formImage"]["Pages"][i]["Texts"][j]["y"];
            delete obj["formImage"]["Pages"][i]["Texts"][j]["w"];
            delete obj["formImage"]["Pages"][i]["Texts"][j]["sw"];
            delete obj["formImage"]["Pages"][i]["Texts"][j]["clr"];
            delete obj["formImage"]["Pages"][i]["Texts"][j]["A"];

            //delete obj["formImage"]["Pages"][i]["Texts"][j]["R"][0]["S"];
            //delete obj["formImage"]["Pages"][i]["Texts"][j]["R"][0]["TS"];

            obj["formImage"]["Pages"][i]["Texts"][j]["R"] = (obj["formImage"]["Pages"][i]["Texts"][j]["R"][0]["T"]);
        }
    }
    //
    //decode the uri stuffs
    console.log("decoding from URIs...");
    for (i = 0; i < obj["formImage"]["Pages"].length; i++) {
        //console.log(obj["formImage"]["Pages"][i]["Texts"].length);
        for (j = 0; j < obj["formImage"]["Pages"][i]["Texts"].length; j++) {
            obj["formImage"]["Pages"][i]["Texts"][j]["R"] = decodeURIComponent(obj["formImage"]["Pages"][i]["Texts"][j]["R"]);
            //console.log(obj["formImage"]["Pages"][i]["Texts"][j]["R"]);
            //console.log(decodeURIComponent(obj["formImage"]["Pages"][i]["Texts"][j]["R"]));
        }
    }
    //remove the repeated entries. 
    console.log("Removing the repeated entries:");
    var prevlengthRs = obj["formImage"]["Pages"][0]["Texts"].length;
    for (i = 1; i < obj["formImage"]["Pages"].length; i++) {
        nextLengthRs = obj["formImage"]["Pages"][i]["Texts"].length;
        //the first X (prevlengthRs) entries from the previous one (i-1)
        //remove the first (prevlengthRs) entries from the current one
        obj["formImage"]["Pages"][i]["Texts"].splice(0,prevlengthRs);
        prevlengthRs = nextLengthRs;
    }
    //check entry lengths one final time 
    /*
    console.log("Checking entry lengths one last time: ");
    for (i = 0; i < obj["formImage"]["Pages"].length; i++) {
        console.log(obj["formImage"]["Pages"][i]["Texts"].length);
    }
    */
    //end
    return(obj);
}


//==================================================================================================================
//COMPILE THE COMPLETED OBJECT TO CSV FILE

//COPY THE FOLLOWING FUNCTION INTO TERMINAL. 

function compileFirmObjectToCSV(prt1, FULL_OUTPUT_FILE_PATH) {
    var totalString = "";
    var nameArray = ["Name", "AltName", "CRD", "MainContact", "IA", "Br", "Telephone", "OldestOfficer", "YearNumeric", "AUM", "AUM Numeric", "City", "ZipCode", "Branches", "ADV_URL", "Address String"];
    totalString = arrayToString(nameArray)+"\r\n";

    function arrayToString(ary) {
        //turn array into string, but remove the brackets
        var str = JSON.stringify(ary);
        var len = str.length;
        return(str.substring(1,len-1));
    };

    function buildStringFromArray(ary) {
        //add up array items into string with spaces between items 
        var len = ary.length;    var str1 = " ";
        for (var i = 0; i < len; i++) {
            str1 = str1+" "+ary[i];
        }
        return(str1.trim());
    };

    function convertAUMtoNumeric(str) {
        //remove every character that isn't a number from the string 
        if (str == undefined) return(-5);
        var finalNumber = "";
        str = str.split(""); //convert to array of characters
        for (var i = 0; i < str.length; i++) {
            if ("1234567890".indexOf(str[i]) != -1) {
                finalNumber = finalNumber+str[i];
            }
        }
        if (finalNumber == "") {
            return(-1);
        } else {
            return(Math.floor(finalNumber));
        }
    }

    var maincounter = 1;
    for (node in prt1) {
        //console.log(node);
        //console.log(prt1[node]);

        var nodeArray = [ prt1[node]["name"] ];
        if (prt1[node]["name"].toLowerCase() == prt1[node]["altname"].toLowerCase()) {
            nodeArray.push("");
        } else {
            nodeArray.push(prt1[node]["altname"]);
        }
        nodeArray.push(prt1[node]["CRD"]);
        nodeArray.push(prt1[node]["MainContact"]);
        nodeArray.push(prt1[node]["IA_b"]);
        nodeArray.push(prt1[node]["Br_b"]);
        nodeArray.push(prt1[node]["Telephone"]);
        //firmsObj[thenode]["OldestOfficer"]["YearNumeric"]
        nodeArray.push(prt1[node]["OldestOfficer"]["DateString"]);
        nodeArray.push(prt1[node]["OldestOfficer"]["YearNumeric"]);
        nodeArray.push(prt1[node]["AUM"]);
        nodeArray.push(convertAUMtoNumeric(prt1[node]["AUM"]));
        nodeArray.push(prt1[node]["city"]);
        if (prt1[node]["zip"] == "na") {
            nodeArray.push("");
        } else {
            nodeArray.push(prt1[node]["zip"]);
        }
        if (prt1[node]["branches"] == "na") {
            nodeArray.push(0);
        } else {
            nodeArray.push(Math.floor(prt1[node]["branches"]));
        }
        nodeArray.push(prt1[node]["ADV_URL"]);
        nodeArray.push(buildStringFromArray(prt1[node]["totalAddress"]));
        //console.log(nodeArray);
        //console.log(arrayToString(nodeArray));
        totalString = totalString + arrayToString(nodeArray)+"\r\n";

        //console.log(maincounter);
        maincounter++;
    }

    fs.writeFileSync(FULL_OUTPUT_FILE_PATH, totalString);
    console.log("Finished writing to CSV");
}

/*

//CHANGE THESE SO THAT THEY'RE THE SAME AS THE TOP OF THE SCRIPT
//COPY THESE VARS INTO THE TERMINAL. 

//==========================================================
var outputPath = "C:\\reposit\\secfetchadv\\ohio\\";
var OUTPUT_FILENAME = "FINAL_OHIO_FIRMSOBJ.json";
var CSV_OUTPUT_FILENAME = "ohio_firms_final.csv";
/////////

//ALSO COPY THIS FUNCTION INTO THE TERMIANL AND PRESS
//then execute:  dewit()

function dewit() {
    var firmdata = fs.readFileSync(outputPath+OUTPUT_FILENAME, "utf8");
    var firmobj = JSON.parse(firmdata);
    compileFirmObjectToCSV(firmobj, outputPath+CSV_OUTPUT_FILENAME);
}

//==========================================================
var firmdata = fs.readFileSync(outputPath+"FINAL_MD_FIRMSOBJ.json", "utf8");
var firmobj = JSON.parse(firmdata);
compileFirmObjectToCSV(firmobj, outputPath+CSV_OUTPUT_FILENAME);

*/

//====================================================================
//end of node script