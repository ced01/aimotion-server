const utils = require('./utils');
const mzfs = require('mz/fs');
const files = require('./files');

/**
 *  Method save called in order to read a specific data file and to write a part of it into an other file. 
    The data file have the stored sentences from the past main program executions.
    The txt file takes only specific valuable words from the data file, and we are taking the words with the strongest occurences.
    To be precise the ones which have an occurence higher or equal of the word, which have the maximum of occurence, minus a percentage of it. 
    The words belonging to the feeling and that range are saved into a dedicated txt file.

 * @param {Object} winnersFeelingInstr
 * @param {Object} feelings 
 * @param {String} filesToReadDirectory 
 * @param {String} outputFileDirectory 
 * @param {String} format 
 * @param {String} ext 
 * @param {String} separator 
 * 
 */

const save = async ( { ...filesParam }, emotionalWinners = [], str = "", separator = "_" ) => {
    let wordsToSave = [],
        strSplitted = str.split(" "),
        w = 0,
        o = 0,
        valuableLength = 6,
        valuableSecondLength = 5,
        refWords = null;
    
    await mzfs.readFile( filesParam.outputFileDirectory + emotionalWinners[0].emotion + filesParam.outputFileExt,filesParam.format).then(async (content) => {
        try {
            refWords = JSON.parse(content);
        } catch (e){
            console.log(e);
        }
    });

    let firstRefWordOccurence = refWords[Object.keys(refWords)[0]];

    // For existing refWords found in string, let increase their occurence else let push them into wordToSave 
    for( let i = 0; i < strSplitted.length; i++ ){
        if(refWords && refWords[strSplitted[i]]){
            refWords[strSplitted[i]] = refWords[strSplitted[i]] + 1;
        }
    }
    /** let also find the ( valuable/has to be save ) words into data files */
    try {
        await utils.asyncForEach( emotionalWinners, async winner => {
            await mzfs.readFile( filesParam.filesToReadDirectory + winner.emotion + filesParam.filesToReadExt, filesParam.format).then((fileContent) => {
                //initialize wordToSave with the word of the sentence 
                //Let find the occurences for the word found in the data and accoding to the winner 
                let globalDataArr = fileContent.replace(/_+/g, '_').split(separator).filter(word => word.length >= valuableLength ), 
                    arrWithOccurences = utils.findOccurences(globalDataArr);
                    occurences = arrWithOccurences[1],
                    max = Math.max(...occurences.slice(1)),
                    min = occurences.length !== 0 ? (max * (1 - (40/100))) : 1;
                   
                // If the word has an occurence greater than the referential key word 
                for( o = 0; o < occurences.length; o++ ) {
                    if( min <= occurences[o] && !refWords[arrWithOccurences[0][o]] ){
                        wordsToSave.push({ word : arrWithOccurences[0][o], occur : occurences[o] < firstRefWordOccurence ? occurences[o] : firstRefWordOccurence - 1  });
                    }
                }
                //console.log(wordsToSave[winner.emotion]);
            });
            w++;
        }).then(async () => {
            // let write the data in the dedicated folder if it is not already in the file
           
            let modificationToJsonBrought = false;
            let wordToSave = ""; 
            for( let w = 0; w < wordsToSave.length; w++ ) {
                wordToSave = wordsToSave[w].word;
                if( !refWords[wordToSave] ){
                    let isAbrev = utils.findAbrev(wordsToSave[w],refWords,valuableSecondLength);
                    if(!isAbrev){
                        modificationToJsonBrought = true;
                        refWords[wordsToSave[w].word] = wordsToSave[w].occur;
                    }else {
                        console.log("Abreviation found with: " + wordsToSave[w].word);
                    }
                }
            }
            if( modificationToJsonBrought ){
                await files.write(JSON.stringify(refWords), filesParam.outputFileDirectory + emotionalWinners[0].emotion + filesParam.outputFileExt);
            }
        });
    }catch (e) {
        console.log(e);
    }
}

/**
 * Method called analyse dedicated to find word occurences into emotion files, like human 
 * do when they have sort their emotion and to set ideas and word into right places 
 * of their memory, inconsious work done. For the system case it is deleted a word 
 * which occur too much into the "brain". 
 * @param {Object} param
 * @param {Object} emotions 
 */

const analyse = async ( { ...param }, emotions ) => {
    let fils = {};
    
    await utils.asyncForEach( emotions, async ( emo ) => {
        let content = await files.read(param.filesToReadDirectory + emo + param.filesToReadExt, param.format);
        fils[emo] = content ? JSON.parse(content) : {};
    });

    let goccurence = await files.read("./file/emotions/recurrences.json", param.format);
    goccurence = !goccurence ? {} : JSON.parse(goccurence);

    // Let count overall occurence of a word
    // first loop on each emotion content 
    for( const filsContent in fils ) {
        let words = Object.keys(fils[filsContent]);
        words.forEach(( word )=> {
            // for each word we do a second loop  
            for( const secondFilsContent in fils ) {
                if( secondFilsContent !== filsContent ) {
                    let secondWords =  Object.keys(fils[secondFilsContent]);
                    secondWords.forEach(( sword )=> {
                        if( word === sword) {
                            if( !goccurence[word] ) {
                                goccurence[word] = 1;
                            }else {
                                goccurence[word] = goccurence[word] + 1;
                            }
                        }
                    });
                }
            }
        });
    }
    //Let delete the word from file contents if its global occurence
    for( const word in goccurence ) {
        for( const emotion in fils ) {
            let wordsFromFile = Object.keys(fils[emotion]);
            wordsFromFile.forEach(( wordFromFile )=> {
                if( wordFromFile === word && goccurence[word] >= 4 && fils[emotion][word] !== utils.findMaxInNumberObj(fils[emotion])){
                    delete fils[emotion][word];
                }
            });
        }
    }
    await files.write( JSON.stringify(goccurence),"./file/emotions/recurrences.json", param.format );
    for( const emotion in fils ) {
        await files.write( JSON.stringify(fils[emotion]), param.filesToReadDirectory + emotion + param.filesToReadExt, param.format );
    }
}

module.exports = {
    save:save,
    analyse:analyse
};