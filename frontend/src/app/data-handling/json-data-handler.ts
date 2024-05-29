import { Curriculum } from '../model/curriculum';
import { Semester } from '../model/semester';
import { Subject, Status } from '../model/subject';
import { environment } from '../../environments/environment';

const NUMBER_OF_COLUMNS: number = environment.numberOfSemesters

export class JsonDataHandler {

    constructor() { }

    //#region Public Methods

    //change the subject types to string to create JSON from it
    public static changePrerequisitesAndOverlaysToString(key: any, value: any): any {
        if (key === "_pre") {
            var curriculums = value
            value = []
            for (let i = 0; i < curriculums.length; i++) {
                var pre = curriculums[i]
                pre.subject = pre.subject.code
                value.push(pre)
            }
        }
        else if (key === "_over") {
            var curriculums = value
            value = []
            for (let i = 0; i < curriculums.length; i++) {
                value.push(curriculums[i].code)
            }
        }
        return value;
    }

    //get the data from backend for one spec 
    public static getData(xhr: XMLHttpRequest, curriculum: Curriculum) {
        if (xhr.readyState == 4 && xhr.status == 200) {
            var resp = JSON.parse(JSON.parse(xhr.responseText));

            for (let i = 0; i < NUMBER_OF_COLUMNS; i++) {
                curriculum.addNewSemester()
            }

            this.getObligatoryData(resp[0], curriculum)
            this.getElectiveData(resp[1], curriculum)
        }
    }

    //convert JSON data to Curriculum
    public static getAllData(subjects: any, internship: any, curriculum: Curriculum) {

        for (let i = 0; i < subjects.length; i++) {
            curriculum.semesters.push(new Semester())

            for (let j = 0; j < subjects[i].length; j++) {
                var subj = subjects[i][j]
                //add subject
                curriculum.semesters[i].addNewSubject(new Subject(subj._code, subj._name, subj._credit, subj._type, subj._status, [], [], 0, subj._proposedSemester, subj._spec, subj._ken, subj._isAvailable))
                if (subj._status == Status.Completed) {
                    if (subj._spec == "Kötelezően választható") {
                        if (curriculum.isEnglish || curriculum.specName.includes("mérnök")) {
                            curriculum.compElectiveCreditsInfo += subj._credit
                        }
                        else {
                            if (subj._ken == "Informatika") {
                                curriculum.compElectiveCreditsInfo += subj._credit
                            }
                            else if (subj._ken == "Számítástudomány") {
                                curriculum.compElectiveCreditsCompScience += subj._credit
                            }
                        }
                    }
                    else if (subj._spec == "Szabadon választható") {
                        curriculum.electiveCredits += subj._credit
                    }
                }
            }
        }

        for (let i = 0; i < subjects.length; i++) {
            for (let j = 0; j < subjects[i].length; j++) {

                //add the prerequisites for every subject
                var subj = subjects[i][j]
                for (let l = 0; l < subj._pre.length; l++) {
                    for (let k = 0; k <= i; k++) {
                        for (let m = 0; m < curriculum.semesters[k].subjects.length; m++) {
                            if (curriculum.semesters[k].subjects[m].code == subj._pre[l].subject) {
                                curriculum.semesters[i].subjects[j].pre.push({ subject: curriculum.semesters[k].subjects[m], weak: subj._pre[l].weak })
                                break
                            }
                        }
                    }
                }

                //add the overlays for every subject
                for (let l = 0; l < subj._over.length; l++) {
                    for (let k = i; k < subjects.length; k++) {
                        for (let m = 0; m < curriculum.semesters[k].subjects.length; m++) {
                            if (curriculum.semesters[k].subjects[m].code == subj._over[l]) {
                                curriculum.semesters[i].subjects[j].over.push(curriculum.semesters[k].subjects[m])
                                break
                            }
                        }
                    }
                }
            }
        }

        //recalculate the credits
        for (let i = 0; i < curriculum.semesters.length; i++) {
            curriculum.completedCredits += curriculum.semesters[i].completedCredits
            curriculum.enrolledCredits += curriculum.semesters[i].enrolledCredits
        }

        if (internship) {
            curriculum.isInternshipCompleted = true
        }
        else {
            curriculum.isInternshipCompleted = false
        }

    }

    //#endregion 

    //#region Private Methods

    //get the compulsory subject list from backend
    private static getObligatoryData(resp: any, curriculum: Curriculum) {
        //iterate through every subject
        for (var i = 0; i < resp.length; i++) {
            var semester = resp[i]["Ajánlott félév"]

            if (typeof semester === 'string') {
                semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
            }

            //set type (Lecture or Practice)
            var type = ""
            if (resp[i]["Előadás"] > 0) {
                if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
                    if (curriculum.isEnglish) { type = "L" }
                    else { type = "EA" }
                }
            }
            else {
                if (curriculum.isEnglish) { type = "P" }
                else { type = "GY" }
            }

            curriculum.semesters[Math.floor(semester - 1)].addNewSubject(new Subject(resp[i]["Kód"], resp[i]["Tanegység"], resp[i]["Kredit"], type, 0, [], [], 0, semester, resp[i]["Típus"], resp[i]["Ismeretkör"]))
        }

