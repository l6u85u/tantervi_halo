import unittest
from unittest.mock import patch
from input_handler import ExcelInputHandler  
import os
import logging
import pandas as pd
import json

logging.disable(logging.CRITICAL)

class TestExcelInputHandler(unittest.TestCase):

    #region Testing __get_start_and_end_row_indexes method

    def test_get_start_and_end_row_indexes_for_comp_subjects(self):
        start_indexes = [8,10,8,8,8]
        end_indexes = [34,36,34,34,32]

        for i in range (1,6):
            relative_file_path = 'django_subject_manager/test_input/input' + str(i) + '.xlsx'
            handler = ExcelInputHandler(relative_file_path, 0)
            start, end = handler._ExcelInputHandler__get_start_and_end_row_indexes("Törzsanyag", 0)
            self.assertEqual(start, start_indexes[i-1])  
            self.assertEqual(end, end_indexes[i-1])
    
    def test_get_start_and_end_row_indexes_for_comp_spec_subjects(self):
        start_indexes = [39,41,39,41,45]
        end_indexes = [58,60,54,59,59]

        for i in range (1,6):
            relative_file_path = 'django_subject_manager/test_input/input' + str(i) + '.xlsx'
            handler = ExcelInputHandler(relative_file_path, 0)
            start, end = handler._ExcelInputHandler__get_start_and_end_row_indexes("Specializáció kötelező tárgyai", 0)
            self.assertEqual(start, start_indexes[i-1])  
            self.assertEqual(end, end_indexes[i-1])
    
    def test_get_start_and_end_row_indexes_for_comp_elective_subjects(self):
        start_indexes = [62,64,58,64,65]
        end_indexes = [103,103,95,75,78]

        for i in range (1,6):
            relative_file_path = 'django_subject_manager/test_input/input' + str(i) + '.xlsx'
            handler = ExcelInputHandler(relative_file_path, 0)
            start, end = handler._ExcelInputHandler__get_start_and_end_row_indexes("Specializáció kötelezően választható tárgyai", 0)
            self.assertEqual(start, start_indexes[i-1])  
            self.assertEqual(end, end_indexes[i-1])
    
    def test_get_start_and_end_row_indexes_with_invalid_input(self):
        handler = ExcelInputHandler('django_subject_manager/test_input/invalid_input1.xlsx', 0)
        with self.assertRaises(Exception) as context:
            _ = handler._ExcelInputHandler__get_start_and_end_row_indexes("Törzsanyag", 0)
        self.assertTrue('Error: finding start cell' in str(context.exception))
    
    def test_get_start_and_end_row_indexes_with_invalid_file_path(self):
        handler = ExcelInputHandler('django_subject_manager/test_input/inv_input1.xlsx', 0)
        with self.assertRaises(Exception) as context:
            _ = handler._ExcelInputHandler__get_start_and_end_row_indexes("Törzsanyag", 0)
        self.assertTrue('Error: loading the Excel file' in str(context.exception))

    #endregion    
  
    #region Testing __refactor_english_curriculum_columns method
    
    def test_refactor_english_curriculum_columns(self):
        # making a sample DataFrame with English column names
        data = {
            'Code': [101, 102, 103],
            'Course': ['Math', 'Physics', 'Chemistry'],
            'Előfeltétel 1': ['None', '101', '102'],
            'Lecture (L)': [2, 3, 3],
            'Exam €': ['', '', ''],
            'Practice (Pr': [1, 1, 1],
            'Consultation': ['', '', ''],
            'Credit': [3, 3, 3],
            'Semester': [1, 2, 2],
            'Semester 1': ['','',''],
            'Semester 2': ['','',''],
            'Semester 3': ['','','']
        }

        input_df = pd.DataFrame(data)
        handler = ExcelInputHandler("", 0)
        output_df = handler._ExcelInputHandler__refactor_english_curriculum_columns(input_df)
        self.assertTrue('Kód' in output_df.columns)
        self.assertTrue('Tanegység' in output_df.columns)  
        self.assertTrue('Előfeltétel(ek)' in output_df.columns)  
        self.assertTrue('Kredit' in output_df.columns)  
        self.assertTrue('Ajánlott félév' in output_df.columns)  
        self.assertEqual(len(output_df.columns), 9)
        
    #endregion
    
    #region Testing __check_null_cells method

    def test_check_null_cells_with_invalid_input(self):
        # creating an  invalid DataFrame 
        data = {
            'Kód': ['C1', 'C2', 'C3'],
            'Tanegység': ['Subject1', 'Subject2', 'Subject3'],
            'Előfeltétel(ek)': ['None', None, 'C2'],
            'Előadás': [2, 3, 2],
            'Számonkérés': ['Written', 'Written', 'Oral'],
            'Practice Grade (PG)': [1, None, 2],  
            'Konzultáció': [None, 'Tuesday', 'Wednesday'],
            'Kredit': [3, 3, 3],
            'Ajánlott félév': [1, 2, 2]
        }

        df = pd.DataFrame(data)

        handler = ExcelInputHandler('test_input/invalid_input1.xlsx', 0)
        with self.assertRaises(Exception) as context:
            _ = handler._ExcelInputHandler__check_null_cells(df)
        self.assertTrue('Error: null cells' in str(context.exception))

    #endregion
    
    #region Testing __prerequisite_handler method

    def test_prerequisite_handler(self):
        input_json_data = [
            {"Kód": "C1", "Tanegység": "Subject1", "Előfeltétel(ek)": "None"},
            {"Kód": "C2", "Tanegység": "Subject2", "Előfeltétel(ek)": "C1"},
            {"Kód": "C3", "Tanegység": "Subject3", "Előfeltétel(ek)": "C2"},
            {"Kód": "C4", "Tanegység": "Subject4", "Előfeltétel(ek)": "C3"},
        ]
        
        handler = ExcelInputHandler('', 0)
        handler._ExcelInputHandler__prerequisite_handler(input_json_data)

        self.assertEqual(input_json_data[0]["Ráépülő"], "C2,C3,C4")
        self.assertEqual(input_json_data[1]["Ráépülő"], "C3,C4")
        self.assertEqual(input_json_data[2]["Ráépülő"], "C4")
        self.assertEqual(input_json_data[3]["Ráépülő"], "")

    #endregion

    #region Testing __get_json method

    def test_get_json_with_valid_input(self):
        handler = ExcelInputHandler('django_subject_manager/test_input/input1.xlsx', 0)
        result = handler._ExcelInputHandler__get_json(8,26,True)
        result = json.loads(result)
        s1 = result[0]
        s2 = result[25]
        self.assertEqual(s1["Kód"],"IP-18SZGREG")
        self.assertEqual(s1["Tanegység"],"Számítógépes rendszerek")
        self.assertEqual(s1["Kredit"],5)
        self.assertEqual(s1["Ajánlott félév"],'1')
        self.assertEqual(s1["Típus"],"Kötelező")
        self.assertEqual(s1["Ismeretkör"],"Informatika")

        self.assertEqual(s2["Kód"],"IP-18JIE")
        self.assertEqual(s2["Tanegység"],"Jogi ismeretek")
        self.assertEqual(s2["Kredit"],3)
        self.assertEqual(s2["Ajánlott félév"],'1,6')
        self.assertEqual(s2["Típus"],"Kötelező")
        self.assertEqual(s2["Ismeretkör"],"Egyéb")
    
    @patch('pandas.read_excel')
    def test_get_json_with_invalid_input(self,mock_read_excel):
        mock_read_excel.side_effect = Exception("Error: converting the Excel file to JSON: ")
        handler = ExcelInputHandler('django_subject_manager/test_input/input1.xlsx', 0)

        with self.assertRaises(Exception) as context:
            _ = handler._ExcelInputHandler__get_json(8,26,True)
        self.assertTrue("Error: converting the Excel file to JSON" in str(context.exception))

    #endregion
    
    #region Testing convert_to_json method

    def test_convert_to_json_with_valid_input(self):
        core_subject_nr = [45,45,41,44,38]
        elective_subject_nr = [41,39,37,11,13]

        for i in range (1,6):
            relative_file_path = 'django_subject_manager/test_input/input' + str(i) + '.xlsx'
            handler = ExcelInputHandler(relative_file_path, 0)
            resp = handler.convert_to_json()
            resp = json.loads(resp)
            self.assertEqual(len(resp[0]), core_subject_nr[i-1])  
            self.assertEqual(len(resp[1]), elective_subject_nr[i-1])
            os.remove(handler.get_json_file_path())

    def test_convert_to_json_with_invalid_file_indexes(self):
        handler = ExcelInputHandler('django_subject_manager/test_input/input1.xlsx', 0)
        with patch.object(ExcelInputHandler, '_ExcelInputHandler__get_start_and_end_row_indexes', side_effect=Exception("Error")) as obj_mock:
            resp = handler.convert_to_json()
            self.assertEqual(resp,"Error: can not get the Excel start cell and end cell indexes\nError")
    
    def test_convert_to_json_with_invalid_excel_input(self):
        handler = ExcelInputHandler('django_subject_manager/test_input/input1.xlsx', 0)
        with patch.object(ExcelInputHandler, '_ExcelInputHandler__get_json', side_effect=Exception("Error")) as obj_mock:
            resp = handler.convert_to_json()
            self.assertEqual(resp,"Error: invalid Excel input\nError")
    
    def test_convert_to_json_for_english_curriculum(self):
        core_subject_nr = 40
        elective_subject_nr = 11

        relative_file_path = 'django_subject_manager/test_input/input_angol.xlsx'
        handler = ExcelInputHandler(relative_file_path, 0)
        resp = handler.convert_to_json()
        resp = json.loads(resp)
        self.assertEqual(len(resp[0]), core_subject_nr)  
        self.assertEqual(len(resp[1]), elective_subject_nr)
        os.remove(handler.get_json_file_path())
    
    def test_convert_to_json_response_from_file(self):
        core_subject_nr = 40
        elective_subject_nr = 11

        relative_file_path = 'django_subject_manager/test_input/input_angol.xlsx'
        handler = ExcelInputHandler(relative_file_path, 0)
        self.assertEqual(os.path.exists(handler.get_json_file_path()), False)
        resp = handler.convert_to_json()
        self.assertEqual(os.path.exists(handler.get_json_file_path()), True)
        resp = handler.convert_to_json()
        resp = json.loads(resp)
        self.assertEqual(len(resp[0]), core_subject_nr)  
        self.assertEqual(len(resp[1]), elective_subject_nr)
        os.remove(handler.get_json_file_path())

    #endregion

    

if __name__ == '__main__':
    unittest.main()