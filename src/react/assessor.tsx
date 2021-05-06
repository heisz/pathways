/*
 * Assessment component for quizzes and lab testing actions.
 *
 * Copyright (C) 2020-2021 J.M. Heisz.  All Rights Reserved.
 * See the LICENSE file accompanying the distribution your rights to use
 * this software.
 */
import React from 'react';

/* Container struct for party time */
interface Confetti {
    /* The actual display element floating around the screen */
    elmnt: HTMLDivElement;

    /* 3D offset of confetti piece from root */
    x: number;
    y: number;
    z: number;

    /* Ejection vector from cannon with deceleration */
    speed: number;
    parAngle: number;
    perpAngle: number;

    /* Flutter and spin simulation */
    flutter: number;
    flutterRate: number;
    spin: number;
    spinRate: number;
}

/* Sometimes small victories should be celebrated */
/* Note that this could be generalized but there's a specific design here */
function tada(src: HTMLDivElement): void {
    const colours = [ "#a864fd", "#29cdff", "#78ff44", "#ff718d", "#fdff6a" ];

    /* Create the pieces of confetti */
    let confetti = Array.from({ length: 100 }).map((x: any, idx: number) => {
        /* Floating confetti, I mean div */
        let elmnt: HTMLDivElement = document.createElement('div');
        elmnt.style.width = elmnt.style.height = '10px';
        elmnt.style.position = 'absolute';
        elmnt.style.willChange = 'transform,opacity';
        elmnt.style.backgroundColor = colours[idx % colours.length];
        elmnt.style.visibility = 'hidden';
        src.appendChild(elmnt);

        return {
            elmnt: elmnt,
            x: 0, y: 0, z: 0,

            /* Comes out at 80 degree cone around vertical */
            speed: 50 * (0.5 + Math.random()),
            parAngle: (-90 + (0.5 - Math.random()) * 80) * (Math.PI / 180),
            perpAngle: (0.5 - Math.random()) * 70 * (Math.PI / 180),

            /* Flutter and spin are 100% roationally random */
            flutter: Math.random() * 2 * Math.PI,
            flutterRate: 0.1 + Math.random() * 0.2,
            spin: Math.random() * 2 * Math.PI,
            spinRate: 0.1 + Math.random() * 0.2
        };
    });

    /* Looping function to animate the confetti, 3s duration, 5ms apart */
    let startTime: number = 0;
    function animate(time: number) {
        if (!startTime) startTime = time;
        let progress: number = (time - startTime) / 3000;
        if (progress > 1.0) progress = 1.0;
        confetti.slice(0, Math.ceil((time - startTime) / 5)).forEach((piece) => {
            /* Move one step in all dimensions, decelerating as we go */
            piece.x += Math.cos(piece.parAngle) * piece.speed;
            piece.y += Math.sin(piece.parAngle) * piece.speed + 3 /* fall! */;
            let z: number = piece.z += Math.sin(piece.perpAngle) * piece.speed;
            piece.speed = piece.speed * 0.9;
            piece.flutter += piece.flutterRate;
            let spin: number = piece.spin += piece.spinRate;

            /* Transform and display appropriately */
            let x: number = piece.x + 10 * Math.cos(piece.flutter);
            let y: number = piece.y + 10 * Math.sin(piece.flutter);
            piece.elmnt.style.visibility = 'visible';
            piece.elmnt.style.transform = 
                  `translate3d(${x}px,${y}px,${z}px) rotate3d(1,1,1,${spin}rad)`;
            piece.elmnt.style.opacity = (1.0 - progress).toString();
        });

        /* Continue until timeout */
        if (progress < 1.0) {
            requestAnimationFrame(animate);
        } else {
            confetti.forEach((piece) => {
                src.removeChild(piece.elmnt);
            });
        }
    }

    requestAnimationFrame(animate);
}

/* Inbound properties from the page */
interface AssessorProps {
    unitURI: string;
}

/* State elements align with the REST information from the PHP side */
/* NOTE: React doesn't like nested state, Q/A are initial records only! */
interface QuizAnswer {
    id: string;
    text: string;
}
interface QuizQuestion {
    id: string;
    text: string;
    count: number;
    answers: QuizAnswer[];
}
/* Tracking object for completed unit module status */
interface ModuleProgressInfo {
    moduleBadge: string;
    moduleName: string;
    progBar: number;
    progress: string;
    nextUnitHRef: string;
    nextUnitName: string;
    tada: boolean;
}
interface AssessmentState {
    /* Values from the initial load call to the server */
    complete: boolean;  
    assessType: string;
    points: number;
    questions: QuizQuestion[];
    setup: string;
    activity: string;

