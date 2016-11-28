/**
 This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */


'use strict';

// common constants
var GAME_START_ROUND = 1;
var GAME_TOTAL_QUESTIONS = 5;
var PASS_RATE = 0.7;
var CARD_TITLE = "Education"; // Be sure to change this for your skill.
var SUCCESS_SOUND = "https://s3-us-west-2.amazonaws.com/jsilver-alexa-games/alexa_success_48kbps.mp3";
var FAIL_SOUND = "https://s3-us-west-2.amazonaws.com/jsilver-alexa-games/alexa_fail_48kbps.mp3";



// -- quiz specific logican
var GET_MAIN_HELP_TEXT = "You will be asked a date and should respond with the day of the week for that date.    For example, say, the answer is Thursday.  Or, you can just say, Thursday.  " 
           + " The questions will start with dates from the current month and gradually progress to dates from this year, dates from this century, and finally dates from as far back as 1600 and as far forward as 3000. "
           + " If you don't hear the question, or you need more time, say, repeat.   To start a new game at any time, say, start game. "
             + "Would you like to keep playing?";
             
var GET_MAIN_REPROMPT_TEXT = "To give an answer to a question, say, the answer is Thursday.  Or, just say, Thursday. "
        + "Would you like to keep playing?";
             
function textFromDate(myDate) {
    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[myDate.getMonth()] + " " + myDate.getDate() + " " + myDate.getFullYear();
}

function weekdayFromDate(myDate)  {
    var days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return days[myDate.getDay()];
}

function isWas(msDate) {
    var now = new Date();
    if (now.getTime() > msDate) 
        return "was";  //time is in the past
    else
        return "is";
}
        

function generateNextQuestion(questionNumber, round) {
    
    var date = new Date();
    var firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    var lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1); //note that javascript is ok with month=13
    
    var firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    var lastDayOfYear = new Date(date.getFullYear()+1, 0, 1);
    
    var firstDayOfCentury = new Date(Math.floor(date.getFullYear()/100) * 100, 0, 1);
    var lastDayOfCentury = new Date(Math.floor(date.getFullYear()/100) * 100 + 100, 0, 1);

    var firstDayOfGregorian = new Date(1600, 0, 1);
    var lastDayOfGregorian = new Date(3000, 0, 1);
    
    
    console.log("firstDayofMonth is" + firstDayOfMonth.getTime() + ". firstDayOfGregorian is " + firstDayOfGregorian.getTime());
    console.log("lastDayofMonth is " + lastDayOfMonth.getTime() + ". lastDayOfGregorian is " + lastDayOfGregorian.getTime());

    var theQuestion;
    if (round === 1) {
        //give a date this month
        theQuestion = new Date(firstDayOfMonth.getTime() +  Math.floor(Math.random() * (lastDayOfMonth.getTime() - firstDayOfMonth.getTime())));
    }
    else if (round === 2) {
         theQuestion = new Date(firstDayOfYear.getTime() +  Math.floor(Math.random() * (lastDayOfYear.getTime() - firstDayOfYear.getTime())));
    }
        else if (round === 3) {
         theQuestion = new Date(firstDayOfCentury.getTime() +  Math.floor(Math.random() * (lastDayOfCentury.getTime() - firstDayOfCentury.getTime())));
    }
    else  {
         theQuestion = new Date(firstDayOfGregorian.getTime() +  Math.floor(Math.random() * (lastDayOfGregorian.getTime() - firstDayOfGregorian.getTime())));
    }
    console.log("randomDate is " + theQuestion.toString() );

    
    
    var    repromptText = "What day of the week " + isWas(theQuestion) +" " + textFromDate(theQuestion) + "?",
        spokenQuestion = "Question " + questionNumber + ". "+ repromptText + " ";
    return {
        theQuestion:theQuestion.getTime(),
        spokenQuestion:spokenQuestion,
        repromptText:repromptText
    }; 
}

function welcomeText() {
    return "Let's begin.  I will ask you a date.  You will need to answer with the day of the week. " ;
}

function getAnswer(theQuestion) {
    var myDate = new Date(parseInt(theQuestion));
    return weekdayFromDate(myDate);
    //return theQuestion * theQuestion;
}

