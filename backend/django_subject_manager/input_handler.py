import pandas as pd
import os
from django_subject_manager.settings import BASE_DIR

# Load Excel file into a DataFrame



def response_from_excel(relative_path,start_row_core,number_of_rows_core,start_row_spec,number_of_rows_spec,sheet_idx):
    file_path = os.path.join(BASE_DIR, relative_path)
    resp1 = from_excel(file_path,start_row_core,number_of_rows_core,sheet_idx)
    if (start_row_spec>-1):
        resp2 = from_excel(file_path,start_row_spec,number_of_rows_spec,sheet_idx)
        return resp1[:-1] + "," + resp2[1:]
    else:
        return resp1


def from_excel(file_path,start_row,number_of_rows,sheet_idx):
    df = pd.read_excel(file_path, skiprows=start_row, nrows=number_of_rows, sheet_name=sheet_idx)

    # Convert DataFrame to JSON
    json_data = df.to_json(orient='records', force_ascii=False)

    return json_data
