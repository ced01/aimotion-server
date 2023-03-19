const utils = require("./utils");

/**
 * Method which matches the words of the input str with the words into 
 * the feeling props into feelings obj variable. If the words match completely/partialy 
 * we increment the score accordingly.
 * @param {Object} params 
 */

const giveEmotionalScoreToStr = ( { ...params } ) => {
    //console.log(params.score);
    let max   = utils.findMaxInNumberObj(params.feelings[params.emotion].words);
    params.strSplitted.forEach(( word ) => {  
        if( params.feelings[params.emotion].words[word] ){
            // equality match 
            let scoreValue = params.score[params.emotion] + (params.points.equalityMatch * params.feelings[params.emotion].words[word]);
                params.score[params.emotion] = scoreValue;

            if( params.feelings[params.emotion].words[word] < max ) {
                params.feelings[params.emotion].words[word] = params.feelings[params.emotion].words[word] + 1;
            }
            
        } else {
            /* manage strong abreviation : strWordLimitLength */
            if( word.length >= params.strWordLimitLength ){
                for(const wordToMatch in params.feelings[params.emotion].words ){
                    if( word.includes(wordToMatch) ){
                        //include match
                        //console.log(word);
                        //console.log(wordToMatch);
                        let scoreValue = params.score[params.emotion] + (params.points.includeMatch * params.feelings[params.emotion].words[wordToMatch]);
                        params.score[params.emotion] = scoreValue;
                    }
                }
            }
        }
    });
}

/**
 * Format potential emotion detected from an str to an obj with a property point computing the 
 * points of the str for each emotion
 * @param {Object} params 
 */

const formatEmotionalScore = ( { ...params } ) => {
    let res = [];
    for( const emotion in params.scores ) {
        res.push({ name : emotion, score: params.scores[emotion], points : params.scores[emotion] * params.feelings[emotion].points });
    }
    return res;
}

/**
 * Method detect which call giveEmotionalScoreToStr which attribute a feeling to the sentence given as input
 * The score is then formated by formatEmotionalScore. The method returns an array including the score/number
 * of match from the word saved in the feelings variable from txt files. The str is then stored in the feelings 
 * variable according to a matching acceptance percentage based on the str length. The longer the str is, 
 * lower the acceptance percentage is but never under 50 %
 * 
 * @param {Object} feelings 
 * @param {String} str 
 * @param {Object} mpoints 
 */

const detect = ( feelings = {}, str = "", mpoints = {} ) => {

    let score = {}, 
        strSplitted = str.split(" "),
        strWordLimitLength = 3;
        
    for( const prop in feelings ){
        score[prop] = 0;
        /* Check the arrays of words and increments the score accordingly */
        giveEmotionalScoreToStr({
            emotion: prop,
            feelings: feelings, 
            strSplitted: strSplitted, 
            score: score,
            points: mpoints,
            strWordLimitLength: strWordLimitLength 
        });
    }
    /* Logging informative values */
    console.log("Score for each potential feeling of the sentence: ", score);
    return formatEmotionalScore({feelings : feelings, scores : score});
}

/** Function/module export */
module.exports = {
    detect : detect
};