    /* If complete, the associated details for the module */
    moduleProgress: ModuleProgressInfo;

    /* Internal state tracking elements */
    canSubmit: boolean;
    errorCount: number;
    errorMsg: string;
    dataError: boolean;
}

/* For type support/consistency, response object from verification request */
interface AssessmentResponse {
    status: string;
    points: number;

    /* These are populated for status of 'error' */
    errors: number;
    errorMsg: string;
    incorrect: {[key: string]: string[]};

    /* This appears for a status of 'complete' */
    moduleProgress: ModuleProgressInfo;
}

/* React component to handle assessment operations for a unit */
class Assessor extends React.Component<AssessorProps, AssessmentState> {
    /* Internal tracking element for selected answers */
    private answerSet: {[key: string]: string[]} = {};

    /* Tracking element for error display */
    private errorSet?: {[key: string]: string[]} = null;

    /* Tracking for attaching tada */
    private modTitleRef: React.RefObject<HTMLDivElement>;

    /* This is awkward but need constructor for binding */
    constructor(props: AssessorProps) {
        super(props);

        /* Reference to module tag for tada moments */
        this.modTitleRef = React.createRef();

        /* Wowsers... */
        this.handleAnswerChange = this.handleAnswerChange.bind(this);
        this.handleAssessment = this.handleAssessment.bind(this);
    }

    /* On mounting the component into the UI, fetch assessment state */
    componentDidMount(): void {
        fetch('/rest/assessment/' + this.props.unitURI).then((res) => {
            if (!res.ok) throw new Error('Fetch response encountered error');
            return res.json();
        }).then((state: AssessmentState) => {
            /* Initialize internal tracking elements */
            state.canSubmit = (state.assessType == 'lab');
            state.errorCount = 0;
            state.errorMsg = null;
            state.dataError = false;

            this.setState(state);
        }).catch((err) => {
            console.error('Error fetching raw assessment data');
            console.error(err);

            this.setState({
                'canSubmit': false,
                'dataError': true
            });
        });
    }

    /* Handle input changes for selection assembly and validation */
    handleAnswerChange(ev: React.ChangeEvent<HTMLInputElement>) {
        /* Compute the question counts and build answer keys */
        let counts: {[key: string]: number} = {};
        this.answerSet = {};
        let form = ev.target.form;
        for (let idx = 0; idx < form.elements.length; idx++) {
            if (form.elements[idx].nodeName.toLowerCase() != 'input') continue;
            let inp = form.elements[idx] as HTMLInputElement;
            if (!inp.checked) continue;
            let pts = inp.value.split(':');
            let questId = pts[0];
            if (!(questId in counts)) {
                counts[questId] = 1;
                this.answerSet[questId] = [ pts[1] ];
            } else {
                counts[questId]++;
                this.answerSet[questId].push(pts[1]);
            }
        }

        /* Purge error cases for selected question */
        if (this.errorSet != null) {
            let pts = ev.target.value.split(':');
            delete this.errorSet[pts[0]];
        }

        /* Process and update the error/submission counts */
        let submissible = true;
        let errorCount = 0;
        for (let idx = 0; idx < this.state.questions.length; idx++) {
            var quest = this.state.questions[idx];
            if (!(quest.id in counts)) {
                submissible = false;
                break;
            }
            if (counts[quest.id] != quest.count) {
                submissible = false;
                break;
            }
            if ((this.errorSet != null) && (quest.id in this.errorSet) &&
                       (this.errorSet[quest.id].length != 0)) {
                errorCount++;
                submissible = false;
            }
        }

        this.setState({
            'canSubmit': submissible,
            'errorCount': errorCount
        });
    }

