const express = require('express');
const app = express();
const cors = require('cors');
const synaptic = require('synaptic');
const Neuron = synaptic.Neuron,
      Layer = synaptic.Layer,
      Network = synaptic.Network,
      Trainer = synaptic.Trainer,
      Architect = synaptic.Architect;

const port = process.env.PORT || 5000;
const allowedOrigins = ['http://localhost:3000', 'http://aimotionfront.herokuapp.com'];

app.use(cors({
    origin: function(origin, callback){
        // allow requests with no origin 
        // (like mobile apps or curl requests)
        if(!origin) {
            return callback(null, true);
        }
        if( allowedOrigins.indexOf(origin) === -1 ){
            var msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    }
}));

const data = require('./src/data');
const emotion = require("./src/emotion");
const files = require('./src/files');
const utils = require('./src/utils');

const mpoints = { equalityMatch : 10, includeMatch : 1 };
const negationRegexp = [/(ne\b).*?(pas\b)/gi,/(ne\b).*?(\bplus\b)/gi,/(n'\b).*?(pas\b)/gi,/(n'\b).*?(plus\b)/gi,/(n'\b).*?(rien\b)/gi,/(ni\b).*?(ni\b)/gi,/(ne\b).*?(jamais\b)/, /(n'\b).*?(ni\b)/gi];
const gNegativePercentage = 0.15;
const removePunctuationRegexp = /[.,«»—'’\r\n\/#!$%\^&\*;:{}=\-_`~()]/g;

const txtToJsonParam = {
    filesToReadDirectory : "./file/data/", 
    outputFileDirectory : "./file/json/", 
    format : "utf-8", 
    filesToReadExt : ".txt",
    outputFileExt : ".json"
}

const jsonToDataParam = {
    filesToReadDirectory : "./file/json/", 
    outputFileDirectory : "./file/data/", 
    format : "utf-8", 
    filesToReadExt : ".json",
    outputFileExt : ".txt"
}

const initValue = { 
    angriness : {"colère":5,"haine":1,"fureur":1,"venger":1,"détester":1,"indignation":1,"rage":1,"irritation":1,"colérique":1,"emportement":1,"fureur":1,"ressentiment":1,"vengeance":1,"haine":1,"furie":1,"furieux":1,"dépit":1,"révolte":1,"courroux":1,"exaspération":1,"irascible":1,"rancune":1,"frustration":1,"bile":1,"foudre":1,"fulminant":1,"orgueil":1,"bouffée":1,"fâcher":1,"énervement":1,"mépris":1,"juron":1,"coléreux":1,"irascibilité":1,"rogne":1,"rancœur":1,"dégoût":1,"mécontentement":1,"menace":1,"animosité":1,"irritable":1,"irrité":1,"rageur":1,"violence":1,"agacement":1,"châtiment":1,"humiliation":1,"manifestant":1,"rager":1,"outré":1,"agressivité":1,"aigreur":1,"grogne":1,"représailles":1},
    brave : {"courage":5,"aventure": 1, "route": 1, "voyage":1,"braver":1, "bravoure":1,"vaillance":1,"force":1,"vertu":1,"audace":1,"persévérance":1,"témérité":1,"détermination":1,"générosité":1,"héroïsme":1,"héros":1,"courageux":1,"ténacité":1,"dévouement":1,"patience":1,"exploit":1,"lâche":1,"loyauté":1,"stoïcisme":1,"tempérance":1,"danger":1,"hardiesse":1,"sang-froid":1,"abnégation":1,"intrépidité":1,"volonté":1,"sacrifice":1,"soldat":1,"ennemi":1,"épreuve":1,"combat":1,"résolution":1,"brave":1,"courageusement":1,"gloire":1,"obstination":1,"adversité":1,"oser":1,"tenir tête":1,"guerrier":1,"valeur":1,"encourager":1,"héroïque":1,"prouesse":1,"zèle":1,"affronter":1,"persévérant":1,"valeureux":1,"virilité":1,"habileté":1,"indomptable":1,"braver":1,"combattant":1,"inébranlable":1,"supporter":1,"audacieux":1,"culot":1,"admirable":1,"aplomb":1,"héroïne":1,"magnanimité":1,"vaincu":1,"à toute épreuve":1,"assumer":1,"chevaleresque":1,"entreprendre":1,"férocité":1,"intrépide":1,"la tête haute":1,"persévérer":1,"hardi":1,"péril":1,"résistance":1,"surmonter":1,"cran":1,"dignité":1,"victoire":1},
    fear : {"peur":5,"angoisse":1,"fuir":1,"terreur":1,"effrayer": 1,"phobie":1,"panique":1,"crainte":1,"frousse":1,"trouille":1,"angoisse":1,"épouvante":1,"terreur":1,"anxiété":1,"frayeur":1,"cauchemar":1,"trac":1,"horreur":1,"pétoche":1,"claustrophobie":1,"frisson":1,"appréhension":1,"timidité":1,"flipper":1,"insécurité":1,"agoraphobie":1,"claustrophobe":1,"menace":1,"phobique":1,"amygdale":1,"avoir les chocottes":1,"craintif":1,"intimidation":1,"paranoïa":1,"vertige":1,"fuir":1,"araignée":1,"avoir les jetons":1,"couardise":1,"foutre les jetons":1,"hydrophobie":1,"obscurité":1,"hantise":1,"répulsion":1,"effrayant":1,"effroi":1,"frémir":1,"hanté":1,"effrayé":1,"hallucination":1,"inquiétude":1,"monstre":1,"sorcière":1,"arachnophobie":1,"serpents":1,"croque-mitaine":1,"ogre":1,"poltron":1,"affolement":1,"arachnophobe":1,"détresse":1,"anxieux":1,"apeuré":1,"craindre":1,"effraie":1,"enfer":1,"fantôme":1,"surnaturel":1,"hésitation":1,"loup-garou":1,"paralyse":1,"peureux":1,"chair de poule":1,"démon":1,"enfuir":1,"maléfique":1,"fuite":1,"pressentiment":1,"chier dans ses culottes":1,"chier dans son froc":1,"doute":1,"flip":1,"pisser dans son froc":1,"pleutrerie":1,"poltronnerie":1,"prémonition":1,"stupéfaction":1,"stupeur":1},
    humour : {"humour":5,"blague":1, "rire": 1, "drôle": 1,"rigoler":1,"humoriste":1,"ironie":1,"humoristique":1,"comique":1,"satire":1,"dérision":1,"rire":1,"satirique":1,"sarcasme":1,"fantaisie":1,"originalité":1,"absurde":1,"drôle":1,"sarcastique":1,"burlesque":1,"décapant":1,"sens de l humour":1,"verve":1,"humeur":1,"sérieux":1,"blague":1,"parodie":1,"tendresse":1,"caricature":1,"caustique":1,"pince-sans-rire":1,"légèreté":1,"insolite":1,"plaisanterie":1,"calembour":1,"potache":1,"gag":1,"farce":1,"cynisme":1,"dessin":1,"comédie":1,"émotion":1,"esprit":1,"ironique":1,"loufoque":1,"sens":1,"drôlerie":1,"malice":1,"moquer":1,"moquerie":1,"absurdité":1,"décalé":1,"autodérision":1,"sketch":1,"spectacle":1,"boutade":1,"bouffonnerie":1,"Desproges":1,"facétie":1,"canular":1,"pitrerie":1,"raillerie":1,"sourire":1},
    joy : {"joie":5,"fête" : 1,"content":1, "ami": 1,"manger" : 1,"société": 1, "allégresse":1,"bonheur":1,"émotion":1,"enthousiasme":1,"plaisir":1,"jubilation":1,"liesse":1,"réjouissance":1,"satisfaction":1,"joyeux":1,"gaieté":1,"euphorie":1,"félicité":1,"sérénité":1,"ravissement":1,"triomphe":1,"fierté":1,"hymne":1,"jubiler":1,"béatitude":1,"exaltation":1,"contentement":1,"délectation":1,"délice":1,"réjouir":1,"euphorique":1,"optimisme":1,"rayonnant":1,"aise":1,"extase":1,"fête":1,"joyeusement":1,"exulter":1,"soulagement":1,"acclamation":1,"épanouissement":1,"festin":1,"bienveillance":1,"surprise":1,"bien-être":1,"bienfait":1,"jouissance":1,"paix":1,"entrain":1,"gratitude":1,"plénitude":1,"réconfort":1,"savourer":1,"célébration":1,"amusement":1,"extatique":1,"radieux":1,"ami":1,"détente":1,"distraction":1,"divertissement":1,"émerveillement":1,"enchantement":1,"enjouement":1,"jovialité":1,"joyeuseté":1,"jubilatoire":1,"régal":1 },
    love : {"amour":5,"amoureux":1,"sexe" : 1, "aime" : 1, "amoureux":1,"tendresse":1,"baiser":1,"cupidon":1,"aphrodite":1,"passion":1,"éros":1,"amant":1,"affection":1,"idylle":1,"attirance":1,"érotique":1,"beauté":1,"adoration":1,"aimer":1,"altruisme":1,"amourette":1,"bien-aimé":1,"érotisme":1,"mariage":1,"romantique":1,"déesse":1,"luxure":1,"conjugal":1,"jalousie":1,"charnel":1,"sexualité":1,"dévotion":1,"amour platonique":1,"couple":1,"fidélité":1,"libertinage":1,"romantisme":1,"poésie":1,"sensualité":1,"sexuel":1,"romance":1,"épris":1,"hymen":1,"séduction":1,"bien-aimée":1,"passionné":1,"adultère":1,"passionnel":1,"sentimental":1,"adorable":1,"ardeur":1,"baise":1,"admiration":1,"charme":1,"coït":1,"époux":1,"ferveur":1,"accouplement":1,"amour maternel":1,"amoureusement":1,"coup de foudre":1,"vénération":1,"extase":1,"galanterie":1,"amante":1,"carquois":1,"fidèle":1,"chéri":1,"coquin":1,"fusionnel":1},
    sadness : {"triste":5,"solitude":1,"nostalgie" : 1,"morfondre" : 1, "mélancolie":1,"deuil":1,"chagrin":1,"nostalgie":1,"ennui":1,"désespoir":1,"triste":1,"amertume":1,"émotion":1,"larme":1,"mélancolique":1,"désolation":1,"dépression":1,"morne":1,"affliction":1,"solitude":1,"lassitude":1,"inquiétude":1,"malheur":1,"angoisse":1,"amer":1,"consternation":1,"désespérance":1,"regret":1,"spleen":1,"effroi":1,"pleurer":1,"blues":1,"déchirement":1,"désenchantement":1,"morosité":1,"idées noires":1,"accablement":1,"affligé":1,"morose":1,"peine":1,"adieu":1,"dépit":1,"drame":1,"incurable":1,"tourment":1,"contrition":1,"déception":1,"déprime":1,"lugubre":1,"lamentation":1,"abandon":1,"aigreur":1,"assombrissement":1,"attristé":1,"calamité":1,"contrit":1,"dépressif":1,"désabusement":1,"désœuvrement":1,"éplorement":1,"malaise":1,"maussaderie":1,"navrement":1,"sombreur":1,"souci":1,"tristounet":1,"vague à l'âme":1},
    serious : {"scientifique":5, "mathématique": 1,"autobiographie" : 1,"politique": 1, "science":1,"savant":1,"étude":1,"vulgarisation":1,"revue":1,"théorie":1,"chercheur":1,"psychologie":1,"biologie":1,"laboratoire":1,"ingénieur":1,"méthode":1,"physicien":1,"littéraire":1,"mission":1,"rigueur":1,"scientifiquement":1,"domaine":1,"institut":1,"rationnel":1,"chimie":1,"enseignement":1,"expérience":1,"mathématique":1,"problème":1,"expérimental":1,"philosophique":1,"expédition":1,"linguistique":1,"empirique":1,"hypothèse":1,"technologique":1,"connaissance":1,"déterminisme":1,"Nobel":1,"recherche scientifique":1,"naturaliste":1,"progrès":1,"théorique":1,"universitaire":1,"astronomie":1,"colloque":1,"évolution":1,"méthodique":1,"sociologie":1,"analyse":1,"empirisme":1,"expérimentation":1,"génétique":1,"géologie":1,"physique":1,"sociologue":1,"vulgarisateur":1,"exploration":1,"investigation":1,"physiologie":1,"NASA":1,"recherche":1,"sociologique":1,"technique":1,"chimiste":1,"didactique":1,"philosophie":1,"professeur":1,"rationaliste":1,"Symposium":1,"antarctique":1,"Aristote":1,"biologiste":1,"culturel":1,"évaluation":1,"explication":1,"fondement":1,"mathématicien":1,"médecine":1,"pédagogique":1,"pseudo-science":1,"sceptique":1,"université":1,"astronome":1,"astrophysique":1,"médicale":1,"méthodologie":1,"naturalisme":1,"scientisme":1,"discipline":1,"ingénierie":1,"observation":1,"spécialiste":1,"technicien":1,"consensus":1,"contribution":1,"Darwin":1,"homéopathie":1,"objectivité":1,"positivisme":1,"science-fiction":1,"archéologie":1,"astrophysicien":1,"culture":1,"Einstein":1,"épistémologie":1,"expert":1,"objective":1,"obscurantisme":1,"sismologie":1,"sujet":1,"théorie de l'évolution":1,"biologique":1,"CNRS":1,"démonstration":1,"futurologie":1,"généticien":1,"heuristique":1,"magnétisme":1,"Newton":1,"polytechnique":1,"rationalisme":1,"scientificité":1,"spéléologie":1,"thèse":1,"bacon":1,"comité":1,"éducation":1,"Humboldt":1,"intellectuelle":1,"Popper":1,"question":1,"spatial":1,"technologie":1,"découverte":1,"données":1,"épistémologique":1,"formation":1,"Galilée":1,"Kuhn":1,"méthodologique":1,"point de vue":1,"purement":1,"résultat":1,"spécimen":1,"conclusion":1,"critique":1,"croyance":1,"curiosité":1,"industriel":1,"méthode scientifique":1,"paradigme":1,"périodique":1,"psychanalyse":1,"publication":1,"rationalité":1,"réfutable":1,"abstrait":1,"cognitivisme":1,"explorateur":1,"humain":1,"lauréat":1,"muséum":1,"philologie":1,"positiviste":1,"rigoureux":1,"technocratie":1,"académie":1,"Adélie":1,"arabe":1,"Archimède":1,"aspic":1,"binôme":1,"botaniste":1,"CERN":1,"climatologue":1,"communauté scientifique":1,"compréhension":1,"Condorcet":1,"Descartes":1,"doctorat":1,"École normale supérieure":1,"esthétique":1,"humaniste":1,"métaphysique":1,"météorologie":1,"moléculaire":1,"observatoire":1,"promouvoir":1,"racisme":1,"télépathie":1,"travail":1,"vanillier":1,"vivisection":1,"Académie des sciences":1,"anthropologie":1,"approche":1,"artistiques":1,"bagage":1,"bonobo":1,"clonage":1,"comète":1,"cosmologie":1,"créationnisme":1,"esprit critique":1,"formalisation":1,"fusée":1,"géologue":1,"gynécologie":1,"héliocentrisme":1,"herbier":1,"Joliot-Curie":1,"kakapo":1,"Kepler":1,"orientation":1,"paléontologue":1,"percée":1,"réductionnisme":1,"théorème":1,"validité":1,"vérités":1,"vulgariser":1,"académique":1,"causalité":1,"classification":1,"concept":1,"conférencier":1,"division":1,"Duhem":1,"électrochimie":1,"éminent":1,"éthique":1,"ethnozoologie":1,"étudier":1,"filière":1,"Harvard":1,"historiques":1,"innocuité":1,"Lamarck":1,"Monsanto":1,"nom vernaculaire":1,"notion":1,"océanographie":1,"pluridisciplinaire":1,"rang taxinomique":1,"réfutation":1,"sociale":1,"articles":1,"astronomique":1,"Big Bang":1,"Cassini":1,"cerveau":1,"concordisme":1,"coopération":1,"effet placebo":1,"ESA":1,"évolutionnisme":1,"INRA":1,"monde":1,"postulat":1,"précision":1,"réfutabilité":1,"sigle":1,"thérapeutique":1,"astrologie":1,"atterrisseur":1,"base":1,"chimique":1,"complexité":1,"dinosaure":1,"homme de science":1,"preuve":1,"réchauffement":1,"télescope":1,"termes":1,"théologique":1,"affirmer":1,"Albert Einstein":1,"anthropocène":1,"chaire":1,"charlatanisme":1,"chronobiologie":1,"compliqué":1,"conception":1,"conseil":1,"constructeur":1,"créationniste":1,"critère":1,"darwinisme":1,"défiant":1,"détacher":1,"dubitatif":1,"encyclopédie":1,"érudit":1,"fortran":1,"fossile":1,"impartiale":1}
}

const resetMemory = async () => {
    for(const emo in initValue){
        await files.write("",jsonToDataParam.outputFileDirectory + emo + jsonToDataParam.outputFileExt,jsonToDataParam.format);
    }
}

const initialiseWordReferentiel = async () => {
    for(const emo in initValue){
        await files.write(JSON.stringify(initValue[emo]),txtToJsonParam.outputFileDirectory + emo + txtToJsonParam.outputFileExt,txtToJsonParam.format);
    }
}

const compare = ( valuablefillingDetected = [] ) => {

    let sumPoints = 0, 
        feelingSize = valuablefillingDetected.length,
        posEmotionalScores = [], 
        negEmotionalScores = [], 
        posEmotionalScoresCopy = []
        negEmotionalScoresCopy = []
        posfeelings = [], 
        negFeelings = [], 
        winner = 0,
        maxScore = 0,
        nbZero = 0;

    // Let check if every feeling points are equal to 0, the winner is other

    valuablefillingDetected.forEach((feeling) => {
        if(feeling.points){
            sumPoints += feeling.points;
            if( feeling.points > 0 ){
                posfeelings.push(feeling.name);
                posEmotionalScoresCopy.push(feeling.score);
                posEmotionalScores.push(feeling.score);
            } else {
                negFeelings.push(feeling.name);
                negEmotionalScoresCopy.push(feeling.score);
                negEmotionalScores.push(feeling.score);
            }
        }else {
            nbZero++;
        }
    });


    let posEmotionalSortedScore = utils.sortPositiveNumberFromArr(posEmotionalScores);
    let negEmotionalSortedScore = utils.sortPositiveNumberFromArr(negEmotionalScores);

    if( sumPoints > 0 ){

        maxScore = posEmotionalSortedScore[0];
        winner = posfeelings[posEmotionalScoresCopy.indexOf(maxScore)];

    }else if(sumPoints !== 0) {

        maxScore = negEmotionalSortedScore[0];
        winner = negFeelings[negEmotionalScoresCopy.indexOf(maxScore)];

    } else if ( sumPoints === 0 ){

        if( posEmotionalSortedScore[0] > negEmotionalSortedScore[0] ){
            maxScore = posEmotionalSortedScore[0];
            winner = posfeelings[posEmotionalScoresCopy.indexOf(maxScore)];
        } else {
            maxScore = negEmotionalSortedScore[0];
            winner = negFeelings[negEmotionalScoresCopy.indexOf(maxScore)];
        }
    }

    return { 
        informations : [
            {
                emotion : feelingSize !== nbZero ? winner : "other",  
                score : feelingSize !== nbZero ? maxScore : 0, 
            }
        ],
        gpoints : sumPoints 
    }
}

// IDEA : if str is longer than x, then cut the str and place the cutted parts into an array. 
// Run the find feeling method on the substrings of the array

const putFeelingOn = async (str) => {
    let res = null, negativePercentage = 0;
    await files.setFeelings().then(async (feelings)=> {
        //console.log("Feelings variables are filled");
        negativePercentage = utils.detectPercentageOfInto(negationRegexp," " + str + " ");
        let strFormated = str.replace(removePunctuationRegexp," ").replace(/ +/gi, " ").replace(removePunctuationRegexp," ").toLowerCase();
        let valuablefillingDetected = emotion.detect(feelings,strFormated,mpoints);
        /*** AND THE WINNER OF THE FEELINGS IS :*/
        let winners = compare(valuablefillingDetected);
        console.log("Winners informations and points ===> ", winners.informations,winners.gpoints);
        if( winners.informations[0].emotion !== "other" ) {
            await files.setToData(jsonToDataParam, winners.informations,strFormated);
            await data.save(txtToJsonParam,winners.informations,strFormated);
            await data.analyse(jsonToDataParam, Object.keys(feelings));
        }
        res = winners.informations[0];
    });
    return { negationPercentage : negativePercentage, informations : res };
}


let learnWithNovels = async () => {
    let content = (await files.read("./sentences/novels/data.txt", "utf-8"));
    let nb = 0,
    maxLength = 254,
    nbOfStringCanBeDoneFromContent = Math.round(content.length / maxLength),
    substringifyContent = [];
    results = [];
    while ( nb < nbOfStringCanBeDoneFromContent ) {
        substringifyContent.push(content.substring( nb * maxLength, maxLength * ( nb  + 1 ) ));
        nb++;
    }
    await utils.asyncForEach( substringifyContent, async (str) => {
        let found = await putFeelingOn(str);
        found.informations.emotion = found.negationPercentage >= gNegativePercentage ? "not " + found.informations.emotion  : found.informations.emotion;
        results.push({ str : str, res : found.informations });
    }).then(async () => {
        await files.write(JSON.stringify(results),"./file/test/results.json", "utf-8");
    });
}


app.get('/', (req, res) => {
    res.send('Hello World!')
});

app.get('/put-feeling-on', async (req, res) => {
    let emotionalContent = "no result";
    if(req.query.str){
        emotionalContent = await putFeelingOn(req.query.str);
    }
    res.send(emotionalContent);
});

function Perceptron(input, hidden, output) {
    // create the layers
    var inputLayer = new Layer(input);
    var hiddenLayer = new Layer(hidden);
    var outputLayer = new Layer(output);
 
    // connect the layers
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);
 
    // set the layers
    this.set({
        input: inputLayer,
        hidden: [hiddenLayer],
        output: outputLayer
    });
}

Perceptron.prototype = new Network();
Perceptron.prototype.constructor = Perceptron;

const testNeuralNetwork = () => {

    const myPerceptron = new Perceptron(2,100,1);
    const myTrainer = new Trainer(myPerceptron);

    myTrainer.XOR(); 

    console.log( 
        myPerceptron.activate([0,0]),
        myPerceptron.activate([1,0]),
        myPerceptron.activate([0,1]),
        myPerceptron.activate([1,1])
    );

}


  
/*app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
});*/

//putFeelingOn("Chipie est adorable, elle me fait un calin");
//testNeuralNetwork();

/*resetMemory();
initialiseWordReferentiel();*/
learnWithNovels();

//console.log(utils.detectPercentageOfInto(negationRegexp, " connais déjà tant de vous et pourtant je ne vous ai pour ainsi dire jamais vue Depuis maintenant six mois je vous frôle je vous devine je vous entends je ferme les yeux lorsque je sens votre parfum riche et savoureux comme un souvenir d enfance laisser s "));
