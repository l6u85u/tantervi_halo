from django.http import JsonResponse
from . import input_handler

def response(request,path,index):
    inputHandler = input_handler.ExcelInputHandler(path,index)
    resp = inputHandler.convert_to_json()
    return JsonResponse(resp, safe=False, json_dumps_params={'ensure_ascii': False})