    /* And the final piece, evaluate the solution */
    handleAssessment(ev: React.FormEvent<HTMLFormElement>) {
        ev.preventDefault();

        /* Avoid multi-submit */
        this.setState({
            'canSubmit': false
        });

        /* Just post the answer set (empty for lab exercise) */
        fetch('/rest/assessment/' + this.props.unitURI, {
            'method': 'POST',
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': JSON.stringify(this.answerSet)
        }).then((res) => {
            if (!res.ok) throw new Error('Fetch response encountered error');
            return res.json();
        }).then((resp: AssessmentResponse) => {
            if (resp.status == 'correct') {
                this.setState({
                    'complete': true,
                    'points': resp.points,
                    'moduleProgress': resp.moduleProgress
                });

                /* Time to party? */
                if (resp.moduleProgress.tada) {
                    setTimeout(() => { tada(this.modTitleRef.current); });
                }

                return;
            }

            /* Oh well, good try, show your mistakes */
            this.errorSet = resp.incorrect;

            /* Push the updated root elements which forces redraw */
            this.setState({
                'canSubmit': (this.state.assessType == 'lab'),
                'errorCount': resp.errors,
                'errorMsg': resp.errorMsg,
                'points': resp.points
            });
        }).catch((err) => {
            console.error('Error verifying assessment response');
            console.error(err);

            this.setState({
                'canSubmit': false,
                'dataError': true
            });
        });
    }

    /* Wrapping function to disable question if correct */
    questCorrect(questId: string): boolean {
        if ((this.errorSet == null) ||
                     (!(questId in this.errorSet))) return false;
        return (this.errorSet[questId].length == 0);
    }

    /* Generate appropriate correct/error class for question/answer */
    checkedClass(pfx: string, questId: string, ansId?: string): string {
        if (this.errorSet == null) return pfx;
        if (ansId == null) {
            /* Only generate error indication as second class */
            if ((!(questId in this.errorSet)) ||
                       (this.errorSet[questId].length == 0)) return pfx;
            return pfx + ' ' + pfx + '-error';
        }

        /* For answers, extended states for picked or correct */
        if (!(questId in this.errorSet)) return pfx;
        if (!this.answerSet[questId].includes(ansId)) {
            return pfx +
                   ((this.errorSet[questId].length != 0) ? '' : '-disabled');
        }
        let correct = !this.errorSet[questId].includes(ansId);
        return pfx + ((correct) ? '-correct' : '-error');
    }

    /* Generate suitable icon text for answer based on state */
    ansIcon(questId: string, ansId: string, idx: number): any {
        const ansIcons: string[] = [ 'A', 'B', 'C', 'D', 'E', 'F' ];

        /* Normal letter if not answered condition */
        if ((this.errorSet == null) || (!(questId in this.errorSet)) || 
               (!this.answerSet[questId].includes(ansId))) return ansIcons[idx];
        let correct = !this.errorSet[questId].includes(ansId);

        /* Generate SVG icon instances */
        if (correct) return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21
                     7l-1.41-1.41L9 16.17z"/>
          </svg>
        );

