import pandas as pd
from openpyxl import load_workbook
import os
from django_subject_manager.settings import BASE_DIR
import json

# Load Excel file into a DataFrame


def response_from_excel(relative_path,sheet_idx):
    core_name = ""
    spec_name = ""
    chosen_spec_name = ""

    if "angol.xlsx" in relative_path:
        core_name = "Computer Science BSc 2018 (in English, for Foreign students)"
        chosen_spec_name = "Electives:"
    else:
        core_name = "Törzsanyag"
        spec_name = "Specializáció kötelező tárgyai"
        chosen_spec_name = "Specializáció kötelezően választható tárgyai"
    
    file_path = os.path.join(BASE_DIR,relative_path)

    start_row_core,end_row_core = read_excel_rows(file_path, sheet_idx, core_name, 0)


    if spec_name != "":
        start_row_spec,end_row_spec = read_excel_rows(file_path, sheet_idx, spec_name, end_row_core)
        start_row_chosen_spec,end_row_chosen_spec = read_excel_rows(file_path, sheet_idx, chosen_spec_name, end_row_spec)
    else:
        start_row_chosen_spec,end_row_chosen_spec = read_excel_rows(file_path, sheet_idx, chosen_spec_name, end_row_core)

    resp = ""
    resp1 = from_excel(file_path,start_row_core ,end_row_core-start_row_core,sheet_idx,True)
    if (spec_name!=""):
        resp2 = from_excel(file_path,start_row_spec,end_row_spec-start_row_spec,sheet_idx,True)
        resp3 = from_excel(file_path,start_row_chosen_spec,end_row_chosen_spec-start_row_chosen_spec,sheet_idx,False)
        resp = "[" + resp1[:-1] + "," + resp2[1:] + "," + resp3 + "]"
    else:
        resp3 = from_excel(file_path,start_row_chosen_spec,end_row_chosen_spec-start_row_chosen_spec,sheet_idx,False)
        resp = "[" + resp1 + "," + resp3 + "]"
    json_list = json.loads(resp)
    prerequisit_handler(json_list[0])
    prerequisit_handler(json_list[1])
    return json.dumps(json_list, ensure_ascii=False)

def read_excel_rows(file_path, sheet_idx, start_cell, start_row_idx):
    # Load the Excel workbook
    wb = load_workbook(filename=file_path)
    
    # Select the active worksheet
    ws = wb.worksheets[sheet_idx]

    # Find the starting cell ("Subjects") and its row index
    subject_row_index = -1
    for row in ws.iter_rows(min_row=start_row_idx , max_col=2, max_row=ws.max_row):
        for cell in row:
            if cell.value == start_cell:
                subject_row_index = cell.row
                break
        else:
            continue
        break

    # Find the index of the first empty row after the "Subjects" cell
    empty_row_index = None

    row_cont = subject_row_index + 1
    while ws[row_cont][0].value is None:
        row_cont += 1
    
    for row in ws.iter_rows(min_row=row_cont, max_col=1, max_row=ws.max_row):
        if row[0].value is None:
            empty_row_index = row[0].row
            break

    return row_cont - 1, empty_row_index - 2


def from_excel(file_path,start_row,number_of_rows,sheet_idx, obligatory):
    df = pd.read_excel(file_path, skiprows=start_row, nrows=number_of_rows, sheet_name=sheet_idx)

    # Convert DataFrame to JSON
    json_data = df.to_json(orient='records', force_ascii=False)
    json_list = json.loads(json_data)
    #prerequisit_handler(json_data)
    
    if obligatory:
        for data in json_list:
            data["Típus"] = "Kötelező"
    else:
        for data in json_list:
            data["Típus"] = "Kötelezően választható"
    
    if "angol" not in file_path:
        for data in json_list:
                if "inf" in data["Ismeretkör"].lower():
                    data["Ismeretkör"] = "Informatika"
                elif "szám" in data["Ismeretkör"].lower():
                    data["Ismeretkör"] = "Számítástudomány"
                elif "mat" in data["Ismeretkör"].lower():
                    data["Ismeretkör"] = "Matematika"

    return json.dumps(json_list, ensure_ascii=False)

def prerequisit_handler(json_data):
    for data in json_data:
       data["Ráépülő"] = ""
      
    for data in json_data:
       next_subject_adder(data, data, json_data)
    
    for data in json_data:
        if data["Ráépülő"].endswith(','):
            data["Ráépülő"] = data["Ráépülő"][:-1]


def next_subject_adder(data, curr_data, json_data):
    pre = []
    if (curr_data["Előfeltétel(ek)"] is not None):
        words = [word.strip() for word in curr_data["Előfeltétel(ek)"].split(",")]

        pre = [word.split(" ")[0] for word in words]
        for p in pre:
            for d in json_data:
                if d["Kód"] == p:
                    d["Ráépülő"] += data["Kód"].strip() + ","
                    next_subject_adder(data, d, json_data)
                    break