function getAnswerText(theQuestion) {
    var newDate = new Date(theQuestion);
    return "The correct day for " + textFromDate(newDate) + "  is " + getAnswer(theQuestion) + ".";
}

function equalAnswer(answer1, answer2) {
    try {
        if (answer1.toUpperCase() === answer2.toUpperCase())
            return true;
    }
    catch (e) {return false;}
    return false;
}

function getNameOfTask(round) {
    var roundName = " finding the day of week for "
    if (round === 1) 
        return roundName + "dates this month";
    else if (round === 2)  
        return roundName + "dates this year"
    else if (round === 3)
        return roundName + "dates this century"
    else 
        return roundName + "all dates in the Gregorian calendar"
}

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
exports.handler = function (event, context) {
    try {
        console.log("event.session.application.applicationId=" + event.session.application.applicationId);

    
        if (event.session.new) {
            onSessionStarted({requestId: event.request.requestId}, event.session);
        }

        if (event.request.type === "LaunchRequest") {
            onLaunch(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "IntentRequest") {
            onIntent(event.request,
                event.session,
                function callback(sessionAttributes, speechletResponse) {
                    context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === "SessionEndedRequest") {
            onSessionEnded(event.request, event.session);
            context.succeed();
        }
    } catch (e) {
        context.fail("Exception: " + e);
    }
};


/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);

    getWelcomeResponse(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId
        + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    // handle yes/no intent after the user has been prompted
    if (session.attributes && session.attributes.userPromptedToContinue) {
        delete session.attributes.userPromptedToContinue;
        if ("AMAZON.NoIntent" === intentName) {
            handleFinishSessionRequest(intent, session, callback);
        } else if ("AMAZON.YesIntent" === intentName) {
            handleRepeatRequest(intent, session, callback);
        }
    }

    // dispatch custom intents to handlers here
    if ("AnswerIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AnswerOnlyIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("DontKnowIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.YesIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.NoIntent" === intentName) {
        handleAnswerRequest(intent, session, callback);
    } else if ("AMAZON.StartOverIntent" === intentName) {
        getWelcomeResponse(callback);
    } else if ("AMAZON.RepeatIntent" === intentName) {
        handleRepeatRequest(intent, session, callback);
    } else if ("AMAZON.HelpIntent" === intentName) {
        handleGetHelpRequest(intent, session, callback);
    } else if ("AMAZON.StopIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else if ("AMAZON.CancelIntent" === intentName) {
        handleFinishSessionRequest(intent, session, callback);
    } else {
        throw "Invalid intent";
    }
}

//return the pluralized word (assume it just needs to add an 's' :-)
function pluralize(word, count) {
    if (count === 1) return word;
    return word + "s";
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);

    // Add any cleanup logic here
}

// ------- Skill specific business logic -------








function getWelcomeResponse(callback) {
    console.log("Start of getWelcomeResonse.");
    var sessionAttributes = {},
    
    speechOutput = welcomeText();
        
    var quest = generateNextQuestion(1, GAME_START_ROUND);        
  
    speechOutput += quest.spokenQuestion;
    var start = new Date();
    
    sessionAttributes = {
        "theQuestion": quest.theQuestion,
        "questionAskTime" : start.getTime(),
        "questionNumber" : 1,
        "round" : GAME_START_ROUND,
        "score": 0,
        "scoreThisRound": 0,
        "speechOutput" : speechOutput, //used when user asks for help or repeat
        "repromptText" : quest.repromptText  //see above
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, quest.repromptText, false));
}




