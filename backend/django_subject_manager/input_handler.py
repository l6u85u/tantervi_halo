import pandas as pd
import os
from django_subject_manager.settings import BASE_DIR
import json

# Load Excel file into a DataFrame



def response_from_excel(relative_path,start_row_core,number_of_rows_core,start_row_spec,number_of_rows_spec,sheet_idx):
    file_path = os.path.join(BASE_DIR, relative_path)
    resp1 = from_excel(file_path,start_row_core,number_of_rows_core,sheet_idx)
    if (start_row_spec>-1):
        resp2 = from_excel(file_path,start_row_spec,number_of_rows_spec,sheet_idx)
        resp = resp1[:-1] + "," + resp2[1:]
        json_list = json.loads(resp)
        prerequisit_handler(json_list)
        return json.dumps(json_list, ensure_ascii=False)
    else:
        json_list = json.loads(resp1)
        prerequisit_handler(json_list)
        return json.dumps(json_list, ensure_ascii=False)


def from_excel(file_path,start_row,number_of_rows,sheet_idx):
    df = pd.read_excel(file_path, skiprows=start_row, nrows=number_of_rows, sheet_name=sheet_idx)

    # Convert DataFrame to JSON
    json_data = df.to_json(orient='records', force_ascii=False)
    #prerequisit_handler(json_data)

    return json_data

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
            