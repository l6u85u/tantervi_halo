import pandas as pd
from openpyxl import load_workbook
import os
import logging
from django_subject_manager.settings import BASE_DIR
import json

logger = logging.getLogger("info_logger")

class ExcelInputHandler:

    #region Constructor

    def __init__(self,relative_path,index):
        self.__file_path = os.path.join(BASE_DIR,relative_path) 
        self.__sheet_index = index #the sheet index in the Excel file

    #endregion
    
    #region Getters and Setters

    def get_file_path(self):
        return self.__file_path
    
    def set_file_path(self,relative_path):
        self.__file_path = os.path.join(BASE_DIR,relative_path) 
    
    def get_sheet_index(self):
        return self.__sheet_index
    
    def set_sheet_index(self,index):
        self.__sheet_index = index

    #endregion

    #region Public Methods

    def convert_to_json(self):
        core_name = ""
        spec_name = ""
        elective_name = ""

        if "angol.xlsx" in self.__file_path:
            core_name = "Computer Science BSc 2018 (in English, for Foreign students)"
            elective_name = "Electives:"
        else:
            core_name = "Törzsanyag"
            spec_name = "Specializáció kötelező tárgyai"
            elective_name = "Specializáció kötelezően választható tárgyai"
        
        #we get the start and end index of the rows where the subjects are (core,spec and elective)
        try:
            start_row_core,end_row_core = self.__get_start_and_end_row_indexes(core_name, 0) #for the core subjects

            if spec_name != "": #in the English curriculum the core and the spec subjects are not differentiated
                start_row_spec,end_row_spec = self.__get_start_and_end_row_indexes(spec_name, end_row_core)
                start_row_elective,end_row_elective = self.__get_start_and_end_row_indexes(elective_name, end_row_spec)
            else:
                start_row_elective,end_row_elective = self.__get_start_and_end_row_indexes(elective_name, end_row_core)
        
        except Exception as e:
            logger.info("Can not get the Excel start cell and end cell indexes\n" + str(e))
            return "Error: can not get the Excel start cell and end cell indexes\n" + str(e)

        #a json array is created with the core + spec and elective subjects
        try:
            resp = ""
            resp1 = self.__get_json(start_row_core ,end_row_core-start_row_core,True)
            if (spec_name!=""): #if it is not the English curriculum
                resp2 = self.__get_json(start_row_spec,end_row_spec-start_row_spec,True)
                resp3 = self.__get_json(start_row_elective,end_row_elective-start_row_elective,False)
                resp = "[" + resp1[:-1] + "," + resp2[1:] + "," + resp3 + "]"
            else:
                resp3 = self.__get_json(start_row_elective,end_row_elective-start_row_elective,False)
                resp = "[" + resp1 + "," + resp3 + "]"
            
        except Exception as e:
            logger.info("Error: invalid Excel input\n" + str(e))
            return "Error: invalid Excel input\n" + str(e)

        subject_list = json.loads(resp) #convert to python object

        #overlay subjects are added to each subjects based on the prerequisites
        self.__prerequisite_handler(subject_list[0])
        self.__prerequisite_handler(subject_list[1])

        return json.dumps(subject_list, ensure_ascii=False)

    #endregion

    #region Private Methods

    def __get_start_and_end_row_indexes(self, start_cell, start_row_idx):
        try:
            # load the Excel workbook
            wb = load_workbook(filename=self.__file_path)
            # select the active worksheet
            ws = wb.worksheets[self.__sheet_index]
        except:
            logger.info("Can not load the Excel file")
            raise Exception("Error loading the file")
       
           
        # find the starting cell and its row index
        subject_row_index = -1
        for row in ws.iter_rows(min_row=start_row_idx , max_col=2, max_row=ws.max_row):
            for cell in row:
                if start_cell == cell.value:
                    subject_row_index = cell.row
                    break
            else:
                continue
            break

        if subject_row_index == -1:
            raise Exception("Error finding start cell index")         

        #skip the empty rows 
        first_subject_row_index = subject_row_index + 1
        while ws[first_subject_row_index][0].value is None:
            first_subject_row_index += 1

        # find the index of the first empty row after the starting cell
        empty_row_index = -1  
        
        for row in ws.iter_rows(min_row=first_subject_row_index, max_col=1, max_row=ws.max_row):
            if row[0].value is None:
                empty_row_index = row[0].row
                break
        
        if empty_row_index == -1:
            raise Exception("Error finding end cell index")
        

        return first_subject_row_index - 1, empty_row_index - 2

    def __refactor_english_curriculum_columns(self, df):
        if "Code" in df.columns:
            df = df.rename(columns={'Code': 'Kód'})
        if "Course" in df.columns:
            df = df.rename(columns={'Course': 'Tanegység'})
        if "Előfeltétel 1" in df.columns:
            df = df.rename(columns={'Előfeltétel 1': 'Előfeltétel(ek)'})
        if "Lecture (L)" in df.columns:
            df = df.rename(columns={'Lecture (L)': 'Előadás'})
        if "Exam €" in df.columns:
            df = df.rename(columns={'Exam €': 'Számonkérés'})
        if "Practice (Pr" in df.columns:
            df = df.rename(columns={'Practice (Pr': 'Gyakorlat'})
        if "Consultation" in df.columns:
            df = df.rename(columns={'Consultation': 'Konzultáció'})
        if "Credit" in df.columns:
            df = df.rename(columns={'Credit': 'Kredit'})
        if "Semester" in df.columns:
            df = df.rename(columns={'Semester': 'Ajánlott félév'})
        columns_to_keep = [col for col in df.columns if 'Semester' not in col]
        df = df[columns_to_keep]
        return df

    def __get_json(self,start_row,number_of_rows, obligatory):
        try:
            #convert Excel to DataFrame
            df = pd.read_excel(self.__file_path, skiprows=start_row, nrows=number_of_rows, sheet_name=self.__sheet_index)
            df = self.__refactor_english_curriculum_columns(df)

            #remove the unnecesary columns from the DataFrame
            columns_to_keep = [col for col in df.columns if ('félév' not in col or 'Ajánlott' in col) and 'Unnamed' not in col]
            df = df[columns_to_keep]

            # convert DataFrame to JSON
            json_data = df.to_json(orient='records', force_ascii=False)
            json_list = json.loads(json_data)
        except Exception as e:
            raise Exception("Error converting the Excel file to JSON: " + str(e))
        
        self.__check_null_cells(df)
            
        if obligatory:
            for data in json_list:
                data["Típus"] = "Kötelező"
        else:
            for data in json_list:
                data["Típus"] = "Kötelezően választható"
        
        #renaming the "Ismeretkor" cells
        for data in json_list:
            if "Ismeretkör" in data:
                if "inf" in data["Ismeretkör"].lower():
                    data["Ismeretkör"] = "Informatika"
                elif "szám" in data["Ismeretkör"].lower():
                    data["Ismeretkör"] = "Számítástudomány"
                elif "mat" in data["Ismeretkör"].lower():
                    data["Ismeretkör"] = "Matematika"
            else:
                data["Ismeretkör"] = ""

            #check if Ajanlott felev cell is correct
            if "Ajánlott félév" in data:
                data["Ajánlott félév"] = str(data["Ajánlott félév"]).replace('.',',')

        return json.dumps(json_list, ensure_ascii=False)

    def __check_null_cells(self,df):
        for column in df.columns:
            if column!="Előfeltétel(ek)" and column!="Számonkérés" and column!="Practice Grade (PG)" and df[column].isnull().any():
                raise Exception("Error: null cells in the " + column + " column")

    def __prerequisite_handler(self,json_data):
        #adds a new attribute to the subjects which will contain the overlay subjects
        for data in json_data:
            data["Ráépülő"] = ""
        
        for data in json_data:
            self.__next_subject_adder(data, data, json_data)
        
        for data in json_data:
            if data["Ráépülő"].endswith(','):
                data["Ráépülő"] = data["Ráépülő"][:-1]

    def __next_subject_adder(self,data, current_data, json_data):
        #recursively creates overlays for the subject by going through the prerequisites
        pre = []
        if ("Előfeltétel(ek)" in current_data and current_data["Előfeltétel(ek)"] is not None):
            words = [word.strip() for word in current_data["Előfeltétel(ek)"].split(",")]

            #string array which contains the prerequisites
            pre = [word.split(" ")[0] for word in words] 
            for p in pre:
                for d in json_data:
                    if "Kód" in d and d["Kód"] == p:
                        d["Ráépülő"] += data["Kód"].strip() + ","
                        self.__next_subject_adder(data, d, json_data)
                        break

    #endregion