        return (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59
                     6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
          </svg>
        );
    }

    /* Standard React method to render state-driven component content */
    render(): any {
        /* Wait until valid state is available */
        if ((!this.state) || (this.state.complete == null)) {
            if ((this.state) && (this.state.dataError)) {
                return (<span className="assessment-error-notice">
                          Something went wrong retrieving assessment data.
                          Please try again later.
                         </span>);
            }
            return '';
        }

        /* Summarize details if assessment is complete */
        if (this.state.complete) {
            return (
              <div className="assessment-complete">
                <h2>{ this.state.assessType.toUpperCase() } COMPLETE!</h2>
                <h3 className="assessment-points">
                          { this.state.points } Points</h3>
                <div className="assessment-module-wrapper">
                  <div className="assessment-module-badge">
                    <img src={ this.state.moduleProgress.moduleBadge }
                         alt="module badge"/>
                  </div>
                  <div className="assessment-module-info">
                    <div className="assessment-module-title"
                         ref={this.modTitleRef}>
                      { this.state.moduleProgress.moduleName }
                    </div>
                    <div className="assessment-module-progress">
                       { this.state.moduleProgress.progress }
                       { (this.state.moduleProgress.progBar != 100) &&
                         <div className="progress-bar-wrapper">
                           { this.state.moduleProgress.progBar }%&nbsp;
                           <div className="progress-bar-background">
                             <div className="progress-bar"
                                  style={ { width: 
                                            this.state.moduleProgress.progBar +
                                            '%' } }></div>
                             </div>
                         </div>
                       }
                    </div>
                  </div>
                </div>
                { (this.state.moduleProgress.nextUnitHRef != null) &&
                  <div className="assessment-next">
                    <p>Next Module Unit:&nbsp;
                       <a href={ this.state.moduleProgress.nextUnitHRef }>
                          { this.state.moduleProgress.nextUnitName }</a></p>
                  </div>
                }
              </div>
            );
        }

        /* Just a content dump for lab activities */
        if (this.state.assessType == 'lab') {
            return (
              <section className="assessment-pending">
                <form action="" onSubmit={ this.handleAssessment }>
                  <header className="assessment-header">
                    <h2>Lab Activity</h2>
                    <span className="assessment-points">
                               { this.state.points } Points</span>
                  </header>
                  { (this.state.setup != null) &&
                    <div className="assessment-labsection-wrapper">
                      <h3>Setup</h3>
                      <div className="assessment-labsection"
                           dangerouslySetInnerHTML={
                             { __html: this.state.setup }
                           }/>
                    </div>
                  }
                  <div className="assessment-labsection-wrapper">
                    <h3>Activity</h3>
                    <div className="assessment-labsection"
                         dangerouslySetInnerHTML={
                           { __html: this.state.activity }
                         }/>
                  </div>
                  { (this.state.errorMsg != null) &&
                    <div className="assessment-lab-error">
                      { this.state.errorMsg }
                    </div>
                  }
                  <div className="assessment-footer">
                    <button type="submit"
                            className="assessment-check-button"
                            disabled={ !this.state.canSubmit }>
                       Check Your Work For { this.state.points } Points
                    </button>
                    { (this.state.dataError) &&
                      <span className="assessment-error-notice">
                        Something went wrong.  Refresh the screen and try again.
                      </span>
                    }
                    { (this.state.errorCount == 1) &&
                      <span className="assessment-error-notice">
                        You've got 1 wrong answer.
                      </span>
                    }
                    { (this.state.errorCount > 1) &&
                      <span className="assessment-error-notice">
                        You've got { this.state.errorCount } wrong answers.
                      </span>
                    }
                  </div>
                </form>
              </section>
            );
        }

        /* Otherwise it's a quiz rendering, nested looping for rendering */
        let ansKey='';
        return (
          <section className="assessment-pending">
            <form action="" onSubmit={ this.handleAssessment }>
              <header className="assessment-header">
                <h2>Quiz</h2>
                <span className="assessment-points">
                           { this.state.points } Points</span>
              </header>
              { this.state.questions.map((quest, qIdx) => {
                return (
                  <fieldset className={ this.checkedClass(
                                                   'assessment-quiz-question',
                                                   quest.id, null) }
                            name={ quest.id } key={ quest.id }
                            disabled={ this.questCorrect(quest.id) }>
                    <legend className="assessment-quiz-row">
                        <span className="assessment-question-icon">
                                                       { qIdx + 1 }</span>
                        <span className="assessment-question-text">
                                                       { quest.text }</span>
                    </legend>
                    <div className="assessment-answers">
                      { quest.answers.map((ans, aIdx) => {
                        return (
                          <div className="assessment-quiz-row"
                               key={ ansKey = quest.id + ':' + ans.id}>
                            <input className="assessment-quiz-input"
                                   type={ (quest.count == 1) ?
                                                   'radio' : 'checkbox' }
                                   name={ quest.id }
                                   value={ ansKey }
                                   id={ ansKey }
                                   onChange={ this.handleAnswerChange }/>
                            <label className={ this.checkedClass(
                                                     'assessment-quiz-answer',
                                                     quest.id, ans.id) }
                                   htmlFor={ ansKey }>
                              <span className={
                                          'assessment-answer-icon ' +
                                          'assessment-answer-' +
                                              ((quest.count == 1) ?
                                                'radio' : 'checkbox') +
                                                                 '-icon' }>
                                                   { this.ansIcon(quest.id,
                                                                  ans.id,
                                                                  aIdx) }</span>
                              <span className="assessment-answer-text">
                                                   { ans.text }</span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
              <div className="assessment-footer">
                <button type="submit"
                        className="assessment-check-button"
                        disabled={ !this.state.canSubmit }>
                   Check Your Answers For { this.state.points } Points
                </button>
                { (this.state.dataError) &&
                  <span className="assessment-error-notice">
                    Something went wrong.  Refresh the screen and try again.
                  </span>
                }
                { (this.state.errorCount == 1) &&
                  <span className="assessment-error-notice">
                    You've got 1 wrong answer.
                  </span>
                }
                { (this.state.errorCount > 1) &&
                  <span className="assessment-error-notice">
                    You've got { this.state.errorCount } wrong answers.
                  </span>
                }
              </div>
            </form>
          </section>
        );
    }
}

export default Assessor;