function handleAnswerRequest(intent, session, callback) {
    var speechOutput = "";
    var sessionAttributes = {};
    var gameInProgress = session.attributes && session.attributes.questions;
    var userAnswer = 0;
    if (intent.slots && intent.slots.Answer && intent.slots.Answer.value) 
        userAnswer = intent.slots.Answer.value;
    var theQuestion = parseInt(session.attributes.theQuestion);
    var currentScore = parseInt(session.attributes.score);
    var scoreThisRound = parseInt(session.attributes.scoreThisRound);
    var questionNumber = parseInt(session.attributes.questionNumber);
    var round = parseInt(session.attributes.round);

    if (equalAnswer(userAnswer,getAnswer(theQuestion))) {
        //correct answer
        speechOutput = "That is correct.";
        var endTime = new Date();
        var timeTaken = Math.max(Math.floor((endTime.getTime() - session.attributes.questionAskTime)/1000 - 10),1); /* hack.  it takes 10 seconds to read the question */
        var points = Math.max(Math.ceil(Math.pow(10, round) - timeTaken),4*round+3);
        speechOutput += " You took " + timeTaken + pluralize(" second",timeTaken) +".  You gained " + points + pluralize(" point", points) + "." ;
        currentScore += points;
        scoreThisRound += points;
    }
    else {
        speechOutput = "That is incorrect.  You answered " + userAnswer + ". " + getAnswerText(theQuestion);  
    }
    var lastQuestionThisRound = (questionNumber % GAME_TOTAL_QUESTIONS === 0);

    speechOutput += " Your total score after "+ questionNumber + pluralize(" question",questionNumber) + " is " + currentScore + ". ";
 
    var quest;   
 
    if (lastQuestionThisRound) {
        if (scoreThisRound >= GAME_TOTAL_QUESTIONS * PASS_RATE * Math.pow(10, round)) {
            //level up
            speechOutput += "<audio src='" + SUCCESS_SOUND + "'/>" + " Congratulations.  You have passed "+ getNameOfTask(round) + ". Let's move on to " + getNameOfTask(round+1) + ". ";
            round++;
        }
        else {
            speechOutput += "<audio src='" + FAIL_SOUND + "'/>" + " Sorry.   You need more practice with " + getNameOfTask(round) +".  Let's try that again. ";
        }
        scoreThisRound = 0;
        questionNumber = 0;
    }
 

    quest = generateNextQuestion(questionNumber+1,round);
    var start = new Date();
    speechOutput += quest.spokenQuestion;
    sessionAttributes = {
        "theQuestion": quest.theQuestion,
        "questionAskTime" : start.getTime(),
        "questionNumber" : questionNumber+1,
        "round" : round,
        "score": currentScore,
        "scoreThisRound" : scoreThisRound,
        "speechOutput" : speechOutput,  //used when user asks for help or requests more time
        "repromptText" : quest.repromptText  //see above line
    };
    callback(sessionAttributes,
        buildSpeechletResponse(CARD_TITLE, speechOutput, quest.repromptText, false));
}


function handleRepeatRequest(intent, session, callback) {
    // Repeat the previous speechOutput and repromptText from the session attributes if available
    // else start a new game session
    if (!session.attributes || !session.attributes.speechOutput) {
        getWelcomeResponse(callback);
    } else {
        callback(session.attributes,
            buildSpeechletResponseWithoutCard(session.attributes.repromptText, session.attributes.repromptText, false));
    }
}

function handleGetHelpRequest(intent, session, callback) {
    // Provide a help prompt for the user, explaining how the game is played. Then, continue the game
    // if there is one in progress, or provide the option to start another one.
    
    // Ensure that session.attributes has been initialized
    if (!session.attributes) {
        session.attributes = {};
    }

    // Set a flag to track that we're in the Help state.
    session.attributes.userPromptedToContinue = true;

    // Do not edit the help dialogue. This has been created by the Alexa team to demonstrate best practices.

    var speechOutput = GET_MAIN_HELP_TEXT;
    var repromptText = GET_MAIN_REPROMPT_TEXT;
   
    callback(session.attributes,
        buildSpeechletResponseWithoutCard(speechOutput, repromptText, false));
}

function handleFinishSessionRequest(intent, session, callback) {
    // End the session with a "Good bye!" if the user wants to quit the game
    callback(session.attributes,
        buildSpeechletResponseWithoutCard("Good bye!", "", true));
}


// ------- Helper functions to build responses -------


function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
         outputSpeech: {
            ssml: "<speak>" + output + "</speak>",
            type: "SSML"
        },
        card: {
            type: "Simple",
            title: title,
            content: repromptText
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}



function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