        //iterate through every subject
        for (var i = 0; i < resp.length; i++) {
            var semester = resp[i]["Ajánlott félév"]

            if (typeof semester === 'string') {
                semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
            }

            //find the current subject in the subject array
            var col = Math.floor(semester - 1)
            var idx = 0;
            for (let j = 0; j < curriculum.semesters[col].subjects.length; j++) {
                if (curriculum.semesters[col].subjects[j].code == resp[i]["Kód"]) {
                    idx = j;
                    break
                }
            }

            //separate the prerequisites of the subject
            var pre_code = []
            if (resp[i]["Előfeltétel(ek)"] !== null) {
                pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the curriculums list and add them as prerequisite
            pre_code.forEach((code: string) => {
                var words = code.split(" ")
                var weak = false; //type of prerequisite

                if (words.length > 1 && (words[1].toLowerCase() == "(gyenge)" || words[1].toLowerCase() == "(weak)")) {
                    weak = true
                }

                for (let j = 0; j <= col; j++)
                    for (let l = 0; l < curriculum.semesters[j].subjects.length; l++) {
                        if (curriculum.semesters[j].subjects[l].code == words[0]) {
                            curriculum.semesters[col].subjects[idx].pre.push({ subject: curriculum.semesters[j].subjects[l], weak: weak })
                            break
                        }
                    }

            })

            //check availability
            if (curriculum.semesters[col].subjects[idx].pre.length == 0) {
                curriculum.semesters[col].subjects[idx].isAvailable = true
            }

            //separate the overlays of the subject
            var over_code = []
            if (resp[i]["Ráépülő"] != "") {
                over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the curriculums list and add them as overlays
            over_code.forEach((code: string) => {
                for (let j = col; j < curriculum.semesters.length; j++)
                    for (let l = 0; l < curriculum.semesters[j].subjects.length; l++) {
                        if (curriculum.semesters[j].subjects[l].code == code) {
                            curriculum.semesters[col].subjects[idx].over.push(curriculum.semesters[j].subjects[l])
                            break
                        }
                    }
            })

        }

        //add the 'Thesis consultation' subject in the last semester
        if (curriculum.isEnglish) {
            var thesis = new Subject("IP-18FSZD", "Thesis consult.", 20, "", 0, [], [], 0, 6, "Kötelező", "", true)
        }
        else {
            var thesis = new Subject("IP-08SZDPIBN18", "Szakdolgozati konz.", 20, "", 0, [], [], 0, 6, "Kötelező", "", true)
        }

        curriculum.semesters[NUMBER_OF_COLUMNS - 1].addNewSubject(thesis)
    }

    //get the compulsory elective subject list from backend
    private static getElectiveData(resp: any, curriculum: Curriculum) {
        //iterate through every subject
        for (var i = 0; i < resp.length; i++) {
            var semester = resp[i]["Ajánlott félév"]

            if (typeof semester === 'string') {
                semester = parseInt(semester.split(",")[0]) //get the first semester from the recommended ones
            }

            var type = ""  //set type (Lecture or Practice)
            if (resp[i]["Előadás"] > 0) {
                if (resp[i]["Gyakorlat"] == 0 && resp[i]["Labor"] == 0) {
                    if (curriculum.isEnglish) { type = "L" }
                    else { type = "EA" }
                }
            }
            else {
                if (curriculum.isEnglish) { type = "P" }
                else { type = "GY" }
            }

            curriculum.compElectiveSubjects.push(new Subject(resp[i]["Kód"], resp[i]["Tanegység"], resp[i]["Kredit"], type, 0, [], [], 0, semester, resp[i]["Típus"], resp[i]["Ismeretkör"]))
        }

        //iterate through every comp. elective subject
        for (var i = 0; i < curriculum.compElectiveSubjects.length; i++) {
            //separate the prerequisites of the subject
            var pre_code = []
            if (resp[i]["Előfeltétel(ek)"] !== null) {
                pre_code = resp[i]["Előfeltétel(ek)"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the elective curriculums list and add them as prerequisite
            pre_code.forEach((code: string) => {
                var words = code.split(" ")
                var weak = false;
                if (words.length > 1 && (words[1] == "(gyenge)" || words[1] == "(weak)")) {
                    weak = true
                }

                //search in the elective subject list
                var found = false;
                for (let j = 0; j < curriculum.compElectiveSubjects.length; j++) {
                    if (curriculum.compElectiveSubjects[j].code == words[0]) {
                        curriculum.compElectiveSubjects[i].pre.push({ subject: curriculum.compElectiveSubjects[j], weak: weak })
                        found = true
                        break
                    }
                }

                //search in the core subject list
                if (!found) {
                    for (let j = 0; j < curriculum.semesters.length && !found; j++)
                        for (let l = 0; l < curriculum.semesters[j].subjects.length; l++) {
                            if (curriculum.semesters[j].subjects[l].code == words[0]) {
                                curriculum.compElectiveSubjects[i].pre.push({ subject: curriculum.semesters[j].subjects[l], weak: weak })
                                found = true
                                break
                            }
                        }
                }

            })

            //separate the overlays of the subject
            var over_code = []
            if (resp[i]["Ráépülő"] != "") {
                over_code = resp[i]["Ráépülő"].split(",").map((str: string) => str.trim())
            }

            //find all the curriculums in the comp. elective curriculums list and add them as overlays
            over_code.forEach((code: string) => {
                for (let j = 0; j < curriculum.compElectiveSubjects.length; j++) {
                    if (curriculum.compElectiveSubjects[j].code == code) {
                        curriculum.compElectiveSubjects[i].over.push(curriculum.compElectiveSubjects[j])
                        break
                    }
                }
            })

        }

    }

    //#endregion
    
}
