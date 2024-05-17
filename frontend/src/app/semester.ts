import {Subject} from "./subject"

export class Semester {

    //#region Properties

    private _subjects: Array<Subject>
    private _completedCredits: number
    private _enrolledCredits: number

    //#endregion

    //#region Getters and Setters

    public get completedCredits(): number {
        return this._completedCredits
    }

    public set completedCredits(value: number) {
        this._completedCredits = value
    }

    public get enrolledCredits(): number {
        return this._enrolledCredits
    }

    public set enrolledCredits(value: number) {
        this._enrolledCredits = value
    }

    public get subjects(): Array<Subject> {
        return this._subjects
    }

    //#endregion

    //#region Constructors

    constructor() {
        this._completedCredits = 0;
        this._enrolledCredits = 0;
        this._subjects = []
    }

    //#endregion

    //#region Public Methods

    public addNewSubject(subj: Subject): void {
        this.subjects.push(subj)

        //update credits
        if (subj.status == 1) { //if the status is enrolled
            this.enrolledCredits += subj.credit
        }
        else if (subj.status == 2) { //if the status is completed
            this.enrolledCredits += subj.credit
            this.completedCredits += subj.credit
        }

    }

    public deleteSubject(index: number): void {
        var subj = this.subjects.splice(index, 1)[0];

        //update credits
        if (subj) {
            if (subj.status == 1) { //if the status is enrolled
                this.enrolledCredits -= subj.credit
            }
            else if (subj.status == 2) { //if the status is completed
                this.enrolledCredits -= subj.credit
                this.completedCredits -= subj.credit
            }
        }

    }

    //#endregion

}
