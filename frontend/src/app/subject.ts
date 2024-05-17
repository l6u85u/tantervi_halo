export class Subject {
    private _code: string;
    private _name: string;
    private _type: string;
    private _credit: number;
    private _status: number;
    private _pre: Array<Prerequisite>;
    private _over: Array<Subject>;
    private _border: number;
    private _proposedSemester: number;
    private _spec: string;
    private _ken: string;
    private _isAvailable: boolean;

    constructor(code: string, name: string, credit: number, type: string = "", status: number = 0, pre: Array<Prerequisite> = [], over: Array<Subject> = [], border: number = 0, proposedSemester: number = 0, spec: string = "", ken: string = "", isAvailable: boolean = false) {
        this._code = code
        this._name = name
        this._credit = credit
        this._type = type
        this._status = status
        this._pre = pre
        this._over = over
        this._border = border
        this._proposedSemester = proposedSemester
        this._spec = spec
        this._ken = ken
        this._isAvailable = isAvailable
    }

    //#region Getters and Setters

    public get code(): string {
        return this._code;
    }

    public set code(value: string) {
        this._code = value;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public get type(): string {
        return this._type;
    }

    public set type(value: string) {
        this._type = value;
    }

    public get credit(): number {
        return this._credit;
    }

    public set credit(value: number) {
        this._credit = value;
    }

    public get status(): number {
        return this._status;
    }

    public set status(value: number) {
        this._status = value;
    }

    public get pre(): Array<Prerequisite> {
        return this._pre;
    }

    public set pre(value: Array<Prerequisite>) {
        this._pre = value;
    }

    public get over(): Array<Subject> {
        return this._over;
    }

    public set over(value: Array<Subject>) {
        this._over = value;
    }

    public get border(): number {
        return this._border;
    }

    public set border(value: number) {
        this._border = value;
    }

    public get proposedSemester(): number {
        return this._proposedSemester;
    }

    public set proposedSemester(value: number) {
        this._proposedSemester = value;
    }

    public get spec(): string {
        return this._spec;
    }

    public set spec(value: string) {
        this._spec = value;
    }

    public get ken(): string {
        return this._ken;
    }

    public set ken(value: string) {
        this._ken = value;
    }

    public get isAvailable(): boolean {
        return this._isAvailable;
    }

    public set isAvailable(value: boolean) {
        this._isAvailable = value;
    }

    //#endregion

}

export type Prerequisite = {
    subject: Subject;
    weak: boolean;
}