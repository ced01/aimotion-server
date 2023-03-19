async function asyncForEach( array, callback ) {
    for ( let index = 0; index < array.length; index++ ) {
      await callback(array[index], index, array);
    }
}

const foo = (arr) => {
    let a = [],
    b = [],
    prev;

    arr.sort();
    for (var i = 0; i < arr.length; i++) {
    if (arr[i] !== prev) {
        a.push(arr[i]);
        b.push(1);
    } else {
        b[b.length - 1]++;
    }
    prev = arr[i];
    }
    return [a, b];
}

const sortPositiveNumberFromArr = (arr = []) => {
    return arr.sort((a,b) => b-a);
}


const removeOccurence = (arr) => {
    let a = [],
    prev;
    arr.sort();
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] !== prev) {
            a.push(arr[i]);
        } 
        prev = arr[i];
    }
    return a;
}


const findAbrev = ( word, referentialWordsObj, minLength ) => {
    let sortReferentialWords = Object.keys(referentialWordsObj).sort();
    if( word >= minLength ){
        for( let i = 0; i < sortReferentialWords.length; i++ ) {
            return word.includes(sortReferentialWords[i]);
        }
    }
    return false;
}

const findMaxInNumberObj = (nbObj) => {
    let max = nbObj[Object.keys(nbObj)[0]];
    for (const key in nbObj) {
        if(max < nbObj[key]){
            max = nbObj[key];
        }
    }
    return max;
}

// Method only valid for mutable objs

const initNewProp = ( mutableObj, prop, value) => {
    if( !mutableObj[prop] ) {
        mutableObj[prop] = value;
    }
    return obj;
}

const detectPercentageOfInto = ( regexpArr = [], str = "" ) => {
    let l = 0, match = null; 
    regexpArr.forEach( el => {
        match = str.match(el);
        if( match ){
            console.log(match);
            l += match[0].length;
        }
    });
    return l/str.trim().length;
}

module.exports = {
    asyncForEach:asyncForEach,
    findOccurences:foo,
    removeOccurence:removeOccurence,
    sortPositiveNumberFromArr: sortPositiveNumberFromArr,
    findMaxInNumberObj: findMaxInNumberObj,
    findAbrev :findAbrev,
    initNewProp : initNewProp,
    detectPercentageOfInto : detectPercentageOfInto
};