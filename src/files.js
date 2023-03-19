const utils = require('./utils');
const mzfs = require('mz/fs');

const setFeelings = async (filesToReadDirectory = "./file/json", format = "utf-8", ext = ".json", jsonFile = './file/emotions/feelings.json' ) => {
    let emotionalContent = {}, feelings = {};
    try {
        let fileName = "";
        await mzfs.readdir(filesToReadDirectory).then(async (files) => {
            await utils.asyncForEach(files, async (file) => {
                await mzfs.readFile( filesToReadDirectory +'/'+ file,format).then((fileContent) => {
                    fileName = file.replace(ext, "");
                    if(emotionalContent[fileName] === undefined ){
                        emotionalContent[fileName] = [];
                    }
                    if(fileContent && fileContent.length !== 0){
                        //console.log("=====>",fileContent);
                        emotionalContent[fileName] = JSON.parse(fileContent);
                    }
                });
            });
        });
    } catch (error){
        console.log(error);
    }
    try {
        await mzfs.readFile(jsonFile).then((feelingsContent) => {
            feelings = JSON.parse(feelingsContent);
            for(const emotion in emotionalContent){
                feelings[emotion].words = emotionalContent[emotion];
            }
        });
    } catch (error) {
        console.log(error);
    }
    return feelings;
}

const setToData = async ( { ...param }, emotionalWinners, str = "", separator = "_") => {
    await utils.asyncForEach( emotionalWinners, async winner => {
        if( str !== "" ){
            //console.log(param.outputFileDirectory + winner.emotion + param.outputFileExt);
            await mzfs.readFile( param.outputFileDirectory + winner.emotion + param.outputFileExt,param.format).then(async (fileContent) => {
                if(!fileContent.includes(str.split(" ").join(separator))){
                    await write(fileContent + separator + str.split(" ").join(separator),param.outputFileDirectory + winner.emotion + param.outputFileExt);
                } else {
                    console.log("==> Str already analysed, and added to: " + winner.emotion + " try a new one" );
                }
            });
        }
    });
}

const generateJsonFromTxt =  async ({ ...param }, fileName) => {
    let object = {};
    (await read( param.filesToReadDirectory + fileName + param.ext, param.format)).split("_").forEach(( word ) => {
        if( !object[word.toLowerCase()] ){
            object[word.toLowerCase()] = 1;
        }
    });
    await append(param.outputFileDirectory, JSON.stringify(object));
}


const read = async ( path, format ) => {
    let content = "";
    await mzfs.readFile( path , format ).then((data) => {
        content = data;
    }, ( reject ) => {
        console.log(reject);
    });
    return content;
}

const write = async (content, path, format = "utf-8" ) => {
    await mzfs.writeFile( path, content, format).then(() => {
        //console.log("new " + path + " saved!");
    }, ( reject ) => {
        console.log(reject);
    });
}

const append = async ( path, data ) => {
    await mzfs.appendFile(path, JSON.stringify(data)).then(() => {
        //console.log('Fichier '+ fileName +'.json créer');
    }, ( reject ) => {
        console.log(reject);
    });
}


module.exports = {
    setFeelings:setFeelings,
    setToData:setToData,
    write:write,
    read:read,
    generateJsonFromTxt:generateJsonFromTxt
};