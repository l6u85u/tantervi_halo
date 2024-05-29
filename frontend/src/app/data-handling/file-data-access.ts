import { Curriculum } from "../model/curriculum";
import { JsonDataHandler } from "./json-data-handler";
import { environment } from '../../environments/environment';
import * as FileSaver from 'file-saver';

const SPEC_NAMES: Array<string> = environment.specNames
const SPEC_COMP_INFO_CREDITS: Array<number> = environment.specCompInfoCredits
const SPEC_COMP_SCIENCE_CREDITS: Array<number> = environment.specCompScienceCredits

export class FileDataAccess {

    //#region Public Methods

    //open file which contains the state of a curriculum
    public static async openFile(event: any, specIdx: number): Promise<Curriculum | null> {
        var file = event.target.files[0]
        var content
        var curriculum: Curriculum | null;

        content = await FileDataAccess.readFileAsync(file);
        event.target.value = ""

        if (typeof (content) === "string") {
            curriculum = FileDataAccess.loadData(content, specIdx)
            return curriculum
        }

        return null
    }

    //save the current state of the curriculum to a file
    public static saveFile(curriculum: Curriculum) {
        var subjects = []
        for (let i = 0; i < curriculum.semesters.length; i++) {
            subjects.push(curriculum.semesters[i].subjects)
        }
        var content = JSON.stringify(subjects, JsonDataHandler.changePrerequisitesAndOverlaysToString);
        var internship = curriculum.isInternshipCompleted.toString()

        content = '{"' + curriculum.specName + '":' + '{"subjects":' + content + ',"internship":' + internship + "}}"
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        var name = curriculum.specName.split(' ').join('_').toLowerCase() + ".txt"
        FileSaver.saveAs(blob, name);
    }

    //#endregion

    //#region Private Methods

    //read file in an asynchronous way
    private static readFileAsync(file: File): Promise<string | ArrayBuffer | null> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };
            reader.onerror = () => {
                reject(reader.error);
            };

            reader.readAsText(file);
        });
    }

    //load the content of the file
    private static loadData(content: string, specIdx: number): Curriculum | null {
        try {
            const jsonObject = JSON.parse(content);

            //if the curriculum in the file belongs to the current spec 
            if (!jsonObject.hasOwnProperty(SPEC_NAMES[specIdx])) {
                throw new FileDataAccessError("Incorrect curriculum!", 2);
            }
            const jsonContent = jsonObject[SPEC_NAMES[specIdx]]
            var curriculum: Curriculum = new Curriculum(SPEC_NAMES[specIdx], SPEC_COMP_INFO_CREDITS[specIdx], SPEC_COMP_SCIENCE_CREDITS[specIdx])
            JsonDataHandler.getAllData(jsonContent.subjects, jsonContent.internship, curriculum)
            return curriculum
        }
        catch (error) {
            if (error instanceof FileDataAccessError) {
                throw new FileDataAccessError(error.message, 2);
            }
            else if (error instanceof Error){
                throw new FileDataAccessError(error.message, 1);
            }
        }
        return null
    }

    //#endregion

}

export class FileDataAccessError extends Error {
    errorCode: number;

    constructor(message: string, errorCode: number) {
        super(message);
        this.name = "FileDataAccessError";
        this.errorCode = errorCode;
    }
}